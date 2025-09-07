import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsDecimal, IsPositive } from 'class-validator';

export class CreateDoctorDto {
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

  @ApiProperty({ description: 'Consultation fee' })
  @IsDecimal({ decimal_digits: '2' })
  @IsPositive()
  consultationFee: number;

  @ApiProperty({ description: 'User ID reference' })
  @IsNumber()
  userId: number;
}


