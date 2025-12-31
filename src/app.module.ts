import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import configuration from './config/configuration';
import { validationSchema } from './config/validation';
import { SeedModule } from './database/seeds/seed.module';
import {
  Appointment,
  Assistant,
  Clinic,
  Doctor,
  Message,
  MessageThread,
  Role,
  TokenAppointment,
  User,
} from './entities';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { AssistantsModule } from './modules/assistants/assistants.module';
import { ClinicsModule } from './modules/clinics/clinics.module';
import { DoctorsModule } from './modules/doctors/doctors.module';
import { MessagesModule } from './modules/messages/messages.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PatientsModule } from './modules/patients/patients.module';
import { PublicModule } from './modules/public/public.module';
import { TokenAppointmentsModule } from './modules/token-appointments/token-appointments.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('database.url');
        const nodeEnv = configService.get<string>('nodeEnv') || 'development';
        const isProduction = nodeEnv === 'production';
        const autoSync = process.env.AUTO_SYNC_SCHEMA === 'true';
        const runInitialSetup = process.env.RUN_INITIAL_SETUP === 'true';

        // Enable synchronize if:
        // - Development mode (always)
        // - Production with AUTO_SYNC_SCHEMA=true (for code updates)
        // - Production with RUN_INITIAL_SETUP=true (first deployment)
        const shouldSynchronize = !isProduction || autoSync || runInitialSetup;

        // If DATABASE_URL is provided (e.g., Neon, Railway), use it directly
        if (databaseUrl) {
          return {
            type: 'postgres' as const,
            url: databaseUrl,
            entities: [
              User,
              Role,
              Doctor,
              Assistant,
              Clinic,
              Appointment,
              TokenAppointment,
              Message,
              MessageThread,
            ],
            synchronize: shouldSynchronize,
            logging: !isProduction,
            ssl: { rejectUnauthorized: false }, // Neon requires SSL
          };
        }

        // Otherwise, use individual connection parameters
        return {
          type: 'postgres' as const,
          host: configService.get<string>('database.host') || 'localhost',
          port: configService.get<number>('database.port') || 5432,
          username:
            configService.get<string>('database.username') || 'postgres',
          password:
            configService.get<string>('database.password') || 'password',
          database:
            configService.get<string>('database.name') || 'doctor_appointment',
          entities: [
            User,
            Role,
            Doctor,
            Assistant,
            Clinic,
            Appointment,
            TokenAppointment,
            Message,
            MessageThread,
          ],
          synchronize: shouldSynchronize,
          logging: !isProduction,
          // Enable SSL for Neon or production environments
          ssl:
          databaseUrl
          ? { rejectUnauthorized: false }
          : process.env.DB_SSL === 'true'
          ? { rejectUnauthorized: false }
          : false,
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    DoctorsModule,
    AssistantsModule,
    AppointmentsModule,
    TokenAppointmentsModule,
    PublicModule,
    ClinicsModule,
    PatientsModule,
    NotificationsModule,
    MessagesModule,
    SeedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
