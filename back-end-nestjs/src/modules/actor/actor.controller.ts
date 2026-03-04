import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ActorService } from './actor.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateActorDto } from './dto/create-actor.dto';
import { UpdateActorDto } from './dto/update-actor.dto';
import { ApiBearerAuth, ApiBody, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { InternalServerError, NotFoundExample, UnauthorizedError } from 'src/shared/config/swagger/responses/errors';

const NotFoundResponse = {
  description: 'Actor not found.',
  schema: {
    type: 'object',
    example: { ...NotFoundExample, message: 'actor.not_found' }
  }
}

@ApiBearerAuth("JWT-auth")
@ApiUnauthorizedResponse(UnauthorizedError)
@ApiInternalServerErrorResponse(InternalServerError)
@UseGuards(JwtAuthGuard)
@Controller('actors')
export class ActorController {
  constructor(private readonly service: ActorService) { }

  @ApiOperation({ summary: 'Create a new actor' })
  @Post()
  create(@Body() dto: CreateActorDto) {
    return this.service.create(dto);
  }

  @ApiOperation({ summary: 'Get all actors, with optional filtering by active status' })
  @Get()
  findAll(@Query('active') active?: string) {
    return this.service.findAll(active);
  }

  @ApiOperation({ summary: 'Get an actor by its ID' })
  @Get(':id')
  @ApiNotFoundResponse(NotFoundResponse)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Update an actor by its ID' })
  @ApiBody({ type: CreateActorDto })
  @ApiNotFoundResponse(NotFoundResponse)
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateActorDto,
  ) {
    return this.service.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete an actor by its ID' })
  @ApiOkResponse({ description: 'Actor deleted successfully.', schema: { type: 'object', example: { success: true } } })
  @ApiNotFoundResponse(NotFoundResponse)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
