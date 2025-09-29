import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
  Res,
  HttpStatus,
  ParseFilePipeBuilder,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { LegalPagesService } from './legal-pages.service';
import { CreateLegalPageDto } from './dto/create-legal-page.dto';
import { UpdateLegalPageDto } from './dto/update-legal-page.dto';
import { SupportedLanguage } from './dto/upload-file.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '@vtexday26/shared';

@Controller('legal-pages')
export class LegalPagesController {
  constructor(private readonly legalPagesService: LegalPagesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCER)
  @Throttle({ default: { limit: 10, ttl: 60 } })
  async create(@Body() createLegalPageDto: CreateLegalPageDto) {
    return this.legalPagesService.create(createLegalPageDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCER)
  async findAll(@Query('isActive') isActive?: string) {
    const active = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.legalPagesService.findAll(active);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCER)
  async findOne(@Param('id') id: string) {
    return this.legalPagesService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCER)
  async update(
    @Param('id') id: string,
    @Body() updateLegalPageDto: UpdateLegalPageDto,
    @Request() req,
  ) {
    return this.legalPagesService.update(id, updateLegalPageDto, req.user.id);
  }

  @Post(':id/upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCER)
  @UseInterceptors(FileInterceptor('file'))
  @Throttle({ default: { limit: 5, ttl: 60 } })
  async uploadFile(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: 'application/pdf',
        })
        .addMaxSizeValidator({
          maxSize: 10 * 1024 * 1024, // 10MB
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
    @Body('language') language: SupportedLanguage,
    @Request() req,
  ) {
    return this.legalPagesService.uploadFile(id, file, language, req.user.id);
  }

  @Delete(':id/file/:language')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCER)
  async deleteFile(
    @Param('id') id: string,
    @Param('language') language: SupportedLanguage,
    @Request() req,
  ) {
    return this.legalPagesService.deleteFile(id, language, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCER)
  async remove(@Param('id') id: string) {
    await this.legalPagesService.remove(id);
    return { message: 'Legal page deleted successfully' };
  }

  @Get('public/list')
  @Throttle({ default: { limit: 100, ttl: 60 } })
  async getPublicPages() {
    return this.legalPagesService.getPublicPages();
  }

  @Get('public/:slug/:language/download')
  @Throttle({ default: { limit: 50, ttl: 60 } })
  async downloadFile(
    @Param('slug') slug: string,
    @Param('language') language: SupportedLanguage,
    @Res() res: Response,
  ) {
    try {
      const { stream, metadata } = await this.legalPagesService.getFileStream(slug, language);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${metadata.originalName}"`,
        'Content-Length': metadata.size.toString(),
      });

      stream.pipe(res);
    } catch (error: any) {
      if (error.status) {
        res.status(error.status).json({ message: error.message });
      } else {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Error downloading file' });
      }
    }
  }

  @Get('public/:slug/:language/url')
  @Throttle({ default: { limit: 100, ttl: 60 } })
  async getDownloadUrl(
    @Param('slug') slug: string,
    @Param('language') language: SupportedLanguage,
  ) {
    return this.legalPagesService.getSignedDownloadUrl(slug, language);
  }
}
