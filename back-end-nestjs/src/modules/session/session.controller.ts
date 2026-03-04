import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SessionService } from './session.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Request } from 'express';
import { ApiBearerAuth, ApiBody, ApiConflictResponse, ApiCreatedResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { InternalServerError, UnauthorizedError } from 'src/shared/config/swagger/responses/errors';
import { SessionConflictError, SessionCreateSuccess, SessionDeleteSuccess, SessionGetMultipleSuccess, SessionGetSingleSuccess, SessionNotFoundError, SessionUpdateSuccess } from 'src/shared/config/swagger/responses/sessions';


@ApiBearerAuth("JWT-auth")
@ApiInternalServerErrorResponse(InternalServerError)
@ApiUnauthorizedResponse(UnauthorizedError)
@UseGuards(JwtAuthGuard)
@Controller('sessions')
export class SessionController {
  constructor(private service: SessionService) {}

  @ApiOperation({ summary: 'Create a new session of questions (created before its questions)' })
  @ApiCreatedResponse(SessionCreateSuccess)
  @ApiConflictResponse(SessionConflictError)
  @Post() create(@Body() dto: CreateSessionDto) {
    return this.service.create(dto);
  }
  
  @ApiOperation({ summary: 'Get all sessions' })
  @ApiOkResponse(SessionGetMultipleSuccess)
  @Get() findAll(@Req() req: Request) {
    const isAdmin = !!(req as any)?.user?.admin;
    return this.service.findAll(isAdmin);
  }
  
  @ApiOperation({ summary: 'Get a session by its ID' })
  @ApiOkResponse(SessionGetSingleSuccess)
  @ApiNotFoundResponse(SessionNotFoundError)
  @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Update a session by its ID' })
  @ApiBody({ type: CreateSessionDto })
  @ApiOkResponse(SessionUpdateSuccess)
  @ApiNotFoundResponse(SessionNotFoundError)
  @ApiConflictResponse(SessionConflictError)
  @Put(':id') update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSessionDto,
  ) {
    return this.service.update(id, dto);
  }

  @ApiOperation({ summary: 'Soft delete a session by its ID' })
  @ApiOkResponse(SessionDeleteSuccess)
  @ApiNotFoundResponse(SessionNotFoundError)
  @Delete(':id') softDelete(@Param('id', ParseIntPipe) id: number) {
    return this.service.softDelete(id);
  }
}
