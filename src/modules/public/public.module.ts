import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Doctor } from '../../entities/doctor.entity';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { AppointmentsModule } from '../appointments/appointments.module';
import { TokenAppointmentsModule } from '../token-appointments/token-appointments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Doctor]),
    AppointmentsModule,
    TokenAppointmentsModule,
  ],
  controllers: [PublicController],
  providers: [PublicService],
  exports: [PublicService],
})
export class PublicModule {}
