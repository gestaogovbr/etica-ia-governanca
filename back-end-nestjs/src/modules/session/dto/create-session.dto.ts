import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class TriageLevelDto {
  @IsString()
  key: string;

  @IsString()
  label: string;

  @IsNumber()
  min_score: number;

  @IsOptional()
  @IsString()
  next_session_code?: string;
}

class TriageConfigDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TriageLevelDto)
  levels: TriageLevelDto[];
}

export class CreateSessionDto {
  @IsString()
  @MaxLength(120)
  @IsNotEmpty()
  code: string;

  @IsString()
  @MaxLength(200)
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsInt()
  priority: number;

  @IsString()
  @IsNotEmpty()
  ethical_principles: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean = true;

  @IsOptional()
  @IsBoolean()
  is_triage?: boolean = false;

  @IsOptional()
  @IsBoolean()
  is_testing?: boolean = false;

  @IsOptional()
  @IsString()
  next_session_code?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TriageConfigDto)
  triage_config?: TriageConfigDto | null;
}

export { TriageConfigDto, TriageLevelDto };
