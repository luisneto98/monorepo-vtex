import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, Model } from 'mongoose';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import {
  Speaker,
  SpeakerSchema,
  SpeakerDocument,
} from '@api/modules/speakers/schemas/speaker.schema';

describe('SpeakerSchema', () => {
  let mongod: MongoMemoryServer;
  let connection: Connection;
  let speakerModel: Model<SpeakerDocument>;
  let module: TestingModule;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([{ name: Speaker.name, schema: SpeakerSchema }]),
      ],
    }).compile();

    connection = module.get<Connection>(getConnectionToken());
    speakerModel = module.get<Model<SpeakerDocument>>(getModelToken(Speaker.name));
  });

  afterAll(async () => {
    await connection.close();
    await mongod.stop();
  });

  afterEach(async () => {
    await speakerModel.deleteMany({});
  });

  describe('Validation', () => {
    it('should enforce required fields', async () => {
      const speaker = new speakerModel({});

      await expect(speaker.save()).rejects.toThrow();
    });

    it('should validate multilingual bio length', async () => {
      const shortBio = new speakerModel({
        name: 'Test Speaker',
        bio: {
          'pt-BR': 'Short bio',
          en: 'Short bio',
        },
        photoUrl: 'https://example.com/photo.jpg',
        company: 'Test Company',
        position: {
          'pt-BR': 'Desenvolvedor',
          en: 'Developer',
        },
      });

      await expect(shortBio.save()).rejects.toThrow();

      const longBio = new speakerModel({
        name: 'Test Speaker 2',
        bio: {
          'pt-BR': 'A'.repeat(501),
          en: 'A'.repeat(501),
        },
        photoUrl: 'https://example.com/photo.jpg',
        company: 'Test Company',
        position: {
          'pt-BR': 'Desenvolvedor',
          en: 'Developer',
        },
      });

      await expect(longBio.save()).rejects.toThrow();
    });

    it('should validate name length', async () => {
      const shortName = new speakerModel({
        name: 'AB',
        bio: {
          'pt-BR': 'A'.repeat(100),
          en: 'A'.repeat(100),
        },
        photoUrl: 'https://example.com/photo.jpg',
        company: 'Test Company',
        position: {
          'pt-BR': 'Desenvolvedor',
          en: 'Developer',
        },
      });

      await expect(shortName.save()).rejects.toThrow();
    });

    it('should validate social links URLs', async () => {
      const invalidUrls = new speakerModel({
        name: 'Test Speaker',
        bio: {
          'pt-BR': 'A'.repeat(100),
          en: 'A'.repeat(100),
        },
        photoUrl: 'https://example.com/photo.jpg',
        company: 'Test Company',
        position: {
          'pt-BR': 'Desenvolvedor',
          en: 'Developer',
        },
        socialLinks: {
          linkedin: 'not-a-url',
          twitter: 'not-a-url',
        },
      });

      await expect(invalidUrls.save()).rejects.toThrow();

      const validUrls = new speakerModel({
        name: 'Test Speaker',
        bio: {
          'pt-BR': 'A'.repeat(100),
          en: 'A'.repeat(100),
        },
        photoUrl: 'https://example.com/photo.jpg',
        company: 'Test Company',
        position: {
          'pt-BR': 'Desenvolvedor',
          en: 'Developer',
        },
        socialLinks: {
          linkedin: 'https://www.linkedin.com/in/johndoe',
          twitter: 'https://twitter.com/johndoe',
          instagram: 'https://www.instagram.com/johndoe',
          github: 'https://github.com/johndoe',
          website: 'https://johndoe.com',
        },
      });

      const saved = await validUrls.save();
      expect(saved.socialLinks.linkedin).toBe('https://www.linkedin.com/in/johndoe');
    });

    it('should validate photoUrl format', async () => {
      const invalidUrl = new speakerModel({
        name: 'Test Speaker',
        bio: {
          'pt-BR': 'A'.repeat(100),
          en: 'A'.repeat(100),
        },
        photoUrl: 'not-a-url',
        company: 'Test Company',
        position: {
          'pt-BR': 'Desenvolvedor',
          en: 'Developer',
        },
      });

      await expect(invalidUrl.save()).rejects.toThrow();
    });
  });

  describe('Middleware', () => {
    it('should trim fields on save', async () => {
      const speaker = new speakerModel({
        name: '  Test Speaker  ',
        bio: {
          'pt-BR': '  ' + 'A'.repeat(100) + '  ',
          en: '  ' + 'B'.repeat(100) + '  ',
        },
        photoUrl: 'https://example.com/photo.jpg',
        company: '  Test Company  ',
        position: {
          'pt-BR': '  Desenvolvedor  ',
          en: '  Developer  ',
        },
      });

      const saved = await speaker.save();
      expect(saved.name).toBe('Test Speaker');
      expect(saved.company).toBe('Test Company');
      expect(saved.bio['pt-BR']).toBe('A'.repeat(100));
      expect(saved.bio['en']).toBe('B'.repeat(100));
      expect(saved.position['pt-BR']).toBe('Desenvolvedor');
      expect(saved.position['en']).toBe('Developer');
    });
  });

  describe('Default Values', () => {
    it('should set default values', async () => {
      const speaker = new speakerModel({
        name: 'Test Speaker',
        bio: {
          'pt-BR': 'A'.repeat(100),
          en: 'B'.repeat(100),
        },
        photoUrl: 'https://example.com/photo.jpg',
        company: 'Test Company',
        position: {
          'pt-BR': 'Desenvolvedor',
          en: 'Developer',
        },
      });

      const saved = await speaker.save();
      expect(saved.priority).toBe(100);
      expect(saved.isHighlight).toBe(false);
      expect(saved.isVisible).toBe(true);
      expect(saved.socialLinks).toEqual({});
    });
  });

  describe('Virtual Fields', () => {
    it('should compute displayPriority', async () => {
      const normalSpeaker = new speakerModel({
        name: 'Normal Speaker',
        bio: {
          'pt-BR': 'A'.repeat(100),
          en: 'B'.repeat(100),
        },
        photoUrl: 'https://example.com/photo.jpg',
        company: 'Test Company',
        position: {
          'pt-BR': 'Desenvolvedor',
          en: 'Developer',
        },
        priority: 50,
      });

      const savedNormal = await normalSpeaker.save();
      expect(savedNormal.displayPriority).toBe(50);

      const highlightSpeaker = new speakerModel({
        name: 'Highlight Speaker',
        bio: {
          'pt-BR': 'A'.repeat(100),
          en: 'B'.repeat(100),
        },
        photoUrl: 'https://example.com/photo.jpg',
        company: 'Test Company',
        position: {
          'pt-BR': 'Desenvolvedor',
          en: 'Developer',
        },
        priority: 50,
        isHighlight: true,
      });

      const savedHighlight = await highlightSpeaker.save();
      expect(savedHighlight.displayPriority).toBe(0);
    });
  });

  describe('Schema Methods', () => {
    it('should get localized bio', async () => {
      const speaker = new speakerModel({
        name: 'Test Speaker',
        bio: {
          'pt-BR': 'Bio em português'.padEnd(100, '!'),
          en: 'Bio in English'.padEnd(100, '!'),
        },
        photoUrl: 'https://example.com/photo.jpg',
        company: 'Test Company',
        position: {
          'pt-BR': 'Desenvolvedor',
          en: 'Developer',
        },
      });

      const saved = await speaker.save();
      expect(saved.getLocalizedBio('pt-BR')).toContain('Bio em português');
      expect(saved.getLocalizedBio('en')).toContain('Bio in English');
    });

    it('should get localized position', async () => {
      const speaker = new speakerModel({
        name: 'Test Speaker',
        bio: {
          'pt-BR': 'A'.repeat(100),
          en: 'B'.repeat(100),
        },
        photoUrl: 'https://example.com/photo.jpg',
        company: 'Test Company',
        position: {
          'pt-BR': 'Desenvolvedor',
          en: 'Developer',
        },
      });

      const saved = await speaker.save();
      expect(saved.getLocalizedPosition('pt-BR')).toBe('Desenvolvedor');
      expect(saved.getLocalizedPosition('en')).toBe('Developer');
    });
  });

  describe('Indexes', () => {
    it('should have proper indexes', async () => {
      const indexes = await speakerModel.collection.getIndexes();

      expect(indexes).toHaveProperty('isVisible_1_priority_1');
      expect(indexes).toHaveProperty('isHighlight_1');
      expect(indexes).toHaveProperty('company_1');
    });
  });
});
