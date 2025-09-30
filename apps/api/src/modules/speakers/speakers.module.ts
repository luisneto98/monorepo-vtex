import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SpeakersController } from './speakers.controller';
import { SpeakersService } from './speakers.service';
import { Speaker, SpeakerSchema } from './schemas/speaker.schema';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Speaker.name, schema: SpeakerSchema }]),
    StorageModule,
  ],
  controllers: [SpeakersController],
  providers: [SpeakersService],
  exports: [SpeakersService],
})
export class SpeakersModule {}
