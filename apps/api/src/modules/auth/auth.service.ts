import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto, AuthResponseDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _, refreshToken: __, ...result } = user.toObject();
    return result;
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    const tokens = await this.generateTokens(user);

    // Store refresh token hash in database
    const hashedRefreshToken = await this.hashRefreshToken(tokens.refreshToken);
    await this.usersService.updateRefreshToken(user._id, hashedRefreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: this.getAccessTokenExpiresInSeconds(),
      tokenType: 'Bearer',
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        name: user.name,
      },
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthResponseDto> {
    try {
      // Verify refresh token
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      // Find user and validate refresh token
      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Verify refresh token matches stored hash
      const isRefreshTokenValid = await bcrypt.compare(refreshToken, user.refreshToken);
      if (!isRefreshTokenValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens (rotation)
      const tokens = await this.generateTokens({
        _id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
      });

      // Update refresh token in database
      const hashedRefreshToken = await this.hashRefreshToken(tokens.refreshToken);
      await this.usersService.updateRefreshToken(user._id, hashedRefreshToken);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: this.getAccessTokenExpiresInSeconds(),
        tokenType: 'Bearer',
        user: {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
          name: user.name,
        },
      };
    } catch (error) {
      this.logger.error('Refresh token validation failed', error.stack);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
  }

  private async generateTokens(user: any) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: this.configService.get<string>('jwt.accessExpiration'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiration'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async hashRefreshToken(refreshToken: string): Promise<string> {
    return bcrypt.hash(refreshToken, 10);
  }

  private getAccessTokenExpiresInSeconds(): number {
    const expiration = this.configService.get<string>('jwt.accessExpiration');
    // Parse duration string (e.g., '15m', '1h', '7d') to seconds
    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // Default to 15 minutes

    const [, value, unit] = match;
    const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
    return parseInt(value) * multipliers[unit];
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Set default preferences if not provided
    const userDto = {
      ...registerDto,
      password: hashedPassword,
      role: registerDto.role || 'participant',
      preferences: {
        language: 'pt' as const,
        timezone: 'America/Sao_Paulo',
        emailNotifications: true,
        pushNotifications: true,
        sessionReminders: true,
      },
    };

    const user = await this.usersService.create(userDto);

    // Login the newly registered user
    return this.login({ email: registerDto.email, password: registerDto.password });
  }
}
