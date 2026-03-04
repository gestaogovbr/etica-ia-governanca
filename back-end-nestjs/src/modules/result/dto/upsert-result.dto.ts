import { IsNumber, IsObject } from 'class-validator';

export class UpsertResultDto {
  @IsNumber()
  response_id: number;

  @IsObject()
  summary: Record<string, any>;
}
