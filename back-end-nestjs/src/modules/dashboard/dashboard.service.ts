import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Project } from '../project/entities/project.entity';
import { Response } from '../response/entities/response.entity';
import { ResponseAnswer } from '../response/entities/response-answer.entity';
import { Question } from '../question/entities/question.entity';
import { Result } from '../result/entities/result.entity';

type SessionAverage = {
  session_id: number;
  session_name: string;
  average_score: number;
  responses: number;
};

type AnswerLeader = {
  question_id: number;
  question_text: string;
  value: string | null;
  count: number;
};

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Project) private readonly projectRepo: Repository<Project>,
    @InjectRepository(Response) private readonly responseRepo: Repository<Response>,
    @InjectRepository(ResponseAnswer)
    private readonly answerRepo: Repository<ResponseAnswer>,
    @InjectRepository(Question) private readonly questionRepo: Repository<Question>,
    @InjectRepository(Result) private readonly resultRepo: Repository<Result>,
  ) {}

  async getDashboard() {
    const baseResponseQuery = this.responseRepo
      .createQueryBuilder('response')
      .leftJoin('response.project', 'project')
      .where('project.active = :active', { active: true });

    const [totalProjects, totalResponses, finishedResponses] = await Promise.all([
      this.projectRepo.count({ where: { active: true } }),
      baseResponseQuery.getCount(),
      baseResponseQuery
        .clone()
        .andWhere('response.status = :status', { status: 'FINISHED' })
        .getCount(),
    ]);

    const statusRaw = await this.responseRepo
      .createQueryBuilder('response')
      .select('response.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('response.status')
      .getRawMany();

    const statusBreakdown = statusRaw.map((item) => ({
      status: item.status ?? 'UNKNOWN',
      count: Number(item.count) || 0,
    }));

    const sessionAverages = await this.buildSessionAverages();
    const answerLeaders = await this.buildAnswerLeaders();

    return {
      overview: {
        totalProjects,
        totalResponses,
        finishedResponses,
      },
      statusBreakdown,
      sessionAverages,
      answerLeaders,
    };
  }

  private async buildSessionAverages(): Promise<SessionAverage[]> {
    const results = await this.resultRepo.find({
      select: ['summary'],
      relations: ['project'],
      where: { project: { active: true } },
    });

    const accumulator = new Map<
      number,
      { session_id: number; session_name: string; total: number; count: number }
    >();

    results.forEach((result) => {
      const sections = Array.isArray(result.summary?.sectionPerformance)
        ? result.summary.sectionPerformance
        : [];

      sections.forEach((section: any) => {
        const id = Number(section?.sessionId ?? section?.session_id);
        if (!Number.isFinite(id)) return;
        const numericScore = Number(section?.score);
        if (!Number.isFinite(numericScore)) return;

        const current = accumulator.get(id) ?? {
          session_id: id,
          session_name:
            section?.sessionName ?? section?.session_name ?? `Sessão ${id}`,
          total: 0,
          count: 0,
        };

        current.total += numericScore;
        current.count += 1;
        current.session_name =
          section?.sessionName ?? section?.session_name ?? current.session_name;
        accumulator.set(id, current);
      });
    });

    return Array.from(accumulator.values()).map((item) => ({
      session_id: item.session_id,
      session_name: item.session_name,
      average_score: Number((item.total / item.count).toFixed(2)),
      responses: item.count,
    }));
  }

  private async buildAnswerLeaders(): Promise<AnswerLeader[]> {
    const raw = await this.answerRepo
      .createQueryBuilder('answer')
      .innerJoin('answer.response', 'response')
      .innerJoin('response.project', 'project')
      .select('answer.question_id', 'question_id')
      .addSelect('answer.value', 'value')
      .addSelect('COUNT(*)', 'count')
      .where('answer.question_id IS NOT NULL')
      .andWhere('project.active = :active', { active: true })
      .groupBy('answer.question_id')
      .addGroupBy('answer.value')
      .orderBy('answer.question_id', 'ASC')
      .addOrderBy('count', 'DESC')
      .getRawMany();

    const leaders = new Map<number, { question_id: number; value: string | null; count: number }>();

    raw.forEach((row) => {
      const questionId = Number(row.question_id);
      if (!Number.isFinite(questionId)) return;
      if (!leaders.has(questionId)) {
        leaders.set(questionId, {
          question_id: questionId,
          value: row.value ?? null,
          count: Number(row.count) || 0,
        });
      }
    });

    const questionIds = Array.from(leaders.keys());
    if (!questionIds.length) return [];

    const questions = await this.questionRepo.find({
      where: { id: In(questionIds) },
      select: ['id', 'text', 'code'],
    });
    const questionMap = new Map(questions.map((question) => [question.id, question]));

    return Array.from(leaders.values()).map((leader) => {
      const question = questionMap.get(leader.question_id);
      return {
        question_id: leader.question_id,
        question_text: question?.text ?? question?.code ?? `Questão ${leader.question_id}`,
        value: leader.value,
        count: leader.count,
      };
    });
  }
}
