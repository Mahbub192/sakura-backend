import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from '../../entities/doctor.entity';
import { AppointmentsService } from '../appointments/appointments.service';
import { TokenAppointmentsService } from '../token-appointments/token-appointments.service';

@Injectable()
export class PublicService {
  constructor(
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
    private appointmentsService: AppointmentsService,
    private tokenAppointmentsService: TokenAppointmentsService,
  ) {}

  async getDoctors(): Promise<Doctor[]> {
    return this.doctorRepository.find({
      relations: ['user'],
    });
  }

  async getDoctorById(id: string): Promise<Doctor> {
    const doctor = await this.doctorRepository.findOne({
      where: { id: parseInt(id) },
      relations: ['user'],
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    return doctor;
  }

  async getAvailableAppointments(doctorId?: number, date?: string, clinicId?: number) {
    const slots = await this.appointmentsService.findAvailableSlots(doctorId, date, clinicId);
    
    // Get booked times for all slots
    const appointmentIds = slots.map(slot => slot.id);
    const bookedTimesMap = await this.tokenAppointmentsService.getBookedTimesForSlots(appointmentIds);
    
    // Add booked times to each slot
    return slots.map(slot => ({
      ...slot,
      bookedTimes: bookedTimesMap[slot.id] || [],
    }));
  }

  async getDoctorsWithAvailableSlots(date?: string) {
    const doctors = await this.getDoctors();
    const availableSlots = await this.getAvailableAppointments(undefined, date);
    
    return doctors.map(doctor => {
      const doctorSlots = availableSlots.filter(slot => slot.doctorId === doctor.id);
      return {
        ...doctor,
        availableSlots: doctorSlots.length,
        slots: doctorSlots.slice(0, 5), // Return first 5 slots as preview
      };
    });
  }
}
