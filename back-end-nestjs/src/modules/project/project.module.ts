// src/modules/project/project.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { ProjectShare } from './entities/project-share.entity';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Project, ProjectShare])],
  providers: [ProjectService],
  controllers: [ProjectController],
})
export class ProjectModule {}
