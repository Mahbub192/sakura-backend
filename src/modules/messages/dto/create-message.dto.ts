import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { MessageChannel, MessageType } from '../../../entities/message.entity';

export class CreateMessageDto {
  @ApiProperty({ description: 'Recipient user phone number' })
  @IsString()
  recipientPhone: string;

  @ApiProperty({ description: 'Message content' })
  @IsString()
  @MinLength(1)
  content: string;

  @ApiProperty({ description: 'Message subject/title', required: false })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty({
    description: 'Message type',
    enum: MessageType,
    default: MessageType.TEXT,
    required: false,
  })
  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;

  @ApiProperty({
    description: 'Message channel',
    enum: MessageChannel,
    default: MessageChannel.IN_APP,
    required: false,
  })
  @IsOptional()
  @IsEnum(MessageChannel)
  channel?: MessageChannel;

  @ApiProperty({ description: 'Attachment URL', required: false })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}
