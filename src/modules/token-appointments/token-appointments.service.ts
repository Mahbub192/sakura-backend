import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  Appointment,
  AppointmentStatus,
  Doctor,
  TokenAppointment,
  TokenAppointmentStatus,
} from '../../entities';
import { CreateTokenAppointmentDto } from './dto/create-token-appointment.dto';
import { LivePatientsGateway } from './live-patients.gateway';

@Injectable()
export class TokenAppointmentsService {
  constructor(
    @InjectRepository(TokenAppointment)
    private tokenAppointmentRepository: Repository<TokenAppointment>,
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
    private readonly livePatientsGateway: LivePatientsGateway,
  ) {}

  async create(
    createTokenAppointmentDto: CreateTokenAppointmentDto,
  ): Promise<TokenAppointment> {
    const {
      doctorId,
      appointmentId,
      patientName,
      patientEmail,
      patientPhone,
      ...appointmentData
    } = createTokenAppointmentDto;

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

    // Check if patient already has an appointment for the same date and doctor
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

    // Generate unique token number
    const tokenNumber = await this.generateTokenNumber(
      doctorId,
      appointmentData.date,
    );

    const tokenAppointment = this.tokenAppointmentRepository.create({
      ...appointmentData,
      patientName,
      patientEmail,
      patientPhone,
      doctorId,
      appointmentId,
      tokenNumber,
      date: new Date(appointmentData.date),
      status: TokenAppointmentStatus.CONFIRMED,
    });

    const savedTokenAppointment =
      await this.tokenAppointmentRepository.save(tokenAppointment);

    // Broadcast to live viewers
    try {
      this.livePatientsGateway.broadcastTokenUpdate(
        savedTokenAppointment as any,
      );
    } catch {
      // ignore
    }

    // Update appointment slot booking count
    await this.updateAppointmentBookingCount(appointmentId, 1);

    return savedTokenAppointment;
  }

  async findAll(): Promise<TokenAppointment[]> {
    return this.tokenAppointmentRepository.find({
      relations: ['doctor', 'appointment'],
      order: { date: 'ASC', time: 'ASC' },
    });
  }

  async findOne(id: number): Promise<TokenAppointment> {
    const tokenAppointment = await this.tokenAppointmentRepository.findOne({
      where: { id },
      relations: ['doctor', 'appointment'],
    });

    if (!tokenAppointment) {
      throw new NotFoundException('Token appointment not found');
    }

    return tokenAppointment;
  }

  async findByPatientEmail(email: string): Promise<TokenAppointment[]> {
    return this.tokenAppointmentRepository.find({
      where: { patientEmail: email },
      relations: ['doctor', 'appointment'],
      order: { date: 'DESC' },
    });
  }

  async findByDoctor(doctorId: number): Promise<TokenAppointment[]> {
    return this.tokenAppointmentRepository.find({
      where: { doctorId },
      relations: ['appointment'],
      order: { date: 'ASC', time: 'ASC' },
    });
  }

  async findWithFilters(
    doctorId?: number,
    clinicId?: number,
    date?: string,
  ): Promise<TokenAppointment[]> {
    const queryBuilder = this.tokenAppointmentRepository
      .createQueryBuilder('tokenAppointment')
      .leftJoinAndSelect('tokenAppointment.doctor', 'doctor')
      .leftJoinAndSelect('tokenAppointment.appointment', 'appointment')
      .leftJoinAndSelect('appointment.clinic', 'clinic');

    // Filter by doctorId
    if (doctorId) {
      queryBuilder.andWhere('tokenAppointment.doctorId = :doctorId', {
        doctorId,
      });
    }

    // Filter by clinicId (through appointment)
    if (clinicId) {
      queryBuilder.andWhere('appointment.clinicId = :clinicId', { clinicId });
    }

    // Filter by date (compare only the date part, ignoring time)
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
      );
      const endOfDay = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
        23,
        59,
        59,
        999,
      );

      queryBuilder.andWhere('tokenAppointment.date >= :startOfDay', {
        startOfDay,
      });
      queryBuilder.andWhere('tokenAppointment.date <= :endOfDay', { endOfDay });
    }

    return queryBuilder
      .orderBy('tokenAppointment.date', 'ASC')
      .addOrderBy('tokenAppointment.time', 'ASC')
      .getMany();
  }

  async getBookedTimesForSlots(
    appointmentIds: number[],
  ): Promise<Record<number, string[]>> {
    if (!appointmentIds || appointmentIds.length === 0) {
      return {};
    }

    const bookings = await this.tokenAppointmentRepository.find({
      where: {
        appointmentId: In(appointmentIds),
        status: TokenAppointmentStatus.CONFIRMED,
      },
      select: ['appointmentId', 'time'],
      order: { time: 'ASC' },
    });

    // Group bookings by appointmentId
    const bookedTimesMap: Record<number, string[]> = {};
    bookings.forEach((booking) => {
      if (!bookedTimesMap[booking.appointmentId]) {
        bookedTimesMap[booking.appointmentId] = [];
      }
      bookedTimesMap[booking.appointmentId].push(booking.time);
    });

    return bookedTimesMap;
  }

  async findByTokenNumber(tokenNumber: string): Promise<TokenAppointment> {
    const tokenAppointment = await this.tokenAppointmentRepository.findOne({
      where: { tokenNumber },
      relations: ['doctor', 'appointment'],
    });

    if (!tokenAppointment) {
      throw new NotFoundException('Token appointment not found');
    }

    return tokenAppointment;
  }

  async updateStatus(
    id: number,
    status: TokenAppointmentStatus,
  ): Promise<TokenAppointment> {
    const tokenAppointment = await this.findOne(id);
    const oldStatus = tokenAppointment.status;

    tokenAppointment.status = status;
    const updatedAppointment =
      await this.tokenAppointmentRepository.save(tokenAppointment);

    // If appointment is cancelled, decrement the booking count
    if (
      (oldStatus === TokenAppointmentStatus.CONFIRMED ||
        oldStatus === TokenAppointmentStatus.PENDING) &&
      status === TokenAppointmentStatus.CANCELLED
    ) {
      await this.updateAppointmentBookingCount(
        tokenAppointment.appointmentId,
        -1,
      );
    }

    // Broadcast status change
    try {
      this.livePatientsGateway.broadcastTokenUpdate(updatedAppointment as any);
    } catch {
      // ignore
    }

    return updatedAppointment;
  }

  async remove(id: number): Promise<void> {
    const tokenAppointment = await this.findOne(id);

    // Decrement booking count if appointment was confirmed
    if (
      tokenAppointment.status === TokenAppointmentStatus.CONFIRMED ||
      tokenAppointment.status === TokenAppointmentStatus.PENDING
    ) {
      await this.updateAppointmentBookingCount(
        tokenAppointment.appointmentId,
        -1,
      );
    }

    await this.tokenAppointmentRepository.remove(tokenAppointment);
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
