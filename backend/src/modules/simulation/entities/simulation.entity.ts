import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import type { GroupAssignment } from '../interfaces/simulation.interfaces';

@Entity()
export class Simulation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('jsonb')
  ideas: string[];

  @Column('jsonb')
  groups: GroupAssignment[];

  @Column({ default: 0 })
  currentPhase: number;

  @Column({ default: 'running' })
  status: string; // 'running' | 'completed'

  @CreateDateColumn()
  createdAt: Date;
}
