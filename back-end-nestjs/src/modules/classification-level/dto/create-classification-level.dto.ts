import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateClassificationLevelDto {
  @IsString()
  @MaxLength(60)
  level_key: string;

  @IsInt()
  display_order: number;

  @IsString()
  @MaxLength(120)
  title: string;

  @IsString()
  @MaxLength(120)
  subtitle: string;

  @IsString()
  description: string;

  @IsString()
  advice: string;

  @IsOptional()
  @IsNumber()
  max_score?: number | null;

  @IsOptional()
  @IsNumber()
  max_percentage?: number | null;

  @IsOptional()
  @IsNumber()
  critical_trigger_threshold?: number | null;
}
