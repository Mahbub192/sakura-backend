import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorsService } from './doctors.service';
import { DoctorDashboardService } from './doctor-dashboard.service';
import { DoctorsController } from './doctors.controller';
import { Doctor, User, Appointment, TokenAppointment, Assistant, Clinic } from '../../entities';
import { AssistantsModule } from '../assistants/assistants.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Doctor, User, Appointment, TokenAppointment, Assistant, Clinic]),
    AssistantsModule,
  ],
  controllers: [DoctorsController],
  providers: [DoctorsService, DoctorDashboardService],
  exports: [DoctorsService, DoctorDashboardService],
})
export class DoctorsModule {}



