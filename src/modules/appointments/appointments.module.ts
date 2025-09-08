import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsService } from './appointments.service';
import { GlobalDashboardService } from './global-dashboard.service';
import { AppointmentsController } from './appointments.controller';
import { GlobalDashboardController } from './global-dashboard.controller';
import { Appointment, Doctor, Clinic, TokenAppointment } from '../../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, Doctor, Clinic, TokenAppointment])],
  controllers: [AppointmentsController, GlobalDashboardController],
  providers: [AppointmentsService, GlobalDashboardService],
  exports: [AppointmentsService, GlobalDashboardService],
})
export class AppointmentsModule {}



