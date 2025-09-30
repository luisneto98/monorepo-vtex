import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // Para requests multipart/form-data, validar header Authorization explicitamente
    // antes do Passport processar, evitando conflitos com parsing de arquivo
    if (request.headers['content-type']?.includes('multipart/form-data')) {
      const authHeader = request.headers.authorization || request.headers.Authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Missing or invalid authorization header');
      }
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    if (err || !user) {
      // Log detalhado do erro para debug
      console.error('🔐 JWT Authentication failed:', {
        error: err?.message || 'User not found',
        name: err?.name,
      });

      // Se for erro de token expirado, retornar mensagem clara
      if (err?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expired. Please login again.');
      }

      throw err || new UnauthorizedException('Invalid token');
    }
    return user;
  }
}
