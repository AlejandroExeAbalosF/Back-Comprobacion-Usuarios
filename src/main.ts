import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { loggerGlobal } from './middlewares/logger.middleware';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as cookieParser from 'cookie-parser';
import { config as dotenvConfig } from 'dotenv';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { IoAdapter } from '@nestjs/platform-socket.io';

dotenvConfig({ path: '.env' });

async function bootstrap() {
  // 👇 Asegurar que la app se crea con Express con NestExpressApplication
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Habilita WebSockets manualmente
  app.useWebSocketAdapter(new IoAdapter(app));

  if (process.env.NODE_ENV === 'production') {
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"], // Solo permite cargar contenido del mismo origen
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Permite scripts internos y eval (ajustar según necesidades)
            styleSrc: ["'self'", "'unsafe-inline'"], // Permite estilos internos
            imgSrc: [
              "'self'",
              process.env.URL_BACKEND || 'http://localhost:3000',
              'data:',
              'https:',
            ], // Permite imágenes desde el mismo origen y enlaces HTTPS
            connectSrc: [
              "'self'",
              process.env.URL_BACKEND || 'http://localhost:3000',
              'ws://localhost:3000',
              'wss://localhost:3000',
              'ws://registrodeingreso.salta.gob.ar',
              'wss://registrodeingreso.salta.gob.ar',
              'ws://registrodeingreso.salta.gob.ar/socket.io/',
              'wss://registrodeingreso.salta.gob.ar/socket.io/',
            ], // Permite conexiones a tu API
            frameSrc: ["'none'"], // Bloquea iframes
            objectSrc: ["'none'"], // Bloquea Flash y otros objetos
          },
        },
      }),
    );
  }

  app.enableCors({
    origin: [
      process.env.URL_FRONTEND || 'http://localhost:3000',
      'http://localhost:3000',
    ], // Reemplaza con la URL de tu frontend
    credentials: true, // Permite el envío de cookies
  });

  // 👉 Middleware para manejar cookies
  app.use(cookieParser());
  // app.enableCors({
  //   origin: 'http://localhost:5173', // Ajusta el origen según donde corre tu frontend
  //   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  //   allowedHeaders: 'Content-Type,Authorization',
  // });
  // Habilitar CORS solamente para recibir peticiones del front
  // app.enableCors({
  //   origin: ['http://localhost:3000', 'https://sih-back.onrender.com'],
  //   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  //   credentials: true,
  // });
  // Servir la carpeta 'uploads' de forma pública
  // ⚠️ Agrega esto para que NestJS procese JSON correctamente
  // app.use(json());
  // app.use(express.urlencoded({ extended: true }));
  // app.use(json()); // 💡 Asegura que acepte JSON
  // app.use(urlencoded({ extended: true })); // 💡 Permite recibir datos form-urlencoded
  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads' });
  app.useStaticAssets(join(__dirname, '..', 'uploadsProfiles'), {
    prefix: '/uploadsProfiles',
  });
  app.use(loggerGlobal); // midd-loginLog global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // validar DTO
      forbidNonWhitelisted: true,
    }),
  );
  // await app.listen(process.env.PORT ?? 3000);
  await app.listen(process.env.PORT || 3000, '0.0.0.0');
}
bootstrap();
