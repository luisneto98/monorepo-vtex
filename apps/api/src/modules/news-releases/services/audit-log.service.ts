import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NewsReleaseAuditLog, NewsReleaseAuditLogDocument } from '../schemas/audit-log.schema';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectModel(NewsReleaseAuditLog.name)
    private auditLogModel: Model<NewsReleaseAuditLogDocument>,
  ) {}

  async logAction(data: {
    entityId: string;
    action: 'create' | 'update' | 'delete' | 'publish' | 'archive' | 'restore';
    performedBy: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
    changes?: Record<string, any>;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<NewsReleaseAuditLogDocument> {
    const auditLog = new this.auditLogModel({
      ...data,
      entityType: 'news-release',
    });
    return auditLog.save();
  }

  async getAuditLogs(entityId: string, limit: number = 50): Promise<NewsReleaseAuditLogDocument[]> {
    return this.auditLogModel.find({ entityId }).sort({ timestamp: -1 }).limit(limit).exec();
  }

  async getUserActivity(
    userId: string,
    limit: number = 50,
  ): Promise<NewsReleaseAuditLogDocument[]> {
    return this.auditLogModel
      .find({ 'performedBy.id': userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }
}
