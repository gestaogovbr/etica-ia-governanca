import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('Projeto base NestJS')
  .setDescription(
    'Projeto base para iniciar novos projetos utilizando NestJS.',
  )
  .setVersion('1.0')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Token de acesso JWT',
      in: 'header',
    },
    'JWT-auth',
  )
  .build();
