import { PartialType } from '@nestjs/mapped-types';
import { CreateClassificationLevelDto } from './create-classification-level.dto';

export class UpdateClassificationLevelDto extends PartialType(CreateClassificationLevelDto) {}
