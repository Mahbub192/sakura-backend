import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { validationSchema } from './config/validation';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DoctorsModule } from './modules/doctors/doctors.module';
import { AssistantsModule } from './modules/assistants/assistants.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { TokenAppointmentsModule } from './modules/token-appointments/token-appointments.module';
import { ClinicsModule } from './modules/clinics/clinics.module';
import { PatientsModule } from './modules/patients/patients.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PublicModule } from './modules/public/public.module';
import { SeedModule } from './database/seeds/seed.module';
import { 
  User, 
  Role, 
  Doctor, 
  Assistant, 
  Clinic, 
  Appointment, 
  TokenAppointment 
} from './entities';

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
        
        // If DATABASE_URL is provided (e.g., Neon, Railway), use it directly
        if (databaseUrl) {
          return {
            type: 'postgres' as const,
            url: databaseUrl,
            entities: [User, Role, Doctor, Assistant, Clinic, Appointment, TokenAppointment],
            synchronize: !isProduction,
            logging: !isProduction,
            ssl: { rejectUnauthorized: false }, // Neon requires SSL
          };
        }
        
        // Otherwise, use individual connection parameters
        return {
          type: 'postgres' as const,
          host: configService.get<string>('database.host') || 'localhost',
          port: configService.get<number>('database.port') || 5433,
          username: configService.get<string>('database.username') || 'postgres',
          password: configService.get<string>('database.password') || 'password',
          database: configService.get<string>('database.name') || 'doctor_appointment',
          entities: [User, Role, Doctor, Assistant, Clinic, Appointment, TokenAppointment],
          synchronize: !isProduction,
          logging: !isProduction,
          // Enable SSL for Neon or production environments
          ssl: databaseUrl || isProduction ? { rejectUnauthorized: false } : false,
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
    ClinicsModule,
    PatientsModule,
    NotificationsModule,
    PublicModule,
    SeedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
