import type { CharacterData } from '../../data/characters';
import type { LlmService } from '../llm/llm.service';
import type { SearchService } from '../search/search.service';
import type {
  GroupAssignment,
  BPDocument,
} from './interfaces/simulation.interfaces';
import { Agent } from './agent';
import { PhaseExecutor } from './phase-executor';
import type { MessageCallback } from './phase-executor';

export class GroupRunner {
  private agents: Agent[];
  private phaseExecutor: PhaseExecutor;

  constructor(
    private group: GroupAssignment,
    characters: CharacterData[],
    llmService: LlmService,
    searchService: SearchService,
  ) {
    this.agents = group.members.map((m) => {
      const char = characters.find((c) => c.id === m.characterId)!;
      return new Agent(char, m.role, m.isLeader, llmService, searchService);
    });
    this.phaseExecutor = new PhaseExecutor(llmService, searchService);
  }

  async runPhase1(onMessage: MessageCallback): Promise<void> {
    await this.phaseExecutor.executePhase1(
      this.agents,
      this.group.groupId,
      this.group.idea,
      onMessage,
    );
  }

  async runPhase2(
    phase1Summary: string,
    onMessage: MessageCallback,
  ): Promise<BPDocument> {
    return this.phaseExecutor.executePhase2(
      this.agents,
      this.group.groupId,
      phase1Summary,
      onMessage,
    );
  }

  getAgents(): Agent[] {
    return this.agents;
  }

  getGroup(): GroupAssignment {
    return this.group;
  }
}
