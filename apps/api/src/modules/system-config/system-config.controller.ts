import {
  Controller,
  Get,
  Put,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Ip,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SystemConfigService } from './system-config.service';
import { UpdateSystemConfigDto } from './dto/update-config.dto';
import { UpdateSectionVisibilityDto } from './dto/section-visibility.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, type SectionName } from '@vtexday26/shared';

@Controller('system-config')
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  @Get()
  async getConfig() {
    return this.systemConfigService.getConfig();
  }

  @Get('section/:section')
  async getSectionVisibility(@Param('section') section: SectionName) {
    return this.systemConfigService.getSectionVisibility(section);
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // Rate limit: 10 requests per minute
  @HttpCode(HttpStatus.OK)
  async updateConfig(
    @Body() updateDto: UpdateSystemConfigDto,
    @Request() req: any,
    @Ip() ip: string,
  ) {
    return this.systemConfigService.updateConfig(updateDto, req.user.id, ip);
  }

  @Patch('section/:section')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // Rate limit: 10 requests per minute
  async updateSection(
    @Param('section') section: SectionName,
    @Body() updateDto: UpdateSectionVisibilityDto,
    @Request() req: any,
    @Ip() ip: string,
  ) {
    return this.systemConfigService.updateSection(section, updateDto, req.user.id, ip);
  }

  @Get('audit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async getAuditLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('section') section?: string,
  ) {
    return this.systemConfigService.getAuditLogs(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      section,
    );
  }

  @Get('preview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async getScheduledChanges() {
    return this.systemConfigService.getScheduledChanges();
  }

  @Post('apply-scheduled')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async applyScheduledChanges() {
    await this.systemConfigService.applyScheduledChanges();
    return { message: 'Scheduled changes applied successfully' };
  }
}
