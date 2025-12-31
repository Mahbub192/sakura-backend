import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
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
import { AssistantsService } from '../assistants/assistants.service';
import { DoctorDashboardService } from './doctor-dashboard.service';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto, UpdateDoctorDto } from './dto';
import { ClinicInfoDto } from './dto/clinic-info.dto';
import { CreateAppointmentScheduleDto } from './dto/create-appointment-schedule.dto';
import { CreateMyDoctorProfileDto } from './dto/create-my-profile.dto';
import { NotificationSettingsDto } from './dto/notification-settings.dto';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';

interface CurrentUserPayload {
  userId: string; // Phone number (primary key)
  email: string;
  role: RoleType;
}

@ApiTags('Doctors')
@Controller('doctors')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DoctorsController {
  constructor(
    private readonly doctorsService: DoctorsService,
    private readonly dashboardService: DoctorDashboardService,
    private readonly assistantsService: AssistantsService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiOperation({ summary: 'Create a new doctor profile' })
  @ApiResponse({
    status: 201,
    description: 'Doctor profile created successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Doctor already exists or license number in use',
  })
  create(@Body() createDoctorDto: CreateDoctorDto) {
    return this.doctorsService.create(createDoctorDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all doctors' })
  @ApiResponse({ status: 200, description: 'List of all doctors' })
  @ApiQuery({
    name: 'specialization',
    required: false,
    description: 'Filter by specialization',
  })
  async findAll(
    @Query('specialization') specialization?: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    // If user is an assistant, return only their assigned doctor's profile
    if (user && user.role === RoleType.ASSISTANT) {
      try {
        const assistant = await this.assistantsService.getAssistantByUserId(
          user.userId,
        );
        if (assistant && assistant.doctorId) {
          const doctor = await this.doctorsService.findOne(assistant.doctorId);
          return doctor ? [doctor] : [];
        }
      } catch {
        return [];
      }
    }

    // If user is a doctor, return only their own profile
    if (user && user.role === RoleType.DOCTOR) {
      try {
        const doctor = await this.doctorsService.findByUserId(user.userId);
        if (doctor) {
          return [doctor];
        }
      } catch {
        return [];
      }
    }

    if (specialization) {
      return this.doctorsService.findBySpecialization(specialization);
    }
    return this.doctorsService.findAll();
  }

  @Get('profile')
  @UseGuards(RolesGuard)
  @Roles(RoleType.DOCTOR, RoleType.ASSISTANT)
  @ApiOperation({ summary: 'Get current doctor profile (Doctor or Assistant)' })
  @ApiResponse({ status: 200, description: 'Doctor profile retrieved' })
  @ApiResponse({ status: 404, description: 'Doctor profile not found' })
  async getProfile(@CurrentUser() user: CurrentUserPayload) {
    // If assistant, return their assigned doctor's profile
    if (user.role === RoleType.ASSISTANT) {
      const assistant = await this.assistantsService.getAssistantByUserId(
        user.userId,
      );
      if (assistant && assistant.doctorId) {
        return this.doctorsService.findOne(assistant.doctorId);
      }
      throw new NotFoundException('Assistant doctor not found');
    }
    // If doctor, return their own profile
    return this.doctorsService.findByUserId(user.userId);
  }

  @Get('check-profile')
  @UseGuards(RolesGuard)
  @Roles(RoleType.DOCTOR)
  @ApiOperation({ summary: 'Check if doctor profile exists' })
  @ApiResponse({ status: 200, description: 'Profile check result' })
  checkProfile(@CurrentUser() user: CurrentUserPayload) {
    return this.doctorsService.checkProfileExists(user.userId);
  }

  @Post('my-profile')
  @UseGuards(RolesGuard)
  @Roles(RoleType.DOCTOR)
  @ApiOperation({ summary: 'Create my doctor profile (self-service)' })
  @ApiResponse({
    status: 201,
    description: 'Doctor profile created successfully',
  })
  @ApiResponse({ status: 409, description: 'Doctor profile already exists' })
  createMyProfile(
    @Body() createProfileDto: CreateMyDoctorProfileDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.doctorsService.createMyProfile(user.userId, createProfileDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get doctor by ID' })
  @ApiResponse({ status: 200, description: 'Doctor found' })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  @ApiParam({ name: 'id', description: 'Doctor ID' })
  findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.DOCTOR)
  @ApiOperation({ summary: 'Update doctor profile' })
  @ApiResponse({ status: 200, description: 'Doctor profile updated' })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  @ApiParam({ name: 'id', description: 'Doctor ID' })
  update(@Param('id') id: string, @Body() updateDoctorDto: UpdateDoctorDto) {
    return this.doctorsService.update(+id, updateDoctorDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiOperation({ summary: 'Delete doctor profile' })
  @ApiResponse({ status: 200, description: 'Doctor profile deleted' })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  @ApiParam({ name: 'id', description: 'Doctor ID' })
  remove(@Param('id') id: string) {
    return this.doctorsService.remove(+id);
  }

  // Dashboard endpoints
  @Get('dashboard/stats')
  @UseGuards(RolesGuard)
  @Roles(RoleType.DOCTOR, RoleType.ASSISTANT)
  @ApiOperation({
    summary: 'Get doctor dashboard statistics (Doctor or Assistant)',
  })
  @ApiResponse({ status: 200, description: 'Dashboard statistics retrieved' })
  async getDashboardStats(@CurrentUser() user: CurrentUserPayload) {
    // If assistant, get stats for their assigned doctor
    if (user.role === RoleType.ASSISTANT) {
      const assistant = await this.assistantsService.getAssistantByUserId(
        user.userId,
      );
      if (assistant && assistant.doctorId) {
        const doctor = await this.doctorsService.findOne(assistant.doctorId);
        if (doctor && doctor.userPhone) {
          return this.dashboardService.getDashboardStats(doctor.userPhone);
        }
      }
      throw new NotFoundException('Assistant doctor not found');
    }
    return this.dashboardService.getDashboardStats(user.userId);
  }

  @Get('dashboard/today-appointments')
  @UseGuards(RolesGuard)
  @Roles(RoleType.DOCTOR, RoleType.ASSISTANT)
  @ApiOperation({
    summary: "Get today's appointments for doctor (Doctor or Assistant)",
  })
  @ApiResponse({ status: 200, description: "Today's appointments retrieved" })
  async getTodayAppointments(@CurrentUser() user: CurrentUserPayload) {
    // If assistant, get appointments for their assigned doctor
    if (user.role === RoleType.ASSISTANT) {
      const assistant = await this.assistantsService.getAssistantByUserId(
        user.userId,
      );
      if (assistant && assistant.doctorId) {
        const doctor = await this.doctorsService.findOne(assistant.doctorId);
        if (doctor && doctor.userPhone) {
          return this.dashboardService.getTodayAppointments(doctor.userPhone);
        }
      }
      throw new NotFoundException('Assistant doctor not found');
    }
    return this.dashboardService.getTodayAppointments(user.userId);
  }

  @Post('dashboard/create-schedule')
  @UseGuards(RolesGuard)
  @Roles(RoleType.DOCTOR)
  @ApiOperation({ summary: 'Create appointment schedule for a day' })
  @ApiResponse({ status: 201, description: 'Appointment schedule created' })
  @ApiResponse({ status: 400, description: 'Invalid schedule data' })
  createAppointmentSchedule(
    @Body() scheduleDto: CreateAppointmentScheduleDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.dashboardService.createAppointmentSchedule(
      user.userId,
      scheduleDto,
    );
  }

  @Get('dashboard/upcoming-appointments')
  @UseGuards(RolesGuard)
  @Roles(RoleType.DOCTOR, RoleType.ASSISTANT)
  @ApiOperation({ summary: 'Get upcoming appointments (Doctor or Assistant)' })
  @ApiResponse({ status: 200, description: 'Upcoming appointments retrieved' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of appointments to retrieve',
  })
  async getUpcomingAppointments(
    @CurrentUser() user: CurrentUserPayload,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit) : 10;
    // If assistant, get appointments for their assigned doctor
    if (user.role === RoleType.ASSISTANT) {
      const assistant = await this.assistantsService.getAssistantByUserId(
        user.userId,
      );
      if (assistant && assistant.doctorId) {
        const doctor = await this.doctorsService.findOne(assistant.doctorId);
        if (doctor && doctor.userPhone) {
          return this.dashboardService.getUpcomingAppointments(
            doctor.userPhone,
            limitNum,
          );
        }
      }
      throw new NotFoundException('Assistant doctor not found');
    }
    return this.dashboardService.getUpcomingAppointments(user.userId, limitNum);
  }

  @Get('dashboard/monthly-appointments')
  @UseGuards(RolesGuard)
  @Roles(RoleType.DOCTOR)
  @ApiOperation({ summary: 'Get monthly appointments' })
  @ApiResponse({ status: 200, description: 'Monthly appointments retrieved' })
  @ApiQuery({ name: 'month', description: 'Month (1-12)' })
  @ApiQuery({ name: 'year', description: 'Year' })
  getMonthlyAppointments(
    @CurrentUser() user: CurrentUserPayload,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.dashboardService.getMonthlyAppointments(
      user.userId,
      parseInt(month),
      parseInt(year),
    );
  }

  @Patch('profile/update')
  @UseGuards(RolesGuard)
  @Roles(RoleType.DOCTOR)
  @ApiOperation({ summary: 'Update doctor profile information' })
  @ApiResponse({
    status: 200,
    description: 'Doctor profile updated successfully',
  })
  updateProfile(
    @Body() updateProfileDto: UpdateDoctorProfileDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.dashboardService.updateDoctorProfile(
      user.userId,
      updateProfileDto,
    );
  }

  // Notification Settings
  @Get('notification-settings')
  @UseGuards(RolesGuard)
  @Roles(RoleType.DOCTOR)
  @ApiOperation({ summary: 'Get doctor notification settings' })
  @ApiResponse({ status: 200, description: 'Notification settings retrieved' })
  getNotificationSettings(@CurrentUser() user: CurrentUserPayload) {
    return this.dashboardService.getNotificationSettings(user.userId);
  }

  @Patch('notification-settings')
  @UseGuards(RolesGuard)
  @Roles(RoleType.DOCTOR)
  @ApiOperation({ summary: 'Update doctor notification settings' })
  @ApiResponse({
    status: 200,
    description: 'Notification settings updated successfully',
  })
  updateNotificationSettings(
    @Body() settingsDto: NotificationSettingsDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.dashboardService.updateNotificationSettings(
      user.userId,
      settingsDto,
    );
  }

  // Clinic Info
  @Get('clinic-info')
  @UseGuards(RolesGuard)
  @Roles(RoleType.DOCTOR)
  @ApiOperation({ summary: 'Get doctor clinic information' })
  @ApiResponse({ status: 200, description: 'Clinic information retrieved' })
  getClinicInfo(@CurrentUser() user: CurrentUserPayload) {
    return this.dashboardService.getClinicInfo(user.userId);
  }

  @Patch('clinic-info')
  @UseGuards(RolesGuard)
  @Roles(RoleType.DOCTOR)
  @ApiOperation({ summary: 'Update doctor clinic information' })
  @ApiResponse({
    status: 200,
    description: 'Clinic information updated successfully',
  })
  updateClinicInfo(
    @Body() clinicInfoDto: ClinicInfoDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.dashboardService.updateClinicInfo(user.userId, clinicInfoDto);
  }

  // Billing Stats
  @Get('billing-stats')
  @UseGuards(RolesGuard)
  @Roles(RoleType.DOCTOR)
  @ApiOperation({ summary: 'Get doctor billing statistics' })
  @ApiResponse({ status: 200, description: 'Billing statistics retrieved' })
  getBillingStats(@CurrentUser() user: CurrentUserPayload) {
    return this.dashboardService.getBillingStats(user.userId);
  }
}
