import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { FaqService } from '../../../../../src/modules/faq/faq.service';
import { Faq } from '../../../../../src/modules/faq/schemas/faq.schema';
import { FaqCategory } from '../../../../../src/modules/faq/schemas/faq-category.schema';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('FaqService', () => {
  let service: FaqService;

  const mockFaqCategory = {
    _id: '507f1f77bcf86cd799439015',
    name: {
      'pt-BR': 'Geral',
      en: 'General',
    },
    description: {
      'pt-BR': 'Perguntas gerais sobre o evento',
      en: 'General questions about the event',
    },
    priority: 1,
    isVisible: true,
    save: jest.fn().mockResolvedValue(this),
  };

  const mockFaq = {
    _id: '507f1f77bcf86cd799439016',
    question: {
      'pt-BR': 'Como comprar ingressos?',
      en: 'How to buy tickets?',
    },
    answer: {
      'pt-BR': 'Você pode comprar ingressos através do nosso site oficial.',
      en: 'You can buy tickets through our official website.',
    },
    category: mockFaqCategory._id,
    priority: 100,
    isVisible: true,
    viewCount: 0,
    tags: ['tickets', 'purchase'],
    deletedAt: null,
    save: jest.fn().mockResolvedValue(this),
  };

  const mockFaqModel = jest.fn().mockImplementation((dto) => ({
    ...mockFaq,
    ...dto,
    save: jest.fn().mockResolvedValue({ ...mockFaq, ...dto }),
  })) as any;

  const mockFaqCategoryModel = jest.fn().mockImplementation((dto) => ({
    ...mockFaqCategory,
    ...dto,
    save: jest.fn().mockResolvedValue({ ...mockFaqCategory, ...dto }),
  })) as any;

  mockFaqModel.findOne = jest.fn();
  mockFaqModel.find = jest.fn();
  mockFaqModel.countDocuments = jest.fn();
  mockFaqModel.create = jest.fn();

  mockFaqCategoryModel.findOne = jest.fn();
  mockFaqCategoryModel.find = jest.fn();
  mockFaqCategoryModel.countDocuments = jest.fn();
  mockFaqCategoryModel.create = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FaqService,
        {
          provide: getModelToken(Faq.name),
          useValue: mockFaqModel,
        },
        {
          provide: getModelToken(FaqCategory.name),
          useValue: mockFaqCategoryModel,
        },
      ],
    }).compile();

    service = module.get<FaqService>(FaqService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new FAQ', async () => {
      const createDto = {
        question: {
          'pt-BR': 'Nova pergunta?',
          en: 'New question?',
        },
        answer: {
          'pt-BR': 'Nova resposta.',
          en: 'New answer.',
        },
        category: mockFaqCategory._id,
        order: 1,
        tags: ['new', 'test'],
      };

      mockFaqCategoryModel.findOne.mockResolvedValue(mockFaqCategory);

      const result = await service.createFaq(createDto);

      expect(mockFaqCategoryModel.findOne).toHaveBeenCalledWith({
        _id: createDto.category,
        isVisible: true,
      });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if category not found', async () => {
      const createDto = {
        question: {
          'pt-BR': 'Nova pergunta?',
          en: 'New question?',
        },
        answer: {
          'pt-BR': 'Nova resposta.',
          en: 'New answer.',
        },
        category: 'nonexistent-category-id',
        order: 1,
        tags: ['new', 'test'],
      };

      mockFaqCategoryModel.findOne.mockResolvedValue(null);

      await expect(service.createFaq(createDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated FAQs', async () => {
      const filterDto = {
        page: 1,
        limit: 10,
        sort: '-priority',
      };

      const faqs = [mockFaq];
      mockFaqModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(faqs),
      });
      mockFaqModel.countDocuments.mockResolvedValue(1);

      const result = await service.findAllFaqs(filterDto);

      expect(result).toEqual({
        success: true,
        data: faqs,
        metadata: {
          total: 1,
          page: 1,
          limit: 10,
          hasNext: false,
          hasPrev: false,
        },
      });
    });

    it('should apply category filter correctly', async () => {
      const filterDto = {
        page: 1,
        limit: 20,
        category: mockFaqCategory._id,
        search: 'ingresso',
      };

      mockFaqModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });
      mockFaqModel.countDocuments.mockResolvedValue(0);

      await service.findAllFaqs(filterDto);

      expect(mockFaqModel.find).toHaveBeenCalledWith({
        deletedAt: null,
        category: mockFaqCategory._id,
        $or: [
          { 'question.pt-BR': { $regex: 'ingresso', $options: 'i' } },
          { 'question.en': { $regex: 'ingresso', $options: 'i' } },
          { 'answer.pt-BR': { $regex: 'ingresso', $options: 'i' } },
          { 'answer.en': { $regex: 'ingresso', $options: 'i' } },
          { tags: { $in: ['ingresso'] } },
        ],
      });
    });
  });

  describe('findById', () => {
    it('should return an FAQ by id and increment view count', async () => {
      const faqWithSave = {
        ...mockFaq,
        viewCount: 0,
        save: jest.fn().mockResolvedValue({ ...mockFaq, viewCount: 1 }),
      };

      mockFaqModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(faqWithSave),
      });

      const result = await service.findFaqById('507f1f77bcf86cd799439016');

      expect(result.viewCount).toBe(1);
      expect(faqWithSave.save).toHaveBeenCalled();
      expect(mockFaqModel.findOne).toHaveBeenCalledWith({
        _id: '507f1f77bcf86cd799439016',
        deletedAt: null,
      });
    });

    it('should throw NotFoundException if FAQ not found', async () => {
      mockFaqModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findFaqById('507f1f77bcf86cd799439016')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update an FAQ', async () => {
      const updateDto = {
        order: 2,
        isVisible: false,
      };

      const existingFaq = {
        ...mockFaq,
        save: jest.fn().mockResolvedValue({ ...mockFaq, ...updateDto }),
      };

      mockFaqModel.findOne.mockResolvedValue(existingFaq);

      const result = await service.updateFaq('507f1f77bcf86cd799439016', updateDto);

      expect(result).toBeDefined();
      expect(existingFaq.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if FAQ not found', async () => {
      mockFaqModel.findOne.mockResolvedValue(null);

      await expect(service.updateFaq('507f1f77bcf86cd799439016', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete an FAQ', async () => {
      const faq = {
        ...mockFaq,
        deletedAt: null as any,
        deleteReason: null as any,
        deletedBy: null as any,
        save: jest.fn().mockResolvedValue(mockFaq),
      };

      mockFaqModel.findOne.mockResolvedValue(faq);

      await service.removeFaq('507f1f77bcf86cd799439016', 'Test reason', 'userId');

      expect(faq.deletedAt).toBeDefined();
      expect(faq.deleteReason).toBe('Test reason');
      expect(faq.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if FAQ not found', async () => {
      mockFaqModel.findOne.mockResolvedValue(null);

      await expect(service.removeFaq('507f1f77bcf86cd799439016')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('restore', () => {
    it('should restore a soft-deleted FAQ', async () => {
      const deletedFaq = {
        ...mockFaq,
        deletedAt: new Date(),
        deletedBy: 'userId',
        deleteReason: 'Test',
        save: jest.fn().mockResolvedValue(mockFaq),
      };

      mockFaqModel.findOne.mockResolvedValue(deletedFaq);

      await service.restoreFaq('507f1f77bcf86cd799439016');

      expect(deletedFaq.deletedAt).toBeNull();
      expect(deletedFaq.deletedBy).toBeNull();
      expect(deletedFaq.deleteReason).toBeNull();
      expect(deletedFaq.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if deleted FAQ not found', async () => {
      mockFaqModel.findOne.mockResolvedValue(null);

      await expect(service.restoreFaq('507f1f77bcf86cd799439016')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('FaqCategory CRUD', () => {
    describe('createCategory', () => {
      it('should create a new FAQ category', async () => {
        const createCategoryDto = {
          name: {
            'pt-BR': 'Palestrantes',
            en: 'Speakers',
          },
          description: {
            'pt-BR': 'Perguntas sobre palestrantes',
            en: 'Questions about speakers',
          },
          priority: 2,
        };

        mockFaqCategoryModel.findOne.mockResolvedValue(null);

        const result = await service.createCategory(createCategoryDto);

        expect(mockFaqCategoryModel.findOne).toHaveBeenCalledWith({
          'name.pt-BR': createCategoryDto.name['pt-BR'],
        });
        expect(result).toBeDefined();
      });

      it('should throw ConflictException if category already exists', async () => {
        const createCategoryDto = {
          name: {
            'pt-BR': 'Geral',
            en: 'General',
          },
          description: {
            'pt-BR': 'Categoria existente',
            en: 'Existing category',
          },
          priority: 1,
        };

        mockFaqCategoryModel.findOne.mockResolvedValue(mockFaqCategory);

        await expect(service.createCategory(createCategoryDto)).rejects.toThrow(ConflictException);
      });
    });

    describe('findAllCategories', () => {
      it('should return all FAQ categories', async () => {
        const categories = [mockFaqCategory];

        mockFaqCategoryModel.find.mockReturnValue({
          sort: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue(categories),
        });

        const result = await service.findAllCategories();

        expect(result).toEqual(categories);
        expect(mockFaqCategoryModel.find).toHaveBeenCalledWith({ isVisible: true });
      });
    });

    describe('updateCategory', () => {
      it('should update an FAQ category', async () => {
        const updateCategoryDto = {
          priority: 5,
        };

        const existingCategory = {
          ...mockFaqCategory,
          save: jest.fn().mockResolvedValue({ ...mockFaqCategory, ...updateCategoryDto }),
        };

        mockFaqCategoryModel.findOne.mockResolvedValue(existingCategory);

        const result = await service.updateCategory('507f1f77bcf86cd799439015', updateCategoryDto);

        expect(result).toBeDefined();
        expect(existingCategory.save).toHaveBeenCalled();
      });

      it('should throw NotFoundException if category not found', async () => {
        mockFaqCategoryModel.findOne.mockResolvedValue(null);

        await expect(service.updateCategory('507f1f77bcf86cd799439015', {})).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('deleteCategory', () => {
      it('should delete an FAQ category', async () => {
        const category = {
          ...mockFaqCategory,
          isVisible: true,
          save: jest.fn().mockResolvedValue({ ...mockFaqCategory, isVisible: false }),
        };

        mockFaqCategoryModel.findOne.mockResolvedValue(category);
        mockFaqModel.countDocuments.mockResolvedValue(0);

        await service.removeCategory('507f1f77bcf86cd799439015');

        expect(category.isVisible).toBe(false);
        expect(category.save).toHaveBeenCalled();
      });

      it('should throw ConflictException if category has FAQs', async () => {
        mockFaqCategoryModel.findOne.mockResolvedValue(mockFaqCategory);
        mockFaqModel.countDocuments.mockResolvedValue(1);

        await expect(service.removeCategory('507f1f77bcf86cd799439015')).rejects.toThrow(
          ConflictException,
        );
      });
    });
  });
});
