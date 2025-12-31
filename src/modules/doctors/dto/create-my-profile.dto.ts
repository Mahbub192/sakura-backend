import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class CreateMyDoctorProfileDto {
  @ApiProperty({ description: 'Doctor full name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Doctor specialization' })
  @IsString()
  specialization: string;

  @ApiProperty({ description: 'Years of experience', required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  experience?: number;

  @ApiProperty({ description: 'Medical license number' })
  @IsString()
  licenseNumber: string;

  @ApiProperty({ description: 'Doctor qualification' })
  @IsString()
  qualification: string;

  @ApiProperty({ description: 'Doctor bio/description', required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ description: 'Doctor profile image URL', required: false })
  @IsOptional()
  @IsString()
  profileImage?: string;

  @ApiProperty({ description: 'Consultation fee' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  consultationFee: number;

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
