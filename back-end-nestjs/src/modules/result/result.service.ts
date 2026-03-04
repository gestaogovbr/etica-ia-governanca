import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Result } from './entities/result.entity';
import { Response } from '../response/entities/response.entity';
import { UpsertResultDto } from './dto/upsert-result.dto';

@Injectable()
export class ResultService {
  constructor(
    @InjectRepository(Result) private readonly resultRepo: Repository<Result>,
    @InjectRepository(Response)
    private readonly responseRepo: Repository<Response>,
  ) {}

  async upsert(dto: UpsertResultDto) {
    const response = await this.responseRepo.findOne({
      where: { id: dto.response_id },
      relations: ['project'],
    });
    if (!response) {
      throw new NotFoundException('response.not_found');
    }
    if (response.project?.active === false) {
      throw new NotFoundException('project.not_found');
    }

    let entity = await this.resultRepo.findOne({
      where: { response: { id: response.id } },
      relations: ['response', 'project'],
    });

    if (!entity) {
      entity = this.resultRepo.create({
        response,
        project: response.project ?? null,
        summary: dto.summary,
      });
    } else {
      entity.summary = dto.summary;
      entity.project = response.project ?? null;
    }

    return this.resultRepo.save(entity);
  }

  async findByResponse(responseId: number) {
    const entity = await this.resultRepo.findOne({
      where: { response: { id: responseId } },
      relations: ['response', 'project'],
    });
    if (!entity || entity.project?.active === false) {
      throw new NotFoundException('result.not_found');
    }
    return entity;
  }
}
