import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { UsersService } from '../../src/modules/users/users.service';
import * as bcrypt from 'bcrypt';

describe('Auth Endpoints (Integration)', () => {
  let app: INestApplication;
  let usersService: UsersService;

  const testUser = {
    email: 'test@example.com',
    password: 'TestPassword123!',
    role: 'participant',
    name: 'Test User',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    usersService = app.get<UsersService>(UsersService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('should authenticate user with valid credentials', async () => {
      // Mock user in database
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue({
        _id: 'userid123',
        ...testUser,
        password: hashedPassword,
        isActive: true,
        toObject: function() { return { ...this }; }
      } as any);

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('expiresIn');
      expect(response.body).toHaveProperty('tokenType', 'Bearer');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body).not.toHaveProperty('refreshToken'); // Should be in cookie only
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'WrongPassword',
        })
        .expect(401);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toContain('Invalid credentials');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for short password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'short',
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh tokens with valid refresh token', async () => {
      // First login to get refresh token
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      const mockUser = {
        _id: 'userid123',
        ...testUser,
        password: hashedPassword,
        isActive: true,
        refreshToken: null,
        toObject: function() { return { ...this }; }
      };

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser as any);
      jest.spyOn(usersService, 'findById').mockResolvedValue(mockUser as any);
      jest.spyOn(usersService, 'updateRefreshToken').mockImplementation(
        async (_userId, token) => {
          mockUser.refreshToken = token;
        }
      );

      // Login first
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      const cookies = loginResponse.headers['set-cookie'];

      // Attempt refresh
      const refreshResponse = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', cookies)
        .expect(200);

      expect(refreshResponse.body).toHaveProperty('accessToken');
      expect(refreshResponse.body).toHaveProperty('expiresIn');
      expect(refreshResponse.body).toHaveProperty('tokenType', 'Bearer');
      expect(refreshResponse.headers['set-cookie']).toBeDefined();
    });

    it('should return 401 when no refresh token provided', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .expect(401);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toContain('Refresh token not provided');
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout authenticated user', async () => {
      // Get valid token first
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue({
        _id: 'userid123',
        ...testUser,
        password: hashedPassword,
        isActive: true,
        toObject: function() { return { ...this }; }
      } as any);

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      const { accessToken } = loginResponse.body;

      jest.spyOn(usersService, 'updateRefreshToken').mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      // Check cookie is cleared
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('refreshToken=;');
      expect(cookies[0]).toContain('Expires=');
    });

    it('should return 401 for unauthenticated request', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .expect(401);
    });
  });

  describe('GET /auth/profile', () => {
    it('should return user profile for authenticated user', async () => {
      // Get valid token
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue({
        _id: 'userid123',
        ...testUser,
        password: hashedPassword,
        isActive: true,
        toObject: function() { return { ...this }; }
      } as any);

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      const { accessToken } = loginResponse.body;

      const response = await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', testUser.email);
      expect(response.body).toHaveProperty('role', testUser.role);
    });

    it('should return 401 for unauthenticated request', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/profile')
        .expect(401);
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit login attempts', async () => {
      // Make multiple rapid requests
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app.getHttpServer())
            .post('/api/auth/login')
            .send({
              email: 'test@example.com',
              password: 'password',
            })
        );
      }

      const responses = await Promise.all(requests);
      const tooManyRequests = responses.filter(r => r.status === 429);

      // Should have some rate limited responses
      expect(tooManyRequests.length).toBeGreaterThan(0);
    }, 10000); // Increase timeout for rate limit test
  });
});