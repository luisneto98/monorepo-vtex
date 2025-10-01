import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { StorageService } from '../../../../src/modules/storage/services/storage.service';
import { StorageConfigService } from '../../../../src/modules/storage/services/storage-config.service';
import { VirusScannerService } from '../../../../src/modules/storage/services/virus-scanner.service';
import { FileCategory } from '../../../../src/modules/storage/types/storage.types';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');

describe('StorageService', () => {
  let service: StorageService;
  let virusScannerService: VirusScannerService;
  let mockS3Send: jest.Mock;

  const mockStorageConfigService = {
    getAwsRegion: jest.fn().mockReturnValue('us-east-1'),
    getAwsBucket: jest.fn().mockReturnValue('test-bucket'),
    getAwsAccessKeyId: jest.fn().mockReturnValue('test-access-key'),
    getAwsSecretAccessKey: jest.fn().mockReturnValue('test-secret-key'),
  };

  const mockVirusScannerService = {
    scanFile: jest.fn().mockResolvedValue(undefined),
  };

  // Helper to create mock file
  const createMockFile = (
    buffer: Buffer,
    mimetype: string,
    size: number,
    originalname = 'test.jpg',
  ): Express.Multer.File => ({
    buffer,
    mimetype,
    size,
    originalname,
    fieldname: 'file',
    encoding: '7bit',
    destination: '',
    filename: '',
    path: '',
    stream: new Readable(),
  });

  beforeEach(async () => {
    // Mock S3Client
    mockS3Send = jest.fn().mockResolvedValue({});
    (S3Client as jest.Mock).mockImplementation(() => ({
      send: mockS3Send,
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: StorageConfigService,
          useValue: mockStorageConfigService,
        },
        {
          provide: VirusScannerService,
          useValue: mockVirusScannerService,
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
    virusScannerService = module.get<VirusScannerService>(VirusScannerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    it('should successfully upload a valid JPEG image', async () => {
      // JPEG magic bytes: FF D8 FF
      const jpegBuffer = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(100, 'a')]);
      const file = createMockFile(jpegBuffer, 'image/jpeg', jpegBuffer.length);

      const result = await service.uploadFile(file, FileCategory.SPEAKER_PHOTOS);

      expect(result).toHaveProperty('key');
      expect(result).toHaveProperty('url');
      expect(result.key).toContain('speaker-photos/');
      expect(result.url).toContain('https://test-bucket.s3.us-east-1.amazonaws.com');
      expect(virusScannerService.scanFile).toHaveBeenCalledWith(
        file.buffer,
        file.originalname,
        file.mimetype,
      );
      expect(mockS3Send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
    });

    it('should successfully upload a valid PNG image', async () => {
      // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
      const pngBuffer = Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        Buffer.alloc(100, 'b'),
      ]);
      const file = createMockFile(pngBuffer, 'image/png', pngBuffer.length, 'test.png');

      const result = await service.uploadFile(file, FileCategory.SPEAKER_PHOTOS);

      expect(result).toBeDefined();
      expect(result.key).toContain('speaker-photos/');
      expect(mockS3Send).toHaveBeenCalled();
    });

    it('should successfully upload a valid WebP image', async () => {
      // WebP magic bytes: RIFF [4 bytes] WEBP
      const webpBuffer = Buffer.concat([
        Buffer.from([0x52, 0x49, 0x46, 0x46]), // RIFF
        Buffer.alloc(4, 0), // File size placeholder
        Buffer.from('WEBP', 'ascii'), // WEBP marker
        Buffer.alloc(100, 'c'),
      ]);
      const file = createMockFile(webpBuffer, 'image/webp', webpBuffer.length, 'test.webp');

      const result = await service.uploadFile(file, FileCategory.SPEAKER_PHOTOS);

      expect(result).toBeDefined();
      expect(result.key).toContain('speaker-photos/');
    });

    it('should successfully upload a valid PDF for legal documents', async () => {
      // PDF magic bytes: %PDF
      const pdfBuffer = Buffer.concat([
        Buffer.from([0x25, 0x50, 0x44, 0x46]),
        Buffer.alloc(100, 'd'),
      ]);
      const file = createMockFile(pdfBuffer, 'application/pdf', pdfBuffer.length, 'legal.pdf');

      const result = await service.uploadFile(file, FileCategory.LEGAL_DOCUMENTS);

      expect(result).toBeDefined();
      expect(result.key).toContain('legal-documents/');
    });

    it('should skip virus scanning when scanForVirus is false', async () => {
      const jpegBuffer = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(100, 'a')]);
      const file = createMockFile(jpegBuffer, 'image/jpeg', jpegBuffer.length);

      await service.uploadFile(file, FileCategory.SPEAKER_PHOTOS, { scanForVirus: false });

      expect(virusScannerService.scanFile).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when file is empty', async () => {
      const file = createMockFile(Buffer.alloc(0), 'image/jpeg', 0);

      await expect(service.uploadFile(file, FileCategory.SPEAKER_PHOTOS)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadFile(file, FileCategory.SPEAKER_PHOTOS)).rejects.toThrow(
        'No file provided or file is empty',
      );
    });

    it('should throw BadRequestException when file size exceeds limit', async () => {
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024, 'x'); // 6MB
      const file = createMockFile(largeBuffer, 'image/jpeg', largeBuffer.length);

      await expect(service.uploadFile(file, FileCategory.SPEAKER_PHOTOS)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadFile(file, FileCategory.SPEAKER_PHOTOS)).rejects.toThrow(
        'File size exceeds maximum allowed size of 5MB',
      );
    });

    it('should throw BadRequestException for invalid file type', async () => {
      const pdfBuffer = Buffer.concat([
        Buffer.from([0x25, 0x50, 0x44, 0x46]),
        Buffer.alloc(100, 'd'),
      ]);
      const file = createMockFile(pdfBuffer, 'application/pdf', pdfBuffer.length, 'doc.pdf');

      await expect(service.uploadFile(file, FileCategory.SPEAKER_PHOTOS)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadFile(file, FileCategory.SPEAKER_PHOTOS)).rejects.toThrow(
        'Invalid file type. Only JPEG, PNG, WEBP files are allowed',
      );
    });

    it('should throw BadRequestException when magic bytes do not match MIME type', async () => {
      // PNG magic bytes but claiming to be JPEG
      const fakeMagicBytes = Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        Buffer.alloc(100, 'b'),
      ]);
      const file = createMockFile(fakeMagicBytes, 'image/jpeg', fakeMagicBytes.length);

      await expect(service.uploadFile(file, FileCategory.SPEAKER_PHOTOS)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadFile(file, FileCategory.SPEAKER_PHOTOS)).rejects.toThrow(
        'File content does not match declared file type',
      );
    });

    it('should throw BadRequestException when virus is detected', async () => {
      const jpegBuffer = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(100, 'a')]);
      const file = createMockFile(jpegBuffer, 'image/jpeg', jpegBuffer.length);

      mockVirusScannerService.scanFile.mockRejectedValueOnce(
        new BadRequestException('File failed security scan and was rejected'),
      );

      await expect(service.uploadFile(file, FileCategory.SPEAKER_PHOTOS)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadFile(file, FileCategory.SPEAKER_PHOTOS)).rejects.toThrow(
        'File failed security scan and was rejected',
      );
    });

    it('should throw InternalServerErrorException when S3 upload fails', async () => {
      const jpegBuffer = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(100, 'a')]);
      const file = createMockFile(jpegBuffer, 'image/jpeg', jpegBuffer.length);

      mockS3Send.mockRejectedValue(new Error('S3 connection error'));

      await expect(service.uploadFile(file, FileCategory.SPEAKER_PHOTOS)).rejects.toThrow(
        'Failed to upload file to storage',
      );
    });

    it('should include custom metadata in S3 upload', async () => {
      const jpegBuffer = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(100, 'a')]);
      const file = createMockFile(jpegBuffer, 'image/jpeg', jpegBuffer.length);
      const metadata = { uploadedBy: 'user123', category: 'profile' };

      await service.uploadFile(file, FileCategory.SPEAKER_PHOTOS, { metadata });

      expect(mockS3Send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
    });
  });

  describe('validateFile', () => {
    it('should validate a correct file successfully', async () => {
      const jpegBuffer = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(100, 'a')]);
      const file = createMockFile(jpegBuffer, 'image/jpeg', jpegBuffer.length);

      const result = await service.validateFile(file, {
        maxSizeBytes: 5 * 1024 * 1024,
        allowedMimeTypes: ['image/jpeg'],
        validateMagicBytes: true,
      });

      expect(result).toBe(true);
    });

    it('should throw error for missing file', async () => {
      await expect(
        service.validateFile(null as any, {
          maxSizeBytes: 5 * 1024 * 1024,
          allowedMimeTypes: ['image/jpeg'],
          validateMagicBytes: true,
        }),
      ).rejects.toThrow('No file provided or file is empty');
    });

    it('should throw error for file exceeding size limit', async () => {
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024, 'x');
      const file = createMockFile(largeBuffer, 'image/jpeg', largeBuffer.length);

      await expect(
        service.validateFile(file, {
          maxSizeBytes: 5 * 1024 * 1024,
          allowedMimeTypes: ['image/jpeg'],
          validateMagicBytes: false,
        }),
      ).rejects.toThrow('File size exceeds maximum allowed size of 5MB');
    });

    it('should throw error for disallowed MIME type', async () => {
      const buffer = Buffer.alloc(100, 'a');
      const file = createMockFile(buffer, 'application/pdf', buffer.length);

      await expect(
        service.validateFile(file, {
          maxSizeBytes: 5 * 1024 * 1024,
          allowedMimeTypes: ['image/jpeg', 'image/png'],
          validateMagicBytes: false,
        }),
      ).rejects.toThrow('Invalid file type. Only JPEG, PNG files are allowed');
    });

    it('should throw error when magic bytes validation fails', async () => {
      // Wrong magic bytes for JPEG
      const wrongMagicBytes = Buffer.concat([
        Buffer.from([0x00, 0x00, 0x00]),
        Buffer.alloc(100, 'a'),
      ]);
      const file = createMockFile(wrongMagicBytes, 'image/jpeg', wrongMagicBytes.length);

      await expect(
        service.validateFile(file, {
          maxSizeBytes: 5 * 1024 * 1024,
          allowedMimeTypes: ['image/jpeg'],
          validateMagicBytes: true,
        }),
      ).rejects.toThrow('File content does not match declared file type');
    });
  });

  describe('deleteFile', () => {
    it('should successfully delete a file from S3', async () => {
      const key = 'speaker-photos/12345-67890.jpg';

      await service.deleteFile(key);

      expect(mockS3Send).toHaveBeenCalledWith(expect.any(DeleteObjectCommand));
    });

    it('should not throw error when S3 delete fails (swallow error)', async () => {
      const key = 'speaker-photos/nonexistent.jpg';
      mockS3Send.mockRejectedValueOnce(new Error('File not found'));

      await expect(service.deleteFile(key)).resolves.not.toThrow();
    });
  });

  describe('getSignedUrl', () => {
    it('should generate a signed URL for a file', async () => {
      const key = 'speaker-photos/12345-67890.jpg';
      const mockSignedUrl = 'https://test-bucket.s3.amazonaws.com/signed-url';

      (getSignedUrl as jest.Mock).mockResolvedValue(mockSignedUrl);

      const result = await service.getSignedUrl(key);

      expect(result).toBe(mockSignedUrl);
      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.anything(), // S3Client instance
        expect.any(GetObjectCommand),
        { expiresIn: 3600 },
      );
    });

    it('should use custom expiration time', async () => {
      const key = 'speaker-photos/12345-67890.jpg';
      const mockSignedUrl = 'https://test-bucket.s3.amazonaws.com/signed-url';
      const customExpiry = 7200;

      (getSignedUrl as jest.Mock).mockResolvedValue(mockSignedUrl);

      await service.getSignedUrl(key, customExpiry);

      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.anything(), // S3Client instance
        expect.any(GetObjectCommand),
        { expiresIn: customExpiry },
      );
    });

    it('should throw InternalServerErrorException when signing fails', async () => {
      const key = 'speaker-photos/12345-67890.jpg';

      (getSignedUrl as jest.Mock).mockRejectedValue(new Error('Signing failed'));

      await expect(service.getSignedUrl(key)).rejects.toThrow(InternalServerErrorException);
      await expect(service.getSignedUrl(key)).rejects.toThrow('Failed to generate download URL');
    });
  });

  describe('getFile', () => {
    it('should retrieve a file from S3', async () => {
      const key = 'speaker-photos/12345-67890.jpg';
      const mockStream = new Readable();

      mockS3Send.mockResolvedValueOnce({ Body: mockStream });

      const result = await service.getFile(key);

      expect(result).toBe(mockStream);
      expect(mockS3Send).toHaveBeenCalledWith(expect.any(GetObjectCommand));
    });

    it('should throw InternalServerErrorException when retrieval fails', async () => {
      const key = 'speaker-photos/nonexistent.jpg';

      mockS3Send.mockRejectedValue(new Error('File not found'));

      await expect(service.getFile(key)).rejects.toThrow('Failed to retrieve file from storage');
    });
  });

  describe('getFileMetadata', () => {
    it('should retrieve file metadata from S3', async () => {
      const key = 'speaker-photos/12345-67890.jpg';

      mockS3Send.mockResolvedValueOnce({
        ContentLength: 1024,
        ContentType: 'image/jpeg',
      });

      const result = await service.getFileMetadata(key);

      expect(result).toEqual({
        size: 1024,
        contentType: 'image/jpeg',
      });
      expect(mockS3Send).toHaveBeenCalledWith(expect.any(HeadObjectCommand));
    });

    it('should use default values when metadata is missing', async () => {
      const key = 'speaker-photos/12345-67890.jpg';

      mockS3Send.mockResolvedValueOnce({});

      const result = await service.getFileMetadata(key);

      expect(result).toEqual({
        size: 0,
        contentType: 'application/octet-stream',
      });
    });

    it('should throw InternalServerErrorException when metadata retrieval fails', async () => {
      const key = 'speaker-photos/nonexistent.jpg';

      mockS3Send.mockRejectedValue(new Error('File not found'));

      await expect(service.getFileMetadata(key)).rejects.toThrow(
        'Failed to retrieve file metadata',
      );
    });
  });
});
