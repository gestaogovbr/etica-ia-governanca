import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Result } from './entities/result.entity';
import { ResultService } from './result.service';
import { ResultController } from './result.controller';
import { Response } from '../response/entities/response.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Result, Response])],
  controllers: [ResultController],
  providers: [ResultService],
  exports: [ResultService],
})
export class ResultModule {}
