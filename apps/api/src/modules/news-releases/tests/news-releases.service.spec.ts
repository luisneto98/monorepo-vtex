import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NewsReleasesService } from '../news-releases.service';
import { NewsRelease } from '../schemas/news-release.schema';
import { ContentSanitizationService } from '../services/content-sanitization.service';
import { AuditLogService } from '../services/audit-log.service';
import { ImageProcessingService } from '../services/image-processing.service';
import { PublicationSchedulerService } from '../services/publication-scheduler.service';
import { FeedGeneratorService } from '../services/feed-generator.service';
import { NewsReleaseStatus } from '@vtexday26/shared';
import { NotFoundException } from '@nestjs/common';

describe('NewsReleasesService', () => {
  let service: NewsReleasesService;
  let mockModel: any;
  let mockContentSanitizationService: any;
  let mockAuditLogService: any;

  beforeEach(async () => {
    mockModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      countDocuments: jest.fn(),
      create: jest.fn(),
      constructor: jest.fn(() => ({
        save: jest.fn(),
        id: 'mock-id',
      })),
    };

    mockContentSanitizationService = {
      sanitizeAllContent: jest.fn((content) => content),
    };

    mockAuditLogService = {
      logAction: jest.fn(),
    };

    const mockImageProcessingService = {
      uploadImage: jest.fn(),
      deleteImage: jest.fn(),
    };

    const mockPublicationSchedulerService = {
      schedulePublication: jest.fn(),
      cancelScheduledPublication: jest.fn(),
    };

    const mockFeedGeneratorService = {
      generateRssFeed: jest.fn(),
      generateAtomFeed: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewsReleasesService,
        {
          provide: getModelToken(NewsRelease.name),
          useValue: mockModel,
        },
        {
          provide: ContentSanitizationService,
          useValue: mockContentSanitizationService,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
        {
          provide: ImageProcessingService,
          useValue: mockImageProcessingService,
        },
        {
          provide: PublicationSchedulerService,
          useValue: mockPublicationSchedulerService,
        },
        {
          provide: FeedGeneratorService,
          useValue: mockFeedGeneratorService,
        },
      ],
    }).compile();

    service = module.get<NewsReleasesService>(NewsReleasesService);
  });

  describe('create', () => {
    it('should create a news release', async () => {
      const dto = {
        content: {
          'pt-BR': { title: 'Título', content: 'Conteúdo' },
          en: { title: 'Title', content: 'Content' },
          es: { title: 'Título', content: 'Contenido' },
        },
        status: NewsReleaseStatus.DRAFT,
      };

      const user = {
        id: 'user-id',
        name: 'Test User',
        email: 'test@example.com',
        role: 'admin',
      };

      const mockSaved = {
        _id: 'release-id',
        slug: 'title',
        ...dto,
        save: jest.fn().mockResolvedValue({ _id: 'release-id' }),
      };

      mockModel.findOne.mockResolvedValue(null);
      mockModel.constructor.mockReturnValue(mockSaved);

      await service.create(dto, user);

      expect(mockContentSanitizationService.sanitizeAllContent).toHaveBeenCalledWith(dto.content);
      expect(mockAuditLogService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'create',
          performedBy: expect.objectContaining({ id: user.id }),
        }),
      );
    });

    it('should generate unique slug', async () => {
      const dto = {
        content: {
          'pt-BR': { title: 'Título', content: 'Conteúdo' },
          en: { title: 'Title', content: 'Content' },
          es: { title: 'Título', content: 'Contenido' },
        },
      };

      const user = {
        id: 'user-id',
        name: 'Test User',
        email: 'test@example.com',
        role: 'admin',
      };

      mockModel.findOne.mockResolvedValueOnce({ slug: 'title' }).mockResolvedValueOnce(null);

      const mockSaved = {
        _id: 'release-id',
        slug: 'title-1',
        save: jest.fn().mockResolvedValue({ _id: 'release-id' }),
      };

      mockModel.constructor.mockReturnValue(mockSaved);

      await service.create(dto, user);

      expect(mockModel.findOne).toHaveBeenCalledTimes(2);
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const query = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt' as const,
        sortOrder: 'desc' as const,
      };

      const mockReleases = [
        { _id: '1', title: 'Release 1' },
        { _id: '2', title: 'Release 2' },
      ];

      mockModel.countDocuments.mockResolvedValue(2);
      mockModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(mockReleases),
            }),
          }),
        }),
      });

      const result = await service.findAll(query);

      expect(result).toEqual({
        items: mockReleases,
        total: 2,
        page: 1,
        pages: 1,
      });
    });

    it('should filter by status', async () => {
      const query = {
        status: NewsReleaseStatus.PUBLISHED,
        page: 1,
        limit: 20,
      };

      mockModel.countDocuments.mockResolvedValue(0);
      mockModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      await service.findAll(query);

      expect(mockModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          status: NewsReleaseStatus.PUBLISHED,
          isDeleted: false,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a news release by ID', async () => {
      const mockRelease = { _id: 'id', title: 'Test', isDeleted: false };
      mockModel.findById.mockResolvedValue(mockRelease);

      const result = await service.findOne('id');

      expect(result).toEqual(mockRelease);
    });

    it('should throw NotFoundException for deleted release', async () => {
      const mockRelease = { _id: 'id', title: 'Test', isDeleted: true };
      mockModel.findById.mockResolvedValue(mockRelease);

      await expect(service.findOne('id')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for non-existent release', async () => {
      mockModel.findById.mockResolvedValue(null);

      await expect(service.findOne('id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a news release', async () => {
      const mockRelease = {
        _id: 'id',
        content: { en: { title: 'Old Title' } },
        isDeleted: false,
      };

      const dto = {
        content: {
          'pt-BR': { title: 'Novo', content: 'Conteúdo' },
          en: { title: 'New Title', content: 'Content' },
          es: { title: 'Nuevo', content: 'Contenido' },
        },
      };

      const user = {
        id: 'user-id',
        name: 'Test User',
        email: 'test@example.com',
        role: 'admin',
      };

      mockModel.findById.mockResolvedValue(mockRelease);
      mockModel.findOne.mockResolvedValue(null);
      mockModel.findByIdAndUpdate.mockResolvedValue({ ...mockRelease, ...dto });

      await service.update('id', dto, user);

      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'id',
        expect.objectContaining({
          content: dto.content,
          $inc: { version: 1 },
        }),
        { new: true },
      );
      expect(mockAuditLogService.logAction).toHaveBeenCalled();
    });
  });

  describe('publish', () => {
    it('should publish a draft release', async () => {
      const mockRelease = {
        _id: 'id',
        status: NewsReleaseStatus.DRAFT,
        isDeleted: false,
      };

      const user = {
        id: 'user-id',
        name: 'Test User',
        email: 'test@example.com',
        role: 'admin',
      };

      mockModel.findById.mockResolvedValue(mockRelease);
      mockModel.findByIdAndUpdate.mockResolvedValue({
        ...mockRelease,
        status: NewsReleaseStatus.PUBLISHED,
      });

      await service.publish('id', user);

      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'id',
        expect.objectContaining({
          status: NewsReleaseStatus.PUBLISHED,
          publishedAt: expect.any(Date),
        }),
        { new: true },
      );
    });

    it('should throw error if already published', async () => {
      const mockRelease = {
        _id: 'id',
        status: NewsReleaseStatus.PUBLISHED,
        isDeleted: false,
      };

      const user = {
        id: 'user-id',
        name: 'Test User',
        email: 'test@example.com',
        role: 'admin',
      };

      mockModel.findById.mockResolvedValue(mockRelease);

      await expect(service.publish('id', user)).rejects.toThrow();
    });
  });

  describe('remove', () => {
    it('should soft delete a news release', async () => {
      const mockRelease = { _id: 'id', isDeleted: false };
      const user = {
        id: 'user-id',
        name: 'Test User',
        email: 'test@example.com',
        role: 'admin',
      };

      mockModel.findById.mockResolvedValue(mockRelease);
      mockModel.findByIdAndUpdate.mockResolvedValue({
        ...mockRelease,
        isDeleted: true,
      });

      await service.remove('id', user);

      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'id',
        expect.objectContaining({
          isDeleted: true,
          deletedAt: expect.any(Date),
        }),
      );
      expect(mockAuditLogService.logAction).toHaveBeenCalled();
    });
  });

  describe('getFeaturedNews', () => {
    it('should return featured published releases', async () => {
      const mockReleases = [
        { _id: '1', featured: true },
        { _id: '2', featured: true },
      ];

      mockModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockReleases),
          }),
        }),
      });

      const result = await service.getFeaturedNews(2);

      expect(mockModel.find).toHaveBeenCalledWith({
        featured: true,
        status: NewsReleaseStatus.PUBLISHED,
        isDeleted: false,
      });
      expect(result).toEqual(mockReleases);
    });
  });
});
