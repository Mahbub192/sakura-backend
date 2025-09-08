import { IsString, IsInt, Min, IsDateString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAppointmentScheduleDto {
  @ApiProperty({ description: 'Clinic ID where appointments will be held' })
  @IsInt()
  @Min(1)
  clinicId: number;

  @ApiProperty({ description: 'Date for the appointment schedule', example: '2024-01-15' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Start time for appointments', example: '09:00' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:MM format',
  })
  startTime: string;

  @ApiProperty({ description: 'End time for appointments', example: '17:00' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime must be in HH:MM format',
  })
  endTime: string;

  @ApiProperty({ description: 'Duration of each appointment slot in minutes', example: 30 })
  @IsInt()
  @Min(15)
  slotDuration: number;

  @ApiProperty({ description: 'Number of patients per slot', example: 1 })
  @IsInt()
  @Min(1)
  patientPerSlot: number;
}
