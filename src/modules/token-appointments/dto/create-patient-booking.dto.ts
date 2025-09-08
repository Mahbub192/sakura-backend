import { IsString, IsEmail, IsInt, Min, IsOptional, IsBoolean, IsNumber, IsDateString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePatientBookingDto {
  @ApiProperty({ description: 'Patient full name' })
  @IsString()
  patientName: string;

  @ApiProperty({ description: 'Patient email address' })
  @IsEmail()
  patientEmail: string;

  @ApiProperty({ description: 'Patient phone number' })
  @IsString()
  patientPhone: string;

  @ApiProperty({ description: 'Patient age' })
  @IsInt()
  @Min(0)
  patientAge: number;

  @ApiProperty({ description: 'Patient gender', example: 'Male' })
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

  @ApiProperty({ description: 'Doctor fee for this appointment' })
  @IsNumber()
  @Min(0)
  doctorFee: number;

  @ApiProperty({ description: 'Doctor ID' })
  @IsInt()
  @Min(1)
  doctorId: number;

  @ApiProperty({ description: 'Appointment slot ID' })
  @IsInt()
  @Min(1)
  appointmentId: number;

  @ApiProperty({ description: 'Appointment date', example: '2024-01-15' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Appointment time', example: '10:30' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'time must be in HH:MM format',
  })
  time: string;

  @ApiProperty({ description: 'Reason for visit', required: false })
  @IsOptional()
  @IsString()
  reasonForVisit?: string;

  @ApiProperty({ description: 'Special notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
