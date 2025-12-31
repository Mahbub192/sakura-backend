import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { Assistant, Doctor, Role, RoleType, User } from '../../entities';
import { CreateAssistantDto, UpdateAssistantDto } from './dto';
import { CreateMyAssistantProfileDto } from './dto/create-my-profile.dto';
import { UpdateMyAssistantProfileDto } from './dto/update-my-profile.dto';

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

  async create(
    createAssistantDto: CreateAssistantDto,
    currentUserPhone: string,
  ): Promise<Assistant> {
    const { email, name, phone, ...assistantData } = createAssistantDto;

    // Find doctor by current user phone
    const doctor = await this.doctorRepository.findOne({
      where: { userPhone: currentUserPhone },
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
      userPhone: savedUser.phone,
    });

    return this.assistantRepository.save(assistant);
  }

  async findAllByCurrentDoctor(currentUserPhone: string): Promise<Assistant[]> {
    // Find doctor by current user phone
    const doctor = await this.doctorRepository.findOne({
      where: { userPhone: currentUserPhone },
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

  async findAllByDoctor(
    doctorId: number,
    currentUserPhone: string,
  ): Promise<Assistant[]> {
    // Verify doctor belongs to current user
    const doctor = await this.doctorRepository.findOne({
      where: { id: doctorId },
      relations: ['user'],
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    if (doctor.userPhone !== currentUserPhone) {
      throw new ForbiddenException(
        'You can only view assistants for your own doctor profile',
      );
    }

    return this.assistantRepository.find({
      where: { doctorId },
      relations: ['doctor'],
    });
  }

  async findOne(id: number, currentUserPhone: string): Promise<Assistant> {
    const assistant = await this.assistantRepository.findOne({
      where: { id },
      relations: ['doctor', 'doctor.user', 'user'],
    });

    if (!assistant) {
      throw new NotFoundException('Assistant not found');
    }

    if (assistant.doctor.userPhone !== currentUserPhone) {
      throw new ForbiddenException(
        'You can only view assistants for your own doctor profile',
      );
    }

    return assistant;
  }

  async update(
    id: number,
    updateAssistantDto: UpdateAssistantDto,
    currentUserPhone: string,
  ): Promise<Assistant> {
    const assistant = await this.findOne(id, currentUserPhone);

    if (
      updateAssistantDto.email &&
      updateAssistantDto.email !== assistant.email
    ) {
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

  async remove(id: number, currentUserPhone: string): Promise<void> {
    const assistant = await this.findOne(id, currentUserPhone);

    // Store user phone before deleting assistant
    const userPhone = assistant.userPhone;

    // Delete assistant first
    await this.assistantRepository.remove(assistant);

    // If assistant has an associated user account, delete it too
    if (userPhone) {
      const user = await this.userRepository.findOne({
        where: { phone: userPhone },
      });

      if (user) {
        await this.userRepository.remove(user);
        console.log(`Deleted user account for assistant: ${userPhone}`);
      }
    }
  }

  async toggleStatus(id: number, currentUserPhone: string): Promise<Assistant> {
    const assistant = await this.findOne(id, currentUserPhone);
    assistant.isActive = !assistant.isActive;
    return this.assistantRepository.save(assistant);
  }

  async changePassword(
    assistantId: number,
    newPassword: string,
    currentUserPhone: string,
  ): Promise<{ message: string }> {
    const assistant = await this.findOne(assistantId, currentUserPhone);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.userRepository.update(assistant.userPhone, {
      password: hashedPassword,
    });

    return { message: 'Password changed successfully' };
  }

  async getAssistantByUserId(userPhone: string): Promise<Assistant> {
    const assistant = await this.assistantRepository.findOne({
      where: { userPhone },
      relations: ['doctor', 'user'],
    });

    if (!assistant) {
      throw new NotFoundException('Assistant profile not found');
    }

    return assistant;
  }

  async createMyProfile(
    userPhone: string,
    createProfileDto: CreateMyAssistantProfileDto,
  ): Promise<Assistant> {
    const { doctorId, name, phone, ...assistantData } = createProfileDto;

    // Check if user exists and has assistant role
    const user = await this.userRepository.findOne({
      where: { phone: userPhone },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role.name !== RoleType.ASSISTANT) {
      throw new ConflictException('User must have Assistant role');
    }

    // Check if assistant profile already exists for this user
    const existingAssistant = await this.assistantRepository.findOne({
      where: { userPhone },
    });

    if (existingAssistant) {
      throw new ConflictException(
        'Assistant profile already exists for this user',
      );
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
      userPhone,
      isActive: true,
    });

    return this.assistantRepository.save(assistant);
  }

  async checkProfileExists(userPhone: string): Promise<boolean> {
    const assistant = await this.assistantRepository.findOne({
      where: { userPhone },
    });
    return !!assistant;
  }

  async updateMyProfile(
    userPhone: string,
    updateProfileDto: UpdateMyAssistantProfileDto,
  ): Promise<Assistant> {
    // Get existing assistant profile
    const assistant = await this.getAssistantByUserId(userPhone);

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
