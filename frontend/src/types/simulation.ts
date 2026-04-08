export interface SimulationMessage {
  type: 'message' | 'phase_change' | 'complete';
  groupId?: number;
  agent?: {
    id: string;
    name: string;
    avatar: string;
    role: string;
  };
  content?: string;
  phase?: number;
  simulationId?: string;
}

export interface GroupInfo {
  groupId: number;
  idea: string;
  members: {
    characterId: string;
    role: string;
    isLeader: boolean;
  }[];
}

export interface BPDocument {
  projectName: string;
  problem: string;
  solution: string;
  targetUsers: string;
  features: string;
  businessModel: string;
  advantage: string;
}

export interface JudgeScore {
  judgeId: string;
  judgeName: string;
  innovation: number;
  presentation: number;
  completeness: number;
  businessPotential: number;
  techDifficulty: number;
  comment: string;
  suggestion: string;
}

export interface GroupResult {
  groupId: number;
  bpDocument: BPDocument;
  scores: JudgeScore[];
  totalScore: number;
}

export interface SimulationResult {
  results: GroupResult[];
  messages: SimulationMessage[];
}
