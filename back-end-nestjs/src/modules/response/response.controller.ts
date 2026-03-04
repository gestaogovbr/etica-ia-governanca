import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ResponseService } from './response.service';
import { CreateResponseDto } from './dto/create-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InternalServerError, UnauthorizedError } from 'src/shared/config/swagger/responses/errors';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ResponseBadRequestError, ResponseCreateSuccess, ResponseGetMultipleSuccess, ResponseGetSingleSuccess, ResponseNotFoundError } from 'src/shared/config/swagger/responses/responses';

@ApiBearerAuth("JWT-auth")
@ApiUnauthorizedResponse(UnauthorizedError)
@ApiInternalServerErrorResponse(InternalServerError)
@UseGuards(JwtAuthGuard)
@Controller('responses')
export class ResponseController {
  constructor(private readonly service: ResponseService) { }

  @ApiOperation({ summary: 'Create a new response to a question in a project and return the created response' })
  @ApiCreatedResponse(ResponseCreateSuccess)
  @ApiBadRequestResponse(ResponseBadRequestError)
  @ApiNotFoundResponse({example: ResponseNotFoundError.example, description: "Project or Question not found"})
  @Post()
  create(@Body() dto: CreateResponseDto) {
    return this.service.create(dto);
  }

  @ApiOperation({ summary: 'Get all responses, with optional filtering by project ID and status' })
  @ApiQuery({ name: 'projectId', required: false, type: Number, description: 'Filter by project ID' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by status' })
  @ApiOkResponse(ResponseGetMultipleSuccess)
  @Get()
  findAll(
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
  ) {
    const parsedProjectId = projectId ? Number(projectId) : undefined;
    const filters = {
      projectId:
        typeof parsedProjectId === 'number' && !Number.isNaN(parsedProjectId)
          ? parsedProjectId
          : undefined,
      status: status?.toString().toUpperCase(),
    };
    return this.service.findAll(filters);
  }

  @ApiOperation({ summary: 'Get a response by its ID' })
  @ApiNotFoundResponse(ResponseNotFoundError)
  @ApiOkResponse(ResponseGetSingleSuccess)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }
}
