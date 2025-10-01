import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { SponsorsService } from '../../../../../src/modules/sponsors/sponsors.service';
import { Sponsor } from '../../../../../src/modules/sponsors/schemas/sponsor.schema';
import { SponsorTier } from '../../../../../src/modules/sponsors/schemas/sponsor-tier.schema';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { StorageService } from '../../../../../src/modules/storage/services/storage.service';
import { FileCategory } from '../../../../../src/modules/storage/types/storage.types';

describe('SponsorsService', () => {
  let service: SponsorsService;

  const mockSponsorTier = {
    _id: '507f1f77bcf86cd799439014',
    name: 'Diamond',
    description: {
      'pt-BR': 'Patrocinador Diamante',
      en: 'Diamond Sponsor',
    },
    priority: 1,
    benefits: ['Logo principal', 'Estande premium'],
    maxSponsors: 3,
    price: 50000,
    isActive: true,
  };

  const mockSponsor = {
    _id: '507f1f77bcf86cd799439013',
    name: 'Tech Corp',
    description: {
      'pt-BR': 'Empresa de tecnologia líder',
      en: 'Leading technology company',
    },
    logoUrl: 'https://example.com/logo.png',
    websiteUrl: 'https://techcorp.com',
    tier: mockSponsorTier._id,
    contactInfo: {
      email: 'contact@techcorp.com',
      phone: '+55 11 99999-9999',
    },
    socialLinks: {
      linkedin: 'https://linkedin.com/company/techcorp',
      twitter: 'https://twitter.com/techcorp',
    },
    tags: ['Technology', 'SaaS'],
    isVisible: true,
    priority: 100,
    deletedAt: null,
    save: jest.fn().mockResolvedValue(this),
  };

  const mockSponsorModel = jest.fn().mockImplementation((dto) => ({
    ...mockSponsor,
    ...dto,
    save: jest.fn().mockResolvedValue({ ...mockSponsor, ...dto }),
  })) as any;

  const mockSponsorTierModel = jest.fn().mockImplementation((dto) => ({
    ...mockSponsorTier,
    ...dto,
    save: jest.fn().mockResolvedValue({ ...mockSponsorTier, ...dto }),
  })) as any;

  mockSponsorModel.findOne = jest.fn();
  mockSponsorModel.find = jest.fn();
  mockSponsorModel.countDocuments = jest.fn();
  mockSponsorModel.aggregate = jest.fn();
  mockSponsorModel.create = jest.fn();

  mockSponsorTierModel.findOne = jest.fn();
  mockSponsorTierModel.find = jest.fn();
  mockSponsorTierModel.countDocuments = jest.fn();
  mockSponsorTierModel.create = jest.fn();
  mockSponsorTierModel.updateOne = jest.fn();
  mockSponsorTierModel.deleteOne = jest.fn();
  mockSponsorTierModel.findById = jest.fn();

  const mockStorageService = {
    uploadFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SponsorsService,
        {
          provide: getModelToken(Sponsor.name),
          useValue: mockSponsorModel,
        },
        {
          provide: getModelToken(SponsorTier.name),
          useValue: mockSponsorTierModel,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
      ],
    }).compile();

    service = module.get<SponsorsService>(SponsorsService);
  });

  beforeEach(() => {
    // Reset storage service mock to default behavior before each test
    mockStorageService.uploadFile.mockReset();
    mockStorageService.uploadFile.mockResolvedValue({
      key: 'sponsor-logos/12345-67890.jpg',
      url: 'https://test-bucket.s3.us-east-1.amazonaws.com/sponsor-logos/12345-67890.jpg',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new sponsor', async () => {
      const createDto = {
        name: 'New Sponsor',
        slug: 'new-sponsor',
        description: {
          'pt-BR': 'Novo patrocinador',
          en: 'New sponsor',
        },
        logoUrl: 'https://example.com/new-logo.png',
        websiteUrl: 'https://newsponsor.com',
        tier: mockSponsorTier._id,
        orderInTier: 1,
        adminEmail: 'admin@newsponsor.com',
      };

      mockSponsorModel.findOne.mockResolvedValue(null);
      mockSponsorTierModel.findById.mockResolvedValue(mockSponsorTier);

      const result = await service.createSponsor(createDto);

      expect(mockSponsorModel.findOne).toHaveBeenCalled();
      expect(mockSponsorTierModel.findById).toHaveBeenCalledWith(createDto.tier);
      expect(result).toBeDefined();
    });

    it('should throw ConflictException if sponsor already exists', async () => {
      const createDto = {
        name: 'Tech Corp',
        slug: 'tech-corp',
        description: {
          'pt-BR': 'Empresa existente',
          en: 'Existing company',
        },
        logoUrl: 'https://example.com/logo.png',
        websiteUrl: 'https://techcorp.com',
        tier: mockSponsorTier._id,
        orderInTier: 1,
        adminEmail: 'admin@techcorp.com',
      };

      mockSponsorModel.findOne.mockResolvedValue(mockSponsor);

      await expect(service.createSponsor(createDto)).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if tier not found', async () => {
      const createDto = {
        name: 'New Sponsor',
        slug: 'new-sponsor',
        description: {
          'pt-BR': 'Novo patrocinador',
          en: 'New sponsor',
        },
        logoUrl: 'https://example.com/logo.png',
        websiteUrl: 'https://newsponsor.com',
        tier: 'nonexistent-tier-id',
        orderInTier: 1,
        adminEmail: 'admin@newsponsor.com',
      };

      mockSponsorModel.findOne.mockResolvedValue(null);
      mockSponsorTierModel.findById.mockResolvedValue(null);

      await expect(service.createSponsor(createDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated sponsors', async () => {
      const filterDto = {
        page: 1,
        limit: 10,
        sort: '-priority',
      };

      const sponsors = [mockSponsor];
      mockSponsorModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(sponsors),
      });
      mockSponsorModel.countDocuments.mockResolvedValue(1);

      const result = await service.findAllSponsors(filterDto);

      expect(result).toEqual({
        success: true,
        data: sponsors,
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
        tier: 'Diamond',
        tags: ['Technology', 'SaaS'],
      };

      mockSponsorModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });
      mockSponsorModel.countDocuments.mockResolvedValue(0);

      await service.findAllSponsors(filterDto);

      expect(mockSponsorModel.find).toHaveBeenCalledWith({
        deletedAt: null,
        tier: 'Diamond',
        tags: { $in: ['Technology', 'SaaS'] },
      });
    });
  });

  describe('findById', () => {
    it('should return a sponsor by id', async () => {
      mockSponsorModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockSponsor),
      });

      const result = await service.findSponsorById('507f1f77bcf86cd799439013');

      expect(result).toEqual(mockSponsor);
      expect(mockSponsorModel.findOne).toHaveBeenCalledWith({
        _id: '507f1f77bcf86cd799439013',
        deletedAt: null,
      });
    });

    it('should throw NotFoundException if sponsor not found', async () => {
      mockSponsorModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findSponsorById('507f1f77bcf86cd799439013')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a sponsor', async () => {
      const updateDto = {
        websiteUrl: 'https://newtechcorp.com',
      };

      const existingSponsor = {
        ...mockSponsor,
        save: jest.fn().mockResolvedValue({ ...mockSponsor, ...updateDto }),
      };

      mockSponsorModel.findOne.mockResolvedValueOnce(existingSponsor).mockResolvedValueOnce(null);

      const result = await service.updateSponsor('507f1f77bcf86cd799439013', updateDto);

      expect(result).toBeDefined();
      expect(existingSponsor.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if sponsor not found', async () => {
      mockSponsorModel.findOne.mockResolvedValue(null);

      await expect(service.updateSponsor('507f1f77bcf86cd799439013', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a sponsor', async () => {
      const sponsor = {
        ...mockSponsor,
        deletedAt: null as any,
        deleteReason: null as any,
        deletedBy: null as any,
        save: jest.fn().mockResolvedValue(mockSponsor),
      };

      mockSponsorModel.findOne.mockResolvedValue(sponsor);

      await service.removeSponsor('507f1f77bcf86cd799439013', 'Test reason', 'userId');

      expect(sponsor.deletedAt).toBeDefined();
      expect(sponsor.deleteReason).toBe('Test reason');
      expect(sponsor.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if sponsor not found', async () => {
      mockSponsorModel.findOne.mockResolvedValue(null);

      await expect(service.removeSponsor('507f1f77bcf86cd799439013')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('restore', () => {
    it('should restore a soft-deleted sponsor', async () => {
      const deletedSponsor = {
        ...mockSponsor,
        deletedAt: new Date(),
        deletedBy: 'userId',
        deleteReason: 'Test',
        save: jest.fn().mockResolvedValue(mockSponsor),
      };

      mockSponsorModel.findOne.mockResolvedValue(deletedSponsor);

      await service.restoreSponsor('507f1f77bcf86cd799439013');

      expect(deletedSponsor.deletedAt).toBeNull();
      expect(deletedSponsor.deletedBy).toBeNull();
      expect(deletedSponsor.deleteReason).toBeNull();
      expect(deletedSponsor.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if deleted sponsor not found', async () => {
      mockSponsorModel.findOne.mockResolvedValue(null);

      await expect(service.restoreSponsor('507f1f77bcf86cd799439013')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByTier', () => {
    it('should return sponsors grouped by tier', async () => {
      const sponsorWithTier = {
        ...mockSponsor,
        tier: mockSponsorTier,
      };

      mockSponsorModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([sponsorWithTier]),
      });

      const result = await service.findSponsorsByTier();

      expect(result).toHaveProperty(mockSponsorTier.name);
      expect(result[mockSponsorTier.name]).toContainEqual(sponsorWithTier);
      expect(mockSponsorModel.find).toHaveBeenCalledWith({
        isVisible: true,
        deletedAt: null,
      });
    });
  });

  describe('SponsorTier CRUD', () => {
    describe('createTier', () => {
      it('should create a new sponsor tier', async () => {
        const createTierDto = {
          name: 'Gold',
          displayName: {
            'pt-BR': 'Patrocinador Ouro',
            en: 'Gold Sponsor',
          },
          order: 2,
          maxPosts: 5,
        };

        mockSponsorTierModel.findOne.mockResolvedValue(null);

        const result = await service.createTier(createTierDto);

        expect(mockSponsorTierModel.findOne).toHaveBeenCalled();
        expect(result).toBeDefined();
      });

      it('should throw ConflictException if tier already exists', async () => {
        const createTierDto = {
          name: 'Diamond',
          displayName: {
            'pt-BR': 'Patrocinador Diamante',
            en: 'Diamond Sponsor',
          },
          order: 1,
          maxPosts: 3,
        };

        mockSponsorTierModel.findOne.mockResolvedValue(mockSponsorTier);

        await expect(service.createTier(createTierDto)).rejects.toThrow(ConflictException);
      });
    });

    describe('findAllTiers', () => {
      it('should return all sponsor tiers', async () => {
        const tiers = [mockSponsorTier];

        mockSponsorTierModel.find.mockReturnValue({
          sort: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue(tiers),
        });

        const result = await service.findAllTiers();

        expect(result).toEqual(tiers);
        expect(mockSponsorTierModel.find).toHaveBeenCalled();
      });
    });

    describe('updateTier', () => {
      it('should update a sponsor tier', async () => {
        const updateTierDto = {
          maxPosts: 10,
        };

        const existingTier = {
          ...mockSponsorTier,
          save: jest.fn().mockResolvedValue({ ...mockSponsorTier, ...updateTierDto }),
        };

        mockSponsorTierModel.findById.mockResolvedValue(existingTier);

        const result = await service.updateTier('507f1f77bcf86cd799439014', updateTierDto);

        expect(result).toBeDefined();
        expect(existingTier.save).toHaveBeenCalled();
      });

      it('should throw NotFoundException if tier not found', async () => {
        mockSponsorTierModel.findById.mockResolvedValue(null);

        await expect(service.updateTier('507f1f77bcf86cd799439014', {})).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('deleteTier', () => {
      it('should delete a sponsor tier', async () => {
        mockSponsorModel.findOne.mockResolvedValue(null);
        mockSponsorTierModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

        await service.removeTier('507f1f77bcf86cd799439014');

        expect(mockSponsorTierModel.deleteOne).toHaveBeenCalledWith({
          _id: '507f1f77bcf86cd799439014',
        });
      });

      it('should throw ConflictException if tier has sponsors', async () => {
        mockSponsorModel.findOne.mockResolvedValue(mockSponsor);

        await expect(service.removeTier('507f1f77bcf86cd799439014')).rejects.toThrow(
          ConflictException,
        );
      });
    });
  });

  describe('uploadLogo', () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'test-logo.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 1024 * 500, // 500KB
      buffer: Buffer.from('fake-image-data'),
      stream: null as any,
      destination: '',
      filename: '',
      path: '',
    };

    it('should successfully upload logo and update sponsor', async () => {
      const sponsorId = mockSponsor._id;
      const mockSponsorDoc = {
        ...mockSponsor,
        save: jest
          .fn()
          .mockResolvedValue({ ...mockSponsor, logoUrl: mockStorageService.uploadFile().url }),
      };

      mockSponsorModel.findOne.mockResolvedValue(mockSponsorDoc);

      const result = await service.uploadLogo(sponsorId, mockFile);

      // Verify sponsor was found
      expect(mockSponsorModel.findOne).toHaveBeenCalledWith({
        _id: sponsorId,
        deletedAt: null,
      });

      // Verify file was uploaded to storage
      expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        FileCategory.SPONSOR_LOGOS,
      );

      // Verify sponsor logoUrl was updated
      expect(mockSponsorDoc.logoUrl).toBe(
        'https://test-bucket.s3.us-east-1.amazonaws.com/sponsor-logos/12345-67890.jpg',
      );
      expect(mockSponsorDoc.save).toHaveBeenCalled();

      // Verify returned URL
      expect(result).toBe(
        'https://test-bucket.s3.us-east-1.amazonaws.com/sponsor-logos/12345-67890.jpg',
      );
    });

    it('should throw NotFoundException if sponsor does not exist', async () => {
      const nonExistentId = '507f1f77bcf86cd799439999';
      mockSponsorModel.findOne.mockResolvedValue(null);

      await expect(service.uploadLogo(nonExistentId, mockFile)).rejects.toThrow(NotFoundException);
      await expect(service.uploadLogo(nonExistentId, mockFile)).rejects.toThrow(
        `Sponsor with ID ${nonExistentId} not found`,
      );

      expect(mockSponsorModel.findOne).toHaveBeenCalledWith({
        _id: nonExistentId,
        deletedAt: null,
      });
      expect(mockStorageService.uploadFile).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if sponsor is soft-deleted', async () => {
      const deletedSponsorId = mockSponsor._id;
      mockSponsorModel.findOne.mockResolvedValue(null);

      await expect(service.uploadLogo(deletedSponsorId, mockFile)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockStorageService.uploadFile).not.toHaveBeenCalled();
    });

    it('should propagate StorageService errors (invalid file type)', async () => {
      const sponsorId = mockSponsor._id;
      const mockSponsorDoc = { ...mockSponsor, save: jest.fn() };

      mockSponsorModel.findOne.mockResolvedValue(mockSponsorDoc);
      mockStorageService.uploadFile.mockRejectedValue(
        new BadRequestException('Invalid file type. Only JPEG, PNG, WEBP files are allowed.'),
      );

      await expect(service.uploadLogo(sponsorId, mockFile)).rejects.toThrow(BadRequestException);
      await expect(service.uploadLogo(sponsorId, mockFile)).rejects.toThrow('Invalid file type');

      expect(mockSponsorModel.findOne).toHaveBeenCalled();
      expect(mockStorageService.uploadFile).toHaveBeenCalled();
      expect(mockSponsorDoc.save).not.toHaveBeenCalled();
    });

    it('should propagate StorageService errors (file too large)', async () => {
      const sponsorId = mockSponsor._id;
      const mockSponsorDoc = { ...mockSponsor, save: jest.fn() };

      mockSponsorModel.findOne.mockResolvedValue(mockSponsorDoc);
      mockStorageService.uploadFile.mockRejectedValue(
        new BadRequestException('File size exceeds maximum allowed size of 5MB'),
      );

      await expect(service.uploadLogo(sponsorId, mockFile)).rejects.toThrow(BadRequestException);
      expect(mockSponsorDoc.save).not.toHaveBeenCalled();
    });

    it('should propagate StorageService errors (virus detected)', async () => {
      const sponsorId = mockSponsor._id;
      const mockSponsorDoc = { ...mockSponsor, save: jest.fn() };

      mockSponsorModel.findOne.mockResolvedValue(mockSponsorDoc);
      mockStorageService.uploadFile.mockRejectedValue(
        new BadRequestException('Virus detected in uploaded file'),
      );

      await expect(service.uploadLogo(sponsorId, mockFile)).rejects.toThrow(BadRequestException);
      await expect(service.uploadLogo(sponsorId, mockFile)).rejects.toThrow('Virus detected');
      expect(mockSponsorDoc.save).not.toHaveBeenCalled();
    });

    it('should update logoUrl correctly when uploading new logo over existing one', async () => {
      const sponsorId = mockSponsor._id;
      const oldLogoUrl = 'https://example.com/old-logo.png';
      const newLogoUrl =
        'https://test-bucket.s3.us-east-1.amazonaws.com/sponsor-logos/12345-67890.jpg';

      const mockSponsorDoc = {
        ...mockSponsor,
        logoUrl: oldLogoUrl,
        save: jest.fn().mockResolvedValue({ ...mockSponsor, logoUrl: newLogoUrl }),
      };

      mockSponsorModel.findOne.mockResolvedValue(mockSponsorDoc);

      const result = await service.uploadLogo(sponsorId, mockFile);

      expect(mockSponsorDoc.logoUrl).toBe(newLogoUrl);
      expect(result).toBe(newLogoUrl);
      expect(mockSponsorDoc.save).toHaveBeenCalled();
    });

    it('should handle database save errors gracefully', async () => {
      const sponsorId = mockSponsor._id;
      const mockSponsorDoc = {
        ...mockSponsor,
        save: jest.fn().mockRejectedValue(new Error('Database connection error')),
      };

      mockSponsorModel.findOne.mockResolvedValue(mockSponsorDoc);

      await expect(service.uploadLogo(sponsorId, mockFile)).rejects.toThrow(
        'Database connection error',
      );

      expect(mockStorageService.uploadFile).toHaveBeenCalled();
      expect(mockSponsorDoc.save).toHaveBeenCalled();
    });
  });
});
