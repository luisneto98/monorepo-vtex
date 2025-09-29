import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, Model } from 'mongoose';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Session, SessionSchema, SessionDocument } from '@modules/sessions/schemas/session.schema';
import { SessionType, SessionStage } from '@shared/types/session.types';

describe('SessionSchema', () => {
  let mongod: MongoMemoryServer;
  let connection: Connection;
  let sessionModel: Model<SessionDocument>;
  let module: TestingModule;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([{ name: Session.name, schema: SessionSchema }]),
      ],
    }).compile();

    connection = module.get<Connection>(getConnectionToken());
    sessionModel = module.get<Model<SessionDocument>>(getModelToken(Session.name));
  });

  afterAll(async () => {
    await connection.close();
    await mongod.stop();
  });

  afterEach(async () => {
    await sessionModel.deleteMany({});
  });

  describe('Validation', () => {
    it('should enforce required fields', async () => {
      const session = new sessionModel({});

      await expect(session.save()).rejects.toThrow();
    });

    it('should validate title length', async () => {
      const longTitle = new sessionModel({
        title: {
          'pt-BR': 'A'.repeat(151),
          en: 'B'.repeat(151),
        },
        description: {
          'pt-BR': 'A'.repeat(100),
          en: 'B'.repeat(100),
        },
        type: SessionType.TALK,
        startTime: new Date('2025-01-01T10:00:00'),
        endTime: new Date('2025-01-01T11:00:00'),
        stage: SessionStage.PRINCIPAL,
      });

      await expect(longTitle.save()).rejects.toThrow();
    });

    it('should validate description length', async () => {
      const shortDescription = new sessionModel({
        title: {
          'pt-BR': 'Test Title',
          en: 'Test Title',
        },
        description: {
          'pt-BR': 'Too short',
          en: 'Too short',
        },
        type: SessionType.TALK,
        startTime: new Date('2025-01-01T10:00:00'),
        endTime: new Date('2025-01-01T11:00:00'),
        stage: SessionStage.PRINCIPAL,
      });

      await expect(shortDescription.save()).rejects.toThrow();

      const longDescription = new sessionModel({
        title: {
          'pt-BR': 'Test Title',
          en: 'Test Title',
        },
        description: {
          'pt-BR': 'A'.repeat(1001),
          en: 'B'.repeat(1001),
        },
        type: SessionType.TALK,
        startTime: new Date('2025-01-01T10:00:00'),
        endTime: new Date('2025-01-01T11:00:00'),
        stage: SessionStage.PRINCIPAL,
      });

      await expect(longDescription.save()).rejects.toThrow();
    });

    it('should validate enum values', async () => {
      const invalidType = new sessionModel({
        title: {
          'pt-BR': 'Test Title',
          en: 'Test Title',
        },
        description: {
          'pt-BR': 'A'.repeat(100),
          en: 'B'.repeat(100),
        },
        type: 'invalid_type',
        startTime: new Date('2025-01-01T10:00:00'),
        endTime: new Date('2025-01-01T11:00:00'),
        stage: SessionStage.PRINCIPAL,
      });

      await expect(invalidType.save()).rejects.toThrow();

      const invalidStage = new sessionModel({
        title: {
          'pt-BR': 'Test Title',
          en: 'Test Title',
        },
        description: {
          'pt-BR': 'A'.repeat(100),
          en: 'B'.repeat(100),
        },
        type: SessionType.TALK,
        startTime: new Date('2025-01-01T10:00:00'),
        endTime: new Date('2025-01-01T11:00:00'),
        stage: 'invalid_stage',
      });

      await expect(invalidStage.save()).rejects.toThrow();
    });

    it('should validate that end time is after start time', async () => {
      const invalidTimes = new sessionModel({
        title: {
          'pt-BR': 'Test Title',
          en: 'Test Title',
        },
        description: {
          'pt-BR': 'A'.repeat(100),
          en: 'B'.repeat(100),
        },
        type: SessionType.TALK,
        startTime: new Date('2025-01-01T11:00:00'),
        endTime: new Date('2025-01-01T10:00:00'),
        stage: SessionStage.PRINCIPAL,
      });

      await expect(invalidTimes.save()).rejects.toThrow('End time must be after start time');
    });
  });

  describe('Middleware', () => {
    it('should trim fields on save', async () => {
      const session = new sessionModel({
        title: {
          'pt-BR': '  Test Title PT  ',
          en: '  Test Title EN  ',
        },
        description: {
          'pt-BR': '  ' + 'A'.repeat(100) + '  ',
          en: '  ' + 'B'.repeat(100) + '  ',
        },
        type: SessionType.TALK,
        startTime: new Date('2025-01-01T10:00:00'),
        endTime: new Date('2025-01-01T11:00:00'),
        stage: SessionStage.PRINCIPAL,
        tags: ['  TAG1  ', '  TAG2  ', '  TAG3  '],
      });

      const saved = await session.save();
      expect(saved.title['pt-BR']).toBe('Test Title PT');
      expect(saved.title['en']).toBe('Test Title EN');
      expect(saved.description['pt-BR']).toBe('A'.repeat(100));
      expect(saved.description['en']).toBe('B'.repeat(100));
      expect(saved.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should normalize tags to lowercase', async () => {
      const session = new sessionModel({
        title: {
          'pt-BR': 'Test Title',
          en: 'Test Title',
        },
        description: {
          'pt-BR': 'A'.repeat(100),
          en: 'B'.repeat(100),
        },
        type: SessionType.TALK,
        startTime: new Date('2025-01-01T10:00:00'),
        endTime: new Date('2025-01-01T11:00:00'),
        stage: SessionStage.PRINCIPAL,
        tags: ['JavaScript', 'TypeScript', 'Node.js'],
      });

      const saved = await session.save();
      expect(saved.tags).toEqual(['javascript', 'typescript', 'node.js']);
    });
  });

  describe('Default Values', () => {
    it('should set default values', async () => {
      const session = new sessionModel({
        title: {
          'pt-BR': 'Test Title',
          en: 'Test Title',
        },
        description: {
          'pt-BR': 'A'.repeat(100),
          en: 'B'.repeat(100),
        },
        type: SessionType.TALK,
        startTime: new Date('2025-01-01T10:00:00'),
        endTime: new Date('2025-01-01T11:00:00'),
        stage: SessionStage.PRINCIPAL,
      });

      const saved = await session.save();
      expect(saved.isHighlight).toBe(false);
      expect(saved.isVisible).toBe(true);
      expect(saved.speakerIds).toEqual([]);
      expect(saved.sponsorIds).toEqual([]);
      expect(saved.tags).toEqual([]);
    });
  });

  describe('Virtual Fields', () => {
    it('should calculate duration in minutes', async () => {
      const session = new sessionModel({
        title: {
          'pt-BR': 'Test Title',
          en: 'Test Title',
        },
        description: {
          'pt-BR': 'A'.repeat(100),
          en: 'B'.repeat(100),
        },
        type: SessionType.TALK,
        startTime: new Date('2025-01-01T10:00:00'),
        endTime: new Date('2025-01-01T11:30:00'),
        stage: SessionStage.PRINCIPAL,
      });

      const saved = await session.save();
      expect(saved.duration).toBe(90);
    });
  });

  describe('Schema Methods', () => {
    it('should get localized title and description', async () => {
      const session = new sessionModel({
        title: {
          'pt-BR': 'Título em Português',
          en: 'Title in English',
        },
        description: {
          'pt-BR': 'Descrição em português'.padEnd(100, '!'),
          en: 'Description in English'.padEnd(100, '!'),
        },
        type: SessionType.TALK,
        startTime: new Date('2025-01-01T10:00:00'),
        endTime: new Date('2025-01-01T11:00:00'),
        stage: SessionStage.PRINCIPAL,
      });

      const saved = await session.save();
      expect(saved.getLocalizedTitle('pt-BR')).toBe('Título em Português');
      expect(saved.getLocalizedTitle('en')).toBe('Title in English');
      expect(saved.getLocalizedDescription('pt-BR')).toContain('Descrição em português');
      expect(saved.getLocalizedDescription('en')).toContain('Description in English');
    });

    it('should determine session status', async () => {
      const now = new Date();

      const pastSession = new sessionModel({
        title: {
          'pt-BR': 'Past Session',
          en: 'Past Session',
        },
        description: {
          'pt-BR': 'A'.repeat(100),
          en: 'B'.repeat(100),
        },
        type: SessionType.TALK,
        startTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() - 1 * 60 * 60 * 1000),
        stage: SessionStage.PRINCIPAL,
      });

      const savedPast = await pastSession.save();
      expect(savedPast.isPast()).toBe(true);
      expect(savedPast.isLive()).toBe(false);
      expect(savedPast.isUpcoming()).toBe(false);

      const liveSession = new sessionModel({
        title: {
          'pt-BR': 'Live Session',
          en: 'Live Session',
        },
        description: {
          'pt-BR': 'A'.repeat(100),
          en: 'B'.repeat(100),
        },
        type: SessionType.TALK,
        startTime: new Date(now.getTime() - 30 * 60 * 1000),
        endTime: new Date(now.getTime() + 30 * 60 * 1000),
        stage: SessionStage.PRINCIPAL,
      });

      const savedLive = await liveSession.save();
      expect(savedLive.isPast()).toBe(false);
      expect(savedLive.isLive()).toBe(true);
      expect(savedLive.isUpcoming()).toBe(false);

      const upcomingSession = new sessionModel({
        title: {
          'pt-BR': 'Upcoming Session',
          en: 'Upcoming Session',
        },
        description: {
          'pt-BR': 'A'.repeat(100),
          en: 'B'.repeat(100),
        },
        type: SessionType.TALK,
        startTime: new Date(now.getTime() + 1 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        stage: SessionStage.PRINCIPAL,
      });

      const savedUpcoming = await upcomingSession.save();
      expect(savedUpcoming.isPast()).toBe(false);
      expect(savedUpcoming.isLive()).toBe(false);
      expect(savedUpcoming.isUpcoming()).toBe(true);
    });
  });

  describe('Indexes', () => {
    it('should have proper indexes', async () => {
      const indexes = await sessionModel.collection.getIndexes();

      expect(indexes).toHaveProperty('startTime_1');
      expect(indexes).toHaveProperty('stage_1');
      expect(indexes).toHaveProperty('tags_1');
      expect(indexes).toHaveProperty('startTime_1_stage_1');
      expect(indexes).toHaveProperty('type_1');
      expect(indexes).toHaveProperty('isHighlight_1');
      expect(indexes).toHaveProperty('isVisible_1');
    });
  });
});
