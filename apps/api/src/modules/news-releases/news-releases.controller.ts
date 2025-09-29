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
  UseInterceptors,
  UploadedFile,
  Res,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { NewsReleasesService } from './news-releases.service';
import { CreateNewsReleaseDto } from './dto/create-news-release.dto';
import { UpdateNewsReleaseDto } from './dto/update-news-release.dto';
import { QueryNewsReleaseDto } from './dto/query-news-release.dto';
import { ImageUploadDto, ReorderImagesDto } from './dto/image-upload.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@vtexday26/shared';
import { Throttle } from '@nestjs/throttler';

@ApiTags('news-releases')
@Controller('news-releases')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NewsReleasesController {
  constructor(private readonly newsReleasesService: NewsReleasesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new news release' })
  @ApiResponse({ status: 201, description: 'News release created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async create(@Body() createNewsReleaseDto: CreateNewsReleaseDto, @CurrentUser() user: any) {
    return this.newsReleasesService.create(createNewsReleaseDto, user);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all news releases (admin)' })
  @ApiResponse({ status: 200, description: 'List of news releases' })
  async findAll(@Query() query: QueryNewsReleaseDto) {
    return this.newsReleasesService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a news release by ID' })
  @ApiParam({ name: 'id', description: 'News release ID' })
  @ApiResponse({ status: 200, description: 'News release found' })
  @ApiResponse({ status: 404, description: 'News release not found' })
  async findOne(@Param('id') id: string) {
    return this.newsReleasesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a news release' })
  @ApiParam({ name: 'id', description: 'News release ID' })
  @ApiResponse({ status: 200, description: 'News release updated' })
  @ApiResponse({ status: 404, description: 'News release not found' })
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async update(
    @Param('id') id: string,
    @Body() updateNewsReleaseDto: UpdateNewsReleaseDto,
    @CurrentUser() user: any,
  ) {
    return this.newsReleasesService.update(id, updateNewsReleaseDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a news release (soft delete)' })
  @ApiParam({ name: 'id', description: 'News release ID' })
  @ApiResponse({ status: 204, description: 'News release deleted' })
  @ApiResponse({ status: 404, description: 'News release not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.newsReleasesService.remove(id, user);
  }

  @Post(':id/restore')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore a deleted news release' })
  @ApiParam({ name: 'id', description: 'News release ID' })
  @ApiResponse({ status: 200, description: 'News release restored' })
  @ApiResponse({ status: 404, description: 'News release not found' })
  async restore(@Param('id') id: string, @CurrentUser() user: any) {
    return this.newsReleasesService.restore(id, user);
  }

  @Post(':id/publish')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish a news release' })
  @ApiParam({ name: 'id', description: 'News release ID' })
  @ApiResponse({ status: 200, description: 'News release published' })
  @ApiResponse({ status: 404, description: 'News release not found' })
  @ApiResponse({ status: 409, description: 'News release already published' })
  async publish(@Param('id') id: string, @CurrentUser() user: any) {
    return this.newsReleasesService.publish(id, user);
  }

  @Post(':id/archive')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Archive a news release' })
  @ApiParam({ name: 'id', description: 'News release ID' })
  @ApiResponse({ status: 200, description: 'News release archived' })
  @ApiResponse({ status: 404, description: 'News release not found' })
  async archive(@Param('id') id: string, @CurrentUser() user: any) {
    return this.newsReleasesService.archive(id, user);
  }

  @Post(':id/images')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload image to news release' })
  @ApiParam({ name: 'id', description: 'News release ID' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Image uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'News release not found' })
  @UseInterceptors(FileInterceptor('image'))
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() imageUploadDto: ImageUploadDto,
  ) {
    return this.newsReleasesService.uploadImage(id, file, imageUploadDto);
  }

  @Delete(':id/images/:imageId')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove image from news release' })
  @ApiParam({ name: 'id', description: 'News release ID' })
  @ApiParam({ name: 'imageId', description: 'Image ID' })
  @ApiResponse({ status: 200, description: 'Image removed successfully' })
  @ApiResponse({ status: 404, description: 'News release or image not found' })
  async removeImage(@Param('id') id: string, @Param('imageId') imageId: string) {
    return this.newsReleasesService.removeImage(id, imageId);
  }

  @Patch(':id/images/reorder')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder images in news release' })
  @ApiParam({ name: 'id', description: 'News release ID' })
  @ApiResponse({ status: 200, description: 'Images reordered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'News release not found' })
  async reorderImages(@Param('id') id: string, @Body() reorderImagesDto: ReorderImagesDto) {
    return this.newsReleasesService.reorderImages(id, reorderImagesDto.imageIds);
  }
}

@ApiTags('public-news')
@Controller('public/news')
export class PublicNewsController {
  constructor(private readonly newsReleasesService: NewsReleasesService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get published news releases' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'language', required: false, enum: ['pt-BR', 'en', 'es'] })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'tag', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of published news releases' })
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async getPublicNews(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('language') language?: 'pt-BR' | 'en' | 'es',
    @Query('category') category?: string,
    @Query('tag') tag?: string,
  ) {
    return this.newsReleasesService.getPublicNews({
      page,
      limit,
      language,
      category,
      tag,
    });
  }

  @Get('featured')
  @Public()
  @ApiOperation({ summary: 'Get featured news releases' })
  @ApiQuery({ name: 'limit', required: false, type: Number, default: 5 })
  @ApiResponse({ status: 200, description: 'List of featured news releases' })
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async getFeaturedNews(@Query('limit') limit?: number) {
    return this.newsReleasesService.getFeaturedNews(limit || 5);
  }

  @Get('feed.rss')
  @Public()
  @ApiOperation({ summary: 'Get RSS feed of news releases' })
  @ApiQuery({ name: 'lang', required: false, enum: ['pt-BR', 'en', 'es'], default: 'en' })
  @ApiResponse({ status: 200, description: 'RSS feed', content: { 'application/rss+xml': {} } })
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async getRssFeed(@Query('lang') lang: 'pt-BR' | 'en' | 'es' = 'en', @Res() res: Response) {
    const feed = await this.newsReleasesService.generateRssFeed(lang);
    res.header('Content-Type', 'application/rss+xml; charset=utf-8');
    res.send(feed);
  }

  @Get('feed.atom')
  @Public()
  @ApiOperation({ summary: 'Get Atom feed of news releases' })
  @ApiQuery({ name: 'lang', required: false, enum: ['pt-BR', 'en', 'es'], default: 'en' })
  @ApiResponse({ status: 200, description: 'Atom feed', content: { 'application/atom+xml': {} } })
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async getAtomFeed(@Query('lang') lang: 'pt-BR' | 'en' | 'es' = 'en', @Res() res: Response) {
    const feed = await this.newsReleasesService.generateAtomFeed(lang);
    res.header('Content-Type', 'application/atom+xml; charset=utf-8');
    res.send(feed);
  }

  @Get(':slug')
  @Public()
  @ApiOperation({ summary: 'Get a news release by slug' })
  @ApiParam({ name: 'slug', description: 'News release slug' })
  @ApiResponse({ status: 200, description: 'News release found' })
  @ApiResponse({ status: 404, description: 'News release not found' })
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async getBySlug(@Param('slug') slug: string) {
    const newsRelease = await this.newsReleasesService.findBySlug(slug);
    await this.newsReleasesService.incrementViewCount(newsRelease._id.toString());
    return newsRelease;
  }
}
