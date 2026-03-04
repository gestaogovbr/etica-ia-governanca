import { IsOptional, IsString } from 'class-validator';

export class GovbrAuthorizeQueryDto {
  @IsOptional()
  @IsString()
  origin?: string;
}
