# Doctor Appointment Management System - Setup Guide

## 🚀 Quick Start

Follow these steps to get your Doctor Appointment Management System up and running:

### 1. Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database server
- npm or yarn package manager

### 2. Database Setup
```sql
-- Connect to PostgreSQL and create database
CREATE DATABASE doctor_appointment;
CREATE USER appointment_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE doctor_appointment TO appointment_user;
```

### 3. Environment Configuration
```bash
# Copy environment file
cp env.example .env

# Edit .env file with your database credentials
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=appointment_user
DB_PASSWORD=your_password
DB_NAME=doctor_appointment
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
PORT=3000
NODE_ENV=development
```

### 4. Install Dependencies & Start
```bash
# Install dependencies
npm install

# Seed database with initial data
npm run seed

# Start development server
npm run start:dev
```

### 5. Access the Application
- **API Documentation**: http://localhost:3000/api
- **Main Application**: http://localhost:3000

### 6. Default Login Credentials
- **Email**: admin@hospital.com
- **Password**: admin123
- **Role**: Admin

## 📊 System Overview

### User Roles
1. **Admin**: Full system access, user management, clinic setup
2. **Doctor**: Profile management, appointment scheduling, patient management
3. **Assistant**: Appointment management, patient booking assistance
4. **User/Patient**: Appointment booking, profile management

### Core Features
- JWT-based authentication
- Role-based access control
- Appointment slot management
- Patient booking system with token generation
- Multi-clinic support
- Comprehensive API documentation

### Database Entities
- **Users**: Authentication and basic user info
- **Roles**: System roles (Admin, Doctor, Assistant, User)
- **Doctors**: Doctor profiles and specialization
- **Assistants**: Assistant information linked to doctors
- **Clinics**: Medical facility information
- **Appointments**: Available appointment slots
- **Token Appointments**: Patient bookings with unique tokens

## 🔗 API Endpoints Summary

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/profile` - Current user profile

### User Management (Admin Only)
- `GET /users` - List all users
- `POST /users` - Create new user
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Doctor Management
- `GET /doctors` - List all doctors
- `POST /doctors` - Create doctor profile (Admin)
- `GET /doctors/profile` - Current doctor profile
- `PATCH /doctors/:id` - Update doctor profile

### Appointment Management
- `GET /appointments` - List appointment slots
- `POST /appointments` - Create appointment slot
- `GET /appointments/available` - Available slots
- `PATCH /appointments/:id/status` - Update status

### Patient Booking
- `POST /token-appointments` - Book appointment
- `GET /token-appointments/my-appointments` - Patient's appointments
- `GET /token-appointments/token/:tokenNumber` - Find by token
- `PATCH /token-appointments/:id/status` - Update booking status

### Clinic Management (Admin Only)
- `GET /clinics` - List all clinics
- `POST /clinics` - Create clinic
- `PATCH /clinics/:id` - Update clinic

## 🛠️ Development Commands

```bash
# Development
npm run start:dev      # Start with hot reload
npm run build         # Build for production
npm run start:prod    # Start production server

# Database
npm run seed          # Seed database with initial data

# Testing
npm run test          # Run unit tests
npm run test:e2e      # Run end-to-end tests
npm run test:cov      # Run tests with coverage

# Code Quality
npm run lint          # Run ESLint
npm run format        # Format code with Prettier
```

## 🔧 Configuration Options

### Environment Variables
- `DB_HOST`: Database host (default: localhost)
- `DB_PORT`: Database port (default: 5432)
- `DB_USERNAME`: Database username
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name
- `JWT_SECRET`: Secret key for JWT tokens
- `JWT_EXPIRES_IN`: Token expiration time (default: 24h)
- `PORT`: Application port (default: 3000)
- `NODE_ENV`: Environment (development/production)

### Database Configuration
- TypeORM with PostgreSQL
- Auto-synchronization enabled in development
- Logging enabled in development
- Production requires manual migrations

## 📚 Example Usage

### 1. Register a Doctor
```bash
# First, register as admin or use seeded admin account
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hospital.com","password":"admin123"}'

# Use the token to create a doctor user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "email":"doctor@hospital.com",
    "password":"doctor123",
    "firstName":"Dr. John",
    "lastName":"Smith",
    "phone":"+1234567890",
    "role":"Doctor"
  }'
```

### 2. Create Doctor Profile
```bash
curl -X POST http://localhost:3000/doctors \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name":"Dr. John Smith",
    "specialization":"Cardiology",
    "experience":10,
    "licenseNumber":"DOC123456",
    "qualification":"MD, Cardiology",
    "consultationFee":150.00,
    "userId":2
  }'
```

### 3. Create Appointment Slot
```bash
curl -X POST http://localhost:3000/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_DOCTOR_TOKEN" \
  -d '{
    "doctorId":1,
    "clinicId":1,
    "date":"2024-01-15",
    "startTime":"09:00",
    "endTime":"09:30",
    "duration":30,
    "maxPatients":1
  }'
```

### 4. Book Appointment (Patient)
```bash
curl -X POST http://localhost:3000/token-appointments \
  -H "Content-Type: application/json" \
  -d '{
    "patientName":"Jane Doe",
    "patientEmail":"jane@example.com",
    "patientPhone":"+1987654331",
    "patientAge":35,
    "patientGender":"Female",
    "date":"2024-01-15",
    "time":"09:00",
    "doctorId":1,
    "appointmentId":1,
    "reasonForVisit":"Regular checkup"
  }'
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check PostgreSQL is running
   - Verify database credentials in .env
   - Ensure database exists

2. **JWT Token Invalid**
   - Check JWT_SECRET in .env
   - Ensure token is included in Authorization header
   - Verify token hasn't expired

3. **Permission Denied**
   - Check user role and endpoint permissions
   - Ensure proper Authorization header
   - Verify role-based access control

4. **Build Errors**
   - Run `npm install` to ensure all dependencies
   - Check TypeScript configuration
   - Verify all imports are correct

### Development Tips
- Use Swagger UI at `/api` for interactive API testing
- Check application logs for detailed error messages
- Use database client to verify data structure
- Test endpoints with different user roles

## 📞 Support

For issues and support:
1. Check the troubleshooting section above
2. Review API documentation at `/api`
3. Check application logs
4. Create an issue in the repository

## 🔄 Updates and Maintenance

### Regular Tasks
- Update dependencies: `npm update`
- Run security audit: `npm audit`
- Backup database regularly
- Monitor application logs
- Update JWT secrets periodically

### Production Deployment
1. Set `NODE_ENV=production`
2. Use strong JWT secrets
3. Configure proper database credentials
4. Set up SSL/TLS
5. Configure reverse proxy (nginx/Apache)
6. Set up monitoring and logging
7. Configure automated backups



