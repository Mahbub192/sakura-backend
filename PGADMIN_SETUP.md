# Connecting to Neon Database using pgAdmin

This guide will help you connect to your Neon PostgreSQL database using pgAdmin.

## 📋 Connection Information

### Development Branch

| Parameter | Value |
|-----------|-------|
| **Name** | Neon - Doctor Appointment (Development) |
| **Host** | `ep-sweet-silence-a8cha0d0-pooler.eastus2.azure.neon.tech` |
| **Port** | `5432` |
| **Database** | `neondb` |
| **Username** | `neondb_owner` |
| **Password** | `npg_AujMWXt7h2ln` |
| **SSL Mode** | `Require` |

### Production Branch

| Parameter | Value |
|-----------|-------|
| **Name** | Neon - Doctor Appointment (Production) |
| **Host** | `ep-late-sound-a8796y2l-pooler.eastus2.azure.neon.tech` |
| **Port** | `5432` |
| **Database** | `neondb` |
| **Username** | `neondb_owner` |
| **Password** | `npg_AujMWXt7h2ln` |
| **SSL Mode** | `Require` |

## 🔧 Step-by-Step Setup Instructions

### Step 1: Open pgAdmin

1. Launch pgAdmin on your computer
2. If prompted, enter your pgAdmin master password

### Step 2: Create a New Server Connection

1. **Right-click** on "Servers" in the left panel
2. Select **"Register" → "Server..."**
3. A new dialog window will open

### Step 3: General Tab

Fill in the **General** tab:

- **Name**: `Neon - Doctor Appointment (Development)` or `Neon - Doctor Appointment (Production)`
  - Choose a descriptive name to identify which branch you're connecting to

### Step 4: Connection Tab

Fill in the **Connection** tab with the following details:

#### For Development Branch:
```
Host name/address: ep-sweet-silence-a8cha0d0-pooler.eastus2.azure.neon.tech
Port: 5432
Maintenance database: neondb
Username: neondb_owner
Password: npg_AujMWXt7h2ln
```

#### For Production Branch:
```
Host name/address: ep-late-sound-a8796y2l-pooler.eastus2.azure.neon.tech
Port: 5432
Maintenance database: neondb
Username: neondb_owner
Password: npg_AujMWXt7h2ln
```

**Important**: 
- ✅ Check **"Save password"** if you want pgAdmin to remember your password
- ⚠️ Leave **"Save password"** unchecked for better security

### Step 5: SSL Tab (Critical!)

1. Click on the **"SSL"** tab
2. Configure SSL settings as follows:

```
SSL mode: Require
Client certificate: (leave blank)
Client certificate key: (leave blank)
Root certificate: (leave blank)
Certificate revocation list: (leave blank)
```

**Key Settings:**
- **SSL mode**: Select **"Require"** from the dropdown
- This is **REQUIRED** for Neon connections

### Step 6: Advanced Tab (Optional)

You can configure additional settings:

- **DB restriction**: Leave blank (or specify `neondb` if you only want to see this database)
- **Other settings**: Leave as default

### Step 7: Save and Connect

1. Click **"Save"** button
2. pgAdmin will attempt to connect to the server
3. If successful, you'll see the server appear in the left panel with a green icon

### Step 8: Verify Connection

Once connected:
1. Expand the server node in the left panel
2. Expand **"Databases"**
3. You should see the `neondb` database
4. Expand `neondb` to see tables, schemas, etc.

## 🔍 Quick Connection String Reference

If you prefer to use the connection string directly in pgAdmin's connection dialog:

**Development:**
```
postgresql://neondb_owner:npg_AujMWXt7h2ln@ep-sweet-silence-a8cha0d0-pooler.eastus2.azure.neon.tech:5432/neondb?sslmode=require
```

**Production:**
```
postgresql://neondb_owner:npg_AujMWXt7h2ln@ep-late-sound-a8796y2l-pooler.eastus2.azure.neon.tech:5432/neondb?sslmode=require
```

## 🐛 Troubleshooting

### Connection Failed: SSL Required

**Error**: `SSL connection is required. Please specify SSL options and retry.`

**Solution**: 
1. Go to the **SSL** tab in the connection dialog
2. Set **SSL mode** to **"Require"**
3. Try connecting again

### Connection Timeout

**Possible causes:**
- Firewall blocking the connection
- Incorrect host address
- Network connectivity issues

**Solutions:**
1. Verify the host address is correct (check the connection strings above)
2. Check if your firewall allows outbound connections to port 5432
3. Try pinging the host: `ping ep-sweet-silence-a8cha0d0-pooler.eastus2.azure.neon.tech`

### Authentication Failed

**Error**: `Password authentication failed`

**Solution**:
1. Verify the password is correct: `npg_AujMWXt7h2ln`
2. Check for extra spaces or special characters
3. If you've rotated the password in Neon dashboard, update it in pgAdmin

### Cannot Find Database

**Error**: Database `neondb` does not exist

**Solution**:
1. The database name should be exactly `neondb` (lowercase)
2. Make sure you're connecting to the correct branch
3. The database is created automatically by Neon - if it doesn't exist, contact Neon support

## 📊 What You Can Do in pgAdmin

Once connected, you can:

1. **Browse Tables**: View all tables in your database
2. **Run Queries**: Execute SQL queries using the Query Tool
3. **View Data**: Browse table data directly
4. **Manage Schema**: Create, modify, or delete database objects
5. **Monitor Performance**: View query execution plans
6. **Export/Import**: Export data or import data from files

## 🔐 Security Notes

1. **Password Storage**: 
   - If you saved the password, it's encrypted in pgAdmin's config file
   - Consider using pgAdmin's password manager for better security

2. **SSL Connection**: 
   - Always use SSL (Require mode) for Neon connections
   - This ensures data is encrypted in transit

3. **Multiple Connections**: 
   - You can create separate server connections for Development and Production
   - Use descriptive names to avoid confusion

## 📝 Creating Both Connections

You can create connections for both branches:

1. **Development Connection**:
   - Name: `Neon - Doctor Appointment (Development)`
   - Host: `ep-sweet-silence-a8cha0d0-pooler.eastus2.azure.neon.tech`

2. **Production Connection**:
   - Name: `Neon - Doctor Appointment (Production)`
   - Host: `ep-late-sound-a8796y2l-pooler.eastus2.azure.neon.tech`

This allows you to easily switch between environments.

## ✅ Connection Checklist

Before connecting, verify:

- [ ] pgAdmin is installed and running
- [ ] You have the correct host address for your branch
- [ ] Port is set to `5432`
- [ ] Database name is `neondb`
- [ ] Username is `neondb_owner`
- [ ] Password is `npg_AujMWXt7h2ln`
- [ ] SSL mode is set to **"Require"**
- [ ] Your internet connection is active

## 🎯 Next Steps After Connection

1. **Explore the Database**: Check what tables exist (if any)
2. **Run Test Query**: Try a simple query like `SELECT version();`
3. **Check Schema**: Look at the `public` schema
4. **View Connections**: Monitor active connections in pgAdmin

## 📚 Additional Resources

- [pgAdmin Documentation](https://www.pgadmin.org/docs/)
- [Neon Connection Guide](https://neon.tech/docs/connect/connect-from-any-app)
- [PostgreSQL SSL Configuration](https://www.postgresql.org/docs/current/ssl-tcp.html)

---

**Note**: If you need to update the connection details (e.g., after password rotation), right-click on the server in pgAdmin and select **"Properties"** to edit the connection settings.

