import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, Model } from 'mongoose';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { User, UserSchema, UserDocument } from '@modules/users/schemas/user.schema';
import { UserRole } from '@shared/types/user.types';

describe('UserSchema', () => {
  let mongod: MongoMemoryServer;
  let connection: Connection;
  let userModel: Model<UserDocument>;
  let module: TestingModule;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
      ],
    }).compile();

    connection = module.get<Connection>(getConnectionToken());
    userModel = module.get<Model<UserDocument>>(getModelToken(User.name));
  });

  afterAll(async () => {
    await connection.close();
    await mongod.stop();
  });

  afterEach(async () => {
    await userModel.deleteMany({});
  });

  describe('Validation', () => {
    it('should enforce required fields', async () => {
      const user = new userModel({});

      await expect(user.save()).rejects.toThrow();
    });

    it('should validate email format', async () => {
      const invalidUser = new userModel({
        email: 'invalid-email',
        password: 'password123',
        role: UserRole.PARTICIPANT,
        profile: { name: 'Test User' },
      });

      await expect(invalidUser.save()).rejects.toThrow();

      const validUser = new userModel({
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.PARTICIPANT,
        profile: { name: 'Test User' },
      });

      const saved = await validUser.save();
      expect(saved.email).toBe('test@example.com');
    });

    it('should validate role enum values', async () => {
      const invalidUser = new userModel({
        email: 'test@example.com',
        password: 'password123',
        role: 'invalid_role',
        profile: { name: 'Test User' },
      });

      await expect(invalidUser.save()).rejects.toThrow();

      const validUser = new userModel({
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.SUPER_ADMIN,
        profile: { name: 'Test User' },
      });

      const saved = await validUser.save();
      expect(saved.role).toBe(UserRole.SUPER_ADMIN);
    });

    it('should validate profile name length', async () => {
      const shortName = new userModel({
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.PARTICIPANT,
        profile: { name: 'Ab' },
      });

      await expect(shortName.save()).rejects.toThrow();

      const longName = new userModel({
        email: 'test2@example.com',
        password: 'password123',
        role: UserRole.PARTICIPANT,
        profile: { name: 'A'.repeat(101) },
      });

      await expect(longName.save()).rejects.toThrow();
    });

    it('should validate phone format', async () => {
      const invalidPhone = new userModel({
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.PARTICIPANT,
        profile: { name: 'Test User', phone: 'invalid' },
      });

      await expect(invalidPhone.save()).rejects.toThrow();

      const validPhone = new userModel({
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.PARTICIPANT,
        profile: { name: 'Test User', phone: '+551199999999' },
      });

      const saved = await validPhone.save();
      expect(saved.profile.phone).toBe('+551199999999');
    });

    it('should validate language enum', async () => {
      const invalidLang = new userModel({
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.PARTICIPANT,
        profile: { name: 'Test User', language: 'invalid' },
      });

      await expect(invalidLang.save()).rejects.toThrow();
    });
  });

  describe('Middleware', () => {
    it('should normalize email to lowercase and trim', async () => {
      const user = new userModel({
        email: '  TEST@EXAMPLE.COM  ',
        password: 'password123',
        role: UserRole.PARTICIPANT,
        profile: { name: '  Test User  ' },
      });

      const saved = await user.save();
      expect(saved.email).toBe('test@example.com');
      expect(saved.profile.name).toBe('Test User');
    });

    it('should trim profile fields', async () => {
      const user = new userModel({
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.PARTICIPANT,
        profile: {
          name: '  Test User  ',
          company: '  Test Company  ',
          position: '  Developer  ',
        },
      });

      const saved = await user.save();
      expect(saved.profile.name).toBe('Test User');
      expect(saved.profile.company).toBe('Test Company');
      expect(saved.profile.position).toBe('Developer');
    });
  });

  describe('Default Values', () => {
    it('should set default values', async () => {
      const user = new userModel({
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.PARTICIPANT,
        profile: { name: 'Test User' },
      });

      const saved = await user.save();
      expect(saved.isActive).toBe(true);
      expect(saved.isValidated).toBe(false);
      expect(saved.profile.language).toBe('pt-BR');
      expect(saved.preferences.notificationsEnabled).toBe(true);
      expect(saved.preferences.interests).toEqual([]);
      expect(saved.preferences.favoriteSessionIds).toEqual([]);
    });
  });

  describe('Virtual Fields', () => {
    it('should compute displayName from profile name', async () => {
      const user = new userModel({
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.PARTICIPANT,
        profile: { name: 'John Doe' },
      });

      const saved = await user.save();
      expect(saved.displayName).toBe('John Doe');
    });

    it('should compute displayName from email if name is missing', async () => {
      const user = new userModel({
        email: 'johndoe@example.com',
        password: 'password123',
        role: UserRole.PARTICIPANT,
        profile: { name: '' },
      });

      const saved = await user.save();
      expect(saved.displayName).toBe('johndoe');
    });
  });

  describe('toJSON Method', () => {
    it('should exclude password and refreshToken from JSON', async () => {
      const user = new userModel({
        email: 'test@example.com',
        password: 'password123',
        refreshToken: 'token123',
        role: UserRole.PARTICIPANT,
        profile: { name: 'Test User' },
      });

      const saved = await user.save();
      const json = saved.toJSON();

      expect(json.password).toBeUndefined();
      expect(json.refreshToken).toBeUndefined();
      expect(json.email).toBe('test@example.com');
    });
  });

  describe('Indexes', () => {
    it('should enforce unique email', async () => {
      const user1 = new userModel({
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.PARTICIPANT,
        profile: { name: 'User 1' },
      });

      await user1.save();

      const user2 = new userModel({
        email: 'test@example.com',
        password: 'password456',
        role: UserRole.PARTICIPANT,
        profile: { name: 'User 2' },
      });

      await expect(user2.save()).rejects.toThrow();
    });

    it('should have proper indexes', async () => {
      const indexes = await userModel.collection.getIndexes();

      expect(indexes).toHaveProperty('email_1');
      expect(indexes).toHaveProperty('role_1');
      expect(indexes).toHaveProperty('isValidated_1');
    });
  });
});