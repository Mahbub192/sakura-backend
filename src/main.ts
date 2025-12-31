import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { config } from 'dotenv';
import { Client } from 'pg';
import { AppModule } from './app.module';
import { SeedService } from './database/seeds/seed.service';

// Load environment variables before anything else
config();

async function ensureDatabaseExists() {
  // Read environment variables directly
  const databaseUrl = process.env.DATABASE_URL;

  // If using DATABASE_URL (cloud databases like Neon), database already exists
  if (databaseUrl) {
    console.log('✅ Using DATABASE_URL - database should already exist');
    return;
  }

  // For local PostgreSQL, we need to create the database if it doesn't exist
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '5432', 10);
  const username = process.env.DB_USERNAME || 'postgres';
  const password = process.env.DB_PASSWORD || 'password';
  const dbName = process.env.DB_NAME || 'doctor_appointment';

  // Connect to default postgres database to create our database
  const adminClient = new Client({
    host,
    port,
    user: username,
    password,
    database: 'postgres', // Connect to default postgres database
  });

  try {
    await adminClient.connect();
    console.log('✅ Connected to PostgreSQL');

    // Check if database exists
    const result = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName],
    );

    if (result.rows.length > 0) {
      console.log(`✅ Database '${dbName}' already exists`);
    } else {
      // Create the database
      await adminClient.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Database '${dbName}' created successfully`);
    }

    await adminClient.end();
    console.log('✅ Database initialization completed');
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    await adminClient.end().catch(() => {
      // Ignore errors when closing
    });

    if (error instanceof Error && 'code' in error) {
      if (error.code === 'ECONNREFUSED') {
        console.error('❌ PostgreSQL is not running or not accessible.');
        console.error(
          '   Please make sure PostgreSQL is running and the connection details in .env are correct.',
        );
        console.error(`   Attempted connection to: ${host}:${port}`);
      } else if (error.code === '28P01') {
        console.error('❌ Authentication failed.');
        console.error(
          '   Please check your DB_USERNAME and DB_PASSWORD in .env file.',
        );
        console.error(`   Attempted user: ${username}`);
      } else if (error.code === '3D000') {
        console.error('❌ Cannot connect to default "postgres" database.');
        console.error(
          '   Please ensure PostgreSQL is properly installed and running.',
        );
      } else {
        console.error(`❌ Error creating database: ${errorMessage}`);
        const errorCode =
          typeof error.code === 'string' || typeof error.code === 'number'
            ? String(error.code)
            : 'unknown';
        console.error(`   Error code: ${errorCode}`);
      }
    } else {
      console.error(`❌ Error creating database: ${errorMessage}`);
    }

    // For local development, we should fail if database can't be created
    // This prevents TypeORM from trying to connect to a non-existent database
    throw new Error(
      `Failed to ensure database exists: ${errorMessage}. Please check your PostgreSQL connection.`,
    );
  }
}

async function bootstrap() {
  // Ensure database exists before creating the app
  await ensureDatabaseExists();

  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Auto-seed database on startup (only if data doesn't exist)
  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('nodeEnv') || 'development';
  const isProduction = nodeEnv === 'production';

  // Only auto-seed in development mode
  if (!isProduction) {
    try {
      const seedService = app.get(SeedService);
      console.log('🌱 Checking database and seeding initial data...');
      await seedService.seed();
      console.log('✅ Database seeding completed');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.warn('⚠️  Database seeding skipped or failed:', errorMessage);
      // Don't fail the application if seeding fails
    }
  }

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Doctor Appointment Management System')
    .setDescription(
      'API for managing doctor appointments, patients, and clinic operations',
    )
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

  const port = configService.get<number>('port') || 3000;

  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api`);
  console.log(`🔧 Environment: ${configService.get<string>('nodeEnv')}`);
}

void bootstrap();
