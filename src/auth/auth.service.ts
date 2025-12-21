import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { Role, User } from '../entities';
import { LoginDto, RegisterDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName, phone, role } = registerDto;

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
    const userRole = await this.roleRepository.findOne({
      where: { name: role },
    });
    if (!userRole) {
      throw new ConflictException('Invalid role specified');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = this.userRepository.create({
      phone,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      roleId: userRole.id,
    });

    const savedUser = await this.userRepository.save(user);

    // Generate JWT token
    const payload = {
      sub: savedUser.phone,
      email: savedUser.email,
      role: userRole.name,
    };

    // Return user data without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = savedUser;

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        ...userWithoutPassword,
        role: userRole.name,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const { phone, password } = loginDto;

    const user = await this.validateUser(phone, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.phone,
      email: user.email,
      role: user.role.name,
    };

    // Return user data without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        ...userWithoutPassword,
        role: user.role.name,
      },
    };
  }

  async validateUser(phone: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { phone },
      relations: ['role'],
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async findUserByPhone(phone: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { phone },
      relations: ['role'],
    });
  }
}
