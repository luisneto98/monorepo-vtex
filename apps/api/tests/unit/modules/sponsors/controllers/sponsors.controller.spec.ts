import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SponsorsController } from '../../../../../src/modules/sponsors/sponsors.controller';
import { SponsorsService } from '../../../../../src/modules/sponsors/sponsors.service';
import { JwtAuthGuard } from '../../../../../src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../../src/modules/auth/guards/roles.guard';
import { ThrottlerGuard } from '@nestjs/throttler';

describe('SponsorsController - Upload Logo', () => {
  let controller: SponsorsController;
  let sponsorsService: SponsorsService;

  const mockSponsorsService = {
    uploadLogo: jest.fn(),
  };

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SponsorsController],
      providers: [
        {
          provide: SponsorsService,
          useValue: mockSponsorsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<SponsorsController>(SponsorsController);
    sponsorsService = module.get<SponsorsService>(SponsorsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadLogo', () => {
    const sponsorId = '507f1f77bcf86cd799439011';
    const mockLogoUrl =
      'https://test-bucket.s3.us-east-1.amazonaws.com/sponsor-logos/12345-67890.jpg';

    it('should successfully upload logo and return logoUrl', async () => {
      mockSponsorsService.uploadLogo.mockResolvedValue(mockLogoUrl);

      const result = await controller.uploadLogo(sponsorId, mockFile);

      expect(sponsorsService.uploadLogo).toHaveBeenCalledWith(sponsorId, mockFile);
      expect(result).toEqual({
        success: true,
        data: { logoUrl: mockLogoUrl },
      });
    });

    it('should throw BadRequestException if no file is provided', async () => {
      await expect(controller.uploadLogo(sponsorId, undefined as any)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.uploadLogo(sponsorId, undefined as any)).rejects.toThrow(
        'No file provided',
      );

      expect(sponsorsService.uploadLogo).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if file is null', async () => {
      await expect(controller.uploadLogo(sponsorId, null as any)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.uploadLogo(sponsorId, null as any)).rejects.toThrow(
        'No file provided',
      );

      expect(sponsorsService.uploadLogo).not.toHaveBeenCalled();
    });

    it('should propagate NotFoundException from service (sponsor not found)', async () => {
      const nonExistentId = '507f1f77bcf86cd799439999';
      mockSponsorsService.uploadLogo.mockRejectedValue(
        new NotFoundException(`Sponsor with ID ${nonExistentId} not found`),
      );

      await expect(controller.uploadLogo(nonExistentId, mockFile)).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.uploadLogo(nonExistentId, mockFile)).rejects.toThrow(
        `Sponsor with ID ${nonExistentId} not found`,
      );

      expect(sponsorsService.uploadLogo).toHaveBeenCalledWith(nonExistentId, mockFile);
    });

    it('should propagate BadRequestException from service (invalid file type)', async () => {
      mockSponsorsService.uploadLogo.mockRejectedValue(
        new BadRequestException('Invalid file type. Only JPEG, PNG, WEBP files are allowed.'),
      );

      await expect(controller.uploadLogo(sponsorId, mockFile)).rejects.toThrow(BadRequestException);
      await expect(controller.uploadLogo(sponsorId, mockFile)).rejects.toThrow('Invalid file type');
    });

    it('should propagate BadRequestException from service (file too large)', async () => {
      mockSponsorsService.uploadLogo.mockRejectedValue(
        new BadRequestException('File size exceeds maximum allowed size of 5MB'),
      );

      await expect(controller.uploadLogo(sponsorId, mockFile)).rejects.toThrow(BadRequestException);
      await expect(controller.uploadLogo(sponsorId, mockFile)).rejects.toThrow(
        'File size exceeds maximum',
      );
    });

    it('should propagate BadRequestException from service (virus detected)', async () => {
      mockSponsorsService.uploadLogo.mockRejectedValue(
        new BadRequestException('Virus detected in uploaded file'),
      );

      await expect(controller.uploadLogo(sponsorId, mockFile)).rejects.toThrow(BadRequestException);
      await expect(controller.uploadLogo(sponsorId, mockFile)).rejects.toThrow('Virus detected');
    });

    it('should handle different file types (PNG)', async () => {
      const pngFile: Express.Multer.File = {
        ...mockFile,
        originalname: 'test-logo.png',
        mimetype: 'image/png',
      };

      mockSponsorsService.uploadLogo.mockResolvedValue(mockLogoUrl);

      const result = await controller.uploadLogo(sponsorId, pngFile);

      expect(sponsorsService.uploadLogo).toHaveBeenCalledWith(sponsorId, pngFile);
      expect(result.success).toBe(true);
      expect(result.data.logoUrl).toBe(mockLogoUrl);
    });

    it('should handle different file types (WebP)', async () => {
      const webpFile: Express.Multer.File = {
        ...mockFile,
        originalname: 'test-logo.webp',
        mimetype: 'image/webp',
      };

      mockSponsorsService.uploadLogo.mockResolvedValue(mockLogoUrl);

      const result = await controller.uploadLogo(sponsorId, webpFile);

      expect(sponsorsService.uploadLogo).toHaveBeenCalledWith(sponsorId, webpFile);
      expect(result.success).toBe(true);
      expect(result.data.logoUrl).toBe(mockLogoUrl);
    });

    it('should return proper response structure', async () => {
      mockSponsorsService.uploadLogo.mockResolvedValue(mockLogoUrl);

      const result = await controller.uploadLogo(sponsorId, mockFile);

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('logoUrl', mockLogoUrl);
    });

    it('should pass correct parameters to service', async () => {
      mockSponsorsService.uploadLogo.mockResolvedValue(mockLogoUrl);

      await controller.uploadLogo(sponsorId, mockFile);

      expect(sponsorsService.uploadLogo).toHaveBeenCalledTimes(1);
      expect(sponsorsService.uploadLogo).toHaveBeenCalledWith(sponsorId, mockFile);
    });

    it('should handle large valid files (under 5MB)', async () => {
      const largeFile: Express.Multer.File = {
        ...mockFile,
        size: 1024 * 1024 * 4.5, // 4.5MB
      };

      mockSponsorsService.uploadLogo.mockResolvedValue(mockLogoUrl);

      const result = await controller.uploadLogo(sponsorId, largeFile);

      expect(result.success).toBe(true);
      expect(sponsorsService.uploadLogo).toHaveBeenCalledWith(sponsorId, largeFile);
    });
  });
});
