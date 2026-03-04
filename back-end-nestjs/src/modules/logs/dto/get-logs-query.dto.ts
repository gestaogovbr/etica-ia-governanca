import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class GetLogsQueryDto {
  @IsOptional() @IsString() user?: string; // email ou id
  @IsOptional() @IsString() route?: string;
  @IsOptional() @IsString() action?: string; // login|create|update|delete|logout|other
  @IsOptional() @IsString() module?: string; // admin|session|question|auth|...

  @IsOptional() @IsString() from?: string; // ISO date
  @IsOptional() @IsString() to?: string; // ISO date

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number; // default 100
}
