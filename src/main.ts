import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

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
    .addTag('Messages', 'Messaging and communication')
    .addTag('Public', 'Public endpoints (no authentication required)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 3000;
  
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api`);
  console.log(`🔧 Environment: ${configService.get<string>('nodeEnv')}`);
}
bootstrap();
