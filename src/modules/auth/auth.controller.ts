import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-auth.dto';
import { Request, Response } from 'express';
import { config as dotenvConfig } from 'dotenv';
import { AuthGuard } from 'src/guards/auth.guard';

dotenvConfig({ path: '.env' });
interface JwtPayload extends Request {
  user?: {
    id: string; // ID del usuario
    email: string;
    image: string;
    name: string;
    lastName: string;
    rol: 'superadmin' | 'admin' | 'user';
  };
}
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard)
  @Get('validate-token')
  validateToken(@Req() req: JwtPayload) {
    const user = req.user;
    return { user };
  }

  @Post('signin')
  async signInUser(@Body() userLogin: LoginUserDto, @Res() res: Response) {
    // console.log(JSON.stringify(userLogin));
    // return { msj: 'hola' };
    const { token, user } = await this.authService.singInUser(userLogin);
    // 👉 Guardar el token en una cookie HTTPOnly
    res.cookie('access_token', token, {
      httpOnly: true, // No accesible desde JavaScript
      secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
      sameSite: 'lax', // Previene ataques CSRF básicos
    });
    return res.status(HttpStatus.OK).json({ user });
  }

  @Post('logout')
  logout(@Res() res: Response) {
    res.clearCookie('access_token'); // Eliminar la cookie
    return res.status(HttpStatus.OK).json({ message: 'Logout exitoso' });
  }
}
