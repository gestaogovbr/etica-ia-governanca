import { ApiCreatedResponse } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GovbrLoginDto {
  /**
   * Token de autenticação recebido após o login bem-sucedido.
   * @example mock
   */
  @IsOptional()
  @IsString()
  token?: string;
}
