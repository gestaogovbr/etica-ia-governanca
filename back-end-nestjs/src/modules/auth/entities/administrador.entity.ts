import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('administradores')
export class Administrador {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  name: string;

  @Column({ length: 14, unique: true })
  social_number: string;

  @Column({ length: 150, unique: true })
  email: string;

  @Column({ length: 150, nullable: true })
  position: string;

  // mantém o campo de senha, mesmo não existindo no CREATE TABLE (crie depois se quiser autenticar)
  @Column({ length: 255, select: false, nullable: true })
  password: string;

  @Column({ default: true })
  active: boolean;

  @Column({ type: 'timestamp', nullable: true })
  last_access: Date | null;

  @CreateDateColumn({ type: 'timestamp', name: 'date_created' })
  date_created: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'date_updated' })
  date_updated: Date;
}
