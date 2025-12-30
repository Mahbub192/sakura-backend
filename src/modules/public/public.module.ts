import { Module } from '@nestjs/common';
import { AppointmentsModule } from '../appointments/appointments.module';
import { DoctorsModule } from '../doctors/doctors.module';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';

@Module({
  imports: [DoctorsModule, AppointmentsModule],
  controllers: [PublicController],
  providers: [PublicService],
  exports: [PublicService],
})
export class PublicModule {}
