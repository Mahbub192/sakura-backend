const { Client } = require('pg');
require('dotenv').config();

async function verifyDatabase() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'doctor_appointment',
  });

  try {
    await client.connect();
    console.log('✅ Successfully connected to database:', process.env.DB_NAME || 'doctor_appointment');
    
    const result = await client.query('SELECT version()');
    console.log('✅ PostgreSQL version:', result.rows[0].version.split(',')[0]);
    
    await client.end();
    console.log('\n🎉 Database is ready! You can now start the application.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error connecting to database:', error.message);
    process.exit(1);
  }
}

verifyDatabase();

