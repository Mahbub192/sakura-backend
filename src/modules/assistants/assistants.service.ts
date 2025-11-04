import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assistant, Doctor, User, Role, RoleType } from '../../entities';
import { CreateAssistantDto, UpdateAssistantDto } from './dto';
import { CreateMyAssistantProfileDto } from './dto/create-my-profile.dto';
import { UpdateMyAssistantProfileDto } from './dto/update-my-profile.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AssistantsService {
  constructor(
    @InjectRepository(Assistant)
    private assistantRepository: Repository<Assistant>,
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async create(createAssistantDto: CreateAssistantDto, currentUserId: number): Promise<Assistant> {
    const { email, name, phone, ...assistantData } = createAssistantDto;

    // Find doctor by current user ID
    const doctor = await this.doctorRepository.findOne({
      where: { userId: currentUserId },
      relations: ['user'],
    });

    if (!doctor) {
      throw new NotFoundException('Doctor profile not found for current user');
    }

    // Check if email is already in use (in both users and assistants)
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    const existingAssistant = await this.assistantRepository.findOne({
      where: { email },
    });

    if (existingUser || existingAssistant) {
      throw new ConflictException('User with this email already exists');
    }

    // Get Assistant role
    const assistantRole = await this.roleRepository.findOne({
      where: { name: RoleType.ASSISTANT },
    });

    if (!assistantRole) {
      throw new NotFoundException('Assistant role not found');
    }

    // Create user account for assistant
    const hashedPassword = await bcrypt.hash('password123', 10); // Default password
    const [firstName, ...lastNameParts] = name.split(' ');
    const lastName = lastNameParts.join(' ') || '';

    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      roleId: assistantRole.id,
      isActive: true,
      isEmailVerified: false,
    });

    const savedUser = await this.userRepository.save(user);

    // Create assistant profile
    const assistant = this.assistantRepository.create({
      ...assistantData,
      name,
      email,
      phone,
      doctorId: doctor.id,
      userId: savedUser.id,
    });

    return this.assistantRepository.save(assistant);
  }

  async findAllByCurrentDoctor(currentUserId: number): Promise<Assistant[]> {
    // Find doctor by current user ID
    const doctor = await this.doctorRepository.findOne({
      where: { userId: currentUserId },
      relations: ['user'],
    });

    if (!doctor) {
      throw new NotFoundException('Doctor profile not found for current user');
    }

    return this.assistantRepository.find({
      where: { doctorId: doctor.id },
      relations: ['doctor'],
    });
  }

  async findAllByDoctor(doctorId: number, currentUserId: number): Promise<Assistant[]> {
    // Verify doctor belongs to current user
    const doctor = await this.doctorRepository.findOne({
      where: { id: doctorId },
      relations: ['user'],
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    if (doctor.userId !== currentUserId) {
      throw new ForbiddenException('You can only view assistants for your own doctor profile');
    }

    return this.assistantRepository.find({
      where: { doctorId },
      relations: ['doctor'],
    });
  }

  async findOne(id: number, currentUserId: number): Promise<Assistant> {
    const assistant = await this.assistantRepository.findOne({
      where: { id },
      relations: ['doctor', 'doctor.user'],
    });

    if (!assistant) {
      throw new NotFoundException('Assistant not found');
    }

    if (assistant.doctor.userId !== currentUserId) {
      throw new ForbiddenException('You can only view assistants for your own doctor profile');
    }

    return assistant;
  }

  async update(id: number, updateAssistantDto: UpdateAssistantDto, currentUserId: number): Promise<Assistant> {
    const assistant = await this.findOne(id, currentUserId);

    if (updateAssistantDto.email && updateAssistantDto.email !== assistant.email) {
      const existingAssistant = await this.assistantRepository.findOne({
        where: { email: updateAssistantDto.email },
      });

      if (existingAssistant) {
        throw new ConflictException('Assistant with this email already exists');
      }
    }

    Object.assign(assistant, updateAssistantDto);
    return this.assistantRepository.save(assistant);
  }

  async remove(id: number, currentUserId: number): Promise<void> {
    const assistant = await this.findOne(id, currentUserId);
    await this.assistantRepository.remove(assistant);
  }

  async toggleStatus(id: number, currentUserId: number): Promise<Assistant> {
    const assistant = await this.findOne(id, currentUserId);
    assistant.isActive = !assistant.isActive;
    return this.assistantRepository.save(assistant);
  }

  async changePassword(assistantId: number, newPassword: string, currentUserId: number): Promise<{ message: string }> {
    const assistant = await this.findOne(assistantId, currentUserId);
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await this.userRepository.update(assistant.userId, {
      password: hashedPassword,
    });

    return { message: 'Password changed successfully' };
  }

  async getAssistantByUserId(userId: number): Promise<Assistant> {
    const assistant = await this.assistantRepository.findOne({
      where: { userId },
      relations: ['doctor', 'user'],
    });

    if (!assistant) {
      throw new NotFoundException('Assistant profile not found');
    }

    return assistant;
  }

  async createMyProfile(userId: number, createProfileDto: CreateMyAssistantProfileDto): Promise<Assistant> {
    const { doctorId, name, phone, ...assistantData } = createProfileDto;

    // Check if user exists and has assistant role
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role.name !== 'Assistant') {
      throw new ConflictException('User must have Assistant role');
    }

    // Check if assistant profile already exists for this user
    const existingAssistant = await this.assistantRepository.findOne({
      where: { userId },
    });

    if (existingAssistant) {
      throw new ConflictException('Assistant profile already exists for this user');
    }

    // Verify doctor exists
    const doctor = await this.doctorRepository.findOne({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // Get user's email (should exist)
    const email = user.email;

    // Create assistant profile
    const assistant = this.assistantRepository.create({
      ...assistantData,
      name,
      email,
      phone,
      doctorId,
      userId,
      isActive: true,
    });

    return this.assistantRepository.save(assistant);
  }

  async checkProfileExists(userId: number): Promise<boolean> {
    const assistant = await this.assistantRepository.findOne({
      where: { userId },
    });
    return !!assistant;
  }

  async updateMyProfile(userId: number, updateProfileDto: UpdateMyAssistantProfileDto): Promise<Assistant> {
    // Get existing assistant profile
    const assistant = await this.getAssistantByUserId(userId);

    // Update only allowed fields (name, qualification, experience)
    // Phone and doctorId cannot be changed
    if (updateProfileDto.name !== undefined) {
      assistant.name = updateProfileDto.name;
    }
    if (updateProfileDto.qualification !== undefined) {
      assistant.qualification = updateProfileDto.qualification;
    }
    if (updateProfileDto.experience !== undefined) {
      assistant.experience = updateProfileDto.experience;
    }

    return this.assistantRepository.save(assistant);
  }
}
