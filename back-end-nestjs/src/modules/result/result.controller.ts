import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ResultService } from './result.service';
import { UpsertResultDto } from './dto/upsert-result.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiBody, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOperation, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ResultCreateNotFoundError, resultDtoSchema } from 'src/shared/config/swagger/responses/result';
import { InternalServerError, UnauthorizedError } from 'src/shared/config/swagger/responses/errors';


@ApiBearerAuth("JWT-auth")
@ApiUnauthorizedResponse(UnauthorizedError)
@ApiInternalServerErrorResponse(InternalServerError)
@UseGuards(JwtAuthGuard)
@Controller('results')
export class ResultController {
  constructor(private readonly service: ResultService) {}

  @ApiOperation({ summary: 'Create or update a result' })
  @ApiBody({ schema: resultDtoSchema })
  @ApiNotFoundResponse({example : ResultCreateNotFoundError.example, description: "Response or Project not found"})
  @Post()
  upsert(@Body() dto: UpsertResultDto) {
    return this.service.upsert(dto);
  }

  @ApiOperation({ summary: 'Get a result by response ID' })
  @ApiNotFoundResponse(ResultCreateNotFoundError)
  @Get(':responseId')
  findByResponse(@Param('responseId', ParseIntPipe) responseId: number) {
    const result = this.service.findByResponse(responseId);
    return result;
  }
}
