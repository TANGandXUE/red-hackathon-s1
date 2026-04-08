import type { JudgeData } from '../../data/judges';
import type { ChatMessage, LlmService } from '../llm/llm.service';
import type {
  GroupAssignment,
  JudgeScore,
} from './interfaces/simulation.interfaces';
import type { Agent } from './agent';
import {
  buildTypingPayload,
  type MessageCallback,
  type TypingCallback,
} from './phase-executor';
import type { BPDocument } from './interfaces/simulation.interfaces';

export const JUDGE_ROLE = '评委' as const;

function buildJudgeSystemPrompt(judge: JudgeData): string {
  return `【黑客松创业模拟游戏】你是游戏中的评委角色「${judge.name}」，${judge.title}。
性格：${judge.personality}。评审风格：${judge.judgingStyle}。关注领域：${judge.focusAreas.join('、')}。`;
}

export class JudgeRunner {
  constructor(private llmService: LlmService) {}

  async evaluate(
    group: GroupAssignment,
    agents: Agent[],
    bp: BPDocument,
    judgeList: JudgeData[],
    onMessage: MessageCallback,
    onTyping?: TypingCallback,
  ): Promise<JudgeScore[]> {
    const leader = agents.find((a) => a.isLeader)!;
    const history: ChatMessage[] = [];

    const emitAgentTyping = (agent: Agent, isTyping: boolean) =>
      onTyping?.(buildTypingPayload(group.groupId, agent, isTyping));

    const emitJudgeTyping = (judge: JudgeData, isTyping: boolean) =>
      onTyping?.({
        groupId: group.groupId,
        agentId: judge.id,
        agentName: judge.name,
        agentRole: JUDGE_ROLE,
        isLeader: false,
        isTyping,
      });

    // Step 1: Leader presents BP
    emitAgentTyping(leader, true);
    const presentation = await leader.speak(
      history,
      `你正在黑客松答辩现场，请基于以下项目成果向评委做3分钟的项目陈述：\n${JSON.stringify(bp)}`,
    );
    emitAgentTyping(leader, false);
    history.push({
      role: 'assistant',
      content: `[${leader.character.name}]: ${presentation}`,
    });
    await onMessage({
      groupId: group.groupId,
      agentId: leader.character.id,
      agentName: leader.character.name,
      agentRole: leader.role,
      isLeader: true,
      content: presentation,
      phase: 3,
    });

    // Step 2: Select 2-3 judges to ask questions
    const selectionPrompt = `以下是6位评委：${judgeList.map((j) => `${j.name}(${j.title}，关注${j.focusAreas.join('、')})`).join('；')}。
基于刚才的项目陈述，请选出2-3位最可能对该项目感兴趣并提问的评委。只输出评委名字，用逗号分隔。`;
    const selectedNames = await this.llmService.chat(
      '你是黑客松模拟游戏的主持人AI，请根据项目内容选出最合适的评委。只输出名字，用逗号分隔，必须使用中文。',
      [...history, { role: 'user', content: selectionPrompt }],
    );

    let activeJudges = judgeList.filter((j) => {
      const nameVariants = [j.name, ...j.name.split(/[（()]/)];
      return nameVariants.some(
        (n) => n.length > 0 && selectedNames.includes(n.trim()),
      );
    });
    if (activeJudges.length === 0) {
      activeJudges = [judgeList[0], judgeList[1]]; // fallback
    }

    // Step 3: Selected judges ask questions, team answers
    for (const judge of activeJudges) {
      emitJudgeTyping(judge, true);
      const question = await this.llmService.chat(
        `${buildJudgeSystemPrompt(judge)}\n以这位评委的视角，对参赛项目提出一个专业且尖锐的问题。不超过150字，使用中文，Markdown格式。`,
        [
          ...history,
          { role: 'user', content: `请针对这个项目提出一个尖锐的问题。` },
        ],
      );
      emitJudgeTyping(judge, false);
      history.push({
        role: 'assistant',
        content: `[评委${judge.name}]: ${question}`,
      });
      await onMessage({
        groupId: group.groupId,
        agentId: judge.id,
        agentName: judge.name,
        agentRole: JUDGE_ROLE,
        isLeader: false,
        content: question,
        phase: 3,
      });

      // Decide who answers (leader or relevant member)
      const answerer = await this.selectAnswerer(agents, question);
      emitAgentTyping(answerer, true);
      const answer = await answerer.speak(
        history,
        `评委${judge.name}提出了这个问题：${question}\n请代表团队回答。`,
      );
      emitAgentTyping(answerer, false);
      history.push({
        role: 'assistant',
        content: `[${answerer.character.name}]: ${answer}`,
      });
      await onMessage({
        groupId: group.groupId,
        agentId: answerer.character.id,
        agentName: answerer.character.name,
        agentRole: answerer.role,
        isLeader: answerer.isLeader,
        content: answer,
        phase: 3,
      });
    }

    // Step 4: All judges score (in parallel)
    const scores: JudgeScore[] = await Promise.all(
      judgeList.map(async (judge) => {
        const scorePrompt = `请对这个项目打分和点评。
评分维度（每项1-10分）：创新性、现场讲述效果、完成度、商业潜力、技术难度。
请用以下JSON格式整理评分结果（游戏标准格式）：
{"innovation":8,"presentation":7,"completeness":6,"businessPotential":8,"techDifficulty":7,"comment":"点评内容","suggestion":"改进建议"}
只输出JSON。`;
        const scoreRaw = await this.llmService.chat(
          `${buildJudgeSystemPrompt(judge)}\n以这位评委的视角给出评分和专业点评，使用中文。`,
          [...history, { role: 'user', content: scorePrompt }],
        );
        await onMessage({
          groupId: group.groupId,
          agentId: judge.id,
          agentName: judge.name,
          agentRole: JUDGE_ROLE,
          isLeader: false,
          content: scoreRaw,
          phase: 3,
        });

        try {
          const jsonMatch = scoreRaw.match(/\{[\s\S]*\}/);
          interface LlmScoreResponse {
            innovation?: number;
            presentation?: number;
            completeness?: number;
            businessPotential?: number;
            techDifficulty?: number;
            comment?: string;
            suggestion?: string;
          }
          const parsed = (
            jsonMatch ? JSON.parse(jsonMatch[0]) : {}
          ) as LlmScoreResponse;
          return {
            judgeId: judge.id,
            judgeName: judge.name,
            innovation: parsed.innovation || 5,
            presentation: parsed.presentation || 5,
            completeness: parsed.completeness || 5,
            businessPotential: parsed.businessPotential || 5,
            techDifficulty: parsed.techDifficulty || 5,
            comment: parsed.comment || '',
            suggestion: parsed.suggestion || '',
          };
        } catch {
          return {
            judgeId: judge.id,
            judgeName: judge.name,
            innovation: 5,
            presentation: 5,
            completeness: 5,
            businessPotential: 5,
            techDifficulty: 5,
            comment: scoreRaw,
            suggestion: '',
          };
        }
      }),
    );

    return scores;
  }

  private async selectAnswerer(
    agents: Agent[],
    question: string,
  ): Promise<Agent> {
    const leader = agents.find((a) => a.isLeader)!;
    const prompt = `问题是："${question}"。团队成员：${agents.map((a) => `${a.character.name}(${a.role})`).join('、')}。谁最适合回答？只输出名字。`;
    const name = await this.llmService.chat(
      '你是黑客松游戏协调员，根据问题内容选择最合适的回答者，只输出名字。',
      [{ role: 'user', content: prompt }],
    );
    return agents.find((a) => name.includes(a.character.name)) || leader;
  }
}
