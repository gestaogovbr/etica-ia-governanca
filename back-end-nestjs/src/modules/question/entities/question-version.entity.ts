import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm';
import { Question } from './question.entity';
import { Session } from '../../session/entities/session.entity';

@Entity('questions_versions')
export class QuestionVersion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Question, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @RelationId((qv: QuestionVersion) => qv.question)
  questionId: number;

  @Index()
  @Column({ type: 'integer', default: 1 })
  version: number;

  @Index()
  @Column({ length: 120 })
  code: string;

  @ManyToOne(() => Session, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'session_id' })
  session: Session;

  @RelationId((qv: QuestionVersion) => qv.session)
  session_id: number;

  @Column('text')
  text: string;

  @Column({ length: 30 })
  type: string;

  @Column('decimal', { precision: 10, scale: 2, default: 1 })
  weights: number;

  @Column({ type: 'jsonb', nullable: true })
  options: any;

  @Column({ default: false })
  is_critical: boolean;

  @Column({ default: true })
  active: boolean;

  @Column({ type: 'integer', default: 0, name: 'order' })
  order: number;

  @Column({ length: 120, nullable: true })
  conditional_field: string;

  @Column({ length: 250, nullable: true })
  conditional_value: string;

  @Column({ type: 'jsonb', nullable: true })
  actors: any;

  @Column({ type: 'timestamp', nullable: true })
  date_created: Date;

  @Column({ type: 'timestamp', nullable: true })
  date_updated: Date;
}
