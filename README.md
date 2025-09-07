# Doctor Appointment Management System

A comprehensive doctor appointment management system built with NestJS, TypeORM, and PostgreSQL. This system provides role-based access control for admins, doctors, assistants, and patients to manage appointments efficiently.

## 🚀 Features

- **Role-Based Access Control**: Admin, Doctor, Assistant, and User roles
- **Authentication & Authorization**: JWT-based authentication
- **Appointment Management**: Create and manage appointment slots
- **Patient Booking**: Token-based appointment booking system
- **Doctor Profiles**: Comprehensive doctor information management
- **Clinic Management**: Multiple clinic locations support
- **API Documentation**: Complete Swagger/OpenAPI documentation

## 📋 System Architecture

### Database Entities

1. **User**: Basic login and authentication information
2. **Role**: Different roles in the system (Admin, Doctor, Assistant, User)
3. **Doctor**: Doctor-specific profile information
4. **Assistant**: Assistant information linked to doctors
5. **Clinic**: Clinic location information
6. **Appointment**: Doctor's available time slots
7. **TokenAppointment**: Patient booking information

### Relationships

- User → Role: Many-to-One
- User → Doctor: One-to-One
- Doctor → Assistant: One-to-Many
- Doctor → Appointment: One-to-Many
- Clinic → Appointment: One-to-Many
- Appointment → TokenAppointment: One-to-Many

## 🛠️ Technology Stack

- **Backend**: NestJS (Node.js)
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI
- **Language**: TypeScript

## 📦 Installation

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd doctorAppointment
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   - **Automated Setup** (Recommended):
   ```bash
   npm run setup
   ```
   
   - **Manual Setup**:
   ```bash
   # Copy environment template
   cp env.example .env
   
   # Edit with your settings
   nano .env
   ```
   
   - **Verify Configuration**:
   ```bash
   npm run config:verify
   ```
   
   - **Required Environment Variables**:
   ```env
   DB_HOST=localhost
   DB_PORT=5433
   DB_USERNAME=postgres
   DB_PASSWORD=your_password
   DB_NAME=doctor_appointment
   JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
   JWT_EXPIRES_IN=24h
   PORT=3000
   NODE_ENV=development
   ```

4. **Run database seeding**
   ```bash
   npm run seed
   ```
   This creates default roles, admin user, and sample clinics.

5. **Start the application**
   ```bash
   # Development mode
   npm run start:dev

   # Production mode
   npm run start:prod
   ```

## 🌐 API Documentation

Once the application is running, visit:
- **API Documentation**: http://localhost:3000/api
- **Application**: http://localhost:3000

## 👤 Default Credentials

After seeding, you can login with:
- **Email**: admin@hospital.com
- **Password**: admin123
- **Role**: Admin

## 🔐 Authentication & Authorization

### Authentication Flow
1. Register/Login to get JWT token
2. Include token in Authorization header: `Bearer <token>`
3. Access protected endpoints based on user role

### Role Permissions

#### Admin
- Full system access
- User management
- Doctor profile creation
- Clinic management
- All appointment operations

#### Doctor
- View/Update own profile
- Create appointment slots
- View own appointments
- Manage patient bookings

#### Assistant
- View doctor's appointments
- Manage patient bookings
- Limited access to doctor's data

#### User/Patient
- Book appointments
- View own appointments
- Update booking status

## 📚 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /auth/profile` - Get current user profile

### Doctors
- `GET /doctors` - Get all doctors
- `POST /doctors` - Create doctor profile (Admin only)
- `GET /doctors/:id` - Get doctor by ID
- `GET /doctors/profile` - Get current doctor profile
- `PATCH /doctors/:id` - Update doctor profile
- `DELETE /doctors/:id` - Delete doctor (Admin only)

### Appointments
- `GET /appointments` - Get all appointment slots
- `POST /appointments` - Create appointment slot
- `GET /appointments/available` - Get available slots
- `GET /appointments/:id` - Get appointment by ID
- `PATCH /appointments/:id/status` - Update appointment status
- `DELETE /appointments/:id` - Delete appointment slot

### Token Appointments (Bookings)
- `POST /token-appointments` - Book an appointment
- `GET /token-appointments` - Get all bookings (Admin/Doctor/Assistant)
- `GET /token-appointments/my-appointments` - Get patient appointments
- `GET /token-appointments/token/:tokenNumber` - Get by token number
- `PATCH /token-appointments/:id/status` - Update booking status
- `DELETE /token-appointments/:id` - Cancel booking

### Clinics
- `GET /clinics` - Get all clinics
- `POST /clinics` - Create clinic (Admin only)
- `GET /clinics/:id` - Get clinic by ID
- `PATCH /clinics/:id` - Update clinic (Admin only)
- `DELETE /clinics/:id` - Delete clinic (Admin only)

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🚀 Deployment

### Production Build
```bash
npm run build
npm run start:prod
```

### Environment Variables for Production
```env
NODE_ENV=production
DB_HOST=your-production-db-host
DB_PORT=5433
DB_USERNAME=your-production-db-user
DB_PASSWORD=your-production-db-password
DB_NAME=doctor_appointment
JWT_SECRET=your-very-secure-jwt-secret
JWT_EXPIRES_IN=24h
PORT=3000
```

## 📊 Database Schema

The system uses PostgreSQL with the following main tables:
- `users` - User authentication data
- `roles` - System roles
- `doctors` - Doctor profiles
- `assistants` - Assistant information
- `clinics` - Clinic locations
- `appointments` - Available appointment slots
- `token_appointments` - Patient bookings

## 🔧 Development

### Available Scripts
- `npm run start:dev` - Start development server with hot reload
- `npm run build` - Build production bundle
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run seed` - Seed database with initial data
- `npm run setup` - Automated environment setup
- `npm run config:verify` - Verify environment configuration
- `npm run env:check` - Quick environment check

### Project Structure
```
src/
├── auth/                 # Authentication module
├── common/              # Shared utilities, guards, decorators
├── database/            # Database seeds and migrations
├── entities/            # TypeORM entities
├── modules/             # Feature modules
│   ├── appointments/
│   ├── clinics/
│   ├── doctors/
│   └── token-appointments/
├── app.module.ts        # Main application module
└── main.ts             # Application entry point
```

## 📝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Refer to the API documentation at `/api`

## 🔮 Future Enhancements

- Email notifications for appointments
- SMS integration
- Payment processing
- Calendar integration
- Mobile app support
- Real-time notifications
- Analytics and reporting