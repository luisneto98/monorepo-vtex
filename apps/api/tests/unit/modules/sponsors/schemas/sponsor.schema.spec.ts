import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, Model } from 'mongoose';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import {
  Sponsor,
  SponsorSchema,
  SponsorDocument,
} from '@api/modules/sponsors/schemas/sponsor.schema';
import { SponsorTier, SponsorTierSchema } from '@api/modules/sponsors/schemas/sponsor-tier.schema';

describe('SponsorSchema', () => {
  let mongod: MongoMemoryServer;
  let connection: Connection;
  let sponsorModel: Model<SponsorDocument>;
  let module: TestingModule;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([
          { name: Sponsor.name, schema: SponsorSchema },
          { name: SponsorTier.name, schema: SponsorTierSchema },
        ]),
      ],
    }).compile();

    connection = module.get<Connection>(getConnectionToken());
    sponsorModel = module.get<Model<SponsorDocument>>(getModelToken(Sponsor.name));
  });

  afterAll(async () => {
    await connection.close();
    await mongod.stop();
  });

  afterEach(async () => {
    await sponsorModel.deleteMany({});
  });

  describe('Validation', () => {
    it('should enforce required fields', async () => {
      const sponsor = new sponsorModel({});
      await expect(sponsor.save()).rejects.toThrow();
    });

    it('should validate slug format', async () => {
      const invalidSlug = new sponsorModel({
        name: 'Test Sponsor',
        slug: 'Invalid Slug!',
        description: { 'pt-BR': 'Test', en: 'Test' },
        logoUrl: 'https://example.com/logo.png',
        tier: '507f1f77bcf86cd799439011',
        orderInTier: 1,
        websiteUrl: 'https://example.com',
        adminEmail: 'admin@example.com',
      });

      await expect(invalidSlug.save()).rejects.toThrow();

      const validSlug = new sponsorModel({
        name: 'Test Sponsor',
        slug: 'test-sponsor',
        description: { 'pt-BR': 'Test', en: 'Test' },
        logoUrl: 'https://example.com/logo.png',
        tier: '507f1f77bcf86cd799439011',
        orderInTier: 1,
        websiteUrl: 'https://example.com',
        adminEmail: 'admin@example.com',
      });

      const saved = await validSlug.save();
      expect(saved.slug).toBe('test-sponsor');
    });

    it('should validate email formats', async () => {
      const invalidEmail = new sponsorModel({
        name: 'Test Sponsor',
        slug: 'test-sponsor',
        description: { 'pt-BR': 'Test', en: 'Test' },
        logoUrl: 'https://example.com/logo.png',
        tier: '507f1f77bcf86cd799439011',
        orderInTier: 1,
        websiteUrl: 'https://example.com',
        adminEmail: 'invalid-email',
      });

      await expect(invalidEmail.save()).rejects.toThrow();
    });

    it('should validate URL formats', async () => {
      const invalidUrl = new sponsorModel({
        name: 'Test Sponsor',
        slug: 'test-sponsor',
        description: { 'pt-BR': 'Test', en: 'Test' },
        logoUrl: 'not-a-url',
        tier: '507f1f77bcf86cd799439011',
        orderInTier: 1,
        websiteUrl: 'not-a-url',
        adminEmail: 'admin@example.com',
      });

      await expect(invalidUrl.save()).rejects.toThrow();
    });

    it('should validate posts used does not exceed max posts', async () => {
      const invalidPosts = new sponsorModel({
        name: 'Test Sponsor',
        slug: 'test-sponsor',
        description: { 'pt-BR': 'Test', en: 'Test' },
        logoUrl: 'https://example.com/logo.png',
        tier: '507f1f77bcf86cd799439011',
        orderInTier: 1,
        websiteUrl: 'https://example.com',
        adminEmail: 'admin@example.com',
        maxPosts: 5,
        postsUsed: 10,
      });

      await expect(invalidPosts.save()).rejects.toThrow('Posts used cannot exceed max posts limit');
    });
  });

  describe('Middleware', () => {
    it('should normalize fields on save', async () => {
      const sponsor = new sponsorModel({
        name: '  Test Sponsor  ',
        slug: '  TEST-SPONSOR  ',
        description: { 'pt-BR': '  Test PT  ', en: '  Test EN  ' },
        logoUrl: 'https://example.com/logo.png',
        tier: '507f1f77bcf86cd799439011',
        orderInTier: 1,
        websiteUrl: 'https://example.com',
        adminEmail: '  ADMIN@EXAMPLE.COM  ',
        contactEmail: '  CONTACT@EXAMPLE.COM  ',
        standLocation: '  Stand A1  ',
        tags: ['  TAG1  ', '  TAG2  '],
      });

      const saved = await sponsor.save();
      expect(saved.name).toBe('Test Sponsor');
      expect(saved.slug).toBe('test-sponsor');
      expect(saved.adminEmail).toBe('admin@example.com');
      expect(saved.contactEmail).toBe('contact@example.com');
      expect(saved.standLocation).toBe('Stand A1');
      expect(saved.description['pt-BR']).toBe('Test PT');
      expect(saved.description['en']).toBe('Test EN');
      expect(saved.tags).toEqual(['tag1', 'tag2']);
    });
  });

  describe('Virtual Fields', () => {
    it('should calculate posts remaining', async () => {
      const sponsor = new sponsorModel({
        name: 'Test Sponsor',
        slug: 'test-sponsor',
        description: { 'pt-BR': 'Test', en: 'Test' },
        logoUrl: 'https://example.com/logo.png',
        tier: '507f1f77bcf86cd799439011',
        orderInTier: 1,
        websiteUrl: 'https://example.com',
        adminEmail: 'admin@example.com',
        maxPosts: 10,
        postsUsed: 3,
      });

      const saved = await sponsor.save();
      expect(saved.postsRemaining).toBe(7);
      expect(saved.hasReachedPostLimit).toBe(false);
    });

    it('should detect when post limit is reached', async () => {
      const sponsor = new sponsorModel({
        name: 'Test Sponsor',
        slug: 'test-sponsor',
        description: { 'pt-BR': 'Test', en: 'Test' },
        logoUrl: 'https://example.com/logo.png',
        tier: '507f1f77bcf86cd799439011',
        orderInTier: 1,
        websiteUrl: 'https://example.com',
        adminEmail: 'admin@example.com',
        maxPosts: 5,
        postsUsed: 5,
      });

      const saved = await sponsor.save();
      expect(saved.postsRemaining).toBe(0);
      expect(saved.hasReachedPostLimit).toBe(true);
    });
  });

  describe('Schema Methods', () => {
    it('should get localized description', async () => {
      const sponsor = new sponsorModel({
        name: 'Test Sponsor',
        slug: 'test-sponsor',
        description: {
          'pt-BR': 'Descrição em português',
          en: 'Description in English',
        },
        logoUrl: 'https://example.com/logo.png',
        tier: '507f1f77bcf86cd799439011',
        orderInTier: 1,
        websiteUrl: 'https://example.com',
        adminEmail: 'admin@example.com',
      });

      const saved = await sponsor.save();
      expect(saved.getLocalizedDescription('pt-BR')).toBe('Descrição em português');
      expect(saved.getLocalizedDescription('en')).toBe('Description in English');
    });

    it('should check if can create post', async () => {
      const sponsor = new sponsorModel({
        name: 'Test Sponsor',
        slug: 'test-sponsor',
        description: { 'pt-BR': 'Test', en: 'Test' },
        logoUrl: 'https://example.com/logo.png',
        tier: '507f1f77bcf86cd799439011',
        orderInTier: 1,
        websiteUrl: 'https://example.com',
        adminEmail: 'admin@example.com',
        maxPosts: 5,
        postsUsed: 3,
      });

      const saved = await sponsor.save();
      expect(saved.canCreatePost()).toBe(true);

      saved.postsUsed = 5;
      await saved.save();
      expect(saved.canCreatePost()).toBe(false);
    });

    it('should increment post count', async () => {
      const sponsor = new sponsorModel({
        name: 'Test Sponsor',
        slug: 'test-sponsor',
        description: { 'pt-BR': 'Test', en: 'Test' },
        logoUrl: 'https://example.com/logo.png',
        tier: '507f1f77bcf86cd799439011',
        orderInTier: 1,
        websiteUrl: 'https://example.com',
        adminEmail: 'admin@example.com',
        postsUsed: 3,
      });

      const saved = await sponsor.save();
      expect(saved.postsUsed).toBe(3);

      saved.incrementPostCount();
      expect(saved.postsUsed).toBe(4);
    });
  });

  describe('Indexes', () => {
    it('should have proper indexes', async () => {
      const indexes = await sponsorModel.collection.getIndexes();

      expect(indexes).toHaveProperty('tier_1_orderInTier_1');
      expect(indexes).toHaveProperty('slug_1');
      expect(indexes).toHaveProperty('isVisible_1');
    });

    it('should enforce unique constraints', async () => {
      const sponsor1 = new sponsorModel({
        name: 'Sponsor 1',
        slug: 'unique-slug',
        description: { 'pt-BR': 'Test', en: 'Test' },
        logoUrl: 'https://example.com/logo.png',
        tier: '507f1f77bcf86cd799439011',
        orderInTier: 1,
        websiteUrl: 'https://example.com',
        adminEmail: 'admin@example.com',
      });

      await sponsor1.save();

      const sponsor2 = new sponsorModel({
        name: 'Sponsor 2',
        slug: 'unique-slug',
        description: { 'pt-BR': 'Test', en: 'Test' },
        logoUrl: 'https://example.com/logo.png',
        tier: '507f1f77bcf86cd799439011',
        orderInTier: 2,
        websiteUrl: 'https://example.com',
        adminEmail: 'admin2@example.com',
      });

      await expect(sponsor2.save()).rejects.toThrow();
    });
  });
});
