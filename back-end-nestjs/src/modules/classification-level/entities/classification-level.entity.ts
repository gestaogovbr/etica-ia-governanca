import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('classification_levels')
export class ClassificationLevel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 60, unique: true })
  level_key: string;

  @Column({ type: 'int', default: 0 })
  display_order: number;

  @Column({ length: 120 })
  title: string;

  @Column({ length: 120 })
  subtitle: string;

  @Column('text')
  description: string;

  @Column('text')
  advice: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  max_score: number | null;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  max_percentage: number | null;

  @Column('int', { nullable: true })
  critical_trigger_threshold: number | null;

  @CreateDateColumn({ type: 'timestamp' })
  date_created: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  date_updated: Date;
}
