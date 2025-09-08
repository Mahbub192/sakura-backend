import { IsString, IsEmail, IsOptional, IsInt, Min, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAssistantDto {
  @ApiProperty({ description: 'Assistant full name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Assistant email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Assistant phone number' })
  @IsString()
  phone: string;

  @ApiProperty({ description: 'Assistant qualification', required: false })
  @IsOptional()
  @IsString()
  qualification?: string;

  @ApiProperty({ description: 'Years of experience', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  experience?: number;

  @ApiProperty({ description: 'Doctor ID to associate with' })
  @IsInt()
  @Min(1)
  doctorId: number;
}
