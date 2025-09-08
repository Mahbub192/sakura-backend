import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { TokenAppointment, Appointment, Doctor, TokenAppointmentStatus } from '../../entities';

export interface GlobalDashboardStats {
  totalDoctors: number;
  totalAppointmentsToday: number;
  totalPatientsToday: number;
  confirmedAppointments: number;
  pendingAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalRevenue: number;
}

export interface TodayGlobalAppointment {
  id: number;
  patientName: string;
  patientPhone: string;
  patientAge: number;
  patientGender: string;
  patientLocation: string;
  time: string;
  date: Date;
  status: string;
  tokenNumber: string;
  isOldPatient: boolean;
  doctorFee: number;
  doctorName: string;
  doctorSpecialization: string;
  clinicName: string;
  clinicAddress: string;
  reasonForVisit: string;
  notes: string;
}

@Injectable()
export class GlobalDashboardService {
  constructor(
    @InjectRepository(TokenAppointment)
    private tokenAppointmentRepository: Repository<TokenAppointment>,
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
  ) {}

  async getGlobalStats(): Promise<GlobalDashboardStats> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    // Get total doctors
    const totalDoctors = await this.doctorRepository.count();

    // Get today's appointments count
    const totalAppointmentsToday = await this.tokenAppointmentRepository.count({
      where: {
        date: Between(startOfDay, endOfDay),
      },
    });

    // Get unique patients today (by email)
    const todayAppointments = await this.tokenAppointmentRepository.find({
      where: {
        date: Between(startOfDay, endOfDay),
      },
      select: ['patientEmail', 'doctorFee'],
    });

    const uniquePatients = new Set(todayAppointments.map(app => app.patientEmail));
    const totalPatientsToday = uniquePatients.size;

    // Get status-wise counts
    const confirmedAppointments = await this.tokenAppointmentRepository.count({
      where: {
        date: Between(startOfDay, endOfDay),
        status: TokenAppointmentStatus.CONFIRMED,
      },
    });

    const pendingAppointments = await this.tokenAppointmentRepository.count({
      where: {
        date: Between(startOfDay, endOfDay),
        status: TokenAppointmentStatus.PENDING,
      },
    });

    const completedAppointments = await this.tokenAppointmentRepository.count({
      where: {
        date: Between(startOfDay, endOfDay),
        status: TokenAppointmentStatus.COMPLETED,
      },
    });

    const cancelledAppointments = await this.tokenAppointmentRepository.count({
      where: {
        date: Between(startOfDay, endOfDay),
        status: TokenAppointmentStatus.CANCELLED,
      },
    });

    // Calculate total revenue (completed appointments only)
    const completedTodayAppointments = await this.tokenAppointmentRepository.find({
      where: {
        date: Between(startOfDay, endOfDay),
        status: TokenAppointmentStatus.COMPLETED,
      },
      select: ['doctorFee'],
    });

    const totalRevenue = completedTodayAppointments.reduce((sum, app) => sum + Number(app.doctorFee), 0);

