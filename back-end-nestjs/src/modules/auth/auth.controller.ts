import { Body, Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiBearerAuth, ApiCreatedResponse, ApiInternalServerErrorResponse, ApiOkResponse, ApiOperation, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { LoginProfileSuccess, LoginSuccess } from 'src/shared/config/swagger/responses/general';
import { InternalServerError, UnauthorizedError, UnauthorizedWithMessageError } from 'src/shared/config/swagger/responses/errors';

@Controller('auth')
@ApiInternalServerErrorResponse(InternalServerError)
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @ApiOperation({ summary: 'User login with email and password' })
  @Post('login')
  @ApiCreatedResponse(LoginSuccess)
  @ApiUnauthorizedResponse(UnauthorizedWithMessageError)
  login(@Body() dto: LoginDto, @Req() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.authService.login(dto, req);
  }

  // exemplo de rota protegida
  @ApiOperation({ summary: 'Get the profile of the logged-in user' })
  @UseGuards(JwtAuthGuard)
  @Get('login')
  @ApiBearerAuth("JWT-auth")
  @ApiUnauthorizedResponse(UnauthorizedError)
  @ApiOkResponse(LoginProfileSuccess)
  me(@Req() req: any) {
    return req.user; // vindo do validate() da strategy
  }
}



