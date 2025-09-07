import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Doctor } from './doctor.entity';
import { Appointment } from './appointment.entity';

export enum TokenAppointmentStatus {
  CONFIRMED = 'Confirmed',
  PENDING = 'Pending',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
  NO_SHOW = 'No Show',
}

@Entity('token_appointments')
export class TokenAppointment {
  @ApiProperty({ description: 'Unique booking identifier' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Patient full name' })
  @Column({ type: 'varchar' })
  patientName: string;

  @ApiProperty({ description: 'Patient email' })
  @Column({ type: 'varchar' })
  patientEmail: string;

  @ApiProperty({ description: 'Patient phone number' })
  @Column({ type: 'varchar' })
  patientPhone: string;

  @ApiProperty({ description: 'Patient age' })
  @Column({ type: 'int' })
  patientAge: number;

  @ApiProperty({ description: 'Patient gender' })
  @Column({ type: 'varchar' })
  patientGender: string;

  @ApiProperty({ description: 'Appointment date' })
  @Column({ type: 'date' })
  date: Date;

  @ApiProperty({ description: 'Appointment time' })
  @Column({ type: 'time' })
  time: string;

  @ApiProperty({ description: 'Token number for the appointment' })
  @Column({ type: 'varchar', unique: true })
  tokenNumber: string;

  @ApiProperty({ description: 'Reason for visit', required: false })
  @Column({ type: 'text', nullable: true })
  reasonForVisit: string;

  @ApiProperty({ description: 'Special notes', required: false })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty({ description: 'Booking status', enum: TokenAppointmentStatus })
  @Column({ type: 'varchar', default: TokenAppointmentStatus.CONFIRMED })
  status: TokenAppointmentStatus;

  @ApiProperty({ description: 'Doctor ID reference' })
  @Column({ name: 'doctor_id' })
  doctorId: number;

  @ApiProperty({ type: () => Doctor, description: 'Associated doctor' })
  @ManyToOne(() => Doctor, (doctor) => doctor.tokenAppointments, { eager: true })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @ApiProperty({ description: 'Appointment slot ID reference' })
  @Column({ name: 'appointment_id' })
  appointmentId: number;

  @ApiProperty({ type: () => Appointment, description: 'Associated appointment slot' })
  @ManyToOne(() => Appointment, (appointment) => appointment.tokenAppointments, { eager: true })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @ApiProperty({ description: 'Creation timestamp' })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
