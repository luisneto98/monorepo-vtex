import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { PressMaterial, PressMaterialDocument } from './schemas/press-material.schema';
import { FileUploadService } from './services/file-upload.service';
import { ThumbnailService } from './services/thumbnail.service';
import { DownloadTrackingService } from './services/download-tracking.service';
import { CreatePressMaterialDto } from './dto/create-press-material.dto';
import { UpdatePressMaterialDto } from './dto/update-press-material.dto';
import { QueryPressMaterialDto } from './dto/query-press-material.dto';
import { SanitizationUtil } from '../../common/utils/sanitization.util';
import { FileUploadResponse } from '@vtexday26/shared';

@Injectable()
export class PressMaterialsService {
  constructor(
    @InjectModel(PressMaterial.name)
    private pressMaterialModel: Model<PressMaterialDocument>,
    private fileUploadService: FileUploadService,
    private thumbnailService: ThumbnailService,
    private downloadTrackingService: DownloadTrackingService,
  ) {}

  async create(
    dto: CreatePressMaterialDto,
    file: Express.Multer.File,
    uploadedBy: string,
  ): Promise<any> {
    // Sanitize input data
    const sanitizedDto = {
      ...dto,
      title: SanitizationUtil.sanitizeLocalizedString(dto.title),
      description: dto.description
        ? SanitizationUtil.sanitizeLocalizedString(dto.description)
        : undefined,
      tags: dto.tags ? SanitizationUtil.sanitizeTags(dto.tags) : undefined,
    };

    // Upload file to S3
    const uploadResponse = await this.fileUploadService.uploadFile(
      file,
      sanitizedDto.type,
      uploadedBy,
    );

    // Generate thumbnail if applicable
    const thumbnailUrl = await this.thumbnailService.generateThumbnail(
      file,
      dto.type,
      uploadResponse.fileUrl,
    );

    // Add dimensions for images
    if (dto.type === 'photo' && file.buffer) {
      try {
        const sharp = await import('sharp');
        const metadata = await sharp.default(file.buffer).metadata();
        uploadResponse.metadata.width = metadata.width;
        uploadResponse.metadata.height = metadata.height;
      } catch (error) {
        console.error('Error extracting image metadata:', error);
      }
    }

    // Create press material document
    const pressMaterial = new this.pressMaterialModel({
      ...sanitizedDto,
      fileUrl: uploadResponse.fileUrl,
      thumbnailUrl,
      metadata: uploadResponse.metadata,
      uploadedBy,
      description: sanitizedDto.description || {
        pt: '',
        en: '',
        es: '',
      },
      tags: sanitizedDto.tags || [],
      status: sanitizedDto.status || 'draft',
      accessLevel: sanitizedDto.accessLevel || 'public',
      downloadCount: 0,
    });

    return pressMaterial.save();
  }

  async findAll(query: QueryPressMaterialDto): Promise<{
    items: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      type,
      status,
      accessLevel,
      tags,
      search,
    } = query;

    const filter: FilterQuery<PressMaterialDocument> = {};

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (accessLevel) filter.accessLevel = accessLevel;
    if (tags?.length) filter.tags = { $in: tags };
    if (search) {
      // Sanitize search input to prevent regex injection
      const sanitizedSearch = SanitizationUtil.sanitizeText(search).replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&',
      );
      filter.$or = [
        { 'title.pt': { $regex: sanitizedSearch, $options: 'i' } },
        { 'title.en': { $regex: sanitizedSearch, $options: 'i' } },
        { 'title.es': { $regex: sanitizedSearch, $options: 'i' } },
        { tags: { $regex: sanitizedSearch, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sortOptions: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const [items, total] = await Promise.all([
      this.pressMaterialModel.find(filter).sort(sortOptions).skip(skip).limit(limit).lean(),
      this.pressMaterialModel.countDocuments(filter),
    ]);

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findPublic(): Promise<any[]> {
    return this.pressMaterialModel
      .find({
        status: 'published',
        accessLevel: 'public',
      })
      .sort({ createdAt: -1 })
      .select('-uploadedBy')
      .lean();
  }

  async findOne(id: string): Promise<any> {
    const material = await this.pressMaterialModel.findById(id).lean();
    if (!material) {
      throw new NotFoundException(`Press material with ID ${id} not found`);
    }
    return material;
  }

  async update(id: string, dto: UpdatePressMaterialDto, _userId: string): Promise<any> {
    const material = await this.pressMaterialModel.findById(id);
    if (!material) {
      throw new NotFoundException(`Press material with ID ${id} not found`);
    }

    // Sanitize input data
    const sanitizedDto = {
      ...dto,
      title: dto.title ? SanitizationUtil.sanitizeLocalizedString(dto.title) : undefined,
      description: dto.description
        ? SanitizationUtil.sanitizeLocalizedString(dto.description)
        : undefined,
      tags: dto.tags ? SanitizationUtil.sanitizeTags(dto.tags) : undefined,
    };

    // Update fields
    Object.assign(material, sanitizedDto);

    return material.save();
  }

  async remove(id: string): Promise<void> {
    const material = await this.pressMaterialModel.findById(id);
    if (!material) {
      throw new NotFoundException(`Press material with ID ${id} not found`);
    }

    // Delete file from S3
    try {
      await this.fileUploadService.deleteFile(material.fileUrl);
      if (material.thumbnailUrl) {
        await this.fileUploadService.deleteFile(material.thumbnailUrl);
      }
    } catch (error) {
      console.error('Error deleting files from S3:', error);
    }

    await material.deleteOne();
  }

  async uploadFile(
    file: Express.Multer.File,
    materialType: string,
    uploadedBy: string,
  ): Promise<FileUploadResponse> {
    if (!materialType) {
      throw new BadRequestException('Material type is required');
    }

    const uploadResponse = await this.fileUploadService.uploadFile(
      file,
      materialType as any,
      uploadedBy,
    );

    const thumbnailUrl = await this.thumbnailService.generateThumbnail(
      file,
      materialType as any,
      uploadResponse.fileUrl,
    );

    return {
      ...uploadResponse,
      thumbnailUrl,
    };
  }

  async getDownloadUrl(
    id: string,
    ipAddress: string,
    userAgent: string,
    userId?: string,
  ): Promise<string> {
    const material = await this.pressMaterialModel.findById(id);
    if (!material) {
      throw new NotFoundException(`Press material with ID ${id} not found`);
    }

    // Check access level
    if (material.accessLevel === 'restricted' && !userId) {
      throw new ForbiddenException('Authentication required to download this material');
    }

    // Track download
    await this.downloadTrackingService.trackDownload(id, ipAddress, userAgent, userId);

    // Generate signed URL if restricted
    if (material.accessLevel === 'restricted') {
      return this.fileUploadService.generateSignedUrl(material.fileUrl);
    }

    return material.fileUrl;
  }

  async getStatistics(id: string): Promise<any> {
    await this.findOne(id); // Validate material exists
    return this.downloadTrackingService.getDownloadStatistics(id);
  }

  async getTopDownloaded(limit = 10): Promise<any[]> {
    return this.downloadTrackingService.getTopDownloadedMaterials(limit);
  }
}
