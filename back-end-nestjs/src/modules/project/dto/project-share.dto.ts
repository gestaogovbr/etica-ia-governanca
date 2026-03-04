import { IsNotEmpty, IsString, Length } from 'class-validator';

export class ProjectShareDto {
  @IsNotEmpty()
  @IsString()
  @Length(5, 14)
  social_number: string;
}
