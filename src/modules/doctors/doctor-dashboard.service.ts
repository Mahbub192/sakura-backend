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

  async getDoctorByUserId(userPhone: string): Promise<Doctor> {
    const doctor = await this.doctorRepository.findOne({
      where: { userPhone },
      relations: ['user', 'assistants'],
    });

    if (!doctor) {
      throw new NotFoundException('Doctor profile not found');
    }

    return doctor;
  }

  async getDashboardStats(userPhone: string): Promise<DashboardStats> {
    const doctor = await this.getDoctorByUserId(userPhone);
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

  async getTodayAppointments(userPhone: string): Promise<TodayAppointmentInfo[]> {
    const doctor = await this.getDoctorByUserId(userPhone);
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

  async createAppointmentSchedule(userPhone: string, scheduleDto: CreateAppointmentScheduleDto): Promise<Appointment[]> {
    const doctor = await this.getDoctorByUserId(userPhone);
    
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

  async getUpcomingAppointments(userPhone: string, limit: number = 10): Promise<any[]> {
    const doctor = await this.getDoctorByUserId(userPhone);
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

  async getMonthlyAppointments(userPhone: string, month: number, year: number): Promise<any[]> {
    const doctor = await this.getDoctorByUserId(userPhone);
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

  async updateDoctorProfile(userPhone: string, updateData: any): Promise<Doctor> {
    const doctor = await this.getDoctorByUserId(userPhone);
    
    Object.assign(doctor, updateData);
    return this.doctorRepository.save(doctor);
  }

  // Notification Settings
  async getNotificationSettings(userPhone: string): Promise<any> {
    const doctor = await this.getDoctorByUserId(userPhone);
    // Return default settings if not set, or stored settings from contactInfo or a new settings field
    return (doctor.contactInfo as any)?.notificationSettings || {
      events: {
        newAppointmentBooking: true,
        appointmentReminder: true,
        appointmentCancellation: true,
        newPatientMessage: false,
      },
      deliveryMethods: {
        email: true,
        sms: false,
        inApp: true,
      },
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
      },
    };
  }

  async updateNotificationSettings(userPhone: string, settings: any): Promise<Doctor> {
    const doctor = await this.getDoctorByUserId(userPhone);
    const contactInfo = (doctor.contactInfo as any) || {};
    contactInfo.notificationSettings = settings;
    doctor.contactInfo = contactInfo;
    return this.doctorRepository.save(doctor);
  }

  // Clinic Info
  async getClinicInfo(userPhone: string): Promise<any> {
    const doctor = await this.getDoctorByUserId(userPhone);
    // Return clinic info from contactInfo or default
    return (doctor.contactInfo as any)?.clinicInfo || {
      logo: '',
      name: doctor.name || '',
      address: '',
      phone: doctor.user?.phone || '',
      email: doctor.user?.email || '',
      description: doctor.bio || '',
      operatingHours: {
        monday: { start: '09:00', end: '17:00', closed: false },
        tuesday: { start: '09:00', end: '17:00', closed: false },
        wednesday: { start: '09:00', end: '17:00', closed: false },
        thursday: { start: '09:00', end: '17:00', closed: false },
        friday: { start: '09:00', end: '17:00', closed: false },
        saturday: { start: '09:00', end: '17:00', closed: true },
        sunday: { start: '09:00', end: '17:00', closed: true },
      },
    };
  }

  async updateClinicInfo(userPhone: string, clinicInfo: any): Promise<Doctor> {
    const doctor = await this.getDoctorByUserId(userPhone);
    const contactInfo = (doctor.contactInfo as any) || {};
    contactInfo.clinicInfo = clinicInfo;
    doctor.contactInfo = contactInfo;
    return this.doctorRepository.save(doctor);
  }

  // Billing Stats
  async getBillingStats(userPhone: string): Promise<any> {
    const doctor = await this.getDoctorByUserId(userPhone);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Get all completed appointments
    const allCompleted = await this.tokenAppointmentRepository.find({
      where: {
        doctorId: doctor.id,
        status: TokenAppointmentStatus.COMPLETED,
      },
    });

    // Get this month's completed appointments
    const thisMonthCompleted = await this.tokenAppointmentRepository.find({
      where: {
        doctorId: doctor.id,
        status: TokenAppointmentStatus.COMPLETED,
        date: Between(startOfMonth, endOfMonth),
      },
    });

    // Get last month's completed appointments
    const lastMonthCompleted = await this.tokenAppointmentRepository.find({
      where: {
        doctorId: doctor.id,
        status: TokenAppointmentStatus.COMPLETED,
        date: Between(startOfLastMonth, endOfLastMonth),
      },
    });

    // Calculate totals
    const totalIncome = allCompleted.reduce((sum, apt) => sum + Number(apt.doctorFee), 0);
    const thisMonth = thisMonthCompleted.reduce((sum, apt) => sum + Number(apt.doctorFee), 0);
    const lastMonth = lastMonthCompleted.reduce((sum, apt) => sum + Number(apt.doctorFee), 0);
    const totalAppointments = allCompleted.length;
    const averagePerAppointment = totalAppointments > 0 ? totalIncome / totalAppointments : 0;
    const growth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

    return {
      totalIncome: Number(totalIncome.toFixed(2)),
      thisMonth: Number(thisMonth.toFixed(2)),
      lastMonth: Number(lastMonth.toFixed(2)),
      totalAppointments,
      averagePerAppointment: Number(averagePerAppointment.toFixed(2)),
      growth: Number(growth.toFixed(2)),
    };
  }
}
