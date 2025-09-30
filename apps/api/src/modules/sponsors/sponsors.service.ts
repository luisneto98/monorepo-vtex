import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Sponsor, SponsorDocument } from './schemas/sponsor.schema';
import { SponsorTier, SponsorTierDocument } from './schemas/sponsor-tier.schema';
import { CreateSponsorDto } from './dto/create-sponsor.dto';
import { UpdateSponsorDto } from './dto/update-sponsor.dto';
import { SponsorFilterDto } from './dto/sponsor-filter.dto';
import { CreateSponsorTierDto } from './dto/create-sponsor-tier.dto';
import { UpdateSponsorTierDto } from './dto/update-sponsor-tier.dto';
import { PaginatedResponse } from '@common/dto/pagination.dto';

@Injectable()
export class SponsorsService {
  constructor(
    @InjectModel(Sponsor.name) private sponsorModel: Model<SponsorDocument>,
    @InjectModel(SponsorTier.name) private sponsorTierModel: Model<SponsorTierDocument>,
  ) {}

  // Sponsor CRUD
  async createSponsor(createSponsorDto: CreateSponsorDto): Promise<SponsorDocument> {
    const existingSponsor = await this.sponsorModel.findOne({
      $or: [
        { name: createSponsorDto.name, deletedAt: null },
        { slug: createSponsorDto.slug, deletedAt: null },
      ],
    });

    if (existingSponsor) {
      throw new ConflictException('Sponsor with this name or slug already exists');
    }

    // Verify tier exists
    const tier = await this.sponsorTierModel.findById(createSponsorDto.tier);
    if (!tier) {
      throw new NotFoundException(`Sponsor tier with ID ${createSponsorDto.tier} not found`);
    }

    const createdSponsor = new this.sponsorModel(createSponsorDto);
    return createdSponsor.save();
  }

