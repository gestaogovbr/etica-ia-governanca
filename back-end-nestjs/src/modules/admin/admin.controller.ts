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
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiBody, ApiConflictResponse, ApiCreatedResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AdminConflicError, AdminConflicErrorPut, AdminCreateSuccess, AdminDeleteSuccess, AdminGetMultipleSuccess, AdminGetSingleSuccess, AdminNotFoundError, AdminNotFoundOneError, AdminUpdateSuccess, createAdminDto } from 'src/shared/config/swagger/responses/admin';
import { InternalServerError, UnauthorizedError } from 'src/shared/config/swagger/responses/errors';


@ApiBearerAuth("JWT-auth")
@ApiUnauthorizedResponse(UnauthorizedError)
@ApiInternalServerErrorResponse(InternalServerError)
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly service: AdminService) { }

  @ApiOperation({ summary: 'Create a new admin user' })
  @ApiBody({ schema: createAdminDto })
  @ApiCreatedResponse(AdminCreateSuccess)
  @ApiConflictResponse(AdminConflicError)
  @Post()
  create(@Body() dto: CreateAdminDto) {
    return this.service.create(dto);
  }

  @ApiOperation({ summary: 'Get all admin users' })
  @ApiOkResponse(AdminGetMultipleSuccess)
  @Get()
  findAll() {
    return this.service.findAll();
  }
  
  @ApiOperation({ summary: 'Update an admin user by its ID' })
  @ApiBody({ schema: createAdminDto })
  @ApiOkResponse(AdminUpdateSuccess)
  @ApiNotFoundResponse(AdminNotFoundError)
  @ApiConflictResponse(AdminConflicErrorPut)
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAdminDto) {
    return this.service.update(id, dto);
  }

  @ApiOperation({ summary: 'Get an admin user by its ID' })
  @ApiOkResponse(AdminGetSingleSuccess)
  @ApiNotFoundResponse(AdminNotFoundOneError)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Soft delete an admin user by its ID' })
  @ApiOkResponse(AdminDeleteSuccess)
  @ApiNotFoundResponse(AdminNotFoundOneError)
  @Delete(':id')
  softDelete(@Param('id', ParseIntPipe) id: number) {
    return this.service.softDelete(id);
  }
}
