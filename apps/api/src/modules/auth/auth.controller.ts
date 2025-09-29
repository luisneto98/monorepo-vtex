import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { Response, Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Public } from '@common/decorators/public.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiBody({
    type: LoginDto,
    examples: {
      admin: {
        value: {
          email: 'admin@vtexday.com',
          password: 'SecurePassword123!',
        },
        description: 'Admin user login',
      },
      regular: {
        value: {
          email: 'user@example.com',
          password: 'UserPassword456!',
        },
        description: 'Regular user login',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: '507f1f77bcf86cd799439011',
          email: 'admin@vtexday.com',
          role: 'admin',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid credentials',
        error: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests',
    schema: {
      example: {
        statusCode: 429,
        message: 'ThrottlerException: Too Many Requests',
        error: 'Too Many Requests',
      },
    },
  })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const authResult = await this.authService.login(loginDto);

    // Set refresh token in HttpOnly cookie
    this.setRefreshTokenCookie(response, authResult.refreshToken);

    // Return auth response without refresh token in body
    const { refreshToken, ...result } = authResult;
    return result;
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token from cookie' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: '507f1f77bcf86cd799439011',
          email: 'admin@vtexday.com',
          role: 'admin',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid or expired refresh token',
        error: 'Unauthorized',
      },
    },
  })
  async refresh(@Req() request: ExpressRequest, @Res({ passthrough: true }) response: Response) {
    const refreshToken = this.extractRefreshTokenFromCookie(request);

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not provided');
    }

    const authResult = await this.authService.refreshTokens(refreshToken);

    // Set new refresh token in HttpOnly cookie
    this.setRefreshTokenCookie(response, authResult.refreshToken);

    // Return auth response without refresh token in body
    const { refreshToken: _, ...result } = authResult;
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout user and invalidate tokens' })
  @ApiResponse({
    status: 204,
    description: 'Logout successful',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async logout(@CurrentUser() user: any, @Res({ passthrough: true }) response: Response) {
    await this.authService.logout(user.sub);

    // Clear refresh token cookie
    this.clearRefreshTokenCookie(response);

    return;
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      example: {
        id: '507f1f77bcf86cd799439011',
        email: 'admin@vtexday.com',
        role: 'admin',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  getProfile(@CurrentUser() user: any) {
    return {
      id: user.sub,
      email: user.email,
      role: user.role,
    };
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  @ApiBody({
    type: RegisterDto,
    examples: {
      newUser: {
        value: {
          email: 'newuser@example.com',
          password: 'SecurePassword123!',
          name: 'João Silva',
          company: 'VTEX',
          phone: '+5511999999999',
        },
        description: 'New user registration',
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: '507f1f77bcf86cd799439011',
          email: 'newuser@example.com',
          role: 'user',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or user already exists',
    schema: {
      example: {
        statusCode: 400,
        message: ['email must be an email', 'password is too weak'],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Email already registered',
    schema: {
      example: {
        statusCode: 409,
        message: 'Email already registered',
        error: 'Conflict',
      },
    },
  })
  async register(@Body() registerDto: RegisterDto, @Res({ passthrough: true }) response: Response) {
    const authResult = await this.authService.register(registerDto);

    // Set refresh token in HttpOnly cookie
    this.setRefreshTokenCookie(response, authResult.refreshToken);

    // Return auth response without refresh token in body
    const { refreshToken: __, ...result } = authResult;
    return result;
  }

  private setRefreshTokenCookie(response: Response, refreshToken: string) {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/auth/refresh',
    };

    response.cookie('refreshToken', refreshToken, cookieOptions);
  }

  private clearRefreshTokenCookie(response: Response) {
    response.cookie('refreshToken', '', {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict' as const,
      expires: new Date(0),
      path: '/auth/refresh',
    });
  }

  private extractRefreshTokenFromCookie(request: ExpressRequest): string | null {
    return request.cookies?.['refreshToken'] || null;
  }
}
