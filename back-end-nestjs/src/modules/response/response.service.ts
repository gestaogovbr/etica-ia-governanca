/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Response } from './entities/response.entity';
import { ResponseAnswer } from './entities/response-answer.entity';
import { CreateResponseDto } from './dto/create-response.dto';
import { Project } from '../project/entities/project.entity';
import { Question } from '../question/entities/question.entity';

@Injectable()
export class ResponseService {
  constructor(
    @InjectRepository(Response) private repo: Repository<Response>,
    @InjectRepository(ResponseAnswer)
    private answersRepo: Repository<ResponseAnswer>,
    @InjectRepository(Project) private projectRepo: Repository<Project>,
    @InjectRepository(Question) private questionRepo: Repository<Question>,
  ) {}

  async create(dto: CreateResponseDto) {
    const sanitizedAnswers =
      dto.answers?.filter((answer) => this.hasValue(answer?.value)) ?? [];

    if (!sanitizedAnswers.length) {
      throw new BadRequestException('response.answers_required');
    }

    const project = await this.projectRepo.findOne({
      where: { id: dto.project_id, active: true },
    });
    if (!project) {
      throw new NotFoundException('project.not_found');
    }

    const questionIds = sanitizedAnswers.map((item) => item.question_id);
    const questions = await this.questionRepo.find({
      where: { id: In(questionIds) },
      relations: ['session'],
    });
    const questionMap = new Map(questions.map((q) => [q.id, q]));

    const answers = sanitizedAnswers.map((input) => {
      const question = questionMap.get(input.question_id);
      if (!question) {
        throw new NotFoundException('question.not_found');
      }
      const normalized = this.normalizeValue(question, input.value);
      const { textValue, parsedValue } = this.stringifyValue(normalized);
      const points = this.calculatePoints(question, parsedValue);
      return this.answersRepo.create({
        question,
        value: textValue,
        value_parsed: parsedValue,
        points,
      });
    });

    const total = answers.reduce(
      (sum, answer) => sum + Number(answer.points || 0),
      0,
    );

    const defaultSessionScores = this.buildSessionScores(answers);
    const mergedSessionScores = this.mergeSessionScores(
      defaultSessionScores,
      dto.session_scores,
    );

    if (dto.response_id) {
      const response = await this.repo.findOne({
        where: { id: dto.response_id },
        relations: ['project'],
      });
      if (!response) throw new NotFoundException('response.not_found');
      if (response.project.id !== project.id) {
        throw new BadRequestException('response.project_mismatch');
      }

      if (questionIds.length) {
        await this.answersRepo
          .createQueryBuilder()
          .delete()
          .where('response_id = :responseId', { responseId: response.id })
          .andWhere('question_id IN (:...ids)', { ids: questionIds })
          .execute();
      }

      const entities = answers.map((answer) =>
        this.answersRepo.create({
          ...answer,
          response,
        }),
      );
      if (entities.length) await this.answersRepo.save(entities);

      const allAnswers = await this.answersRepo.find({
        where: { response: { id: response.id } },
        relations: ['question', 'question.session'],
      });

      const updatedSessionScores = this.mergeSessionScores(
        this.buildSessionScores(allAnswers),
        dto.session_scores,
      );

      response.session_scores = updatedSessionScores;
      response.total_score = this.roundScore(
        allAnswers.reduce((sum, answer) => sum + Number(answer.points || 0), 0),
      );
      response.status = dto.status || response.status || 'SUBMITTED';
      response.meta = { answeredQuestions: allAnswers.length };

      const saved = await this.repo.save(response);
      await this.updateProjectPreTriagemSummary(
        project.id,
        updatedSessionScores,
      );
      return saved;
    }

    const response = this.repo.create({
      project,
      status: dto.status || 'SUBMITTED',
      total_score: this.roundScore(total),
      meta: { answeredQuestions: answers.length },
      session_scores: mergedSessionScores,
      answers,
    });

    const saved = await this.repo.save(response);
    await this.updateProjectPreTriagemSummary(project.id, mergedSessionScores);
    return saved;
  }

  private hasValue(value: any) {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim().length > 0;
    return value !== null && typeof value !== 'undefined';
  }

  findAll(filters?: { projectId?: number; status?: string }) {
    const where: any = { project: { active: true } };
    if (filters?.projectId) {
      where.project = { id: filters.projectId, active: true };
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    return this.repo.find({
      where,
      relations: ['project', 'result'],
      order: { date_created: 'DESC' },
    });
  }

  async findOne(id: number) {
    const response = await this.repo.findOne({
      where: { id },
      relations: ['project', 'answers', 'answers.question', 'result'],
    });
    if (!response || response.project?.active === false) {
      throw new NotFoundException('response.not_found');
    }
    return response;
  }

  private normalizeValue(question: Question, raw: any) {
    const type = (question?.type || '').toLowerCase();

    if (type === 'checkbox') {
      return this.normalizeArrayValue(raw);
    }

    if (raw === null || typeof raw === 'undefined') {
      return null;
    }

    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (!trimmed.length) return null;
      return trimmed;
    }

    return raw;
  }

