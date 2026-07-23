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

async function checkAccountSchema() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    // Truy vấn schema của bảng account
    const result = await sql`
      SELECT column_name, is_nullable, data_type, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'account';
    `;
    console.log('--- Bảng ACCOUNT ---');
    console.table(result);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAccountSchema();
