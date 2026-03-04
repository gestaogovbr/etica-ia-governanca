import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  /**
   * Email do usuário
   * @example nome@email.com
   */
  @IsEmail() email: string;

  /**
   * Senha do usuário
   * @example Abc@123$
   */
  @IsString() @MinLength(3) password: string;
}
