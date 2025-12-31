import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { Role, User } from '../../entities';
import { CreateUserDto, UpdateUserDto } from './dto';
import { CreateMyUserProfileDto } from './dto/create-my-profile.dto';

type UserWithTempPassword = User & { tempPassword: string };

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserWithTempPassword> {
    const { email, phone, role: roleName, ...userData } = createUserDto;

    // Check if user already exists by phone (primary key)
    const existingUserByPhone = await this.userRepository.findOne({
      where: { phone },
    });
    if (existingUserByPhone) {
      throw new ConflictException('User with this phone number already exists');
    }

    // Check if user already exists by email
    const existingUserByEmail = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUserByEmail) {
      throw new ConflictException('User with this email already exists');
    }

    // Find role
    const role = await this.roleRepository.findOne({
      where: { name: roleName },
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const user = this.userRepository.create({
      ...userData,
      email,
      password: hashedPassword,
      roleId: role.id,
    });

    const savedUser = await this.userRepository.save(user);

    // Return user with temporary password (in real app, send via email)
    return { ...savedUser, tempPassword };
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['role'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(phone: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { phone },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(phone: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(phone);

    // Phone number cannot be updated (it's the primary key)
    // UpdateUserDto already excludes phone, but we ensure it's not in the DTO
    if ('phone' in updateUserDto) {
      const updateDto = updateUserDto as Record<string, unknown>;
      delete updateDto.phone;
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    }

    if (updateUserDto.role) {
      const foundRole = await this.roleRepository.findOne({
        where: { name: updateUserDto.role },
      });
      if (!foundRole) {
        throw new NotFoundException('Role not found');
      }
      // Remove role from DTO and assign roleId directly to user
      const { role, ...rest } = updateUserDto;
      void role; // Explicitly mark as intentionally unused
      Object.assign(user, rest);
      user.roleId = foundRole.id;
    } else {
      Object.assign(user, updateUserDto);
    }
    return this.userRepository.save(user);
  }

  async remove(phone: string): Promise<void> {
    const user = await this.findOne(phone);
    await this.userRepository.remove(user);
  }

  async updatePassword(phone: string, newPassword: string): Promise<void> {
    const user = await this.findOne(phone);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await this.userRepository.save(user);
  }

  async deactivateUser(phone: string): Promise<User> {
    const user = await this.findOne(phone);
    user.isActive = false;
    return this.userRepository.save(user);
  }

  async activateUser(phone: string): Promise<User> {
    const user = await this.findOne(phone);
    user.isActive = true;
    return this.userRepository.save(user);
  }

  async updateMyProfile(
    userPhone: string,
    updateProfileDto: CreateMyUserProfileDto,
  ): Promise<User> {
    const user = await this.findOne(userPhone);

    // Update only allowed fields (phone cannot be changed as it's the primary key)
    if (updateProfileDto.firstName !== undefined) {
      user.firstName = updateProfileDto.firstName;
    }
    if (updateProfileDto.lastName !== undefined) {
      user.lastName = updateProfileDto.lastName;
    }
    if (
      updateProfileDto.email !== undefined &&
      updateProfileDto.email !== user.email
    ) {
      // Check if email is already in use by another user
      const existingUser = await this.userRepository.findOne({
        where: { email: updateProfileDto.email },
      });
      if (existingUser && existingUser.phone !== userPhone) {
        throw new ConflictException('Email already in use');
      }
      user.email = updateProfileDto.email;
    }

    return this.userRepository.save(user);
  }

  async changeMyPassword(
    userPhone: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.findOne(userPhone);

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await this.userRepository.save(user);

    return { message: 'Password changed successfully' };
  }
}
