import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateThreadDto } from './dto/create-thread.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Message } from '../../entities/message.entity';
import { MessageThread } from '../../entities/message-thread.entity';

@ApiTags('Messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('recipients')
  @ApiOperation({ summary: 'Get list of available recipients (doctors, assistants, admins) for patients' })
  @ApiResponse({ status: 200, description: 'Recipients retrieved successfully' })
  async getRecipients(@CurrentUser() user: any) {
    return this.messagesService.getAvailableRecipients(user.userId);
  }

  @Post('threads')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create or get a message thread with another user' })
  @ApiResponse({ status: 201, description: 'Thread created or retrieved successfully', type: MessageThread })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async createOrGetThread(
    @CurrentUser() user: any,
    @Body() createThreadDto: CreateThreadDto,
  ): Promise<MessageThread> {
    return this.messagesService.getOrCreateThread(user.userId, createThreadDto.participantPhone);
  }

  @Get('threads')
  @ApiOperation({ summary: 'Get all message threads for the current user' })
  @ApiQuery({ name: 'filter', enum: ['all', 'unread', 'flagged'], required: false, description: 'Filter threads' })
  @ApiResponse({ status: 200, description: 'Threads retrieved successfully', type: [MessageThread] })
  async getThreads(
    @CurrentUser() user: any,
    @Query('filter') filter?: 'all' | 'unread' | 'flagged',
  ): Promise<MessageThread[]> {
    return this.messagesService.getThreads(user.userId, filter || 'all');
  }

  @Get('threads/:threadId/messages')
  @ApiOperation({ summary: 'Get all messages in a thread' })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully', type: [Message] })
  @ApiResponse({ status: 403, description: 'Forbidden - not a participant in this thread' })
  async getThreadMessages(
    @CurrentUser() user: any,
    @Param('threadId') threadId: string,
  ): Promise<Message[]> {
    return this.messagesService.getThreadMessages(user.userId, threadId);
  }

  @Post('threads/:threadId/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all messages in a thread as read' })
  @ApiResponse({ status: 200, description: 'Messages marked as read' })
  @ApiResponse({ status: 403, description: 'Forbidden - not a participant in this thread' })
  async markThreadAsRead(
    @CurrentUser() user: any,
    @Param('threadId') threadId: string,
  ): Promise<{ message: string }> {
    await this.messagesService.markThreadAsRead(user.userId, threadId);
    return { message: 'Messages marked as read' };
  }

  @Post('send')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a new message' })
  @ApiResponse({ status: 201, description: 'Message sent successfully', type: Message })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Recipient not found' })
  async sendMessage(
    @CurrentUser() user: any,
    @Body() createMessageDto: CreateMessageDto,
  ): Promise<Message> {
    return this.messagesService.createMessage(user.userId, createMessageDto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search messages' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiResponse({ status: 200, description: 'Messages found', type: [Message] })
  async searchMessages(
    @CurrentUser() user: any,
    @Query('q') query: string,
  ): Promise<Message[]> {
    return this.messagesService.searchMessages(user.userId, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get total unread message count' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved', schema: { type: 'object', properties: { count: { type: 'number' } } } })
  async getUnreadCount(@CurrentUser() user: any): Promise<{ count: number }> {
    const count = await this.messagesService.getUnreadCount(user.userId);
    return { count };
  }
}
