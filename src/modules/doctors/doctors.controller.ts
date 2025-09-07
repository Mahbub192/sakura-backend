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
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto, UpdateDoctorDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RoleType } from '../../entities/role.entity';

@ApiTags('Doctors')
@Controller('doctors')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiOperation({ summary: 'Create a new doctor profile' })
  @ApiResponse({ status: 201, description: 'Doctor profile created successfully' })
  @ApiResponse({ status: 409, description: 'Conflict - Doctor already exists or license number in use' })
  create(@Body() createDoctorDto: CreateDoctorDto) {
    return this.doctorsService.create(createDoctorDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all doctors' })
  @ApiResponse({ status: 200, description: 'List of all doctors' })
  @ApiQuery({ name: 'specialization', required: false, description: 'Filter by specialization' })
  findAll(@Query('specialization') specialization?: string) {
    if (specialization) {
      return this.doctorsService.findBySpecialization(specialization);
    }
    return this.doctorsService.findAll();
  }

  @Get('profile')
  @UseGuards(RolesGuard)
  @Roles(RoleType.DOCTOR)
  @ApiOperation({ summary: 'Get current doctor profile' })
  @ApiResponse({ status: 200, description: 'Doctor profile retrieved' })
  @ApiResponse({ status: 404, description: 'Doctor profile not found' })
  getProfile(@CurrentUser() user: any) {
    return this.doctorsService.findByUserId(user.userId);
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
}
