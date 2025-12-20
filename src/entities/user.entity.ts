import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { Assistant } from './assistant.entity';
import { Doctor } from './doctor.entity';
import { Role } from './role.entity';

@Entity('users')
export class User {
  @ApiProperty({ description: 'User phone number (Primary Key)' })
  @PrimaryColumn({ type: 'varchar' })
  phone: string;

  @ApiProperty({ description: 'User email address' })
  @Column({ type: 'varchar', unique: true })
  email: string;

  @Exclude()
  @Column({ type: 'varchar' })
  password: string;

  @ApiProperty({ description: 'User first name' })
  @Column({ type: 'varchar' })
  firstName: string;

  @ApiProperty({ description: 'User last name' })
  @Column({ type: 'varchar' })
  lastName: string;

  @ApiProperty({ description: 'User role ID' })
  @Column({ name: 'role_id' })
  roleId: number;

  @ApiProperty({ type: () => Role, description: 'User role' })
  @ManyToOne(() => Role, (role) => role.users, { eager: true })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @OneToOne(() => Doctor, (doctor) => doctor.user)
  doctor: Doctor;

  @OneToOne(() => Assistant, (assistant) => assistant.user)
  assistant: Assistant;

  @ApiProperty({ description: 'Account activation status' })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Email verification status' })
  @Column({ type: 'boolean', default: false })
  isEmailVerified: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
