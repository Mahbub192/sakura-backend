import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

// Exclude phone from updates since it's the primary key
export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['phone'] as const)) {}



