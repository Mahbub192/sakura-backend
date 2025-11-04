import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenAppointmentsService } from './token-appointments.service';
import { AssistantBookingService } from './assistant-booking.service';
import { TokenAppointmentsController } from './token-appointments.controller';
import { AssistantBookingController } from './assistant-booking.controller';
import { TokenAppointment, Appointment, Doctor, Assistant } from '../../entities';
import { DoctorsModule } from '../doctors/doctors.module';
import { AssistantsModule } from '../assistants/assistants.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TokenAppointment, Appointment, Doctor, Assistant]),
    DoctorsModule,
    AssistantsModule,
  ],
  controllers: [TokenAppointmentsController, AssistantBookingController],
  providers: [TokenAppointmentsService, AssistantBookingService],
  exports: [TokenAppointmentsService, AssistantBookingService],
})
export class TokenAppointmentsModule {}



