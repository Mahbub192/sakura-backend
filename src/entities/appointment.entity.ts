import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Doctor } from './doctor.entity';
import { Clinic } from './clinic.entity';
import { TokenAppointment } from './token-appointment.entity';

export enum AppointmentStatus {
  AVAILABLE = 'Available',
  BOOKED = 'Booked',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

@Entity('appointments')
export class Appointment {
  @ApiProperty({ description: 'Unique appointment slot identifier' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Doctor ID reference' })
  @Column({ name: 'doctor_id' })
  doctorId: number;

  @ApiProperty({ type: () => Doctor, description: 'Associated doctor' })
  @ManyToOne(() => Doctor, (doctor) => doctor.appointments, { eager: true })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @ApiProperty({ description: 'Clinic ID reference' })
  @Column({ name: 'clinic_id' })
  clinicId: number;

  @ApiProperty({ type: () => Clinic, description: 'Associated clinic' })
  @ManyToOne(() => Clinic, (clinic) => clinic.appointments, { eager: true })
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic;

  @ApiProperty({ description: 'Appointment date' })
  @Column({ type: 'date' })
  date: Date;

  @ApiProperty({ description: 'Appointment start time' })
  @Column({ type: 'time' })
  startTime: string;

  @ApiProperty({ description: 'Appointment end time' })
  @Column({ type: 'time' })
  endTime: string;

  @ApiProperty({ description: 'Slot duration in minutes' })
  @Column({ type: 'int' })
  duration: number;

  @ApiProperty({ description: 'Appointment status', enum: AppointmentStatus })
  @Column({ type: 'varchar', default: AppointmentStatus.AVAILABLE })
  status: AppointmentStatus;

  @ApiProperty({ description: 'Maximum number of patients for this slot' })
  @Column({ type: 'int', default: 1 })
  maxPatients: number;

  @ApiProperty({ description: 'Current number of booked patients' })
  @Column({ type: 'int', default: 0 })
  currentBookings: number;

  @OneToMany(() => TokenAppointment, (tokenAppointment) => tokenAppointment.appointment)
  tokenAppointments: TokenAppointment[];

  @ApiProperty({ description: 'Creation timestamp' })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}



