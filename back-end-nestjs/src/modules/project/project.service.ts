/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// src/modules/project/project.service.ts
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectShare } from './entities/project-share.entity';
import { ProjectShareDto } from './dto/project-share.dto';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly repo: Repository<Project>,
    @InjectRepository(ProjectShare)
    private readonly shareRepo: Repository<ProjectShare>,
  ) {}

  async create(dto: CreateProjectDto, user: any) {
    const project = this.repo.create({
      ...dto,
      owner: user?.id ? ({ id: user.id } as any) : null,
    });
    return this.repo.save(project);
  }

  async findAll(user: any) {
    if (!user?.id) return [];
    const qb = this.repo
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.owner', 'owner')
      .leftJoin('project.shares', 'share')
      .loadRelationCountAndMap(
        'project.responses_count',
        'project.responses',
        'finishedResponses',
        (qb) => qb.where('finishedResponses.status = :status', { status: 'FINISHED' }),
      )
      .where('project.owner_id = :ownerId', { ownerId: user.id });

    if (user.social_number) {
      qb.orWhere('share.social_number = :social', {
        social: user.social_number,
      });
    }

    qb.andWhere('project.active = :active', { active: true });

    const projects = await qb
      .distinct(true)
      .orderBy('project.id', 'DESC')
      .getMany();

    return projects.map((project) => ({
      ...project,
      is_owner: project.owner_id === user.id,
      shared_with_me:
        project.owner_id != null && project.owner_id !== user.id ? true : false,
    }));
  }

  async findOne(id: number, user: any) {
    const project = await this.findProjectWithAccess(id, user);
    if (!project) throw new NotFoundException('project.not_found');
    return project;
  }

  async update(id: number, dto: UpdateProjectDto, user: any) {
    await this.ensureOwnerAccess(id, user);
    await this.repo.update(id, dto);
    return this.repo.findOne({ where: { id } });
  }

  async remove(id: number, user: any) {
    await this.ensureOwnerAccess(id, user);
    await this.repo.update(id, { active: false });
    return { success: true, softDeleted: true };
  }

  async listShares(projectId: number, user: any) {
    await this.ensureOwnerAccess(projectId, user);
    return this.shareRepo.find({
      where: { project: { id: projectId } },
      order: { date_created: 'ASC' },
    });
  }

  async addShare(projectId: number, dto: ProjectShareDto, user: any) {
    const project = await this.ensureOwnerAccess(projectId, user);
    const social = dto.social_number?.trim();
    if (!social) throw new ForbiddenException('project.share_invalid');

    if (
      project.owner &&
      project.owner.social_number &&
      project.owner.social_number === social
    ) {
      throw new ForbiddenException('project.share_invalid_owner');
    }

    const exists = await this.shareRepo.findOne({
      where: {
        project: { id: project.id },
        social_number: social,
      },
    });
    if (exists) return exists;

    const share = this.shareRepo.create({
      project,
      social_number: social,
    });
    return this.shareRepo.save(share);
  }

  async removeShare(projectId: number, shareId: number, user: any) {
    await this.ensureOwnerAccess(projectId, user);
    const share = await this.shareRepo.findOne({
      where: { id: shareId, project: { id: projectId } },
    });
    if (!share) throw new NotFoundException('project.share_not_found');
    await this.shareRepo.delete(share.id);
    return { success: true };
  }

  private async findProjectWithAccess(id: number, user: any) {
    if (!user?.id) throw new ForbiddenException('project.forbidden');
    const qb = this.repo
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.owner', 'owner')
      .leftJoin('project.shares', 'share')
      .loadRelationCountAndMap(
        'project.responses_count',
        'project.responses',
        'finishedResponses',
        (qb) => qb.where('finishedResponses.status = :status', { status: 'FINISHED' }),
      )
      .where('project.id = :id', { id })
      .andWhere(
        new Brackets((qbWhere) => {
          qbWhere.where('project.owner_id = :ownerId', { ownerId: user.id });
          if (user.social_number) {
            qbWhere.orWhere('share.social_number = :social', {
              social: user.social_number,
            });
          }
        }),
      )
      .andWhere('project.active = :active', { active: true })
      .distinct(true);

    return qb.getOne();
  }

  private async ensureOwnerAccess(projectId: number, user: any) {
    if (!user?.id) throw new ForbiddenException('project.forbidden');
    const project = await this.repo.findOne({
      where: { id: projectId, active: true },
      relations: ['owner'],
    });
    if (!project) throw new NotFoundException('project.not_found');
    if (project.owner_id !== user.id) {
      throw new ForbiddenException('project.forbidden');
    }
    return project;
  }
}
