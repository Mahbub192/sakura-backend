import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';

export enum RoleType {
  ADMIN = 'Admin',
  DOCTOR = 'Doctor',
  ASSISTANT = 'Assistant',
  USER = 'User',
}

@Entity('roles')
export class Role {
  @ApiProperty({ description: 'Unique role identifier' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Role name', enum: RoleType })
  @Column({ type: 'varchar', unique: true })
  name: RoleType;

  @ApiProperty({ description: 'Role description', required: false })
  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(() => User, (user) => user.role)
  users: User[];

  @ApiProperty({ description: 'Creation timestamp' })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}



