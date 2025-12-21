import {
    ConflictException,
    ForbiddenException,
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
import { CreatePatientBookingDto } from './dto/create-patient-booking.dto';

@Injectable()
export class DoctorBookingService {
  constructor(
    @InjectRepository(TokenAppointment)
    private tokenAppointmentRepository: Repository<TokenAppointment>,
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
  ) {}

  async createPatientBooking(
    createBookingDto: CreatePatientBookingDto,
    doctorIdFromProfile: number,
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

    if (doctorId !== doctorIdFromProfile) {
      throw new ForbiddenException('Doctor can only book appointments for their own profile');
    }

    const doctor = await this.doctorRepository.findOne({ where: { id: doctorId } });
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    const appointment = await this.appointmentRepository.findOne({ where: { id: appointmentId } });
    if (!appointment) {
      throw new NotFoundException('Appointment slot not found');
    }

    if (appointment.doctorId !== doctorId) {
      throw new ForbiddenException('Appointment slot does not belong to this doctor');
    }

    if (appointment.currentBookings >= appointment.maxPatients) {
      throw new ConflictException('Appointment slot is fully booked');
    }

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
        throw new ConflictException('Patient already has an appointment with this doctor on this date');
      }
    }

    const tokenNumber = await this.generateTokenNumber(doctorId, appointmentData.date);

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
      time: appointmentTime,
      status: TokenAppointmentStatus.CONFIRMED,
    });

    const saved = await this.tokenAppointmentRepository.save(tokenAppointment);
    await this.updateAppointmentBookingCount(appointmentId, 1);

    return saved;
  }

  async getAvailableSlots(doctorId: number, date: string, clinicId?: number) {
    const dateObj = new Date(date + 'T00:00:00.000Z');

    const whereConditions: any = {
      doctorId,
      date: dateObj,
      status: AppointmentStatus.AVAILABLE,
    };

    if (clinicId) whereConditions.clinicId = clinicId;

    const appointments = await this.appointmentRepository.find({
      where: whereConditions,
      relations: ['clinic'],
      order: { startTime: 'ASC' },
    });

    const appointmentIds = appointments.map((a) => a.id);
    const bookedTimesMap = await this.getBookedTimesForSlots(appointmentIds);

    return appointments
      .map((appointment) => ({
        ...appointment,
        bookedTimes: bookedTimesMap[appointment.id] || [],
      }))
      .filter((appointment) => appointment.currentBookings < appointment.maxPatients);
  }

  private async getBookedTimesForSlots(appointmentIds: number[]): Promise<Record<number, string[]>> {
    if (!appointmentIds || appointmentIds.length === 0) return {};
    const bookings = await this.tokenAppointmentRepository.find({
      where: {
        appointmentId: In(appointmentIds),
        status: TokenAppointmentStatus.CONFIRMED,
      },
      select: ['appointmentId', 'time'],
      order: { time: 'ASC' },
    });

    const map: Record<number, string[]> = {};
    bookings.forEach((b) => {
      if (!map[b.appointmentId]) map[b.appointmentId] = [];
      map[b.appointmentId].push(b.time);
    });
    return map;
  }

  private async generateTokenNumber(doctorId: number, date: string): Promise<string> {
    const dateStr = new Date(date).toISOString().split('T')[0].replace(/-/g, '');
    const count = await this.tokenAppointmentRepository.count({
      where: { doctorId, date: new Date(date) },
    });
    return `TKN${doctorId}${dateStr}${(count + 1).toString().padStart(3, '0')}`;
  }

  private async updateAppointmentBookingCount(appointmentId: number, increment: number): Promise<void> {
    const appointment = await this.appointmentRepository.findOne({ where: { id: appointmentId } });
    if (!appointment) return;
    appointment.currentBookings = Math.max(0, appointment.currentBookings + increment);
    if (appointment.currentBookings >= appointment.maxPatients) {
      appointment.status = AppointmentStatus.BOOKED;
    } else if (appointment.currentBookings === 0) {
      appointment.status = AppointmentStatus.AVAILABLE;
    }
    await this.appointmentRepository.save(appointment);
  }
}
