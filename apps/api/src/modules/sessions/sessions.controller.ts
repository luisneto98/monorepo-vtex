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
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@shared/types/user.types';
import { Public } from '@common/decorators/public.decorator';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { SessionFilterDto } from './dto/session-filter.dto';
import { ApiResponse } from '@common/dto/api-response.dto';
import { Request } from 'express';

@ApiTags('Sessions')
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCER)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create new session (Admin/Producer only)' })
  @ApiBody({ type: CreateSessionDto })
  @SwaggerApiResponse({
    status: 201,
    description: 'Session created successfully',
    schema: {
      example: {
        success: true,
        data: {
          _id: '507f1f77bcf86cd799439011',
          title: { 'pt-BR': 'Keynote de Abertura', en: 'Opening Keynote' },
          description: { 'pt-BR': 'Descrição...', en: 'Description...' },
          startTime: '2025-11-26T09:00:00Z',
          endTime: '2025-11-26T10:00:00Z',
          stage: 'principal',
          type: 'keynote',
          speakers: ['507f1f77bcf86cd799439012'],
          capacity: 500,
          isHighlight: true,
        },
      },
    },
  })
  @SwaggerApiResponse({ status: 400, description: 'Validation error or session conflict' })
  @SwaggerApiResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerApiResponse({ status: 403, description: 'Forbidden - insufficient role' })
  async create(@Body() createSessionDto: CreateSessionDto) {
    const session = await this.sessionsService.create(createSessionDto);
    return ApiResponse.success(session);
  }

  @Get()
  @Public()
  @ApiOperation({
    summary: 'List sessions with advanced filtering',
    description: 'Get event sessions filtered by date, stage, type, tags, and speakers',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'sort', required: false, type: String, example: 'startTime,-priority' })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search in title and description',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    example: '2025-11-26',
    description: 'Filter sessions starting from this date',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    example: '2025-11-28',
    description: 'Filter sessions ending before this date',
  })
  @ApiQuery({
    name: 'stage',
    required: false,
    enum: ['principal', 'inovacao', 'tech', 'startup', 'workshop_a', 'workshop_b'],
    description: 'Filter by stage/room',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['keynote', 'talk', 'panel', 'workshop', 'networking', 'break'],
    description: 'Filter by session type',
  })
  @ApiQuery({
    name: 'tags',
    required: false,
    type: [String],
    example: ['AI', 'B2B'],
    description: 'Filter by tags (comma-separated)',
  })
  @ApiQuery({
    name: 'speakerId',
    required: false,
    type: String,
    description: 'Filter by speaker ID',
  })
  @ApiQuery({
    name: 'isHighlight',
    required: false,
    type: Boolean,
    description: 'Filter highlight sessions',
  })
  @SwaggerApiResponse({
    status: 200,
    description: 'List of sessions with pagination',
    schema: {
      example: {
        success: true,
        data: [
          {
            _id: '507f1f77bcf86cd799439011',
            title: { 'pt-BR': 'Keynote de Abertura', en: 'Opening Keynote' },
            startTime: '2025-11-26T09:00:00Z',
            endTime: '2025-11-26T10:00:00Z',
            stage: 'principal',
            type: 'keynote',
            speakers: [{ _id: '507f1f77bcf86cd799439012', name: 'Carlos Silva' }],
            capacity: 500,
            registrationCount: 350,
          },
        ],
        metadata: {
          total: 45,
          page: 1,
          limit: 20,
          totalPages: 3,
          hasNext: true,
          hasPrev: false,
        },
      },
    },
  })
  async findAll(@Query() filterDto: SessionFilterDto) {
    const result = await this.sessionsService.findAll(filterDto);
    return ApiResponse.success(result.data, result.metadata);
  }

  @Get('highlights')
  @Public()
  @ApiOperation({ summary: 'Get highlighted sessions only' })
  @SwaggerApiResponse({
    status: 200,
    description: 'List of highlighted sessions',
    schema: {
      example: {
        success: true,
        data: [
          {
            _id: '507f1f77bcf86cd799439011',
            title: { 'pt-BR': 'Keynote Principal', en: 'Main Keynote' },
            startTime: '2025-11-26T09:00:00Z',
            stage: 'principal',
            type: 'keynote',
            isHighlight: true,
          },
        ],
      },
    },
  })
  async findHighlights() {
    const sessions = await this.sessionsService.findHighlights();
    return ApiResponse.success(sessions);
  }

  @Get('live')
  @Public()
  @ApiOperation({ summary: 'Get currently live sessions' })
  @SwaggerApiResponse({
    status: 200,
    description: 'List of sessions happening now',
    schema: {
      example: {
        success: true,
        data: [
          {
            _id: '507f1f77bcf86cd799439011',
            title: { 'pt-BR': 'Sessão Atual', en: 'Current Session' },
            startTime: '2025-11-26T14:00:00Z',
            endTime: '2025-11-26T15:00:00Z',
            stage: 'tech',
            isLive: true,
          },
        ],
      },
    },
  })
  async findLiveSessions() {
    const sessions = await this.sessionsService.findLiveSessions();
    return ApiResponse.success(sessions);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get session by ID' })
  @ApiParam({ name: 'id', description: 'Session ID', example: '507f1f77bcf86cd799439011' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Session details',
    schema: {
      example: {
        success: true,
        data: {
          _id: '507f1f77bcf86cd799439011',
          title: { 'pt-BR': 'Título da Sessão', en: 'Session Title' },
          description: { 'pt-BR': 'Descrição completa...', en: 'Full description...' },
          startTime: '2025-11-26T14:00:00Z',
          endTime: '2025-11-26T15:00:00Z',
          stage: 'principal',
          type: 'talk',
          speakers: [{ _id: '507f1f77bcf86cd799439012', name: 'Speaker Name', company: 'VTEX' }],
          sponsors: ['507f1f77bcf86cd799439013'],
          capacity: 200,
          registrationCount: 150,
          tags: ['AI', 'Innovation'],
          materials: [{ type: 'slides', url: 'https://cdn.vtexday.com/slides.pdf' }],
        },
      },
    },
  })
  @SwaggerApiResponse({ status: 404, description: 'Session not found' })
  async findOne(@Param('id') id: string) {
    const session = await this.sessionsService.findById(id);
    return ApiResponse.success(session);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update session (Admin/Producer only)' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiBody({ type: UpdateSessionDto })
  @SwaggerApiResponse({
    status: 200,
    description: 'Session updated successfully',
    schema: {
      example: {
        success: true,
        data: {
          _id: '507f1f77bcf86cd799439011',
          title: { 'pt-BR': 'Título Atualizado', en: 'Updated Title' },
          updatedAt: '2025-11-26T10:00:00Z',
        },
      },
    },
  })
  @SwaggerApiResponse({ status: 400, description: 'Validation error or session conflict' })
  @SwaggerApiResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerApiResponse({ status: 403, description: 'Forbidden' })
  @SwaggerApiResponse({ status: 404, description: 'Session not found' })
  async update(@Param('id') id: string, @Body() updateSessionDto: UpdateSessionDto) {
    const session = await this.sessionsService.update(id, updateSessionDto);
    return ApiResponse.success(session);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Soft delete session (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiQuery({ name: 'reason', required: false, description: 'Reason for deletion' })
  @SwaggerApiResponse({ status: 204, description: 'Session deleted successfully' })
  @SwaggerApiResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerApiResponse({ status: 403, description: 'Forbidden' })
  @SwaggerApiResponse({ status: 404, description: 'Session not found' })
  async remove(@Param('id') id: string, @Req() req: Request, @Query('reason') reason?: string) {
    const userId = (req as any).user?.id;
    await this.sessionsService.remove(id, reason, userId);
  }

  @Post(':id/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Restore soft-deleted session (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Session restored successfully',
    schema: {
      example: {
        success: true,
        data: {
          _id: '507f1f77bcf86cd799439011',
          title: { 'pt-BR': 'Sessão Restaurada', en: 'Restored Session' },
          deletedAt: null,
        },
      },
    },
  })
  @SwaggerApiResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerApiResponse({ status: 403, description: 'Forbidden' })
  @SwaggerApiResponse({ status: 404, description: 'Session not found' })
  async restore(@Param('id') id: string) {
    const session = await this.sessionsService.restore(id);
    return ApiResponse.success(session);
  }
}
