import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  cookies: Record<string, string>;
  user: unknown;
}
interface JwtPayload {
  id: string; // ID del usuario
  email: string;
  image: string;
  name: string;
  lastName: string;
  secretariat: string;
  rol: 'superadmin' | 'admin' | 'user';
  iat: number;
  exp: number;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    // ✅ Intentar obtener el token desde el header o desde la cookie
    let token: string | undefined;
    // const isToken: string | null =
    //   (request.headers['authorization'] as string | null | undefined) ?? null;
    // const authHeader: string | undefined = typeof request.headers.authorization === 'string'
    // ? request.headers.authorization
    // : undefined;
    if (
      typeof request.headers['authorization'] === 'string' &&
      request.headers['authorization'].startsWith('Bearer ')
    ) {
      token = request.headers['authorization'].split(' ')[1];
    } else if (request.cookies?.access_token) {
      token = request.cookies.access_token; // Si usas cookies HTTPOnly
    }

    if (!token) {
      throw new UnauthorizedException(
        'Necesitas loguearte para acceder a esta seccion.',
      );
    }

    // const token = request.headers['authorization'].split(' ')[1] ?? '';
    // const token = (request.headers['authorization']?.split(' ') ?? [])[1] ?? '';
    // const token =
    //   (request.headers['authorization'] as string).split(' ')[1] ?? '';

    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: process.env.JWT_SECRET,
      });

      request.user = {
        ...payload,
        roles: this.mapRoles(payload.rol),
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Token inválido o expirado.');
    }
    // try {
    //   const payload = this.jwtService.verify(token, { secret });
    //   payload.iat = new Date(payload.iat * 1000); // emitido
    //   payload.exp = new Date(payload.exp * 1000); // expiracion
    //   payload.rol =
    //     payload.rol === 'superadmin'
    //       ? ['superadmin']
    //       : payload.rol === 'admin'
    //         ? ['admin']
    //         : payload.rol === 'user'
    //           ? ['user']
    //           : [];

    //   request.user = payload;

    //   return true;
    // } catch (error) {
    //   throw new UnauthorizedException('Token invalido');
    // }
  }
  private mapRoles(role: string): string[] {
    const rolesMap: Record<string, string[]> = {
      superadmin: ['superadmin'],
      admin: ['admin'],
      user: ['user'],
    };
    return rolesMap[role] || [];
  }
}
