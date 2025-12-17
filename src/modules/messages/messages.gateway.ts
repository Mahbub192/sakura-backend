import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';

type AuthenticatedSocket = Socket & {
  userId?: number;
  userRole?: string;
};

@WebSocketGateway({
  cors: {
    origin: '*', // Configure this properly for production
    credentials: true,
  },
  namespace: '/messages',
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagesGateway.name);
  private connectedUsers = new Map<number, string>(); // userId -> socketId

  constructor(
    private readonly messagesService: MessagesService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake auth or query
      const token = client.handshake.auth?.token || client.handshake.query?.token;

      if (!token) {
        this.logger.warn('Connection attempt without token');
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token as string, {
        secret: this.configService.get<string>('jwt.secret') || 'default-secret-key',
      });

      // Attach user info to socket
      client.userId = payload.sub;
      client.userRole = payload.role;

      // Store connection
      this.connectedUsers.set(payload.sub, client.id);

      // Join user's personal room
      client.join(`user:${payload.sub}`);

      this.logger.log(`User ${payload.sub} connected with socket ${client.id}`);

      // Notify user of connection
      client.emit('connected', { userId: payload.sub });
    } catch (error) {
      this.logger.error('Connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      this.logger.log(`User ${client.userId} disconnected`);
    }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() data: CreateMessageDto & { threadId?: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.userId) {
        client.emit('error', { message: 'Unauthorized' });
        return;
      }

      // Create message
      const message = await this.messagesService.createMessage(client.userId, {
        recipientId: data.recipientId,
        content: data.content,
        subject: data.subject,
        type: data.type,
        channel: data.channel,
        attachmentUrl: data.attachmentUrl,
      });

      // Get thread to find recipient
      const threads = await this.messagesService.getThreads(client.userId);
      const thread = threads.find(t => t.threadId === message.threadId);

      if (!thread) {
        client.emit('error', { message: 'Thread not found' });
        return;
      }

      const recipientId = thread.participant1Id === client.userId 
        ? thread.participant2Id 
        : thread.participant1Id;

      // Emit to sender (confirmation)
      client.emit('message_sent', message);

      // Emit to recipient if online
      const recipientSocketId = this.connectedUsers.get(recipientId);
      if (recipientSocketId) {
        this.server.to(recipientSocketId).emit('new_message', message);
      } else {
        // Store notification for when user comes online
        this.server.to(`user:${recipientId}`).emit('new_message', message);
      }

      // Emit thread update to both participants
      this.server.to(`user:${client.userId}`).emit('thread_updated', thread);
      this.server.to(`user:${recipientId}`).emit('thread_updated', thread);

      return message;
    } catch (error) {
      this.logger.error('Error sending message:', error);
      client.emit('error', { message: error.message || 'Failed to send message' });
    }
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @MessageBody() data: { threadId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.userId) {
        client.emit('error', { message: 'Unauthorized' });
        return;
      }

      await this.messagesService.markThreadAsRead(client.userId, data.threadId);
      client.emit('marked_read', { threadId: data.threadId });
    } catch (error) {
      this.logger.error('Error marking as read:', error);
      client.emit('error', { message: error.message || 'Failed to mark as read' });
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody() data: { threadId: string; isTyping: boolean },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.userId) {
        return;
      }

      // Get thread to find recipient
      const threads = await this.messagesService.getThreads(client.userId);
      const thread = threads.find(t => t.threadId === data.threadId);

      if (!thread) {
        return;
      }

      const recipientId = thread.participant1Id === client.userId 
        ? thread.participant2Id 
        : thread.participant1Id;

      // Emit typing indicator to recipient
      const recipientSocketId = this.connectedUsers.get(recipientId);
      if (recipientSocketId) {
        this.server.to(recipientSocketId).emit('user_typing', {
          threadId: data.threadId,
          userId: client.userId,
          isTyping: data.isTyping,
        });
      }
    } catch (error) {
      this.logger.error('Error handling typing:', error);
    }
  }

  // Helper method to get online status
  isUserOnline(userId: number): boolean {
    return this.connectedUsers.has(userId);
  }

  // Helper method to get socket ID for a user
  getSocketId(userId: number): string | undefined {
    return this.connectedUsers.get(userId);
  }
}

