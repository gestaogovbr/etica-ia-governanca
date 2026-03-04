import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Actor } from './entities/actor.entity';
import { CreateActorDto } from './dto/create-actor.dto';
import { UpdateActorDto } from './dto/update-actor.dto';

@Injectable()
export class ActorService {
  constructor(@InjectRepository(Actor) private repo: Repository<Actor>) {}

  async create(dto: CreateActorDto) {
    const actor = this.repo.create(dto);
    return this.repo.save(actor);
  }

  findAll(active?: string) {
    const where: FindOptionsWhere<Actor> | undefined =
      typeof active === 'undefined'
        ? undefined
        : { active: active === 'true' };
    return this.repo.find({
      where,
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number) {
    const actor = await this.repo.findOne({ where: { id } });
    if (!actor) throw new NotFoundException('actor.not_found');
    return actor;
  }

  async update(id: number, dto: UpdateActorDto) {
    const actor = await this.repo.findOne({ where: { id } });
    if (!actor) throw new NotFoundException('actor.not_found');
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    const actor = await this.repo.findOne({ where: { id } });
    if (!actor) throw new NotFoundException('actor.not_found');
    await this.repo.delete(id);
    return { success: true };
  }
}
