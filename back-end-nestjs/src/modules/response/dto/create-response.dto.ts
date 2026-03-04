import {
  ArrayNotEmpty,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CreateResponseAnswerDto {
  @IsNumber()
  question_id: number;

  @IsOptional()
  value?: any;
}

class CreateSessionScoreDto {
  @IsNumber()
  session_id: number;

  @IsOptional()
  @IsString()
  session_code?: string;

  @IsOptional()
  @IsString()
  session_name?: string;

  @IsNumber()
  score: number;

  @IsOptional()
  @IsString()
  level?: string;

  @IsOptional()
  meta?: any;
}

export class CreateResponseDto {
  @IsNumber()
  project_id: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  response_id?: number;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateResponseAnswerDto)
  answers: CreateResponseAnswerDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSessionScoreDto)
  session_scores?: CreateSessionScoreDto[];
}
