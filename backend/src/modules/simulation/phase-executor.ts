import type { CharacterData } from '../../data/characters';
import type { ChatMessage, LlmService } from '../llm/llm.service';
import type { SearchService } from '../search/search.service';
import type {
  GroupAssignment,
  BPDocument,
  HackathonRole,
} from './interfaces/simulation.interfaces';
import { Agent } from './agent';

/** Shared identity fields for agent events */
export interface AgentIdentity {
  groupId: number;
  agentId: string;
  agentName: string;
  agentRole: string;
  isLeader: boolean;
}

export type MessageCallback = (
  msg: AgentIdentity & { content: string; phase: number },
) => Promise<void>;

export type TypingCallback = (
  msg: AgentIdentity & { isTyping: boolean },
) => void;

export type ToolCallCallback = (
  msg: Pick<AgentIdentity, 'groupId' | 'agentId' | 'agentName'> & {
    toolName: string;
    toolInput: string;
    status: 'calling' | 'completed';
  },
) => void;

/** Build a typing event payload from an Agent */
export function buildTypingPayload(
  groupId: number,
  agent: Agent,
  isTyping: boolean,
): AgentIdentity & { isTyping: boolean } {
  return {
    groupId,
    agentId: agent.character.id,
    agentName: agent.character.name,
    agentRole: agent.role,
    isLeader: agent.isLeader,
    isTyping,
  };
}

/** Build a per-agent tool call callback */
export function buildToolCallCb(
  groupId: number,
  agent: Agent,
  onToolCall?: ToolCallCallback,
): (
  toolName: string,
  toolInput: string,
  status: 'calling' | 'completed',
) => void {
  return (toolName, toolInput, status) =>
    onToolCall?.({
      groupId,
      agentId: agent.character.id,
      agentName: agent.character.name,
      toolName,
      toolInput,
      status,
    });
}

export class PhaseExecutor {
  constructor(
    private llmService: LlmService,
    private searchService: SearchService,
  ) {}

  // Phase 0: Algorithm-based grouping (NO LLM calls)
  executePhase0(
    allCharacters: CharacterData[],
    ideas: string[],
    groupCount = 4,
  ): GroupAssignment[] {
    const leaderTypes = new Set(['ENTJ', 'ENFJ', 'ESTJ', 'ESTP', 'ENTP']);
    const backendTypes = new Set(['INTJ', 'INTP', 'ISTJ', 'ISTP']);
    const designerTypes = new Set(['ISFP', 'INFP', 'INFJ']);
    const marketingTypes = new Set(['ENFP', 'ESFP', 'ESFJ']);

    // Assign roles based on personality traits
    const withRoles: {
      character: CharacterData;
      role: HackathonRole;
      leaderScore: number;
    }[] = allCharacters.map((c) => {
      const primaryType = c.personality[0] || '';
      let role: HackathonRole = '运营';
      let leaderScore = 0;

      if (leaderTypes.has(primaryType)) {
        leaderScore = 3;
      }
      if (c.personality.some((p) => leaderTypes.has(p))) {
        leaderScore = Math.max(leaderScore, 2);
      }

      if (backendTypes.has(primaryType)) {
        role = '后端工程师';
      } else if (designerTypes.has(primaryType)) {
        role = '设计师';
      } else if (marketingTypes.has(primaryType)) {
        role = '运营';
      } else if (primaryType.startsWith('E') || primaryType === 'ISFJ') {
        role = '产品经理';
      } else {
        role = '前端工程师';
      }

      return { character: c, role, leaderScore };
    });

    // Shuffle
    for (let i = withRoles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [withRoles[i], withRoles[j]] = [withRoles[j], withRoles[i]];
    }

    // Split into groups
    const groups: GroupAssignment[] = [];
    const groupSize = Math.floor(withRoles.length / groupCount);

    for (let g = 0; g < groupCount; g++) {
      const start = g * groupSize;
      const end = g === groupCount - 1 ? withRoles.length : start + groupSize;
      const groupMembers = withRoles.slice(start, end);

      // Select leader (highest leaderScore)
      groupMembers.sort((a, b) => b.leaderScore - a.leaderScore);

      // Assign idea: distribute across groups
      const ideaIndex = Math.min(g, ideas.length - 1);

      groups.push({
        groupId: g + 1,
        idea: ideas[ideaIndex],
        members: groupMembers.map((m, idx) => ({
          characterId: m.character.id,
          role: idx === 0 ? '产品经理' : m.role,
          isLeader: idx === 0,
        })),
      });
    }

    return groups;
  }

