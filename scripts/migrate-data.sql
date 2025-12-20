-- Migration script to migrate from user_id to user_phone
-- Run this script in your PostgreSQL database after the app starts

-- Step 1: Check if users table still has id column
-- If users table has both id and phone columns, we can migrate data

-- Step 2: Migrate doctors table
-- Update user_phone from user_id (if users table still has id)
UPDATE doctors d
SET user_phone = u.phone
FROM users u
WHERE d.user_id = u.id
  AND d.user_phone IS NULL
  AND u.phone IS NOT NULL;

-- Step 3: Migrate assistants table
UPDATE assistants a
SET user_phone = u.phone
FROM users u
WHERE a.user_id = u.id
  AND a.user_phone IS NULL
  AND u.phone IS NOT NULL;

-- Step 4: Migrate messages table (if it has sender_id and recipient_id)
-- Note: This assumes messages table has sender_id and recipient_id columns
-- If not, skip this step
UPDATE messages m
SET sender_phone = u.phone
FROM users u
WHERE m.sender_id = u.id
  AND m.sender_phone IS NULL
  AND u.phone IS NOT NULL;

UPDATE messages m
SET recipient_phone = u.phone
FROM users u
WHERE m.recipient_id = u.id
  AND m.recipient_phone IS NULL
  AND u.phone IS NOT NULL;

-- Step 5: Migrate message_threads table (if it has participant1_id and participant2_id)
UPDATE message_threads mt
SET participant1_phone = u.phone
FROM users u
WHERE mt.participant1_id = u.id
  AND mt.participant1_phone IS NULL
  AND u.phone IS NOT NULL;

UPDATE message_threads mt
SET participant2_phone = u.phone
FROM users u
WHERE mt.participant2_id = u.id
  AND mt.participant2_phone IS NULL
  AND u.phone IS NOT NULL;

-- Step 6: After migration, you can make columns NOT NULL (optional)
-- ALTER TABLE doctors ALTER COLUMN user_phone SET NOT NULL;
-- ALTER TABLE assistants ALTER COLUMN user_phone SET NOT NULL;
-- ALTER TABLE messages ALTER COLUMN sender_phone SET NOT NULL;
-- ALTER TABLE messages ALTER COLUMN recipient_phone SET NOT NULL;
-- ALTER TABLE message_threads ALTER COLUMN participant1_phone SET NOT NULL;
-- ALTER TABLE message_threads ALTER COLUMN participant2_phone SET NOT NULL;

-- Step 7: Drop old columns (optional, do this after verifying data)
-- ALTER TABLE doctors DROP COLUMN IF EXISTS user_id;
-- ALTER TABLE assistants DROP COLUMN IF EXISTS user_id;
-- ALTER TABLE messages DROP COLUMN IF EXISTS sender_id;
-- ALTER TABLE messages DROP COLUMN IF EXISTS recipient_id;
-- ALTER TABLE message_threads DROP COLUMN IF EXISTS participant1_id;
-- ALTER TABLE message_threads DROP COLUMN IF EXISTS participant2_id;



