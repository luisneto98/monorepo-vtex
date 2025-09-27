import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { SponsorsService } from '../../../../../src/modules/sponsors/sponsors.service';
import { Sponsor } from '../../../../../src/modules/sponsors/schemas/sponsor.schema';
import { SponsorTier } from '../../../../../src/modules/sponsors/schemas/sponsor-tier.schema';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('SponsorsService', () => {
  let service: SponsorsService;

  const mockSponsorTier = {
    _id: '507f1f77bcf86cd799439014',
    name: 'Diamond',
    description: {
      'pt-BR': 'Patrocinador Diamante',
      'en': 'Diamond Sponsor'
    },
    priority: 1,
    benefits: ['Logo principal', 'Estande premium'],
    maxSponsors: 3,
    price: 50000,
    isActive: true
  };

  const mockSponsor = {
    _id: '507f1f77bcf86cd799439013',
    name: 'Tech Corp',
    description: {
      'pt-BR': 'Empresa de tecnologia líder',
      'en': 'Leading technology company'
    },
    logoUrl: 'https://example.com/logo.png',
    websiteUrl: 'https://techcorp.com',
    tier: mockSponsorTier._id,
    contactInfo: {
      email: 'contact@techcorp.com',
      phone: '+55 11 99999-9999'
    },
    socialLinks: {
      linkedin: 'https://linkedin.com/company/techcorp',
      twitter: 'https://twitter.com/techcorp'
    },
    tags: ['Technology', 'SaaS'],
    isVisible: true,
    priority: 100,
    deletedAt: null,
    save: jest.fn().mockResolvedValue(this)
  };

  const mockSponsorModel = jest.fn().mockImplementation((dto) => ({
    ...mockSponsor,
    ...dto,
    save: jest.fn().mockResolvedValue({ ...mockSponsor, ...dto })
  })) as any;

  const mockSponsorTierModel = jest.fn().mockImplementation((dto) => ({
    ...mockSponsorTier,
    ...dto,
    save: jest.fn().mockResolvedValue({ ...mockSponsorTier, ...dto })
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SponsorsService,
        {
          provide: getModelToken(Sponsor.name),
          useValue: mockSponsorModel
        },
        {
          provide: getModelToken(SponsorTier.name),
          useValue: mockSponsorTierModel
        }
      ]
    }).compile();

    service = module.get<SponsorsService>(SponsorsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new sponsor', async () => {
      const createDto = {
        name: 'New Sponsor',
        description: {
          'pt-BR': 'Novo patrocinador',
          'en': 'New sponsor'
        },
        logoUrl: 'https://example.com/new-logo.png',
        websiteUrl: 'https://newsponsor.com',
        tier: mockSponsorTier._id,
        contactInfo: {
          email: 'contact@newsponsor.com'
        }
      };

      mockSponsorModel.findOne.mockResolvedValue(null);
      mockSponsorTierModel.findOne.mockResolvedValue(mockSponsorTier);
      mockSponsorModel.countDocuments.mockResolvedValue(0);

      const result = await service.createSponsor(createDto);

      expect(mockSponsorModel.findOne).toHaveBeenCalledWith({
        name: createDto.name,
        deletedAt: null
      });
      expect(mockSponsorTierModel.findOne).toHaveBeenCalledWith({
        _id: createDto.tier,
        isActive: true
      });
      expect(result).toBeDefined();
    });

    it('should throw ConflictException if sponsor already exists', async () => {
      const createDto = {
        name: 'Tech Corp',
        description: {
          'pt-BR': 'Empresa existente',
          'en': 'Existing company'
        },
        logoUrl: 'https://example.com/logo.png',
        websiteUrl: 'https://techcorp.com',
        tier: mockSponsorTier._id,
        contactInfo: {
          email: 'contact@techcorp.com'
        }
      };

      mockSponsorModel.findOne.mockResolvedValue(mockSponsor);

      await expect(service.createSponsor(createDto)).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if tier not found', async () => {
      const createDto = {
        name: 'New Sponsor',
        description: {
          'pt-BR': 'Novo patrocinador',
          'en': 'New sponsor'
        },
        logoUrl: 'https://example.com/logo.png',
        websiteUrl: 'https://newsponsor.com',
        tier: 'nonexistent-tier-id',
        contactInfo: {
          email: 'contact@newsponsor.com'
        }
      };

      mockSponsorModel.findOne.mockResolvedValue(null);
      mockSponsorTierModel.findOne.mockResolvedValue(null);

      await expect(service.createSponsor(createDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated sponsors', async () => {
      const filterDto = {
        page: 1,
        limit: 10,
        sort: '-priority'
      };

      const sponsors = [mockSponsor];
      mockSponsorModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(sponsors)
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
          hasPrev: false
        }
      });
    });

    it('should apply filters correctly', async () => {
      const filterDto = {
        page: 1,
        limit: 20,
        tier: 'Diamond',
        tags: ['Technology', 'SaaS']
      };

      mockSponsorModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      });
      mockSponsorModel.countDocuments.mockResolvedValue(0);

      await service.findAllSponsors(filterDto);

      expect(mockSponsorModel.find).toHaveBeenCalledWith({
        deletedAt: null,
        tier: 'Diamond',
        tags: { $in: ['Technology', 'SaaS'] }
      });
    });
  });

  describe('findById', () => {
    it('should return a sponsor by id', async () => {
      mockSponsorModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockSponsor)
      });

      const result = await service.findSponsorById('507f1f77bcf86cd799439013');

      expect(result).toEqual(mockSponsor);
      expect(mockSponsorModel.findOne).toHaveBeenCalledWith({
        _id: '507f1f77bcf86cd799439013',
        deletedAt: null
      });
    });

    it('should throw NotFoundException if sponsor not found', async () => {
      mockSponsorModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null)
      });

      await expect(service.findSponsorById('507f1f77bcf86cd799439013')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a sponsor', async () => {
      const updateDto = {
        websiteUrl: 'https://newtechcorp.com'
      };

      const existingSponsor = {
        ...mockSponsor,
        save: jest.fn().mockResolvedValue({ ...mockSponsor, ...updateDto })
      };

      mockSponsorModel.findOne
        .mockResolvedValueOnce(existingSponsor)
        .mockResolvedValueOnce(null);

      const result = await service.updateSponsor('507f1f77bcf86cd799439013', updateDto);

      expect(result).toBeDefined();
      expect(existingSponsor.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if sponsor not found', async () => {
      mockSponsorModel.findOne.mockResolvedValue(null);

      await expect(service.updateSponsor('507f1f77bcf86cd799439013', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete a sponsor', async () => {
      const sponsor = {
        ...mockSponsor,
        deletedAt: null as any,
        deleteReason: null as any,
        deletedBy: null as any,
        save: jest.fn().mockResolvedValue(mockSponsor)
      };

      mockSponsorModel.findOne.mockResolvedValue(sponsor);

      await service.removeSponsor('507f1f77bcf86cd799439013', 'Test reason', 'userId');

      expect(sponsor.deletedAt).toBeDefined();
      expect(sponsor.deleteReason).toBe('Test reason');
      expect(sponsor.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if sponsor not found', async () => {
      mockSponsorModel.findOne.mockResolvedValue(null);

      await expect(service.removeSponsor('507f1f77bcf86cd799439013')).rejects.toThrow(NotFoundException);
    });
  });

  describe('restore', () => {
    it('should restore a soft-deleted sponsor', async () => {
      const deletedSponsor = {
        ...mockSponsor,
        deletedAt: new Date(),
        deletedBy: 'userId',
        deleteReason: 'Test',
        save: jest.fn().mockResolvedValue(mockSponsor)
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

      await expect(service.restoreSponsor('507f1f77bcf86cd799439013')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByTier', () => {
    it('should return sponsors grouped by tier', async () => {
      const tierGroups = [
        {
          _id: mockSponsorTier._id,
          tier: mockSponsorTier,
          sponsors: [mockSponsor]
        }
      ];

      mockSponsorModel.aggregate.mockResolvedValue(tierGroups);

      const result = await service.findSponsorsByTier();

      expect(result).toEqual(tierGroups);
      expect(mockSponsorModel.aggregate).toHaveBeenCalled();
    });
  });

  describe('SponsorTier CRUD', () => {
    describe('createTier', () => {
      it('should create a new sponsor tier', async () => {
        const createTierDto = {
          name: 'Gold',
          description: {
            'pt-BR': 'Patrocinador Ouro',
            'en': 'Gold Sponsor'
          },
          priority: 2,
          benefits: ['Logo médio', 'Estande padrão'],
          maxSponsors: 5,
          price: 25000
        };

        mockSponsorTierModel.findOne.mockResolvedValue(null);

        const result = await service.createTier(createTierDto);

        expect(mockSponsorTierModel.findOne).toHaveBeenCalledWith({
          name: createTierDto.name
        });
        expect(result).toBeDefined();
      });

      it('should throw ConflictException if tier already exists', async () => {
        const createTierDto = {
          name: 'Diamond',
          description: {
            'pt-BR': 'Patrocinador Diamante',
            'en': 'Diamond Sponsor'
          },
          priority: 1,
          benefits: ['Logo principal'],
          maxSponsors: 3,
          price: 50000
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
          exec: jest.fn().mockResolvedValue(tiers)
        });

        const result = await service.findAllSponsorsTiers();

        expect(result).toEqual(tiers);
        expect(mockSponsorTierModel.find).toHaveBeenCalledWith({ isActive: true });
      });
    });

    describe('updateTier', () => {
      it('should update a sponsor tier', async () => {
        const updateTierDto = {
          price: 60000
        };

        const existingTier = {
          ...mockSponsorTier,
          save: jest.fn().mockResolvedValue({ ...mockSponsorTier, ...updateTierDto })
        };

        mockSponsorTierModel.findOne.mockResolvedValue(existingTier);

        const result = await service.updateSponsorTier('507f1f77bcf86cd799439014', updateTierDto);

        expect(result).toBeDefined();
        expect(existingTier.save).toHaveBeenCalled();
      });

      it('should throw NotFoundException if tier not found', async () => {
        mockSponsorTierModel.findOne.mockResolvedValue(null);

        await expect(service.updateSponsorTier('507f1f77bcf86cd799439014', {})).rejects.toThrow(NotFoundException);
      });
    });

    describe('deleteTier', () => {
      it('should delete a sponsor tier', async () => {
        const tier = {
          ...mockSponsorTier,
          isActive: true,
          save: jest.fn().mockResolvedValue({ ...mockSponsorTier, isActive: false })
        };

        mockSponsorTierModel.findOne.mockResolvedValue(tier);
        mockSponsorModel.countDocuments.mockResolvedValue(0);

        await service.removeTier('507f1f77bcf86cd799439014');

        expect(tier.isActive).toBe(false);
        expect(tier.save).toHaveBeenCalled();
      });

      it('should throw ConflictException if tier has sponsors', async () => {
        mockSponsorTierModel.findOne.mockResolvedValue(mockSponsorTier);
        mockSponsorModel.countDocuments.mockResolvedValue(1);

        await expect(service.removeTier('507f1f77bcf86cd799439014')).rejects.toThrow(ConflictException);
      });
    });
  });
});