import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { EventSettingsService } from './event-settings.service';
import { UpdateEventSettingsDto } from './dto/update-event-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@vtexday26/shared';

@ApiTags('event-settings')
@Controller('event-settings')
export class EventSettingsController {
  constructor(private readonly eventSettingsService: EventSettingsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get event settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the current event settings',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async getSettings() {
    return await this.eventSettingsService.getSettings();
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update event settings (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Event settings have been successfully updated',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Admin role required',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid data provided',
  })
  async updateSettings(
    @Body() updateEventSettingsDto: UpdateEventSettingsDto,
    @Request() req: any,
  ) {
    return await this.eventSettingsService.updateSettings(
      updateEventSettingsDto,
      req.user.userId,
    );
  }

  @Get('public')
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute per IP
  @ApiOperation({ summary: 'Get public event settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the public event settings',
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Too many requests - rate limit exceeded',
  })
  async getPublicSettings() {
    return await this.eventSettingsService.getPublicSettings();
  }
}