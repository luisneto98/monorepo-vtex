import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import request from 'supertest';
import { SponsorsModule } from '../../src/modules/sponsors/sponsors.module';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { DatabaseModule } from '../../src/modules/database/database.module';
import { JwtService } from '@nestjs/jwt';

describe('Sponsors Integration Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let authToken: string;
  let sponsorTierId: string;

  const testUser = {
    _id: '507f1f77bcf86cd799439020',
    email: 'admin@vtexday.com',
    role: 'super_admin'
  };

  const createSponsorTierDto = {
    name: 'Diamond',
    description: {
      'pt-BR': 'Patrocinador Diamante',
      'en': 'Diamond Sponsor'
    },
    priority: 1,
    benefits: ['Logo principal', 'Estande premium'],
    maxSponsors: 3,
    price: 50000
  };

  const createSponsorDto = {
    name: 'Tech Corp',
    description: {
      'pt-BR': 'Empresa de tecnologia líder',
      'en': 'Leading technology company'
    },
    logoUrl: 'https://example.com/logo.png',
    websiteUrl: 'https://techcorp.com',
    contactInfo: {
      email: 'contact@techcorp.com',
      phone: '+55 11 99999-9999'
    },
    socialLinks: {
      linkedin: 'https://linkedin.com/company/techcorp',
      twitter: 'https://twitter.com/techcorp'
    },
    tags: ['Technology', 'SaaS']
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(process.env['MONGODB_TEST_URI'] || 'mongodb://localhost:27017/vtex-day-test'),
        DatabaseModule,
        AuthModule,
        SponsorsModule
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

    // Create a sponsor tier for testing
    const tierResponse = await request(app.getHttpServer())
      .post('/sponsors/tiers')
      .set('Authorization', `Bearer ${authToken}`)
      .send(createSponsorTierDto);
    sponsorTierId = tierResponse.body.data._id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Sponsor Tiers', () => {
    describe('POST /sponsors/tiers', () => {
      it('should create a new sponsor tier (admin only)', async () => {
        const tierDto = {
          name: 'Gold',
          description: {
            'pt-BR': 'Patrocinador Ouro',
            'en': 'Gold Sponsor'
          },
          priority: 2,
          benefits: ['Logo médio', 'Estande padrão'],
          maxSponsors: 5,
          price: 25000
        };

        const response = await request(app.getHttpServer())
          .post('/sponsors/tiers')
          .set('Authorization', `Bearer ${authToken}`)
          .send(tierDto)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('_id');
        expect(response.body.data.name).toBe(tierDto.name);
        expect(response.body.data.priority).toBe(tierDto.priority);
        expect(response.body.data.price).toBe(tierDto.price);
      });

      it('should reject request without authentication', async () => {
        await request(app.getHttpServer())
          .post('/sponsors/tiers')
          .send(createSponsorTierDto)
          .expect(401);
      });

      it('should reject duplicate tier names', async () => {
        await request(app.getHttpServer())
          .post('/sponsors/tiers')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            ...createSponsorTierDto,
            name: 'Diamond' // Already exists
          })
          .expect(409);
      });
    });

    describe('GET /sponsors/tiers', () => {
      it('should return all sponsor tiers (public endpoint)', async () => {
        const response = await request(app.getHttpServer())
          .get('/sponsors/tiers')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
      });
    });

    describe('PATCH /sponsors/tiers/:id', () => {
      it('should update a sponsor tier (admin only)', async () => {
        const updateDto = {
          price: 60000,
          maxSponsors: 2
        };

        const response = await request(app.getHttpServer())
          .patch(`/sponsors/tiers/${sponsorTierId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateDto)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.price).toBe(updateDto.price);
        expect(response.body.data.maxSponsors).toBe(updateDto.maxSponsors);
      });

      it('should reject request without authentication', async () => {
        await request(app.getHttpServer())
          .patch(`/sponsors/tiers/${sponsorTierId}`)
          .send({ price: 70000 })
          .expect(401);
      });
    });
  });

  describe('Sponsors', () => {
    describe('GET /sponsors', () => {
      it('should return sponsors grouped by tier (public endpoint)', async () => {
        const response = await request(app.getHttpServer())
          .get('/sponsors')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should apply tier filter correctly', async () => {
        const response = await request(app.getHttpServer())
          .get(`/sponsors?tier=${sponsorTierId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should apply tags filter correctly', async () => {
        const response = await request(app.getHttpServer())
          .get('/sponsors?tags=Technology,SaaS')
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe('POST /sponsors', () => {
      it('should create a new sponsor (admin only)', async () => {
        const sponsorDto = {
          ...createSponsorDto,
          tier: sponsorTierId
        };

        const response = await request(app.getHttpServer())
          .post('/sponsors')
          .set('Authorization', `Bearer ${authToken}`)
          .send(sponsorDto)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('_id');
        expect(response.body.data.name).toBe(sponsorDto.name);
        expect(response.body.data.tier).toBe(sponsorDto.tier);
        expect(response.body.data.websiteUrl).toBe(sponsorDto.websiteUrl);
      });

      it('should reject request without authentication', async () => {
        await request(app.getHttpServer())
          .post('/sponsors')
          .send({
            ...createSponsorDto,
            tier: sponsorTierId
          })
          .expect(401);
      });

      it('should validate required fields', async () => {
        const invalidDto = {
          name: '', // Empty name
          tier: sponsorTierId
        };

        await request(app.getHttpServer())
          .post('/sponsors')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidDto)
          .expect(400);
      });

      it('should reject invalid tier', async () => {
        await request(app.getHttpServer())
          .post('/sponsors')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            ...createSponsorDto,
            tier: '507f1f77bcf86cd799439999' // Non-existent tier
          })
          .expect(404);
      });

      it('should reject duplicate sponsor names', async () => {
        await request(app.getHttpServer())
          .post('/sponsors')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            ...createSponsorDto,
            name: 'Tech Corp', // Already exists
            tier: sponsorTierId
          })
          .expect(409);
      });
    });

    describe('GET /sponsors/:id', () => {
      let sponsorId: string;

      beforeAll(async () => {
        const response = await request(app.getHttpServer())
          .post('/sponsors')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            ...createSponsorDto,
            name: 'Sponsor For Detail Test',
            tier: sponsorTierId
          });
        sponsorId = response.body.data._id;
      });

      it('should return sponsor details by id (public endpoint)', async () => {
        const response = await request(app.getHttpServer())
          .get(`/sponsors/${sponsorId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('_id', sponsorId);
        expect(response.body.data).toHaveProperty('name');
        expect(response.body.data).toHaveProperty('description');
        expect(response.body.data).toHaveProperty('tier');
        expect(response.body.data).toHaveProperty('contactInfo');
      });

      it('should return 404 for non-existent sponsor', async () => {
        await request(app.getHttpServer())
          .get('/sponsors/507f1f77bcf86cd799439999')
          .expect(404);
      });
    });

    describe('PATCH /sponsors/:id', () => {
      let sponsorId: string;

      beforeAll(async () => {
        const response = await request(app.getHttpServer())
          .post('/sponsors')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            ...createSponsorDto,
            name: 'Sponsor For Update Test',
            tier: sponsorTierId
          });
        sponsorId = response.body.data._id;
      });

      it('should update sponsor (admin only)', async () => {
        const updateDto = {
          websiteUrl: 'https://newtechcorp.com',
          tags: ['Updated', 'Technology']
        };

        const response = await request(app.getHttpServer())
          .patch(`/sponsors/${sponsorId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateDto)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.websiteUrl).toBe(updateDto.websiteUrl);
        expect(response.body.data.tags).toEqual(updateDto.tags);
      });

      it('should reject request without authentication', async () => {
        await request(app.getHttpServer())
          .patch(`/sponsors/${sponsorId}`)
          .send({ websiteUrl: 'https://unauthorized.com' })
          .expect(401);
      });

      it('should return 404 for non-existent sponsor', async () => {
        await request(app.getHttpServer())
          .patch('/sponsors/507f1f77bcf86cd799439999')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ websiteUrl: 'https://notfound.com' })
          .expect(404);
      });
    });

    describe('DELETE /sponsors/:id', () => {
      let sponsorId: string;

      beforeAll(async () => {
        const response = await request(app.getHttpServer())
          .post('/sponsors')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            ...createSponsorDto,
            name: 'Sponsor For Delete Test',
            tier: sponsorTierId
          });
        sponsorId = response.body.data._id;
      });

      it('should soft delete sponsor (admin only)', async () => {
        const response = await request(app.getHttpServer())
          .delete(`/sponsors/${sponsorId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ reason: 'Test deletion' })
          .expect(200);

        expect(response.body.success).toBe(true);

        // Verify sponsor is no longer accessible via public endpoint
        await request(app.getHttpServer())
          .get(`/sponsors/${sponsorId}`)
          .expect(404);
      });

      it('should reject request without authentication', async () => {
        await request(app.getHttpServer())
          .delete(`/sponsors/${sponsorId}`)
          .expect(401);
      });

      it('should return 404 for non-existent sponsor', async () => {
        await request(app.getHttpServer())
          .delete('/sponsors/507f1f77bcf86cd799439999')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);
      });
    });

    describe('POST /sponsors/:id/restore', () => {
      let sponsorId: string;

      beforeAll(async () => {
        // Create and delete a sponsor
        const createResponse = await request(app.getHttpServer())
          .post('/sponsors')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            ...createSponsorDto,
            name: 'Sponsor For Restore Test',
            tier: sponsorTierId
          });
        sponsorId = createResponse.body.data._id;

        await request(app.getHttpServer())
          .delete(`/sponsors/${sponsorId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ reason: 'Test for restoration' });
      });

      it('should restore soft-deleted sponsor (admin only)', async () => {
        const response = await request(app.getHttpServer())
          .post(`/sponsors/${sponsorId}/restore`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);

        // Verify sponsor is accessible again via public endpoint
        await request(app.getHttpServer())
          .get(`/sponsors/${sponsorId}`)
          .expect(200);
      });

      it('should reject request without authentication', async () => {
        await request(app.getHttpServer())
          .post(`/sponsors/${sponsorId}/restore`)
          .expect(401);
      });
    });

    describe('GET /sponsors/by-tier', () => {
      beforeAll(async () => {
        // Create sponsor with tier association
        await request(app.getHttpServer())
          .post('/sponsors')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            ...createSponsorDto,
            name: 'Sponsor By Tier Test',
            tier: sponsorTierId
          });
      });

      it('should return sponsors grouped by tier (public endpoint)', async () => {
        const response = await request(app.getHttpServer())
          .get('/sponsors/by-tier')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);

        // Check structure of grouped data
        if (response.body.data.length > 0) {
          expect(response.body.data[0]).toHaveProperty('_id');
          expect(response.body.data[0]).toHaveProperty('tier');
          expect(response.body.data[0]).toHaveProperty('sponsors');
          expect(Array.isArray(response.body.data[0].sponsors)).toBe(true);
        }
      });
    });

    describe('DELETE /sponsors/tiers/:id', () => {
      let emptyTierId: string;

      beforeAll(async () => {
        // Create a tier without sponsors
        const response = await request(app.getHttpServer())
          .post('/sponsors/tiers')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Empty Tier',
            description: {
              'pt-BR': 'Nível vazio',
              'en': 'Empty tier'
            },
            priority: 10,
            benefits: ['Test benefit'],
            maxSponsors: 1,
            price: 1000
          });
        emptyTierId = response.body.data._id;
      });

      it('should delete empty sponsor tier (admin only)', async () => {
        const response = await request(app.getHttpServer())
          .delete(`/sponsors/tiers/${emptyTierId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should reject deletion of tier with sponsors', async () => {
        await request(app.getHttpServer())
          .delete(`/sponsors/tiers/${sponsorTierId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(409);
      });

      it('should reject request without authentication', async () => {
        await request(app.getHttpServer())
          .delete(`/sponsors/tiers/${emptyTierId}`)
          .expect(401);
      });
    });
  });
});