import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { JwtService } from '@nestjs/jwt';
import { NewsReleasesModule } from '../../src/modules/news-releases/news-releases.module';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { UserRole } from '@vtexday26/shared';

describe('NewsReleases Integration Tests', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;
  let jwtService: JwtService;
  let adminToken: string;
  let editorToken: string;
  let userToken: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [MongooseModule.forRoot(mongoUri), NewsReleasesModule, AuthModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();

    jwtService = moduleRef.get<JwtService>(JwtService);

    // Generate test tokens
    adminToken = jwtService.sign({
      sub: 'admin-id',
      email: 'admin@test.com',
      role: UserRole.ADMIN,
    });

    editorToken = jwtService.sign({
      sub: 'editor-id',
      email: 'editor@test.com',
      role: UserRole.EDITOR,
    });

    userToken = jwtService.sign({
      sub: 'user-id',
      email: 'user@test.com',
      role: UserRole.USER,
    });
  });

  afterAll(async () => {
    await app.close();
    await mongoServer.stop();
  });

  describe('POST /api/news-releases', () => {
    const validNewsRelease = {
      title: {
        'pt-BR': 'Título em Português',
        en: 'English Title',
        es: 'Título en Español',
      },
      subtitle: {
        'pt-BR': 'Subtítulo em Português',
        en: 'English Subtitle',
        es: 'Subtítulo en Español',
      },
      content: {
        'pt-BR': '<p>Conteúdo em português</p>',
        en: '<p>English content</p>',
        es: '<p>Contenido en español</p>',
      },
      status: 'draft',
      category: 'announcement',
      tags: ['event', 'news'],
      author: {
        name: 'Test Author',
        email: 'author@test.com',
      },
      seo: {
        metaTitle: {
          'pt-BR': 'Meta Título',
          en: 'Meta Title',
          es: 'Meta Título',
        },
        metaDescription: {
          'pt-BR': 'Meta Descrição',
          en: 'Meta Description',
          es: 'Meta Descripción',
        },
        keywords: ['vtex', 'event'],
      },
    };

    it('should create news release with admin role', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/news-releases')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validNewsRelease)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('slug');
      expect(response.body.title).toEqual(validNewsRelease.title);
      expect(response.body.status).toBe('draft');
    });

    it('should create news release with editor role', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/news-releases')
        .set('Authorization', `Bearer ${editorToken}`)
        .send(validNewsRelease)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
    });

    it('should reject news release creation with user role', async () => {
      await request(app.getHttpServer())
        .post('/api/news-releases')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validNewsRelease)
        .expect(403);
    });

    it('should reject news release without authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/news-releases')
        .send(validNewsRelease)
        .expect(401);
    });

    it('should sanitize HTML content to prevent XSS', async () => {
      const maliciousContent = {
        ...validNewsRelease,
        content: {
          'pt-BR': '<p>Safe content</p><script>alert("XSS")</script>',
          en: '<p onclick="alert(\'XSS\')">Click me</p>',
          es: '<img src="x" onerror="alert(\'XSS\')">',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/api/news-releases')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(maliciousContent)
        .expect(201);

      // Verify malicious content was sanitized
      expect(response.body.content['pt-BR']).not.toContain('<script>');
      expect(response.body.content['en']).not.toContain('onclick');
      expect(response.body.content['es']).not.toContain('onerror');
    });

    it('should validate required fields', async () => {
      const invalidRelease = {
        status: 'draft',
      };

      const response = await request(app.getHttpServer())
        .post('/api/news-releases')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidRelease)
        .expect(400);

      expect(response.body.message).toContain('Validation failed');
    });

    it('should enforce maximum content length', async () => {
      const longContent = {
        ...validNewsRelease,
        content: {
          'pt-BR': 'x'.repeat(100001),
          en: 'x'.repeat(100001),
          es: 'x'.repeat(100001),
        },
      };

      await request(app.getHttpServer())
        .post('/api/news-releases')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(longContent)
        .expect(400);
    });
  });

  describe('GET /api/news-releases', () => {
    beforeEach(async () => {
      // Create test data
      const releases = [
        { ...validNewsRelease, status: 'published', publishedAt: new Date() },
        { ...validNewsRelease, status: 'draft' },
        { ...validNewsRelease, status: 'archived' },
      ];

      for (const release of releases) {
        await request(app.getHttpServer())
          .post('/api/news-releases')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(release);
      }
    });

    it('should list news releases with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/news-releases?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/news-releases?status=published')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      response.body.items.forEach((item) => {
        expect(item.status).toBe('published');
      });
    });

    it('should search by keyword', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/news-releases?search=English')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.items.length).toBeGreaterThan(0);
    });

    it('should enforce maximum limit', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/news-releases?limit=1000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.limit).toBeLessThanOrEqual(100);
    });
  });

  describe('PUT /api/news-releases/:id', () => {
    let newsReleaseId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/news-releases')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validNewsRelease);

      newsReleaseId = response.body._id;
    });

    it('should update news release with valid data', async () => {
      const updateData = {
        title: {
          'pt-BR': 'Título Atualizado',
          en: 'Updated Title',
          es: 'Título Actualizado',
        },
        status: 'published',
      };

      const response = await request(app.getHttpServer())
        .put(`/api/news-releases/${newsReleaseId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toEqual(updateData.title);
      expect(response.body.status).toBe('published');
      expect(response.body.publishedAt).toBeDefined();
    });

    it('should reject update with invalid ID', async () => {
      await request(app.getHttpServer())
        .put('/api/news-releases/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'published' })
        .expect(400);
    });

    it('should track audit log for updates', async () => {
      const updateData = { status: 'published' };

      const response = await request(app.getHttpServer())
        .put(`/api/news-releases/${newsReleaseId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.updatedAt).toBeDefined();
      expect(response.body.updatedBy).toBe('admin-id');
    });
  });

  describe('DELETE /api/news-releases/:id', () => {
    let newsReleaseId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/news-releases')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validNewsRelease);

      newsReleaseId = response.body._id;
    });

    it('should soft delete news release', async () => {
      await request(app.getHttpServer())
        .delete(`/api/news-releases/${newsReleaseId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify it's soft deleted
      const response = await request(app.getHttpServer())
        .get(`/api/news-releases/${newsReleaseId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.deletedAt).toBeDefined();
    });

    it('should reject deletion with non-admin role', async () => {
      await request(app.getHttpServer())
        .delete(`/api/news-releases/${newsReleaseId}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .expect(403);
    });
  });

  describe('POST /api/news-releases/:id/publish', () => {
    let newsReleaseId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/news-releases')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validNewsRelease);

      newsReleaseId = response.body._id;
    });

    it('should publish draft news release', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/news-releases/${newsReleaseId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('published');
      expect(response.body.publishedAt).toBeDefined();
    });

    it('should schedule publication with future date', async () => {
      const futureDate = new Date(Date.now() + 86400000); // Tomorrow

      const response = await request(app.getHttpServer())
        .post(`/api/news-releases/${newsReleaseId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ publishAt: futureDate })
        .expect(200);

      expect(response.body.status).toBe('scheduled');
      expect(response.body.scheduledPublishAt).toBeDefined();
    });
  });

  describe('Public Endpoints', () => {
    beforeEach(async () => {
      // Create published news releases
      const publishedRelease = {
        ...validNewsRelease,
        status: 'published',
        publishedAt: new Date(),
        featured: true,
      };

      await request(app.getHttpServer())
        .post('/api/news-releases')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(publishedRelease);
    });

    it('should get published news without authentication', async () => {
      const response = await request(app.getHttpServer()).get('/api/public/news').expect(200);

      expect(response.body.items).toBeDefined();
      response.body.items.forEach((item) => {
        expect(item.status).toBe('published');
      });
    });

    it('should get featured news', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/public/news/featured')
        .expect(200);

      response.body.items.forEach((item) => {
        expect(item.featured).toBe(true);
      });
    });

    it('should generate RSS feed', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/public/news/feed.rss')
        .expect(200);

      expect(response.headers['content-type']).toContain('application/rss+xml');
      expect(response.text).toContain('<?xml');
      expect(response.text).toContain('<rss');
    });

    it('should generate Atom feed', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/public/news/feed.atom')
        .expect(200);

      expect(response.headers['content-type']).toContain('application/atom+xml');
      expect(response.text).toContain('<?xml');
      expect(response.text).toContain('<feed');
    });

    it('should track view count', async () => {
      const response = await request(app.getHttpServer()).get('/api/public/news').expect(200);

      const newsId = response.body.items[0]._id;
      const slug = response.body.items[0].slug;

      await request(app.getHttpServer()).get(`/api/public/news/${slug}`).expect(200);

      // Get updated news to check view count
      const updatedResponse = await request(app.getHttpServer())
        .get(`/api/news-releases/${newsId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(updatedResponse.body.viewCount).toBeGreaterThan(0);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting on public endpoints', async () => {
      // Make multiple requests quickly
      const requests = Array(101)
        .fill(null)
        .map(() => request(app.getHttpServer()).get('/api/public/news'));

      const responses = await Promise.all(requests);
      const rateLimited = responses.some((r) => r.status === 429);

      expect(rateLimited).toBe(true);
    });

    it('should enforce stricter rate limiting on write operations', async () => {
      // Make multiple write requests quickly
      const requests = Array(21)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .post('/api/news-releases')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(validNewsRelease),
        );

      const responses = await Promise.all(requests);
      const rateLimited = responses.some((r) => r.status === 429);

      expect(rateLimited).toBe(true);
    });
  });

  describe('Security Tests', () => {
    it('should prevent SQL injection in search', async () => {
      const maliciousSearch = "'; DROP TABLE news_releases; --";

      const response = await request(app.getHttpServer())
        .get(`/api/news-releases?search=${encodeURIComponent(maliciousSearch)}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Should return results without executing injection
      expect(response.body).toHaveProperty('items');
    });

    it('should prevent path traversal in image uploads', async () => {
      const maliciousFilename = '../../../etc/passwd';

      await request(app.getHttpServer())
        .post(`/api/news-releases/test-id/images`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from('test'), maliciousFilename)
        .expect(400);
    });

    it('should validate JSON metadata to prevent injection', async () => {
      const maliciousMetadata = {
        __proto__: { isAdmin: true },
        caption: 'Normal caption',
      };

      await request(app.getHttpServer())
        .post(`/api/news-releases/test-id/images`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('metadata', JSON.stringify(maliciousMetadata))
        .attach('file', Buffer.from('test'), 'test.jpg')
        .expect(400);
    });

    it('should sanitize all text fields against XSS', async () => {
      const xssAttempts = {
        ...validNewsRelease,
        title: {
          'pt-BR': '<img src=x onerror=alert(1)>',
          en: 'javascript:alert(1)',
          es: '<svg onload=alert(1)>',
        },
        subtitle: {
          'pt-BR': '<iframe src="javascript:alert(1)">',
          en: '<object data="javascript:alert(1)">',
          es: '<embed src="javascript:alert(1)">',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/api/news-releases')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(xssAttempts)
        .expect(201);

      // Verify dangerous content was removed
      Object.values(response.body.title).forEach((value) => {
        expect(value).not.toMatch(/javascript:|onerror|onload/i);
      });
    });
  });
});
