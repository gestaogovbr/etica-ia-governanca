import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from './entities/question.entity';
import { QuestionVersion } from './entities/question-version.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Injectable()
export class QuestionService {
  constructor(
    @InjectRepository(Question) private repo: Repository<Question>,
    @InjectRepository(QuestionVersion)
    private versionRepo: Repository<QuestionVersion>,
  ) {}

  // create
  create(dto: CreateQuestionDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { session_id, ...rest } = dto as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const ent = this.repo.create({
      ...rest,
      version: 1,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      session: { id: session_id } as any,
    });
    return this.repo.save(ent);
  }

  // update (use save, não repo.update)
  async update(id: number, dto: UpdateQuestionDto) {
    const exists = await this.repo.findOne({ where: { id } });
    if (!exists) throw new NotFoundException('question.not_found');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { session_id, ...rest } = dto as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const patch: any = { id, ...rest };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    if (session_id) patch.session = { id: session_id };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const saved = await this.repo.save(patch);
    return this.repo.findOne({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      where: { id: saved.id },
      relations: ['session'],
    });
  }

  async updateWithVersioning(id: number, dto: UpdateQuestionDto) {
    const exists = await this.repo.findOne({
      where: { id },
      relations: ['session'],
    });
    if (!exists) throw new NotFoundException('question.not_found');

    return this.repo.manager.transaction(async (manager) => {
      const versionRepo = manager.getRepository(QuestionVersion);
      const questionRepo = manager.getRepository(Question);
      const snapshot = versionRepo.create({
        question: { id: exists.id } as any,
        version: exists.version ?? 1,
        code: exists.code,
        session: exists.session ? ({ id: exists.session.id } as any) : null,
        text: exists.text,
        type: exists.type,
        weights: exists.weights,
        options: exists.options,
        is_critical: exists.is_critical,
        active: exists.active,
        order: exists.order,
        conditional_field: exists.conditional_field,
        conditional_value: exists.conditional_value,
        actors: exists.actors,
        date_created: exists.date_created,
        date_updated: exists.date_updated,
      });
      await versionRepo.save(snapshot);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { session_id, ...rest } = dto as any;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const patch: any = {
        id,
        ...rest,
        version: (exists.version ?? 1) + 1,
      };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (session_id) patch.session = { id: session_id };

      const saved = await questionRepo.save(patch);
      return questionRepo.findOne({
        where: { id: saved.id },
        relations: ['session'],
      });
    });
  }

  findAll() {
    return this.repo.find({
      relations: ['session'],
      order: { order: 'ASC', id: 'ASC' },
      where: { active: true },
    });
  }

  async findOne(id: number) {
    const q = await this.repo.findOne({
      where: { id },
      relations: ['session'],
    });
    if (!q) throw new NotFoundException('question.not_found');
    return q;
  }

  async softDelete(id: number) {
    const exists = await this.repo.findOne({ where: { id } });
    if (!exists) throw new NotFoundException('question.not_found');
    await this.repo.update(id, { active: false });
    return this.repo.findOne({ where: { id } });
  }

  async listVersions(questionId: number) {
    return this.versionRepo.find({
      where: { question: { id: questionId } },
      relations: ['session'],
      order: { version: 'DESC', id: 'DESC' },
    });
  }
}
