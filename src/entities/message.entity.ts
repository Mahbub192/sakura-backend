import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  SYSTEM = 'system',
}

export enum MessageChannel {
  SMS = 'SMS',
  EMAIL = 'Email',
  IN_APP = 'In-App',
}

@Entity('messages')
export class Message {
  @ApiProperty({ description: 'Unique message identifier' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Message thread/conversation ID' })
  @Column({ name: 'thread_id', type: 'varchar' })
  threadId: string;

  @ApiProperty({ description: 'Sender user phone number' })
  @Column({ name: 'sender_phone', type: 'varchar', nullable: true })
  senderPhone: string;

  @ApiProperty({ type: () => User, description: 'Sender user' })
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'sender_phone' })
  sender: User;

  @ApiProperty({ description: 'Recipient user phone number' })
  @Column({ name: 'recipient_phone', type: 'varchar', nullable: true })
  recipientPhone: string;

  @ApiProperty({ type: () => User, description: 'Recipient user' })
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'recipient_phone' })
  recipient: User;

  @ApiProperty({ description: 'Message content' })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({ description: 'Message subject/title', required: false })
  @Column({ type: 'varchar', nullable: true })
  subject: string;

  @ApiProperty({ description: 'Message type', enum: MessageType, default: MessageType.TEXT })
  @Column({ type: 'varchar', default: MessageType.TEXT })
  type: MessageType;

  @ApiProperty({ description: 'Message channel', enum: MessageChannel, default: MessageChannel.IN_APP })
  @Column({ type: 'varchar', default: MessageChannel.IN_APP })
  channel: MessageChannel;

  @ApiProperty({ description: 'Is message read', default: false })
  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @ApiProperty({ description: 'Read timestamp', required: false })
  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;

  @ApiProperty({ description: 'Is message flagged', default: false })
  @Column({ type: 'boolean', default: false })
  isFlagged: boolean;

  @ApiProperty({ description: 'Attachment URL', required: false })
  @Column({ type: 'varchar', nullable: true })
  attachmentUrl: string;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

