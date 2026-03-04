import { PartialType } from '@nestjs/mapped-types';
import { CreateActorDto } from './create-actor.dto';

export class UpdateActorDto extends PartialType(CreateActorDto) {}
