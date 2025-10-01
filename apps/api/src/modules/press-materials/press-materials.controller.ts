import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  Res,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { PressMaterialsService } from './press-materials.service';
import { CreatePressMaterialDto } from './dto/create-press-material.dto';
import { UpdatePressMaterialDto } from './dto/update-press-material.dto';
import { QueryPressMaterialDto } from './dto/query-press-material.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { multerConfig } from '../../config/multer.config';
import { UserRole } from '@vtexday26/shared';

@ApiTags('press-materials')
@Controller('press-materials')
export class PressMaterialsController {
  constructor(private readonly pressMaterialsService: PressMaterialsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCER)
  @UseInterceptors(FileInterceptor('file', multerConfig))
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 uploads per minute
  @ApiOperation({ summary: 'Create new press material' })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'type', 'title'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        type: {
          type: 'string',
          enum: ['press_kit', 'logo_package', 'photo', 'video', 'presentation'],
        },
        'title[pt]': { type: 'string' },
        'title[en]': { type: 'string' },
        'title[es]': { type: 'string' },
        'description[pt]': { type: 'string' },
        'description[en]': { type: 'string' },
        'description[es]': { type: 'string' },
        tags: {
          type: 'array',
          items: { type: 'string' },
        },
        status: {
          type: 'string',
          enum: ['draft', 'published', 'archived'],
        },
        accessLevel: {
          type: 'string',
          enum: ['public', 'restricted'],
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Press material created' })
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!user || !user.sub) {
      throw new BadRequestException('User authentication failed');
    }

    // Parse multipart form data
    const dto: CreatePressMaterialDto = {
      type: body.type,
      title: {
        pt: body['title[pt]'] || body.title?.pt,
        en: body['title[en]'] || body.title?.en,
        es: body['title[es]'] || body.title?.es,
      },
      description: body.description
        ? {
            pt: body['description[pt]'] || body.description?.pt,
            en: body['description[en]'] || body.description?.en,
            es: body['description[es]'] || body.description?.es,
          }
        : undefined,
      tags: Array.isArray(body.tags) ? body.tags : body.tags?.split(','),
      status: body.status,
      accessLevel: body.accessLevel,
    };

    return this.pressMaterialsService.create(dto, file, user.sub);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCER)
  @ApiOperation({ summary: 'Get all press materials with pagination' })
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, description: 'List of press materials' })
  async findAll(@Query() query: QueryPressMaterialDto) {
    return this.pressMaterialsService.findAll(query);
  }

  @Get('public')
  @Public()
  @ApiOperation({ summary: 'Get public press materials' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of public press materials' })
  async findPublic() {
    return this.pressMaterialsService.findPublic();
  }

  @Get('top-downloaded')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCER)
  @ApiOperation({ summary: 'Get top downloaded materials' })
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, description: 'Top downloaded materials' })
  async getTopDownloaded(@Query('limit') limit?: number) {
    return this.pressMaterialsService.getTopDownloaded(limit);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCER)
  @ApiOperation({ summary: 'Get specific press material' })
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, description: 'Press material details' })
  async findOne(@Param('id') id: string) {
    return this.pressMaterialsService.findOne(id);
  }

  @Get(':id/download')
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 downloads per minute per IP
  @ApiOperation({ summary: 'Get download URL for press material' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Download URL' })
  async download(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user?: any,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress || '';
    const userAgent = req.get('user-agent') || '';

    const url = await this.pressMaterialsService.getDownloadUrl(id, ipAddress, userAgent, user?.sub);

    // Return URL as JSON for frontend to open directly
    res.json({ url });
  }

  @Get(':id/statistics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCER)
  @ApiOperation({ summary: 'Get download statistics for material' })
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, description: 'Download statistics' })
  async getStatistics(@Param('id') id: string) {
    return this.pressMaterialsService.getStatistics(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCER)
  @ApiOperation({ summary: 'Update press material' })
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, description: 'Press material updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePressMaterialDto,
    @CurrentUser() user: any,
  ) {
    // Remove MongoDB _id fields from nested objects if present
    const cleanDto = { ...dto };
    if (cleanDto.title && '_id' in cleanDto.title) {
      const { _id, ...titleWithoutId } = cleanDto.title as any;
      cleanDto.title = titleWithoutId;
    }
    if (cleanDto.description && '_id' in cleanDto.description) {
      const { _id, ...descriptionWithoutId } = cleanDto.description as any;
      cleanDto.description = descriptionWithoutId;
    }

    return this.pressMaterialsService.update(id, cleanDto, user.sub);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCER)
  @ApiOperation({ summary: 'Delete press material' })
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Press material deleted' })
  async remove(@Param('id') id: string) {
    await this.pressMaterialsService.remove(id);
    return { message: 'Press material deleted successfully' };
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCER)
  @UseInterceptors(FileInterceptor('file', multerConfig))
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 uploads per minute
  @ApiOperation({ summary: 'Upload file to S3' })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'materialType'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        materialType: {
          type: 'string',
          enum: ['press_kit', 'logo_package', 'photo', 'video', 'presentation'],
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'File uploaded successfully' })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('materialType') materialType: string,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.pressMaterialsService.uploadFile(file, materialType, user.sub);
  }
}
