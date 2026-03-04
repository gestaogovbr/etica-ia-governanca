import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { Response } from './response.entity';
import { Question } from '../../question/entities/question.entity';

@Entity('response_answers')
export class ResponseAnswer {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Response, (response) => response.answers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'response_id' })
  response: Response;

  @RelationId((answer: ResponseAnswer) => answer.response)
  response_id: number;

  @ManyToOne(() => Question, { eager: true })
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @RelationId((answer: ResponseAnswer) => answer.question)
  question_id: number;

  @Column({ type: 'text', nullable: true })
  value: string | null;

  @Column({ type: 'jsonb', nullable: true })
  value_parsed: any;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  points: number;

  @CreateDateColumn({ type: 'timestamp' })
  date_created: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  date_updated: Date;
}
