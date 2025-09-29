import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import request from 'supertest';
import { SessionsModule } from '../../src/modules/sessions/sessions.module';
import { SpeakersModule } from '../../src/modules/speakers/speakers.module';
import { SponsorsModule } from '../../src/modules/sponsors/sponsors.module';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { DatabaseModule } from '../../src/modules/database/database.module';
import { JwtService } from '@nestjs/jwt';

describe('Sessions Integration Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let authToken: string;
  let speakerId: string;
  let sponsorId: string;

  const testUser = {
    _id: '507f1f77bcf86cd799439020',
    email: 'admin@vtexday.com',
    role: 'super_admin',
  };

  const createSessionDto = {
    title: {
      'pt-BR': 'Palestra sobre IA',
      en: 'AI Presentation',
    },
    description: {
      'pt-BR': 'Descrição detalhada da palestra sobre inteligência artificial',
      en: 'Detailed description of artificial intelligence presentation',
    },
    startTime: new Date('2025-11-26T10:00:00Z'),
    endTime: new Date('2025-11-26T11:00:00Z'),
    stage: 'principal',
    sessionType: 'talk',
    tags: ['AI', 'Technology'],
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(
          process.env['MONGODB_TEST_URI'] || 'mongodb://localhost:27017/vtex-day-test',
        ),
        DatabaseModule,
        AuthModule,
        SpeakersModule,
        SponsorsModule,
        SessionsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    jwtService = moduleFixture.get<JwtService>(JwtService);

    authToken = jwtService.sign({
      sub: testUser._id,
      email: testUser.email,
      role: testUser.role,
    });

    await app.init();

    // Create test speaker and sponsor
    const speakerResponse = await request(app.getHttpServer())
      .post('/speakers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Speaker',
        bio: {
          'pt-BR':
            'Biografia do palestrante para teste com mais de cem caracteres necessários para validação',
          en: 'Speaker biography for testing with more than one hundred characters required for validation',
        },
        photoUrl: 'https://example.com/speaker.jpg',
        company: 'Test Company',
        position: {
          'pt-BR': 'Palestrante',
          en: 'Speaker',
        },
      });
    speakerId = speakerResponse.body.data._id;

    // Create sponsor tier first
    const tierResponse = await request(app.getHttpServer())
      .post('/sponsors/tiers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Tier',
        description: {
          'pt-BR': 'Nível de teste',
          en: 'Test tier',
        },
        priority: 1,
        benefits: ['Logo display'],
        maxSponsors: 5,
        price: 10000,
      });

    const sponsorResponse = await request(app.getHttpServer())
      .post('/sponsors')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Sponsor',
        description: {
          'pt-BR': 'Patrocinador de teste',
          en: 'Test sponsor',
        },
        logoUrl: 'https://example.com/sponsor.png',
        websiteUrl: 'https://testsponsor.com',
        tier: tierResponse.body.data._id,
        contactInfo: {
          email: 'contact@testsponsor.com',
        },
      });
    sponsorId = sponsorResponse.body.data._id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /sessions', () => {
    it('should return paginated sessions list (public endpoint)', async () => {
      const response = await request(app.getHttpServer()).get('/sessions').expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.metadata).toHaveProperty('total');
      expect(response.body.metadata).toHaveProperty('page');
      expect(response.body.metadata).toHaveProperty('limit');
    });

    it('should apply date filters correctly', async () => {
      const response = await request(app.getHttpServer())
        .get('/sessions?startDate=2025-11-26&endDate=2025-11-28')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should apply stage filter correctly', async () => {
      const response = await request(app.getHttpServer())
        .get('/sessions?stage=principal')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should apply tags filter correctly', async () => {
      const response = await request(app.getHttpServer())
        .get('/sessions?tags=AI,Technology')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should apply speaker filter correctly', async () => {
      const response = await request(app.getHttpServer())
        .get(`/sessions?speakerId=${speakerId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /sessions', () => {
    it('should create a new session (admin only)', async () => {
      const sessionDto = {
        ...createSessionDto,
        speakers: [speakerId],
        sponsors: [sponsorId],
      };

      const response = await request(app.getHttpServer())
        .post('/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(sessionDto)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.title).toEqual(sessionDto.title);
      expect(response.body.data.stage).toBe(sessionDto.stage);
    });

    it('should reject request without authentication', async () => {
      await request(app.getHttpServer()).post('/sessions').send(createSessionDto).expect(401);
    });

    it('should validate required fields', async () => {
      const invalidDto = {
        title: {
          'pt-BR': '', // Empty title
        },
        startTime: 'invalid-date',
      };

      await request(app.getHttpServer())
        .post('/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDto)
        .expect(400);
    });

    it('should detect session conflicts', async () => {
      const conflictingDto = {
        ...createSessionDto,
        title: {
          'pt-BR': 'Palestra Conflitante',
          en: 'Conflicting Session',
        },
        startTime: new Date('2025-11-26T10:30:00Z'), // Overlaps with existing session
        endTime: new Date('2025-11-26T11:30:00Z'),
        speakers: [speakerId],
      };

      await request(app.getHttpServer())
        .post('/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(conflictingDto)
        .expect(409);
    });
  });

  describe('GET /sessions/:id', () => {
    let sessionId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...createSessionDto,
          title: {
            'pt-BR': 'Sessão para Teste de Detalhes',
            en: 'Session for Detail Test',
          },
          startTime: new Date('2025-11-26T14:00:00Z'),
          endTime: new Date('2025-11-26T15:00:00Z'),
          speakers: [speakerId],
          sponsors: [sponsorId],
        });
      sessionId = response.body.data._id;
    });

    it('should return session details by id (public endpoint)', async () => {
      const response = await request(app.getHttpServer()).get(`/sessions/${sessionId}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id', sessionId);
      expect(response.body.data).toHaveProperty('title');
      expect(response.body.data).toHaveProperty('description');
      expect(response.body.data).toHaveProperty('speakers');
      expect(response.body.data).toHaveProperty('sponsors');
    });

    it('should return 404 for non-existent session', async () => {
      await request(app.getHttpServer()).get('/sessions/507f1f77bcf86cd799439999').expect(404);
    });
  });

  describe('PATCH /sessions/:id', () => {
    let sessionId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...createSessionDto,
          title: {
            'pt-BR': 'Sessão para Teste de Atualização',
            en: 'Session for Update Test',
          },
          startTime: new Date('2025-11-26T16:00:00Z'),
          endTime: new Date('2025-11-26T17:00:00Z'),
          speakers: [speakerId],
        });
      sessionId = response.body.data._id;
    });

    it('should update session (admin only)', async () => {
      const updateDto = {
        stage: 'secundario',
        tags: ['Updated', 'Tags'],
      };

      const response = await request(app.getHttpServer())
        .patch(`/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stage).toBe(updateDto.stage);
      expect(response.body.data.tags).toEqual(updateDto.tags);
    });

    it('should reject request without authentication', async () => {
      await request(app.getHttpServer())
        .patch(`/sessions/${sessionId}`)
        .send({ stage: 'unauthorized-update' })
        .expect(401);
    });

    it('should return 404 for non-existent session', async () => {
      await request(app.getHttpServer())
        .patch('/sessions/507f1f77bcf86cd799439999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ stage: 'secundario' })
        .expect(404);
    });
  });

  describe('DELETE /sessions/:id', () => {
    let sessionId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...createSessionDto,
          title: {
            'pt-BR': 'Sessão para Teste de Exclusão',
            en: 'Session for Delete Test',
          },
          startTime: new Date('2025-11-26T18:00:00Z'),
          endTime: new Date('2025-11-26T19:00:00Z'),
          speakers: [speakerId],
        });
      sessionId = response.body.data._id;
    });

    it('should soft delete session (admin only)', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'Test deletion' })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify session is no longer accessible via public endpoint
      await request(app.getHttpServer()).get(`/sessions/${sessionId}`).expect(404);
    });

    it('should reject request without authentication', async () => {
      await request(app.getHttpServer()).delete(`/sessions/${sessionId}`).expect(401);
    });

    it('should return 404 for non-existent session', async () => {
      await request(app.getHttpServer())
        .delete('/sessions/507f1f77bcf86cd799439999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /sessions/:id/restore', () => {
    let sessionId: string;

    beforeAll(async () => {
      // Create and delete a session
      const createResponse = await request(app.getHttpServer())
        .post('/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...createSessionDto,
          title: {
            'pt-BR': 'Sessão para Teste de Restauração',
            en: 'Session for Restore Test',
          },
          startTime: new Date('2025-11-26T20:00:00Z'),
          endTime: new Date('2025-11-26T21:00:00Z'),
          speakers: [speakerId],
        });
      sessionId = createResponse.body.data._id;

      await request(app.getHttpServer())
        .delete(`/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'Test for restoration' });
    });

    it('should restore soft-deleted session (admin only)', async () => {
      const response = await request(app.getHttpServer())
        .post(`/sessions/${sessionId}/restore`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify session is accessible again via public endpoint
      await request(app.getHttpServer()).get(`/sessions/${sessionId}`).expect(200);
    });

    it('should reject request without authentication', async () => {
      await request(app.getHttpServer()).post(`/sessions/${sessionId}/restore`).expect(401);
    });
  });

  describe('GET /sessions/date-range', () => {
    beforeAll(async () => {
      // Create session in specific date range
      await request(app.getHttpServer())
        .post('/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...createSessionDto,
          title: {
            'pt-BR': 'Sessão em Período Específico',
            en: 'Session in Specific Period',
          },
          startTime: new Date('2025-11-27T10:00:00Z'),
          endTime: new Date('2025-11-27T11:00:00Z'),
          speakers: [speakerId],
        });
    });

    it('should return sessions within date range (public endpoint)', async () => {
      const response = await request(app.getHttpServer())
        .get('/sessions/date-range?startDate=2025-11-27&endDate=2025-11-27')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});
