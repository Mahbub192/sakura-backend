import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsString,
  IsNumber,
  IsPositive,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { AppointmentStatus } from '../../../entities/appointment.entity';

export class CreateAppointmentDto {
  @ApiProperty({ description: 'Doctor ID reference' })
  @IsNumber()
  doctorId: number;

  @ApiProperty({ description: 'Clinic ID reference' })
  @IsNumber()
  clinicId: number;

  @ApiProperty({ description: 'Appointment date (YYYY-MM-DD)' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Appointment start time (HH:MM)' })
  @IsString()
  startTime: string;

  @ApiProperty({ description: 'Appointment end time (HH:MM)' })
  @IsString()
  endTime: string;

  @ApiProperty({ description: 'Slot duration in minutes' })
  @IsNumber()
  @IsPositive()
  duration: number;

  @ApiProperty({
    description: 'Appointment status',
    enum: AppointmentStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiProperty({
    description: 'Maximum number of patients for this slot',
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  maxPatients?: number;
}
