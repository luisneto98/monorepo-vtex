import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { SpeakersModule } from '../../src/modules/speakers/speakers.module';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { StorageService } from '../../src/modules/storage/services/storage.service';
import { Speaker } from '../../src/modules/speakers/schemas/speaker.schema';
import { Model } from 'mongoose';

describe('Speakers Photo Upload Integration Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let authToken: string;
  let producerToken: string;
  let userToken: string;
  let speakerModel: Model<Speaker>;
  let testSpeakerId: string;

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
      key: 'speaker-photos/12345-67890.jpg',
      url: 'https://test-bucket.s3.us-east-1.amazonaws.com/speaker-photos/12345-67890.jpg',
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(
          process.env['MONGODB_TEST_URI'] || 'mongodb://localhost:27017/vtex-day-test-upload',
        ),
        ThrottlerModule.forRoot([
          {
            ttl: 60000,
            limit: 10,
          },
        ]),
        AuthModule,
        SpeakersModule,
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
    speakerModel = moduleFixture.get<Model<Speaker>>(getModelToken(Speaker.name));

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

    // Create a test speaker
    const speaker = await speakerModel.create({
      name: 'Test Speaker',
      bio: {
        'pt-BR':
          'Biografia em português do palestrante com mais de cem caracteres para atender ao requisito mínimo de comprimento',
        en: 'Speaker biography in English with more than one hundred characters to meet the minimum length requirement',
      },
      company: 'Test Corp',
      position: {
        'pt-BR': 'Diretor',
        en: 'Director',
      },
      isVisible: true,
      priority: 100,
    });

    testSpeakerId = speaker._id.toString();
  });

  afterAll(async () => {
    // Clean up test data
    await speakerModel.deleteMany({});
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /speakers/:id/upload-photo', () => {
    it('should successfully upload a speaker photo as super admin', async () => {
      // Create a mock JPEG file
      const jpegBuffer = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(1000, 'a')]);

      const response = await request(app.getHttpServer())
        .post(`/speakers/${testSpeakerId}/upload-photo`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', jpegBuffer, 'test.jpg')
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('photoUrl');
      expect(response.body.data.photoUrl).toContain('speaker-photos/');
      expect(mockStorageService.uploadFile).toHaveBeenCalled();

      // Verify speaker was updated in database
      const updatedSpeaker = await speakerModel.findById(testSpeakerId);
      expect(updatedSpeaker?.photoUrl).toContain('speaker-photos/');
    });

    it('should successfully upload a speaker photo as producer', async () => {
      const jpegBuffer = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(1000, 'a')]);

      const response = await request(app.getHttpServer())
        .post(`/speakers/${testSpeakerId}/upload-photo`)
        .set('Authorization', `Bearer ${producerToken}`)
        .attach('file', jpegBuffer, 'test.jpg')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.photoUrl).toBeDefined();
    });

    it('should reject upload without authentication', async () => {
      const jpegBuffer = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(1000, 'a')]);

      await request(app.getHttpServer())
        .post(`/speakers/${testSpeakerId}/upload-photo`)
        .attach('file', jpegBuffer, 'test.jpg')
        .expect(401);

      expect(mockStorageService.uploadFile).not.toHaveBeenCalled();
    });

    it('should reject upload with insufficient role (regular user)', async () => {
      const jpegBuffer = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(1000, 'a')]);

      await request(app.getHttpServer())
        .post(`/speakers/${testSpeakerId}/upload-photo`)
        .set('Authorization', `Bearer ${userToken}`)
        .attach('file', jpegBuffer, 'test.jpg')
        .expect(403);

      expect(mockStorageService.uploadFile).not.toHaveBeenCalled();
    });

    it('should reject upload without file', async () => {
      const response = await request(app.getHttpServer())
        .post(`/speakers/${testSpeakerId}/upload-photo`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('No file provided');
    });

    it('should reject upload for non-existent speaker', async () => {
      const jpegBuffer = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(1000, 'a')]);

      const fakeId = '507f1f77bcf86cd799439999';

      const response = await request(app.getHttpServer())
        .post(`/speakers/${fakeId}/upload-photo`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', jpegBuffer, 'test.jpg')
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
        .post(`/speakers/${testSpeakerId}/upload-photo`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', pdfBuffer, 'test.pdf')
        .expect(500); // Will be 500 because StorageService throws generic Error, not BadRequestException

      // Reset mock
      mockStorageService.uploadFile.mockResolvedValue({
        key: 'speaker-photos/12345-67890.jpg',
        url: 'https://test-bucket.s3.us-east-1.amazonaws.com/speaker-photos/12345-67890.jpg',
      });
    });

    it('should handle invalid speaker ID format gracefully', async () => {
      const jpegBuffer = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(1000, 'a')]);

      await request(app.getHttpServer())
        .post('/speakers/invalid-id/upload-photo')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', jpegBuffer, 'test.jpg')
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
        .post(`/speakers/${testSpeakerId}/upload-photo`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', pngBuffer, 'test.png')
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
        .post(`/speakers/${testSpeakerId}/upload-photo`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', webpBuffer, 'test.webp')
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });
});
