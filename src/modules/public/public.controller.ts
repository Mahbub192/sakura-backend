import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PublicService } from './public.service';

@ApiTags('Public')
@Controller('api/public')
export class PublicController { 
  constructor(private readonly publicService: PublicService) {}

  @Get('doctors')
  @ApiOperation({ summary: 'Get public doctor list' })
  @ApiResponse({ status: 200, description: 'List of active doctors' })
  getDoctors() {
    return this.publicService.getDoctors();
  }

  @Get('doctors/:id')
  @ApiOperation({ summary: 'Get doctor by ID with details' })
  @ApiResponse({ status: 200, description: 'Doctor details' })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  getDoctorById(@Param('id') id: string) {
    return this.publicService.getDoctorById(id);
  }

  @Get('available-appointments')
  @ApiOperation({ summary: 'Get available appointment slots' })
  @ApiResponse({ status: 200, description: 'List of available appointment slots' })
  @ApiQuery({ name: 'doctorId', required: false, description: 'Filter by doctor ID', type: Number })
  @ApiQuery({ name: 'date', required: false, description: 'Filter by date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'clinicId', required: false, description: 'Filter by clinic ID', type: Number })
  getAvailableAppointments(
    @Query('doctorId') doctorId?: string,
    @Query('date') date?: string,
    @Query('clinicId') clinicId?: string,
  ) {
    const doctorIdNum = doctorId ? parseInt(doctorId, 10) : undefined;
    const clinicIdNum = clinicId ? parseInt(clinicId, 10) : undefined;
    return this.publicService.getAvailableAppointments(doctorIdNum, date, clinicIdNum);
  }

  @Get('doctors-with-slots')
  @ApiOperation({ summary: 'Get doctors with available appointment slots' })
  @ApiResponse({ status: 200, description: 'List of doctors with available slots count' })
  @ApiQuery({ name: 'date', required: false, description: 'Filter by date (YYYY-MM-DD)' })
  getDoctorsWithAvailableSlots(@Query('date') date?: string) {
    return this.publicService.getDoctorsWithAvailableSlots(date);
  }
}
