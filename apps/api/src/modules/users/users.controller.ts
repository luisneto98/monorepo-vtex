import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse as SwaggerApiResponse,
  ApiParam,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@shared/types/user.types';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create new user (Super Admin only)' })
  @SwaggerApiResponse({ status: 201, description: 'User created successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Missing or invalid JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden - Requires SUPER_ADMIN role' })
  create(@Body() createUserDto: any) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCER)
  @ApiOperation({ summary: 'List all users (Admin/Producer only)' })
  @SwaggerApiResponse({ status: 200, description: 'Returns list of users' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Missing or invalid JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden - Requires SUPER_ADMIN or PRODUCER role' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (Authenticated users only)' })
  @ApiParam({ name: 'id', description: 'User MongoDB ID' })
  @SwaggerApiResponse({ status: 200, description: 'Returns user details' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Missing or invalid JWT token' })
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user (Authenticated users only)' })
  @ApiParam({ name: 'id', description: 'User MongoDB ID' })
  @SwaggerApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Missing or invalid JWT token' })
  update(@Param('id') id: string, @Body() updateUserDto: any) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete user (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'User MongoDB ID' })
  @SwaggerApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Missing or invalid JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden - Requires SUPER_ADMIN role' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
