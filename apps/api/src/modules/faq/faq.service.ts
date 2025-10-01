import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Schema as MongooseSchema } from 'mongoose';
import { Faq, FaqDocument } from './schemas/faq.schema';
import { FaqCategory, FaqCategoryDocument } from './schemas/faq-category.schema';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { FaqFilterDto } from './dto/faq-filter.dto';
import { CreateFaqCategoryDto } from './dto/create-faq-category.dto';
import { UpdateFaqCategoryDto } from './dto/update-faq-category.dto';
import { PaginatedResponse } from '@common/dto/pagination.dto';
import { FAQ_CONSTANTS } from './faq.constants';

@Injectable()
export class FaqService {
  constructor(
    @InjectModel(Faq.name) private faqModel: Model<FaqDocument>,
    @InjectModel(FaqCategory.name) private faqCategoryModel: Model<FaqCategoryDocument>,
  ) {}

  // FAQ CRUD
  async createFaq(createFaqDto: CreateFaqDto): Promise<FaqDocument> {
    // Verify category exists
    const category = await this.faqCategoryModel.findById(createFaqDto.category);
    if (!category) {
      throw new NotFoundException(`FAQ category with ID ${createFaqDto.category} not found`);
    }

    // Auto-generate order if not provided
    if (createFaqDto.order === undefined) {
      const maxOrderFaq = await this.faqModel
        .findOne({
          category: createFaqDto.category,
          deletedAt: null,
        })
        .sort({ order: -1 })
        .exec();

      createFaqDto.order = maxOrderFaq ? maxOrderFaq.order + 1 : 0;
    } else {
      // Check for order conflicts within the category if order is provided
      const existingFaq = await this.faqModel.findOne({
        category: createFaqDto.category,
        order: createFaqDto.order,
        deletedAt: null,
      });

      if (existingFaq) {
        throw new ConflictException('Another FAQ with this order already exists in this category');
      }
    }

    const createdFaq = new this.faqModel(createFaqDto);
    return createdFaq.save();
  }

  async findAllFaqs(filterDto: FaqFilterDto): Promise<PaginatedResponse<FaqDocument>> {
    const { page = 1, limit = 20, sort, search, category, isVisible, lang } = filterDto;

    const query: any = { deletedAt: null };

    if (search) {
      const searchFields = ['question.pt-BR', 'question.en', 'answer.pt-BR', 'answer.en'];
      if (lang) {
        // If language specified, prioritize search in that language
        const langFields = [`question.${lang}`, `answer.${lang}`];
        query.$or = [
          ...langFields.map((field) => ({ [field]: { $regex: search, $options: 'i' } })),
          ...searchFields.map((field) => ({ [field]: { $regex: search, $options: 'i' } })),
        ];
      } else {
        query.$or = searchFields.map((field) => ({ [field]: { $regex: search, $options: 'i' } }));
      }
    }

    if (category) {
      query.category = category;
    }

    if (typeof isVisible !== 'undefined') {
      query.isVisible = isVisible;
    }

    const skip = (page - 1) * limit;

    let sortOptions: any = { 'category.order': 1, order: 1 };
    if (sort) {
      sortOptions = {};
      const sortFields = sort.split(',');
      for (const field of sortFields) {
        if (field.startsWith('-')) {
          sortOptions[field.substring(1)] = -1;
        } else {
          sortOptions[field] = 1;
        }
      }
    }

    const [data, total] = await Promise.all([
      this.faqModel
        .find(query)
        .populate('category')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.faqModel.countDocuments(query),
    ]);

    return {
      success: true,
      data,
      metadata: {
        total,
        page,
        limit,
        hasNext: skip + data.length < total,
        hasPrev: page > 1,
      },
    };
  }

  async findFaqById(id: string): Promise<FaqDocument> {
    // Use atomic operation to increment view count and return updated document
    const faq = await this.faqModel
      .findOneAndUpdate(
        {
          _id: id,
          deletedAt: null,
        },
        {
          $inc: { viewCount: 1 },
        },
        {
          new: true, // Return the updated document
        },
      )
      .populate('category')
      .exec();

    if (!faq) {
      throw new NotFoundException(`FAQ with ID ${id} not found`);
    }

    return faq;
  }

  async findPopularFaqs(
    limit: number = FAQ_CONSTANTS.DEFAULT_POPULAR_LIMIT,
  ): Promise<FaqDocument[]> {
    return this.faqModel
      .find({
        isVisible: true,
        deletedAt: null,
      })
      .populate('category')
      .sort({ viewCount: -1 })
      .limit(limit)
      .exec();
  }

  async updateFaq(id: string, updateFaqDto: UpdateFaqDto): Promise<FaqDocument> {
    const faq = await this.faqModel.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!faq) {
      throw new NotFoundException(`FAQ with ID ${id} not found`);
    }

    // Check category exists if being updated
    if (updateFaqDto.category) {
      const category = await this.faqCategoryModel.findById(updateFaqDto.category);
      if (!category) {
        throw new NotFoundException(`FAQ category with ID ${updateFaqDto.category} not found`);
      }
    }

