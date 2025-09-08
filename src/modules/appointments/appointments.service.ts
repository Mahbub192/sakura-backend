import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Appointment, Doctor, Clinic, AppointmentStatus } from '../../entities';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
    @InjectRepository(Clinic)
    private clinicRepository: Repository<Clinic>,
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto): Promise<Appointment> {
    const { doctorId, clinicId, date, startTime, endTime, duration, maxPatients = 1 } = createAppointmentDto;

    // Validate doctor exists
    const doctor = await this.doctorRepository.findOne({ where: { id: doctorId } });
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // Validate clinic exists
    const clinic = await this.clinicRepository.findOne({ where: { id: clinicId } });
    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }

    // Validate time format and logic
    if (startTime >= endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    // Check for overlapping appointments for the same doctor
    const overlappingAppointment = await this.appointmentRepository.findOne({
      where: {
        doctorId,
        date: new Date(date),
        startTime: Between(startTime, endTime),
      },
    });

    if (overlappingAppointment) {
      throw new ConflictException('Doctor has conflicting appointment at this time');
    }

    const appointment = this.appointmentRepository.create({
      doctorId,
      clinicId,
      date: new Date(date),
      startTime,
      endTime,
      duration,
      maxPatients,
      status: AppointmentStatus.AVAILABLE,
      currentBookings: 0,
    });

    return this.appointmentRepository.save(appointment);
  }

  async findAll(): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      relations: ['doctor', 'clinic'],
      order: { date: 'ASC', startTime: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['doctor', 'clinic', 'tokenAppointments'],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return appointment;
  }

  async findByDoctor(doctorId: number): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: { doctorId },
      relations: ['clinic', 'tokenAppointments'],
      order: { date: 'ASC', startTime: 'ASC' },
    });
  }

  async findByDateRange(startDate: string, endDate: string): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: {
        date: Between(new Date(startDate), new Date(endDate)),
      },
      relations: ['doctor', 'clinic'],
      order: { date: 'ASC', startTime: 'ASC' },
    });
  }

  async findAvailableSlots(doctorId?: number, date?: string): Promise<Appointment[]> {
    const whereCondition: any = {
      status: AppointmentStatus.AVAILABLE,
    };

    if (doctorId) {
      whereCondition.doctorId = doctorId;
    }

    if (date) {
      whereCondition.date = new Date(date);
    }

    // Get all appointments with the basic conditions
    const appointments = await this.appointmentRepository.find({
      where: whereCondition,
      relations: ['doctor', 'clinic'],
      order: { date: 'ASC', startTime: 'ASC' },
    });

    // Filter out fully booked slots
    return appointments.filter(appointment => 
      appointment.currentBookings < appointment.maxPatients
    );
  }

  async updateStatus(id: number, status: AppointmentStatus): Promise<Appointment> {
    const appointment = await this.findOne(id);
    appointment.status = status;
    return this.appointmentRepository.save(appointment);
  }

  async incrementBooking(id: number): Promise<Appointment> {
    const appointment = await this.findOne(id);
    
    if (appointment.currentBookings >= appointment.maxPatients) {
      throw new ConflictException('Appointment slot is fully booked');
    }

    appointment.currentBookings += 1;
    
    if (appointment.currentBookings >= appointment.maxPatients) {
      appointment.status = AppointmentStatus.BOOKED;
    }

    return this.appointmentRepository.save(appointment);
  }

  async decrementBooking(id: number): Promise<Appointment> {
    const appointment = await this.findOne(id);
    
    if (appointment.currentBookings > 0) {
      appointment.currentBookings -= 1;
      
      if (appointment.currentBookings < appointment.maxPatients && appointment.status === AppointmentStatus.BOOKED) {
        appointment.status = AppointmentStatus.AVAILABLE;
      }
    }

    return this.appointmentRepository.save(appointment);
  }

  async remove(id: number): Promise<void> {
    const appointment = await this.findOne(id);
    
    if (appointment.currentBookings > 0) {
      throw new ConflictException('Cannot delete appointment with existing bookings');
    }

    await this.appointmentRepository.remove(appointment);
  }
}



