import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsDateString, IsOptional, IsEmail, IsPositive, IsBoolean } from 'class-validator';

export class BookAppointmentDto {
  @ApiProperty({ description: 'Patient full name' })
  @IsString()
  patientName: string;

  @ApiProperty({ description: 'Patient email' })
  @IsEmail()
  patientEmail: string;

  @ApiProperty({ description: 'Patient phone number' })
  @IsString()
  patientPhone: string;

  @ApiProperty({ description: 'Patient age' })
  @IsNumber()
  @IsPositive()
  patientAge: number;

  @ApiProperty({ description: 'Patient gender' })
  @IsString()
  patientGender: string;

  @ApiProperty({ description: 'Patient location/address', required: false })
  @IsOptional()
  @IsString()
  patientLocation?: string;

  @ApiProperty({ description: 'Is this an old patient?', default: false })
  @IsOptional()
  @IsBoolean()
  isOldPatient?: boolean;

  @ApiProperty({ description: 'Appointment slot ID reference' })
  @IsNumber()
  appointmentId: number;

  @ApiProperty({ description: 'Reason for visit', required: false })
  @IsOptional()
  @IsString()
  reasonForVisit?: string;

  @ApiProperty({ description: 'Special notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

