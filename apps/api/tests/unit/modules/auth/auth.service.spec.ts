import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../../../../src/modules/auth/auth.service';
import { UsersService } from '../../../../src/modules/users/users.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'admin@example.com',
    password: '$2b$10$hashedPasswordHere',
    role: 'super_admin',
    name: 'Admin User',
    isActive: true,
    refreshToken: '$2b$10$hashedRefreshTokenHere',
    toObject: function () {
      return { ...this };
    },
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    updateRefreshToken: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        'jwt.secret': 'test-secret',
        'jwt.accessExpiration': '15m',
        'jwt.refreshExpiration': '7d',
        'jwt.refreshSecret': 'test-refresh-secret',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user data when credentials are valid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

      const result = await service.validateUser('admin@example.com', 'password123');

      expect(result).toBeDefined();
      expect(result.email).toBe('admin@example.com');
      expect(result.password).toBeUndefined();
      expect(result.refreshToken).toBeUndefined();
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.validateUser('nonexistent@example.com', 'password123')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ ...mockUser, isActive: false });

      await expect(service.validateUser('admin@example.com', 'password123')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      await expect(service.validateUser('admin@example.com', 'wrongpassword')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('login', () => {
    it('should return access token and user data on successful login', async () => {
      const loginDto = { email: 'admin@example.com', password: 'password123' };
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
      mockJwtService.signAsync.mockResolvedValueOnce('access-token');
      mockJwtService.signAsync.mockResolvedValueOnce('refresh-token');
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('hashedToken'));
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken', 'access-token');
      expect(result).toHaveProperty('refreshToken', 'refresh-token');
      expect(result).toHaveProperty('expiresIn');
      expect(result).toHaveProperty('tokenType', 'Bearer');
      expect(result.user).toEqual({
        id: mockUser._id.toString(),
        email: mockUser.email,
        role: mockUser.role,
        name: mockUser.name,
      });
    });
  });

  describe('refreshTokens', () => {
    it('should return new tokens when refresh token is valid', async () => {
      const refreshToken = 'valid-refresh-token';
      const payload = { sub: mockUser._id, email: mockUser.email, role: mockUser.role };

      mockJwtService.verifyAsync.mockResolvedValue(payload);
      mockUsersService.findById.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
      mockJwtService.signAsync.mockResolvedValueOnce('new-access-token');
      mockJwtService.signAsync.mockResolvedValueOnce('new-refresh-token');
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('hashedToken'));
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await service.refreshTokens(refreshToken);

      expect(result).toHaveProperty('accessToken', 'new-access-token');
      expect(result).toHaveProperty('refreshToken', 'new-refresh-token');
      expect(result).toHaveProperty('expiresIn');
      expect(result).toHaveProperty('tokenType', 'Bearer');
    });

    it('should throw UnauthorizedException when refresh token is invalid', async () => {
      const refreshToken = 'invalid-refresh-token';

      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const refreshToken = 'valid-refresh-token';
      const payload = { sub: 'nonexistent', email: mockUser.email, role: mockUser.role };

      mockJwtService.verifyAsync.mockResolvedValue(payload);
      mockUsersService.findById.mockResolvedValue(null);

      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when refresh token does not match', async () => {
      const refreshToken = 'valid-refresh-token';
      const payload = { sub: mockUser._id, email: mockUser.email, role: mockUser.role };

      mockJwtService.verifyAsync.mockResolvedValue(payload);
      mockUsersService.findById.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should clear refresh token for user', async () => {
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined);

      await service.logout(mockUser._id);

      expect(mockUsersService.updateRefreshToken).toHaveBeenCalledWith(mockUser._id, null);
    });
  });
});
