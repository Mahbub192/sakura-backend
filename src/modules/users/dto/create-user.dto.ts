import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { RoleType } from '../../../entities/role.entity';

export class CreateUserDto {
  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User first name' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'User last name' })
  @IsString()
  lastName: string;

  @ApiProperty({ description: 'User phone number (Primary Key)' })
  @IsString()
  phone: string;

  @ApiProperty({ description: 'User role', enum: RoleType })
  @IsEnum(RoleType)
  role: RoleType;

  @ApiProperty({ description: 'Account activation status', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
