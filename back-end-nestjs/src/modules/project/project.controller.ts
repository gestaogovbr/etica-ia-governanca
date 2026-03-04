/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// src/modules/project/project.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectShareDto } from './dto/project-share.dto';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiForbiddenResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ProjectCreateSuccess, ProjectDeleteSuccess, ProjectForbiddenError, ProjectGetMultipleSuccess, ProjectGetSingleSuccess, ProjectNotFoundError, ProjectShareCreateSuccess, ProjectShareDeleteSuccess, ProjectShareGetSuccess, ProjectUpdateSuccess } from 'src/shared/config/swagger/responses/projects';
import { InternalServerError, UnauthorizedError } from 'src/shared/config/swagger/responses/errors';


@ApiBearerAuth("JWT-auth")
@ApiUnauthorizedResponse(UnauthorizedError)
@ApiInternalServerErrorResponse(InternalServerError)
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectController {
  constructor(private readonly service: ProjectService) { }
  
  @Post()
  @ApiOperation({ summary: "Create a new project" })
  @ApiCreatedResponse(ProjectCreateSuccess)
  create(@Body() dto: CreateProjectDto, @Req() req: any) {
    return this.service.create(dto, req.user);
  }

  @Get()
  @ApiOperation({ summary: "Retrieve all projects for the authenticated user" })
  @ApiOkResponse(ProjectGetMultipleSuccess)
  findAll(@Req() req: any) {
    return this.service.findAll(req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: "Retrieve a single project by its ID for the authenticated user" })
  @ApiOkResponse(ProjectGetSingleSuccess)
  @ApiForbiddenResponse(ProjectForbiddenError)
  @ApiNotFoundResponse(ProjectNotFoundError)
  findOne(@Param('id') id: number, @Req() req: any) {
    return this.service.findOne(Number(id), req.user);
  }

  @Put(':id')
  @ApiOperation({ summary: "Update an existing project by its ID" })
  @ApiBody({ type: CreateProjectDto })
  @ApiOkResponse(ProjectUpdateSuccess)
  @ApiForbiddenResponse(ProjectForbiddenError)
  @ApiNotFoundResponse(ProjectNotFoundError)
  update(@Param('id') id: number, @Body() dto: UpdateProjectDto, @Req() req: any) {
    return this.service.update(Number(id), dto, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: "Delete a project by its ID" })
  @ApiOkResponse(ProjectDeleteSuccess)
  @ApiForbiddenResponse(ProjectForbiddenError)
  @ApiNotFoundResponse(ProjectNotFoundError)
  remove(@Param('id') id: number, @Req() req: any) {
    return this.service.remove(Number(id), req.user);
  }

  @Get(':id/shares')
  @ApiOperation({ summary: "List all shares for a specific project" })
  @ApiForbiddenResponse(ProjectForbiddenError)
  @ApiNotFoundResponse(ProjectNotFoundError)
  @ApiOkResponse(ProjectShareGetSuccess)
  listShares(@Param('id') id: number, @Req() req: any) {
    return this.service.listShares(Number(id), req.user);
  }

  @Post(':id/shares')
  @ApiOperation({ summary: "Add a new share to a specific project" })
  @ApiForbiddenResponse(ProjectForbiddenError)
  @ApiNotFoundResponse(ProjectNotFoundError)
  @ApiCreatedResponse(ProjectShareCreateSuccess)
  addShare(
    @Param('id') id: number,
    @Body() dto: ProjectShareDto,
    @Req() req: any,
  ) {
    return this.service.addShare(Number(id), dto, req.user);
  }

  @Delete(':id/shares/:shareId')
  @ApiOperation({ summary: "Remove a share from a specific project" })
  @ApiForbiddenResponse(ProjectForbiddenError)
  @ApiNotFoundResponse(ProjectNotFoundError)
  @ApiOkResponse(ProjectShareDeleteSuccess)
  removeShare(
    @Param('id') id: number,
    @Param('shareId') shareId: number,
    @Req() req: any,
  ) {
    return this.service.removeShare(Number(id), Number(shareId), req.user);
  }
}
