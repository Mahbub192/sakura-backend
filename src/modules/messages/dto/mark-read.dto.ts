import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class MarkReadDto {
  @ApiProperty({ description: 'Thread ID' })
  @IsString()
  threadId: string;
}

