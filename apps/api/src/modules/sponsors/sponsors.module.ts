import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SponsorsController } from './sponsors.controller';
import { SponsorsService } from './sponsors.service';
import { Sponsor, SponsorSchema } from './schemas/sponsor.schema';
import { SponsorTier, SponsorTierSchema } from './schemas/sponsor-tier.schema';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Sponsor.name, schema: SponsorSchema },
      { name: SponsorTier.name, schema: SponsorTierSchema },
    ]),
    StorageModule,
  ],
  controllers: [SponsorsController],
  providers: [SponsorsService],
  exports: [SponsorsService],
})
export class SponsorsModule {}
