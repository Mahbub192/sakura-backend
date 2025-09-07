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
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleType } from '../../entities/role.entity';
import { AppointmentStatus } from '../../entities/appointment.entity';

@ApiTags('Appointments')
@Controller('appointments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.DOCTOR)
  @ApiOperation({ summary: 'Create a new appointment slot' })
  @ApiResponse({ status: 201, description: 'Appointment slot created successfully' })
  @ApiResponse({ status: 409, description: 'Conflicting appointment time' })
  create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.create(createAppointmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all appointment slots' })
  @ApiResponse({ status: 200, description: 'List of all appointment slots' })
  @ApiQuery({ name: 'doctorId', required: false, description: 'Filter by doctor ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for date range filter (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for date range filter (YYYY-MM-DD)' })
  findAll(
    @Query('doctorId') doctorId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (doctorId) {
      return this.appointmentsService.findByDoctor(+doctorId);
    }
    
    if (startDate && endDate) {
      return this.appointmentsService.findByDateRange(startDate, endDate);
    }
    
    return this.appointmentsService.findAll();
  }

  @Get('available')
  @ApiOperation({ summary: 'Get available appointment slots' })
  @ApiResponse({ status: 200, description: 'List of available appointment slots' })
  @ApiQuery({ name: 'doctorId', required: false, description: 'Filter by doctor ID' })
  @ApiQuery({ name: 'date', required: false, description: 'Filter by specific date (YYYY-MM-DD)' })
  findAvailable(
    @Query('doctorId') doctorId?: string,
    @Query('date') date?: string,
  ) {
    return this.appointmentsService.findAvailableSlots(
      doctorId ? +doctorId : undefined,
      date,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get appointment slot by ID' })
  @ApiResponse({ status: 200, description: 'Appointment slot found' })
  @ApiResponse({ status: 404, description: 'Appointment slot not found' })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(+id);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.DOCTOR)
  @ApiOperation({ summary: 'Update appointment status' })
  @ApiResponse({ status: 200, description: 'Appointment status updated' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: AppointmentStatus },
  ) {
    return this.appointmentsService.updateStatus(+id, body.status);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.DOCTOR)
  @ApiOperation({ summary: 'Delete appointment slot' })
  @ApiResponse({ status: 200, description: 'Appointment slot deleted' })
  @ApiResponse({ status: 404, description: 'Appointment slot not found' })
  @ApiResponse({ status: 409, description: 'Cannot delete appointment with existing bookings' })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(+id);
  }
}



