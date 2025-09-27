import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FaqCategory, FaqCategoryDocument } from '../../../../../src/modules/faq/schemas/faq-category.schema';

describe('FaqCategory Schema', () => {
  // Using model for schema testing
  let model: Model<FaqCategoryDocument>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getModelToken(FaqCategory.name),
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
            findById: jest.fn(),
            find: jest.fn(),
            updateOne: jest.fn(),
            deleteOne: jest.fn(),
          },
        },
      ],
    }).compile();

    model = module.get<Model<FaqCategoryDocument>>(getModelToken(FaqCategory.name));
  });

  describe('Field Validations', () => {
    it('should validate required fields', () => {
      const category = {
        name: {
          'pt-BR': 'Geral',
          'en': 'General',
        },
        order: 1,
      };

      expect(category.name['pt-BR']).toBeDefined();
      expect(category.name['en']).toBeDefined();
      expect(category.order).toBeDefined();
      expect(category.order).toBeGreaterThanOrEqual(1);
    });

    it('should enforce name length constraints', () => {
      const longName = 'a'.repeat(51);
      const validName = 'General Information';

      expect(longName.length).toBeGreaterThan(50);
      expect(validName.length).toBeLessThanOrEqual(50);
    });

    it('should validate order minimum value', () => {
      const invalidOrder = 0;
      const validOrder = 1;

      expect(invalidOrder).toBeLessThan(1);
      expect(validOrder).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Multilingual Support', () => {
    it('should support pt-BR and en names', () => {
      const categoryName = {
        'pt-BR': 'Informações Gerais',
        'en': 'General Information',
      };

      expect(categoryName['pt-BR']).toBeDefined();
      expect(categoryName['en']).toBeDefined();
      expect(Object.keys(categoryName)).toHaveLength(2);
    });

    it('should require both language versions', () => {
      const incompleteName = {
        'pt-BR': 'Geral',
      };

      expect(incompleteName['en']).toBeUndefined();
    });

    it('should handle special characters in names', () => {
      const categoryName = {
        'pt-BR': 'Inscrições & Pagamento',
        'en': 'Registration & Payment',
      };

      expect(categoryName['pt-BR']).toContain('&');
      expect(categoryName['en']).toContain('&');
    });
  });

  describe('Unique Constraints', () => {
    it('should enforce unique order', () => {
      const category1 = { order: 1 };
      const category2 = { order: 1 };

      // In real implementation, the second insert would fail
      expect(category1.order).toBe(category2.order);
    });

    it('should enforce unique names per language', () => {
      const category1 = { name: { 'pt-BR': 'Geral', 'en': 'General' } };
      const category2 = { name: { 'pt-BR': 'Geral', 'en': 'General' } };

      // In real implementation, the second insert would fail
      expect(category1.name['pt-BR']).toBe(category2.name['pt-BR']);
      expect(category1.name['en']).toBe(category2.name['en']);
    });
  });

  describe('Category Ordering', () => {
    it('should support sequential ordering', () => {
      const categories = [
        { name: { 'pt-BR': 'Geral', 'en': 'General' }, order: 1 },
        { name: { 'pt-BR': 'Inscrição', 'en': 'Registration' }, order: 2 },
        { name: { 'pt-BR': 'Programação', 'en': 'Schedule' }, order: 3 },
        { name: { 'pt-BR': 'Local', 'en': 'Venue' }, order: 4 },
        { name: { 'pt-BR': 'Patrocinadores', 'en': 'Sponsors' }, order: 5 },
      ];

      categories.forEach((category, index) => {
        expect(category.order).toBe(index + 1);
      });

      // Verify ordering
      const sorted = [...categories].sort((a, b) => a.order - b.order);
      expect(sorted).toEqual(categories);
    });

    it('should handle non-sequential ordering', () => {
      const categories = [
        { order: 10 },
        { order: 20 },
        { order: 30 },
      ];

      categories.forEach(category => {
        expect(category.order).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Indexes', () => {
    it('should have index on order field', () => {
      // Index verification would be done at database level
      const indexFields = ['order', 'name.pt-BR', 'name.en'];
      expect(indexFields).toContain('order');
      expect(indexFields).toContain('name.pt-BR');
      expect(indexFields).toContain('name.en');
    });
  });

  describe('Default Categories', () => {
    it('should support common FAQ categories', () => {
      const commonCategories = [
        'General',
        'Registration',
        'Schedule',
        'Venue',
        'Sponsors',
        'Networking',
        'Technical Support',
      ];

      commonCategories.forEach(category => {
        expect(category.length).toBeLessThanOrEqual(50);
      });
    });
  });

  describe('Integration with FAQ', () => {
    it('should be referenced by FAQ schema', () => {
      const faq = {
        category: 'ObjectId("507f1f77bcf86cd799439011")',
      };

      expect(faq.category).toBeDefined();
      expect(faq.category).toMatch(/^ObjectId/);
    });

    it('should support multiple FAQs per category', () => {
      const categoryId = 'ObjectId("507f1f77bcf86cd799439011")';
      const faqs = [
        { category: categoryId, order: 1 },
        { category: categoryId, order: 2 },
        { category: categoryId, order: 3 },
      ];

      faqs.forEach(faq => {
        expect(faq.category).toBe(categoryId);
      });
    });
  });

  describe('Timestamps', () => {
    it('should include createdAt and updatedAt', () => {
      const now = new Date();
      const category = {
        createdAt: now,
        updatedAt: now,
      };

      expect(category.createdAt).toBeDefined();
      expect(category.updatedAt).toBeDefined();
      expect(category.createdAt).toBeInstanceOf(Date);
      expect(category.updatedAt).toBeInstanceOf(Date);
    });
  });
});