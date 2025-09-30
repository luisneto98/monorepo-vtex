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
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { SponsorsService } from './sponsors.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@shared/types/user.types';
import { Public } from '@common/decorators/public.decorator';
import { CreateSponsorDto } from './dto/create-sponsor.dto';
import { UpdateSponsorDto } from './dto/update-sponsor.dto';
import { SponsorFilterDto } from './dto/sponsor-filter.dto';
import { CreateSponsorTierDto } from './dto/create-sponsor-tier.dto';
import { UpdateSponsorTierDto } from './dto/update-sponsor-tier.dto';
import { ReorderTiersDto } from './dto/reorder-tiers.dto';
import { ApiResponse } from '@common/dto/api-response.dto';
import { Request } from 'express';

@ApiTags('Sponsors')
@Controller('sponsors')
export class SponsorsController {
  constructor(private readonly sponsorsService: SponsorsService) {}

  // ====================================
  // SPONSOR TIER ENDPOINTS (must come before :id routes)
  // ====================================

  @ApiTags('Sponsor Tiers')
  @Post('tiers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create new sponsor tier (Super Admin only)' })
  @ApiBody({ type: CreateSponsorTierDto })
  @SwaggerApiResponse({
    status: 201,
    description: 'Tier created successfully',
    schema: {
      example: {
        success: true,
        data: {
          _id: '507f1f77bcf86cd799439012',
          name: { 'pt-BR': 'Diamante', en: 'Diamond' },
          priority: 1,
          benefits: { 'pt-BR': ['Benefício 1', 'Benefício 2'], en: ['Benefit 1', 'Benefit 2'] },
          maxSlots: 3,
        },
      },
    },
  })
  @SwaggerApiResponse({ status: 400, description: 'Validation error' })
  @SwaggerApiResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerApiResponse({ status: 403, description: 'Forbidden' })
  async createTier(@Body() createTierDto: CreateSponsorTierDto) {
    const tier = await this.sponsorsService.createTier(createTierDto);
    return ApiResponse.success(tier);
  }

  @ApiTags('Sponsor Tiers')
  @Get('tiers')
  @Public()
  @ApiOperation({ summary: 'List all sponsor tiers' })
  @SwaggerApiResponse({
    status: 200,
    description: 'List of sponsor tiers',
    schema: {
      example: {
        success: true,
        data: [
          {
            _id: '507f1f77bcf86cd799439012',
            name: { 'pt-BR': 'Diamante', en: 'Diamond' },
            priority: 1,
            maxSlots: 3,
            currentSponsors: 2,
          },
        ],
      },
    },
  })
  async findAllTiers() {
    const tiers = await this.sponsorsService.findAllTiers();
    return ApiResponse.success(tiers);
  }

  @ApiTags('Sponsor Tiers')
  @Get('tiers/:id')
  @Public()
  @ApiOperation({ summary: 'Get sponsor tier by ID' })
  @ApiParam({ name: 'id', description: 'Tier ID' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Tier details',
  })
  @SwaggerApiResponse({ status: 404, description: 'Tier not found' })
  async findOneTier(@Param('id') id: string) {
    const tier = await this.sponsorsService.findTierById(id);
    return ApiResponse.success(tier);
  }

  @ApiTags('Sponsor Tiers')
  @Patch('tiers/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Reorder sponsor tiers (Super Admin only)' })
  @ApiBody({ type: ReorderTiersDto })
  @SwaggerApiResponse({ status: 200, description: 'Tiers reordered successfully' })
  @SwaggerApiResponse({ status: 400, description: 'Validation error' })
  @SwaggerApiResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerApiResponse({ status: 403, description: 'Forbidden' })
  async reorderTiers(@Body() reorderDto: ReorderTiersDto) {
    await this.sponsorsService.reorderTiers(reorderDto.tierIds);
    return ApiResponse.success({ message: 'Tiers reordered successfully' });
  }

  @ApiTags('Sponsor Tiers')
  @Patch('tiers/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update sponsor tier (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Tier ID' })
  @ApiBody({ type: UpdateSponsorTierDto })
  @SwaggerApiResponse({ status: 200, description: 'Tier updated successfully' })
  @SwaggerApiResponse({ status: 400, description: 'Validation error' })
  @SwaggerApiResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerApiResponse({ status: 403, description: 'Forbidden' })
  @SwaggerApiResponse({ status: 404, description: 'Tier not found' })
  async updateTier(@Param('id') id: string, @Body() updateTierDto: UpdateSponsorTierDto) {
    const tier = await this.sponsorsService.updateTier(id, updateTierDto);
    return ApiResponse.success(tier);
  }

  @ApiTags('Sponsor Tiers')
  @Delete('tiers/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete sponsor tier (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Tier ID' })
  @SwaggerApiResponse({ status: 204, description: 'Tier deleted successfully' })
  @SwaggerApiResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerApiResponse({ status: 403, description: 'Forbidden' })
  @SwaggerApiResponse({ status: 404, description: 'Tier not found' })
  @SwaggerApiResponse({ status: 409, description: 'Cannot delete tier with existing sponsors' })
  async removeTier(@Param('id') id: string) {
    await this.sponsorsService.removeTier(id);
  }

  // ====================================
  // SPONSOR ENDPOINTS
  // ====================================

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCER)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create new sponsor (Admin/Producer only)' })
  @ApiBody({ type: CreateSponsorDto })
  @SwaggerApiResponse({
    status: 201,
    description: 'Sponsor created successfully',
    schema: {
      example: {
        success: true,
        data: {
          _id: '507f1f77bcf86cd799439011',
          name: 'VTEX',
          description: { 'pt-BR': 'Descrição...', en: 'Description...' },
          logoUrl: 'https://cdn.vtexday.com/sponsors/vtex.png',
          website: 'https://vtex.com',
          tier: '507f1f77bcf86cd799439012',
          socialLinks: { linkedin: 'https://linkedin.com/company/vtex' },
          orderInTier: 1,
        },
      },
    },
  })
  @SwaggerApiResponse({ status: 400, description: 'Validation error' })
  @SwaggerApiResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerApiResponse({ status: 403, description: 'Forbidden - insufficient role' })
  async create(@Body() createSponsorDto: CreateSponsorDto) {
    const sponsor = await this.sponsorsService.createSponsor(createSponsorDto);
    return ApiResponse.success(sponsor);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'List all sponsors with filters and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'sort', required: false, type: String, example: 'tier.priority,orderInTier' })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search in name and description',
  })
  @ApiQuery({ name: 'tier', required: false, type: String, description: 'Filter by tier ID' })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter active sponsors',
  })
  @SwaggerApiResponse({
    status: 200,
    description: 'List of sponsors with pagination',
    schema: {
      example: {
        success: true,
        data: [
          {
            _id: '507f1f77bcf86cd799439011',
            name: 'VTEX',
            logoUrl: 'https://cdn.vtexday.com/sponsors/vtex.png',
            tier: { _id: '507f1f77bcf86cd799439012', name: 'Diamond', priority: 1 },
            orderInTier: 1,
          },
        ],
        metadata: {
          total: 25,
          page: 1,
          limit: 20,
          totalPages: 2,
          hasNext: true,
          hasPrev: false,
        },
      },
    },
  })
  async findAll(@Query() filterDto: SponsorFilterDto) {
    const result = await this.sponsorsService.findAllSponsors(filterDto);
    return ApiResponse.success(result.data, result.metadata);
  }

  @Get('grouped-by-tier')
  @Public()
  @ApiOperation({ summary: 'Get sponsors grouped by tier' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Sponsors grouped by tier',
    schema: {
      example: {
        success: true,
        data: [
          {
            tier: { _id: '507f1f77bcf86cd799439012', name: 'Diamond', priority: 1 },
            sponsors: [
              {
                _id: '507f1f77bcf86cd799439011',
                name: 'VTEX',
                logoUrl: 'https://cdn.vtexday.com/sponsors/vtex.png',
              },
            ],
          },
          {
            tier: { _id: '507f1f77bcf86cd799439013', name: 'Gold', priority: 2 },
            sponsors: [
              {
                _id: '507f1f77bcf86cd799439014',
                name: 'AWS',
                logoUrl: 'https://cdn.vtexday.com/sponsors/aws.png',
              },
            ],
          },
        ],
      },
    },
  })
  async findGroupedByTier() {
    const sponsors = await this.sponsorsService.findSponsorsByTier();
    return ApiResponse.success(sponsors);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get sponsor by ID' })
  @ApiParam({ name: 'id', description: 'Sponsor ID', example: '507f1f77bcf86cd799439011' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Sponsor details',
    schema: {
      example: {
        success: true,
        data: {
          _id: '507f1f77bcf86cd799439011',
          name: 'VTEX',
          description: { 'pt-BR': 'Plataforma de comércio...', en: 'Commerce platform...' },
          logoUrl: 'https://cdn.vtexday.com/sponsors/vtex.png',
          website: 'https://vtex.com',
          tier: { _id: '507f1f77bcf86cd799439012', name: 'Diamond' },
          socialLinks: { linkedin: 'https://linkedin.com/company/vtex', twitter: '@vtex' },
          boothNumber: 'A1',
          contactPerson: { name: 'João Silva', email: 'joao@vtex.com', phone: '+5511999999999' },
        },
      },
    },
  })
  @SwaggerApiResponse({ status: 404, description: 'Sponsor not found' })
  async findOne(@Param('id') id: string) {
    const sponsor = await this.sponsorsService.findSponsorById(id);
    return ApiResponse.success(sponsor);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update sponsor (Admin/Producer only)' })
  @ApiParam({ name: 'id', description: 'Sponsor ID' })
  @ApiBody({ type: UpdateSponsorDto })
  @SwaggerApiResponse({
    status: 200,
    description: 'Sponsor updated successfully',
  })
  @SwaggerApiResponse({ status: 400, description: 'Validation error' })
  @SwaggerApiResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerApiResponse({ status: 403, description: 'Forbidden' })
  @SwaggerApiResponse({ status: 404, description: 'Sponsor not found' })
  async update(@Param('id') id: string, @Body() updateSponsorDto: UpdateSponsorDto) {
    const sponsor = await this.sponsorsService.updateSponsor(id, updateSponsorDto);
    return ApiResponse.success(sponsor);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Soft delete sponsor (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Sponsor ID' })
  @ApiQuery({ name: 'reason', required: false, description: 'Reason for deletion' })
  @SwaggerApiResponse({ status: 204, description: 'Sponsor deleted successfully' })
  @SwaggerApiResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerApiResponse({ status: 403, description: 'Forbidden' })
  @SwaggerApiResponse({ status: 404, description: 'Sponsor not found' })
  async remove(@Param('id') id: string, @Req() req: Request, @Query('reason') reason?: string) {
    const userId = (req as any).user?.id;
    await this.sponsorsService.removeSponsor(id, reason, userId);
  }

  @Post(':id/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Restore soft-deleted sponsor (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Sponsor ID' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Sponsor restored successfully',
  })
  @SwaggerApiResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerApiResponse({ status: 403, description: 'Forbidden' })
  @SwaggerApiResponse({ status: 404, description: 'Sponsor not found' })
  async restore(@Param('id') id: string) {
    const sponsor = await this.sponsorsService.restoreSponsor(id);
    return ApiResponse.success(sponsor);
  }
}
