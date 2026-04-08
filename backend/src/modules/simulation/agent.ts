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
      ? '\n你是本组队长，负责协调团队、做出决策、分配任务、总结讨论。'
      : '';

    this.systemPrompt = `你是${this.character.name}，一个${this.character.characterType}角色。
性格类型：${this.character.personality.join('/')}
个人描述：${this.character.description}
特殊技能：${this.character.skill || '无'}
你在黑客松中担任【${this.role}】岗位。${leaderNote}
请始终以你的角色性格来回应，保持角色一致性。回复请简洁有力，每次不超过200字。`;
  }

  async speak(
    conversationHistory: ChatMessage[],
    taskInstruction: string,
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
      const searchResult = await this.searchService.search(searchMatch[1]);
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
