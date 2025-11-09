# Render Deployment Guide

This guide will help you deploy the Doctor Appointment Management System to Render.

## Prerequisites

1. A Render account (sign up at https://render.com)
2. A PostgreSQL database (Render provides PostgreSQL service)
3. Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Create a New Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your Git repository (GitHub, GitLab, or Bitbucket)
4. Select the `doctorAppointment` repository
5. Render will auto-detect it's a Node.js application

## Step 2: Configure Build Settings

Render should auto-detect your settings, but verify:

- **Name**: `doctor-appointment-api` (or your preferred name)
- **Environment**: `Node`
- **Build Command**: `npm install && npx nest build`
  - **Important**: 
    - Use `npm install` (NOT `npm install --production`) to include dev dependencies
    - Use `npx nest build` instead of `nest build` to ensure the locally installed CLI is used
- **Start Command**: `npm run start:prod`
- **Plan**: Choose your plan (Free tier available)

**Note**: If you see "nest: not found" error:
1. Ensure build command is `npm install && npx nest build` (using `npx` ensures local CLI is found)
2. Verify `@nestjs/cli` is in `devDependencies` (it should be)
3. Check Render logs to confirm dev dependencies are being installed

## Step 3: Add PostgreSQL Database

1. In your Render dashboard, click "New +" → "PostgreSQL"
2. Configure your database:
   - **Name**: `doctor-appointment-db` (or your preferred name)
   - **Database**: `doctor_appointment` (or leave default)
   - **User**: Auto-generated
   - **Region**: Choose closest to your users
   - **Plan**: Choose your plan
3. Click "Create Database"
4. Render will automatically provide a `DATABASE_URL` connection string

## Step 4: Configure Environment Variables

In your Web Service settings, go to "Environment" tab and add the following:

### Required Environment Variables

#### 1. NODE_ENV
```
NODE_ENV=production
```

#### 2. DATABASE_URL
```
DATABASE_URL=<your-postgresql-connection-string>
```
**Note**: Render automatically provides this when you add a PostgreSQL database. You can:
- Copy it from your PostgreSQL service's "Connections" tab
- Or Render will auto-link it if both services are in the same project

#### 3. JWT_SECRET
```
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
```
**Important**: Generate a strong JWT secret (minimum 32 characters):
```bash
# Generate a secure random secret
openssl rand -base64 32
```

### Optional Environment Variables

#### 4. JWT_EXPIRES_IN
```
JWT_EXPIRES_IN=24h
```
Default: `24h` (if not set)

#### 5. PORT
```
PORT=10000
```
**Note**: Render automatically sets `PORT`. You don't need to set this manually, but if you do, use `10000` (Render's default).

#### 6. CORS_ORIGIN (Optional)
```
CORS_ORIGIN=https://your-frontend-domain.com
```
If you have a frontend application, set the allowed origin. If not set, CORS will allow all origins (`*`) in production.

## Step 5: Link Database to Web Service

1. In your Web Service settings, go to "Environment" tab
2. Under "Environment Variables", you should see an option to "Link Database"
3. Select your PostgreSQL database
4. Render will automatically add the `DATABASE_URL` variable

## Step 6: Deploy

1. Click "Save Changes" in your Web Service settings
2. Render will automatically:
   - Build your application (`npm install && npm run build`)
   - Start your application (`npm run start:prod`)
   - Use the `PORT` environment variable (provided by Render)
   - Listen on `0.0.0.0` (configured in `main.ts`)
   - Connect to PostgreSQL using `DATABASE_URL`

## Step 7: Verify Deployment

Once deployed, Render will provide you with a public URL (e.g., `https://doctor-appointment-api.onrender.com`).

### Health Check

Visit the health check endpoint:
```
https://your-app.onrender.com/health
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
https://your-app.onrender.com/api
```

### Root Endpoint

```
https://your-app.onrender.com/
```

## Step 8: Database Setup

### Option 1: Use TypeORM Synchronize (Initial Setup)

⚠️ **For initial setup only**: You can temporarily enable schema synchronization:

1. Set environment variable:
   ```
   NODE_ENV=development
   ```
2. Deploy and let TypeORM create the schema
3. **Important**: After schema is created, change back to:
   ```
   NODE_ENV=production
   ```
4. For future changes, use migrations instead

### Option 2: Run Migrations (Recommended)

If you have migrations, you can run them via Render's Shell:

1. Go to your Web Service
2. Click "Shell" tab
3. Run your migration commands

### Option 3: Seed Initial Data

To seed initial data:

1. Go to your Web Service
2. Click "Shell" tab
3. Run: `npm run seed`

## Step 9: Custom Domain (Optional)

1. In your Web Service settings, go to "Settings" tab
2. Scroll to "Custom Domains"
3. Click "Add Custom Domain"
4. Follow the instructions to configure your domain

## Monitoring and Logs

### View Logs

