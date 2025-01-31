// import {
//   CanActivate,
//   ExecutionContext,
//   Injectable,
//   UnauthorizedException,
// } from '@nestjs/common';
// import { Observable } from 'rxjs';
// import { JwtService } from '@nestjs/jwt';

// @Injectable()
// export class AuthGuard implements CanActivate {
//   constructor(private jwtService: JwtService) {}

//   canActivate(
//     context: ExecutionContext,
//   ): boolean | Promise<boolean> | Observable<boolean> {
//     const request: Request = context.switchToHttp().getRequest();
//     const isToken: string | null =
//       (request.headers['authorization'] as string | null | undefined) ?? null;
//     if (!isToken) {
//       throw new UnauthorizedException(
//         'Necesitas loguearte para acceder a esta seccion.',
//       );
//     }

//     // const token = request.headers['authorization'].split(' ')[1] ?? '';
//     // const token = (request.headers['authorization']?.split(' ') ?? [])[1] ?? '';
//     const token =
//       (request.headers['authorization'] as string).split(' ')[1] ?? '';
//     const secret = process.env.JWT_SECRET;

//     try {
//       const payload = this.jwtService.verify(token, { secret });
//       payload.iat = new Date(payload.iat * 1000); // emitido
//       payload.exp = new Date(payload.exp * 1000); // expiracion
//       payload.rol =
//         payload.rol === 'superadmin'
//           ? ['superadmin']
//           : payload.rol === 'admin'
//             ? ['admin']
//             : payload.rol === 'security'
//               ? ['security']
//               : payload.rol === 'googletemp'
//                 ? ['googletemp']
//                 : ['owner'];

//       request.user = payload;

//       return true;
//     } catch (error) {
//       throw new UnauthorizedException('Token invalido');
//     }
//   }
// }
