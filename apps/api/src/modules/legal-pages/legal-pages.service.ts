import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LegalPage, LegalPageDocument, FileMetadata } from './schemas/legal-page.schema';
import { CreateLegalPageDto } from './dto/create-legal-page.dto';
import { UpdateLegalPageDto } from './dto/update-legal-page.dto';
import { SupportedLanguage } from './dto/upload-file.dto';
import { S3StorageService } from './services/s3-storage.service';
import { VirusScannerService } from './services/virus-scanner.service';
import { Readable } from 'stream';

@Injectable()
export class LegalPagesService {
  constructor(
    @InjectModel(LegalPage.name)
    private legalPageModel: Model<LegalPageDocument>,
    private s3StorageService: S3StorageService,
    private virusScannerService: VirusScannerService,
  ) {}

  async create(createLegalPageDto: CreateLegalPageDto): Promise<LegalPage> {
    try {
      const existingPage = await this.legalPageModel.findOne({ slug: createLegalPageDto.slug });
      if (existingPage) {
        throw new BadRequestException('Legal page with this slug already exists');
      }

      const createdLegalPage = new this.legalPageModel(createLegalPageDto);
      return await createdLegalPage.save();
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create legal page');
    }
  }

  async findAll(isActive?: boolean): Promise<LegalPage[]> {
    const query = isActive !== undefined ? { isActive } : {};
    return this.legalPageModel.find(query).exec();
  }

  async findOne(id: string): Promise<LegalPage> {
    const legalPage = await this.legalPageModel.findById(id).exec();
    if (!legalPage) {
      throw new NotFoundException(`Legal page with ID ${id} not found`);
    }
    return legalPage;
  }

  async findBySlug(slug: string): Promise<LegalPage> {
    const legalPage = await this.legalPageModel.findOne({ slug }).exec();
    if (!legalPage) {
      throw new NotFoundException(`Legal page with slug ${slug} not found`);
    }
    return legalPage;
  }

  async update(
    id: string,
    updateLegalPageDto: UpdateLegalPageDto,
    userId: string,
  ): Promise<LegalPage> {
    const updatedData = {
      ...updateLegalPageDto,
      lastModifiedBy: userId,
    };

    const legalPage = await this.legalPageModel
      .findByIdAndUpdate(id, updatedData, { new: true })
      .exec();

    if (!legalPage) {
      throw new NotFoundException(`Legal page with ID ${id} not found`);
    }
    return legalPage;
  }

  async uploadFile(
    id: string,
    file: Express.Multer.File,
    language: SupportedLanguage,
    userId: string,
  ): Promise<LegalPage> {
    const legalPage = await this.legalPageModel.findById(id).exec();
    if (!legalPage) {
      throw new NotFoundException(`Legal page with ID ${id} not found`);
    }

    // Scan file for viruses before uploading
    await this.virusScannerService.scanFile(file.buffer, file.originalname);

    // Delete old file from S3 if exists
    const oldFile = legalPage.files?.[language];
    if (oldFile?.filename) {
      await this.s3StorageService.deleteFile(oldFile.filename);
    }

    // Generate S3 key and upload new file
    const s3Key = this.s3StorageService.generateFileKey(
      file.originalname,
      `legal-pages/${legalPage.slug}/${language}`,
    );

    await this.s3StorageService.uploadFile(s3Key, file, {
      legalPageId: id,
      language: language,
      uploadedBy: userId,
    });

    const fileMetadata: FileMetadata = {
      filename: s3Key,
      originalName: file.originalname,
      size: file.size,
      uploadedAt: new Date(),
      uploadedBy: userId,
    };

    if (!legalPage.files) {
      legalPage.files = {};
    }
    legalPage.files[language] = fileMetadata;
    legalPage.lastModifiedBy = userId;

    return await legalPage.save();
  }

  async deleteFile(id: string, language: SupportedLanguage, userId: string): Promise<LegalPage> {
    const legalPage = await this.legalPageModel.findById(id).exec();
    if (!legalPage) {
      throw new NotFoundException(`Legal page with ID ${id} not found`);
    }

    const file = legalPage.files?.[language];
    if (!file) {
      throw new NotFoundException(`No file found for language ${language}`);
    }

    // Delete file from S3
    await this.s3StorageService.deleteFile(file.filename);

    delete legalPage.files[language];
    legalPage.lastModifiedBy = userId;

    return await legalPage.save();
  }

  async remove(id: string): Promise<void> {
    const legalPage = await this.findOne(id);

    // Delete all files from S3
    if (legalPage.files) {
      const deletePromises = Object.values(legalPage.files)
        .filter((file) => file?.filename)
        .map((file) => this.s3StorageService.deleteFile(file.filename));

      await Promise.all(deletePromises);
    }

    await this.legalPageModel.findByIdAndDelete(id).exec();
  }

  async getPublicPages(): Promise<any[]> {
    const pages = await this.legalPageModel
      .find({ isActive: true })
      .select('slug type title files')
      .exec();

    return pages.map((page) => ({
      slug: page.slug,
      type: page.type,
      title: page.title,
      availableLanguages: page.files
        ? Object.keys(page.files).filter((lang) => page.files[lang])
        : [],
    }));
  }

  async getFileStream(
    slug: string,
    language: SupportedLanguage,
  ): Promise<{ stream: Readable; metadata: FileMetadata }> {
    const legalPage = await this.findBySlug(slug);

    if (!legalPage.isActive) {
      throw new NotFoundException('This legal page is not available');
    }

    const file = legalPage.files?.[language];
    if (!file) {
      throw new NotFoundException(`No file available for language ${language}`);
    }

    // Get file stream from S3
    const stream = await this.s3StorageService.getFile(file.filename);
    return { stream, metadata: file };
  }

  async getSignedDownloadUrl(
    slug: string,
    language: SupportedLanguage,
  ): Promise<{ url: string; metadata: FileMetadata }> {
    const legalPage = await this.findBySlug(slug);

    if (!legalPage.isActive) {
      throw new NotFoundException('This legal page is not available');
    }

    const file = legalPage.files?.[language];
    if (!file) {
      throw new NotFoundException(`No file available for language ${language}`);
    }

    // Generate signed URL for direct S3 access
    const url = await this.s3StorageService.getSignedDownloadUrl(file.filename);
    return { url, metadata: file };
  }
}
