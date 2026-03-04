import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from './entities/session.entity';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';

@Injectable()
export class SessionService {
  constructor(@InjectRepository(Session) private repo: Repository<Session>) {}

  async create(dto: CreateSessionDto) {
    const exists = await this.repo.findOne({ where: { code: dto.code } });
    if (exists) throw new ConflictException('session.code_exists');
    const nextCode = dto.next_session_code?.trim() || null;
    const ent = this.repo.create({
      ...dto,
      is_testing: !!dto.is_testing,
      triage_config: this.normalizeTriageConfig(
        dto.is_triage ? dto.triage_config : null,
      ),
      // Permite definir encadeamento mesmo para sessões de triagem
      next_session_code: nextCode,
    });
    return this.repo.save(ent);
  }

  async update(id: number, dto: UpdateSessionDto) {
    const s = await this.repo.findOne({ where: { id } });
    if (!s) throw new NotFoundException('session.not_found');
    if (dto.code && dto.code !== s.code) {
      const conflict = await this.repo.findOne({ where: { code: dto.code } });
      if (conflict) throw new ConflictException('session.code_exists');
    }
    const nextCode = dto.next_session_code?.trim() || null;
    const payload: Partial<Session> = { ...dto, is_testing: dto.is_testing ?? s.is_testing };
    if (typeof dto.is_triage !== 'undefined') {
      payload.triage_config = this.normalizeTriageConfig(
        dto.is_triage ? dto.triage_config : null,
      );
      payload.next_session_code = nextCode;
    } else if (typeof dto.next_session_code !== 'undefined') {
      payload.next_session_code = nextCode;
    }
    await this.repo.update(id, payload);
    return this.repo.findOne({ where: { id } });
  }

  findAll(isAdmin?: boolean) {
    const where: any = { active: true };
    if (!isAdmin) where.is_testing = false;
    return this.repo.find({
      where,
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number) {
    const s = await this.repo.findOne({
      where: { id },
      relations: ['questions'],
    });
    if (!s) throw new NotFoundException('session.not_found');
    return s;
  }

  async softDelete(id: number) {
    const s = await this.repo.findOne({ where: { id } });
    if (!s) throw new NotFoundException('session.not_found');
    await this.repo.update(id, { active: false });
    return this.repo.findOne({ where: { id } });
  }

  private normalizeTriageConfig(config?: any | null) {
    if (!config?.levels || !Array.isArray(config.levels)) return null;
    const levels = config.levels
      .map((level: any) => ({
        key: String(level?.key ?? '').trim(),
        label: String(level?.label ?? '').trim(),
        min_score: Number(level?.min_score ?? 0),
        next_session_code: level?.next_session_code
          ? String(level.next_session_code).trim()
          : null,
      }))
      .filter((level: any) => level.key && level.label);
    if (!levels.length) return null;
    return { levels };
  }
}
