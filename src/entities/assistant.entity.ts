import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Doctor } from './doctor.entity';

@Entity('assistants')
export class Assistant {
  @ApiProperty({ description: 'Unique assistant identifier' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Assistant full name' })
  @Column({ type: 'varchar' })
  name: string;

  @ApiProperty({ description: 'Assistant email' })
  @Column({ type: 'varchar', unique: true })
  email: string;

  @ApiProperty({ description: 'Assistant phone number' })
  @Column({ type: 'varchar' })
  phone: string;

  @ApiProperty({ description: 'Assistant qualification', required: false })
  @Column({ type: 'varchar', nullable: true })
  qualification: string;

  @ApiProperty({ description: 'Years of experience', required: false })
  @Column({ type: 'int', nullable: true })
  experience: number;

  @ApiProperty({ description: 'Doctor ID reference' })
  @Column({ name: 'doctor_id' })
  doctorId: number;

  @ApiProperty({ type: () => Doctor, description: 'Associated doctor' })
  @ManyToOne(() => Doctor, (doctor) => doctor.assistants, { eager: true })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @ApiProperty({ description: 'Employment status' })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
