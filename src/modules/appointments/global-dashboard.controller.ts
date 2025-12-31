import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { GlobalDashboardService } from './global-dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleType } from '../../entities/role.entity';

@ApiTags('Global Dashboard')
@Controller('global-dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GlobalDashboardController {
  constructor(
    private readonly globalDashboardService: GlobalDashboardService,
  ) {}

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.DOCTOR)
  @ApiOperation({ summary: 'Get global dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Global statistics retrieved' })
  getGlobalStats() {
    return this.globalDashboardService.getGlobalStats();
  }

  @Get('today-appointments')
  @UseGuards(RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.DOCTOR)
  @ApiOperation({
    summary: 'Get all appointments for today across all doctors',
  })
  @ApiResponse({ status: 200, description: "Today's appointments retrieved" })
  getTodayAllAppointments() {
    return this.globalDashboardService.getTodayAllAppointments();
  }

  @Get('appointments-by-date-range')
  @UseGuards(RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.DOCTOR)
  @ApiOperation({ summary: 'Get appointments by date range' })
  @ApiResponse({
    status: 200,
    description: 'Appointments retrieved for date range',
  })
  @ApiQuery({
    name: 'startDate',
    description: 'Start date in YYYY-MM-DD format',
  })
  @ApiQuery({ name: 'endDate', description: 'End date in YYYY-MM-DD format' })
  getAppointmentsByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.globalDashboardService.getAppointmentsByDateRange(
      startDate,
      endDate,
    );
  }

  @Get('doctor-wise-stats')
  @UseGuards(RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.DOCTOR)
  @ApiOperation({ summary: 'Get doctor-wise statistics' })
  @ApiResponse({ status: 200, description: 'Doctor-wise statistics retrieved' })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Date in YYYY-MM-DD format (defaults to today)',
  })
  getDoctorWiseStats(@Query('date') date?: string) {
    return this.globalDashboardService.getDoctorWiseStats(date);
  }

  @Get('search-appointments')
  @UseGuards(RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.DOCTOR, RoleType.ASSISTANT)
  @ApiOperation({ summary: 'Search appointments globally' })
  @ApiResponse({ status: 200, description: 'Search results retrieved' })
  @ApiQuery({
    name: 'search',
    description:
      'Search term (patient name, phone, email, token number, or doctor name)',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Filter by date in YYYY-MM-DD format',
  })
  searchGlobalAppointments(
    @Query('search') searchTerm: string,
    @Query('date') date?: string,
  ) {
    return this.globalDashboardService.searchGlobalAppointments(
      searchTerm,
      date,
    );
  }
}
