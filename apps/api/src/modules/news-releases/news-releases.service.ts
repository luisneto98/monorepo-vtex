import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NewsRelease, NewsReleaseDocument } from './schemas/news-release.schema';
import { CreateNewsReleaseDto } from './dto/create-news-release.dto';
import { UpdateNewsReleaseDto } from './dto/update-news-release.dto';
import { QueryNewsReleaseDto } from './dto/query-news-release.dto';
import { ContentSanitizationService } from './services/content-sanitization.service';
import { AuditLogService } from './services/audit-log.service';
import { ImageProcessingService } from './services/image-processing.service';
import { PublicationSchedulerService } from './services/publication-scheduler.service';
import { FeedGeneratorService } from './services/feed-generator.service';
import { SlugGeneratorUtil } from './utils/slug-generator.util';
import { NewsReleaseStatus } from '@vtexday26/shared';

@Injectable()
export class NewsReleasesService {
  constructor(
    @InjectModel(NewsRelease.name)
    private newsReleaseModel: Model<NewsReleaseDocument>,
    private contentSanitizationService: ContentSanitizationService,
    private auditLogService: AuditLogService,
    private imageProcessingService: ImageProcessingService,
    _publicationSchedulerService: PublicationSchedulerService, // Initialized via OnModuleInit
    private feedGeneratorService: FeedGeneratorService,
  ) {}

  async create(dto: CreateNewsReleaseDto, user: any): Promise<NewsReleaseDocument> {
    const sanitizedContent = this.contentSanitizationService.sanitizeAllContent(dto.content);

    const slug = await SlugGeneratorUtil.generateUniqueSlug(
      dto.content['en'].title,
      this.newsReleaseModel,
    );

    const newsRelease = new this.newsReleaseModel({
      slug,
      content: sanitizedContent,
      status: dto.status || NewsReleaseStatus.DRAFT,
      featured: dto.featured || false,
      featuredImage: dto.featuredImage,
      categories: dto.categories || [],
      tags: dto.tags || [],
      author: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      scheduledFor: dto.scheduledFor,
      relatedArticles: dto.relatedArticles || [],
      images: [],
      viewCount: 0,
      isDeleted: false,
      version: 1,
    });

    if (dto.status === NewsReleaseStatus.PUBLISHED) {
      newsRelease.publishedAt = new Date();
    }

    const saved = await newsRelease.save();

    await this.auditLogService.logAction({
      entityId: saved._id.toString(),
      action: 'create',
      performedBy: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      metadata: { slug, status: dto.status },
    });

    return saved;
  }

  async findAll(query: QueryNewsReleaseDto): Promise<{
    items: NewsReleaseDocument[];
    total: number;
    page: number;
    pages: number;
  }> {
    const filter: any = {};

    if (!query.includeDeleted) {
      filter.isDeleted = false;
    }

    if (query.status) {
      filter.status = query.status;
    } else if (query.statuses && query.statuses.length > 0) {
      filter.status = { $in: query.statuses };
    }

    if (query.featured !== undefined) {
      filter.featured = query.featured;
    }

    if (query.categories && query.categories.length > 0) {
      filter.categories = { $in: query.categories };
    }

    if (query.tags && query.tags.length > 0) {
      filter.tags = { $in: query.tags };
    }

    if (query.author) {
      filter['author.id'] = query.author;
    }

    if (query.publishedAfter || query.publishedBefore) {
      filter.publishedAt = {};
      if (query.publishedAfter) {
        filter.publishedAt.$gte = query.publishedAfter;
      }
      if (query.publishedBefore) {
        filter.publishedAt.$lte = query.publishedBefore;
      }
    }

    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      filter.$or = [
        { 'content.pt-BR.title': searchRegex },
        { 'content.en.title': searchRegex },
        { 'content.es.title': searchRegex },
        { 'content.pt-BR.content': searchRegex },
        { 'content.en.content': searchRegex },
        { 'content.es.content': searchRegex },
      ];
    }

    const sortOptions: any = {};
    if (query.sortBy === 'title' && query.language) {
      sortOptions[`content.${query.language}.title`] = query.sortOrder === 'asc' ? 1 : -1;
    } else {
      sortOptions[query.sortBy] = query.sortOrder === 'asc' ? 1 : -1;
    }

