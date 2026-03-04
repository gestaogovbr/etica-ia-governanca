// src/app/modules/logs/entities/log.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('logs')
export class Log {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'int', nullable: true })
  user_id: number | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  user_email: string | null; // ✅ tipo TS = string; | null é ok

  @Column({ type: 'varchar', length: 64, nullable: true })
  ip: string | null;

  @Index()
  @Column({ type: 'varchar', length: 30 })
  action: string; // 'login' | 'create' | 'update' | 'delete' | 'logout' | 'other'

  @Index()
  @Column({ type: 'varchar', length: 80 })
  module: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  record_id: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  route: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  method: string | null;

  @Column({ type: 'varchar', length: 16 })
  status: string; // 'SUCCESS' | 'ERROR'

  @Column({ type: 'jsonb', nullable: true })
  detail: any;

  @Column({ type: 'text', nullable: true })
  user_agent: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  date_created: Date;
}
