# Smart Rabbit Setup Guide

## Quick Start

Follow these steps to get your Smart Rabbit farm management system up and running:

### Step 1: Environment Setup

1. Copy the local environment file:
   ```bash
   cp .env.local .env
   ```

2. Edit `.env` and configure:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL`: Keep as `http://localhost:3005` for development

### Step 2: Database Setup

1. Make sure PostgreSQL is running

2. Create the database (if not exists):
   ```sql
   CREATE DATABASE smart_rabbit;
   ```

3. Run Prisma to sync your database:
   ```bash
   npx prisma db push
   ```

4. (Optional) Open Prisma Studio to view your database:
   ```bash
   npx prisma studio
   ```

### Step 3: Start the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser to: http://localhost:3005

3. Click "Get Started" to create your account

### Step 4: Initial Setup Workflow

Once you've created your account:

1. **Create a Location**
   - Go to Dashboard → Locations
   - Add your first farm location

2. **Create a Rabbitry**
   - In Locations, add a rabbitry to your location

3. **Add Cages**
   - Create breeding cages (BC-001, BC-002, etc.)
   - Create weaner cages (WC-001, WC-002, etc.)

4. **Add Your First Rabbits**
   - Go to Dashboard → Rabbits
   - Add bucks (B-001, B-002, etc.)
   - Add does (D-001, D-002, etc.)

5. **Start Recording Data**
   - Record matings in the Breeding section
   - Track births
   - Record sales and expenses in Finances

## Common Issues

### Database Connection Error

If you see "Can't reach database server":
- Check PostgreSQL is running
- Verify DATABASE_URL in .env is correct
- Ensure the database exists

### Port Already in Use

If port 3005 is busy:
```bash
npm run dev -- -p 3006
```

### Authentication Issues

If you can't log in:
- Clear browser cookies
- Check NEXTAUTH_SECRET is set in .env
- Restart the dev server

## Production Deployment

For production deployment:

1. Set environment variables on your hosting platform
2. Update NEXTAUTH_URL to your production domain
3. Build the application:
   ```bash
   npm run build
   ```
4. Start production server:
   ```bash
   npm start
   ```

## Need Help?

Refer to the main README.md for detailed documentation on all features.
