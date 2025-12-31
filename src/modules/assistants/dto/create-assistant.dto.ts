import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsInt, IsOptional, IsString, Min } from 'class-validator';

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
}
