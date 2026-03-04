// src/modules/project/entities/project.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  RelationId,
} from 'typeorm';
import { Response } from '../../response/entities/response.entity';
import { Administrador } from '../../auth/entities/administrador.entity';
import { ProjectShare } from './project-share.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  name: string;

  @Column({ length: 150 })
  responsible: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 50, nullable: true })
  last_pretriagem_level: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  last_pretriagem_score: number;

  @Column({ default: true })
  active: boolean;

  @ManyToOne(() => Administrador, { nullable: true })
  @JoinColumn({ name: 'owner_id' })
  owner: Administrador;

  @RelationId((project: Project) => project.owner)
  owner_id: number;

  @CreateDateColumn({ type: 'timestamp' })
  date_created: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  date_updated: Date;

  @OneToMany(() => Response, (response) => response.project)
  responses: Response[];

  @OneToMany(() => ProjectShare, (share) => share.project)
  shares: ProjectShare[];

  // virtual properties (not persisted)
  is_owner?: boolean;
  shared_with_me?: boolean;
  responses_count?: number;
}
