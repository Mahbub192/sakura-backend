import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'User phone number' })
  @IsString()
  phone: string;

  @ApiProperty({ description: 'User password' })
  @IsString()
  password: string;
}



