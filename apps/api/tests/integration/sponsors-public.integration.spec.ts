import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import request from 'supertest';
import { SponsorsModule } from '../../src/modules/sponsors/sponsors.module';
import { DatabaseModule } from '../../src/modules/database/database.module';
import { JwtService } from '@nestjs/jwt';
import { AuthModule } from '../../src/modules/auth/auth.module';

describe('Sponsors Public Endpoints Integration Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let authToken: string;
  let tierDiamondId: string;
  let tierGoldId: string;
  let invisibleSponsorId: string;

  const testUser = {
    _id: '507f1f77bcf86cd799439020',
    email: 'admin@vtexday.com',
    role: 'super_admin',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(
          process.env['MONGODB_TEST_URI'] || 'mongodb://localhost:27017/vtex-day-test',
        ),
        DatabaseModule,
        AuthModule,
        SponsorsModule,
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

    // Create sponsor tiers
    const tierDiamondResponse = await request(app.getHttpServer())
      .post('/sponsors/tiers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Diamond',
        displayName: { 'pt-BR': 'Diamante', en: 'Diamond' },
        order: 1,
        maxPosts: 10,
      });
    tierDiamondId = tierDiamondResponse.body.data._id;

    const tierGoldResponse = await request(app.getHttpServer())
      .post('/sponsors/tiers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Gold',
        displayName: { 'pt-BR': 'Ouro', en: 'Gold' },
        order: 2,
        maxPosts: 5,
      });
    tierGoldId = tierGoldResponse.body.data._id;

    // Create visible sponsor
    await request(app.getHttpServer())
      .post('/sponsors')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'VTEX',
        slug: 'vtex',
        description: {
          'pt-BR': 'Plataforma de comércio digital',
          en: 'Digital commerce platform',
        },
        tier: tierDiamondId,
        orderInTier: 1,
        websiteUrl: 'https://vtex.com',
        adminEmail: 'admin@vtex.com',
        contactEmail: 'contact@vtex.com',
        standLocation: 'A1',
        socialLinks: {
          linkedin: 'https://linkedin.com/company/vtex',
        },
        tags: ['technology', 'ecommerce'],
        isVisible: true,
        maxPosts: 10,
        postsUsed: 3,
      });

    // Create invisible sponsor
    const invisibleSponsorResponse = await request(app.getHttpServer())
      .post('/sponsors')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Hidden Corp',
        slug: 'hidden-corp',
        description: {
          'pt-BR': 'Empresa oculta',
          en: 'Hidden company',
        },
        tier: tierGoldId,
        orderInTier: 1,
        adminEmail: 'admin@hidden.com',
        isVisible: false,
        maxPosts: 5,
        postsUsed: 2,
      });
    invisibleSponsorId = invisibleSponsorResponse.body.data._id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /sponsors/public', () => {
    it('should return only visible sponsors', async () => {
      const response = await request(app.getHttpServer()).get('/sponsors/public').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Verify only visible sponsors are returned (isVisible field should NOT be exposed)
      response.body.data.forEach((sponsor: any) => {
        expect(sponsor.isVisible).toBeUndefined();
      });

      // Verify invisible sponsor is NOT in results
      const invisibleFound = response.body.data.find((s: any) => s._id === invisibleSponsorId);
      expect(invisibleFound).toBeUndefined();
    });

    it('should exclude sensitive fields (maxPosts, postsUsed, adminEmail)', async () => {
      const response = await request(app.getHttpServer()).get('/sponsors/public').expect(200);

      expect(response.body.data).toBeInstanceOf(Array);

      response.body.data.forEach((sponsor: any) => {
        expect(sponsor.maxPosts).toBeUndefined();
        expect(sponsor.postsUsed).toBeUndefined();
        expect(sponsor.adminEmail).toBeUndefined();
        expect(sponsor.deletedAt).toBeUndefined();
        expect(sponsor.deletedBy).toBeUndefined();
        expect(sponsor.deleteReason).toBeUndefined();
      });
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/sponsors/public?page=1&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.metadata).toBeDefined();
      expect(response.body.metadata.page).toBe(1);
      expect(response.body.metadata.limit).toBe(10);
      expect(response.body.metadata.total).toBeGreaterThan(0);
    });

    it('should allow unauthenticated access', async () => {
      const response = await request(app.getHttpServer()).get('/sponsors/public').expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /sponsors/public/grouped-by-tier', () => {
    it('should return sponsors grouped by tier', async () => {
      const response = await request(app.getHttpServer())
        .get('/sponsors/public/grouped-by-tier')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Verify structure
      response.body.data.forEach((tierGroup: any) => {
        expect(tierGroup.tier).toBeDefined();
        expect(tierGroup.tier._id).toBeDefined();
        expect(tierGroup.tier.name).toBeDefined();
        expect(tierGroup.tier.displayName).toBeDefined();
        expect(tierGroup.tier.order).toBeDefined();
        expect(tierGroup.sponsors).toBeInstanceOf(Array);
      });
    });

    it('should order tiers by priority', async () => {
      const response = await request(app.getHttpServer())
        .get('/sponsors/public/grouped-by-tier')
        .expect(200);

      const tierGroups = response.body.data;

      for (let i = 0; i < tierGroups.length - 1; i++) {
        expect(tierGroups[i].tier.order).toBeLessThanOrEqual(tierGroups[i + 1].tier.order);
      }
    });

    it('should only include visible sponsors', async () => {
      const response = await request(app.getHttpServer())
        .get('/sponsors/public/grouped-by-tier')
        .expect(200);

      const allSponsors: any[] = [];
      response.body.data.forEach((tierGroup: any) => {
        allSponsors.push(...tierGroup.sponsors);
      });

      allSponsors.forEach((sponsor) => {
        expect(sponsor.isVisible).toBeUndefined();
      });

      // Verify invisible sponsor is NOT in results
      const invisibleFound = allSponsors.find((s: any) => s._id === invisibleSponsorId);
      expect(invisibleFound).toBeUndefined();
    });

    it('should exclude sensitive fields', async () => {
      const response = await request(app.getHttpServer())
        .get('/sponsors/public/grouped-by-tier')
        .expect(200);

      response.body.data.forEach((tierGroup: any) => {
        tierGroup.sponsors.forEach((sponsor: any) => {
          expect(sponsor.maxPosts).toBeUndefined();
          expect(sponsor.postsUsed).toBeUndefined();
          expect(sponsor.adminEmail).toBeUndefined();
          expect(sponsor.deletedAt).toBeUndefined();
        });
      });
    });

    it('should allow unauthenticated access', async () => {
      const response = await request(app.getHttpServer())
        .get('/sponsors/public/grouped-by-tier')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /sponsors/public/:id', () => {
    it('should return visible sponsor details by ID', async () => {
      // Get a visible sponsor ID from the list
      const listResponse = await request(app.getHttpServer())
        .get('/sponsors/public')
        .expect(200);

      const sponsorId = listResponse.body.data[0]._id;

      const response = await request(app.getHttpServer())
        .get(`/sponsors/public/${sponsorId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data._id).toBe(sponsorId);
    });

    it('should exclude sensitive fields', async () => {
      const listResponse = await request(app.getHttpServer())
        .get('/sponsors/public')
        .expect(200);

      const sponsorId = listResponse.body.data[0]._id;

      const response = await request(app.getHttpServer())
        .get(`/sponsors/public/${sponsorId}`)
        .expect(200);

      const sponsor = response.body.data;

      expect(sponsor.maxPosts).toBeUndefined();
      expect(sponsor.postsUsed).toBeUndefined();
      expect(sponsor.adminEmail).toBeUndefined();
      expect(sponsor.isVisible).toBeUndefined();
      expect(sponsor.deletedAt).toBeUndefined();
    });

    it('should return 404 for invisible sponsor', async () => {
      const response = await request(app.getHttpServer())
        .get(`/sponsors/public/${invisibleSponsorId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent sponsor', async () => {
      const response = await request(app.getHttpServer())
        .get('/sponsors/public/507f1f77bcf86cd799999999')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should allow unauthenticated access', async () => {
      const listResponse = await request(app.getHttpServer())
        .get('/sponsors/public')
        .expect(200);

      const sponsorId = listResponse.body.data[0]._id;

      const response = await request(app.getHttpServer())
        .get(`/sponsors/public/${sponsorId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
