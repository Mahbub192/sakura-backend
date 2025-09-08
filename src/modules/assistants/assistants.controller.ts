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
import { AssistantsService } from './assistants.service';
import { CreateAssistantDto, UpdateAssistantDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RoleType } from '../../entities/role.entity';

@ApiTags('Assistants')
@Controller('assistants')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AssistantsController {
  constructor(private readonly assistantsService: AssistantsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleType.DOCTOR)
  @ApiOperation({ summary: 'Create a new assistant (Doctor only)' })
  @ApiResponse({ status: 201, description: 'Assistant created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only doctors can create assistants' })
  @ApiResponse({ status: 409, description: 'Conflict - Assistant email already exists' })
  create(@Body() createAssistantDto: CreateAssistantDto, @CurrentUser() user: any) {
    return this.assistantsService.create(createAssistantDto, user.userId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(RoleType.DOCTOR)
  @ApiOperation({ summary: 'Get all assistants for current doctor' })
  @ApiResponse({ status: 200, description: 'List of assistants' })
  findAllByDoctor(@CurrentUser() user: any) {
    return this.assistantsService.findAllByCurrentDoctor(user.userId);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleType.DOCTOR)
  @ApiOperation({ summary: 'Get assistant by ID' })
  @ApiResponse({ status: 200, description: 'Assistant found' })
  @ApiResponse({ status: 404, description: 'Assistant not found' })
  @ApiParam({ name: 'id', description: 'Assistant ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.assistantsService.findOne(+id, user.userId);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleType.DOCTOR)
  @ApiOperation({ summary: 'Update assistant' })
  @ApiResponse({ status: 200, description: 'Assistant updated' })
  @ApiResponse({ status: 404, description: 'Assistant not found' })
  @ApiParam({ name: 'id', description: 'Assistant ID' })
  update(@Param('id') id: string, @Body() updateAssistantDto: UpdateAssistantDto, @CurrentUser() user: any) {
    return this.assistantsService.update(+id, updateAssistantDto, user.userId);
  }

  @Patch(':id/toggle-status')
  @UseGuards(RolesGuard)
  @Roles(RoleType.DOCTOR)
  @ApiOperation({ summary: 'Toggle assistant active status' })
  @ApiResponse({ status: 200, description: 'Assistant status toggled' })
  @ApiResponse({ status: 404, description: 'Assistant not found' })
  @ApiParam({ name: 'id', description: 'Assistant ID' })
  toggleStatus(@Param('id') id: string, @CurrentUser() user: any) {
    return this.assistantsService.toggleStatus(+id, user.userId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleType.DOCTOR)
  @ApiOperation({ summary: 'Delete assistant' })
  @ApiResponse({ status: 200, description: 'Assistant deleted' })
  @ApiResponse({ status: 404, description: 'Assistant not found' })
  @ApiParam({ name: 'id', description: 'Assistant ID' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.assistantsService.remove(+id, user.userId);
  }

  @Patch(':id/change-password')
  @UseGuards(RolesGuard)
  @Roles(RoleType.DOCTOR)
  @ApiOperation({ summary: 'Change assistant password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 404, description: 'Assistant not found' })
  @ApiParam({ name: 'id', description: 'Assistant ID' })
  changePassword(
    @Param('id') id: string,
    @Body() body: { newPassword: string },
    @CurrentUser() user: any
  ) {
    return this.assistantsService.changePassword(+id, body.newPassword, user.userId);
  }

  @Get('profile')
  @UseGuards(RolesGuard)
  @Roles(RoleType.ASSISTANT)
  @ApiOperation({ summary: 'Get assistant profile (Assistant only)' })
  @ApiResponse({ status: 200, description: 'Assistant profile' })
  @ApiResponse({ status: 404, description: 'Assistant profile not found' })
  getProfile(@CurrentUser() user: any) {
    return this.assistantsService.getAssistantByUserId(user.userId);
  }
}
