# Environment Configuration Guide

This document explains how the Doctor Appointment Management System handles environment variables and configuration.

## 🔧 Configuration Architecture

The application uses a modern, type-safe configuration system with:

- **Environment Variables**: Standard `.env` file support
- **Configuration Schema**: Joi validation for all environment variables
- **Type Safety**: Full TypeScript support with proper typing
- **Fallbacks**: Sensible defaults for all configuration values
- **Validation**: Runtime validation of all environment variables

## 📁 Environment Files

### .env (Main Configuration)
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=doctor_appointment

# JWT Configuration
JWT_SECRET=doctor-appointment-super-secret-jwt-key-2024
JWT_EXPIRES_IN=24h

# Application Configuration
PORT=3000
NODE_ENV=development
```

### env.example (Template)
Template file for creating your own `.env` file. Copy this file to `.env` and update with your values.

## 🛠️ Configuration Structure

### Database Configuration
- `DB_HOST`: PostgreSQL host (default: localhost)
- `DB_PORT`: PostgreSQL port (default: 5433)
- `DB_USERNAME`: Database username (default: postgres)
- `DB_PASSWORD`: Database password (default: password)
- `DB_NAME`: Database name (default: doctor_appointment)

### JWT Configuration
- `JWT_SECRET`: Secret key for JWT tokens (minimum 32 characters required)
- `JWT_EXPIRES_IN`: Token expiration time (default: 24h)

### Application Configuration
- `PORT`: Application port (default: 3000)
- `NODE_ENV`: Environment mode (development/production/test)

## 🔍 Validation Schema

The application validates all environment variables using Joi:

```typescript
export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  
  // Database validation
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5433),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  
  // JWT validation
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('24h'),
});
```

## 🏗️ Configuration Implementation

### Configuration Factory
Located in `src/config/configuration.ts`:

```typescript
export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    name: process.env.DB_NAME || 'doctor_appointment',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
});
```

### Module Integration
In `src/app.module.ts`:

```typescript
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
```

## 📋 Setup Instructions

### Quick Setup
1. **Copy environment file**:
   ```bash
   cp env.example .env
   ```

2. **Edit configuration**:
   ```bash
   nano .env  # or use your preferred editor
   ```

3. **Update database credentials** and other settings as needed

### Automated Setup
Use the provided setup script:
```bash
./scripts/setup-env.sh
```

This script will:
- Create `.env` file if it doesn't exist
- Check PostgreSQL connection
- Create database if needed
- Install dependencies
- Seed initial data

## 🔐 Security Considerations

### Development
- Use strong, unique JWT secrets
- Keep database credentials secure
- Never commit `.env` files to version control

### Production
- Use environment-specific secrets
- Enable SSL for database connections
- Use secure database credentials
- Set `NODE_ENV=production`
- Use strong JWT secrets (minimum 32 characters)

### Example Production Configuration
```bash
# Production .env
NODE_ENV=production
PORT=3000
DB_HOST=your-production-db.com
DB_PORT=5433
DB_USERNAME=app_user
DB_PASSWORD=super-secure-password
DB_NAME=doctor_appointment_prod
JWT_SECRET=your-super-secure-64-character-jwt-secret-for-production-use
JWT_EXPIRES_IN=24h
```

## 🧪 Environment-Specific Features

### Development Mode
- Database synchronization enabled
- Detailed logging enabled
- Hot reload with `npm run start:dev`

### Production Mode
- Database synchronization disabled
- Optimized logging
- SSL support for database connections
- Enhanced security headers

### Test Mode
- Separate test database recommended
- Faster JWT expiration for testing
- Mock configurations available

## 🔧 Usage Examples

### Accessing Configuration in Services
```typescript
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MyService {
  constructor(private configService: ConfigService) {}

  getDatabaseHost() {
    return this.configService.get<string>('database.host');
  }

  getJwtSecret() {
    return this.configService.get<string>('jwt.secret');
  }
}
```

### Environment-Specific Logic
```typescript
const isDevelopment = this.configService.get<string>('nodeEnv') === 'development';
const isProduction = this.configService.get<string>('nodeEnv') === 'production';
```

## 🚨 Troubleshooting

### Common Issues

1. **Application won't start**
   - Check if `.env` file exists
   - Verify all required environment variables
   - Check database connection

2. **Database connection failed**
   - Verify PostgreSQL is running
   - Check database credentials in `.env`
   - Ensure database exists

3. **JWT token issues**
   - Verify `JWT_SECRET` is at least 32 characters
   - Check token expiration settings

4. **Port already in use**
   - Change `PORT` in `.env` file
   - Or kill process using the port

### Validation Errors
If you see validation errors on startup, check:
- All required environment variables are present
- JWT_SECRET is at least 32 characters long
- PORT is a valid number
- NODE_ENV is one of: development, production, test

## 📞 Support

For configuration issues:
1. Check this documentation
2. Verify `.env` file format
3. Run the setup script: `./scripts/setup-env.sh`
4. Check application logs for specific errors

## 🔄 Updates

When updating the application:
1. Check for new environment variables in `env.example`
2. Update your `.env` file accordingly
3. Review validation schema changes
4. Test configuration with `npm run build`