    // Check for order conflicts if category or order is being updated
    if (updateFaqDto.category || updateFaqDto.order !== undefined) {
      const categoryId = updateFaqDto.category || faq.category;
      const order = updateFaqDto.order !== undefined ? updateFaqDto.order : faq.order;

      const existingFaq = await this.faqModel.findOne({
        _id: { $ne: id },
        category: categoryId,
        order: order,
        deletedAt: null,
      });

      if (existingFaq) {
        throw new ConflictException('Another FAQ with this order already exists in this category');
      }
    }

    // Use findByIdAndUpdate to perform partial update without triggering validation on unchanged required fields
    const updatedFaq = await this.faqModel.findByIdAndUpdate(
      id,
      { $set: updateFaqDto },
      { new: true, runValidators: false },
    );

    return updatedFaq;
  }

  async removeFaq(id: string, reason?: string, userId?: string): Promise<void> {
    const faq = await this.faqModel.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!faq) {
      throw new NotFoundException(`FAQ with ID ${id} not found`);
    }

    faq.deletedAt = new Date();
    faq.deleteReason = reason;

    if (userId) {
      faq.deletedBy = new MongooseSchema.Types.ObjectId(userId);
    }

    await faq.save();
  }

  async restoreFaq(id: string): Promise<FaqDocument> {
    const faq = await this.faqModel.findOne({
      _id: id,
      deletedAt: { $ne: null },
    });

    if (!faq) {
      throw new NotFoundException(`Deleted FAQ with ID ${id} not found`);
    }

    faq.deletedAt = null;
    faq.deletedBy = null;
    faq.deleteReason = null;

    return faq.save();
  }

  // FAQ Category CRUD
  async createCategory(createCategoryDto: CreateFaqCategoryDto): Promise<FaqCategoryDocument> {
    const existingCategory = await this.faqCategoryModel.findOne({
      $or: [
        { 'name.pt-BR': createCategoryDto.name['pt-BR'] },
        { 'name.en': createCategoryDto.name.en },
        { order: createCategoryDto.order },
      ],
    });

    if (existingCategory) {
      throw new ConflictException('Category with this name or order already exists');
    }

    const createdCategory = new this.faqCategoryModel(createCategoryDto);
    return createdCategory.save();
  }

  async findAllCategories(): Promise<FaqCategoryDocument[]> {
    return this.faqCategoryModel.find().sort({ order: 1 }).exec();
  }

  async findCategoryById(id: string): Promise<FaqCategoryDocument> {
    const category = await this.faqCategoryModel.findById(id);
    if (!category) {
      throw new NotFoundException(`FAQ category with ID ${id} not found`);
    }
    return category;
  }

  async updateCategory(
    id: string,
    updateCategoryDto: UpdateFaqCategoryDto,
  ): Promise<FaqCategoryDocument> {
    const category = await this.faqCategoryModel.findById(id);
    if (!category) {
      throw new NotFoundException(`FAQ category with ID ${id} not found`);
    }

    // Check for name conflicts if name is being updated
    if (updateCategoryDto.name) {
      const nameConflict = await this.faqCategoryModel.findOne({
        _id: { $ne: id },
        $or: [
          { 'name.pt-BR': updateCategoryDto.name['pt-BR'] },
          { 'name.en': updateCategoryDto.name.en },
        ],
      });

      if (nameConflict) {
        throw new ConflictException('Another category with this name already exists');
      }
    }

    // Handle order reordering if order is being updated
    if (updateCategoryDto.order !== undefined && updateCategoryDto.order !== category.order) {
      const oldOrder = category.order;
      const newOrder = updateCategoryDto.order;

      // Check if the new order position exists
      const targetCategory = await this.faqCategoryModel.findOne({
        _id: { $ne: id },
        order: newOrder,
      });

      if (targetCategory) {
        // Use a temporary negative value to avoid unique constraint violation during swap
        const tempOrder = -1 - Date.now(); // Guaranteed unique temporary value

        // Step 1: Move current category to temporary value
        await this.faqCategoryModel.findByIdAndUpdate(id, {
          $set: { order: tempOrder },
        });

        // Step 2: Move target category to old position
        await this.faqCategoryModel.findByIdAndUpdate(targetCategory._id, {
          $set: { order: oldOrder },
        });

        // Step 3: Move current category to new position
        await this.faqCategoryModel.findByIdAndUpdate(id, {
          $set: { order: newOrder },
        });

        // If there are other fields to update, apply them now
        if (updateCategoryDto.name) {
          const updatedCategory = await this.faqCategoryModel.findByIdAndUpdate(
            id,
            { $set: { name: updateCategoryDto.name } },
            { new: true, runValidators: false },
          );
          return updatedCategory;
        }

        // Return the updated category
        return this.faqCategoryModel.findById(id);
      }
    }

    // Use findByIdAndUpdate to perform partial update without triggering validation on unchanged required fields
    const updatedCategory = await this.faqCategoryModel.findByIdAndUpdate(
      id,
      { $set: updateCategoryDto },
      { new: true, runValidators: false },
    );

    return updatedCategory;
  }

  async removeCategory(id: string): Promise<void> {
    // Check if any FAQs are using this category
    const faqsInCategory = await this.faqModel.findOne({
      category: id,
      deletedAt: null,
    });

    if (faqsInCategory) {
      throw new ConflictException(
        'Cannot delete category: FAQs are still assigned to this category',
      );
    }

    const result = await this.faqCategoryModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      throw new NotFoundException(`FAQ category with ID ${id} not found`);
    }
  }
}
