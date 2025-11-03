import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TokenAppointmentsService } from './token-appointments.service';
import { CreateTokenAppointmentDto } from './dto/create-token-appointment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RoleType } from '../../entities/role.entity';
import { TokenAppointmentStatus } from '../../entities/token-appointment.entity';
import { DoctorsService } from '../doctors/doctors.service';

@ApiTags('Token Appointments')
@Controller('token-appointments')
export class TokenAppointmentsController {
  constructor(
    private readonly tokenAppointmentsService: TokenAppointmentsService,
    private readonly doctorsService: DoctorsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Book an appointment (create token appointment)' })
  @ApiResponse({ status: 201, description: 'Appointment booked successfully' })
  @ApiResponse({ status: 409, description: 'Appointment slot is full or patient already has booking' })
  create(@Body() createTokenAppointmentDto: CreateTokenAppointmentDto) {
    return this.tokenAppointmentsService.create(createTokenAppointmentDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.DOCTOR, RoleType.ASSISTANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all token appointments' })
  @ApiResponse({ status: 200, description: 'List of all token appointments' })
  @ApiQuery({ name: 'doctorId', required: false, description: 'Filter by doctor ID' })
  @ApiQuery({ name: 'clinicId', required: false, description: 'Filter by clinic ID' })
  @ApiQuery({ name: 'date', required: false, description: 'Filter by date (YYYY-MM-DD)' })
  async findAll(
    @Query('doctorId') doctorId?: string,
    @Query('clinicId') clinicId?: string,
    @Query('date') date?: string,
    @CurrentUser() user?: any,
  ) {
    // If user is a doctor, automatically filter by their doctor ID
    if (user && user.role === RoleType.DOCTOR && !doctorId) {
      try {
        const doctor = await this.doctorsService.findByUserId(user.userId);
        if (doctor) {
          return this.tokenAppointmentsService.findWithFilters(doctor.id, clinicId ? +clinicId : undefined, date);
        }
      } catch (error) {
        // If doctor profile doesn't exist, return empty array
        return [];
      }
    }

    return this.tokenAppointmentsService.findWithFilters(
      doctorId ? +doctorId : undefined,
      clinicId ? +clinicId : undefined,
      date,
    );
  }

  @Get('my-appointments')
  @ApiOperation({ summary: 'Get appointments by patient email' })
  @ApiResponse({ status: 200, description: 'List of patient appointments' })
  @ApiQuery({ name: 'email', required: true, description: 'Patient email address' })
  findMyAppointments(@Query('email') email: string) {
    return this.tokenAppointmentsService.findByPatientEmail(email);
  }

  @Get('token/:tokenNumber')
  @ApiOperation({ summary: 'Get appointment by token number' })
  @ApiResponse({ status: 200, description: 'Token appointment found' })
  @ApiResponse({ status: 404, description: 'Token appointment not found' })
  @ApiParam({ name: 'tokenNumber', description: 'Token number' })
  findByToken(@Param('tokenNumber') tokenNumber: string) {
    return this.tokenAppointmentsService.findByTokenNumber(tokenNumber);
  }

  @Get('doctor/:doctorId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.DOCTOR, RoleType.ASSISTANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get appointments for a specific doctor' })
  @ApiResponse({ status: 200, description: 'List of doctor appointments' })
  @ApiParam({ name: 'doctorId', description: 'Doctor ID' })
  findByDoctor(@Param('doctorId') doctorId: string) {
    return this.tokenAppointmentsService.findByDoctor(+doctorId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get token appointment by ID' })
  @ApiResponse({ status: 200, description: 'Token appointment found' })
  @ApiResponse({ status: 404, description: 'Token appointment not found' })
  @ApiParam({ name: 'id', description: 'Token appointment ID' })
  findOne(@Param('id') id: string) {
    return this.tokenAppointmentsService.findOne(+id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.DOCTOR, RoleType.ASSISTANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update token appointment status' })
  @ApiResponse({ status: 200, description: 'Token appointment status updated' })
  @ApiResponse({ status: 404, description: 'Token appointment not found' })
  @ApiParam({ name: 'id', description: 'Token appointment ID' })
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: TokenAppointmentStatus },
  ) {
    return this.tokenAppointmentsService.updateStatus(+id, body.status);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.DOCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel/Delete token appointment' })
  @ApiResponse({ status: 200, description: 'Token appointment cancelled' })
  @ApiResponse({ status: 404, description: 'Token appointment not found' })
  @ApiParam({ name: 'id', description: 'Token appointment ID' })
  remove(@Param('id') id: string) {
    return this.tokenAppointmentsService.remove(+id);
  }
}



