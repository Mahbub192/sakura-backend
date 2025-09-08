import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assistant, Doctor } from '../../entities';
import { CreateAssistantDto, UpdateAssistantDto } from './dto';

@Injectable()
export class AssistantsService {
  constructor(
    @InjectRepository(Assistant)
    private assistantRepository: Repository<Assistant>,
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
  ) {}

  async create(createAssistantDto: CreateAssistantDto, currentUserId: number): Promise<Assistant> {
    const { email, ...assistantData } = createAssistantDto;

    // Find doctor by current user ID
    const doctor = await this.doctorRepository.findOne({
      where: { userId: currentUserId },
      relations: ['user'],
    });

    if (!doctor) {
      throw new NotFoundException('Doctor profile not found for current user');
    }

    // Check if email is already in use
    const existingAssistant = await this.assistantRepository.findOne({
      where: { email },
    });

    if (existingAssistant) {
      throw new ConflictException('Assistant with this email already exists');
    }

    const assistant = this.assistantRepository.create({
      ...assistantData,
      email,
      doctorId: doctor.id,
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
}
