import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DownloadLog, DownloadLogDocument } from '../schemas/download-log.schema';
import { PressMaterial, PressMaterialDocument } from '../schemas/press-material.schema';

@Injectable()
export class DownloadTrackingService {
  constructor(
    @InjectModel(DownloadLog.name)
    private downloadLogModel: Model<DownloadLogDocument>,
    @InjectModel(PressMaterial.name)
    private pressMaterialModel: Model<PressMaterialDocument>,
  ) {}

  async trackDownload(
    materialId: string,
    ipAddress: string,
    userAgent: string,
    userId?: string,
  ): Promise<void> {
    try {
      // Create download log
      await this.downloadLogModel.create({
        materialId: new Types.ObjectId(materialId),
        ipAddress,
        userAgent,
        userId,
        downloadedAt: new Date(),
      });

      // Increment download count on the material
      await this.pressMaterialModel.findByIdAndUpdate(
        materialId,
        { $inc: { downloadCount: 1 } },
        { new: false },
      );
    } catch (error) {
      console.error('Error tracking download:', error);
      // Don't throw error - we don't want download tracking failure to prevent download
    }
  }

  async getDownloadStatistics(materialId: string, days = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await this.downloadLogModel.aggregate([
      {
        $match: {
          materialId: new Types.ObjectId(materialId),
          downloadedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$downloadedAt',
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const totalDownloads = await this.downloadLogModel.countDocuments({
      materialId: new Types.ObjectId(materialId),
    });

    const uniqueIPs = await this.downloadLogModel.distinct('ipAddress', {
      materialId: new Types.ObjectId(materialId),
    });

    return {
      totalDownloads,
      uniqueVisitors: uniqueIPs.length,
      dailyStats: stats,
      period: `${days} days`,
    };
  }

  async getTopDownloadedMaterials(limit = 10): Promise<any[]> {
    return this.pressMaterialModel
      .find({ status: 'published' })
      .sort({ downloadCount: -1 })
      .limit(limit)
      .select('title type downloadCount thumbnailUrl')
      .lean();
  }
}
