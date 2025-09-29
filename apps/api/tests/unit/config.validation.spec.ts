import configuration from '../../src/config/configuration';

describe('Configuration Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Application Config', () => {
    it('should use default port when PORT is not set', () => {
      delete process.env['PORT'];
      const config = configuration();
      expect(config.port).toBe(3000);
    });

    it('should use custom port when PORT is set', () => {
      process.env['PORT'] = '4000';
      const config = configuration();
      expect(config.port).toBe(4000);
    });
  });

  describe('Database Config', () => {
    it('should use default MongoDB URI when not set', () => {
      delete process.env['MONGODB_URI'];
      const config = configuration();
      expect(config.database.uri).toBe('mongodb://localhost:27017/vtexday26');
    });

    it('should use custom MongoDB URI when set', () => {
      process.env['MONGODB_URI'] = 'mongodb://custom:27017/test';
      const config = configuration();
      expect(config.database.uri).toBe('mongodb://custom:27017/test');
    });
  });

  describe('JWT Config', () => {
    it('should have JWT secret configuration', () => {
      const config = configuration();
      expect(config.jwt.secret).toBeDefined();
      expect(config.jwt.accessExpiration).toBeDefined();
    });

    it('should use custom JWT settings when provided', () => {
      process.env['JWT_SECRET'] = 'test-secret';
      process.env['JWT_ACCESS_EXPIRATION'] = '1d';
      const config = configuration();
      expect(config.jwt.secret).toBe('test-secret');
      expect(config.jwt.accessExpiration).toBe('1d');
    });
  });

  describe('Redis Config', () => {
    it('should have default Redis configuration', () => {
      const config = configuration();
      expect(config.redis.host).toBe('localhost');
      expect(config.redis.port).toBe(6379);
    });

    it('should use custom Redis settings when provided', () => {
      process.env['REDIS_HOST'] = 'redis.example.com';
      process.env['REDIS_PORT'] = '6380';
      process.env['REDIS_PASSWORD'] = 'secret';
      const config = configuration();
      expect(config.redis.host).toBe('redis.example.com');
      expect(config.redis.port).toBe(6380);
      expect(config.redis.password).toBe('secret');
    });
  });

  describe('CORS Config', () => {
    it('should have default CORS configuration', () => {
      const config = configuration();
      expect(config.cors.origin).toBeDefined();
    });

    it('should use custom CORS origin when provided', () => {
      process.env['CORS_ORIGIN'] = 'https://example.com';
      const config = configuration();
      expect(config.cors.origin).toBe('https://example.com');
    });
  });
});
