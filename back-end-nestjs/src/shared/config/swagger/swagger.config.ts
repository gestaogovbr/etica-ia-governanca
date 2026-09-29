import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('AIE Backend API')
  .setDescription(
    'REST API of the Framework for Ethical Impact Self-Assessment in AI for the Public Sector (AIE).',
  )
  .setVersion('1.0')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'JWT access token',
      in: 'header',
    },
    'JWT-auth',
  )
  .build();
