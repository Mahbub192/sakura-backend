import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenAppointment, Appointment, TokenAppointmentStatus, AppointmentStatus } from '../../entities';
import { BookAppointmentDto } from './dto';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(TokenAppointment)
    private tokenAppointmentRepository: Repository<TokenAppointment>,
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
  ) {}

  async bookAppointment(bookAppointmentDto: BookAppointmentDto, patientEmail: string): Promise<TokenAppointment> {
    const { appointmentId, patientName, patientPhone, patientAge, patientGender, patientLocation, isOldPatient, reasonForVisit, notes } = bookAppointmentDto;

    // Validate email matches logged in patient
    if (bookAppointmentDto.patientEmail !== patientEmail) {
      throw new ForbiddenException('Email mismatch. You can only book appointments for your own account.');
    }

    // Validate appointment slot exists and is available
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
      relations: ['doctor', 'clinic'],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment slot not found');
    }

    if (appointment.status !== AppointmentStatus.AVAILABLE) {
      throw new ConflictException('Appointment slot is not available');
    }

    if (appointment.currentBookings >= appointment.maxPatients) {
      throw new ConflictException('Appointment slot is fully booked');
    }

    // Check if patient already has an appointment for the same date and doctor
    const existingBooking = await this.tokenAppointmentRepository.findOne({
      where: {
        patientEmail,
        doctorId: appointment.doctorId,
        date: appointment.date,
        status: TokenAppointmentStatus.CONFIRMED,
      },
    });

    if (existingBooking) {
      throw new ConflictException('You already have a confirmed appointment with this doctor on this date');
    }

    // Generate unique token number
    const tokenNumber = await this.generateTokenNumber(appointment.doctorId, appointment.date);

    const tokenAppointment = this.tokenAppointmentRepository.create({
      patientName,
      patientEmail,
      patientPhone,
      patientAge,
      patientGender,
      patientLocation,
      isOldPatient: isOldPatient || false,
      doctorFee: appointment.doctor.consultationFee,
      date: appointment.date,
      time: appointment.startTime,
      tokenNumber,
      reasonForVisit,
      notes,
      doctorId: appointment.doctorId,
      appointmentId,
      status: TokenAppointmentStatus.CONFIRMED,
    });

    const savedTokenAppointment = await this.tokenAppointmentRepository.save(tokenAppointment);

    // Update appointment slot booking count
    await this.updateAppointmentBookingCount(appointmentId, 1);

    return savedTokenAppointment;
  }

  async getMyAppointments(patientEmail: string): Promise<TokenAppointment[]> {
    return this.tokenAppointmentRepository.find({
      where: { patientEmail },
      relations: ['doctor', 'doctor.user', 'appointment', 'appointment.clinic'],
      order: { date: 'DESC', time: 'DESC' },
    });
  }

  async getUpcomingAppointments(patientEmail: string): Promise<TokenAppointment[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.tokenAppointmentRepository.find({
      where: {
        patientEmail,
        date: new Date(today),
      },
      relations: ['doctor', 'doctor.user', 'appointment', 'appointment.clinic'],
      order: { time: 'ASC' },
    });
  }

  async getAppointmentById(id: number, patientEmail: string): Promise<TokenAppointment> {
    const appointment = await this.tokenAppointmentRepository.findOne({
      where: { id },
      relations: ['doctor', 'doctor.user', 'appointment', 'appointment.clinic'],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.patientEmail !== patientEmail) {
      throw new ForbiddenException('You can only view your own appointments');
    }

    return appointment;
  }

  async cancelAppointment(id: number, patientEmail: string): Promise<TokenAppointment> {
    const appointment = await this.getAppointmentById(id, patientEmail);

    if (appointment.status === TokenAppointmentStatus.CANCELLED) {
      throw new ConflictException('Appointment is already cancelled');
    }

    if (appointment.status === TokenAppointmentStatus.COMPLETED) {
      throw new ConflictException('Cannot cancel a completed appointment');
    }

    // Update status to cancelled
    appointment.status = TokenAppointmentStatus.CANCELLED;
    const updatedAppointment = await this.tokenAppointmentRepository.save(appointment);

    // Decrement the booking count
    await this.updateAppointmentBookingCount(appointment.appointmentId, -1);

    return updatedAppointment;
  }

  async getAppointmentHistory(patientEmail: string, limit: number = 10): Promise<TokenAppointment[]> {
    return this.tokenAppointmentRepository.find({
      where: { patientEmail },
      relations: ['doctor', 'doctor.user', 'appointment', 'appointment.clinic'],
      order: { date: 'DESC', time: 'DESC' },
      take: limit,
    });
  }

  private async generateTokenNumber(doctorId: number, date: Date): Promise<string> {
    const dateStr = new Date(date).toISOString().split('T')[0].replace(/-/g, '');
    
    // Count existing appointments for this doctor on this date
    const count = await this.tokenAppointmentRepository.count({
      where: {
        doctorId,
        date: new Date(date),
      },
    });

    return `TKN${doctorId}${dateStr}${(count + 1).toString().padStart(3, '0')}`;
  }

  private async updateAppointmentBookingCount(appointmentId: number, increment: number): Promise<void> {
    const appointment = await this.appointmentRepository.findOne({ where: { id: appointmentId } });
    if (appointment) {
      appointment.currentBookings = Math.max(0, appointment.currentBookings + increment);
      
      // Update status based on booking count
      if (appointment.currentBookings >= appointment.maxPatients) {
        appointment.status = AppointmentStatus.BOOKED;
      } else if (appointment.currentBookings === 0) {
        appointment.status = AppointmentStatus.AVAILABLE;
      } else {
        appointment.status = AppointmentStatus.AVAILABLE;
      }
      
      await this.appointmentRepository.save(appointment);
    }
  }
}

