import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  responsible: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  last_pretriagem_level?: string;

  @IsOptional()
  @IsNumber()
  last_pretriagem_score?: number;
}
