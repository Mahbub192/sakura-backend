# Doctor Appointment System API Documentation

## Overview
A comprehensive backend system for managing doctor appointments with role-based access control.

## Features Implemented

### 1. Role-Based Access Control
- **Admin**: Can create doctors
- **Doctor**: Can manage their profile, create schedules, view their appointments
- **Assistant**: Can book appointments for patients (for their assigned doctor only)

### 2. Doctor Management
- Only admins can create doctors
- Doctors can create and manage assistants
- Rich doctor profiles with bio, image, services, contact info
- Dashboard with statistics and appointment management

### 3. Assistant Management
- Doctors can create assistants
- Assistants can only book appointments for their assigned doctor
- Role-based restrictions ensure security

### 4. Appointment Scheduling
- Doctors can create appointment schedules
- Flexible time slot generation
- Support for multiple patients per slot
- Location-based appointments

### 5. Patient Booking
- Assistants can book appointments for patients
- Comprehensive patient information capture
- Old/new patient tracking
- Fee management

### 6. Global Dashboard
- View all appointments across doctors
- Statistics and analytics
- Search functionality
- Doctor-wise performance metrics

## API Endpoints

### Authentication
```
POST /auth/register - Register new user
POST /auth/login - User login
```

### Doctor Management
```
GET /doctors - Get all doctors
POST /doctors - Create doctor (Admin only)
GET /doctors/profile - Get current doctor profile
GET /doctors/:id - Get doctor by ID
PATCH /doctors/:id - Update doctor
DELETE /doctors/:id - Delete doctor (Admin only)
```

### Doctor Dashboard
```
GET /doctors/dashboard/stats - Get dashboard statistics
GET /doctors/dashboard/today-appointments - Get today's appointments
POST /doctors/dashboard/create-schedule - Create appointment schedule
GET /doctors/dashboard/upcoming-appointments - Get upcoming appointments
GET /doctors/dashboard/monthly-appointments - Get monthly appointments
PATCH /doctors/profile/update - Update doctor profile
```

### Assistant Management
```
POST /assistants - Create assistant (Doctor only)
GET /assistants - Get assistants for doctor
GET /assistants/:id - Get assistant by ID
PATCH /assistants/:id - Update assistant
PATCH /assistants/:id/toggle-status - Toggle assistant status
DELETE /assistants/:id - Delete assistant
```

### Assistant Booking
```
POST /assistant-booking/book-patient - Book appointment for patient
GET /assistant-booking/available-slots - Get available slots
GET /assistant-booking/doctor-bookings - Get doctor bookings for date
GET /assistant-booking/todays-bookings - Get today's bookings
PATCH /assistant-booking/booking/:id/status - Update booking status
GET /assistant-booking/search-patients - Search patient bookings
```

### Appointments
```
POST /appointments - Create appointment slot
GET /appointments - Get all appointments
GET /appointments/:id - Get appointment by ID
GET /appointments/doctor/:doctorId - Get appointments by doctor
GET /appointments/available - Get available slots
```

### Token Appointments
```
POST /token-appointments - Create token appointment
GET /token-appointments - Get all token appointments
GET /token-appointments/:id - Get token appointment by ID
GET /token-appointments/patient/:email - Get appointments by patient
GET /token-appointments/doctor/:doctorId - Get appointments by doctor
```

### Global Dashboard
```
GET /global-dashboard/stats - Get global statistics
GET /global-dashboard/today-appointments - Get all today's appointments
GET /global-dashboard/appointments-by-date-range - Get appointments by date range
GET /global-dashboard/doctor-wise-stats - Get doctor-wise statistics
GET /global-dashboard/search-appointments - Search appointments globally
```

### Clinics
```
POST /clinics - Create clinic
GET /clinics - Get all clinics
GET /clinics/:id - Get clinic by ID
PATCH /clinics/:id - Update clinic
DELETE /clinics/:id - Delete clinic
```

## Database Schema

### Key Entities

#### User
- Basic user information with role-based access
- Links to doctor profiles when applicable

#### Doctor
- Extended profile with specialization, bio, image
- Services offered and contact information
- Availability settings and consultation fees

#### Assistant
- Linked to specific doctor
- Can only manage appointments for assigned doctor

#### Appointment
- Time slots created by doctors
- Support for multiple patients per slot
- Clinic location association

#### TokenAppointment
- Patient bookings with comprehensive information
- Fee tracking and patient history
- Status management (Confirmed, Pending, Completed, Cancelled)

#### Clinic
- Location information with map integration
- Operating hours and facilities
- Contact details

## Data Flow

### 1. Admin Creates Doctor
```
Admin → POST /doctors → Creates User + Doctor Profile
```

### 2. Doctor Creates Assistant
```
Doctor → POST /assistants → Creates Assistant linked to Doctor
```

### 3. Doctor Creates Schedule
```
Doctor → POST /doctors/dashboard/create-schedule → Creates multiple appointment slots
```

### 4. Assistant Books Patient
```
Assistant → POST /assistant-booking/book-patient → Creates TokenAppointment
```

### 5. Dashboard Views
```
Various roles → GET /global-dashboard/* → View statistics and appointments
```

## Security Features

### Authentication
- JWT-based authentication
- Role-based route protection
- User context in all operations

### Authorization
- Admins can manage doctors
- Doctors can manage their assistants and schedules
- Assistants can only book for their assigned doctor
- Proper ownership validation on all operations

### Data Validation
- Comprehensive DTO validation
- Email uniqueness enforcement
- Time slot conflict prevention
- Patient booking validation

## Frontend Integration Features

### Doctor Profile
- Profile image upload support
- Bio and services management
- Contact information management
- Availability settings

### Dashboard Components
- Statistics cards
- Today's appointments list
- Calendar integration
- Search and filtering

### Booking Interface
- Available slots display
- Patient information forms
- Fee calculation
- Confirmation system

## Technical Implementation

### Technologies Used
- NestJS framework
- TypeORM for database operations
- PostgreSQL database
- JWT authentication
- Class validation
- Swagger documentation

### Key Design Patterns
- Repository pattern for data access
- Service layer for business logic
- DTO pattern for data validation
- Role-based guards for security

### Database Features
- Proper relationships and foreign keys
- Indexes for performance
- JSON columns for flexible data
- Timestamps for audit trails

## Setup Instructions

1. **Environment Setup**
   ```bash
   cp env.example .env
   # Configure database connection
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   ```bash
   # Run migrations if available
   npm run migration:run
   ```

4. **Seed Data**
   ```bash
   npm run seed
   ```

5. **Start Development Server**
   ```bash
   npm run start:dev
   ```

## API Documentation
Visit `/api` endpoint when the server is running to access Swagger documentation.

## Error Handling
- Comprehensive error responses
- Validation error details
- HTTP status codes
- Descriptive error messages

This system provides a complete foundation for a doctor appointment management system with proper security, role management, and comprehensive features for all user types.
