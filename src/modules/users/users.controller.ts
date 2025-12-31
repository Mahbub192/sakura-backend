import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RoleType } from '../../entities/role.entity';
import { CreateUserDto, UpdateUserDto } from './dto';
import { CreateMyUserProfileDto } from './dto/create-my-profile.dto';
import { UsersService } from './users.service';

interface CurrentUserPayload {
  userId: string; // Phone number (primary key)
  email: string;
  role: string;
}

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Admin-only endpoints
  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // Self-service profile endpoints (must be before parameterized routes)
  @Patch('my-profile')
  @ApiOperation({ summary: 'Update my user profile (any authenticated user)' })
  @ApiResponse({ status: 200, description: 'User profile updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  updateMyProfile(
    @Body() updateProfileDto: CreateMyUserProfileDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.usersService.updateMyProfile(user.userId, updateProfileDto);
  }

  @Patch('change-password')
  @ApiOperation({ summary: 'Change my password (any authenticated user)' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid current password' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async changePassword(
    @Body() body: { currentPassword: string; newPassword: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.usersService.changeMyPassword(
      user.userId,
      body.currentPassword,
      body.newPassword,
    );
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all users' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':phone')
  @UseGuards(RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiOperation({ summary: 'Get user by phone number (Admin only)' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'phone', description: 'User phone number' })
  findOne(@Param('phone') phone: string) {
    return this.usersService.findOne(phone);
  }

  @Patch(':phone')
  @UseGuards(RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiOperation({ summary: 'Update user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'phone', description: 'User phone number' })
  update(@Param('phone') phone: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(phone, updateUserDto);
  }

  @Patch(':phone/deactivate')
  @UseGuards(RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiOperation({ summary: 'Deactivate user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deactivated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'phone', description: 'User phone number' })
  deactivate(@Param('phone') phone: string) {
    return this.usersService.deactivateUser(phone);
  }

  @Patch(':phone/activate')
  @UseGuards(RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiOperation({ summary: 'Activate user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User activated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'phone', description: 'User phone number' })
  activate(@Param('phone') phone: string) {
    return this.usersService.activateUser(phone);
  }

  @Delete(':phone')
  @UseGuards(RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'phone', description: 'User phone number' })
  remove(@Param('phone') phone: string) {
    return this.usersService.remove(phone);
  }
}
