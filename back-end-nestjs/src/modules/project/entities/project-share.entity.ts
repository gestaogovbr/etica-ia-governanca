import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from './project.entity';

@Entity('project_shared_users')
export class ProjectShare {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Project, (project) => project.shares, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ length: 14 })
  social_number: string;

  @CreateDateColumn({ type: 'timestamp' })
  date_created: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  date_updated: Date;
}
