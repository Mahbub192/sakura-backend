import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PublicService } from './public.service';

@ApiTags('Public')
@Controller('api/public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('doctors')
  @ApiOperation({
    summary: 'Get all doctors (public endpoint - no authentication required)',
  })
  @ApiResponse({ status: 200, description: 'List of all doctors' })
  @ApiQuery({
    name: 'specialization',
    required: false,
    description: 'Filter by specialization',
  })
  async getDoctors(@Query('specialization') specialization?: string) {
    const doctors = await this.publicService.getDoctors();

    // Filter by specialization if provided
    if (specialization) {
      return doctors.filter((doctor) =>
        doctor.specialization
          ?.toLowerCase()
          .includes(specialization.toLowerCase()),
      );
    }

    return doctors;
  }

  @Get('doctors/:id')
  @ApiOperation({
    summary: 'Get doctor by ID (public endpoint - no authentication required)',
  })
  @ApiResponse({ status: 200, description: 'Doctor found' })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  @ApiParam({ name: 'id', description: 'Doctor ID' })
  async getDoctorById(@Param('id', ParseIntPipe) id: number) {
    return this.publicService.getDoctorById(id);
  }

  @Get('available-appointments')
  @ApiOperation({
    summary:
      'Get available appointments (public endpoint - no authentication required)',
  })
  @ApiResponse({ status: 200, description: 'List of available appointments' })
  @ApiQuery({
    name: 'doctorId',
    required: false,
    description: 'Filter by doctor ID',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Filter by date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'clinicId',
    required: false,
    description: 'Filter by clinic ID',
  })
  async getAvailableAppointments(
    @Query('doctorId') doctorId?: string,
    @Query('date') date?: string,
    @Query('clinicId') clinicId?: string,
  ) {
    return this.publicService.getAvailableAppointments({
      doctorId: doctorId ? parseInt(doctorId, 10) : undefined,
      date,
      clinicId: clinicId ? parseInt(clinicId, 10) : undefined,
    });
  }

  @Get('doctors-with-slots')
  @ApiOperation({
    summary:
      'Get doctors with available slots (public endpoint - no authentication required)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of doctors with available appointment slots',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Filter by date (YYYY-MM-DD)',
  })
  async getDoctorsWithAvailableSlots(@Query('date') date?: string) {
    return this.publicService.getDoctorsWithAvailableSlots(date);
  }
}
