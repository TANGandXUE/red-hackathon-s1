export interface CharacterData {
  id: string;
  name: string;
  avatarUrl: string;
  characterType: string;
  colorPreference: string;
  personality: string[];
  description: string;
  skill: string;
  weapon: string;
  equipment: string;
  companion: string;
  isGenerated: boolean;
}

export interface JudgeData {
  id: string;
  name: string;
  title: string;
  avatarUrl: string;
  personality: string;
  focusAreas: string[];
  judgingStyle: string;
}
