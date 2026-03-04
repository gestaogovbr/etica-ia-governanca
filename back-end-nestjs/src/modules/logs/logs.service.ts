/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  ILike,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { Log } from './entities/log.entity';
import { GetLogsQueryDto } from './dto/get-logs-query.dto';

@Injectable()
export class LogsService {
  constructor(@InjectRepository(Log) private repo: Repository<Log>) {}

  async write(entry: Partial<Log>) {
    const log = this.repo.create(entry);
    return this.repo.save(log);
  }

  async search(q: GetLogsQueryDto) {
    const limit = Math.min(Math.max(q.limit ?? 100, 1), 500);

    // datas
    let dateWhere: any = undefined;
    if (q.from && q.to) dateWhere = Between(new Date(q.from), new Date(q.to));
    else if (q.from) dateWhere = MoreThanOrEqual(new Date(q.from));
    else if (q.to) dateWhere = LessThanOrEqual(new Date(q.to));

    // user pode ser email ou id numérico
    const userEmail =
      q.user && q.user.includes('@') ? q.user.toLowerCase().trim() : undefined;
    const userId =
      q.user && !q.user.includes('@') && !isNaN(Number(q.user))
        ? Number(q.user)
        : undefined;

    const where: any = {};
    if (userEmail) where.user_email = ILike(`%${userEmail}%`);
    if (userId) where.user_id = userId;
    if (q.route) where.route = ILike(`%${q.route}%`);
    if (q.action) where.action = q.action;
    if (q.module) where.module = q.module;
    if (dateWhere) where.date_created = dateWhere;

    return this.repo.find({
      where,
      order: { date_created: 'DESC', id: 'DESC' },
      take: limit,
    });
  }
}
