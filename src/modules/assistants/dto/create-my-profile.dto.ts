import { IsString, IsOptional, IsInt, Min, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMyAssistantProfileDto {
  @ApiProperty({ description: 'Assistant full name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Assistant phone number' })
  @IsString()
  phone: string;

  @ApiProperty({ description: 'Doctor ID to work under' })
  @IsNumber()
  doctorId: number;

  @ApiProperty({ description: 'Assistant qualification', required: false })
  @IsOptional()
  @IsString()
  qualification?: string;

  @ApiProperty({ description: 'Years of experience', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  experience?: number;
}

