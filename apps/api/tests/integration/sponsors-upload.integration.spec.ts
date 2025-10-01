import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { SponsorsModule } from '../../src/modules/sponsors/sponsors.module';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { StorageService } from '../../src/modules/storage/services/storage.service';
import { Sponsor } from '../../src/modules/sponsors/schemas/sponsor.schema';
import { SponsorTier } from '../../src/modules/sponsors/schemas/sponsor-tier.schema';
import { Model } from 'mongoose';

describe('Sponsors Logo Upload Integration Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let authToken: string;
  let producerToken: string;
  let userToken: string;
  let sponsorModel: Model<Sponsor>;
  let sponsorTierModel: Model<SponsorTier>;
  let testSponsorId: string;
  let testTierId: string;

  const testAdminUser = {
    _id: '507f1f77bcf86cd799439020',
    email: 'admin@vtexday.com',
    role: 'super_admin',
  };

  const testProducerUser = {
    _id: '507f1f77bcf86cd799439021',
    email: 'producer@vtexday.com',
    role: 'producer',
  };

  const testRegularUser = {
    _id: '507f1f77bcf86cd799439022',
    email: 'user@vtexday.com',
    role: 'user',
  };

  // Mock StorageService
  const mockStorageService = {
    uploadFile: jest.fn().mockResolvedValue({
      key: 'sponsor-logos/12345-67890.jpg',
      url: 'https://test-bucket.s3.us-east-1.amazonaws.com/sponsor-logos/12345-67890.jpg',
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
          load: [
            () => ({
              jwt: {
                secret: 'test-jwt-secret-key-for-integration-tests',
                expiresIn: '1h',
              },
            }),
          ],
        }),
        MongooseModule.forRoot(
          process.env['MONGODB_TEST_URI'] ||
            'mongodb://localhost:27017/vtex-day-test-sponsor-upload',
        ),
        ThrottlerModule.forRoot([
          {
            ttl: 60000,
            limit: 10,
          },
        ]),
        AuthModule,
        SponsorsModule,
      ],
    })
      .overrideProvider(StorageService)
      .useValue(mockStorageService)
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true }) // Disable throttling for tests
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    jwtService = moduleFixture.get<JwtService>(JwtService);
    sponsorModel = moduleFixture.get<Model<Sponsor>>(getModelToken(Sponsor.name));
    sponsorTierModel = moduleFixture.get<Model<SponsorTier>>(getModelToken(SponsorTier.name));

    // Generate auth tokens
    authToken = jwtService.sign({
      sub: testAdminUser._id,
      email: testAdminUser.email,
      role: testAdminUser.role,
    });

    producerToken = jwtService.sign({
      sub: testProducerUser._id,
      email: testProducerUser.email,
      role: testProducerUser.role,
    });

    userToken = jwtService.sign({
      sub: testRegularUser._id,
      email: testRegularUser.email,
      role: testRegularUser.role,
    });

    await app.init();

    // Create a test sponsor tier
    const tier = await sponsorTierModel.create({
      name: 'Gold',
      displayName: {
        'pt-BR': 'Patrocinador Ouro',
        en: 'Gold Sponsor',
      },
      order: 1,
      benefits: {
        'pt-BR': ['Benefício 1'],
        en: ['Benefit 1'],
      },
    });
    testTierId = tier._id.toString();

    // Create a test sponsor
    const sponsor = await sponsorModel.create({
      name: 'Test Sponsor',
      slug: 'test-sponsor',
      description: {
        'pt-BR': 'Descrição do patrocinador',
        en: 'Sponsor description',
      },
      tier: testTierId,
      website: 'https://testsponsor.com',
      isVisible: true,
      orderInTier: 1,
    });

    testSponsorId = sponsor._id.toString();
  });

  afterAll(async () => {
    // Clean up test data
    try {
      if (sponsorModel) {
        await sponsorModel.deleteMany({});
      }
      if (sponsorTierModel) {
        await sponsorTierModel.deleteMany({});
      }
    } catch (error) {
      // Ignore cleanup errors in test environment
      console.log('Cleanup error (can be ignored in test environment):', error);
    } finally {
      if (app) {
        await app.close();
      }
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /sponsors/:id/upload-logo', () => {
    it('should successfully upload a sponsor logo as super admin', async () => {
      // Create a mock JPEG file
      const jpegBuffer = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(1000, 'a')]);

      const response = await request(app.getHttpServer())
        .post(`/sponsors/${testSponsorId}/upload-logo`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', jpegBuffer, 'test-logo.jpg')
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('logoUrl');
      expect(response.body.data.logoUrl).toContain('sponsor-logos/');
      expect(mockStorageService.uploadFile).toHaveBeenCalled();

      // Verify sponsor was updated in database
      const updatedSponsor = await sponsorModel.findById(testSponsorId);
      expect(updatedSponsor?.logoUrl).toContain('sponsor-logos/');
    });

    it('should successfully upload a sponsor logo as producer', async () => {
      const jpegBuffer = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(1000, 'a')]);

      const response = await request(app.getHttpServer())
        .post(`/sponsors/${testSponsorId}/upload-logo`)
        .set('Authorization', `Bearer ${producerToken}`)
        .attach('file', jpegBuffer, 'test-logo.jpg')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.logoUrl).toBeDefined();
    });

    it('should reject upload without authentication', async () => {
      const jpegBuffer = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(1000, 'a')]);

      await request(app.getHttpServer())
        .post(`/sponsors/${testSponsorId}/upload-logo`)
        .attach('file', jpegBuffer, 'test-logo.jpg')
        .expect(401);

      expect(mockStorageService.uploadFile).not.toHaveBeenCalled();
    });

    it('should reject upload with insufficient role (regular user)', async () => {
      const jpegBuffer = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(1000, 'a')]);

      await request(app.getHttpServer())
        .post(`/sponsors/${testSponsorId}/upload-logo`)
        .set('Authorization', `Bearer ${userToken}`)
        .attach('file', jpegBuffer, 'test-logo.jpg')
        .expect(403);

      expect(mockStorageService.uploadFile).not.toHaveBeenCalled();
    });

    it('should reject upload without file', async () => {
      const response = await request(app.getHttpServer())
        .post(`/sponsors/${testSponsorId}/upload-logo`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('No file provided');
    });

    it('should reject upload for non-existent sponsor', async () => {
      const jpegBuffer = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(1000, 'a')]);

      const fakeId = '507f1f77bcf86cd799439999';

      const response = await request(app.getHttpServer())
        .post(`/sponsors/${fakeId}/upload-logo`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', jpegBuffer, 'test-logo.jpg')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    it('should reject upload with invalid file type', async () => {
      // Mock StorageService to throw validation error
      mockStorageService.uploadFile.mockRejectedValueOnce(
        new Error('Invalid file type. Only JPEG, PNG, WEBP files are allowed.'),
      );

      const pdfBuffer = Buffer.concat([
        Buffer.from([0x25, 0x50, 0x44, 0x46]),
        Buffer.alloc(1000, 'a'),
      ]);

      await request(app.getHttpServer())
        .post(`/sponsors/${testSponsorId}/upload-logo`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', pdfBuffer, 'test.pdf')
        .expect(500); // Will be 500 because StorageService throws generic Error, not BadRequestException

      // Reset mock
      mockStorageService.uploadFile.mockResolvedValue({
        key: 'sponsor-logos/12345-67890.jpg',
        url: 'https://test-bucket.s3.us-east-1.amazonaws.com/sponsor-logos/12345-67890.jpg',
      });
    });

    it('should handle invalid sponsor ID format gracefully', async () => {
      const jpegBuffer = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(1000, 'a')]);

      await request(app.getHttpServer())
        .post('/sponsors/invalid-id/upload-logo')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', jpegBuffer, 'test-logo.jpg')
        .expect(500); // MongoDB will throw on invalid ObjectId format
    });
  });

  describe('File Upload Validation Edge Cases', () => {
    it('should accept PNG files', async () => {
      const pngBuffer = Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        Buffer.alloc(1000, 'b'),
      ]);

      const response = await request(app.getHttpServer())
        .post(`/sponsors/${testSponsorId}/upload-logo`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', pngBuffer, 'test-logo.png')
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should accept WebP files', async () => {
      const webpBuffer = Buffer.concat([
        Buffer.from([0x52, 0x49, 0x46, 0x46]),
        Buffer.alloc(4, 0),
        Buffer.from('WEBP', 'ascii'),
        Buffer.alloc(1000, 'c'),
      ]);

      const response = await request(app.getHttpServer())
        .post(`/sponsors/${testSponsorId}/upload-logo`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', webpBuffer, 'test-logo.webp')
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should update existing logoUrl when uploading new logo', async () => {
      // First upload
      const jpegBuffer1 = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(1000, 'a')]);

      await request(app.getHttpServer())
        .post(`/sponsors/${testSponsorId}/upload-logo`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', jpegBuffer1, 'logo1.jpg')
        .expect(201);

      const sponsor1 = await sponsorModel.findById(testSponsorId);
      expect(sponsor1?.logoUrl).toBeDefined();

      // Second upload (should replace)
      mockStorageService.uploadFile.mockResolvedValueOnce({
        key: 'sponsor-logos/new-12345.jpg',
        url: 'https://test-bucket.s3.us-east-1.amazonaws.com/sponsor-logos/new-12345.jpg',
      });

      const jpegBuffer2 = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(2000, 'b')]);

      await request(app.getHttpServer())
        .post(`/sponsors/${testSponsorId}/upload-logo`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', jpegBuffer2, 'logo2.jpg')
        .expect(201);

      const sponsor2 = await sponsorModel.findById(testSponsorId);
      const secondLogoUrl = sponsor2?.logoUrl;

      expect(secondLogoUrl).toBeDefined();
      expect(secondLogoUrl).toContain('sponsor-logos/new-12345.jpg');

      // Reset mock
      mockStorageService.uploadFile.mockResolvedValue({
        key: 'sponsor-logos/12345-67890.jpg',
        url: 'https://test-bucket.s3.us-east-1.amazonaws.com/sponsor-logos/12345-67890.jpg',
      });
    });
  });

  describe('Security and Authorization Tests', () => {
    it('should require valid JWT token', async () => {
      const jpegBuffer = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(1000, 'a')]);

      await request(app.getHttpServer())
        .post(`/sponsors/${testSponsorId}/upload-logo`)
        .set('Authorization', 'Bearer invalid-token')
        .attach('file', jpegBuffer, 'test-logo.jpg')
        .expect(401);
    });

    it('should require authorization header', async () => {
      const jpegBuffer = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(1000, 'a')]);

      await request(app.getHttpServer())
        .post(`/sponsors/${testSponsorId}/upload-logo`)
        .attach('file', jpegBuffer, 'test-logo.jpg')
        .expect(401);
    });

    it('should enforce role-based access control (SUPER_ADMIN or PRODUCER only)', async () => {
      const jpegBuffer = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(1000, 'a')]);

      // Regular user should be forbidden
      await request(app.getHttpServer())
        .post(`/sponsors/${testSponsorId}/upload-logo`)
        .set('Authorization', `Bearer ${userToken}`)
        .attach('file', jpegBuffer, 'test-logo.jpg')
        .expect(403);

      // Producer should succeed
      await request(app.getHttpServer())
        .post(`/sponsors/${testSponsorId}/upload-logo`)
        .set('Authorization', `Bearer ${producerToken}`)
        .attach('file', jpegBuffer, 'test-logo.jpg')
        .expect(201);

      // Super admin should succeed
      await request(app.getHttpServer())
        .post(`/sponsors/${testSponsorId}/upload-logo`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', jpegBuffer, 'test-logo.jpg')
        .expect(201);
    });
  });

  describe('Database Integration Tests', () => {
    it('should persist logoUrl to database after successful upload', async () => {
      const jpegBuffer = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(1000, 'a')]);

      mockStorageService.uploadFile.mockResolvedValueOnce({
        key: 'sponsor-logos/test-persist.jpg',
        url: 'https://test-bucket.s3.us-east-1.amazonaws.com/sponsor-logos/test-persist.jpg',
      });

      await request(app.getHttpServer())
        .post(`/sponsors/${testSponsorId}/upload-logo`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', jpegBuffer, 'test-logo.jpg')
        .expect(201);

      const afterSponsor = await sponsorModel.findById(testSponsorId);
      const afterLogoUrl = afterSponsor?.logoUrl;

      expect(afterLogoUrl).toBeDefined();
      expect(afterLogoUrl).toContain('test-persist.jpg');

      // Reset mock
      mockStorageService.uploadFile.mockResolvedValue({
        key: 'sponsor-logos/12345-67890.jpg',
        url: 'https://test-bucket.s3.us-east-1.amazonaws.com/sponsor-logos/12345-67890.jpg',
      });
    });

    it('should not modify sponsor document if upload fails', async () => {
      const jpegBuffer = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(1000, 'a')]);

      const beforeSponsor = await sponsorModel.findById(testSponsorId);
      const beforeLogoUrl = beforeSponsor?.logoUrl;

      // Mock upload failure
      mockStorageService.uploadFile.mockRejectedValueOnce(new Error('S3 upload failed'));

      await request(app.getHttpServer())
        .post(`/sponsors/${testSponsorId}/upload-logo`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', jpegBuffer, 'test-logo.jpg')
        .expect(500);

      const afterSponsor = await sponsorModel.findById(testSponsorId);
      const afterLogoUrl = afterSponsor?.logoUrl;

      // LogoUrl should remain unchanged
      expect(afterLogoUrl).toBe(beforeLogoUrl);

      // Reset mock
      mockStorageService.uploadFile.mockResolvedValue({
        key: 'sponsor-logos/12345-67890.jpg',
        url: 'https://test-bucket.s3.us-east-1.amazonaws.com/sponsor-logos/12345-67890.jpg',
      });
    });
  });
});
