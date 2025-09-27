import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import request from 'supertest';
import { SpeakersModule } from '../../src/modules/speakers/speakers.module';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { DatabaseModule } from '../../src/modules/database/database.module';
import { JwtService } from '@nestjs/jwt';

describe('Speakers Integration Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let authToken: string;

  const testUser = {
    _id: '507f1f77bcf86cd799439020',
    email: 'admin@vtexday.com',
    role: 'super_admin'
  };

  const createSpeakerDto = {
    name: 'John Doe',
    bio: {
      'pt-BR': 'Biografia em português do palestrante com mais de cem caracteres para atender ao requisito mínimo de comprimento',
      'en': 'Speaker biography in English with more than one hundred characters to meet the minimum length requirement'
    },
    photoUrl: 'https://example.com/photo.jpg',
    company: 'Tech Corp',
    position: {
      'pt-BR': 'Diretor de Tecnologia',
      'en': 'Technology Director'
    },
    socialLinks: {
      linkedin: 'https://linkedin.com/in/johndoe',
      twitter: 'https://twitter.com/johndoe'
    },
    isHighlight: false,
    tags: ['AI', 'Cloud']
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(process.env['MONGODB_TEST_URI'] || 'mongodb://localhost:27017/vtex-day-test'),
        DatabaseModule,
        AuthModule,
        SpeakersModule
      ]
    }).compile();

    app = moduleFixture.createNestApplication();
    jwtService = moduleFixture.get<JwtService>(JwtService);

    authToken = jwtService.sign({
      sub: testUser._id,
      email: testUser.email,
      role: testUser.role
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /speakers', () => {
    it('should return paginated speakers list (public endpoint)', async () => {
      const response = await request(app.getHttpServer())
        .get('/speakers')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.metadata).toHaveProperty('total');
      expect(response.body.metadata).toHaveProperty('page');
      expect(response.body.metadata).toHaveProperty('limit');
      expect(response.body.metadata).toHaveProperty('hasNext');
      expect(response.body.metadata).toHaveProperty('hasPrev');
    });

    it('should apply pagination correctly', async () => {
      const response = await request(app.getHttpServer())
        .get('/speakers?page=1&limit=5')
        .expect(200);

      expect(response.body.metadata.page).toBe(1);
      expect(response.body.metadata.limit).toBe(5);
    });

    it('should apply filters correctly', async () => {
      const response = await request(app.getHttpServer())
        .get('/speakers?isHighlight=true&tags=AI,Cloud')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should apply sorting correctly', async () => {
      const response = await request(app.getHttpServer())
        .get('/speakers?sort=-priority,name')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should apply search correctly', async () => {
      const response = await request(app.getHttpServer())
        .get('/speakers?search=technology')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /speakers', () => {
    it('should create a new speaker (admin only)', async () => {
      const response = await request(app.getHttpServer())
        .post('/speakers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createSpeakerDto)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.name).toBe(createSpeakerDto.name);
      expect(response.body.data.company).toBe(createSpeakerDto.company);
    });

    it('should reject request without authentication', async () => {
      await request(app.getHttpServer())
        .post('/speakers')
        .send(createSpeakerDto)
        .expect(401);
    });

    it('should validate required fields', async () => {
      const invalidDto = {
        name: 'A', // Too short
        bio: {
          'pt-BR': 'Bio curta' // Too short
        }
      };

      await request(app.getHttpServer())
        .post('/speakers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDto)
        .expect(400);
    });

    it('should reject duplicate speaker names', async () => {
      // First creation should succeed
      await request(app.getHttpServer())
        .post('/speakers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...createSpeakerDto,
          name: 'Unique Speaker'
        })
        .expect(201);

      // Second creation with same name should fail
      await request(app.getHttpServer())
        .post('/speakers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...createSpeakerDto,
          name: 'Unique Speaker'
        })
        .expect(409);
    });
  });

  describe('GET /speakers/:id', () => {
    let speakerId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/speakers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...createSpeakerDto,
          name: 'Speaker For Detail Test'
        });
      speakerId = response.body.data._id;
    });

    it('should return speaker details by id (public endpoint)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/speakers/${speakerId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id', speakerId);
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('bio');
      expect(response.body.data).toHaveProperty('company');
    });

    it('should return 404 for non-existent speaker', async () => {
      await request(app.getHttpServer())
        .get('/speakers/507f1f77bcf86cd799439999')
        .expect(404);
    });
  });

  describe('PATCH /speakers/:id', () => {
    let speakerId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/speakers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...createSpeakerDto,
          name: 'Speaker For Update Test'
        });
      speakerId = response.body.data._id;
    });

    it('should update speaker (admin only)', async () => {
      const updateDto = {
        company: 'Updated Tech Corp',
        isHighlight: true
      };

      const response = await request(app.getHttpServer())
        .patch(`/speakers/${speakerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.company).toBe(updateDto.company);
      expect(response.body.data.isHighlight).toBe(updateDto.isHighlight);
    });

    it('should reject request without authentication', async () => {
      await request(app.getHttpServer())
        .patch(`/speakers/${speakerId}`)
        .send({ company: 'Unauthorized Update' })
        .expect(401);
    });

    it('should return 404 for non-existent speaker', async () => {
      await request(app.getHttpServer())
        .patch('/speakers/507f1f77bcf86cd799439999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ company: 'Updated Company' })
        .expect(404);
    });
  });

  describe('DELETE /speakers/:id', () => {
    let speakerId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/speakers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...createSpeakerDto,
          name: 'Speaker For Delete Test'
        });
      speakerId = response.body.data._id;
    });

    it('should soft delete speaker (admin only)', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/speakers/${speakerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'Test deletion' })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify speaker is no longer accessible via public endpoint
      await request(app.getHttpServer())
        .get(`/speakers/${speakerId}`)
        .expect(404);
    });

    it('should reject request without authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/speakers/${speakerId}`)
        .expect(401);
    });

    it('should return 404 for non-existent speaker', async () => {
      await request(app.getHttpServer())
        .delete('/speakers/507f1f77bcf86cd799439999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /speakers/:id/restore', () => {
    let speakerId: string;

    beforeAll(async () => {
      // Create and delete a speaker
      const createResponse = await request(app.getHttpServer())
        .post('/speakers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...createSpeakerDto,
          name: 'Speaker For Restore Test'
        });
      speakerId = createResponse.body.data._id;

      await request(app.getHttpServer())
        .delete(`/speakers/${speakerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'Test for restoration' });
    });

    it('should restore soft-deleted speaker (admin only)', async () => {
      const response = await request(app.getHttpServer())
        .post(`/speakers/${speakerId}/restore`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify speaker is accessible again via public endpoint
      await request(app.getHttpServer())
        .get(`/speakers/${speakerId}`)
        .expect(200);
    });

    it('should reject request without authentication', async () => {
      await request(app.getHttpServer())
        .post(`/speakers/${speakerId}/restore`)
        .expect(401);
    });
  });

  describe('GET /speakers/highlights', () => {
    beforeAll(async () => {
      // Create a highlighted speaker
      await request(app.getHttpServer())
        .post('/speakers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...createSpeakerDto,
          name: 'Highlighted Speaker',
          isHighlight: true
        });
    });

    it('should return highlighted speakers (public endpoint)', async () => {
      const response = await request(app.getHttpServer())
        .get('/speakers/highlights')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      // All returned speakers should have isHighlight: true
      response.body.data.forEach((speaker: any) => {
        expect(speaker.isHighlight).toBe(true);
      });
    });
  });
});