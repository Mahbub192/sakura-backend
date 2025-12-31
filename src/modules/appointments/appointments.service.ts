import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
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

  async create(
    createAppointmentDto: CreateAppointmentDto,
  ): Promise<Appointment> {
    const {
      doctorId,
      clinicId,
      date,
      startTime,
      endTime,
      duration,
      maxPatients = 1,
    } = createAppointmentDto;

    // Validate doctor exists
    const doctor = await this.doctorRepository.findOne({
      where: { id: doctorId },
    });
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // Validate clinic exists
    const clinic = await this.clinicRepository.findOne({
      where: { id: clinicId },
    });
    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }

    // Validate time format and logic
    if (startTime >= endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    // Check for overlapping appointments for the same doctor on the same date
    const existingAppointments = await this.appointmentRepository.find({
      where: {
        doctorId,
        date: new Date(date),
      },
    });

    // Helper function to convert time string to minutes for comparison
    const timeToMinutes = (timeStr: string): number => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const newStartMinutes = timeToMinutes(startTime);
    const newEndMinutes = timeToMinutes(endTime);

    // Check for overlaps
    const hasOverlap = existingAppointments.some((existing) => {
      const existingStartMinutes = timeToMinutes(existing.startTime);
      const existingEndMinutes = timeToMinutes(existing.endTime);

      // Check if new slot overlaps with existing slot
      // Overlap occurs if:
      // 1. New start time is within existing slot: existingStartMinutes <= newStartMinutes < existingEndMinutes
      // 2. New end time is within existing slot: existingStartMinutes < newEndMinutes <= existingEndMinutes
      // 3. New slot completely covers existing slot: newStartMinutes <= existingStartMinutes && newEndMinutes >= existingEndMinutes
      return (
        (newStartMinutes >= existingStartMinutes &&
          newStartMinutes < existingEndMinutes) ||
        (newEndMinutes > existingStartMinutes &&
          newEndMinutes <= existingEndMinutes) ||
        (newStartMinutes <= existingStartMinutes &&
          newEndMinutes >= existingEndMinutes)
      );
    });

    if (hasOverlap) {
      throw new ConflictException(
        'Doctor has conflicting appointment at this time',
      );
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

  async findByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: {
        date: Between(new Date(startDate), new Date(endDate)),
      },
      relations: ['doctor', 'clinic'],
      order: { date: 'ASC', startTime: 'ASC' },
    });
  }

  async findAvailableSlots(
    doctorId?: number,
    date?: string,
    clinicId?: number,
  ): Promise<Appointment[]> {
    console.log('findAvailableSlots called with:', {
      doctorId,
      date,
      clinicId,
    });

    const queryBuilder = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.doctor', 'doctor')
      .leftJoinAndSelect('appointment.clinic', 'clinic')
      .where('appointment.status = :status', {
        status: AppointmentStatus.AVAILABLE,
      })
      .andWhere('appointment.currentBookings < appointment.maxPatients');

    if (doctorId) {
      queryBuilder.andWhere('appointment.doctorId = :doctorId', { doctorId });
    }

    if (date) {
      // Extract date part from input (handle both YYYY-MM-DD and ISO strings)
      const dateStr = date.split('T')[0]; // Handle ISO strings - format: YYYY-MM-DD
      console.log('Filtering by date:', dateStr);

      // Convert to date object for comparison (PostgreSQL date type)
      const targetDate = new Date(dateStr);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      // Use range comparison for date (includes whole day)
      queryBuilder
        .andWhere('appointment.date >= :startDate', { startDate: targetDate })
        .andWhere('appointment.date < :endDate', { endDate: nextDay });
    } else {
      // Only show future or today's appointments if no date filter
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      console.log('Filtering by today/future, today:', today);
      queryBuilder.andWhere('appointment.date >= :today', { today });
    }

    if (clinicId) {
      queryBuilder.andWhere('appointment.clinicId = :clinicId', { clinicId });
    }

    queryBuilder
      .orderBy('appointment.date', 'ASC')
      .addOrderBy('appointment.startTime', 'ASC');

    const sql = queryBuilder.getSql();
    const params = queryBuilder.getParameters();
    console.log('Query SQL:', sql);
    console.log('Query Parameters:', params);

    const results = await queryBuilder.getMany();
    console.log(`Found ${results.length} available slots`);

    return results;
  }

  async updateStatus(
    id: number,
    status: AppointmentStatus,
  ): Promise<Appointment> {
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

      if (
        appointment.currentBookings < appointment.maxPatients &&
        appointment.status === AppointmentStatus.BOOKED
      ) {
        appointment.status = AppointmentStatus.AVAILABLE;
      }
    }

    return this.appointmentRepository.save(appointment);
  }

  async remove(id: number): Promise<void> {
    const appointment = await this.findOne(id);

    if (appointment.currentBookings > 0) {
      throw new ConflictException(
        'Cannot delete appointment with existing bookings',
      );
    }

    await this.appointmentRepository.remove(appointment);
  }
}
