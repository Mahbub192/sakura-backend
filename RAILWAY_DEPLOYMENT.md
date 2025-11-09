# Railway Deployment Guide

This guide will help you deploy the Doctor Appointment Management System to Railway.

## Prerequisites

1. A Railway account (sign up at https://railway.app)
2. A PostgreSQL database (Railway provides PostgreSQL service)
3. Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Create a New Project on Railway

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo" (or your Git provider)
4. Connect your repository
5. Select the `doctorAppointment` repository

## Step 2: Add PostgreSQL Database

1. In your Railway project, click "New"
2. Select "Database" → "Add PostgreSQL"
3. Railway will automatically create a PostgreSQL database
4. The `DATABASE_URL` environment variable will be automatically set

## Step 3: Configure Environment Variables

In your Railway project settings, add the following environment variables:

### Required Variables

```env
NODE_ENV=production
PORT=3000
```

### Database Configuration

Railway automatically provides `DATABASE_URL` when you add a PostgreSQL service. The app will use this automatically.

If you need to use a different database, you can set:
```env
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
```

### JWT Configuration

```env
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=24h
```

**Important**: Generate a strong JWT secret (minimum 32 characters) for production:
```bash
# Generate a secure random secret
openssl rand -base64 32
```

### CORS Configuration (Optional)

If you have a frontend application, set the allowed origin:
```env
CORS_ORIGIN=https://your-frontend-domain.com
```

If not set, CORS will allow all origins (`*`) in production.

## Step 4: Deploy

1. Railway will automatically detect your `package.json` and build the app
2. The build process will:
   - Install dependencies (`npm install`)
   - Build the application (`npm run build`)
   - Start the application (`npm run start:prod`)

3. Railway will automatically:
   - Use the `PORT` environment variable (provided by Railway)
   - Listen on `0.0.0.0` (configured in `main.ts`)
   - Connect to the PostgreSQL database using `DATABASE_URL`

## Step 5: Verify Deployment

Once deployed, Railway will provide you with a public URL (e.g., `https://your-app.railway.app`).

### Health Check

Visit the health check endpoint:
```
https://your-app.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "Doctor Appointment Management System"
}
```

### API Documentation

Access Swagger documentation at:
```
https://your-app.railway.app/api
```

### Root Endpoint

```
https://your-app.railway.app/
```

## Step 6: Database Setup

### Option 1: Run Migrations (Recommended)

If you have migrations, you can run them via Railway's console or add a migration script.

### Option 2: Use TypeORM Synchronize (Development Only)

⚠️ **Warning**: The app is configured to disable `synchronize` in production for safety. 

If you need to sync the schema initially, you can temporarily enable it by setting:
```env
NODE_ENV=development
```

Then after the first deployment, change it back to `production` and use migrations.

### Option 3: Seed Initial Data

If you need to seed initial data, you can:
1. Use Railway's console to run: `npm run seed`
2. Or create a one-time setup script

## Step 7: Custom Domain (Optional)

1. In Railway project settings, go to "Settings" → "Domains"
2. Click "Generate Domain" or "Custom Domain"
3. Follow the instructions to configure your custom domain

## Monitoring and Logs

### View Logs

1. In Railway dashboard, click on your service
2. Go to "Deployments" tab
3. Click on a deployment to view logs

### Health Monitoring

Railway automatically monitors your application. The health check endpoint at `/health` is used for monitoring.

## Troubleshooting

### Application Won't Start

1. **Check logs**: View deployment logs in Railway dashboard
2. **Verify environment variables**: Ensure all required variables are set
3. **Check database connection**: Verify `DATABASE_URL` is correctly set
4. **Port issues**: Railway automatically sets `PORT`, ensure your app uses it

### Database Connection Issues

1. **Verify DATABASE_URL**: Check that the PostgreSQL service is connected
2. **SSL requirements**: Railway PostgreSQL requires SSL (already configured)
3. **Connection timeout**: Check if your database service is running

### Build Failures

1. **Check build logs**: View the build output in Railway
2. **Verify Node version**: Railway uses Node.js 18+ by default
3. **Check dependencies**: Ensure all dependencies are in `package.json`

### CORS Issues

1. **Set CORS_ORIGIN**: If you have a frontend, set the `CORS_ORIGIN` variable
2. **Check allowed origins**: Verify your frontend URL is in the allowed list

## Environment Variables Summary

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `NODE_ENV` | Yes | Environment mode | `development` |
| `PORT` | No | Server port (Railway sets this) | `3000` |
| `DATABASE_URL` | Yes* | PostgreSQL connection string | Auto-set by Railway |
| `JWT_SECRET` | Yes | JWT signing secret (min 32 chars) | - |
| `JWT_EXPIRES_IN` | No | JWT expiration time | `24h` |
| `CORS_ORIGIN` | No | Allowed CORS origin | `*` |

*Railway automatically provides `DATABASE_URL` when PostgreSQL service is added.

## Production Best Practices

1. **Use strong JWT secret**: Generate a secure random secret (32+ characters)
2. **Set specific CORS origins**: Don't use `*` in production, specify your frontend domain
3. **Enable SSL**: Railway provides SSL automatically
4. **Monitor logs**: Regularly check application logs for errors
5. **Database backups**: Configure automatic backups in Railway
6. **Environment separation**: Use separate projects/environments for staging and production

## Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [NestJS Deployment Guide](https://docs.nestjs.com/recipes/deployment)
- [PostgreSQL on Railway](https://docs.railway.app/databases/postgresql)

## Support

If you encounter issues:
1. Check Railway logs
2. Verify environment variables
3. Test database connection
4. Review application logs

For Railway-specific issues, consult [Railway Support](https://railway.app/help).

