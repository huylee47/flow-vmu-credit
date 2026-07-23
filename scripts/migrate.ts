import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../lib/schema';

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  console.log('Starting migration...');
  
  try {
    const sql = neon(process.env.DATABASE_URL);
    const db = drizzle(sql, { schema });

    // Create tables using raw SQL
    await sql`
      CREATE TABLE IF NOT EXISTS "course" (
        id SERIAL PRIMARY KEY,
        "courseCode" TEXT UNIQUE NOT NULL,
        "courseName" TEXT NOT NULL,
        credits INTEGER NOT NULL,
        semester INTEGER NOT NULL,
        "isMandatory" BOOLEAN NOT NULL,
        prerequisite TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "exemption" (
        id SERIAL PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES "user"(id),
        "courseId" INTEGER NOT NULL REFERENCES "course"(id),
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("userId", "courseId")
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "credit_summary" (
        id SERIAL PRIMARY KEY,
        "userId" TEXT UNIQUE NOT NULL REFERENCES "user"(id),
        "mandatoryCreditsRequired" INTEGER DEFAULT 120,
        "electiveCreditsRequired" INTEGER DEFAULT 12,
        "mandatoryCreditsCompleted" INTEGER DEFAULT 0,
        "electiveCreditsCompleted" INTEGER DEFAULT 0,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
