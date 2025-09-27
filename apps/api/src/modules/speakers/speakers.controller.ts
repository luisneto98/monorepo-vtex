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
import { SpeakersService } from './speakers.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@shared/types/user.types';
import { Public } from '@common/decorators/public.decorator';
import { CreateSpeakerDto } from './dto/create-speaker.dto';
import { UpdateSpeakerDto } from './dto/update-speaker.dto';
import { SpeakerFilterDto } from './dto/speaker-filter.dto';
import { ApiResponse } from '@common/dto/api-response.dto';
import { Request } from 'express';

@ApiTags('Speakers')
@Controller('speakers')
export class SpeakersController {
  constructor(private readonly speakersService: SpeakersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCER)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create new speaker (Admin/Producer only)' })
  @ApiBody({ type: CreateSpeakerDto })
  @SwaggerApiResponse({
    status: 201,
    description: 'Speaker created successfully',
    schema: {
      example: {
        success: true,
        data: {
          _id: '507f1f77bcf86cd799439011',
          name: 'Carlos Eduardo Silva',
          bio: { 'pt-BR': 'Biografia...', 'en': 'Biography...' },
          photoUrl: 'https://cdn.vtexday.com/speakers/carlos.jpg',
          company: 'VTEX',
          socialLinks: { linkedin: 'https://linkedin.com/in/carlos' },
          isHighlight: true
        }
      }
    }
  })
  @SwaggerApiResponse({ status: 400, description: 'Validation error' })
  @SwaggerApiResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerApiResponse({ status: 403, description: 'Forbidden - insufficient role' })
  async create(@Body() createSpeakerDto: CreateSpeakerDto) {
    const speaker = await this.speakersService.create(createSpeakerDto);
    return ApiResponse.success(speaker);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'List all speakers with filters and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20, description: 'Items per page' })
  @ApiQuery({ name: 'sort', required: false, type: String, example: '-priority,name', description: 'Sort fields' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in name, bio, company' })
  @ApiQuery({ name: 'company', required: false, type: String, description: 'Filter by company' })
  @ApiQuery({ name: 'isHighlight', required: false, type: Boolean, description: 'Filter highlight speakers' })
  @ApiQuery({ name: 'tags', required: false, type: [String], description: 'Filter by tags' })
  @SwaggerApiResponse({
    status: 200,
    description: 'List of speakers with pagination',
    schema: {
      example: {
        success: true,
        data: [
          {
            _id: '507f1f77bcf86cd799439011',
            name: 'Carlos Silva',
            bio: { 'pt-BR': 'Bio...', 'en': 'Bio...' },
            photoUrl: 'https://cdn.vtexday.com/speakers/carlos.jpg',
            company: 'VTEX',
            position: { 'pt-BR': 'CTO', 'en': 'CTO' },
            socialLinks: { linkedin: 'https://linkedin.com' },
            isHighlight: true
          }
        ],
        metadata: {
          total: 50,
          page: 1,
          limit: 20,
          totalPages: 3,
          hasNext: true,
          hasPrev: false
        }
      }
    }
  })
  async findAll(@Query() filterDto: SpeakerFilterDto) {
    const result = await this.speakersService.findAll(filterDto);
    return ApiResponse.success(result.data, result.metadata);
  }

  @Get('highlights')
  @Public()
  @ApiOperation({ summary: 'Get highlighted speakers only' })
  @SwaggerApiResponse({
    status: 200,
    description: 'List of highlighted speakers',
    schema: {
      example: {
        success: true,
        data: [
          {
            _id: '507f1f77bcf86cd799439011',
            name: 'Carlos Silva',
            bio: { 'pt-BR': 'Bio...', 'en': 'Bio...' },
            photoUrl: 'https://cdn.vtexday.com/speakers/carlos.jpg',
            company: 'VTEX',
            isHighlight: true
          }
        ]
      }
    }
  })
  async findHighlights() {
    const speakers = await this.speakersService.findHighlights();
    return ApiResponse.success(speakers);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get speaker by ID' })
  @ApiParam({ name: 'id', description: 'Speaker ID', example: '507f1f77bcf86cd799439011' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Speaker details',
    schema: {
      example: {
        success: true,
        data: {
          _id: '507f1f77bcf86cd799439011',
          name: 'Carlos Silva',
          bio: { 'pt-BR': 'Biografia completa...', 'en': 'Full biography...' },
          photoUrl: 'https://cdn.vtexday.com/speakers/carlos.jpg',
          company: 'VTEX',
          position: { 'pt-BR': 'CTO', 'en': 'CTO' },
          socialLinks: { linkedin: 'https://linkedin.com/in/carlos', twitter: '@carlos' },
          isHighlight: true,
          sessions: ['507f1f77bcf86cd799439012']
        }
      }
    }
  })
  @SwaggerApiResponse({ status: 404, description: 'Speaker not found' })
  async findOne(@Param('id') id: string) {
    const speaker = await this.speakersService.findById(id);
    return ApiResponse.success(speaker);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update speaker (Admin/Producer only)' })
  @ApiParam({ name: 'id', description: 'Speaker ID' })
  @ApiBody({ type: UpdateSpeakerDto })
  @SwaggerApiResponse({
    status: 200,
    description: 'Speaker updated successfully',
    schema: {
      example: {
        success: true,
        data: {
          _id: '507f1f77bcf86cd799439011',
          name: 'Carlos Silva Updated',
          updatedAt: '2025-11-26T10:00:00Z'
        }
      }
    }
  })
  @SwaggerApiResponse({ status: 400, description: 'Validation error' })
  @SwaggerApiResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerApiResponse({ status: 403, description: 'Forbidden' })
  @SwaggerApiResponse({ status: 404, description: 'Speaker not found' })
  async update(@Param('id') id: string, @Body() updateSpeakerDto: UpdateSpeakerDto) {
    const speaker = await this.speakersService.update(id, updateSpeakerDto);
    return ApiResponse.success(speaker);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Soft delete speaker (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Speaker ID' })
  @ApiQuery({ name: 'reason', required: false, description: 'Reason for deletion' })
  @SwaggerApiResponse({ status: 204, description: 'Speaker deleted successfully' })
  @SwaggerApiResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerApiResponse({ status: 403, description: 'Forbidden' })
  @SwaggerApiResponse({ status: 404, description: 'Speaker not found' })
  async remove(@Param('id') id: string, @Req() req: Request, @Query('reason') reason?: string) {
    const userId = (req as any).user?.id;
    await this.speakersService.remove(id, reason, userId);
  }

  @Post(':id/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Restore soft-deleted speaker (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Speaker ID' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Speaker restored successfully',
    schema: {
      example: {
        success: true,
        data: {
          _id: '507f1f77bcf86cd799439011',
          name: 'Carlos Silva',
          deletedAt: null
        }
      }
    }
  })
  @SwaggerApiResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerApiResponse({ status: 403, description: 'Forbidden' })
  @SwaggerApiResponse({ status: 404, description: 'Speaker not found' })
  async restore(@Param('id') id: string) {
    const speaker = await this.speakersService.restore(id);
    return ApiResponse.success(speaker);
  }
}
