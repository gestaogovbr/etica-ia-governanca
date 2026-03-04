import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { QuestionService } from './question.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { InternalServerError, UnauthorizedError } from 'src/shared/config/swagger/responses/errors';
import { fullQuestionSchema, QuestionCreateSuccess, QuestionDeleteSuccess, QuestionGetMultipleSuccess, QuestionGetMultipleWithSessionSuccess, QuestionGetSingleSuccess, QuestionNotFoundError, QuestionPutSuccess } from 'src/shared/config/swagger/responses/questions';

@ApiBearerAuth("JWT-auth")
@ApiUnauthorizedResponse(UnauthorizedError)
@ApiInternalServerErrorResponse(InternalServerError)
@UseGuards(JwtAuthGuard)
@Controller('questions')
export class QuestionController {
  constructor(private service: QuestionService) { }

  @ApiOperation({ summary: 'Create a new question for an session' })
  @ApiBody({ schema: { type: 'object', properties: fullQuestionSchema } })
  @ApiCreatedResponse(QuestionCreateSuccess)
  @Post() create(@Body() dto: CreateQuestionDto) {
    return this.service.create(dto);
  }

  @ApiOperation({ summary: 'Get all questions' })
  @ApiOkResponse(QuestionGetMultipleSuccess)
  @Get() findAll() {
    return this.service.findAll();
  }

  @ApiOperation({ summary: 'Update a question by its ID' })
  @ApiBody({ schema: { type: 'object', properties: fullQuestionSchema } })
  @ApiOkResponse(QuestionPutSuccess)
  @ApiNotFoundResponse(QuestionNotFoundError)
  @Put(':id') update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.service.update(id, dto);
  }

  @ApiOperation({ summary: 'Get a question by its ID' })
  @ApiOkResponse(QuestionGetSingleSuccess)
  @ApiNotFoundResponse(QuestionNotFoundError)
  @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Update a question by its ID, saving previous version and increasing version counter' })
  @ApiBody({ schema: { type: 'object', properties: fullQuestionSchema } })
  @ApiOkResponse(QuestionPutSuccess)
  @ApiNotFoundResponse(QuestionNotFoundError)
  @Put(':id/version') updateWithVersioning(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.service.updateWithVersioning(id, dto);
  }

  @ApiOperation({ summary: 'List all versions of a question by its ID' })
  @ApiOkResponse(QuestionGetMultipleWithSessionSuccess)
  @Get(':id/versions') listVersions(@Param('id', ParseIntPipe) id: number) {
    return this.service.listVersions(id);
  }

  @ApiOperation({ summary: 'Soft delete a question by its ID' })
  @ApiOkResponse(QuestionDeleteSuccess)
  @ApiNotFoundResponse(QuestionNotFoundError)
  @Delete(':id') softDelete(@Param('id', ParseIntPipe) id: number) {
    return this.service.softDelete(id);
  }
}