  // Phase 1: Free Discussion
  async executePhase1(
    agents: Agent[],
    groupId: number,
    idea: string,
    onMessage: MessageCallback,
    onTyping?: TypingCallback,
    onToolCall?: ToolCallCallback,
  ): Promise<void> {
    const history: ChatMessage[] = [];
    const leader = agents.find((a) => a.isLeader)!;
    const members = agents.filter((a) => !a.isLeader);

    const emitTyping = (agent: Agent, isTyping: boolean) =>
      onTyping?.(buildTypingPayload(groupId, agent, isTyping));

    const makeToolCb = (agent: Agent) =>
      buildToolCallCb(groupId, agent, onToolCall);

    // Step 1: Leader presents idea and proposes direction
    emitTyping(leader, true);
    const leaderOpening = await leader.speak(
      history,
      `你是本组队长。收到的黑客松主题是："${idea}"。请提出你对这个主题的理解和初步方向。`,
    );
    emitTyping(leader, false);
    history.push({
      role: 'assistant',
      content: `[${leader.character.name}]: ${leaderOpening}`,
    });
    await onMessage({
      groupId,
      agentId: leader.character.id,
      agentName: leader.character.name,
      agentRole: leader.role,
      isLeader: true,
      content: leaderOpening,
      phase: 1,
    });

    // Step 2: Each member asks one question (round-robin)
    for (const member of members) {
      emitTyping(member, true);
      const question = await member.speak(
        history,
        `队长刚才提出了方向，请你从${member.role}的角度提出一个问题或看法。`,
      );
      emitTyping(member, false);
      history.push({
        role: 'assistant',
        content: `[${member.character.name}]: ${question}`,
      });
      await onMessage({
        groupId,
        agentId: member.character.id,
        agentName: member.character.name,
        agentRole: member.role,
        isLeader: false,
        content: question,
        phase: 1,
      });
    }

    // Step 3: Free discussion - each person picks 1-2 questions to answer
    for (const agent of agents) {
      emitTyping(agent, true);
      const response = await agent.speak(
        history,
        `请选择之前讨论中的1-2个问题进行回答或补充你的看法。如果需要搜索市场数据，请用 [SEARCH:搜索关键词] 格式。`,
        makeToolCb(agent),
      );
      emitTyping(agent, false);
      history.push({
        role: 'assistant',
        content: `[${agent.character.name}]: ${response}`,
      });
      await onMessage({
        groupId,
        agentId: agent.character.id,
        agentName: agent.character.name,
        agentRole: agent.role,
        isLeader: agent.isLeader,
        content: response,
        phase: 1,
      });
    }

    // Step 4: Leader summarizes and decides direction
    emitTyping(leader, true);
    const summary = await leader.speak(
      history,
      `作为队长，请分析以上所有讨论，总结出最终的选题和产品方向。请明确给出：1.产品名称 2.核心问题 3.解决方案方向`,
    );
    emitTyping(leader, false);
    history.push({
      role: 'assistant',
      content: `[${leader.character.name}]: ${summary}`,
    });
    await onMessage({
      groupId,
      agentId: leader.character.id,
      agentName: leader.character.name,
      agentRole: leader.role,
      isLeader: true,
      content: summary,
      phase: 1,
    });
  }

