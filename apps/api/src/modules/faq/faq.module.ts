import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FaqController } from './faq.controller';
import { FaqService } from './faq.service';
import { Faq, FaqSchema } from './schemas/faq.schema';
import { FaqCategory, FaqCategorySchema } from './schemas/faq-category.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Faq.name, schema: FaqSchema },
      { name: FaqCategory.name, schema: FaqCategorySchema },
    ]),
  ],
  controllers: [FaqController],
  providers: [FaqService],
  exports: [FaqService],
})
export class FaqModule {}