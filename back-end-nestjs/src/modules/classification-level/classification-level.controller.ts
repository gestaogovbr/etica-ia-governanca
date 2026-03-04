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
import { ClassificationLevelService } from './classification-level.service';
import { CreateClassificationLevelDto } from './dto/create-classification-level.dto';
import { UpdateClassificationLevelDto } from './dto/update-classification-level.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InternalServerError, UnauthorizedError } from 'src/shared/config/swagger/responses/errors';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiNotModifiedResponse, ApiOkResponse, ApiOperation, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ClassificacaoDeletedSuccess, ClassificationBadRequestError, ClassificationNotFoundError } from 'src/shared/config/swagger/responses/classification';


@ApiBearerAuth("JWT-auth")
@ApiUnauthorizedResponse(UnauthorizedError)
@ApiInternalServerErrorResponse(InternalServerError)
@UseGuards(JwtAuthGuard)
@Controller('classification-levels')
export class ClassificationLevelController {
  constructor(private readonly service: ClassificationLevelService) { }

  @ApiOperation({ summary: 'Get all classification levels' })
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @ApiOperation({ summary: 'Create a new classification level' })
  @Post()
  create(@Body() dto: CreateClassificationLevelDto) {
    return this.service.create(dto);
  }

  @ApiOperation({ summary: 'Update a classification level by its ID' })
  @ApiBody({ type: CreateClassificationLevelDto })
  @ApiBadRequestResponse(ClassificationBadRequestError)
  @ApiNotFoundResponse(ClassificationNotFoundError)
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClassificationLevelDto,
  ) {
    return this.service.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete a classification level by its ID' })
  @ApiOkResponse(ClassificacaoDeletedSuccess)
  @ApiNotFoundResponse(ClassificationNotFoundError)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
