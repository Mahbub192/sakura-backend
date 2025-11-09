# Neon Database Setup Guide

## Step 1: Get Your Neon Connection String

1. Go to your Neon dashboard: https://console.neon.tech
2. Select your project
3. Click on "Connect" or "Connection Details"
4. Copy the connection string (it looks like this):
   ```
   postgresql://neondb_owner:password@ep-xxx-xxx-pooler.region.azure.neon.tech/neondb?sslmode=require&channel_binding=require
   ```

## Step 2: Create .env File

Create a `.env` file in the root directory (`/Users/farazymaxit/Desktop/doctorAppointment/.env`) with the following content:

```env
# Neon Database Configuration
# Paste your Neon connection string here
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-xxx-xxx-pooler.region.azure.neon.tech/neondb?sslmode=require&channel_binding=require

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=24h

# Application Configuration
PORT=3000
NODE_ENV=development
```

## Step 3: Replace Connection String

Replace `DATABASE_URL` with your actual Neon connection string from Step 1.

**Important Notes:**
- The connection string should include `?sslmode=require&channel_binding=require` at the end
- If you're using a pooler (recommended), make sure the URL contains `-pooler` in the hostname
- For production, use a strong `JWT_SECRET` (minimum 32 characters)

## Step 4: Test Connection

Run the application:

```bash
npm run start:dev
```

If the connection is successful, you should see:
- No database connection errors
- Application starts on port 3000
- TypeORM synchronizes your entities (in development mode)

## Troubleshooting

### Connection Timeout
- Check if your IP is whitelisted in Neon dashboard
- Verify the connection string is correct
- Make sure you're using the pooler endpoint (contains `-pooler`)

### SSL Error
- Ensure `sslmode=require` is in the connection string
- The app.module.ts already has `ssl: { rejectUnauthorized: false }` configured

### Authentication Failed
- Verify the password in the connection string
- Check if the role/user has proper permissions
- Try resetting the password in Neon dashboard

## Using Different Branches

If you have multiple branches (production, development), you can:

1. **Option 1**: Use different `.env` files
   - `.env.production` for production branch
   - `.env.development` for development branch
   - Update `envFilePath` in `app.module.ts` if needed

2. **Option 2**: Switch connection strings in `.env` file when needed

## Connection String Format

```
postgresql://[username]:[password]@[host]:[port]/[database]?[parameters]
```

For Neon with pooler:
```
postgresql://neondb_owner:password@ep-xxx-xxx-pooler.region.azure.neon.tech/neondb?sslmode=require&channel_binding=require
```

## Next Steps

After successful connection:
1. Run database migrations (if any)
2. Seed the database: `npm run seed`
3. Test your API endpoints
