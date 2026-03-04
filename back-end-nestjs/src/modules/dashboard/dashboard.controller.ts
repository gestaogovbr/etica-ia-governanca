import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiInternalServerErrorResponse, ApiOkResponse, ApiOperation, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { InternalServerError, UnauthorizedError } from 'src/shared/config/swagger/responses/errors';
import { DashboardSuccess } from 'src/shared/config/swagger/responses/general';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
@ApiBearerAuth("JWT-auth")
@ApiUnauthorizedResponse(UnauthorizedError)
@ApiInternalServerErrorResponse(InternalServerError)
export class DashboardController {
  constructor(private readonly service: DashboardService) {}
  
  @ApiOperation({ summary: 'Get dashboard data' })
  @Get()
  @ApiOkResponse(DashboardSuccess)
  getDashboard() {
    return this.service.getDashboard();
  }
}
