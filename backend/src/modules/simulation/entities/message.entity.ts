import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  simulationId: string;

  @Column()
  groupId: number;

  @Column()
  phase: number;

  @Column()
  agentId: string;

  @Column()
  agentName: string;

  @Column()
  agentRole: string;

  @Column('text')
  content: string;

  @CreateDateColumn()
  createdAt: Date;
}
