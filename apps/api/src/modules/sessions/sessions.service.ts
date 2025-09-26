import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Session, SessionDocument } from './schemas/session.schema';

@Injectable()
export class SessionsService {
  constructor(@InjectModel(Session.name) private sessionModel: Model<SessionDocument>) {}

  async create(createSessionDto: any): Promise<SessionDocument> {
    const createdSession = new this.sessionModel(createSessionDto);
    return createdSession.save();
  }

  async findAll(): Promise<SessionDocument[]> {
    return this.sessionModel
      .find()
      .populate('speakers')
      .sort({ 'schedule.date': 1, 'schedule.startTime': 1 })
      .exec();
  }

  async findById(id: string): Promise<SessionDocument> {
    const session = await this.sessionModel.findById(id).populate('speakers').exec();
    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }
    return session;
  }

  async findByDate(date: Date): Promise<SessionDocument[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.sessionModel
      .find({
        'schedule.date': {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      })
      .populate('speakers')
      .sort({ 'schedule.startTime': 1 })
      .exec();
  }

  async update(id: string, updateSessionDto: any): Promise<SessionDocument> {
    const updatedSession = await this.sessionModel
      .findByIdAndUpdate(id, updateSessionDto, { new: true })
      .populate('speakers')
      .exec();
    if (!updatedSession) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }
    return updatedSession;
  }

  async remove(id: string): Promise<void> {
    const result = await this.sessionModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }
  }
}
