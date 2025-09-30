import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Session, SessionDocument } from './schemas/session.schema';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { SessionFilterDto } from './dto/session-filter.dto';
import { PaginatedResponse } from '@common/dto/pagination.dto';

@Injectable()
export class SessionsService {
  constructor(@InjectModel(Session.name) private sessionModel: Model<SessionDocument>) {}

  async create(createSessionDto: CreateSessionDto): Promise<SessionDocument> {
    // Check for conflicts (same stage and overlapping time)
    await this.checkTimeConflict(
      createSessionDto.startTime,
      createSessionDto.endTime,
      createSessionDto.stage,
    );

    const createdSession = new this.sessionModel(createSessionDto);
    return createdSession.save();
  }

  async findAll(filterDto: SessionFilterDto): Promise<PaginatedResponse<SessionDocument>> {
    const {
      page = 1,
      limit = 20,
      sort,
      search,
      startDate,
      endDate,
      stage,
      type,
      tags,
      speakerId,
      sponsorId,
      isHighlight,
      isVisible,
      isLive,
      isUpcoming,
      isPast,
    } = filterDto;

    const query: any = { deletedAt: null };

    if (search) {
      query.$or = [
        { 'title.pt-BR': { $regex: search, $options: 'i' } },
        { 'title.en': { $regex: search, $options: 'i' } },
        { 'description.pt-BR': { $regex: search, $options: 'i' } },
        { 'description.en': { $regex: search, $options: 'i' } },
      ];
    }

    if (startDate) {
      query.startTime = { $gte: startDate };
    }

    if (endDate) {
      if (query.startTime) {
        query.startTime.$lte = endDate;
      } else {
        query.startTime = { $lte: endDate };
      }
    }

    if (stage) {
      query.stage = stage;
    }

    if (type) {
      query.type = type;
    }

    if (tags && tags.length > 0) {
      query.tags = { $in: tags };
    }

    if (speakerId) {
      query.speakerIds = speakerId;
    }

    if (sponsorId) {
      query.sponsorIds = sponsorId;
    }

    if (typeof isHighlight !== 'undefined') {
      query.isHighlight = isHighlight;
    }

    if (typeof isVisible !== 'undefined') {
      query.isVisible = isVisible;
    }

    // Time-based filters
    const now = new Date();
    if (isLive) {
      query.startTime = { $lte: now };
      query.endTime = { $gt: now };
    } else if (isUpcoming) {
      query.startTime = { $gt: now };
    } else if (isPast) {
      query.endTime = { $lt: now };
    }

    const skip = (page - 1) * limit;

    let sortOptions: any = { startTime: 1 };
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
      this.sessionModel
        .find(query)
        .populate('speakerIds', 'name photoUrl company')
        .populate('sponsorIds', 'name logoUrl tier')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.sessionModel.countDocuments(query),
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

  async findById(id: string): Promise<SessionDocument> {
    const session = await this.sessionModel
      .findOne({
        _id: id,
        deletedAt: null,
      })
      .populate('speakerIds', 'name photoUrl company bio position')
      .populate('sponsorIds', 'name logoUrl tier description website')
      .exec();

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    return session;
  }

  async findHighlights(): Promise<SessionDocument[]> {
    return this.sessionModel
      .find({
        isHighlight: true,
        isVisible: true,
        deletedAt: null,
      })
      .populate('speakerIds', 'name photoUrl company')
      .sort({ startTime: 1 })
      .exec();
  }

  async findLiveSessions(): Promise<SessionDocument[]> {
    const now = new Date();
    return this.sessionModel
      .find({
        startTime: { $lte: now },
        endTime: { $gt: now },
        isVisible: true,
        deletedAt: null,
      })
      .populate('speakerIds', 'name photoUrl company')
      .sort({ startTime: 1 })
      .exec();
  }

  async update(id: string, updateSessionDto: UpdateSessionDto): Promise<SessionDocument> {
    const session = await this.sessionModel.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    // Check for time conflicts if time or stage is being updated
    if (updateSessionDto.startTime || updateSessionDto.endTime || updateSessionDto.stage) {
      const startTime = updateSessionDto.startTime || session.startTime;
      const endTime = updateSessionDto.endTime || session.endTime;
      const stage = updateSessionDto.stage || session.stage;

      await this.checkTimeConflict(startTime, endTime, stage, id);
    }

    // Use findByIdAndUpdate to bypass full validation
    const updated = await this.sessionModel.findByIdAndUpdate(
      id,
      { $set: updateSessionDto },
      { new: true, runValidators: true }
    );

    if (!updated) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    return updated;
  }

  async remove(id: string, reason?: string, userId?: string): Promise<void> {
    const session = await this.sessionModel.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    session.deletedAt = new Date();
    session.deleteReason = reason;

    if (userId) {
      session.deletedBy = userId as any;
    }

    await session.save();
  }

  async restore(id: string): Promise<SessionDocument> {
    const session = await this.sessionModel.findOne({
      _id: id,
      deletedAt: { $ne: null },
    });

    if (!session) {
      throw new NotFoundException(`Deleted session with ID ${id} not found`);
    }

    session.deletedAt = null;
    session.deletedBy = null;
    session.deleteReason = null;

    return session.save();
  }

  private async checkTimeConflict(
    startTime: Date,
    endTime: Date,
    stage: string,
    excludeId?: string,
  ): Promise<void> {
    const query: any = {
      stage,
      deletedAt: null,
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime },
        },
      ],
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const conflictingSession = await this.sessionModel.findOne(query);

    if (conflictingSession) {
      throw new ConflictException(
        `Time conflict: Another session is scheduled at the same stage "${stage}" during this time period`,
      );
    }
  }
}
