import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { SpeakersService } from '../../../../../src/modules/speakers/speakers.service';
import { Speaker } from '../../../../../src/modules/speakers/schemas/speaker.schema';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('SpeakersService', () => {
  let service: SpeakersService;

  const mockSpeaker = {
    _id: '507f1f77bcf86cd799439011',
    name: 'John Doe',
    bio: {
      'pt-BR':
        'Biografia em português do palestrante com mais de cem caracteres para atender ao requisito mínimo de comprimento',
      en: 'Speaker biography in English with more than one hundred characters to meet the minimum length requirement',
    },
    photoUrl: 'https://example.com/photo.jpg',
    company: 'Tech Corp',
    position: {
      'pt-BR': 'Diretor de Tecnologia',
      en: 'Technology Director',
    },
    socialLinks: {
      linkedin: 'https://linkedin.com/in/johndoe',
      twitter: 'https://twitter.com/johndoe',
    },
    isHighlight: false,
    isVisible: true,
    priority: 100,
    tags: ['AI', 'Cloud'],
    deletedAt: null,
    save: jest.fn().mockResolvedValue(this),
  };

  const mockSpeakerModel = jest.fn().mockImplementation((dto) => ({
    ...mockSpeaker,
    ...dto,
    save: jest.fn().mockResolvedValue({ ...mockSpeaker, ...dto }),
  })) as any;

  mockSpeakerModel.findOne = jest.fn();
  mockSpeakerModel.find = jest.fn();
  mockSpeakerModel.countDocuments = jest.fn();
  mockSpeakerModel.create = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpeakersService,
        {
          provide: getModelToken(Speaker.name),
          useValue: mockSpeakerModel,
        },
      ],
    }).compile();

    service = module.get<SpeakersService>(SpeakersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new speaker', async () => {
      const createDto = {
        name: 'Jane Smith',
        bio: {
          'pt-BR':
            'Biografia em português do palestrante com mais de cem caracteres para atender ao requisito mínimo de comprimento',
          en: 'Speaker biography in English with more than one hundred characters to meet the minimum length requirement',
          es: 'Biografía del ponente en español con más de cien caracteres para cumplir con el requisito de longitud mínima',
        },
        photoUrl: 'https://example.com/jane.jpg',
        company: 'Innovation Inc',
        position: {
          'pt-BR': 'CEO',
          en: 'CEO',
          es: 'CEO',
        },
      };

      mockSpeakerModel.findOne.mockResolvedValue(null);

      const result = await service.create(createDto);

      expect(mockSpeakerModel.findOne).toHaveBeenCalledWith({
        name: createDto.name,
        deletedAt: null,
      });
      expect(result).toBeDefined();
    });

    it('should throw ConflictException if speaker already exists', async () => {
      const createDto = {
        name: 'John Doe',
        bio: {
          'pt-BR': 'Bio em português',
          en: 'Bio in English',
          es: 'Bio en español',
        },
        photoUrl: 'https://example.com/photo.jpg',
        company: 'Tech Corp',
        position: {
          'pt-BR': 'CTO',
          en: 'CTO',
          es: 'CTO',
        },
      };

      mockSpeakerModel.findOne.mockResolvedValue(mockSpeaker);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated speakers', async () => {
      const filterDto = {
        page: 1,
        limit: 10,
        search: '',
        sort: '-createdAt',
      };

      const speakers = [mockSpeaker];
      mockSpeakerModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(speakers),
      });
      mockSpeakerModel.countDocuments.mockResolvedValue(1);

      const result = await service.findAll(filterDto);

      expect(result).toEqual({
        success: true,
        data: speakers,
        metadata: {
          total: 1,
          page: 1,
          limit: 10,
          hasNext: false,
          hasPrev: false,
        },
      });
    });

    it('should apply filters correctly', async () => {
      const filterDto = {
        page: 1,
        limit: 20,
        isHighlight: true,
        tags: ['AI', 'Cloud'],
      };

      mockSpeakerModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });
      mockSpeakerModel.countDocuments.mockResolvedValue(0);

      await service.findAll(filterDto);

      expect(mockSpeakerModel.find).toHaveBeenCalledWith({
        deletedAt: null,
        isHighlight: true,
        tags: { $in: ['AI', 'Cloud'] },
      });
    });
  });

  describe('findById', () => {
    it('should return a speaker by id', async () => {
      mockSpeakerModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSpeaker),
      });

      const result = await service.findById('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockSpeaker);
      expect(mockSpeakerModel.findOne).toHaveBeenCalledWith({
        _id: '507f1f77bcf86cd799439011',
        deletedAt: null,
      });
    });

    it('should throw NotFoundException if speaker not found', async () => {
      mockSpeakerModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findById('507f1f77bcf86cd799439011')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a speaker', async () => {
      const updateDto = {
        company: 'New Company',
      };

      const existingSpeaker = {
        ...mockSpeaker,
        save: jest.fn().mockResolvedValue({ ...mockSpeaker, ...updateDto }),
      };

      mockSpeakerModel.findOne.mockResolvedValueOnce(existingSpeaker).mockResolvedValueOnce(null);

      const result = await service.update('507f1f77bcf86cd799439011', updateDto);

      expect(result).toBeDefined();
      expect(existingSpeaker.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if speaker not found', async () => {
      mockSpeakerModel.findOne.mockResolvedValue(null);

      await expect(service.update('507f1f77bcf86cd799439011', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a speaker', async () => {
      const speaker = {
        ...mockSpeaker,
        deletedAt: null as any,
        deleteReason: null as any,
        deletedBy: null as any,
        save: jest.fn().mockResolvedValue(mockSpeaker),
      };

      mockSpeakerModel.findOne.mockResolvedValue(speaker);

      await service.remove('507f1f77bcf86cd799439011', 'Test reason', 'userId');

      expect(speaker.deletedAt).toBeDefined();
      expect(speaker.deleteReason).toBe('Test reason');
      expect(speaker.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if speaker not found', async () => {
      mockSpeakerModel.findOne.mockResolvedValue(null);

      await expect(service.remove('507f1f77bcf86cd799439011')).rejects.toThrow(NotFoundException);
    });
  });

  describe('restore', () => {
    it('should restore a soft-deleted speaker', async () => {
      const deletedSpeaker = {
        ...mockSpeaker,
        deletedAt: new Date(),
        deletedBy: 'userId',
        deleteReason: 'Test',
        save: jest.fn().mockResolvedValue(mockSpeaker),
      };

      mockSpeakerModel.findOne.mockResolvedValue(deletedSpeaker);

      await service.restore('507f1f77bcf86cd799439011');

      expect(deletedSpeaker.deletedAt).toBeNull();
      expect(deletedSpeaker.deletedBy).toBeNull();
      expect(deletedSpeaker.deleteReason).toBeNull();
      expect(deletedSpeaker.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if deleted speaker not found', async () => {
      mockSpeakerModel.findOne.mockResolvedValue(null);

      await expect(service.restore('507f1f77bcf86cd799439011')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findHighlights', () => {
    it('should return highlighted speakers', async () => {
      const highlights = [{ ...mockSpeaker, isHighlight: true }];

      mockSpeakerModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(highlights),
      });

      const result = await service.findHighlights();

      expect(result).toEqual(highlights);
      expect(mockSpeakerModel.find).toHaveBeenCalledWith({
        isHighlight: true,
        isVisible: true,
        deletedAt: null,
      });
    });
  });
});
