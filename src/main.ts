import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('nodeEnv') || 'development';
  const isProduction = nodeEnv === 'production';

  // Enable CORS - Configure for production
  if (isProduction) {
    app.enableCors({
      origin: process.env.CORS_ORIGIN || '*', // Set specific origins in production
      credentials: true,
    });
  } else {
    app.enableCors();
  }

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Doctor Appointment Management System')
    .setDescription('API for managing doctor appointments, patients, and clinic operations')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Authentication', 'User authentication and authorization')
    .addTag('Users', 'User management')
    .addTag('Doctors', 'Doctor management')
    .addTag('Assistants', 'Assistant management')
    .addTag('Clinics', 'Clinic management')
    .addTag('Appointments', 'Appointment slot management')
    .addTag('Token Appointments', 'Patient booking management')
    .addTag('Patients', 'Patient self-booking and profile management')
    .addTag('Public', 'Public endpoints (no authentication required)')
    .addTag('Health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Get port from environment (Railway provides PORT env var)
  const port = configService.get<number>('port') || process.env.PORT || 3000;
  
  // Listen on all interfaces (0.0.0.0) for Railway deployment
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Application is running on: http://0.0.0.0:${port}`);
  console.log(`📚 Swagger documentation: http://0.0.0.0:${port}/api`);
  console.log(`🔧 Environment: ${nodeEnv}`);
  if (!isProduction) {
    console.log(`📍 Local access: http://localhost:${port}`);
  }
}
bootstrap();
