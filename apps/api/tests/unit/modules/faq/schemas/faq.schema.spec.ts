import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, Model } from 'mongoose';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Faq, FaqSchema, FaqDocument } from '../../../../../src/modules/faq/schemas/faq.schema';
import { FaqCategory, FaqCategorySchema } from '../../../../../src/modules/faq/schemas/faq-category.schema';

describe('FaqSchema', () => {
  let mongod: MongoMemoryServer;
  let connection: Connection;
  let faqModel: Model<FaqDocument>;
  let module: TestingModule;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([
          { name: Faq.name, schema: FaqSchema },
          { name: FaqCategory.name, schema: FaqCategorySchema }
        ]),
      ],
    }).compile();

    connection = module.get<Connection>(getConnectionToken());
    faqModel = module.get<Model<FaqDocument>>(getModelToken(Faq.name));
  });

  afterAll(async () => {
    await connection.close();
    await mongod.stop();
  });

  afterEach(async () => {
    await faqModel.deleteMany({});
  });

  describe('Validation', () => {
    it('should enforce required fields', async () => {
      const faq = new faqModel({});
      await expect(faq.save()).rejects.toThrow();
    });

    it('should validate question length', async () => {
      const longQuestion = new faqModel({
        question: {
          'pt-BR': 'A'.repeat(201),
          'en': 'B'.repeat(201)
        },
        answer: {
          'pt-BR': 'Answer PT',
          'en': 'Answer EN'
        },
        category: '507f1f77bcf86cd799439011',
        order: 1
      });

      await expect(longQuestion.save()).rejects.toThrow();
    });

    it('should validate answer length', async () => {
      const longAnswer = new faqModel({
        question: {
          'pt-BR': 'Question PT',
          'en': 'Question EN'
        },
        answer: {
          'pt-BR': 'A'.repeat(2001),
          'en': 'B'.repeat(2001)
        },
        category: '507f1f77bcf86cd799439011',
        order: 1
      });

      await expect(longAnswer.save()).rejects.toThrow();
    });

    it('should validate order min value', async () => {
      const invalidOrder = new faqModel({
        question: {
          'pt-BR': 'Question PT',
          'en': 'Question EN'
        },
        answer: {
          'pt-BR': 'Answer PT',
          'en': 'Answer EN'
        },
        category: '507f1f77bcf86cd799439011',
        order: 0
      });

      await expect(invalidOrder.save()).rejects.toThrow();
    });
  });

  describe('Middleware', () => {
    it('should trim fields on save', async () => {
      const faq = new faqModel({
        question: {
          'pt-BR': '  Question PT  ',
          'en': '  Question EN  '
        },
        answer: {
          'pt-BR': '  Answer PT  ',
          'en': '  Answer EN  '
        },
        category: '507f1f77bcf86cd799439011',
        order: 1
      });

      const saved = await faq.save();
      expect(saved.question['pt-BR']).toBe('Question PT');
      expect(saved.question['en']).toBe('Question EN');
      expect(saved.answer['pt-BR']).toBe('Answer PT');
      expect(saved.answer['en']).toBe('Answer EN');
    });

    it('should sanitize HTML in answers', async () => {
      const faq = new faqModel({
        question: {
          'pt-BR': 'Question PT',
          'en': 'Question EN'
        },
        answer: {
          'pt-BR': '<p>Valid</p><script>alert("XSS")</script>',
          'en': '<b>Bold</b><img src="x" onerror="alert(1)">'
        },
        category: '507f1f77bcf86cd799439011',
        order: 1
      });

      const saved = await faq.save();
      expect(saved.answer['pt-BR']).not.toContain('<script>');
      expect(saved.answer['pt-BR']).toContain('<p>');
      expect(saved.answer['en']).not.toContain('<img');
      expect(saved.answer['en']).toContain('<b>');
    });
  });

  describe('Default Values', () => {
    it('should set default values', async () => {
      const faq = new faqModel({
        question: {
          'pt-BR': 'Question PT',
          'en': 'Question EN'
        },
        answer: {
          'pt-BR': 'Answer PT',
          'en': 'Answer EN'
        },
        category: '507f1f77bcf86cd799439011',
        order: 1
      });

      const saved = await faq.save();
      expect(saved.viewCount).toBe(0);
      expect(saved.isVisible).toBe(true);
    });
  });

  describe('Virtual Fields', () => {
    it('should get popularity from view count', async () => {
      const faq = new faqModel({
        question: {
          'pt-BR': 'Question PT',
          'en': 'Question EN'
        },
        answer: {
          'pt-BR': 'Answer PT',
          'en': 'Answer EN'
        },
        category: '507f1f77bcf86cd799439011',
        order: 1,
        viewCount: 100
      });

      const saved = await faq.save();
      expect(saved.popularity).toBe(100);
    });
  });

  describe('Schema Methods', () => {
    it('should get localized question and answer', async () => {
      const faq = new faqModel({
        question: {
          'pt-BR': 'Pergunta em português',
          'en': 'Question in English'
        },
        answer: {
          'pt-BR': 'Resposta em português',
          'en': 'Answer in English'
        },
        category: '507f1f77bcf86cd799439011',
        order: 1
      });

      const saved = await faq.save();
      expect(saved.getLocalizedQuestion('pt-BR')).toBe('Pergunta em português');
      expect(saved.getLocalizedQuestion('en')).toBe('Question in English');
      expect(saved.getLocalizedAnswer('pt-BR')).toBe('Resposta em português');
      expect(saved.getLocalizedAnswer('en')).toBe('Answer in English');
    });

    it('should increment view count', async () => {
      const faq = new faqModel({
        question: {
          'pt-BR': 'Question PT',
          'en': 'Question EN'
        },
        answer: {
          'pt-BR': 'Answer PT',
          'en': 'Answer EN'
        },
        category: '507f1f77bcf86cd799439011',
        order: 1
      });

      const saved = await faq.save();
      expect(saved.viewCount).toBe(0);

      saved.incrementViewCount();
      expect(saved.viewCount).toBe(1);

      saved.incrementViewCount();
      expect(saved.viewCount).toBe(2);
    });
  });

  describe('Indexes', () => {
    it('should have proper indexes', async () => {
      const indexes = await faqModel.collection.getIndexes();

      expect(indexes).toHaveProperty('category_1_order_1');
      expect(indexes).toHaveProperty('viewCount_-1');
      expect(indexes).toHaveProperty('isVisible_1');
    });
  });
});