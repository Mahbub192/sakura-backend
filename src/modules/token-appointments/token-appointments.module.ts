import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenAppointmentsService } from './token-appointments.service';
import { TokenAppointmentsController } from './token-appointments.controller';
import { TokenAppointment, Appointment, Doctor } from '../../entities';

@Module({
  imports: [TypeOrmModule.forFeature([TokenAppointment, Appointment, Doctor])],
  controllers: [TokenAppointmentsController],
  providers: [TokenAppointmentsService],
  exports: [TokenAppointmentsService],
})
export class TokenAppointmentsModule {}
