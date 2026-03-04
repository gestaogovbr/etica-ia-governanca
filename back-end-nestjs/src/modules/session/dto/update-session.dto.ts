import { PartialType } from '@nestjs/mapped-types';
import { CreateSessionDto } from './create-session.dto';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TriageConfigDto } from './create-session.dto';

export class UpdateSessionDto extends PartialType(CreateSessionDto) {
  @IsOptional()
  @ValidateNested()
  @Type(() => TriageConfigDto)
  triage_config?: TriageConfigDto | null;
}
