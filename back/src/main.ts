
import { NestFactory } from '@nestjs/core';
import session from 'express-session';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const sessionSecret = process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === 'production' && !sessionSecret) {
    throw new Error('SESSION_SECRET debe configurarse en producción.');
  }

  app.use(
    session({
      name: 'turismo_sid',
      secret:
        sessionSecret ?? 'solo-desarrollo-cambiar-SESSION_SECRET-en-produccion',
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 60 * 1000,
      },
    }),
  );
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  });
  await app.listen(3000);
  console.log('Turismo IA disponible en http://localhost:3000');
}

bootstrap();
