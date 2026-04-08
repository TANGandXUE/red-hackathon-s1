import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import type {
  BPDocument,
  JudgeScore,
} from '../interfaces/simulation.interfaces';

@Entity()
export class Result {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  simulationId: string;

  @Column()
  groupId: number;

  @Column('jsonb')
  bpDocument: BPDocument;

  @Column('jsonb')
  scores: JudgeScore[];

  @Column('float', { default: 0 })
  totalScore: number;
}
