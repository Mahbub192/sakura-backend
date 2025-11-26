import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';
import { Message } from './message.entity';

@Entity('message_threads')
export class MessageThread {
  @ApiProperty({ description: 'Unique thread identifier' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Thread unique identifier (UUID or custom ID)' })
  @Column({ type: 'varchar', unique: true })
  threadId: string;

  @ApiProperty({ description: 'Participant 1 user ID' })
  @Column({ name: 'participant1_id' })
  participant1Id: number;

  @ApiProperty({ type: () => User, description: 'Participant 1 user' })
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'participant1_id' })
  participant1: User;

  @ApiProperty({ description: 'Participant 2 user ID' })
  @Column({ name: 'participant2_id' })
  participant2Id: number;

  @ApiProperty({ type: () => User, description: 'Participant 2 user' })
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'participant2_id' })
  participant2: User;

  @ApiProperty({ description: 'Last message content preview', required: false })
  @Column({ type: 'text', nullable: true })
  lastMessage: string;

  @ApiProperty({ description: 'Last message timestamp', required: false })
  @Column({ type: 'timestamp', nullable: true })
  lastMessageAt: Date;

  @ApiProperty({ description: 'Unread count for participant 1', default: 0 })
  @Column({ type: 'int', default: 0 })
  unreadCount1: number;

  @ApiProperty({ description: 'Unread count for participant 2', default: 0 })
  @Column({ type: 'int', default: 0 })
  unreadCount2: number;

  @ApiProperty({ description: 'Is thread archived', default: false })
  @Column({ type: 'boolean', default: false })
  isArchived: boolean;

  @ApiProperty({ type: () => [Message], description: 'Messages in this thread' })
  @OneToMany(() => Message, (message) => message.threadId, { cascade: true })
  messages: Message[];

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

