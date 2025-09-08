import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenAppointmentsService } from './token-appointments.service';
import { AssistantBookingService } from './assistant-booking.service';
import { TokenAppointmentsController } from './token-appointments.controller';
import { AssistantBookingController } from './assistant-booking.controller';
import { TokenAppointment, Appointment, Doctor, Assistant } from '../../entities';

@Module({
  imports: [TypeOrmModule.forFeature([TokenAppointment, Appointment, Doctor, Assistant])],
  controllers: [TokenAppointmentsController, AssistantBookingController],
  providers: [TokenAppointmentsService, AssistantBookingService],
  exports: [TokenAppointmentsService, AssistantBookingService],
})
export class TokenAppointmentsModule {}



