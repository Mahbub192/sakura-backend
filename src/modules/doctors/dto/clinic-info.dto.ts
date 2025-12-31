import {
  IsString,
  IsOptional,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class OperatingHoursDto {
  @ApiProperty({ description: 'Start time', example: '09:00' })
  @IsString()
  start: string;

  @ApiProperty({ description: 'End time', example: '17:00' })
  @IsString()
  end: string;

  @ApiProperty({ description: 'Is closed on this day' })
  @IsBoolean()
  closed: boolean;
}

export class ClinicInfoDto {
  @ApiProperty({ description: 'Clinic logo URL', required: false })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiProperty({ description: 'Clinic name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Clinic address' })
  @IsString()
  address: string;

  @ApiProperty({ description: 'Clinic phone number' })
  @IsString()
  phone: string;

  @ApiProperty({ description: 'Clinic email' })
  @IsString()
  email: string;

  @ApiProperty({ description: 'Clinic description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Operating hours for each day',
    type: 'object',
    additionalProperties: true,
    example: {
      monday: { start: '09:00', end: '17:00', closed: false },
      tuesday: { start: '09:00', end: '17:00', closed: false },
      wednesday: { start: '09:00', end: '17:00', closed: false },
      thursday: { start: '09:00', end: '17:00', closed: false },
      friday: { start: '09:00', end: '17:00', closed: false },
      saturday: { start: '09:00', end: '17:00', closed: true },
      sunday: { start: '09:00', end: '17:00', closed: true },
    },
  })
  @ValidateNested()
  @Type(() => OperatingHoursDto)
  operatingHours: {
    monday: OperatingHoursDto;
    tuesday: OperatingHoursDto;
    wednesday: OperatingHoursDto;
    thursday: OperatingHoursDto;
    friday: OperatingHoursDto;
    saturday: OperatingHoursDto;
    sunday: OperatingHoursDto;
  };
}
