import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsObject,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDoctorProfileDto {
  @ApiProperty({ description: 'Doctor bio/description', required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ description: 'Doctor profile image URL', required: false })
  @IsOptional()
  @IsString()
  profileImage?: string;

  @ApiProperty({ description: 'Consultation fee', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  consultationFee?: number;

  @ApiProperty({
    description: 'Available days',
    required: false,
    example: ['Monday', 'Tuesday', 'Wednesday'],
  })
  @IsOptional()
  @IsArray()
  availableDays?: string[];

  @ApiProperty({
    description: 'General available time start',
    required: false,
    example: '09:00',
  })
  @IsOptional()
  @IsString()
  generalAvailableStart?: string;

  @ApiProperty({
    description: 'General available time end',
    required: false,
    example: '17:00',
  })
  @IsOptional()
  @IsString()
  generalAvailableEnd?: string;

  @ApiProperty({
    description: 'Default consultation duration in minutes',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(15)
  defaultConsultationDuration?: number;

  @ApiProperty({
    description: 'Services provided',
    required: false,
    example: ['General Consultation', 'Health Checkup'],
  })
  @IsOptional()
  @IsArray()
  services?: string[];

  @ApiProperty({ description: 'Contact information', required: false })
  @IsOptional()
  @IsObject()
  contactInfo?: object;
}
