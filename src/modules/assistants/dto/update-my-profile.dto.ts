import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMyAssistantProfileDto {
  @ApiProperty({ description: 'Assistant full name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

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

