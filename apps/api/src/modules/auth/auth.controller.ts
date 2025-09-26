import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Response, Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Public } from '@common/decorators/public.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @HttpCode(HttpStatus.OK)
  @Post('login')
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
  async logout(@CurrentUser() user: any, @Res({ passthrough: true }) response: Response) {
    await this.authService.logout(user.sub);

    // Clear refresh token cookie
    this.clearRefreshTokenCookie(response);

    return;
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@CurrentUser() user: any) {
    return {
      id: user.sub,
      email: user.email,
      role: user.role,
    };
  }

  @Public()
  @Post('register')
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
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/auth/refresh',
    };

    response.cookie('refreshToken', refreshToken, cookieOptions);
  }

  private clearRefreshTokenCookie(response: Response) {
    response.cookie('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      expires: new Date(0),
      path: '/auth/refresh',
    });
  }

  private extractRefreshTokenFromCookie(request: ExpressRequest): string | null {
    return request.cookies?.refreshToken || null;
  }
}
