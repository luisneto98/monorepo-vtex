import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NewsRelease, NewsReleaseDocument } from '../schemas/news-release.schema';
import { NewsReleaseStatus } from '@vtexday26/shared';
import * as cron from 'node-cron';

@Injectable()
export class PublicationSchedulerService implements OnModuleInit, OnModuleDestroy {
  private scheduledTask: cron.ScheduledTask;

  constructor(
    @InjectModel(NewsRelease.name)
    private newsReleaseModel: Model<NewsReleaseDocument>,
  ) {}

  onModuleInit() {
    this.scheduledTask = cron.schedule('*/1 * * * *', () => {
      this.checkAndPublishScheduledReleases();
    });
  }

  onModuleDestroy() {
    if (this.scheduledTask) {
      this.scheduledTask.stop();
    }
  }

  async checkAndPublishScheduledReleases(): Promise<void> {
    try {
      const now = new Date();

      const scheduledReleases = await this.newsReleaseModel.find({
        status: NewsReleaseStatus.SCHEDULED,
        scheduledFor: { $lte: now },
        isDeleted: false,
      });

      for (const release of scheduledReleases) {
        await this.newsReleaseModel.findByIdAndUpdate(release._id, {
          status: NewsReleaseStatus.PUBLISHED,
          publishedAt: now,
          $inc: { version: 1 },
        });

        console.log(`Published scheduled news release: ${release.slug}`);
      }
    } catch (error) {
      console.error('Error checking scheduled releases:', error);
    }
  }

  async schedulePublication(releaseId: string, scheduledFor: Date): Promise<NewsReleaseDocument> {
    return this.newsReleaseModel.findByIdAndUpdate(
      releaseId,
      {
        status: NewsReleaseStatus.SCHEDULED,
        scheduledFor,
        $inc: { version: 1 },
      },
      { new: true },
    );
  }

  async cancelScheduledPublication(releaseId: string): Promise<NewsReleaseDocument> {
    return this.newsReleaseModel.findByIdAndUpdate(
      releaseId,
      {
        status: NewsReleaseStatus.DRAFT,
        $unset: { scheduledFor: 1 },
        $inc: { version: 1 },
      },
      { new: true },
    );
  }
}
