# Tính Toán Học Phí - Credit Calculator

A modern web application for calculating university tuition based on credit requirements. Students can track completed courses and see their remaining tuition fees.

## Features

- **User Authentication**: Email and password-based authentication with Better Auth
- **Course Tracking**: View all curriculum courses organized by semester
- **Exemption Management**: Mark completed or exempted courses to reduce tuition
- **Real-time Calculation**: Automatic calculation of remaining credits and tuition costs
- **Progress Tracking**: Visual progress bars showing mandatory and elective credit completion
- **Data Persistence**: All user data stored securely in Neon PostgreSQL database

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Backend**: Next.js API Routes, Better Auth
- **Database**: Neon PostgreSQL, Drizzle ORM
- **UI**: Tailwind CSS, Radix UI components
- **Authentication**: Better Auth with email/password

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Database Setup

1. Create a Neon PostgreSQL database
2. Copy the connection string
3. Set it as `DATABASE_URL` in your `.env.local`

### 3. Environment Variables

Create a `.env.local` file with:

```env
# Database
DATABASE_URL=postgresql://user:password@host/database

# Authentication
BETTER_AUTH_SECRET=your_secret_key_here

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

To generate `BETTER_AUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 4. Seed the Database with Courses

```bash
pnpm tsx scripts/seed-courses.ts
```

This will populate the database with all 132 courses from the Computer Science curriculum (K66).

### 5. Run the Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000` in your browser.

## Course Data

The application includes all courses from the K66 Computer Science program:

- **Mandatory Credits**: 120 credits
- **Elective Credits**: 12 credits
- **Total**: 132 credits
- **Price per Credit**: 750,000 VND

Courses are organized across 8 semesters with prerequisites tracked.

## Usage

1. **Register/Login**: Create an account using email and password
2. **View Courses**: Browse all courses organized by semester
3. **Mark Exemptions**: Check courses you've already completed or are exempted from
4. **Track Progress**: See your remaining credits and total tuition in the sidebar
5. **Calculate Cost**: Total tuition = remaining credits × 750,000 VND

## Database Schema

### Core Tables

- `user` - User accounts (Better Auth)
- `session` - User sessions (Better Auth)
- `account` - User account data (Better Auth)
- `course` - All curriculum courses (132 total)
- `exemption` - User exemptions/completed courses
- `credit_summary` - User's credit progress and requirements

## API Routes

- `GET /api/courses` - Fetch all courses
- `GET /api/exemptions` - Fetch user's exemptions
- `POST /api/exemptions` - Add an exemption
- `DELETE /api/exemptions` - Remove an exemption
- `GET /api/credit-summary` - Fetch user's credit summary
- `POST/GET /api/auth/[...all]` - Authentication endpoints

## Deployment

### Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Run seed script after deployment

```bash
pnpm tsx scripts/seed-courses.ts
```

## Notes

- Session-based authentication using Better Auth
- Each user has independent course exemptions and credit tracking
- Credits are automatically updated when exemptions are added/removed
- All data is stored securely in the database

## Support

For issues or questions, please open an issue in the repository.
