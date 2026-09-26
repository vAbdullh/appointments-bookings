import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe — enables class-validator + class-transformer on all routes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // strip unknown properties
      forbidNonWhitelisted: false,
      transform: true,           // run @Transform decorators (trim)
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  // Global exception filter — unifies all error shapes
  app.useGlobalFilters(new GlobalExceptionFilter());

  // ── Swagger / OpenAPI ─────────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('Appointment Booking API')
    .setDescription(
      'REST API for managing appointment slots and bookings.\n\n' +
      '**Authentication:** Not required — all endpoints are publicly accessible.\n\n' +
      '**Error format:** All errors use `{ "error": { "code": "...", "message": "..." } }`.',
    )
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Interactive UI at /docs
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'openapi.json',   // raw spec at /openapi.json
    swaggerOptions: {
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
