import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CreateThreadDto {
  @ApiProperty({ description: 'Participant user phone number (the other user in the conversation)' })
  @IsString()
  participantPhone: string;
}

