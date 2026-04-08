import type { JudgeData } from '../../data/judges';
import type { ChatMessage, LlmService } from '../llm/llm.service';
import type {
  GroupAssignment,
  JudgeScore,
} from './interfaces/simulation.interfaces';
import type { Agent } from './agent';
import type { MessageCallback } from './phase-executor';
import type { BPDocument } from './interfaces/simulation.interfaces';

export class JudgeRunner {
  constructor(private llmService: LlmService) {}

  async evaluate(
    group: GroupAssignment,
    agents: Agent[],
    bp: BPDocument,
    judgeList: JudgeData[],
    onMessage: MessageCallback,
  ): Promise<JudgeScore[]> {
    const leader = agents.find((a) => a.isLeader)!;
    const history: ChatMessage[] = [];

    // Step 1: Leader presents BP
    const presentation = await leader.speak(
      history,
      `你正在黑客松答辩现场，请基于以下BP向评委做3分钟的项目陈述：\n${JSON.stringify(bp, null, 2)}`,
    );
    history.push({
      role: 'assistant',
      content: `[${leader.character.name}]: ${presentation}`,
    });
    onMessage({
      groupId: group.groupId,
      agentId: leader.character.id,
      agentName: leader.character.name,
      agentRole: 'leader',
      content: presentation,
      phase: 3,
    });

    // Step 2: Select 2-3 judges to ask questions
    const selectionPrompt = `以下是6位评委：${judgeList.map((j) => `${j.name}(${j.title}，关注${j.focusAreas.join('、')})`).join('；')}。
基于刚才的项目陈述，请选出2-3位最可能对该项目感兴趣并提问的评委。只输出评委名字，用逗号分隔。`;
    const selectedNames = await this.llmService.chat(
      '你是一个黑客松主持人。',
      [...history, { role: 'user', content: selectionPrompt }],
    );

    let activeJudges = judgeList.filter((j) =>
      selectedNames.includes(j.name),
    );
    if (activeJudges.length === 0) {
      activeJudges = [judgeList[0], judgeList[1]]; // fallback
    }

    // Step 3: Selected judges ask questions, team answers
    for (const judge of activeJudges) {
      const question = await this.llmService.chat(
        `你是${judge.name}，${judge.title}。${judge.personality}。你的评审风格：${judge.judgingStyle}。`,
        [
          ...history,
          { role: 'user', content: `请针对这个项目提出一个尖锐的问题。` },
        ],
      );
      history.push({
        role: 'assistant',
        content: `[评委${judge.name}]: ${question}`,
      });
      onMessage({
        groupId: group.groupId,
        agentId: judge.id,
        agentName: judge.name,
        agentRole: 'judge',
        content: question,
        phase: 3,
      });

      // Decide who answers (leader or relevant member)
      const answerer = await this.selectAnswerer(agents, question, history);
      const answer = await answerer.speak(
        history,
        `评委${judge.name}问了这个问题：${question}\n请回答。`,
      );
      history.push({
        role: 'assistant',
        content: `[${answerer.character.name}]: ${answer}`,
      });
      onMessage({
        groupId: group.groupId,
        agentId: answerer.character.id,
        agentName: answerer.character.name,
        agentRole: answerer.role,
        content: answer,
        phase: 3,
      });
    }

    // Step 4: All judges score
    const scores: JudgeScore[] = [];
    for (const judge of judgeList) {
      const scorePrompt = `你是${judge.name}，${judge.title}。请对这个项目打分和点评。
评分维度（每项1-10分）：创新性、现场讲述效果、完成度、商业潜力、技术难度。
请严格按以下JSON格式输出：
{"innovation":8,"presentation":7,"completeness":6,"businessPotential":8,"techDifficulty":7,"comment":"点评内容","suggestion":"改进建议"}
只输出JSON。`;
      const scoreRaw = await this.llmService.chat(
        `你是${judge.name}，${judge.title}。${judge.personality}。评审风格：${judge.judgingStyle}。关注：${judge.focusAreas.join('、')}。`,
        [...history, { role: 'user', content: scorePrompt }],
      );
      onMessage({
        groupId: group.groupId,
        agentId: judge.id,
        agentName: judge.name,
        agentRole: 'judge',
        content: scoreRaw,
        phase: 3,
      });

      try {
        const jsonMatch = scoreRaw.match(/\{[\s\S]*\}/);
        const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
        scores.push({
          judgeId: judge.id,
          judgeName: judge.name,
          innovation: parsed.innovation || 5,
          presentation: parsed.presentation || 5,
          completeness: parsed.completeness || 5,
          businessPotential: parsed.businessPotential || 5,
          techDifficulty: parsed.techDifficulty || 5,
          comment: parsed.comment || '',
          suggestion: parsed.suggestion || '',
        });
      } catch {
        scores.push({
          judgeId: judge.id,
          judgeName: judge.name,
          innovation: 5,
          presentation: 5,
          completeness: 5,
          businessPotential: 5,
          techDifficulty: 5,
          comment: scoreRaw,
          suggestion: '',
        });
      }
    }

    return scores;
  }

  private async selectAnswerer(
    agents: Agent[],
    question: string,
    history: ChatMessage[],
  ): Promise<Agent> {
    const leader = agents.find((a) => a.isLeader)!;
    const prompt = `问题是："${question}"。团队成员：${agents.map((a) => `${a.character.name}(${a.role})`).join('、')}。谁最适合回答？只输出名字。`;
    const name = await this.llmService.chat('你是一个协调员。', [
      { role: 'user', content: prompt },
    ]);
    return agents.find((a) => name.includes(a.character.name)) || leader;
  }
}
