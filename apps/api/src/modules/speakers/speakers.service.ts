import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Speaker, SpeakerDocument } from './schemas/speaker.schema';

@Injectable()
export class SpeakersService {
  constructor(@InjectModel(Speaker.name) private speakerModel: Model<SpeakerDocument>) {}

  async create(createSpeakerDto: any): Promise<SpeakerDocument> {
    const existingSpeaker = await this.speakerModel.findOne({
      email: createSpeakerDto.email,
    });
    if (existingSpeaker) {
      throw new ConflictException('Speaker with this email already exists');
    }
    const createdSpeaker = new this.speakerModel(createSpeakerDto);
    return createdSpeaker.save();
  }

  async findAll(): Promise<SpeakerDocument[]> {
    return this.speakerModel
      .find({ isActive: true })
      .populate('sessions')
      .sort({ isHighlight: -1, lastName: 1 })
      .exec();
  }

  async findById(id: string): Promise<SpeakerDocument> {
    const speaker = await this.speakerModel.findById(id).populate('sessions').exec();
    if (!speaker) {
      throw new NotFoundException(`Speaker with ID ${id} not found`);
    }
    return speaker;
  }

  async findHighlights(): Promise<SpeakerDocument[]> {
    return this.speakerModel
      .find({ isHighlight: true, isActive: true })
      .populate('sessions')
      .exec();
  }

  async update(id: string, updateSpeakerDto: any): Promise<SpeakerDocument> {
    const updatedSpeaker = await this.speakerModel
      .findByIdAndUpdate(id, updateSpeakerDto, { new: true })
      .populate('sessions')
      .exec();
    if (!updatedSpeaker) {
      throw new NotFoundException(`Speaker with ID ${id} not found`);
    }
    return updatedSpeaker;
  }

  async remove(id: string): Promise<void> {
    const result = await this.speakerModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Speaker with ID ${id} not found`);
    }
  }
}
