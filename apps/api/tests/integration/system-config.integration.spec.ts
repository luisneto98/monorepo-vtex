import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { MongooseModule } from '@nestjs/mongoose';
import { SystemConfigModule } from '../../src/modules/system-config/system-config.module';
import { AuthModule } from '../../src/modules/auth/auth.module';

describe('SystemConfig (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/test'),
        SystemConfigModule,
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Get auth token for SUPER_ADMIN user
    // This would need proper auth setup in test environment
    authToken = 'test-token';
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/system-config (GET)', () => {
    it('should return system configuration', () => {
      return request(app.getHttpServer())
        .get('/system-config')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('sections');
          expect(res.body.sections).toHaveProperty('speakers');
          expect(res.body.sections).toHaveProperty('sponsors');
          expect(res.body.sections).toHaveProperty('sessions');
          expect(res.body.sections).toHaveProperty('faq');
          expect(res.body.sections).toHaveProperty('registration');
          expect(res.body.sections).toHaveProperty('schedule');
        });
    });
  });

  describe('/system-config/section/:section (GET)', () => {
    it('should return specific section visibility', () => {
      return request(app.getHttpServer())
        .get('/system-config/section/speakers')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('isVisible');
          expect(res.body).toHaveProperty('lastChanged');
          expect(res.body).toHaveProperty('changedBy');
        });
    });

    it('should handle invalid section name', () => {
      return request(app.getHttpServer()).get('/system-config/section/invalid').expect(400);
    });
  });

  describe('/system-config (PUT)', () => {
    it('should update system configuration with auth', () => {
      const updateData = {
        sections: {
          speakers: {
            isVisible: false,
            changeReason: 'Testing visibility change',
          },
        },
      };

      return request(app.getHttpServer())
        .put('/system-config')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body.sections.speakers.isVisible).toBe(false);
        });
    });

    it('should reject update without auth', () => {
      const updateData = {
        sections: {
          speakers: {
            isVisible: false,
          },
        },
      };

      return request(app.getHttpServer()).put('/system-config').send(updateData).expect(401);
    });

    it('should validate update data', () => {
      const invalidData = {
        sections: {
          speakers: {
            isVisible: 'not-a-boolean',
          },
        },
      };

      return request(app.getHttpServer())
        .put('/system-config')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });
  });

  describe('/system-config/section/:section (PATCH)', () => {
    it('should update specific section', () => {
      const updateData = {
        isVisible: true,
        customMessage: {
          'pt-BR': 'Esta seção estará disponível em breve',
          en: 'This section will be available soon',
        },
        changeReason: 'Adding custom message',
      };

      return request(app.getHttpServer())
        .patch('/system-config/section/faq')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body.sections.faq.customMessage).toBeDefined();
        });
    });

    it('should handle scheduled activation', () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);

      const updateData = {
        scheduledActivation: {
          dateTime: futureDate.toISOString(),
          timezone: 'America/Sao_Paulo',
        },
        changeReason: 'Scheduling activation',
      };

      return request(app.getHttpServer())
        .patch('/system-config/section/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body.sections.sessions.scheduledActivation).toBeDefined();
        });
    });
  });

  describe('/system-config/audit (GET)', () => {
    it('should return audit logs with auth', () => {
      return request(app.getHttpServer())
        .get('/system-config/audit')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('page');
          expect(res.body).toHaveProperty('limit');
          expect(res.body).toHaveProperty('totalPages');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should filter audit logs by section', () => {
      return request(app.getHttpServer())
        .get('/system-config/audit?section=speakers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          if (res.body.data.length > 0) {
            res.body.data.forEach((log: any) => {
              expect(log.section).toBe('speakers');
            });
          }
        });
    });

    it('should paginate audit logs', () => {
      return request(app.getHttpServer())
        .get('/system-config/audit?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.limit).toBe(5);
          expect(res.body.page).toBe(1);
          expect(res.body.data.length).toBeLessThanOrEqual(5);
        });
    });
  });

  describe('/system-config/preview (GET)', () => {
    it('should return scheduled changes', () => {
      return request(app.getHttpServer())
        .get('/system-config/preview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/system-config/apply-scheduled (POST)', () => {
    it('should apply scheduled changes with auth', () => {
      return request(app.getHttpServer())
        .post('/system-config/apply-scheduled')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toBe('Scheduled changes applied successfully');
        });
    });
  });
});
