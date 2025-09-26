import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Sponsor, SponsorDocument } from './schemas/sponsor.schema';
import { SponsorTier } from '@shared/types/sponsor.types';

@Injectable()
export class SponsorsService {
  constructor(@InjectModel(Sponsor.name) private sponsorModel: Model<SponsorDocument>) {}

  async create(createSponsorDto: any): Promise<SponsorDocument> {
    const existingSponsor = await this.sponsorModel.findOne({
      name: createSponsorDto.name,
    });
    if (existingSponsor) {
      throw new ConflictException('Sponsor with this name already exists');
    }
    const createdSponsor = new this.sponsorModel(createSponsorDto);
    return createdSponsor.save();
  }

  async findAll(): Promise<SponsorDocument[]> {
    const tierOrder = {
      [SponsorTier.DIAMOND]: 1,
      [SponsorTier.PLATINUM]: 2,
      [SponsorTier.GOLD]: 3,
      [SponsorTier.SILVER]: 4,
      [SponsorTier.BRONZE]: 5,
    };

    const sponsors = await this.sponsorModel.find({ isActive: true }).populate('posts').exec();

    return sponsors.sort((a, b) => {
      return tierOrder[a.tier] - tierOrder[b.tier];
    });
  }

  async findById(id: string): Promise<SponsorDocument> {
    const sponsor = await this.sponsorModel.findById(id).populate('posts').exec();
    if (!sponsor) {
      throw new NotFoundException(`Sponsor with ID ${id} not found`);
    }
    return sponsor;
  }

  async findByTier(tier: SponsorTier): Promise<SponsorDocument[]> {
    return this.sponsorModel.find({ tier, isActive: true }).populate('posts').exec();
  }

  async update(id: string, updateSponsorDto: any): Promise<SponsorDocument> {
    const updatedSponsor = await this.sponsorModel
      .findByIdAndUpdate(id, updateSponsorDto, { new: true })
      .populate('posts')
      .exec();
    if (!updatedSponsor) {
      throw new NotFoundException(`Sponsor with ID ${id} not found`);
    }
    return updatedSponsor;
  }

  async remove(id: string): Promise<void> {
    const result = await this.sponsorModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Sponsor with ID ${id} not found`);
    }
  }
}