    const total = await this.newsReleaseModel.countDocuments(filter);
    const pages = Math.ceil(total / query.limit);
    const skip = (query.page - 1) * query.limit;

    const items = await this.newsReleaseModel
      .find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(query.limit)
      .exec();

    return {
      items,
      total,
      page: query.page,
      pages,
    };
  }

  async findOne(id: string): Promise<NewsReleaseDocument> {
    const newsRelease = await this.newsReleaseModel.findById(id);
    if (!newsRelease || newsRelease.isDeleted) {
      throw new NotFoundException('News release not found');
    }
    return newsRelease;
  }

  async findBySlug(slug: string): Promise<NewsReleaseDocument> {
    const newsRelease = await this.newsReleaseModel.findOne({
      slug,
      isDeleted: false,
    });
    if (!newsRelease) {
      throw new NotFoundException('News release not found');
    }
    return newsRelease;
  }

  async update(id: string, dto: UpdateNewsReleaseDto, user: any): Promise<NewsReleaseDocument> {
    const newsRelease = await this.findOne(id);

    const updateData: any = { $inc: { version: 1 } };

    if (dto.content) {
      updateData.content = this.contentSanitizationService.sanitizeAllContent(dto.content);

      if (dto.content['en']?.title && dto.content['en'].title !== newsRelease.content['en'].title) {
        updateData.slug = await SlugGeneratorUtil.generateUniqueSlug(
          dto.content['en'].title,
          this.newsReleaseModel,
          id,
        );
      }
    }

    if (dto.status !== undefined) {
      updateData.status = dto.status;
      if (dto.status === NewsReleaseStatus.PUBLISHED && !newsRelease.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    if (dto.featured !== undefined) updateData.featured = dto.featured;
    if (dto.featuredImage !== undefined) updateData.featuredImage = dto.featuredImage;
    if (dto.categories !== undefined) updateData.categories = dto.categories;
    if (dto.tags !== undefined) updateData.tags = dto.tags;
    if (dto.scheduledFor !== undefined) updateData.scheduledFor = dto.scheduledFor;
    if (dto.relatedArticles !== undefined) updateData.relatedArticles = dto.relatedArticles;
    if (dto.images !== undefined) updateData.images = dto.images;

    const updated = await this.newsReleaseModel.findByIdAndUpdate(id, updateData, { new: true });

    await this.auditLogService.logAction({
      entityId: id,
      action: 'update',
      performedBy: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      changes: dto,
    });

    return updated;
  }

  async remove(id: string, user: any): Promise<void> {
    await this.findOne(id);

    await this.newsReleaseModel.findByIdAndUpdate(id, {
      isDeleted: true,
      deletedAt: new Date(),
      $inc: { version: 1 },
    });

    await this.auditLogService.logAction({
      entityId: id,
      action: 'delete',
      performedBy: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  }

  async restore(id: string, user: any): Promise<NewsReleaseDocument> {
    const newsRelease = await this.newsReleaseModel.findById(id);
    if (!newsRelease) {
      throw new NotFoundException('News release not found');
    }

    const restored = await this.newsReleaseModel.findByIdAndUpdate(
      id,
      {
        isDeleted: false,
        $unset: { deletedAt: 1 },
        $inc: { version: 1 },
      },
      { new: true },
    );

    await this.auditLogService.logAction({
      entityId: id,
      action: 'restore',
      performedBy: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    return restored;
  }

  async publish(id: string, user: any): Promise<NewsReleaseDocument> {
    const newsRelease = await this.findOne(id);

    if (newsRelease.status === NewsReleaseStatus.PUBLISHED) {
      throw new ConflictException('News release is already published');
    }

    const published = await this.newsReleaseModel.findByIdAndUpdate(
      id,
      {
        status: NewsReleaseStatus.PUBLISHED,
        publishedAt: new Date(),
        $inc: { version: 1 },
      },
      { new: true },
    );

    await this.auditLogService.logAction({
      entityId: id,
      action: 'publish',
      performedBy: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    return published;
  }

  async archive(id: string, user: any): Promise<NewsReleaseDocument> {
    await this.findOne(id);

    const archived = await this.newsReleaseModel.findByIdAndUpdate(
      id,
      {
        status: NewsReleaseStatus.ARCHIVED,
        $inc: { version: 1 },
      },
      { new: true },
    );

    await this.auditLogService.logAction({
      entityId: id,
      action: 'archive',
      performedBy: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    return archived;
  }

  async uploadImage(
    id: string,
    file: Express.Multer.File,
    metadata: {
      caption?: Record<string, string>;
      altText?: Record<string, string>;
      order?: number;
    },
  ): Promise<NewsReleaseDocument> {
    const newsRelease = await this.findOne(id);

    const maxImages = 20;
    if (newsRelease.images.length >= maxImages) {
      throw new BadRequestException(`Maximum of ${maxImages} images allowed per article`);
    }

    const { url, thumbnailUrl } = await this.imageProcessingService.uploadImage(file);

    const newImage = {
      _id: new this.newsReleaseModel().id,
      url,
      thumbnailUrl,
      caption: metadata.caption || {},
      altText: metadata.altText || {},
      order: metadata.order || newsRelease.images.length,
      uploadedAt: new Date(),
    };

    const updated = await this.newsReleaseModel.findByIdAndUpdate(
      id,
      {
        $push: { images: newImage },
        $inc: { version: 1 },
      },
      { new: true },
    );

    return updated;
  }

  async removeImage(id: string, imageId: string): Promise<NewsReleaseDocument> {
    const newsRelease = await this.findOne(id);

    const image = newsRelease.images.find((img) => img._id?.toString() === imageId);
    if (!image) {
      throw new NotFoundException('Image not found');
    }

    await this.imageProcessingService.deleteImage(image.url);

    const updated = await this.newsReleaseModel.findByIdAndUpdate(
      id,
      {
        $pull: { images: { _id: imageId } },
        $inc: { version: 1 },
      },
      { new: true },
    );

    return updated;
  }

  async reorderImages(id: string, imageIds: string[]): Promise<NewsReleaseDocument> {
    const newsRelease = await this.findOne(id);

    const reorderedImages = imageIds.map((imageId, index) => {
      const image = newsRelease.images.find((img) => img._id?.toString() === imageId);
      if (!image) {
        throw new BadRequestException(`Image with ID ${imageId} not found`);
      }
      return { ...image, order: index };
    });

    const updated = await this.newsReleaseModel.findByIdAndUpdate(
      id,
      {
        images: reorderedImages,
        $inc: { version: 1 },
      },
      { new: true },
    );

    return updated;
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.newsReleaseModel.findByIdAndUpdate(id, {
      $inc: { viewCount: 1 },
    });
  }

  async getFeaturedNews(limit: number = 5): Promise<NewsReleaseDocument[]> {
    return this.newsReleaseModel
      .find({
        featured: true,
        status: NewsReleaseStatus.PUBLISHED,
        isDeleted: false,
      })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .exec();
  }

  async getPublicNews(query: {
    page?: number;
    limit?: number;
    language?: 'pt-BR' | 'en' | 'es';
    category?: string;
    tag?: string;
  }): Promise<{
    items: NewsReleaseDocument[];
    total: number;
    page: number;
    pages: number;
  }> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);

    const filter: any = {
      status: NewsReleaseStatus.PUBLISHED,
      isDeleted: false,
    };

    if (query.category) {
      filter.categories = query.category;
    }

    if (query.tag) {
      filter.tags = query.tag;
    }

    const total = await this.newsReleaseModel.countDocuments(filter);
    const pages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const items = await this.newsReleaseModel
      .find(filter)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return {
      items,
      total,
      page,
      pages,
    };
  }

  async generateRssFeed(language: 'pt-BR' | 'en' | 'es' = 'en'): Promise<string> {
    const releases = await this.newsReleaseModel
      .find({
        status: NewsReleaseStatus.PUBLISHED,
        isDeleted: false,
      })
      .sort({ publishedAt: -1 })
      .limit(50)
      .exec();

    return this.feedGeneratorService.generateRssFeed(releases, language);
  }

  async generateAtomFeed(language: 'pt-BR' | 'en' | 'es' = 'en'): Promise<string> {
    const releases = await this.newsReleaseModel
      .find({
        status: NewsReleaseStatus.PUBLISHED,
        isDeleted: false,
      })
      .sort({ publishedAt: -1 })
      .limit(50)
      .exec();

    return this.feedGeneratorService.generateAtomFeed(releases, language);
  }
}
