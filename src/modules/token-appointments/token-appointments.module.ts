import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Appointment,
  Assistant,
  Doctor,
  TokenAppointment,
} from '../../entities';
import { AssistantsModule } from '../assistants/assistants.module';
import { DoctorsModule } from '../doctors/doctors.module';
import { AssistantBookingController } from './assistant-booking.controller';
import { AssistantBookingService } from './assistant-booking.service';
import { DoctorBookingController } from './doctor-booking.controller';
import { DoctorBookingService } from './doctor-booking.service';
import { LivePatientsGateway } from './live-patients.gateway';
import { TokenAppointmentsController } from './token-appointments.controller';
import { TokenAppointmentsService } from './token-appointments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TokenAppointment,
      Appointment,
      Doctor,
      Assistant,
    ]),
    DoctorsModule,
    AssistantsModule,
  ],
  controllers: [
    TokenAppointmentsController,
    AssistantBookingController,
    DoctorBookingController,
  ],
  providers: [
    TokenAppointmentsService,
    AssistantBookingService,
    DoctorBookingService,
    LivePatientsGateway,
  ],
  exports: [
    TokenAppointmentsService,
    AssistantBookingService,
    DoctorBookingService,
  ],
})
export class TokenAppointmentsModule {}
