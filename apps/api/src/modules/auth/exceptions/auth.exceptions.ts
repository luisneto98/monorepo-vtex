import { HttpException, HttpStatus } from '@nestjs/common';

export class InvalidCredentialsException extends HttpException {
  constructor(message = 'Invalid email or password') {
    super(
      {
        error: {
          code: 'InvalidCredentialsException',
          message,
          details: null,
          timestamp: new Date().toISOString(),
          requestId: `auth-${Date.now()}`,
        },
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class InvalidRefreshTokenException extends HttpException {
  constructor(message = 'Invalid or expired refresh token') {
    super(
      {
        error: {
          code: 'InvalidRefreshTokenException',
          message,
          details: null,
          timestamp: new Date().toISOString(),
          requestId: `auth-${Date.now()}`,
        },
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class AccountDisabledException extends HttpException {
  constructor(message = 'Account is disabled') {
    super(
      {
        error: {
          code: 'AccountDisabledException',
          message,
          details: null,
          timestamp: new Date().toISOString(),
          requestId: `auth-${Date.now()}`,
        },
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

export class TokenExpiredException extends HttpException {
  constructor(message = 'Token has expired') {
    super(
      {
        error: {
          code: 'TokenExpiredException',
          message,
          details: null,
          timestamp: new Date().toISOString(),
          requestId: `auth-${Date.now()}`,
        },
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}
