const { Client } = require('pg');
require('dotenv').config();

async function createDatabase() {
  // Connect to default postgres database to create our database
  const adminClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: 'postgres', // Connect to default postgres database
  });

  const dbName = process.env.DB_NAME || 'doctor_appointment';

  try {
    await adminClient.connect();
    console.log('✅ Connected to PostgreSQL');

    // Check if database exists
    const result = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (result.rows.length > 0) {
      console.log(`✅ Database '${dbName}' already exists`);
    } else {
      // Create the database
      await adminClient.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Database '${dbName}' created successfully`);
    }

    await adminClient.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 PostgreSQL is not running or not accessible.');
      console.error('   Please make sure PostgreSQL is running and the connection details in .env are correct.');
    } else if (error.code === '28P01') {
      console.error('\n💡 Authentication failed.');
      console.error('   Please check your DB_USERNAME and DB_PASSWORD in .env file.');
    } else if (error.code === '3D000') {
      console.error('\n💡 Cannot connect to default "postgres" database.');
      console.error('   Please ensure PostgreSQL is properly installed and running.');
    }
    
    await adminClient.end().catch(() => {});
    process.exit(1);
  }
}

createDatabase();

