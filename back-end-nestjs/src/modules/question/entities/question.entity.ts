// question.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  RelationId,
  Index,
} from 'typeorm';
import { Session } from '../../session/entities/session.entity';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn() id: number;

  @Index()
  @Column({ length: 120 })
  code: string;

  @ManyToOne(() => Session, (s) => s.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' }) // usa a coluna física session_id
  session: Session;

  @RelationId((q: Question) => q.session) // campo virtual para leitura
  session_id: number;

  @Column('text') text: string;
  @Column({ length: 30 }) type: string;
  @Column('decimal', { precision: 10, scale: 2, default: 1 }) weights: number;
  @Column({ type: 'jsonb', nullable: true }) options: any;
  @Column({ default: false }) is_critical: boolean;
  @Column({ default: true }) active: boolean;
  @Column({ type: 'integer', default: 0, name: 'order' }) order: number;
  @Column({ type: 'integer', default: 1 }) version: number;
  @Column({ length: 120, nullable: true }) conditional_field: string;
  @Column({ length: 250, nullable: true }) conditional_value: string;
  @Column({ type: 'jsonb', nullable: true }) actors: any;
  @CreateDateColumn({ type: 'timestamp' }) date_created: Date;
  @UpdateDateColumn({ type: 'timestamp' }) date_updated: Date;
}
