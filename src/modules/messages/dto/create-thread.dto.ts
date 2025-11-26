import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CreateThreadDto {
  @ApiProperty({ description: 'Participant user ID (the other user in the conversation)' })
  @IsNumber()
  participantId: number;
}

