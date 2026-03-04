import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Question } from '../../question/entities/question.entity';

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn() id: number;

  @Index({ unique: true })
  @Column({ length: 120 })
  code: string;

  @Column({ length: 200 }) name: string;
  @Column('text') description: string;

  @Column('int', { default: 0 }) priority: number;
  @Column('text') ethical_principles: string;

  @Column({ default: true }) active: boolean;
  @Column({ default: false }) is_triage: boolean;
  @Column({ default: false }) is_testing: boolean;
  @Column({ type: 'varchar', length: 120, nullable: true })
  next_session_code: string | null;
  @Column({ type: 'jsonb', nullable: true }) triage_config: any | null;

  @CreateDateColumn({ type: 'timestamp' }) date_created: Date;
  @UpdateDateColumn({ type: 'timestamp' }) date_updated: Date;

  @OneToMany(() => Question, (q) => q.session) questions: Question[];
}