    return {
      totalDoctors,
      totalAppointmentsToday,
      totalPatientsToday,
      confirmedAppointments,
      pendingAppointments,
      completedAppointments,
      cancelledAppointments,
      totalRevenue,
    };
  }

  async getTodayAllAppointments(): Promise<TodayGlobalAppointment[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const appointments = await this.tokenAppointmentRepository
      .createQueryBuilder('token_appointment')
      .leftJoinAndSelect('token_appointment.doctor', 'doctor')
      .leftJoinAndSelect('token_appointment.appointment', 'appointment')
      .leftJoinAndSelect('appointment.clinic', 'clinic')
      .where('token_appointment.date BETWEEN :startOfDay AND :endOfDay', { startOfDay, endOfDay })
      .orderBy('token_appointment.time', 'ASC')
      .addOrderBy('doctor.name', 'ASC')
      .getMany();

    return appointments.map(appointment => ({
      id: appointment.id,
      patientName: appointment.patientName,
      patientPhone: appointment.patientPhone,
      patientAge: appointment.patientAge,
      patientGender: appointment.patientGender,
      patientLocation: appointment.patientLocation || '',
      time: appointment.time,
      date: appointment.date,
      status: appointment.status,
      tokenNumber: appointment.tokenNumber,
      isOldPatient: appointment.isOldPatient,
      doctorFee: appointment.doctorFee,
      doctorName: appointment.doctor.name,
      doctorSpecialization: appointment.doctor.specialization,
      clinicName: appointment.appointment?.clinic?.locationName || '',
      clinicAddress: appointment.appointment?.clinic?.address || '',
      reasonForVisit: appointment.reasonForVisit || '',
      notes: appointment.notes || '',
    }));
  }

  async getAppointmentsByDateRange(startDate: string, endDate: string): Promise<TodayGlobalAppointment[]> {
    const start = new Date(startDate);
    const end = new Date(endDate + 'T23:59:59');

    const appointments = await this.tokenAppointmentRepository
      .createQueryBuilder('token_appointment')
      .leftJoinAndSelect('token_appointment.doctor', 'doctor')
      .leftJoinAndSelect('token_appointment.appointment', 'appointment')
      .leftJoinAndSelect('appointment.clinic', 'clinic')
      .where('token_appointment.date BETWEEN :start AND :end', { start, end })
      .orderBy('token_appointment.date', 'ASC')
      .addOrderBy('token_appointment.time', 'ASC')
      .addOrderBy('doctor.name', 'ASC')
      .getMany();

    return appointments.map(appointment => ({
      id: appointment.id,
      patientName: appointment.patientName,
      patientPhone: appointment.patientPhone,
      patientAge: appointment.patientAge,
      patientGender: appointment.patientGender,
      patientLocation: appointment.patientLocation || '',
      time: appointment.time,
      date: appointment.date,
      status: appointment.status,
      tokenNumber: appointment.tokenNumber,
      isOldPatient: appointment.isOldPatient,
      doctorFee: appointment.doctorFee,
      doctorName: appointment.doctor.name,
      doctorSpecialization: appointment.doctor.specialization,
      clinicName: appointment.appointment?.clinic?.locationName || '',
      clinicAddress: appointment.appointment?.clinic?.address || '',
      reasonForVisit: appointment.reasonForVisit || '',
      notes: appointment.notes || '',
    }));
  }

  async getDoctorWiseStats(date?: string): Promise<any[]> {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);

    const doctorStats = await this.tokenAppointmentRepository
      .createQueryBuilder('token_appointment')
      .leftJoinAndSelect('token_appointment.doctor', 'doctor')
      .select([
        'doctor.id as doctorId',
        'doctor.name as doctorName',
        'doctor.specialization as specialization',
        'COUNT(token_appointment.id) as totalAppointments',
        'COUNT(CASE WHEN token_appointment.status = \'Confirmed\' THEN 1 END) as confirmedAppointments',
        'COUNT(CASE WHEN token_appointment.status = \'Completed\' THEN 1 END) as completedAppointments',
        'COUNT(CASE WHEN token_appointment.status = \'Cancelled\' THEN 1 END) as cancelledAppointments',
        'SUM(CASE WHEN token_appointment.status = \'Completed\' THEN token_appointment.doctorFee ELSE 0 END) as totalRevenue',
      ])
      .where('token_appointment.date BETWEEN :startOfDay AND :endOfDay', { startOfDay, endOfDay })
      .groupBy('doctor.id, doctor.name, doctor.specialization')
      .orderBy('totalAppointments', 'DESC')
      .getRawMany();

    return doctorStats.map(stat => ({
      doctorId: stat.doctorid,
      doctorName: stat.doctorname,
      specialization: stat.specialization,
      totalAppointments: parseInt(stat.totalappointments),
      confirmedAppointments: parseInt(stat.confirmedappointments),
      completedAppointments: parseInt(stat.completedappointments),
      cancelledAppointments: parseInt(stat.cancelledappointments),
      totalRevenue: parseFloat(stat.totalrevenue) || 0,
    }));
  }

  async searchGlobalAppointments(searchTerm: string, date?: string): Promise<TodayGlobalAppointment[]> {
    let query = this.tokenAppointmentRepository
      .createQueryBuilder('token_appointment')
      .leftJoinAndSelect('token_appointment.doctor', 'doctor')
      .leftJoinAndSelect('token_appointment.appointment', 'appointment')
      .leftJoinAndSelect('appointment.clinic', 'clinic')
      .where(
        '(token_appointment.patientName ILIKE :search OR token_appointment.patientPhone ILIKE :search OR token_appointment.patientEmail ILIKE :search OR token_appointment.tokenNumber ILIKE :search OR doctor.name ILIKE :search)',
        { search: `%${searchTerm}%` }
      );

    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);
      query = query.andWhere('token_appointment.date BETWEEN :startOfDay AND :endOfDay', { startOfDay, endOfDay });
    }

    const appointments = await query
      .orderBy('token_appointment.date', 'DESC')
      .addOrderBy('token_appointment.time', 'ASC')
      .getMany();

    return appointments.map(appointment => ({
      id: appointment.id,
      patientName: appointment.patientName,
      patientPhone: appointment.patientPhone,
      patientAge: appointment.patientAge,
      patientGender: appointment.patientGender,
      patientLocation: appointment.patientLocation || '',
      time: appointment.time,
      date: appointment.date,
      status: appointment.status,
      tokenNumber: appointment.tokenNumber,
      isOldPatient: appointment.isOldPatient,
      doctorFee: appointment.doctorFee,
      doctorName: appointment.doctor.name,
      doctorSpecialization: appointment.doctor.specialization,
      clinicName: appointment.appointment?.clinic?.locationName || '',
      clinicAddress: appointment.appointment?.clinic?.address || '',
      reasonForVisit: appointment.reasonForVisit || '',
      notes: appointment.notes || '',
    }));
  }
}
