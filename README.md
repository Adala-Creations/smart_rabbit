# Smart Rabbit - Farm Management System

A comprehensive rabbit farm management system built with Next.js, TypeScript, and PostgreSQL. Perfect for rabbit farmers from small-scale to large-scale operations.

## Features

### 🐰 Rabbit Management
- Track individual rabbits with unique IDs (B- for bucks, D- for does)
- Record essential details: breed, weight, color, birth date
- Monitor rabbit status (Active, Sold, Deceased, Weaned)
- Assign rabbits to specific cages

### 📍 Location & Infrastructure Management
- Create and manage multiple farm locations (farm, backyard, warehouse, etc.)
- Organize rabbitries (runs) within locations
- Manage two types of cages:
  - **Breeding Cages (BC-)**: For adult breeding rabbits
  - **Weaner Cages (WC-)**: For young rabbits after weaning
- Track cage capacity and occupancy

### 💕 Breeding & Birth Records
- Record mating events between bucks and does
- Track expected kindling dates (automatically calculated)
- Record birth outcomes: total kits, alive kits, dead kits
- Monitor survival rates and breeding success

### 📊 Health Tracking
- Record weight measurements over time
- Track deaths with cause and notes
- Monitor individual rabbit health history

### 💰 Financial Management
- Record sales (individual rabbits or products)
- Track expenses by category (Feed, Medical, Equipment, Maintenance, etc.)
- View profit/loss analysis
- Monitor buyer information

### 👤 User Account Management
- Secure user authentication
- Each user manages their own farm data
- Protected dashboard and resources

### 👷 Worker Management (Multi-User Collaboration)
- Add multiple workers to manage rabbitries simultaneously
- Assign workers to specific rabbitries with customizable roles:
  - **Worker**: Basic access
  - **Supervisor**: Oversee operations
  - **Manager**: Full management access
- Track worker assignments and manage team members
- View all users and their rabbitry assignments
- Support for concurrent management by multiple workers

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **Password Hashing**: bcryptjs

## Getting Started

### Prerequisites

- Node.js 20.9.0 or higher (recommended)
- PostgreSQL database
- npm or yarn package manager

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```

3. **Configure your database**:
   Edit the `.env` file and update the `DATABASE_URL`:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/smart_rabbit?schema=public"
   ```

4. **Generate NextAuth secret**:
   ```bash
   openssl rand -base64 32
   ```
   Copy the output and update `NEXTAUTH_SECRET` in your `.env` file.

5. **Run Prisma migrations**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

6. **Start the development server**:
   ```bash
   npm run dev
   ```

7. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage Guide

### 1. Create an Account
- Visit the homepage and click "Get Started"
- Fill in your name, email, and password
- You'll be automatically signed in after registration

### 2. Set Up Your Farm Infrastructure

**Add a Location**:
- Go to Dashboard → Locations
- Click "+ Add Location"
- Enter location name, type, and address
- Click "Create Location"

**Create a Rabbitry**:
- In the Locations page, click "+ Add Rabbitry"
- Enter rabbitry name and select the location
- Click "Create Rabbitry"

**Add Cages**:
- Click "+ Add Cage"
- Enter cage ID (e.g., BC-001 for breeding, WC-001 for weaner)
- Select cage type and rabbitry
- Set capacity
- Click "Create Cage"

### 3. Add Rabbits

- Go to Dashboard → Rabbits
- Click "+ Add Rabbit"
- Fill in details:
  - **Rabbit ID**: B-001 for bucks, D-001 for does
  - **Gender**: Buck or Doe
  - **Breed**: e.g., New Zealand White, Californian
  - **Cage**: Select from available cages
  - **Initial Weight** (optional)
- Click "Add Rabbit"

### 4. Record Breeding

**Record Mating**:
- Go to Dashboard → Breeding
- Click "+ Record Mating"
- Select buck and doe
- Enter mating date
- System automatically calculates expected kindling date (30 days)

**Record Birth**:
- Click "+ Record Birth"
- Select the mating record
- Enter birth date
- Record total kits, alive kits, and dead kits
- Click "Record Birth"

### 5. Track Finances

**Record Sales**:
- Go to Dashboard → Finances
- Click "+ Add Sale" in the Sales section
- Optionally link to a specific rabbit
- Enter description, amount, and buyer info
- Click "Record Sale"

**Record Expenses**:
- Click "+ Add Expense" in the Expenses section
- Select category (Feed, Medical, Equipment, etc.)
- Enter amount and vendor
- Click "Record Expense"

## ID Prefix Convention

The system uses prefixes for easy identification:

- **Rabbits**:
  - `B-` prefix for Bucks (males) - e.g., B-001, B-002
  - `D-` prefix for Does (females) - e.g., D-001, D-002

- **Cages**:
  - `BC-` prefix for Breeding Cages - e.g., BC-001, BC-002
  - `WC-` prefix for Weaner Cages - e.g., WC-001, WC-002

## Development

### Run Prisma Studio
To view and edit your database:
```bash
npx prisma studio
```

### Reset Database
⚠️ Warning: This will delete all data!
```bash
npx prisma db push --force-reset
```

### Build for Production
```bash
npm run build
npm start
```

---

**Built with ❤️ for rabbit farmers everywhere** 🐰


