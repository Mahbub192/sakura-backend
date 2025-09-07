import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional } from 'class-validator';

export class CreateClinicDto {
  @ApiProperty({ description: 'Clinic name' })
  @IsString()
  locationName: string;

  @ApiProperty({ description: 'Clinic address' })
  @IsString()
  address: string;

  @ApiProperty({ description: 'Clinic city' })
  @IsString()
  city: string;

  @ApiProperty({ description: 'Clinic state/province' })
  @IsString()
  state: string;

  @ApiProperty({ description: 'Clinic postal code' })
  @IsString()
  postalCode: string;

  @ApiProperty({ description: 'Clinic phone number' })
  @IsString()
  phone: string;

  @ApiProperty({ description: 'Clinic email', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;
}


