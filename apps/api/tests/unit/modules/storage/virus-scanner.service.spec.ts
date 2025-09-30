import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { VirusScannerService } from '../../../../src/modules/storage/services/virus-scanner.service';
import { StorageConfigService } from '../../../../src/modules/storage/services/storage-config.service';

describe('VirusScannerService', () => {
  let service: VirusScannerService;

  const mockStorageConfigService = {
    isVirusScanningEnabled: jest.fn().mockReturnValue(true),
    getClamAvHost: jest.fn().mockReturnValue(null),
    getClamAvPort: jest.fn().mockReturnValue(3310),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VirusScannerService,
        {
          provide: StorageConfigService,
          useValue: mockStorageConfigService,
        },
      ],
    }).compile();

    service = module.get<VirusScannerService>(VirusScannerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('scanFile', () => {
    it('should skip scanning when virus scanning is disabled', async () => {
      mockStorageConfigService.isVirusScanningEnabled.mockReturnValueOnce(false);

      const cleanFile = Buffer.alloc(1000, 'a');
      const result = await service.scanFile(cleanFile, 'clean.jpg', 'image/jpeg');

      expect(result).toBe(true);
    });

    it('should pass a clean JPEG file through heuristic scanning', async () => {
      // JPEG magic bytes + clean content
      const cleanJpeg = Buffer.concat([
        Buffer.from([0xff, 0xd8, 0xff]),
        Buffer.alloc(1000, 'a'),
      ]);

      const result = await service.scanFile(cleanJpeg, 'clean.jpg', 'image/jpeg');

      expect(result).toBe(true);
    });

    it('should pass a clean PNG file through heuristic scanning', async () => {
      // PNG magic bytes + clean content
      const cleanPng = Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        Buffer.alloc(1000, 'b'),
      ]);

      const result = await service.scanFile(cleanPng, 'clean.png', 'image/png');

      expect(result).toBe(true);
    });

    it('should pass a clean PDF file through heuristic scanning', async () => {
      // PDF magic bytes + clean content
      const cleanPdf = Buffer.concat([
        Buffer.from([0x25, 0x50, 0x44, 0x46]), // %PDF
        Buffer.alloc(2000, 'c'),
      ]);

      const result = await service.scanFile(cleanPdf, 'clean.pdf', 'application/pdf');

      expect(result).toBe(true);
    });

    it('should reject a file that is too small (<100 bytes)', async () => {
      const tinyFile = Buffer.alloc(50, 'a');

      await expect(service.scanFile(tinyFile, 'tiny.jpg', 'image/jpeg')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.scanFile(tinyFile, 'tiny.jpg', 'image/jpeg')).rejects.toThrow(
        'File tiny.jpg is too small to be valid',
      );
    });

    it('should reject an image with embedded script tags', async () => {
      const maliciousImage = Buffer.concat([
        Buffer.from([0xff, 0xd8, 0xff]), // JPEG magic bytes
        Buffer.from('<script>alert("xss")</script>'),
        Buffer.alloc(500, 'a'),
      ]);

      await expect(
        service.scanFile(maliciousImage, 'malicious.jpg', 'image/jpeg'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.scanFile(maliciousImage, 'malicious.jpg', 'image/jpeg'),
      ).rejects.toThrow('contains suspicious content and was rejected');
    });

    it('should reject an image with javascript: protocol', async () => {
      const maliciousImage = Buffer.concat([
        Buffer.from([0xff, 0xd8, 0xff]),
        Buffer.from('javascript:void(0)'),
        Buffer.alloc(500, 'a'),
      ]);

      await expect(
        service.scanFile(maliciousImage, 'malicious.jpg', 'image/jpeg'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject an image with onerror= attribute', async () => {
      const maliciousImage = Buffer.concat([
        Buffer.from([0xff, 0xd8, 0xff]),
        Buffer.from('<img onerror="alert(1)">'),
        Buffer.alloc(500, 'a'),
      ]);

      await expect(
        service.scanFile(maliciousImage, 'malicious.jpg', 'image/jpeg'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject an image with onload= attribute', async () => {
      const maliciousImage = Buffer.concat([
        Buffer.from([0xff, 0xd8, 0xff]),
        Buffer.from('<body onload="evil()">'),
        Buffer.alloc(500, 'a'),
      ]);

      await expect(
        service.scanFile(maliciousImage, 'malicious.jpg', 'image/jpeg'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject an image with iframe tag', async () => {
      const maliciousImage = Buffer.concat([
        Buffer.from([0xff, 0xd8, 0xff]),
        Buffer.from('<iframe src="evil.com"></iframe>'),
        Buffer.alloc(500, 'a'),
      ]);

      await expect(
        service.scanFile(maliciousImage, 'malicious.jpg', 'image/jpeg'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject an image with object tag', async () => {
      const maliciousImage = Buffer.concat([
        Buffer.from([0xff, 0xd8, 0xff]),
        Buffer.from('<object data="evil.swf"></object>'),
        Buffer.alloc(500, 'a'),
      ]);

      await expect(
        service.scanFile(maliciousImage, 'malicious.jpg', 'image/jpeg'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject an image with embed tag', async () => {
      const maliciousImage = Buffer.concat([
        Buffer.from([0xff, 0xd8, 0xff]),
        Buffer.from('<embed src="evil.swf">'),
        Buffer.alloc(500, 'a'),
      ]);

      await expect(
        service.scanFile(maliciousImage, 'malicious.jpg', 'image/jpeg'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject an image with excessive metadata (>100 Exif markers)', async () => {
      const exifRepeat = 'Exif'.repeat(101);
      const maliciousImage = Buffer.concat([
        Buffer.from([0xff, 0xd8, 0xff]),
        Buffer.from(exifRepeat),
        Buffer.alloc(500, 'a'),
      ]);

      await expect(
        service.scanFile(maliciousImage, 'malicious.jpg', 'image/jpeg'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.scanFile(maliciousImage, 'malicious.jpg', 'image/jpeg'),
      ).rejects.toThrow('contains suspicious metadata');
    });

    it('should reject a PDF that is too small (<1024 bytes)', async () => {
      const tinyPdf = Buffer.concat([
        Buffer.from([0x25, 0x50, 0x44, 0x46]),
        Buffer.alloc(500, 'a'),
      ]);

      await expect(service.scanFile(tinyPdf, 'tiny.pdf', 'application/pdf')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.scanFile(tinyPdf, 'tiny.pdf', 'application/pdf')).rejects.toThrow(
        'File tiny.pdf is too small to be a valid PDF',
      );
    });

    it('should reject a PDF with invalid magic bytes', async () => {
      const fakePdf = Buffer.concat([
        Buffer.from([0x00, 0x00, 0x00, 0x00]), // Wrong magic bytes
        Buffer.alloc(2000, 'a'),
      ]);

      await expect(service.scanFile(fakePdf, 'fake.pdf', 'application/pdf')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.scanFile(fakePdf, 'fake.pdf', 'application/pdf')).rejects.toThrow(
        'File fake.pdf is not a valid PDF file',
      );
    });

    it('should accept a PDF with /JavaScript (log warning but allow)', async () => {
      const pdfWithJs = Buffer.concat([
        Buffer.from([0x25, 0x50, 0x44, 0x46]),
        Buffer.from('/JavaScript '),
        Buffer.alloc(2000, 'a'),
      ]);

      // Should not throw, just log warning
      const result = await service.scanFile(pdfWithJs, 'jswarning.pdf', 'application/pdf');
      expect(result).toBe(true);
    });

    it('should reject a file with excessive obfuscation patterns', async () => {
      const obfuscatedContent =
        'eval(unescape("%74%68%69%73")) ' +
        'String.fromCharCode(97,98,99) ' +
        'eval(unescape("%74%68%69%73")) ' +
        'String.fromCharCode(97,98,99) ' +
        'eval(unescape("%74%68%69%73")) ' +
        'String.fromCharCode(97,98,99) ' +
        'eval(unescape("%74%68%69%73")) ' +
        'String.fromCharCode(97,98,99) ' +
        'eval(unescape("%74%68%69%73")) ' +
        'String.fromCharCode(97,98,99) ' +
        'eval(unescape("%74%68%69%73")) ' +
        'String.fromCharCode(97,98,99) ';

      const maliciousFile = Buffer.concat([
        Buffer.from([0xff, 0xd8, 0xff]),
        Buffer.from(obfuscatedContent),
        Buffer.alloc(500, 'a'),
      ]);

      await expect(
        service.scanFile(maliciousFile, 'obfuscated.jpg', 'image/jpeg'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.scanFile(maliciousFile, 'obfuscated.jpg', 'image/jpeg'),
      ).rejects.toThrow('File failed security scan and was rejected');
    });

    it('should reject a file with excessive external references (>20)', async () => {
      const externalRefs = 'http://example.com '.repeat(21);
      const suspiciousFile = Buffer.concat([
        Buffer.from([0xff, 0xd8, 0xff]),
        Buffer.from(externalRefs),
        Buffer.alloc(500, 'a'),
      ]);

      await expect(
        service.scanFile(suspiciousFile, 'phishing.jpg', 'image/jpeg'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.scanFile(suspiciousFile, 'phishing.jpg', 'image/jpeg'),
      ).rejects.toThrow('File contains too many external references');
    });

    it('should handle scanning error gracefully and fail-safe (reject)', async () => {
      // Force an error by providing invalid data to trigger catch block
      const invalidFile = Buffer.alloc(200, 'a');

      // Mock a thrown error during scanning
      jest
        .spyOn(service as any, 'performBasicChecks')
        .mockRejectedValueOnce(new Error('Unexpected scanning error'));

      await expect(service.scanFile(invalidFile, 'error.jpg', 'image/jpeg')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.scanFile(invalidFile, 'error.jpg', 'image/jpeg')).rejects.toThrow(
        'File scanning failed. Please try again or contact support',
      );
    });
  });

  describe('ClamAV integration', () => {
    it('should attempt ClamAV scan when host is configured', async () => {
      mockStorageConfigService.getClamAvHost.mockReturnValueOnce('localhost');

      // Create a mock net.Socket
      const mockSocket = {
        connect: jest.fn((_port, _host, callback) => callback()),
        write: jest.fn(),
        on: jest.fn((event, handler) => {
          if (event === 'data') {
            // Simulate clean response
            setTimeout(() => handler(Buffer.from('stream: OK')), 10);
          }
        }),
        setTimeout: jest.fn(),
        destroy: jest.fn(),
      };

      // Mock require for net module
      jest.doMock('net', () => ({
        Socket: jest.fn(() => mockSocket),
      }));

      const cleanFile = Buffer.alloc(1000, 'a');

      // Note: This test is complex because it requires mocking Node.js net module
      // In a real scenario, you might want to test ClamAV separately or use integration tests
      // For now, we test that the method is called correctly
      const scanWithClamAVSpy = jest.spyOn(service as any, 'scanWithClamAV');

      try {
        await service.scanFile(cleanFile, 'clean.jpg', 'image/jpeg');
      } catch (error) {
        // Expected if ClamAV mock doesn't work perfectly
      }

      expect(scanWithClamAVSpy).toHaveBeenCalled();
    });
  });

  describe('quarantineFile', () => {
    it('should log quarantine event for suspicious file', async () => {
      const loggerWarnSpy = jest.spyOn((service as any).logger, 'warn');

      const suspiciousFile = Buffer.alloc(1000, 'x');
      await service.quarantineFile(suspiciousFile, 'suspicious.exe', 'Detected malware');

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Quarantining file suspicious.exe'),
      );
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'FILE_QUARANTINED',
          filename: 'suspicious.exe',
          reason: 'Detected malware',
        }),
      );
    });
  });

  describe('heuristic scanning edge cases', () => {
    it('should pass a file with few obfuscation patterns (<3 types)', async () => {
      const slightlyObfuscated = Buffer.concat([
        Buffer.from([0xff, 0xd8, 0xff]),
        Buffer.from('eval(something) eval(another) String.fromCharCode(97)'),
        Buffer.alloc(500, 'a'),
      ]);

      const result = await service.scanFile(
        slightlyObfuscated,
        'slight.jpg',
        'image/jpeg',
      );

      expect(result).toBe(true);
    });

    it('should pass a file with moderate external references (<=20)', async () => {
      const moderateRefs = 'http://example.com '.repeat(20);
      const normalFile = Buffer.concat([
        Buffer.from([0xff, 0xd8, 0xff]),
        Buffer.from(moderateRefs),
        Buffer.alloc(500, 'a'),
      ]);

      const result = await service.scanFile(normalFile, 'normal.jpg', 'image/jpeg');

      expect(result).toBe(true);
    });

    it('should pass an image with reasonable metadata (<100 Exif markers)', async () => {
      const exifRepeat = 'Exif'.repeat(50);
      const normalImage = Buffer.concat([
        Buffer.from([0xff, 0xd8, 0xff]),
        Buffer.from(exifRepeat),
        Buffer.alloc(500, 'a'),
      ]);

      const result = await service.scanFile(normalImage, 'normal.jpg', 'image/jpeg');

      expect(result).toBe(true);
    });
  });
});
