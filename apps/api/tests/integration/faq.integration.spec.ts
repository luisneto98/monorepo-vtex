import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import request from 'supertest';
import { FaqModule } from '../../src/modules/faq/faq.module';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { DatabaseModule } from '../../src/modules/database/database.module';
import { JwtService } from '@nestjs/jwt';

describe('FAQ Integration Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let authToken: string;
  let faqCategoryId: string;

  const testUser = {
    _id: '507f1f77bcf86cd799439020',
    email: 'admin@vtexday.com',
    role: 'super_admin',
  };

  const createFaqCategoryDto = {
    name: {
      'pt-BR': 'Geral',
      en: 'General',
    },
    description: {
      'pt-BR': 'Perguntas gerais sobre o evento',
      en: 'General questions about the event',
    },
    priority: 1,
  };

  const createFaqDto = {
    question: {
      'pt-BR': 'Como comprar ingressos?',
      en: 'How to buy tickets?',
    },
    answer: {
      'pt-BR': 'Você pode comprar ingressos através do nosso site oficial.',
      en: 'You can buy tickets through our official website.',
    },
    tags: ['tickets', 'purchase'],
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(
          process.env['MONGODB_TEST_URI'] || 'mongodb://localhost:27017/vtex-day-test',
        ),
        DatabaseModule,
        AuthModule,
        FaqModule,
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

    // Create an FAQ category for testing
    const categoryResponse = await request(app.getHttpServer())
      .post('/faq/categories')
      .set('Authorization', `Bearer ${authToken}`)
      .send(createFaqCategoryDto);
    faqCategoryId = categoryResponse.body.data._id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('FAQ Categories', () => {
    describe('POST /faq/categories', () => {
      it('should create a new FAQ category (admin only)', async () => {
        const categoryDto = {
          name: {
            'pt-BR': 'Palestrantes',
            en: 'Speakers',
          },
          description: {
            'pt-BR': 'Perguntas sobre palestrantes',
            en: 'Questions about speakers',
          },
          priority: 2,
        };

        const response = await request(app.getHttpServer())
          .post('/faq/categories')
          .set('Authorization', `Bearer ${authToken}`)
          .send(categoryDto)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('_id');
        expect(response.body.data.name).toEqual(categoryDto.name);
        expect(response.body.data.priority).toBe(categoryDto.priority);
      });

      it('should reject request without authentication', async () => {
        await request(app.getHttpServer())
          .post('/faq/categories')
          .send(createFaqCategoryDto)
          .expect(401);
      });

      it('should reject duplicate category names', async () => {
        await request(app.getHttpServer())
          .post('/faq/categories')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            ...createFaqCategoryDto,
            name: {
              'pt-BR': 'Geral', // Already exists
              en: 'General',
            },
          })
          .expect(409);
      });
    });

    describe('GET /faq/categories', () => {
      it('should return all FAQ categories (public endpoint)', async () => {
        const response = await request(app.getHttpServer()).get('/faq/categories').expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
      });
    });

    describe('PATCH /faq/categories/:id', () => {
      it('should update an FAQ category (admin only)', async () => {
        const updateDto = {
          priority: 5,
          description: {
            'pt-BR': 'Descrição atualizada',
            en: 'Updated description',
          },
        };

        const response = await request(app.getHttpServer())
          .patch(`/faq/categories/${faqCategoryId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateDto)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.priority).toBe(updateDto.priority);
        expect(response.body.data.description).toEqual(updateDto.description);
      });

      it('should reject request without authentication', async () => {
        await request(app.getHttpServer())
          .patch(`/faq/categories/${faqCategoryId}`)
          .send({ priority: 10 })
          .expect(401);
      });
    });
  });

  describe('FAQ Items', () => {
    describe('GET /faq', () => {
      it('should return paginated FAQ list (public endpoint)', async () => {
        const response = await request(app.getHttpServer()).get('/faq').expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('metadata');
        expect(response.body.metadata).toHaveProperty('total');
        expect(response.body.metadata).toHaveProperty('page');
        expect(response.body.metadata).toHaveProperty('limit');
      });

      it('should apply category filter correctly', async () => {
        const response = await request(app.getHttpServer())
          .get(`/faq?category=${faqCategoryId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should apply search filter correctly', async () => {
        const response = await request(app.getHttpServer()).get('/faq?search=ingresso').expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should apply pagination correctly', async () => {
        const response = await request(app.getHttpServer()).get('/faq?page=1&limit=5').expect(200);

        expect(response.body.metadata.page).toBe(1);
        expect(response.body.metadata.limit).toBe(5);
      });
    });

    describe('POST /faq', () => {
      it('should create a new FAQ (admin only)', async () => {
        const faqDto = {
          ...createFaqDto,
          category: faqCategoryId,
        };

        const response = await request(app.getHttpServer())
          .post('/faq')
          .set('Authorization', `Bearer ${authToken}`)
          .send(faqDto)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('_id');
        expect(response.body.data.question).toEqual(faqDto.question);
        expect(response.body.data.answer).toEqual(faqDto.answer);
        expect(response.body.data.category).toBe(faqDto.category);
        expect(response.body.data.viewCount).toBe(0);
      });

      it('should reject request without authentication', async () => {
        await request(app.getHttpServer())
          .post('/faq')
          .send({
            ...createFaqDto,
            category: faqCategoryId,
          })
          .expect(401);
      });

      it('should validate required fields', async () => {
        const invalidDto = {
          question: {
            'pt-BR': '', // Empty question
          },
          category: faqCategoryId,
        };

        await request(app.getHttpServer())
          .post('/faq')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidDto)
          .expect(400);
      });

      it('should reject invalid category', async () => {
        await request(app.getHttpServer())
          .post('/faq')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            ...createFaqDto,
            category: '507f1f77bcf86cd799439999', // Non-existent category
          })
          .expect(404);
      });
    });

    describe('GET /faq/:id', () => {
      let faqId: string;

      beforeAll(async () => {
        const response = await request(app.getHttpServer())
          .post('/faq')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            ...createFaqDto,
            question: {
              'pt-BR': 'Pergunta para teste de detalhes?',
              en: 'Question for detail test?',
            },
            category: faqCategoryId,
          });
        faqId = response.body.data._id;
      });

      it('should return FAQ details by id and increment view count (public endpoint)', async () => {
        const response = await request(app.getHttpServer()).get(`/faq/${faqId}`).expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('_id', faqId);
        expect(response.body.data).toHaveProperty('question');
        expect(response.body.data).toHaveProperty('answer');
        expect(response.body.data).toHaveProperty('category');
        expect(response.body.data.viewCount).toBe(1);

        // Second request should increment view count
        const secondResponse = await request(app.getHttpServer()).get(`/faq/${faqId}`).expect(200);

        expect(secondResponse.body.data.viewCount).toBe(2);
      });

      it('should return 404 for non-existent FAQ', async () => {
        await request(app.getHttpServer()).get('/faq/507f1f77bcf86cd799439999').expect(404);
      });
    });

    describe('PATCH /faq/:id', () => {
      let faqId: string;

      beforeAll(async () => {
        const response = await request(app.getHttpServer())
          .post('/faq')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            ...createFaqDto,
            question: {
              'pt-BR': 'Pergunta para teste de atualização?',
              en: 'Question for update test?',
            },
            category: faqCategoryId,
          });
        faqId = response.body.data._id;
      });

      it('should update FAQ (admin only)', async () => {
        const updateDto = {
          priority: 200,
          tags: ['updated', 'test'],
        };

        const response = await request(app.getHttpServer())
          .patch(`/faq/${faqId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateDto)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.priority).toBe(updateDto.priority);
        expect(response.body.data.tags).toEqual(updateDto.tags);
      });

      it('should reject request without authentication', async () => {
        await request(app.getHttpServer())
          .patch(`/faq/${faqId}`)
          .send({ priority: 500 })
          .expect(401);
      });

      it('should return 404 for non-existent FAQ', async () => {
        await request(app.getHttpServer())
          .patch('/faq/507f1f77bcf86cd799439999')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ priority: 300 })
          .expect(404);
      });
    });

    describe('DELETE /faq/:id', () => {
      let faqId: string;

      beforeAll(async () => {
        const response = await request(app.getHttpServer())
          .post('/faq')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            ...createFaqDto,
            question: {
              'pt-BR': 'Pergunta para teste de exclusão?',
              en: 'Question for delete test?',
            },
            category: faqCategoryId,
          });
        faqId = response.body.data._id;
      });

      it('should soft delete FAQ (admin only)', async () => {
        const response = await request(app.getHttpServer())
          .delete(`/faq/${faqId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ reason: 'Test deletion' })
          .expect(200);

        expect(response.body.success).toBe(true);

        // Verify FAQ is no longer accessible via public endpoint
        await request(app.getHttpServer()).get(`/faq/${faqId}`).expect(404);
      });

      it('should reject request without authentication', async () => {
        await request(app.getHttpServer()).delete(`/faq/${faqId}`).expect(401);
      });

      it('should return 404 for non-existent FAQ', async () => {
        await request(app.getHttpServer())
          .delete('/faq/507f1f77bcf86cd799439999')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);
      });
    });

    describe('POST /faq/:id/restore', () => {
      let faqId: string;

      beforeAll(async () => {
        // Create and delete an FAQ
        const createResponse = await request(app.getHttpServer())
          .post('/faq')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            ...createFaqDto,
            question: {
              'pt-BR': 'Pergunta para teste de restauração?',
              en: 'Question for restore test?',
            },
            category: faqCategoryId,
          });
        faqId = createResponse.body.data._id;

        await request(app.getHttpServer())
          .delete(`/faq/${faqId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ reason: 'Test for restoration' });
      });

      it('should restore soft-deleted FAQ (admin only)', async () => {
        const response = await request(app.getHttpServer())
          .post(`/faq/${faqId}/restore`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);

        // Verify FAQ is accessible again via public endpoint
        await request(app.getHttpServer()).get(`/faq/${faqId}`).expect(200);
      });

      it('should reject request without authentication', async () => {
        await request(app.getHttpServer()).post(`/faq/${faqId}/restore`).expect(401);
      });
    });

    describe('GET /faq/search', () => {
      beforeAll(async () => {
        // Create FAQ with searchable content
        await request(app.getHttpServer())
          .post('/faq')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            question: {
              'pt-BR': 'Onde fica o evento VTEX Day?',
              en: 'Where is the VTEX Day event located?',
            },
            answer: {
              'pt-BR': 'O evento será realizado no Centro de Convenções de São Paulo.',
              en: 'The event will be held at the São Paulo Convention Center.',
            },
            category: faqCategoryId,
            tags: ['location', 'venue', 'address'],
          });
      });

      it('should search FAQs by text (public endpoint)', async () => {
        const response = await request(app.getHttpServer())
          .get('/faq/search?q=VTEX Day')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should search FAQs by tags', async () => {
        const response = await request(app.getHttpServer())
          .get('/faq/search?q=location')
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe('GET /faq/category/:categoryId', () => {
      beforeAll(async () => {
        // Create FAQ for specific category
        await request(app.getHttpServer())
          .post('/faq')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            question: {
              'pt-BR': 'Pergunta específica da categoria?',
              en: 'Category specific question?',
            },
            answer: {
              'pt-BR': 'Resposta específica da categoria.',
              en: 'Category specific answer.',
            },
            category: faqCategoryId,
            tags: ['category-specific'],
          });
      });

      it('should return FAQs for specific category (public endpoint)', async () => {
        const response = await request(app.getHttpServer())
          .get(`/faq/category/${faqCategoryId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);

        // All returned FAQs should belong to the specified category
        response.body.data.forEach((faq: any) => {
          expect(faq.category).toBe(faqCategoryId);
        });
      });
    });

    describe('DELETE /faq/categories/:id', () => {
      let emptyCategoryId: string;

      beforeAll(async () => {
        // Create a category without FAQs
        const response = await request(app.getHttpServer())
          .post('/faq/categories')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: {
              'pt-BR': 'Categoria Vazia',
              en: 'Empty Category',
            },
            description: {
              'pt-BR': 'Categoria sem perguntas',
              en: 'Category without questions',
            },
            priority: 100,
          });
        emptyCategoryId = response.body.data._id;
      });

      it('should delete empty FAQ category (admin only)', async () => {
        const response = await request(app.getHttpServer())
          .delete(`/faq/categories/${emptyCategoryId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should reject deletion of category with FAQs', async () => {
        await request(app.getHttpServer())
          .delete(`/faq/categories/${faqCategoryId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(409);
      });

      it('should reject request without authentication', async () => {
        await request(app.getHttpServer()).delete(`/faq/categories/${emptyCategoryId}`).expect(401);
      });
    });
  });
});
