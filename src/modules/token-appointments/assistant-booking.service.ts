import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import {
  Appointment,
  AppointmentStatus,
  Assistant,
  Doctor,
  TokenAppointment,
  TokenAppointmentStatus,
} from '../../entities';
import { CreatePatientBookingDto } from './dto/create-patient-booking.dto';

@Injectable()
export class AssistantBookingService {
  constructor(
    @InjectRepository(TokenAppointment)
    private tokenAppointmentRepository: Repository<TokenAppointment>,
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
    @InjectRepository(Assistant)
    private assistantRepository: Repository<Assistant>,
  ) {}

  async createPatientBooking(
    createBookingDto: CreatePatientBookingDto,
    assistantId: number,
  ): Promise<TokenAppointment> {
    const {
      doctorId,
      appointmentId,
      patientName,
      patientEmail,
      patientPhone,
      patientAge,
      patientGender,
      patientLocation,
      patientType,
      isOldPatient,
      doctorFee,
      reasonForVisit,
      notes,
      ...appointmentData
    } = createBookingDto;

    // Verify assistant exists and belongs to the specified doctor
    const assistant = await this.assistantRepository.findOne({
      where: { id: assistantId },
      relations: ['doctor'],
    });

    if (!assistant) {
      throw new NotFoundException('Assistant not found');
    }

    if (assistant.doctorId !== doctorId) {
      throw new ForbiddenException(
        'Assistant can only book appointments for their assigned doctor',
      );
    }

    // Validate doctor exists
    const doctor = await this.doctorRepository.findOne({
      where: { id: doctorId },
    });
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // Validate appointment slot exists and is available
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
    });
    if (!appointment) {
      throw new NotFoundException('Appointment slot not found');
    }

    if (appointment.currentBookings >= appointment.maxPatients) {
      throw new ConflictException('Appointment slot is fully booked');
    }

    // Check if patient already has an appointment for the same date and doctor (only if email is provided)
    if (patientEmail) {
      const existingBooking = await this.tokenAppointmentRepository.findOne({
        where: {
          patientEmail,
          doctorId,
          date: new Date(appointmentData.date),
          status: TokenAppointmentStatus.CONFIRMED,
        },
      });

      if (existingBooking) {
        throw new ConflictException(
          'Patient already has an appointment with this doctor on this date',
        );
      }
    }

    // Generate unique token number
    const tokenNumber = await this.generateTokenNumber(
      doctorId,
      appointmentData.date,
    );

    // Use the time from the request (individual calculated time), fallback to appointment start time
    const appointmentTime = createBookingDto.time || appointment.startTime;

    const tokenAppointment = this.tokenAppointmentRepository.create({
      patientName,
      patientEmail: patientEmail || undefined,
      patientPhone,
      patientAge,
      patientGender,
      patientLocation,
      patientType: patientType || 'New',
      isOldPatient,
      doctorFee,
      reasonForVisit,
      notes,
      doctorId,
      appointmentId,
      tokenNumber,
      date: new Date(appointmentData.date),
      time: appointmentTime, // Use the individual calculated time from frontend
      status: TokenAppointmentStatus.CONFIRMED,
    });

    const savedTokenAppointment =
      await this.tokenAppointmentRepository.save(tokenAppointment);

    // Update appointment slot booking count
    await this.updateAppointmentBookingCount(appointmentId, 1);

    return savedTokenAppointment;
  }

  async getAvailableSlots(
    doctorId: number,
    date: string,
    assistantId: number,
    clinicId?: number,
  ): Promise<Appointment[]> {
    // Verify assistant belongs to the doctor
    const assistant = await this.assistantRepository.findOne({
      where: { id: assistantId },
    });

    if (!assistant || assistant.doctorId !== doctorId) {
      throw new ForbiddenException(
        'Assistant can only view slots for their assigned doctor',
      );
    }

    // Build where conditions
    // Parse date string (YYYY-MM-DD) to Date object, ensuring timezone is handled correctly
    const dateObj = new Date(date + 'T00:00:00.000Z'); // Add time to avoid timezone issues

    const whereConditions: {
      doctorId: number;
      date: Date;
      status: AppointmentStatus;
      clinicId?: number;
    } = {
      doctorId,
      date: dateObj,
      status: AppointmentStatus.AVAILABLE,
    };

    // Add clinicId filter if provided
    if (clinicId) {
      whereConditions.clinicId = clinicId;
    }

    // Get all appointments with basic conditions
    const appointments = await this.appointmentRepository.find({
      where: whereConditions,
      relations: ['clinic'],
      order: { startTime: 'ASC' },
    });

    // Filter out fully booked slots
    return appointments.filter(
      (appointment) => appointment.currentBookings < appointment.maxPatients,
    );
  }

  async getDoctorBookings(
    doctorId: number,
    date: string,
    assistantId: number,
  ): Promise<TokenAppointment[]> {
    // Verify assistant belongs to the doctor
    const assistant = await this.assistantRepository.findOne({
      where: { id: assistantId },
    });

    if (!assistant || assistant.doctorId !== doctorId) {
      throw new ForbiddenException(
        'Assistant can only view bookings for their assigned doctor',
      );
    }

    const startOfDay = new Date(date);
    const endOfDay = new Date(date + 'T23:59:59');

    return this.tokenAppointmentRepository.find({
      where: {
        doctorId,
        date: Between(startOfDay, endOfDay),
      },
      relations: ['appointment', 'appointment.clinic'],
      order: { time: 'ASC' },
    });
  }

  async updateBookingStatus(
    bookingId: number,
    status: TokenAppointmentStatus,
    assistantId: number,
  ): Promise<TokenAppointment> {
    const booking = await this.tokenAppointmentRepository.findOne({
      where: { id: bookingId },
      relations: ['doctor'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Verify assistant belongs to the doctor
    const assistant = await this.assistantRepository.findOne({
      where: { id: assistantId },
    });

    if (!assistant || assistant.doctorId !== booking.doctorId) {
      throw new ForbiddenException(
        'Assistant can only update bookings for their assigned doctor',
      );
    }

    const oldStatus = booking.status;
    booking.status = status;
    const updatedBooking = await this.tokenAppointmentRepository.save(booking);

    // If appointment is cancelled, decrement the booking count
    if (
      (oldStatus === TokenAppointmentStatus.CONFIRMED ||
        oldStatus === TokenAppointmentStatus.PENDING) &&
      status === TokenAppointmentStatus.CANCELLED
    ) {
      await this.updateAppointmentBookingCount(booking.appointmentId, -1);
    }

    return updatedBooking;
  }

  async getTodaysBookings(assistantId: number): Promise<TokenAppointment[]> {
    const assistant = await this.assistantRepository.findOne({
      where: { id: assistantId },
      relations: ['doctor'],
    });

    if (!assistant) {
      throw new NotFoundException('Assistant not found');
    }

    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
    );

    return this.tokenAppointmentRepository.find({
      where: {
        doctorId: assistant.doctorId,
        date: Between(startOfDay, endOfDay),
      },
      relations: ['appointment', 'appointment.clinic'],
      order: { time: 'ASC' },
    });
  }

  async searchPatientBookings(
    assistantId: number,
    searchTerm: string,
  ): Promise<TokenAppointment[]> {
    const assistant = await this.assistantRepository.findOne({
      where: { id: assistantId },
    });

    if (!assistant) {
      throw new NotFoundException('Assistant not found');
    }

    // Search by patient name, phone, or email
    return this.tokenAppointmentRepository
      .createQueryBuilder('booking')
      .where('booking.doctorId = :doctorId', { doctorId: assistant.doctorId })
      .andWhere(
        '(booking.patientName ILIKE :search OR booking.patientPhone ILIKE :search OR booking.patientEmail ILIKE :search)',
        { search: `%${searchTerm}%` },
      )
      .leftJoinAndSelect('booking.appointment', 'appointment')
      .leftJoinAndSelect('appointment.clinic', 'clinic')
      .orderBy('booking.date', 'DESC')
      .getMany();
  }

  private async generateTokenNumber(
    doctorId: number,
    date: string,
  ): Promise<string> {
    const dateStr = new Date(date)
      .toISOString()
      .split('T')[0]
      .replace(/-/g, '');

    // Count existing appointments for this doctor on this date
    const count = await this.tokenAppointmentRepository.count({
      where: {
        doctorId,
        date: new Date(date),
      },
    });

    return `TKN${doctorId}${dateStr}${(count + 1).toString().padStart(3, '0')}`;
  }

  private async updateAppointmentBookingCount(
    appointmentId: number,
    increment: number,
  ): Promise<void> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
    });
    if (appointment) {
      appointment.currentBookings = Math.max(
        0,
        appointment.currentBookings + increment,
      );

      // Update status based on booking count
      if (appointment.currentBookings >= appointment.maxPatients) {
        appointment.status = AppointmentStatus.BOOKED;
      } else if (appointment.currentBookings === 0) {
        appointment.status = AppointmentStatus.AVAILABLE;
      }

      await this.appointmentRepository.save(appointment);
    }
  }
}
