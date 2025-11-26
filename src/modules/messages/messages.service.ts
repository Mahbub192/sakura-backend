import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Message, MessageType, MessageChannel } from '../../entities/message.entity';
import { MessageThread } from '../../entities/message-thread.entity';
import { User } from '../../entities/user.entity';
import { Role, RoleType } from '../../entities/role.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateThreadDto } from './dto/create-thread.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(MessageThread)
    private threadRepository: Repository<MessageThread>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  /**
   * Get or create a thread between two users
   */
  async getOrCreateThread(userId: number, participantId: number): Promise<MessageThread> {
    if (userId === participantId) {
      throw new BadRequestException('Cannot create thread with yourself');
    }

    // Check if thread already exists (in either direction)
    let thread = await this.threadRepository.findOne({
      where: [
        { participant1Id: userId, participant2Id: participantId },
        { participant1Id: participantId, participant2Id: userId },
      ],
      relations: ['participant1', 'participant2'],
    });

    if (!thread) {
      // Create new thread
      const participant1 = await this.userRepository.findOne({ where: { id: userId } });
      const participant2 = await this.userRepository.findOne({ where: { id: participantId } });

      if (!participant1 || !participant2) {
        throw new NotFoundException('One or both users not found');
      }

      thread = this.threadRepository.create({
        threadId: uuidv4(),
        participant1Id: userId,
        participant2Id: participantId,
        participant1,
        participant2,
        unreadCount1: 0,
        unreadCount2: 0,
      });

      await this.threadRepository.save(thread);
    }

    return thread;
  }

  /**
   * Create a new message
   */
  async createMessage(userId: number, createMessageDto: CreateMessageDto): Promise<Message> {
    const { recipientId, content, subject, type = MessageType.TEXT, channel = MessageChannel.IN_APP, attachmentUrl } = createMessageDto;

    if (userId === recipientId) {
      throw new BadRequestException('Cannot send message to yourself');
    }

    // Get or create thread
    const thread = await this.getOrCreateThread(userId, recipientId);

    // Get sender and recipient
    const sender = await this.userRepository.findOne({ where: { id: userId } });
    const recipient = await this.userRepository.findOne({ where: { id: recipientId } });

    if (!sender || !recipient) {
      throw new NotFoundException('Sender or recipient not found');
    }

    // Create message
    const message = this.messageRepository.create({
      threadId: thread.threadId,
      senderId: userId,
      recipientId,
      sender,
      recipient,
      content,
      subject,
      type,
      channel,
      attachmentUrl,
      isRead: false,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Update thread's last message and unread count
    thread.lastMessage = content.length > 100 ? content.substring(0, 100) + '...' : content;
    thread.lastMessageAt = new Date();
    
    // Increment unread count for recipient
    if (thread.participant1Id === recipientId) {
      thread.unreadCount1 += 1;
    } else {
      thread.unreadCount2 += 1;
    }

    await this.threadRepository.save(thread);

    return savedMessage;
  }

  /**
   * Get all threads for a user
   */
  async getThreads(userId: number, filter?: 'all' | 'unread' | 'flagged'): Promise<MessageThread[]> {
    const whereConditions: any[] = [
      { participant1Id: userId },
      { participant2Id: userId },
    ];

    const threads = await this.threadRepository.find({
      where: whereConditions,
      relations: ['participant1', 'participant2', 'participant1.doctor', 'participant2.doctor', 'participant1.assistant', 'participant2.assistant'],
      order: { lastMessageAt: 'DESC', updatedAt: 'DESC' },
    });

    // Filter threads based on filter parameter
    let filteredThreads = threads;

    if (filter === 'unread') {
      filteredThreads = threads.filter(thread => {
        const unreadCount = thread.participant1Id === userId ? thread.unreadCount1 : thread.unreadCount2;
        return unreadCount > 0;
      });
    }

    // Note: Flagged filter would require adding isFlagged to MessageThread entity

    return filteredThreads;
  }

  /**
   * Get messages in a thread
   */
  async getThreadMessages(userId: number, threadId: string): Promise<Message[]> {
    // Verify user is a participant in the thread
    const thread = await this.threadRepository.findOne({
      where: [
        { threadId, participant1Id: userId },
        { threadId, participant2Id: userId },
      ],
    });

    if (!thread) {
      throw new ForbiddenException('You do not have access to this thread');
    }

    const messages = await this.messageRepository.find({
      where: { threadId },
      relations: ['sender', 'recipient'],
      order: { createdAt: 'ASC' },
    });

    return messages;
  }

  /**
   * Mark messages in a thread as read
   */
  async markThreadAsRead(userId: number, threadId: string): Promise<void> {
    // Verify user is a participant in the thread
    const thread = await this.threadRepository.findOne({
      where: [
        { threadId, participant1Id: userId },
        { threadId, participant2Id: userId },
      ],
    });

    if (!thread) {
      throw new ForbiddenException('You do not have access to this thread');
    }

    // Mark all unread messages as read
    await this.messageRepository.update(
      {
        threadId,
        recipientId: userId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      },
    );

    // Reset unread count
    if (thread.participant1Id === userId) {
      thread.unreadCount1 = 0;
    } else {
      thread.unreadCount2 = 0;
    }

    await this.threadRepository.save(thread);
  }

  /**
   * Search messages
   */
  async searchMessages(userId: number, query: string): Promise<Message[]> {
    const messages = await this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.recipient', 'recipient')
      .where('(message.senderId = :userId OR message.recipientId = :userId)', { userId })
      .andWhere('(message.content ILIKE :query OR message.subject ILIKE :query)', { query: `%${query}%` })
      .orderBy('message.createdAt', 'DESC')
      .limit(50)
      .getMany();

    return messages;
  }

  /**
   * Get unread message count for a user
   */
  async getUnreadCount(userId: number): Promise<number> {
    const threads = await this.threadRepository.find({
      where: [
        { participant1Id: userId },
        { participant2Id: userId },
      ],
    });

    let totalUnread = 0;
    threads.forEach(thread => {
      const unreadCount = thread.participant1Id === userId ? thread.unreadCount1 : thread.unreadCount2;
      totalUnread += unreadCount;
    });

    return totalUnread;
  }

  /**
   * Get available recipients for a user (doctors, assistants, admins for patients)
   */
  async getAvailableRecipients(userId: number): Promise<any[]> {
    const currentUser = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    // If user is a patient (User role), return doctors, assistants, and admins
    if (currentUser.role.name === RoleType.USER) {
      const roles = await this.roleRepository.find({
        where: [
          { name: RoleType.DOCTOR },
          { name: RoleType.ASSISTANT },
          { name: RoleType.ADMIN },
        ],
      });

      const roleIds = roles.map(r => r.id);

      const recipients = await this.userRepository.find({
        where: {
          roleId: In(roleIds),
          isActive: true,
        },
        relations: ['role', 'doctor', 'assistant'],
        select: ['id', 'firstName', 'lastName', 'email', 'phone'],
      });

      return recipients.map(user => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone,
        role: user.role.name,
        specialization: user.doctor?.specialization || null,
        profileImage: user.doctor?.profileImage || null,
      }));
    }

    // If user is doctor/assistant/admin, return all patients
    if ([RoleType.DOCTOR, RoleType.ASSISTANT, RoleType.ADMIN].includes(currentUser.role.name as RoleType)) {
      const patientRole = await this.roleRepository.findOne({
        where: { name: RoleType.USER },
      });

      if (!patientRole) {
        return [];
      }

      const recipients = await this.userRepository.find({
        where: {
          roleId: patientRole.id,
          isActive: true,
        },
        relations: ['role'],
        select: ['id', 'firstName', 'lastName', 'email', 'phone'],
      });

      return recipients.map(user => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone,
        role: user.role.name,
      }));
    }

    return [];
  }
}

