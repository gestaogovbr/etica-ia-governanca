import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreateAdminDto {
  @IsString()
  @Length(3, 150)
  name: string;

  @IsString()
  social_number: string;

  @IsString()
  position: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean = true;
}
