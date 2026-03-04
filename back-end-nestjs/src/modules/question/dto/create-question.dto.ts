import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  MaxLength,
  IsString,
} from 'class-validator';

export class CreateQuestionDto {
  @IsNumber({}, { message: 'common.fieldsNotNull' })
  session_id: number;

  @IsString({ message: 'common.fieldsNotNull' })
  @MaxLength(120)
  @IsNotEmpty({ message: 'common.fieldsNotNull' })
  code: string;

  @IsString()
  @IsNotEmpty({ message: 'common.fieldsNotNull' })
  text: string;

  @IsString()
  @IsNotEmpty({ message: 'common.fieldsNotNull' })
  type: string;

  @IsNumber()
  weights: number;

  @IsOptional()
  @IsNumber()
  order?: number = 0;

  @IsOptional()
  options?: any;

  @IsOptional()
  actors?: any;

  @IsString()
  @IsOptional()
  conditional_value?: string;

  @IsString()
  @IsOptional()
  conditional_field?: string;

  @IsOptional()
  @IsBoolean()
  is_critical?: boolean = false;

  @IsOptional()
  @IsBoolean()
  active?: boolean = true;
}
