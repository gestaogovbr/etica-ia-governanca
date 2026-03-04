import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassificationLevel } from './entities/classification-level.entity';
import { ClassificationLevelService } from './classification-level.service';
import { ClassificationLevelController } from './classification-level.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ClassificationLevel])],
  controllers: [ClassificationLevelController],
  providers: [ClassificationLevelService],
  exports: [ClassificationLevelService],
})
export class ClassificationLevelModule {}
