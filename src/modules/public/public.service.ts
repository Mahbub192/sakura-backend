import { Injectable } from '@nestjs/common';
import { AppointmentsService } from '../appointments/appointments.service';
import { DoctorsService } from '../doctors/doctors.service';

@Injectable()
export class PublicService {
  constructor(
    private readonly doctorsService: DoctorsService,
    private readonly appointmentsService: AppointmentsService,
  ) {}

  async getDoctors() {
    return this.doctorsService.findAll();
  }

  async getDoctorById(id: number) {
    return this.doctorsService.findOne(id);
  }

  async getAvailableAppointments(filters?: {
    doctorId?: number;
    date?: string;
    clinicId?: number;
  }) {
    return this.appointmentsService.findAvailableSlots(
      filters?.doctorId,
      filters?.date,
      filters?.clinicId,
    );
  }

  async getDoctorsWithAvailableSlots(date?: string) {
    // Get all available appointments for the date (or future dates if no date specified)
    const appointments = await this.appointmentsService.findAvailableSlots(
      undefined,
      date,
    );

    // Group appointments by doctor and get unique doctors
    const doctorMap = new Map<
      number,
      {
        id: number;
        availableSlots: Array<{
          id: number;
          date: Date;
          startTime: string;
          endTime: string;
          availableSpots: number;
          clinic: unknown;
        }>;
        [key: string]: unknown;
      }
    >();

    for (const appointment of appointments) {
      if (appointment.doctor && !doctorMap.has(appointment.doctor.id)) {
        doctorMap.set(appointment.doctor.id, {
          ...appointment.doctor,
          availableSlots: [],
        } as {
          id: number;
          availableSlots: Array<{
            id: number;
            date: Date;
            startTime: string;
            endTime: string;
            availableSpots: number;
            clinic: unknown;
          }>;
          [key: string]: unknown;
        });
      }

      if (appointment.doctor) {
        const doctor = doctorMap.get(appointment.doctor.id);
        if (doctor) {
          doctor.availableSlots.push({
            id: appointment.id,
            date: appointment.date,
            startTime: appointment.startTime,
            endTime: appointment.endTime,
            availableSpots:
              appointment.maxPatients - appointment.currentBookings,
            clinic: appointment.clinic,
          });
        }
      }
    }

    return Array.from(doctorMap.values());
  }
}