  private normalizeArrayValue(raw: any): string[] {
    if (Array.isArray(raw)) {
      return Array.from(new Set(raw.map((item) => String(item))));
    }

    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (!trimmed) return [];

      if (
        (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
        (trimmed.startsWith('{') && trimmed.endsWith('}'))
      ) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            return Array.from(new Set(parsed.map((item) => String(item))));
          }
        } catch {
          // fallback to comma split
        }
      }

      return Array.from(
        new Set(
          trimmed
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean),
        ),
      );
    }

    return [];
  }

  private stringifyValue(value: any) {
    if (value === null || typeof value === 'undefined') {
      return { textValue: null, parsedValue: null };
    }

    if (Array.isArray(value) || typeof value === 'object') {
      return {
        textValue: JSON.stringify(value),
        parsedValue: value,
      };
    }

    return {
      textValue: String(value),
      parsedValue: value,
    };
  }

  private calculatePoints(question: Question, value: any): number {
    if (!question) return 0;

    const weight = Number(question.weights) || 1;
    const options = this.normalizeOptions(question.options);
    if (!options.length) return 0;

    const type = (question.type || '').toLowerCase();

    if (type === 'checkbox' && Array.isArray(value)) {
      const sum = value.reduce((acc, current) => {
        const option = options.find(
          (opt: any) => String(opt.value) === String(current),
        );
        return acc + (Number(option?.points) || 0);
      }, 0);
      return this.roundScore(sum * weight);
    }

    const option = options.find(
      (opt: any) => String(opt.value) === String(value),
    );
    if (!option) return 0;
    return this.roundScore((Number(option.points) || 0) * weight);
  }

  private normalizeOptions(raw: any): any[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }

  private roundScore(value: number) {
    return Number(Number(value || 0).toFixed(2));
  }

  private buildSessionScores(answers: ResponseAnswer[]) {
    const map = new Map<number, any>();
    answers.forEach((answer) => {
      const session = answer.question?.session;
      if (!session) return;
      const current = map.get(session.id) ?? {
        session_id: session.id,
        session_code: session.code,
        session_name: session.name,
        score: 0,
        level: null,
        meta: null,
      };
      current.score = this.roundScore(
        Number(current.score) + Number(answer.points || 0),
      );
      map.set(session.id, current);
    });
    return Array.from(map.values());
  }

  private mergeSessionScores(
    base: any[],
    incoming?: CreateResponseDto['session_scores'],
  ) {
    if (!incoming?.length) {
      return base;
    }

    const merged = new Map<number, any>();
    base.forEach((item) => merged.set(item.session_id, { ...item }));

    incoming.forEach((item) => {
      if (!item?.session_id) return;
      const existing = merged.get(item.session_id) ?? {
        session_id: item.session_id,
        session_code: null,
        session_name: null,
        score: 0,
        level: null,
        meta: null,
      };
      merged.set(item.session_id, {
        ...existing,
        session_id: item.session_id,
        session_code: item.session_code ?? existing.session_code,
        session_name: item.session_name ?? existing.session_name,
        score: this.roundScore(Number(item.score) || 0),
        level: item.level ?? existing.level,
        meta: item.meta ?? existing.meta,
      });
    });

    return Array.from(merged.values());
  }

  private async updateProjectPreTriagemSummary(
    projectId: number,
    sessionScores: any[],
  ) {
    if (!projectId || !Array.isArray(sessionScores)) return;
    const summary = sessionScores.find((item) => {
      const code = String(item?.session_code || '').toLowerCase();
      const name = String(item?.session_name || '').toLowerCase();
      return code === 'pretriagem' || name.includes('triagem');
    });
    if (!summary) return;

    const level =
      typeof summary.level === 'string' && summary.level.length
        ? summary.level
        : null;
    const numericScore =
      typeof summary.score === 'number'
        ? summary.score
        : summary.score != null
          ? Number(summary.score)
          : null;

    const patch: Partial<Project> = {};
    if (level !== null) patch.last_pretriagem_level = level;
    if (numericScore !== null && Number.isFinite(numericScore)) {
      patch.last_pretriagem_score = this.roundScore(numericScore);
    }

    if (Object.keys(patch).length) {
      await this.projectRepo.update(projectId, patch);
    }
  }
}
