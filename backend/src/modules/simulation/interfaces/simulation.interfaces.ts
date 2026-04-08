export type HackathonRole =
  | '产品经理'
  | '前端工程师'
  | '后端工程师'
  | '设计师'
  | '运营';

export interface GroupMember {
  characterId: string;
  role: HackathonRole;
  isLeader: boolean;
}

export interface GroupAssignment {
  groupId: number;
  idea: string;
  members: GroupMember[];
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
  innovation: number; // 创新性 1-10
  presentation: number; // 现场讲述效果 1-10
  completeness: number; // 完成度 1-10
  businessPotential: number; // 商业潜力 1-10
  techDifficulty: number; // 技术难度 1-10
  comment: string;
  suggestion: string;
}
