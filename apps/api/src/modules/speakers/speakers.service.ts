import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Speaker, SpeakerDocument } from './schemas/speaker.schema';
import { CreateSpeakerDto } from './dto/create-speaker.dto';
import { UpdateSpeakerDto } from './dto/update-speaker.dto';
import { SpeakerFilterDto } from './dto/speaker-filter.dto';
import { PaginatedResponse } from '@common/dto/pagination.dto';
import { StorageService } from '../storage/services/storage.service';
import { FileCategory } from '../storage/types/storage.types';

@Injectable()
export class SpeakersService {
  constructor(
    @InjectModel(Speaker.name) private speakerModel: Model<SpeakerDocument>,
    private storageService: StorageService,
  ) {}

  async create(createSpeakerDto: CreateSpeakerDto): Promise<SpeakerDocument> {
    const existingSpeaker = await this.speakerModel.findOne({
      name: createSpeakerDto.name,
      deletedAt: null,
    });

    if (existingSpeaker) {
      throw new ConflictException('Speaker with this name already exists');
    }

    const createdSpeaker = new this.speakerModel(createSpeakerDto);
    return createdSpeaker.save();
  }

  async findAll(filterDto: SpeakerFilterDto): Promise<PaginatedResponse<SpeakerDocument>> {
    const { page = 1, limit = 20, sort, search, isHighlight, isVisible, company, tags } = filterDto;

    const query: any = { deletedAt: null };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { 'bio.pt-BR': { $regex: search, $options: 'i' } },
        { 'bio.en': { $regex: search, $options: 'i' } },
      ];
    }

    if (typeof isHighlight !== 'undefined') {
      query.isHighlight = isHighlight;
    }

    if (typeof isVisible !== 'undefined') {
      query.isVisible = isVisible;
    }

    if (company) {
      query.company = { $regex: company, $options: 'i' };
    }

    if (tags && tags.length > 0) {
      query.tags = { $in: tags };
    }

    const skip = (page - 1) * limit;

    let sortOptions: any = { priority: 1 };
    if (sort) {
      sortOptions = {};
      const sortFields = sort.split(',');
      for (const field of sortFields) {
        if (field.startsWith('-')) {
          sortOptions[field.substring(1)] = -1;
        } else {
          sortOptions[field] = 1;
        }
      }
    }

    const [data, total] = await Promise.all([
      this.speakerModel.find(query).sort(sortOptions).skip(skip).limit(limit).exec(),
      this.speakerModel.countDocuments(query),
    ]);

    return {
      success: true,
      data,
      metadata: {
        total,
        page,
        limit,
        hasNext: skip + data.length < total,
        hasPrev: page > 1,
      },
    };
  }

  async findById(id: string): Promise<SpeakerDocument> {
    const speaker = await this.speakerModel
      .findOne({
        _id: id,
        deletedAt: null,
      })
      .exec();

    if (!speaker) {
      throw new NotFoundException(`Speaker with ID ${id} not found`);
    }

    return speaker;
  }

  async findHighlights(): Promise<SpeakerDocument[]> {
    return this.speakerModel
      .find({
        isHighlight: true,
        isVisible: true,
        deletedAt: null,
      })
      .sort({ priority: 1 })
      .exec();
  }

  async update(id: string, updateSpeakerDto: UpdateSpeakerDto): Promise<SpeakerDocument> {
    const speaker = await this.speakerModel.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!speaker) {
      throw new NotFoundException(`Speaker with ID ${id} not found`);
    }

    if ('name' in updateSpeakerDto && updateSpeakerDto.name !== speaker.name) {
      const existingSpeaker = await this.speakerModel.findOne({
        name: updateSpeakerDto.name,
        _id: { $ne: id },
        deletedAt: null,
      });

      if (existingSpeaker) {
        throw new ConflictException('Another speaker with this name already exists');
      }
    }

    Object.assign(speaker, updateSpeakerDto);
    return speaker.save();
  }

  async remove(id: string, reason?: string, userId?: string): Promise<void> {
    const speaker = await this.speakerModel.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!speaker) {
      throw new NotFoundException(`Speaker with ID ${id} not found`);
    }

    speaker.deletedAt = new Date();
    speaker.deleteReason = reason;

    if (userId) {
      speaker.deletedBy = userId as any;
    }

    await speaker.save();
  }

  async restore(id: string): Promise<SpeakerDocument> {
    const speaker = await this.speakerModel.findOne({
      _id: id,
      deletedAt: { $ne: null },
    });

    if (!speaker) {
      throw new NotFoundException(`Deleted speaker with ID ${id} not found`);
    }

    speaker.deletedAt = null;
    speaker.deletedBy = null;
    speaker.deleteReason = null;

    return speaker.save();
  }

  async uploadPhoto(id: string, file: Express.Multer.File): Promise<string> {
    // Verify speaker exists
    const speaker = await this.speakerModel.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!speaker) {
      throw new NotFoundException(`Speaker with ID ${id} not found`);
    }

    // Upload file to S3
    const uploadResult = await this.storageService.uploadFile(file, FileCategory.SPEAKER_PHOTOS);

    // Update speaker photoUrl
    speaker.photoUrl = uploadResult.url;
    await speaker.save();

    return uploadResult.url;
  }
}
