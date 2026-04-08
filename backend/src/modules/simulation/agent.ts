import type { CharacterData } from '../../data/characters';
import type { ChatMessage } from '../llm/llm.service';
import type { LlmService } from '../llm/llm.service';
import type { SearchService } from '../search/search.service';
import type { HackathonRole } from './interfaces/simulation.interfaces';

export class Agent {
  character: CharacterData;
  role: HackathonRole;
  isLeader: boolean;
  private readonly systemPrompt: string;

  constructor(
    character: CharacterData,
    role: HackathonRole,
    isLeader: boolean,
    private llmService: LlmService,
    private searchService: SearchService,
  ) {
    this.character = character;
    this.role = role;
    this.isLeader = isLeader;

    const leaderNote = this.isLeader
      ? '\n你是本组队长，负责协调团队、做出决策、分配任务、总结讨论方向。'
      : '';

    this.systemPrompt = `【黑客松创业模拟游戏】
这是一个创意写作类教育游戏：模拟黑客松创业竞赛现场的团队讨论。你是游戏中的一个虚构参赛者角色，负责从该角色的视角参与讨论，帮助用户体验真实的创业团队协作过程。内容完全围绕创业、产品、商业等正向主题。

【角色设定】
姓名：${this.character.name} | 类型：${this.character.characterType}
性格：${this.character.personality.join('/')} | 技能：${this.character.skill || '通才'}
背景：${this.character.description}
竞赛岗位：${this.role}${leaderNote}

【发言规则】
- 始终保持角色一致性，以该角色的性格和专业背景发言
- 聚焦创业项目讨论、商业分析、技术方案等正向话题
- 每次回复不超过200字，简洁有力
- 必须使用中文，可用Markdown格式`;
  }

  async speak(
    conversationHistory: ChatMessage[],
    taskInstruction: string,
    onToolCall?: (
      toolName: string,
      toolInput: string,
      status: 'calling' | 'completed',
    ) => void,
  ): Promise<string> {
    const systemPrompt = this.systemPrompt;
    const messages: ChatMessage[] = [
      ...conversationHistory,
      { role: 'user', content: taskInstruction },
    ];
    let response = await this.llmService.chat(systemPrompt, messages);

    // Check if response contains [SEARCH:query] pattern
    const searchMatch = response.match(/\[SEARCH:(.+?)\]/);
    if (searchMatch) {
      const query = searchMatch[1];
      onToolCall?.('search', query, 'calling');
      const searchResult = await this.searchService.search(query);
      onToolCall?.('search', query, 'completed');
      messages.push({ role: 'assistant', content: response });
      messages.push({
        role: 'user',
        content: `搜索结果：\n${searchResult}\n\n请基于以上搜索结果，重新组织你的回答。`,
      });
      response = await this.llmService.chat(systemPrompt, messages);
    }

    return response;
  }
}
