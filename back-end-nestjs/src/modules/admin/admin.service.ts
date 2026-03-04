import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Administrador } from '../auth/entities/administrador.entity';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Administrador)
    private readonly repo: Repository<Administrador>,
  ) {}

  private strip(entity: Administrador) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unused-vars
    const { password, ...rest } = entity as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return rest;
  }

  async create(dto: CreateAdminDto) {
    // normalizações simples
    const email = dto.email.toLowerCase().trim();
    const social_number = dto.social_number.trim();

    // checa unicidade
    const exists = await this.repo.findOne({
      where: [{ email }, { social_number }],
    });
    if (exists) throw new ConflictException('admin.social_number_duplicate');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const hash = await bcrypt.hash(dto.password, 10);
    const ent = this.repo.create({
      name: dto.name,
      social_number,
      email,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      password: hash,
      active: dto.active ?? true,
      last_access: null,
    });
    const saved = await this.repo.save(ent);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.strip(saved);
  }

  async update(id: number, dto: UpdateAdminDto) {
    const admin = await this.repo.findOne({ where: { id } });
    if (!admin) throw new NotFoundException('admin.not_found');

    // se for alterar email/social_number, valida unicidade
    if (dto.email || dto.social_number) {
      const email = dto.email?.toLowerCase().trim();
      const social_number = dto.social_number?.trim();
      if (email || social_number) {
        const conflict = await this.repo
          .createQueryBuilder('a')
          .where('(a.email = :email OR a.social_number = :social_number)', {
            email: email ?? '',
            social_number: social_number ?? '',
          })
          .andWhere('a.id <> :id', { id })
          .getOne();
        if (conflict) throw new ConflictException('social_number_email_em_uso');
      }
    }

    const patch: Partial<Administrador> = {
      ...dto,
      email: dto.email ? dto.email.toLowerCase().trim() : undefined,
      social_number: dto.social_number ? dto.social_number.trim() : undefined,
    };

    if (dto.password) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      patch.password = await bcrypt.hash(dto.password, 10);
    }

    await this.repo.update(id, patch);
    const updated = await this.repo.findOne({ where: { id } });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.strip(updated!);
  }

  async findAll() {
    const list = await this.repo.find({
      where: { active: true }, // apenas administradores ativos
      order: { id: 'DESC' },
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return list.map((x) => this.strip(x));
  }

  async findOne(id: number) {
    const admin = await this.repo.findOne({ where: { id } });
    if (!admin) throw new NotFoundException('admin_nao_encontrado');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.strip(admin);
  }

  // soft delete = inativar
  async softDelete(id: number) {
    const admin = await this.repo.findOne({ where: { id } });
    if (!admin) throw new NotFoundException('admin_nao_encontrado');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    if (admin.active === false) return this.strip(admin);

    await this.repo.update(id, { active: false });
    const updated = await this.repo.findOne({ where: { id } });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.strip(updated!);
  }
}
