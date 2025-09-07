import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';
import { Assistant } from './assistant.entity';
import { Appointment } from './appointment.entity';
import { TokenAppointment } from './token-appointment.entity';

@Entity('doctors')
export class Doctor {
  @ApiProperty({ description: 'Unique doctor identifier' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Doctor full name' })
  @Column({ type: 'varchar' })
  name: string;

  @ApiProperty({ description: 'Doctor specialization' })
  @Column({ type: 'varchar' })
  specialization: string;

  @ApiProperty({ description: 'Years of experience', required: false })
  @Column({ type: 'int', nullable: true })
  experience: number;

  @ApiProperty({ description: 'Medical license number' })
  @Column({ type: 'varchar', unique: true })
  licenseNumber: string;

  @ApiProperty({ description: 'Doctor qualification' })
  @Column({ type: 'varchar' })
  qualification: string;

  @ApiProperty({ description: 'Doctor bio/description', required: false })
  @Column({ type: 'text', nullable: true })
  bio: string;

  @ApiProperty({ description: 'Consultation fee' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  consultationFee: number;

  @ApiProperty({ description: 'User ID reference' })
  @Column({ name: 'user_id' })
  userId: number;

  @ApiProperty({ type: () => User, description: 'Associated user account' })
  @OneToOne(() => User, (user) => user.doctor, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Assistant, (assistant) => assistant.doctor)
  assistants: Assistant[];

  @OneToMany(() => Appointment, (appointment) => appointment.doctor)
  appointments: Appointment[];

  @OneToMany(() => TokenAppointment, (tokenAppointment) => tokenAppointment.doctor)
  tokenAppointments: TokenAppointment[];

  @ApiProperty({ description: 'Creation timestamp' })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}


