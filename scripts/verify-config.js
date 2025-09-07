#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Doctor Appointment Management System Configuration...\n');

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found!');
    console.log('   Run: cp env.example .env');
    process.exit(1);
}

console.log('✅ .env file exists');

// Load environment variables
require('dotenv').config();

// Required environment variables
const requiredVars = [
    'DB_HOST',
    'DB_PORT', 
    'DB_USERNAME',
    'DB_PASSWORD',
    'DB_NAME',
    'JWT_SECRET',
    'JWT_EXPIRES_IN',
    'PORT',
    'NODE_ENV'
];

let allValid = true;

console.log('\n📋 Checking environment variables:');

requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
        console.log(`❌ ${varName}: Missing`);
        allValid = false;
    } else {
        // Special validation for JWT_SECRET
        if (varName === 'JWT_SECRET' && value.length < 32) {
            console.log(`❌ ${varName}: Too short (minimum 32 characters required)`);
            allValid = false;
        } else {
            console.log(`✅ ${varName}: ${varName === 'DB_PASSWORD' || varName === 'JWT_SECRET' ? '****' : value}`);
        }
    }
});

console.log('\n🔧 Configuration Summary:');
console.log(`   Environment: ${process.env.NODE_ENV}`);
console.log(`   Application Port: ${process.env.PORT}`);
console.log(`   Database: ${process.env.DB_USERNAME}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
console.log(`   JWT Expiration: ${process.env.JWT_EXPIRES_IN}`);

if (allValid) {
    console.log('\n🎉 All environment variables are properly configured!');
    console.log('\n🚀 Ready to start the application:');
    console.log('   npm run start:dev');
} else {
    console.log('\n❌ Please fix the missing or invalid environment variables.');
    console.log('   Check ENVIRONMENT.md for detailed configuration guide.');
    process.exit(1);
}