  async findAllSponsors(filterDto: SponsorFilterDto): Promise<PaginatedResponse<SponsorDocument>> {
    const { page = 1, limit = 20, sort, search, tier, tags, isVisible, standLocation } = filterDto;

    const query: any = { deletedAt: null };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'description.pt-BR': { $regex: search, $options: 'i' } },
        { 'description.en': { $regex: search, $options: 'i' } },
      ];
    }

    if (tier) {
      query.tier = tier;
    }

    if (tags && tags.length > 0) {
      query.tags = { $in: tags };
    }

    if (typeof isVisible !== 'undefined') {
      query.isVisible = isVisible;
    }

    if (standLocation) {
      query.standLocation = { $regex: standLocation, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    let sortOptions: any = { 'tier.order': 1, orderInTier: 1 };
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
      this.sponsorModel
        .find(query)
        .populate('tier')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.sponsorModel.countDocuments(query),
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

  async findSponsorById(id: string): Promise<SponsorDocument> {
    const sponsor = await this.sponsorModel
      .findOne({
        _id: id,
        deletedAt: null,
      })
      .populate('tier')
      .exec();

    if (!sponsor) {
      throw new NotFoundException(`Sponsor with ID ${id} not found`);
    }

    return sponsor;
  }

  async findSponsorsByTier(): Promise<{ [tierName: string]: SponsorDocument[] }> {
    const sponsors = await this.sponsorModel
      .find({
        isVisible: true,
        deletedAt: null,
      })
      .populate('tier')
      .sort({ 'tier.order': 1, orderInTier: 1 })
      .exec();

    const groupedSponsors: { [tierName: string]: SponsorDocument[] } = {};

    sponsors.forEach((sponsor) => {
      const tierName = (sponsor.tier as any).name;
      if (!groupedSponsors[tierName]) {
        groupedSponsors[tierName] = [];
      }
      groupedSponsors[tierName].push(sponsor);
    });

    return groupedSponsors;
  }

  async updateSponsor(id: string, updateSponsorDto: UpdateSponsorDto): Promise<SponsorDocument> {
    const sponsor = await this.sponsorModel.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!sponsor) {
      throw new NotFoundException(`Sponsor with ID ${id} not found`);
    }

    // Check for name/slug conflicts if being updated
    if (updateSponsorDto.name || updateSponsorDto.slug) {
      const conflictQuery: any = {
        _id: { $ne: id },
        deletedAt: null,
        $or: [],
      };

      if (updateSponsorDto.name) {
        conflictQuery.$or.push({ name: updateSponsorDto.name });
      }
      if (updateSponsorDto.slug) {
        conflictQuery.$or.push({ slug: updateSponsorDto.slug });
      }

      const existingSponsor = await this.sponsorModel.findOne(conflictQuery);
      if (existingSponsor) {
        throw new ConflictException('Another sponsor with this name or slug already exists');
      }
    }

    // Verify tier exists if being updated
    if (updateSponsorDto.tier) {
      const tier = await this.sponsorTierModel.findById(updateSponsorDto.tier);
      if (!tier) {
        throw new NotFoundException(`Sponsor tier with ID ${updateSponsorDto.tier} not found`);
      }
    }

    Object.assign(sponsor, updateSponsorDto);
    return sponsor.save();
  }

  async removeSponsor(id: string, reason?: string, userId?: string): Promise<void> {
    const sponsor = await this.sponsorModel.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!sponsor) {
      throw new NotFoundException(`Sponsor with ID ${id} not found`);
    }

    sponsor.deletedAt = new Date();
    sponsor.deleteReason = reason;

    if (userId) {
      sponsor.deletedBy = userId as any;
    }

    await sponsor.save();
  }

  async restoreSponsor(id: string): Promise<SponsorDocument> {
    const sponsor = await this.sponsorModel.findOne({
      _id: id,
      deletedAt: { $ne: null },
    });

    if (!sponsor) {
      throw new NotFoundException(`Deleted sponsor with ID ${id} not found`);
    }

    sponsor.deletedAt = null;
    sponsor.deletedBy = null;
    sponsor.deleteReason = null;

    return sponsor.save();
  }

  // SponsorTier CRUD
  async createTier(createTierDto: CreateSponsorTierDto): Promise<SponsorTierDocument> {
    const existingTier = await this.sponsorTierModel.findOne({
      $or: [{ name: createTierDto.name }, { order: createTierDto.order }],
    });

    if (existingTier) {
      throw new ConflictException('Sponsor tier with this name or order already exists');
    }

    const createdTier = new this.sponsorTierModel(createTierDto);
    return createdTier.save();
  }

  async findAllTiers(): Promise<SponsorTierDocument[]> {
    return this.sponsorTierModel.find().sort({ order: 1 }).exec();
  }

  async findTierById(id: string): Promise<SponsorTierDocument> {
    const tier = await this.sponsorTierModel.findById(id);
    if (!tier) {
      throw new NotFoundException(`Sponsor tier with ID ${id} not found`);
    }
    return tier;
  }

  async updateTier(id: string, updateTierDto: UpdateSponsorTierDto): Promise<SponsorTierDocument> {
    const tier = await this.sponsorTierModel.findById(id);
    if (!tier) {
      throw new NotFoundException(`Sponsor tier with ID ${id} not found`);
    }

    // Check for conflicts if name or order is being updated
    if (updateTierDto.name || updateTierDto.order) {
      const conflictQuery: any = {
        _id: { $ne: id },
        $or: [],
      };

      if (updateTierDto.name) {
        conflictQuery.$or.push({ name: updateTierDto.name });
      }
      if (updateTierDto.order) {
        conflictQuery.$or.push({ order: updateTierDto.order });
      }

      const existingTier = await this.sponsorTierModel.findOne(conflictQuery);
      if (existingTier) {
        throw new ConflictException('Another tier with this name or order already exists');
      }
    }

    Object.assign(tier, updateTierDto);
    return tier.save();
  }

  async removeTier(id: string): Promise<void> {
    // Check if any sponsors are using this tier
    const sponsorsWithTier = await this.sponsorModel.findOne({
      tier: id,
      deletedAt: null,
    });

    if (sponsorsWithTier) {
      throw new ConflictException('Cannot delete tier: sponsors are still assigned to this tier');
    }

    const result = await this.sponsorTierModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Sponsor tier with ID ${id} not found`);
    }
  }

  async reorderTiers(tierIds: string[]): Promise<void> {
    // Validate all tiers exist
    const tiers = await this.sponsorTierModel.find({ _id: { $in: tierIds } });

    if (tiers.length !== tierIds.length) {
      throw new NotFoundException('One or more tier IDs not found');
    }

    // First, set all orders to negative values to avoid unique constraint conflicts
    const tempUpdatePromises = tierIds.map((tierId, index) =>
      this.sponsorTierModel.updateOne(
        { _id: tierId },
        { $set: { order: -(index + 1) } }
      )
    );
    await Promise.all(tempUpdatePromises);

    // Then update to final positive values
    const finalUpdatePromises = tierIds.map((tierId, index) =>
      this.sponsorTierModel.updateOne(
        { _id: tierId },
        { $set: { order: index + 1 } }
      )
    );
    await Promise.all(finalUpdatePromises);
  }
}
