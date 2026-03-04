import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { Response } from '../../response/entities/response.entity';
import { Project } from '../../project/entities/project.entity';

@Entity('results')
export class Result {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Response, (response) => response.result, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'response_id' })
  response: Response;

  @RelationId((result: Result) => result.response)
  response_id: number;

  @ManyToOne(() => Project, { eager: true, onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'project_id' })
  project?: Project | null;

  @RelationId((result: Result) => result.project)
  project_id?: number | null;

  @Column({ type: 'jsonb' })
  summary: any;

  @CreateDateColumn({ type: 'timestamp' })
  date_created: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  date_updated: Date;
}
