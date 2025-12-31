import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RoleType } from '../../entities/role.entity';
import { DoctorsService } from '../doctors/doctors.service';
import { DoctorBookingService } from './doctor-booking.service';
import { CreatePatientBookingDto } from './dto/create-patient-booking.dto';

interface CurrentUserPayload {
  userId: string; // Phone number (primary key)
  email: string;
  role: RoleType;
}

@ApiTags('Doctor Booking')
@Controller('doctor-booking')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DoctorBookingController {
  constructor(
    private readonly doctorBookingService: DoctorBookingService,
    private readonly doctorsService: DoctorsService,
  ) {}

  @Post('book-patient')
  @Roles(RoleType.DOCTOR)
  @ApiOperation({ summary: 'Book appointment for patient (Doctor only)' })
  @ApiResponse({
    status: 201,
    description: 'Patient appointment booked successfully',
  })
  async bookPatient(
    @Body() dto: CreatePatientBookingDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const doctor = await this.doctorsService.findByUserId(user.userId);
    return this.doctorBookingService.createPatientBooking(dto, doctor.id);
  }

  @Get('available-slots')
  @Roles(RoleType.DOCTOR)
  @ApiOperation({
    summary: 'Get available appointment slots for authenticated doctor',
  })
  @ApiQuery({
    name: 'date',
    description: 'Date in YYYY-MM-DD format',
    required: true,
  })
  @ApiQuery({
    name: 'clinicId',
    description: 'Clinic ID (optional)',
    required: false,
  })
  @ApiResponse({ status: 200, description: 'Available slots retrieved' })
  async getAvailableSlots(
    @Query('date') date: string,
    @Query('clinicId') clinicId: string | undefined,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const doctor = await this.doctorsService.findByUserId(user.userId);
    const clinicIdNum = clinicId ? +clinicId : undefined;
    return this.doctorBookingService.getAvailableSlots(
      doctor.id,
      date,
      clinicIdNum,
    );
  }
}
