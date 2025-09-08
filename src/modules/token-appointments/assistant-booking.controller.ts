import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AssistantBookingService } from './assistant-booking.service';
import { CreatePatientBookingDto } from './dto/create-patient-booking.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RoleType, TokenAppointmentStatus } from '../../entities';

@ApiTags('Assistant Booking')
@Controller('assistant-booking')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AssistantBookingController {
  constructor(private readonly assistantBookingService: AssistantBookingService) {}

  @Post('book-patient')
  @UseGuards(RolesGuard)
  @Roles(RoleType.ASSISTANT)
  @ApiOperation({ summary: 'Book appointment for patient (Assistant only)' })
  @ApiResponse({ status: 201, description: 'Patient appointment booked successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only assistants can book appointments' })
  @ApiResponse({ status: 409, description: 'Conflict - Slot fully booked or patient already has appointment' })
  bookPatient(@Body() createBookingDto: CreatePatientBookingDto, @CurrentUser() user: any) {
    // In a real implementation, you would get the assistant ID from the user's token
    // For now, we'll assume assistantId is passed or derived from user context
    const assistantId = user.assistantId; // This should be set when assistant logs in
    return this.assistantBookingService.createPatientBooking(createBookingDto, assistantId);
  }

  @Get('available-slots')
  @UseGuards(RolesGuard)
  @Roles(RoleType.ASSISTANT)
  @ApiOperation({ summary: 'Get available appointment slots for doctor' })
  @ApiResponse({ status: 200, description: 'Available slots retrieved' })
  @ApiQuery({ name: 'doctorId', description: 'Doctor ID' })
  @ApiQuery({ name: 'date', description: 'Date in YYYY-MM-DD format' })
  getAvailableSlots(@Query('doctorId') doctorId: string, @Query('date') date: string, @CurrentUser() user: any) {
    const assistantId = user.assistantId;
    return this.assistantBookingService.getAvailableSlots(+doctorId, date, assistantId);
  }

  @Get('doctor-bookings')
  @UseGuards(RolesGuard)
  @Roles(RoleType.ASSISTANT)
  @ApiOperation({ summary: 'Get all bookings for doctor on specific date' })
  @ApiResponse({ status: 200, description: 'Doctor bookings retrieved' })
  @ApiQuery({ name: 'doctorId', description: 'Doctor ID' })
  @ApiQuery({ name: 'date', description: 'Date in YYYY-MM-DD format' })
  getDoctorBookings(@Query('doctorId') doctorId: string, @Query('date') date: string, @CurrentUser() user: any) {
    const assistantId = user.assistantId;
    return this.assistantBookingService.getDoctorBookings(+doctorId, date, assistantId);
  }

  @Get('todays-bookings')
  @UseGuards(RolesGuard)
  @Roles(RoleType.ASSISTANT)
  @ApiOperation({ summary: 'Get today\'s bookings for assistant\'s doctor' })
  @ApiResponse({ status: 200, description: 'Today\'s bookings retrieved' })
  getTodaysBookings(@CurrentUser() user: any) {
    const assistantId = user.assistantId;
    return this.assistantBookingService.getTodaysBookings(assistantId);
  }

  @Patch('booking/:id/status')
  @UseGuards(RolesGuard)
  @Roles(RoleType.ASSISTANT)
  @ApiOperation({ summary: 'Update booking status' })
  @ApiResponse({ status: 200, description: 'Booking status updated' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiQuery({ name: 'status', description: 'New status', enum: TokenAppointmentStatus })
  updateBookingStatus(@Param('id') id: string, @Query('status') status: TokenAppointmentStatus, @CurrentUser() user: any) {
    const assistantId = user.assistantId;
    return this.assistantBookingService.updateBookingStatus(+id, status, assistantId);
  }

  @Get('search-patients')
  @UseGuards(RolesGuard)
  @Roles(RoleType.ASSISTANT)
  @ApiOperation({ summary: 'Search patient bookings by name, phone, or email' })
  @ApiResponse({ status: 200, description: 'Patient bookings found' })
  @ApiQuery({ name: 'search', description: 'Search term (name, phone, or email)' })
  searchPatientBookings(@Query('search') searchTerm: string, @CurrentUser() user: any) {
    const assistantId = user.assistantId;
    return this.assistantBookingService.searchPatientBookings(assistantId, searchTerm);
  }
}
