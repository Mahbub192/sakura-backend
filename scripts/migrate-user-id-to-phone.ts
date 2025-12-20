import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables
config();

async function migrateUserIdToPhone() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '12345',
    database: process.env.DB_NAME || 'doctor_appointment',
  });

  try {
    await dataSource.initialize();
    console.log('✅ Connected to database');

    const queryRunner = dataSource.createQueryRunner();

    // Step 1: Make user_phone nullable temporarily
    console.log('📝 Step 1: Making user_phone nullable...');
    try {
      await queryRunner.query(`
        ALTER TABLE "doctors" 
        ALTER COLUMN "user_phone" DROP NOT NULL;
      `);
      console.log('✅ user_phone is now nullable');
    } catch (error: any) {
      if (error.code === '42703') {
        // Column doesn't exist yet, that's okay
        console.log('ℹ️  user_phone column doesn\'t exist yet, will be created');
      } else {
        console.log('⚠️  Could not alter user_phone (might already be nullable):', error.message);
      }
    }

    // Step 2: Make user_phone nullable in assistants table
    console.log('📝 Step 2: Making user_phone nullable in assistants table...');
    try {
      await queryRunner.query(`
        ALTER TABLE "assistants" 
        ALTER COLUMN "user_phone" DROP NOT NULL;
      `);
      console.log('✅ assistants.user_phone is now nullable');
    } catch (error: any) {
      if (error.code === '42703') {
        console.log('ℹ️  assistants.user_phone column doesn\'t exist yet');
      } else {
        console.log('⚠️  Could not alter assistants.user_phone:', error.message);
      }
    }

    // Step 3: Check if users table still has id column
    console.log('📝 Step 3: Checking users table structure...');
    const usersTableInfo = await queryRunner.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name IN ('id', 'phone');
    `);

    const hasIdColumn = usersTableInfo.some((col: any) => col.column_name === 'id');
    const hasPhoneColumn = usersTableInfo.some((col: any) => col.column_name === 'phone');

    console.log('Users table structure:', { hasIdColumn, hasPhoneColumn });

    if (hasIdColumn && hasPhoneColumn) {
      // Step 4: Migrate data from user_id to user_phone in doctors table
      console.log('📝 Step 4: Migrating doctors.user_id to user_phone...');
      const doctorsWithUserId = await queryRunner.query(`
        SELECT d.id, d.user_id, u.phone
        FROM doctors d
        LEFT JOIN users u ON d.user_id = u.id
        WHERE d.user_id IS NOT NULL;
      `);

      console.log(`Found ${doctorsWithUserId.length} doctors to migrate`);

      for (const doctor of doctorsWithUserId) {
        if (doctor.phone) {
          await queryRunner.query(`
            UPDATE doctors
            SET user_phone = $1
            WHERE id = $2;
          `, [doctor.phone, doctor.id]);
          console.log(`✅ Migrated doctor ${doctor.id}: user_id ${doctor.user_id} -> user_phone ${doctor.phone}`);
        } else {
          console.log(`⚠️  Warning: Doctor ${doctor.id} has user_id ${doctor.user_id} but no matching user phone found`);
        }
      }

      // Step 5: Migrate data in assistants table
      console.log('📝 Step 5: Migrating assistants.user_id to user_phone...');
      const assistantsWithUserId = await queryRunner.query(`
        SELECT a.id, a.user_id, u.phone
        FROM assistants a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.user_id IS NOT NULL;
      `);

      console.log(`Found ${assistantsWithUserId.length} assistants to migrate`);

      for (const assistant of assistantsWithUserId) {
        if (assistant.phone) {
          await queryRunner.query(`
            UPDATE assistants
            SET user_phone = $1
            WHERE id = $2;
          `, [assistant.phone, assistant.id]);
          console.log(`✅ Migrated assistant ${assistant.id}: user_id ${assistant.user_id} -> user_phone ${assistant.phone}`);
        } else {
          console.log(`⚠️  Warning: Assistant ${assistant.id} has user_id ${assistant.user_id} but no matching user phone found`);
        }
      }

      // Step 6: Make user_phone NOT NULL again
      console.log('📝 Step 6: Making user_phone NOT NULL in doctors table...');
      await queryRunner.query(`
        ALTER TABLE "doctors" 
        ALTER COLUMN "user_phone" SET NOT NULL;
      `);
      console.log('✅ doctors.user_phone is now NOT NULL');

      // Step 7: Drop old user_id columns (optional, can be done manually)
      console.log('📝 Step 7: Dropping old user_id columns...');
      try {
        await queryRunner.query(`ALTER TABLE "doctors" DROP COLUMN IF EXISTS "user_id";`);
        console.log('✅ Dropped doctors.user_id column');
      } catch (error: any) {
        console.log('⚠️  Could not drop doctors.user_id:', error.message);
      }

      try {
        await queryRunner.query(`ALTER TABLE "assistants" DROP COLUMN IF EXISTS "user_id";`);
        console.log('✅ Dropped assistants.user_id column');
      } catch (error: any) {
        console.log('⚠️  Could not drop assistants.user_id:', error.message);
      }
    } else {
      console.log('⚠️  Users table structure is different. Skipping data migration.');
      console.log('   If users table already uses phone as primary key, you may need to:');
      console.log('   1. Drop existing doctors/assistants data, or');
      console.log('   2. Manually update the data');
    }

    await queryRunner.release();
    await dataSource.destroy();
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateUserIdToPhone();



