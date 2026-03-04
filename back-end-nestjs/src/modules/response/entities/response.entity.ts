import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from '../../project/entities/project.entity';
import { ResponseAnswer } from './response-answer.entity';
import { Result } from '../../result/entities/result.entity';

@Entity('responses')
export class Response {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Project, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @RelationId((response: Response) => response.project)
  project_id: number;

  @Column({ length: 60, default: 'SUBMITTED' })
  status: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  total_score: number;

  @Column({ type: 'jsonb', nullable: true })
  meta: any;

  @Column({
    type: 'jsonb',
    nullable: true,
    default: () => "'[]'::jsonb",
  })
  session_scores: any;

  @OneToMany(() => ResponseAnswer, (answer) => answer.response, {
    cascade: true,
  })
  answers: ResponseAnswer[];

  @OneToOne(() => Result, (result) => result.response)
  result?: Result | null;

  @CreateDateColumn({ type: 'timestamp' })
  date_created: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  date_updated: Date;
}
