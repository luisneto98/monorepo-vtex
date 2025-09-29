import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LegalPagesService } from '../legal-pages.service';
import { S3StorageService } from '../services/s3-storage.service';
import { VirusScannerService } from '../services/virus-scanner.service';
import { LegalPage, LegalPageDocument } from '../schemas/legal-page.schema';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SupportedLanguage } from '../dto/upload-file.dto';
import * as fs from 'fs';

jest.mock('fs');

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
  PutObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
  HeadObjectCommand: jest.fn(),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://s3.signed.url'),
}));

// Mock Config Service
jest.mock('@nestjs/config');

describe('LegalPagesService', () => {
  let service: LegalPagesService;
  let model: Model<LegalPageDocument>;

  const mockLegalPage = {
    _id: '123',
    slug: 'terms-of-use',
    type: 'terms',
    title: {
      pt: 'Termos de Uso',
      en: 'Terms of Use',
      es: 'Términos de Uso',
    },
    files: {
      pt: {
        filename: 'legal-123.pdf',
        originalName: 'terms.pdf',
        size: 1024,
        uploadedAt: new Date(),
        uploadedBy: 'user123',
      },
    },
    isActive: true,
    lastModifiedBy: '',
    save: jest.fn().mockResolvedValue(this),
  };


  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LegalPagesService,
        {
          provide: getModelToken(LegalPage.name),
          useValue: {
            new: jest.fn().mockResolvedValue(mockLegalPage),
            constructor: jest.fn().mockResolvedValue(mockLegalPage),
            find: jest.fn(),
            findOne: jest.fn(),
            findById: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            findByIdAndDelete: jest.fn(),
            exec: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: S3StorageService,
          useValue: {
            uploadFile: jest.fn(),
            deleteFile: jest.fn(),
            getFile: jest.fn(),
            generateFileKey: jest.fn().mockReturnValue('legal-pages/test/123.pdf'),
            getSignedDownloadUrl: jest.fn().mockResolvedValue('https://s3.url'),
          },
        },
        {
          provide: VirusScannerService,
          useValue: {
            scanFile: jest.fn().mockResolvedValue(true),
            quarantineFile: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LegalPagesService>(LegalPagesService);
    model = module.get<Model<LegalPageDocument>>(getModelToken(LegalPage.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new legal page', async () => {
      const createDto = {
        slug: 'privacy-policy',
        type: 'privacy' as any,
        title: { en: 'Privacy Policy' },
      };

      const saveSpy = jest.fn().mockResolvedValue(mockLegalPage);
      const mockConstructor = jest.fn(() => ({ save: saveSpy }));

      const mockModelWithConstructor = Object.assign(mockConstructor, {
        findOne: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      const mockS3Service = {
        uploadFile: jest.fn(),
        deleteFile: jest.fn(),
        getFile: jest.fn(),
        generateFileKey: jest.fn(),
      };
      const mockVirusScanner = {
        scanFile: jest.fn(),
      };

      const service = new LegalPagesService(
        mockModelWithConstructor as any,
        mockS3Service as any,
        mockVirusScanner as any
      );
      await service.create(createDto);

      expect(mockConstructor).toHaveBeenCalledWith(createDto);
      expect(saveSpy).toHaveBeenCalled();
    });

    it('should throw BadRequestException if slug already exists', async () => {
      const createDto = {
        slug: 'terms-of-use',
        type: 'terms' as any,
        title: { en: 'Terms' },
      };

      jest.spyOn(model, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockLegalPage),
      } as any);

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all legal pages', async () => {
      const mockPages = [mockLegalPage];
      jest.spyOn(model, 'find').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPages),
      } as any);

      const result = await service.findAll();
      expect(result).toEqual(mockPages);
      expect(model.find).toHaveBeenCalledWith({});
    });

    it('should filter by isActive when provided', async () => {
      const mockPages = [mockLegalPage];
      jest.spyOn(model, 'find').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPages),
      } as any);

      const result = await service.findAll(true);
      expect(result).toEqual(mockPages);
      expect(model.find).toHaveBeenCalledWith({ isActive: true });
    });
  });

  describe('findOne', () => {
    it('should return a legal page by id', async () => {
      jest.spyOn(model, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockLegalPage),
      } as any);

      const result = await service.findOne('123');
      expect(result).toEqual(mockLegalPage);
      expect(model.findById).toHaveBeenCalledWith('123');
    });

    it('should throw NotFoundException if page not found', async () => {
      jest.spyOn(model, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.findOne('456')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySlug', () => {
    it('should return a legal page by slug', async () => {
      jest.spyOn(model, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockLegalPage),
      } as any);

      const result = await service.findBySlug('terms-of-use');
      expect(result).toEqual(mockLegalPage);
      expect(model.findOne).toHaveBeenCalledWith({ slug: 'terms-of-use' });
    });

    it('should throw NotFoundException if page not found', async () => {
      jest.spyOn(model, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.findBySlug('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('uploadFile', () => {
    it('should upload a file and update the legal page', async () => {
      const file = {
        filename: 'new-file.pdf',
        originalname: 'document.pdf',
        size: 2048,
      } as Express.Multer.File;

      jest.spyOn(model, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockLegalPage),
      } as any);

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.unlinkSync as jest.Mock).mockImplementation(() => {});

      await service.uploadFile('123', file, SupportedLanguage.EN, 'user456');

      expect(mockLegalPage.save).toHaveBeenCalled();
      expect(mockLegalPage.files['en']).toBeDefined();
      expect(mockLegalPage.files['en']).toBeDefined();
    });
  });

  describe('getPublicPages', () => {
    it('should return formatted public pages', async () => {
      const mockPages = [
        {
          slug: 'terms-of-use',
          type: 'terms',
          title: { en: 'Terms of Use' },
          files: { en: {}, pt: {} },
        },
      ];

      jest.spyOn(model, 'find').mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockPages),
        }),
      } as any);

      const result = await service.getPublicPages();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('availableLanguages');
      expect(result[0].availableLanguages).toContain('en');
      expect(result[0].availableLanguages).toContain('pt');
    });
  });
});
