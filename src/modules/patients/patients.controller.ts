import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RoleType } from '../../entities/role.entity';
import { BookAppointmentDto } from './dto';
import { PatientsService } from './patients.service';

interface CurrentUserPayload {
  userId: string; // Phone number (primary key)
  email: string;
  role: RoleType;
}

@ApiTags('Patients')
@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.USER)
@ApiBearerAuth()
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post('book-appointment')
  @ApiOperation({ summary: 'Book an appointment (Patient self-booking)' })
  @ApiResponse({ status: 201, description: 'Appointment booked successfully' })
  @ApiResponse({ status: 404, description: 'Appointment slot not found' })
  @ApiResponse({
    status: 409,
    description: 'Slot is fully booked or duplicate booking',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Email mismatch' })
  bookAppointment(
    @Body() bookAppointmentDto: BookAppointmentDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.patientsService.bookAppointment(bookAppointmentDto, user.email);
  }

  @Get('my-appointments')
  @ApiOperation({ summary: 'Get all my appointments' })
  @ApiResponse({ status: 200, description: 'List of patient appointments' })
  getMyAppointments(@CurrentUser() user: CurrentUserPayload) {
    return this.patientsService.getMyAppointments(user.email);
  }

  @Get('upcoming-appointments')
  @ApiOperation({ summary: 'Get my upcoming appointments for today' })
  @ApiResponse({ status: 200, description: "List of today's appointments" })
  getUpcomingAppointments(@CurrentUser() user: CurrentUserPayload) {
    return this.patientsService.getUpcomingAppointments(user.email);
  }

  @Get('appointments/:id')
  @ApiOperation({ summary: 'Get appointment by ID' })
  @ApiResponse({ status: 200, description: 'Appointment details' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your appointment' })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  getAppointmentById(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.patientsService.getAppointmentById(+id, user.email);
  }

  @Get('appointment-history')
  @ApiOperation({ summary: 'Get appointment history' })
  @ApiResponse({ status: 200, description: 'Appointment history' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of appointments to retrieve',
    type: Number,
  })
  getAppointmentHistory(
    @CurrentUser() user: CurrentUserPayload,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.patientsService.getAppointmentHistory(user.email, limitNum);
  }

  @Delete('appointments/:id/cancel')
  @ApiOperation({ summary: 'Cancel an appointment' })
  @ApiResponse({
    status: 200,
    description: 'Appointment cancelled successfully',
  })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your appointment' })
  @ApiResponse({ status: 409, description: 'Cannot cancel this appointment' })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  cancelAppointment(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.patientsService.cancelAppointment(+id, user.email);
  }
}
