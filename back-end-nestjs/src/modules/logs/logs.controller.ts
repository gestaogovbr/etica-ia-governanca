import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { LogsService } from './logs.service';
import { GetLogsQueryDto } from './dto/get-logs-query.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InternalServerError, UnauthorizedError } from 'src/shared/config/swagger/responses/errors';
import { ApiBearerAuth, ApiInternalServerErrorResponse, ApiOkResponse, ApiOperation, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { response } from 'express';
import { LogsGetSuccess } from 'src/shared/config/swagger/responses/general';


@ApiBearerAuth("JWT-auth")
@ApiUnauthorizedResponse(UnauthorizedError)
@ApiInternalServerErrorResponse(InternalServerError)
@UseGuards(JwtAuthGuard)
@Controller('logs')
export class LogsController {
  constructor(private readonly logs: LogsService) { }

  @ApiOperation({ summary: 'Get logs with optional filtering' })
  @ApiOkResponse(LogsGetSuccess)
  @Get()
  list(@Query() q: GetLogsQueryDto) {
    return this.logs.search(q);
  }
}
