import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { UserRole } from '@vtexday26/shared';

describe('Press Materials Integration Tests', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;
  let materialId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    // Login as admin
    const adminRes = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'admin@vtexday.com',
      password: 'Admin@123',
    });
    adminToken = adminRes.body.access_token;

    // Login as regular user
    const userRes = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'user@vtexday.com',
      password: 'User@123',
    });
    userToken = userRes.body.access_token;
  });

  afterAll(async () => {
    // Clean up created materials
    if (materialId) {
      await request(app.getHttpServer())
        .delete(`/press-materials/${materialId}`)
        .set('Authorization', `Bearer ${adminToken}`);
    }
    await app.close();
  });

  describe('POST /press-materials', () => {
    it('should create a press material as admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/press-materials')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('type', 'photo')
        .field('title[pt]', 'Foto Teste')
        .field('title[en]', 'Test Photo')
        .field('title[es]', 'Foto Prueba')
        .field('description[pt]', 'Descrição da foto')
        .field('description[en]', 'Photo description')
        .field('description[es]', 'Descripción de la foto')
        .field('tags', 'test,photo')
        .field('status', 'published')
        .field('accessLevel', 'public')
        .attach('file', Buffer.from('fake-image-data'), 'test.jpg');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body.type).toBe('photo');
      expect(response.body.title.pt).toBe('Foto Teste');
      materialId = response.body._id;
    });

    it('should fail to create material without admin role', async () => {
      const response = await request(app.getHttpServer())
        .post('/press-materials')
        .set('Authorization', `Bearer ${userToken}`)
        .field('type', 'photo')
        .field('title[pt]', 'Foto Teste')
        .field('title[en]', 'Test Photo')
        .field('title[es]', 'Foto Prueba')
        .attach('file', Buffer.from('fake-image-data'), 'test.jpg');

      expect(response.status).toBe(403);
    });

    it('should fail without file', async () => {
      const response = await request(app.getHttpServer())
        .post('/press-materials')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('type', 'photo')
        .field('title[pt]', 'Foto Teste')
        .field('title[en]', 'Test Photo')
        .field('title[es]', 'Foto Prueba');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('File is required');
    });
  });

  describe('GET /press-materials', () => {
    it('should get all materials as admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/press-materials')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          page: 1,
          limit: 10,
          status: 'published',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('totalPages');
    });

    it('should fail without admin role', async () => {
      const response = await request(app.getHttpServer())
        .get('/press-materials')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /press-materials/public', () => {
    it('should get public materials without authentication', async () => {
      const response = await request(app.getHttpServer()).get('/press-materials/public');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /press-materials/:id', () => {
    it('should get specific material as admin', async () => {
      if (!materialId) return;

      const response = await request(app.getHttpServer())
        .get(`/press-materials/${materialId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(materialId);
    });

    it('should return 404 for non-existent material', async () => {
      const response = await request(app.getHttpServer())
        .get('/press-materials/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /press-materials/:id', () => {
    it('should update material as admin', async () => {
      if (!materialId) return;

      const response = await request(app.getHttpServer())
        .put(`/press-materials/${materialId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: {
            pt: 'Foto Atualizada',
            en: 'Updated Photo',
            es: 'Foto Actualizada',
          },
          status: 'archived',
        });

      expect(response.status).toBe(200);
      expect(response.body.title.pt).toBe('Foto Atualizada');
      expect(response.body.status).toBe('archived');
    });
  });

  describe('GET /press-materials/:id/download', () => {
    it('should get download URL for public material', async () => {
      if (!materialId) return;

      const response = await request(app.getHttpServer()).get(
        `/press-materials/${materialId}/download`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('url');
    });
  });

  describe('GET /press-materials/:id/statistics', () => {
    it('should get statistics as admin', async () => {
      if (!materialId) return;

      const response = await request(app.getHttpServer())
        .get(`/press-materials/${materialId}/statistics`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalDownloads');
      expect(response.body).toHaveProperty('uniqueVisitors');
    });
  });

  describe('POST /press-materials/upload', () => {
    it('should upload file to S3', async () => {
      const response = await request(app.getHttpServer())
        .post('/press-materials/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('materialType', 'photo')
        .attach('file', Buffer.from('fake-image-data'), 'upload.jpg');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('fileUrl');
      expect(response.body).toHaveProperty('metadata');
    });
  });

  describe('DELETE /press-materials/:id', () => {
    it('should delete material as admin', async () => {
      // Create a material to delete
      const createRes = await request(app.getHttpServer())
        .post('/press-materials')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('type', 'photo')
        .field('title[pt]', 'Para Deletar')
        .field('title[en]', 'To Delete')
        .field('title[es]', 'Para Eliminar')
        .attach('file', Buffer.from('fake-image-data'), 'delete.jpg');

      const deleteId = createRes.body._id;

      const response = await request(app.getHttpServer())
        .delete(`/press-materials/${deleteId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted successfully');

      // Verify it's deleted
      const getRes = await request(app.getHttpServer())
        .get(`/press-materials/${deleteId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getRes.status).toBe(404);
    });
  });
});
