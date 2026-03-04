import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Project } from '../project/entities/project.entity';
import { Response } from '../response/entities/response.entity';
import { ResponseAnswer } from '../response/entities/response-answer.entity';
import { Question } from '../question/entities/question.entity';
import { Result } from '../result/entities/result.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Response, ResponseAnswer, Question, Result]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
