import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor, User } from '../../entities';
import { RoleType } from '../../entities/role.entity';
import { CreateDoctorDto, UpdateDoctorDto } from './dto';
import { CreateMyDoctorProfileDto } from './dto/create-my-profile.dto';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createDoctorDto: CreateDoctorDto): Promise<Doctor> {
    const { userPhone, licenseNumber, ...doctorData } = createDoctorDto;

    // Check if user exists and has doctor role
    const user = await this.userRepository.findOne({
      where: { phone: userPhone },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role.name !== RoleType.DOCTOR) {
      throw new ConflictException('User must have Doctor role');
    }

    // Check if doctor already exists for this user
    const existingDoctor = await this.doctorRepository.findOne({
      where: { userPhone },
    });

    if (existingDoctor) {
      throw new ConflictException(
        'Doctor profile already exists for this user',
      );
    }

    // Check if license number is unique
    const existingLicense = await this.doctorRepository.findOne({
      where: { licenseNumber },
    });

    if (existingLicense) {
      throw new ConflictException('License number already exists');
    }

    const doctor = this.doctorRepository.create({
      ...doctorData,
      licenseNumber,
      userPhone,
    });

    return this.doctorRepository.save(doctor);
  }

  async createMyProfile(
    userPhone: string,
    createProfileDto: CreateMyDoctorProfileDto,
  ): Promise<Doctor> {
    const { licenseNumber, ...doctorData } = createProfileDto;

    // Check if user exists and has doctor role
    const user = await this.userRepository.findOne({
      where: { phone: userPhone },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role.name !== RoleType.DOCTOR) {
      throw new ConflictException('User must have Doctor role');
    }

    // Check if doctor already exists for this user
    const existingDoctor = await this.doctorRepository.findOne({
      where: { userPhone },
    });

    if (existingDoctor) {
      throw new ConflictException(
        'Doctor profile already exists for this user',
      );
    }

    // Check if license number is unique
    const existingLicense = await this.doctorRepository.findOne({
      where: { licenseNumber },
    });

    if (existingLicense) {
      throw new ConflictException('License number already exists');
    }

    const doctor = this.doctorRepository.create({
      ...doctorData,
      licenseNumber,
      userPhone,
    });

    return this.doctorRepository.save(doctor);
  }

  async findAll(): Promise<Doctor[]> {
    return this.doctorRepository.find({
      relations: ['user', 'assistants'],
    });
  }

  async findOne(id: number): Promise<Doctor> {
    const doctor = await this.doctorRepository.findOne({
      where: { id },
      relations: ['user', 'assistants', 'appointments'],
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    return doctor;
  }

  async update(id: number, updateDoctorDto: UpdateDoctorDto): Promise<Doctor> {
    const doctor = await this.findOne(id);

    if (
      updateDoctorDto.licenseNumber &&
      updateDoctorDto.licenseNumber !== doctor.licenseNumber
    ) {
      const existingLicense = await this.doctorRepository.findOne({
        where: { licenseNumber: updateDoctorDto.licenseNumber },
      });

      if (existingLicense) {
        throw new ConflictException('License number already exists');
      }
    }

    Object.assign(doctor, updateDoctorDto);
    return this.doctorRepository.save(doctor);
  }

  async remove(id: number): Promise<void> {
    const doctor = await this.findOne(id);
    await this.doctorRepository.remove(doctor);
  }

  async findByUserId(userPhone: string): Promise<Doctor> {
    const doctor = await this.doctorRepository.findOne({
      where: { userPhone },
      relations: ['user', 'assistants'],
    });

    if (!doctor) {
      throw new NotFoundException('Doctor profile not found for this user');
    }

    return doctor;
  }

  async findBySpecialization(specialization: string): Promise<Doctor[]> {
    return this.doctorRepository.find({
      where: { specialization },
      relations: ['user'],
    });
  }

  async checkProfileExists(userPhone: string): Promise<boolean> {
    const doctor = await this.doctorRepository.findOne({
      where: { userPhone },
    });
    return !!doctor;
  }
}
