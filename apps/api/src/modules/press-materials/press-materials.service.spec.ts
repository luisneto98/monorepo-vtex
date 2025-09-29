import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PressMaterialsService } from './press-materials.service';
import { FileUploadService } from './services/file-upload.service';
import { ThumbnailService } from './services/thumbnail.service';
import { DownloadTrackingService } from './services/download-tracking.service';
import { PressMaterial } from './schemas/press-material.schema';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('PressMaterialsService', () => {
  let service: PressMaterialsService;
  let mockPressMaterialModel: any;
  let mockFileUploadService: any;
  let mockThumbnailService: any;
  let mockDownloadTrackingService: any;

  const mockPressMaterial = {
    _id: '123',
    type: 'photo',
    title: { pt: 'Teste', en: 'Test', es: 'Prueba' },
    description: { pt: 'Descrição', en: 'Description', es: 'Descripción' },
    fileUrl: 'https://s3.amazonaws.com/test.jpg',
    thumbnailUrl: 'https://s3.amazonaws.com/test_thumb.jpg',
    metadata: { size: 1024, format: 'jpg' },
    tags: ['test'],
    status: 'published',
    accessLevel: 'public',
    downloadCount: 0,
    uploadedBy: 'user123',
    save: jest.fn(),
    deleteOne: jest.fn(),
  };

  beforeEach(async () => {
    mockPressMaterialModel = {
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      countDocuments: jest.fn(),
      aggregate: jest.fn(),
      distinct: jest.fn(),
    };

    mockFileUploadService = {
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
      generateSignedUrl: jest.fn(),
    };

    mockThumbnailService = {
      generateThumbnail: jest.fn(),
    };

    mockDownloadTrackingService = {
      trackDownload: jest.fn(),
      getDownloadStatistics: jest.fn(),
      getTopDownloadedMaterials: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PressMaterialsService,
        {
          provide: getModelToken(PressMaterial.name),
          useValue: mockPressMaterialModel,
        },
        {
          provide: FileUploadService,
          useValue: mockFileUploadService,
        },
        {
          provide: ThumbnailService,
          useValue: mockThumbnailService,
        },
        {
          provide: DownloadTrackingService,
          useValue: mockDownloadTrackingService,
        },
      ],
    }).compile();

    service = module.get<PressMaterialsService>(PressMaterialsService);
  });

  describe('create', () => {
    it('should create a new press material', async () => {
      const dto = {
        type: 'photo' as const,
        title: { pt: 'Teste', en: 'Test', es: 'Prueba' },
      };
      const file = {
        buffer: Buffer.from('test'),
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
      } as Express.Multer.File;

      mockFileUploadService.uploadFile.mockResolvedValue({
        fileUrl: 'https://s3.amazonaws.com/test.jpg',
        metadata: { size: 1024, format: 'jpg' },
      });
      mockThumbnailService.generateThumbnail.mockResolvedValue(
        'https://s3.amazonaws.com/test_thumb.jpg',
      );

      const saveMock = jest.fn().mockResolvedValue(mockPressMaterial);
      mockPressMaterialModel.mockImplementation(() => ({
        ...mockPressMaterial,
        save: saveMock,
      }));

      const result = await service.create(dto, file, 'user123');

      expect(mockFileUploadService.uploadFile).toHaveBeenCalledWith(file, 'photo', 'user123');
      expect(mockThumbnailService.generateThumbnail).toHaveBeenCalled();
      expect(saveMock).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('findOne', () => {
    it('should find a press material by id', async () => {
      mockPressMaterialModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockPressMaterial),
      });

      const result = await service.findOne('123');

      expect(mockPressMaterialModel.findById).toHaveBeenCalledWith('123');
      expect(result).toEqual(mockPressMaterial);
    });

    it('should throw NotFoundException if material not found', async () => {
      mockPressMaterialModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findPublic', () => {
    it('should return only published and public materials', async () => {
      const publicMaterials = [mockPressMaterial];
      mockPressMaterialModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(publicMaterials),
      });

      const result = await service.findPublic();

      expect(mockPressMaterialModel.find).toHaveBeenCalledWith({
        status: 'published',
        accessLevel: 'public',
      });
      expect(result).toEqual(publicMaterials);
    });
  });

  describe('getDownloadUrl', () => {
    it('should track download and return URL for public materials', async () => {
      mockPressMaterialModel.findById.mockResolvedValue(mockPressMaterial);

      const result = await service.getDownloadUrl('123', '192.168.1.1', 'Mozilla/5.0', 'user123');

      expect(mockDownloadTrackingService.trackDownload).toHaveBeenCalledWith(
        '123',
        '192.168.1.1',
        'Mozilla/5.0',
        'user123',
      );
      expect(result).toBe(mockPressMaterial.fileUrl);
    });

    it('should throw ForbiddenException for restricted materials without auth', async () => {
      const restrictedMaterial = {
        ...mockPressMaterial,
        accessLevel: 'restricted',
      };
      mockPressMaterialModel.findById.mockResolvedValue(restrictedMaterial);

      await expect(service.getDownloadUrl('123', '192.168.1.1', 'Mozilla/5.0')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should generate signed URL for restricted materials with auth', async () => {
      const restrictedMaterial = {
        ...mockPressMaterial,
        accessLevel: 'restricted',
      };
      mockPressMaterialModel.findById.mockResolvedValue(restrictedMaterial);
      mockFileUploadService.generateSignedUrl.mockResolvedValue(
        'https://s3.amazonaws.com/signed-url',
      );

      const result = await service.getDownloadUrl('123', '192.168.1.1', 'Mozilla/5.0', 'user123');

      expect(mockFileUploadService.generateSignedUrl).toHaveBeenCalledWith(
        restrictedMaterial.fileUrl,
      );
      expect(result).toBe('https://s3.amazonaws.com/signed-url');
    });
  });

  describe('remove', () => {
    it('should delete material and its files', async () => {
      mockPressMaterialModel.findById.mockResolvedValue(mockPressMaterial);

      await service.remove('123');

      expect(mockFileUploadService.deleteFile).toHaveBeenCalledWith(mockPressMaterial.fileUrl);
      expect(mockFileUploadService.deleteFile).toHaveBeenCalledWith(mockPressMaterial.thumbnailUrl);
      expect(mockPressMaterial.deleteOne).toHaveBeenCalled();
    });
  });
});
