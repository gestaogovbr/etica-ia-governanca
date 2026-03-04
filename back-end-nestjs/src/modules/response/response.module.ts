import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Response } from './entities/response.entity';
import { ResponseAnswer } from './entities/response-answer.entity';
import { ResponseService } from './response.service';
import { ResponseController } from './response.controller';
import { Project } from '../project/entities/project.entity';
import { Question } from '../question/entities/question.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Response, ResponseAnswer, Project, Question]),
  ],
  providers: [ResponseService],
  controllers: [ResponseController],
})
export class ResponseModule {}
