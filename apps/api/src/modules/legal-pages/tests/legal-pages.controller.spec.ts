import { Test, TestingModule } from '@nestjs/testing';
import { LegalPagesController } from '../legal-pages.controller';
import { LegalPagesService } from '../legal-pages.service';
import { CreateLegalPageDto } from '../dto/create-legal-page.dto';
import { UpdateLegalPageDto } from '../dto/update-legal-page.dto';
import { SupportedLanguage } from '../dto/upload-file.dto';
import { LegalPageType } from '../schemas/legal-page.schema';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { Readable } from 'stream';

describe('LegalPagesController', () => {
  let controller: LegalPagesController;
  let service: LegalPagesService;

  const mockLegalPage = {
    _id: '507f1f77bcf86cd799439011',
    slug: 'terms-of-use',
    type: LegalPageType.TERMS,
    title: {
      pt: 'Termos de Uso',
      en: 'Terms of Use',
      es: 'Términos de Uso',
    },
    files: {
      pt: {
        filename: 'legal-pages/terms-of-use/pt/123456789.pdf',
        originalName: 'termos.pdf',
        size: 1024000,
        uploadedAt: new Date(),
        uploadedBy: 'admin-user-id',
      },
    },
    isActive: true,
    lastModifiedBy: 'admin-user-id',
  };

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1024,
    buffer: Buffer.from('mock pdf content'),
    destination: '',
    filename: 'test.pdf',
    path: '',
    stream: new Readable(),
  };

  const mockRequest = {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      role: 'ADMIN',
    },
  };

  const mockLegalPagesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
    remove: jest.fn(),
    getPublicPages: jest.fn(),
    getFileStream: jest.fn(),
    getSignedDownloadUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LegalPagesController],
      providers: [
        {
          provide: LegalPagesService,
          useValue: mockLegalPagesService,
        },
      ],
    }).compile();

    controller = module.get<LegalPagesController>(LegalPagesController);
    service = module.get<LegalPagesService>(LegalPagesService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new legal page', async () => {
      const createDto: CreateLegalPageDto = {
        slug: 'privacy-policy',
        type: LegalPageType.PRIVACY,
        title: {
          pt: 'Política de Privacidade',
          en: 'Privacy Policy',
          es: 'Política de Privacidad',
        },
      };

      mockLegalPagesService.create.mockResolvedValue(mockLegalPage);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockLegalPage);
      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(service.create).toHaveBeenCalledTimes(1);
    });

    it('should handle creation errors', async () => {
      const createDto: CreateLegalPageDto = {
        slug: 'existing-slug',
        type: LegalPageType.TERMS,
        title: { en: 'Test' },
      };

      mockLegalPagesService.create.mockRejectedValue(
        new BadRequestException('Legal page with this slug already exists'),
      );

      await expect(controller.create(createDto)).rejects.toThrow(BadRequestException);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return all legal pages', async () => {
      const mockPages = [mockLegalPage];
      mockLegalPagesService.findAll.mockResolvedValue(mockPages);

      const result = await controller.findAll(undefined);

      expect(result).toEqual(mockPages);
      expect(service.findAll).toHaveBeenCalledWith(undefined);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('should filter by active status when provided', async () => {
      const mockActivePages = [mockLegalPage];
      mockLegalPagesService.findAll.mockResolvedValue(mockActivePages);

      const result = await controller.findAll('true');

      expect(result).toEqual(mockActivePages);
      expect(service.findAll).toHaveBeenCalledWith(true);
    });

    it('should filter by inactive status when provided', async () => {
      const mockInactivePages = [{ ...mockLegalPage, isActive: false }];
      mockLegalPagesService.findAll.mockResolvedValue(mockInactivePages);

      const result = await controller.findAll('false');

      expect(result).toEqual(mockInactivePages);
      expect(service.findAll).toHaveBeenCalledWith(false);
    });
  });

  describe('findOne', () => {
    it('should return a single legal page by ID', async () => {
      const id = '507f1f77bcf86cd799439011';
      mockLegalPagesService.findOne.mockResolvedValue(mockLegalPage);

      const result = await controller.findOne(id);

      expect(result).toEqual(mockLegalPage);
      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when page not found', async () => {
      const id = 'nonexistent';
      mockLegalPagesService.findOne.mockRejectedValue(
        new NotFoundException(`Legal page with ID ${id} not found`),
      );

      await expect(controller.findOne(id)).rejects.toThrow(NotFoundException);
      expect(service.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update a legal page', async () => {
      const id = '507f1f77bcf86cd799439011';
      const updateDto: UpdateLegalPageDto = {
        title: {
          pt: 'Termos Atualizados',
          en: 'Updated Terms',
        },
        isActive: false,
      };

      const updatedPage = { ...mockLegalPage, ...updateDto };
      mockLegalPagesService.update.mockResolvedValue(updatedPage);

      const result = await controller.update(id, updateDto, mockRequest);

      expect(result).toEqual(updatedPage);
      expect(service.update).toHaveBeenCalledWith(id, updateDto, mockRequest.user.id);
      expect(service.update).toHaveBeenCalledTimes(1);
    });

    it('should handle update errors', async () => {
      const id = 'nonexistent';
      const updateDto: UpdateLegalPageDto = { isActive: false };

      mockLegalPagesService.update.mockRejectedValue(
        new NotFoundException(`Legal page with ID ${id} not found`),
      );

      await expect(controller.update(id, updateDto, mockRequest)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.update).toHaveBeenCalledWith(id, updateDto, mockRequest.user.id);
    });
  });

  describe('uploadFile', () => {
    it('should upload a file for a legal page', async () => {
      const id = '507f1f77bcf86cd799439011';
      const language = SupportedLanguage.PT;

      mockLegalPagesService.uploadFile.mockResolvedValue(mockLegalPage);

      const result = await controller.uploadFile(id, mockFile, language, mockRequest);

      expect(result).toEqual(mockLegalPage);
      expect(service.uploadFile).toHaveBeenCalledWith(id, mockFile, language, mockRequest.user.id);
      expect(service.uploadFile).toHaveBeenCalledTimes(1);
    });

    it('should handle upload errors', async () => {
      const id = 'nonexistent';
      const language = SupportedLanguage.EN;

      mockLegalPagesService.uploadFile.mockRejectedValue(
        new NotFoundException(`Legal page with ID ${id} not found`),
      );

      await expect(
        controller.uploadFile(id, mockFile, language, mockRequest),
      ).rejects.toThrow(NotFoundException);
      expect(service.uploadFile).toHaveBeenCalledWith(id, mockFile, language, mockRequest.user.id);
    });
  });

  describe('deleteFile', () => {
    it('should delete a file for a specific language', async () => {
      const id = '507f1f77bcf86cd799439011';
      const language = SupportedLanguage.PT;

      const updatedPage = {
        ...mockLegalPage,
        files: {},
      };
      mockLegalPagesService.deleteFile.mockResolvedValue(updatedPage);

      const result = await controller.deleteFile(id, language, mockRequest);

      expect(result).toEqual(updatedPage);
      expect(service.deleteFile).toHaveBeenCalledWith(id, language, mockRequest.user.id);
      expect(service.deleteFile).toHaveBeenCalledTimes(1);
    });

    it('should handle delete file errors', async () => {
      const id = '507f1f77bcf86cd799439011';
      const language = SupportedLanguage.ES;

      mockLegalPagesService.deleteFile.mockRejectedValue(
        new NotFoundException(`No file found for language ${language}`),
      );

      await expect(controller.deleteFile(id, language, mockRequest)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.deleteFile).toHaveBeenCalledWith(id, language, mockRequest.user.id);
    });
  });

  describe('remove', () => {
    it('should remove a legal page', async () => {
      const id = '507f1f77bcf86cd799439011';

      mockLegalPagesService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(id);

      expect(result).toEqual({ message: 'Legal page deleted successfully' });
      expect(service.remove).toHaveBeenCalledWith(id);
      expect(service.remove).toHaveBeenCalledTimes(1);
    });

    it('should handle removal errors', async () => {
      const id = 'nonexistent';

      mockLegalPagesService.remove.mockRejectedValue(
        new NotFoundException(`Legal page with ID ${id} not found`),
      );

      await expect(controller.remove(id)).rejects.toThrow(NotFoundException);
      expect(service.remove).toHaveBeenCalledWith(id);
    });
  });

  describe('getPublicPages', () => {
    it('should return public legal pages', async () => {
      const publicPages = [
        {
          slug: 'terms-of-use',
          type: LegalPageType.TERMS,
          title: mockLegalPage.title,
          availableLanguages: ['pt'],
        },
      ];

      mockLegalPagesService.getPublicPages.mockResolvedValue(publicPages);

      const result = await controller.getPublicPages();

      expect(result).toEqual(publicPages);
      expect(service.getPublicPages).toHaveBeenCalledWith();
      expect(service.getPublicPages).toHaveBeenCalledTimes(1);
    });
  });

  describe('downloadFile', () => {
    it('should stream a file for download', async () => {
      const slug = 'terms-of-use';
      const language = SupportedLanguage.PT;
      const mockStream = new Readable();
      const mockMetadata = {
        filename: 'test.pdf',
        originalName: 'terms.pdf',
        size: 1024000,
        uploadedAt: new Date(),
        uploadedBy: 'admin-user-id',
      };

      mockLegalPagesService.getFileStream.mockResolvedValue({
        stream: mockStream,
        metadata: mockMetadata,
      });

      const mockResponse = {
        set: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      mockStream.pipe = jest.fn();

      await controller.downloadFile(slug, language, mockResponse);

      expect(service.getFileStream).toHaveBeenCalledWith(slug, language);
      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${mockMetadata.originalName}"`,
        'Content-Length': mockMetadata.size.toString(),
      });
      expect(mockStream.pipe).toHaveBeenCalledWith(mockResponse);
    });

    it('should handle download errors', async () => {
      const slug = 'nonexistent';
      const language = SupportedLanguage.EN;

      mockLegalPagesService.getFileStream.mockRejectedValue(
        new NotFoundException(`Legal page with slug ${slug} not found`),
      );

      const mockResponse = {
        set: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await controller.downloadFile(slug, language, mockResponse);

      expect(service.getFileStream).toHaveBeenCalledWith(slug, language);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: `Legal page with slug ${slug} not found`,
      });
    });
  });

  describe('getDownloadUrl', () => {
    it('should return a signed download URL', async () => {
      const slug = 'privacy-policy';
      const language = SupportedLanguage.EN;
      const mockResult = {
        url: 'https://s3.amazonaws.com/signed-url',
        metadata: {
          filename: 'privacy.pdf',
          originalName: 'privacy-policy.pdf',
          size: 512000,
          uploadedAt: new Date(),
          uploadedBy: 'admin-user-id',
        },
      };

      mockLegalPagesService.getSignedDownloadUrl.mockResolvedValue(mockResult);

      const result = await controller.getDownloadUrl(slug, language);

      expect(result).toEqual(mockResult);
      expect(service.getSignedDownloadUrl).toHaveBeenCalledWith(slug, language);
      expect(service.getSignedDownloadUrl).toHaveBeenCalledTimes(1);
    });

    it('should handle signed URL generation errors', async () => {
      const slug = 'nonexistent';
      const language = SupportedLanguage.ES;

      mockLegalPagesService.getSignedDownloadUrl.mockRejectedValue(
        new NotFoundException('This legal page is not available'),
      );

      await expect(controller.getDownloadUrl(slug, language)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.getSignedDownloadUrl).toHaveBeenCalledWith(slug, language);
    });
  });
});