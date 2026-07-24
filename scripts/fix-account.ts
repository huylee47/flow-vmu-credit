import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      if (value.startsWith('"') && value.endsWith('"')) { value = value.slice(1, -1); } 
      else if (value.startsWith("'") && value.endsWith("'")) { value = value.slice(1, -1); }
      if (!process.env[key]) { process.env[key] = value; }
    }
  });
}

async function fixAccountTable() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    // Drop the leftover NextAuth columns
    await sql`ALTER TABLE "account" DROP COLUMN IF EXISTS "provider" CASCADE;`;
    await sql`ALTER TABLE "account" DROP COLUMN IF EXISTS "providerAccountId" CASCADE;`;
    console.log('Fixed account table constraints by removing legacy NextAuth columns!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixAccountTable();
