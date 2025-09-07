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
import { ClinicsService } from './clinics.service';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { UpdateClinicDto } from './dto/update-clinic.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleType } from '../../entities/role.entity';

@ApiTags('Clinics')
@Controller('clinics')
export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new clinic' })
  @ApiResponse({ status: 201, description: 'Clinic created successfully' })
  create(@Body() createClinicDto: CreateClinicDto) {
    return this.clinicsService.create(createClinicDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all clinics' })
  @ApiResponse({ status: 200, description: 'List of all clinics' })
  @ApiQuery({ name: 'city', required: false, description: 'Filter by city' })
  findAll(@Query('city') city?: string) {
    if (city) {
      return this.clinicsService.findByCity(city);
    }
    return this.clinicsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get clinic by ID' })
  @ApiResponse({ status: 200, description: 'Clinic found' })
  @ApiResponse({ status: 404, description: 'Clinic not found' })
  @ApiParam({ name: 'id', description: 'Clinic ID' })
  findOne(@Param('id') id: string) {
    return this.clinicsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update clinic' })
  @ApiResponse({ status: 200, description: 'Clinic updated' })
  @ApiResponse({ status: 404, description: 'Clinic not found' })
  @ApiParam({ name: 'id', description: 'Clinic ID' })
  update(@Param('id') id: string, @Body() updateClinicDto: UpdateClinicDto) {
    return this.clinicsService.update(+id, updateClinicDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete clinic' })
  @ApiResponse({ status: 200, description: 'Clinic deleted' })
  @ApiResponse({ status: 404, description: 'Clinic not found' })
  @ApiParam({ name: 'id', description: 'Clinic ID' })
  remove(@Param('id') id: string) {
    return this.clinicsService.remove(+id);
  }
}