  // Phase 2: Create Product
  async executePhase2(
    agents: Agent[],
    groupId: number,
    phase1Summary: string,
    onMessage: MessageCallback,
    onTyping?: TypingCallback,
    onToolCall?: ToolCallCallback,
  ): Promise<BPDocument> {
    const history: ChatMessage[] = [
      { role: 'assistant', content: `[阶段1总结]: ${phase1Summary}` },
    ];
    const leader = agents.find((a) => a.isLeader)!;
    const members = agents.filter((a) => !a.isLeader);

    const emitTyping = (agent: Agent, isTyping: boolean) =>
      onTyping?.(buildTypingPayload(groupId, agent, isTyping));

    const makeToolCb = (agent: Agent) =>
      buildToolCallCb(groupId, agent, onToolCall);

    // Step 1: Leader assigns tasks
    emitTyping(leader, true);
    const assignment = await leader.speak(
      history,
      `基于阶段1确定的方向，请给每个组员分配具体的BP撰写任务。组员岗位：${members.map((m) => `${m.character.name}(${m.role})`).join('、')}。BP需要包含：项目名称、问题与痛点、解决方案、目标用户、核心功能、商业模式、竞争优势。`,
    );
    emitTyping(leader, false);
    history.push({
      role: 'assistant',
      content: `[${leader.character.name}]: ${assignment}`,
    });
    await onMessage({
      groupId,
      agentId: leader.character.id,
      agentName: leader.character.name,
      agentRole: leader.role,
      isLeader: true,
      content: assignment,
      phase: 2,
    });

    // Step 2: Members confirm/ask questions
    for (const member of members) {
      emitTyping(member, true);
      const confirm = await member.speak(
        history,
        `队长分配了任务，请确认你的任务理解或提出疑问。`,
      );
      emitTyping(member, false);
      history.push({
        role: 'assistant',
        content: `[${member.character.name}]: ${confirm}`,
      });
      await onMessage({
        groupId,
        agentId: member.character.id,
        agentName: member.character.name,
        agentRole: member.role,
        isLeader: false,
        content: confirm,
        phase: 2,
      });
    }

    // Step 3: Each member writes their section (can search)
    for (const member of members) {
      emitTyping(member, true);
      const section = await member.speak(
        history,
        `现在请撰写你负责的BP板块内容。要求详实、有数据支撑。如果需要市场数据，请用 [SEARCH:关键词] 格式搜索。`,
        makeToolCb(member),
      );
      emitTyping(member, false);
      history.push({
        role: 'assistant',
        content: `[${member.character.name}]: ${section}`,
      });
      await onMessage({
        groupId,
        agentId: member.character.id,
        agentName: member.character.name,
        agentRole: member.role,
        isLeader: false,
        content: section,
        phase: 2,
      });
    }

    // Step 4: Leader consolidates into BP document
    emitTyping(leader, true);
    const bpRaw = await leader.speak(
      history,
      `请将团队讨论的创业项目成果，用以下JSON结构整理成文档（这是游戏的标准输出格式）：
{"projectName":"项目名","problem":"问题与痛点","solution":"解决方案","targetUsers":"目标用户","features":"核心功能","businessModel":"商业模式","advantage":"竞争优势"}
请只输出JSON内容，不加其他说明。`,
    );
    emitTyping(leader, false);
    await onMessage({
      groupId,
      agentId: leader.character.id,
      agentName: leader.character.name,
      agentRole: leader.role,
      isLeader: true,
      content: bpRaw,
      phase: 2,
    });

    // Parse BP document
    try {
      const jsonMatch = bpRaw.match(/\{[\s\S]*\}/);
      return jsonMatch
        ? (JSON.parse(jsonMatch[0]) as BPDocument)
        : this.fallbackBP(bpRaw);
    } catch {
      return this.fallbackBP(bpRaw);
    }
  }

  private fallbackBP(raw: string): BPDocument {
    return {
      projectName: '未命名项目',
      problem: raw,
      solution: '',
      targetUsers: '',
      features: '',
      businessModel: '',
      advantage: '',
    };
  }
}
