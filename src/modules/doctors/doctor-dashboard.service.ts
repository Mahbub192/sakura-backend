import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Doctor, Appointment, TokenAppointment, Assistant, Clinic, TokenAppointmentStatus, AppointmentStatus } from '../../entities';
import { CreateAppointmentScheduleDto } from './dto/create-appointment-schedule.dto';

export interface DashboardStats {
  totalAppointments: number;
  todayAppointments: number;
  totalPatients: number;
  todayPatients: number;
  pendingAppointments: number;
  completedAppointments: number;
  assistantsCount: number;
}

export interface TodayAppointmentInfo {
  id: number;
  patientName: string;
  patientPhone: string;
  time: string;
  status: string;
  tokenNumber: string;
  isOldPatient: boolean;
  doctorFee: number;
}

@Injectable()
export class DoctorDashboardService {
  constructor(
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(TokenAppointment)
    private tokenAppointmentRepository: Repository<TokenAppointment>,
    @InjectRepository(Assistant)
    private assistantRepository: Repository<Assistant>,
    @InjectRepository(Clinic)
    private clinicRepository: Repository<Clinic>,
  ) {}

  async getDoctorByUserId(userId: number): Promise<Doctor> {
    const doctor = await this.doctorRepository.findOne({
      where: { userId },
      relations: ['user', 'assistants'],
    });

    if (!doctor) {
      throw new NotFoundException('Doctor profile not found');
    }

    return doctor;
  }

  async getDashboardStats(userId: number): Promise<DashboardStats> {
    const doctor = await this.getDoctorByUserId(userId);
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    // Get all appointments for this doctor
    const totalAppointments = await this.appointmentRepository.count({
      where: { doctorId: doctor.id },
    });

    // Get today's appointments
    const todayAppointments = await this.appointmentRepository.count({
      where: {
        doctorId: doctor.id,
        date: Between(startOfDay, endOfDay),
      },
    });

    // Get total patients (unique token appointments)
    const totalPatients = await this.tokenAppointmentRepository.count({
      where: { doctorId: doctor.id },
    });

    // Get today's patients
    const todayPatients = await this.tokenAppointmentRepository.count({
      where: {
        doctorId: doctor.id,
        date: Between(startOfDay, endOfDay),
      },
    });

    // Get pending appointments
    const pendingAppointments = await this.tokenAppointmentRepository.count({
      where: {
        doctorId: doctor.id,
        status: TokenAppointmentStatus.PENDING,
      },
    });

    // Get completed appointments
    const completedAppointments = await this.tokenAppointmentRepository.count({
      where: {
        doctorId: doctor.id,
        status: TokenAppointmentStatus.COMPLETED,
      },
    });

    // Get assistants count
    const assistantsCount = await this.assistantRepository.count({
      where: { doctorId: doctor.id, isActive: true },
    });

    return {
      totalAppointments,
      todayAppointments,
      totalPatients,
      todayPatients,
      pendingAppointments,
      completedAppointments,
      assistantsCount,
    };
  }

  async getTodayAppointments(userId: number): Promise<TodayAppointmentInfo[]> {
    const doctor = await this.getDoctorByUserId(userId);
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const appointments = await this.tokenAppointmentRepository.find({
      where: {
        doctorId: doctor.id,
        date: Between(startOfDay, endOfDay),
      },
      order: { time: 'ASC' },
    });

    return appointments.map(appointment => ({
      id: appointment.id,
      patientName: appointment.patientName,
      patientPhone: appointment.patientPhone,
      time: appointment.time,
      status: appointment.status,
      tokenNumber: appointment.tokenNumber,
      isOldPatient: appointment.isOldPatient,
      doctorFee: appointment.doctorFee,
    }));
  }

  async createAppointmentSchedule(userId: number, scheduleDto: CreateAppointmentScheduleDto): Promise<Appointment[]> {
    const doctor = await this.getDoctorByUserId(userId);
    
    // Verify clinic exists
    const clinic = await this.clinicRepository.findOne({
      where: { id: scheduleDto.clinicId },
    });

    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }

    const {
      clinicId,
      date,
      startTime,
      endTime,
      slotDuration,
      patientPerSlot,
    } = scheduleDto;

    // Generate time slots
    const slots = this.generateTimeSlots(startTime, endTime, slotDuration);
    const createdAppointments: Appointment[] = [];

    for (const slot of slots) {
      // Check if slot already exists
      const existingAppointment = await this.appointmentRepository.findOne({
        where: {
          doctorId: doctor.id,
          clinicId,
          date: new Date(date),
          startTime: slot.start,
        },
      });

      if (!existingAppointment) {
        const appointment = this.appointmentRepository.create({
          doctorId: doctor.id,
          clinicId,
          date: new Date(date),
          startTime: slot.start,
          endTime: slot.end,
          duration: slotDuration,
          maxPatients: patientPerSlot,
          status: AppointmentStatus.AVAILABLE,
          currentBookings: 0,
        });

        const savedAppointment = await this.appointmentRepository.save(appointment);
        
        // Load relations for the response
        const appointmentWithRelations = await this.appointmentRepository.findOne({
          where: { id: savedAppointment.id },
          relations: ['doctor', 'clinic', 'doctor.user'],
        });
        
        if (appointmentWithRelations) {
          createdAppointments.push(appointmentWithRelations);
        } else {
          createdAppointments.push(savedAppointment);
        }
      }
    }

    return createdAppointments;
  }

  private generateTimeSlots(startTime: string, endTime: string, duration: number): Array<{start: string, end: string}> {
    const slots: Array<{start: string, end: string}> = [];
    const start = this.parseTime(startTime);
    const end = this.parseTime(endTime);

    let current = start;
    while (current + duration <= end) {
      const slotStart = this.formatTime(current);
      const slotEnd = this.formatTime(current + duration);
      slots.push({ start: slotStart, end: slotEnd });
      current += duration;
    }

    return slots;
  }

  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  async getUpcomingAppointments(userId: number, limit: number = 10): Promise<any[]> {
    const doctor = await this.getDoctorByUserId(userId);
    const now = new Date();

    const appointments = await this.tokenAppointmentRepository.find({
      where: {
        doctorId: doctor.id,
        date: Between(now, new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)), // Next 7 days
        status: TokenAppointmentStatus.CONFIRMED,
      },
      order: { date: 'ASC', time: 'ASC' },
      take: limit,
    });

    return appointments;
  }

  async getMonthlyAppointments(userId: number, month: number, year: number): Promise<any[]> {
    const doctor = await this.getDoctorByUserId(userId);
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    return this.tokenAppointmentRepository.find({
      where: {
        doctorId: doctor.id,
        date: Between(startOfMonth, endOfMonth),
      },
      order: { date: 'ASC', time: 'ASC' },
    });
  }

  async updateDoctorProfile(userId: number, updateData: any): Promise<Doctor> {
    const doctor = await this.getDoctorByUserId(userId);
    
    Object.assign(doctor, updateData);
    return this.doctorRepository.save(doctor);
  }
}
