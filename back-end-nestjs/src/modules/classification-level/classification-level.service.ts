import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassificationLevel } from './entities/classification-level.entity';
import { CreateClassificationLevelDto } from './dto/create-classification-level.dto';
import { UpdateClassificationLevelDto } from './dto/update-classification-level.dto';

@Injectable()
export class ClassificationLevelService {
  constructor(
    @InjectRepository(ClassificationLevel)
    private readonly repo: Repository<ClassificationLevel>,
  ) {}

  findAll() {
    return this.repo.find({ order: { display_order: 'ASC' } });
  }

  async create(dto: CreateClassificationLevelDto) {
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async update(id: number, dto: UpdateClassificationLevelDto) {
    const level = await this.repo.findOne({ where: { id } });
    if (!level) {
      throw new NotFoundException('classification_level.not_found');
    }
    Object.assign(level, dto);
    return this.repo.save(level);
  }

  async remove(id: number) {
    const level = await this.repo.findOne({ where: { id } });
    if (!level) {
      throw new NotFoundException('classification_level.not_found');
    }
    await this.repo.remove(level);
    return { deleted: true };
  }
}
