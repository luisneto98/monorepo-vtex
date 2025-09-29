import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { SessionsService } from '../../../../../src/modules/sessions/sessions.service';
import { Session } from '../../../../../src/modules/sessions/schemas/session.schema';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('SessionsService', () => {
  let service: SessionsService;

  const mockSession = {
    _id: '507f1f77bcf86cd799439012',
    title: {
      'pt-BR': 'Palestra sobre IA',
      en: 'AI Presentation',
    },
    description: {
      'pt-BR': 'Descrição detalhada da palestra sobre inteligência artificial',
      en: 'Detailed description of artificial intelligence presentation',
    },
    startTime: new Date('2025-11-26T10:00:00Z'),
    endTime: new Date('2025-11-26T11:00:00Z'),
    stage: 'principal',
    sessionType: 'talk',
    speakers: ['507f1f77bcf86cd799439011'],
    sponsors: ['507f1f77bcf86cd799439013'],
    tags: ['AI', 'Technology'],
    isVisible: true,
    priority: 100,
    deletedAt: null,
    save: jest.fn().mockResolvedValue(this),
  };

  const mockSessionModel = jest.fn().mockImplementation((dto) => ({
    ...mockSession,
    ...dto,
    save: jest.fn().mockResolvedValue({ ...mockSession, ...dto }),
  })) as any;

  mockSessionModel.findOne = jest.fn();
  mockSessionModel.find = jest.fn();
  mockSessionModel.countDocuments = jest.fn();
  mockSessionModel.aggregate = jest.fn();
  mockSessionModel.create = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        {
          provide: getModelToken(Session.name),
          useValue: mockSessionModel,
        },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new session', async () => {
      const createDto = {
        title: {
          'pt-BR': 'Nova Palestra',
          en: 'New Presentation',
        },
        description: {
          'pt-BR': 'Descrição da nova palestra',
          en: 'New presentation description',
        },
        startTime: new Date('2025-11-26T14:00:00Z'),
        endTime: new Date('2025-11-26T15:00:00Z'),
        stage: 'secundario',
        sessionType: 'talk',
        speakers: ['507f1f77bcf86cd799439011'],
      };

      mockSessionModel.findOne.mockResolvedValue(null);

      const result = await service.create(createDto);

      expect(mockSessionModel.findOne).toHaveBeenCalledWith({
        stage: createDto.stage,
        startTime: { $lte: createDto.endTime },
        endTime: { $gte: createDto.startTime },
        deletedAt: null,
      });
      expect(result).toBeDefined();
    });

    it('should throw ConflictException if session conflicts with existing time slot', async () => {
      const createDto = {
        title: {
          'pt-BR': 'Palestra Conflitante',
          en: 'Conflicting Session',
        },
        description: {
          'pt-BR': 'Descrição',
          en: 'Description',
        },
        startTime: new Date('2025-11-26T10:30:00Z'),
        endTime: new Date('2025-11-26T11:30:00Z'),
        stage: 'principal',
        sessionType: 'talk',
        speakers: ['507f1f77bcf86cd799439011'],
      };

      mockSessionModel.findOne.mockResolvedValue(mockSession);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated sessions', async () => {
      const filterDto = {
        page: 1,
        limit: 10,
        sort: '-startTime',
      };

      const sessions = [mockSession];
      mockSessionModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(sessions),
      });
      mockSessionModel.countDocuments.mockResolvedValue(1);

      const result = await service.findAll(filterDto);

      expect(result).toEqual({
        success: true,
        data: sessions,
        metadata: {
          total: 1,
          page: 1,
          limit: 10,
          hasNext: false,
          hasPrev: false,
        },
      });
    });

    it('should apply date filters correctly', async () => {
      const filterDto = {
        page: 1,
        limit: 20,
        startDate: '2025-11-26',
        endDate: '2025-11-28',
        stage: 'principal',
      };

      mockSessionModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });
      mockSessionModel.countDocuments.mockResolvedValue(0);

      await service.findAll(filterDto);

      expect(mockSessionModel.find).toHaveBeenCalledWith({
        deletedAt: null,
        startTime: {
          $gte: new Date('2025-11-26T00:00:00.000Z'),
          $lte: new Date('2025-11-28T23:59:59.999Z'),
        },
        stage: 'principal',
      });
    });
  });

  describe('findById', () => {
    it('should return a session by id', async () => {
      mockSessionModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockSession),
      });

      const result = await service.findById('507f1f77bcf86cd799439012');

      expect(result).toEqual(mockSession);
      expect(mockSessionModel.findOne).toHaveBeenCalledWith({
        _id: '507f1f77bcf86cd799439012',
        deletedAt: null,
      });
    });

    it('should throw NotFoundException if session not found', async () => {
      mockSessionModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findById('507f1f77bcf86cd799439012')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a session', async () => {
      const updateDto = {
        stage: 'secundario',
      };

      const existingSession = {
        ...mockSession,
        save: jest.fn().mockResolvedValue({ ...mockSession, ...updateDto }),
      };

      mockSessionModel.findOne.mockResolvedValueOnce(existingSession).mockResolvedValueOnce(null);

      const result = await service.update('507f1f77bcf86cd799439012', updateDto);

      expect(result).toBeDefined();
      expect(existingSession.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if session not found', async () => {
      mockSessionModel.findOne.mockResolvedValue(null);

      await expect(service.update('507f1f77bcf86cd799439012', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a session', async () => {
      const session = {
        ...mockSession,
        deletedAt: null as any,
        deleteReason: null as any,
        deletedBy: null as any,
        save: jest.fn().mockResolvedValue(mockSession),
      };

      mockSessionModel.findOne.mockResolvedValue(session);

      await service.remove('507f1f77bcf86cd799439012', 'Test reason', 'userId');

      expect(session.deletedAt).toBeDefined();
      expect(session.deleteReason).toBe('Test reason');
      expect(session.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if session not found', async () => {
      mockSessionModel.findOne.mockResolvedValue(null);

      await expect(service.remove('507f1f77bcf86cd799439012')).rejects.toThrow(NotFoundException);
    });
  });

  describe('restore', () => {
    it('should restore a soft-deleted session', async () => {
      const deletedSession = {
        ...mockSession,
        deletedAt: new Date(),
        deletedBy: 'userId',
        deleteReason: 'Test',
        save: jest.fn().mockResolvedValue(mockSession),
      };

      mockSessionModel.findOne.mockResolvedValue(deletedSession);

      await service.restore('507f1f77bcf86cd799439012');

      expect(deletedSession.deletedAt).toBeNull();
      expect(deletedSession.deletedBy).toBeNull();
      expect(deletedSession.deleteReason).toBeNull();
      expect(deletedSession.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if deleted session not found', async () => {
      mockSessionModel.findOne.mockResolvedValue(null);

      await expect(service.restore('507f1f77bcf86cd799439012')).rejects.toThrow(NotFoundException);
    });
  });
});