1. In Render dashboard, click on your Web Service
2. Go to "Logs" tab
3. View real-time and historical logs

### Health Monitoring

Render automatically monitors your application. The health check endpoint at `/health` is used for monitoring.

### Auto-Deploy

Render automatically deploys when you push to your connected Git branch. You can configure:
- **Auto-Deploy**: Enable/disable in "Settings" → "Auto-Deploy"
- **Branch**: Set which branch to deploy from

## Troubleshooting

### Application Won't Start

1. **Check logs**: View deployment logs in Render dashboard
2. **Verify environment variables**: Ensure all required variables are set
3. **Check database connection**: Verify `DATABASE_URL` is correctly set
4. **Port issues**: Render automatically sets `PORT`, ensure your app uses it (already configured)

### Database Connection Issues

1. **Verify DATABASE_URL**: 
   - Check that the PostgreSQL service is running
   - Copy the connection string from PostgreSQL service's "Connections" tab
   - Ensure the database is linked to your Web Service
2. **SSL requirements**: Render PostgreSQL requires SSL (already configured in app)
3. **Connection timeout**: Check if your database service is running and accessible

### Build Failures

1. **"nest: not found" error**: 
   - **Cause**: The `nest` command is not found in PATH, even though `@nestjs/cli` is installed
   - **Solution**: Use `npx nest build` instead of `nest build` or `npm run build`
   - **Build Command should be**: `npm install && npx nest build`
   - **Alternative**: Use `./node_modules/.bin/nest build` if `npx` doesn't work
   - Verify in Render dashboard: Settings → Build & Deploy → Build Command
   - Also ensure `npm install` is NOT using `--production` flag
2. **Check build logs**: View the build output in Render logs
3. **Verify Node version**: Render uses Node.js 18+ by default (can be set in `package.json` or `render.yaml`)
4. **Check dependencies**: Ensure all dependencies are in `package.json`
5. **Memory issues**: Free tier has memory limits, consider upgrading if needed

### CORS Issues

1. **Set CORS_ORIGIN**: If you have a frontend, set the `CORS_ORIGIN` variable
2. **Check allowed origins**: Verify your frontend URL is in the allowed list
3. **Wildcard**: If not set, CORS allows all origins (`*`) in production

### Free Tier Limitations

Render's free tier has some limitations:
- Services spin down after 15 minutes of inactivity
- First request after spin-down may be slow (cold start)
- Limited build minutes per month
- Consider upgrading for production use

## Environment Variables Summary

| Variable | Required | Description | Default | Render Auto-Set |
|----------|----------|-------------|---------|----------------|
| `NODE_ENV` | Yes | Environment mode | `development` | No |
| `PORT` | No | Server port | `3000` | **Yes** (10000) |
| `DATABASE_URL` | Yes* | PostgreSQL connection string | - | **Yes** (if linked) |
| `JWT_SECRET` | Yes | JWT signing secret (min 32 chars) | - | No |
| `JWT_EXPIRES_IN` | No | JWT expiration time | `24h` | No |
| `CORS_ORIGIN` | No | Allowed CORS origin | `*` | No |

*Render automatically provides `DATABASE_URL` when PostgreSQL database is linked to your Web Service.

## Quick Setup Checklist

- [ ] Create Render account
- [ ] Create Web Service from Git repository
- [ ] Create PostgreSQL database
- [ ] Link database to Web Service
- [ ] Set `NODE_ENV=production`
- [ ] Set `JWT_SECRET` (generate secure secret)
- [ ] Set `JWT_EXPIRES_IN=24h` (optional)
- [ ] Set `CORS_ORIGIN` (optional, if you have frontend)
- [ ] Verify `DATABASE_URL` is set (auto-set when linked)
- [ ] Deploy and test health endpoint
- [ ] Test API endpoints
- [ ] Set up database schema (sync or migrations)
- [ ] Seed initial data (if needed)

## Production Best Practices

1. **Use strong JWT secret**: Generate a secure random secret (32+ characters)
2. **Set specific CORS origins**: Don't use `*` in production, specify your frontend domain
3. **Enable SSL**: Render provides SSL automatically for all services
4. **Monitor logs**: Regularly check application logs for errors
5. **Database backups**: Configure automatic backups in Render (available on paid plans)
6. **Environment separation**: Use separate services for staging and production
7. **Upgrade plan**: Consider upgrading from free tier for production workloads
8. **Health checks**: Use the `/health` endpoint for monitoring

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Render PostgreSQL Guide](https://render.com/docs/databases)
- [NestJS Deployment Guide](https://docs.nestjs.com/recipes/deployment)
- [Render Environment Variables](https://render.com/docs/environment-variables)

## Support

If you encounter issues:
1. Check Render logs
2. Verify environment variables are set correctly
3. Test database connection
4. Review application logs
5. Check Render status page: https://status.render.com

For Render-specific issues, consult [Render Support](https://render.com/docs/support).

