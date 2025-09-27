import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { SystemConfigService } from '../../../../src/modules/system-config/system-config.service';
import { SystemConfig } from '../../../../src/modules/system-config/schemas/system-config.schema';
import { VisibilityAudit } from '../../../../src/modules/system-config/schemas/visibility-audit.schema';

describe('SystemConfigService', () => {
  let service: SystemConfigService;
  let mockConfigModel: any;
  let mockAuditModel: any;
  let mockCacheManager: any;

  beforeEach(async () => {
    // Create mock models
    mockConfigModel = {
      findOne: jest.fn().mockReturnThis(),
      exec: jest.fn(),
      save: jest.fn(),
      new: jest.fn(),
    };

    mockAuditModel = {
      find: jest.fn().mockReturnThis(),
      countDocuments: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn(),
      save: jest.fn(),
      new: jest.fn(),
    };

    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemConfigService,
        {
          provide: getModelToken(SystemConfig.name),
          useValue: mockConfigModel,
        },
        {
          provide: getModelToken(VisibilityAudit.name),
          useValue: mockAuditModel,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<SystemConfigService>(SystemConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getConfig', () => {
    it('should return cached config if available', async () => {
      const cachedConfig = {
        sections: {
          speakers: { isVisible: true },
          sponsors: { isVisible: false },
        },
      };
      mockCacheManager.get.mockResolvedValue(cachedConfig);

      const result = await service.getConfig();

      expect(result).toEqual(cachedConfig);
      expect(mockCacheManager.get).toHaveBeenCalledWith('system-config');
      expect(mockConfigModel.findOne).not.toHaveBeenCalled();
    });

    it('should create default config if none exists', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockConfigModel.exec.mockResolvedValue(null);

      const defaultConfig = {
        sections: {
          speakers: { isVisible: true, lastChanged: new Date(), changedBy: 'system' },
          sponsors: { isVisible: true, lastChanged: new Date(), changedBy: 'system' },
          sessions: { isVisible: true, lastChanged: new Date(), changedBy: 'system' },
          faq: { isVisible: true, lastChanged: new Date(), changedBy: 'system' },
          registration: { isVisible: true, lastChanged: new Date(), changedBy: 'system' },
          schedule: { isVisible: true, lastChanged: new Date(), changedBy: 'system' },
        },
        lastModifiedBy: 'system',
        version: 1,
        toObject: jest.fn().mockReturnThis(),
      };

      // Mock the constructor function
      const MockConfigConstructor = jest.fn().mockImplementation(() => ({
        ...defaultConfig,
        save: jest.fn().mockResolvedValue(defaultConfig),
      }));
      mockConfigModel.constructor = MockConfigConstructor;
      service['systemConfigModel'] = MockConfigConstructor as any;

      await service.getConfig();

      expect(mockCacheManager.get).toHaveBeenCalledWith('system-config');
      expect(mockCacheManager.set).toHaveBeenCalled();
    });
  });

  describe('getSectionVisibility', () => {
    it('should return visibility for a specific section', async () => {
      const mockConfig = {
        sections: {
          speakers: { isVisible: true, lastChanged: new Date(), changedBy: 'user1' },
          sponsors: { isVisible: false, lastChanged: new Date(), changedBy: 'user2' },
          sessions: { isVisible: true, lastChanged: new Date(), changedBy: 'user1' },
          faq: { isVisible: true, lastChanged: new Date(), changedBy: 'user1' },
          registration: { isVisible: true, lastChanged: new Date(), changedBy: 'user1' },
          schedule: { isVisible: true, lastChanged: new Date(), changedBy: 'user1' },
        },
      };
      mockCacheManager.get.mockResolvedValue(mockConfig);

      const result = await service.getSectionVisibility('speakers');

      expect(result).toEqual(mockConfig.sections.speakers);
    });
  });
});