import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
   // // Habilitar CORS solamente para recibir peticiones del front
  // app.enableCors({
  //   origin: ['http://localhost:3000', 'https://sih-back.onrender.com'],
  //   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  //   credentials: true,
  // });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
