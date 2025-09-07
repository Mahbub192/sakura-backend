#!/bin/bash

# Doctor Appointment Management System - Environment Setup Script

echo "🚀 Setting up Doctor Appointment Management System Environment..."

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📁 Creating .env file from template..."
    cat > .env << 'EOF'
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
EOF
    echo "✅ .env file created successfully!"
else
    echo "✅ .env file already exists"
fi

# Check if PostgreSQL is running
echo "🔍 Checking PostgreSQL connection..."
if pg_isready -h localhost -p 5433 > /dev/null 2>&1; then
    echo "✅ PostgreSQL is running"
else
    echo "❌ PostgreSQL is not running. Please start PostgreSQL service."
    echo "   For macOS with Homebrew: brew services start postgresql"
    echo "   For Ubuntu/Debian: sudo service postgresql start"
    echo "   For Windows: Start PostgreSQL service from Services"
fi

# Check if database exists
echo "🗄️  Checking if database exists..."
if psql -h localhost -U postgres -lqt | cut -d \| -f 1 | grep -qw doctor_appointment; then
    echo "✅ Database 'doctor_appointment' exists"
else
    echo "📝 Creating database 'doctor_appointment'..."
    createdb -h localhost -U postgres doctor_appointment || {
        echo "❌ Failed to create database. Please create it manually:"
        echo "   psql -U postgres -c \"CREATE DATABASE doctor_appointment;\""
    }
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Seed database
echo "🌱 Seeding database with initial data..."
npm run seed

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "🚀 To start the application:"
echo "   npm run start:dev"
echo ""
echo "📚 Once started, visit:"
echo "   - Application: http://localhost:3000"
echo "   - API Documentation: http://localhost:3000/api"
echo ""
echo "🔑 Default admin credentials:"
echo "   Email: admin@hospital.com"
echo "   Password: admin123"
echo ""



