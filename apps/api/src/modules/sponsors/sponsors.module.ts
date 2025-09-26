import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SponsorsController } from './sponsors.controller';
import { SponsorsService } from './sponsors.service';
import { Sponsor, SponsorSchema } from './schemas/sponsor.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Sponsor.name, schema: SponsorSchema }])],
  controllers: [SponsorsController],
  providers: [SponsorsService],
  exports: [SponsorsService],
})
export class SponsorsModule {}
