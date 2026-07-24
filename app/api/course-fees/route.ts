import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { courseFeeConfigs } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id;
}

async function isAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.role === 'admin';
}

export async function GET() {
  try {
    const fees = await db.select().from(courseFeeConfigs);
    return NextResponse.json(fees);
  } catch (error) {
    console.error('[v0] Error fetching course fees:', error);
    return NextResponse.json({ error: 'Failed to fetch fees' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { courseId, feeOld, feeTier1, feeTier2, feeTier3 } = body;

    // Check if config exists
    const existing = await db
      .select()
      .from(courseFeeConfigs)
      .where(eq(courseFeeConfigs.courseId, courseId));

    if (existing.length > 0) {
      // Update existing
      const updated = await db
        .update(courseFeeConfigs)
        .set({
          feeOld,
          feeTier1,
          feeTier2,
          feeTier3,
          updatedAt: new Date(),
        })
        .where(eq(courseFeeConfigs.courseId, courseId))
        .returning();

      return NextResponse.json(updated[0]);
    } else {
      // Create new
      const created = await db
        .insert(courseFeeConfigs)
        .values({
          courseId,
          feeOld,
          feeTier1,
          feeTier2,
          feeTier3,
        })
        .returning();

      return NextResponse.json(created[0]);
    }
  } catch (error) {
    console.error('[v0] Error saving course fees:', error);
    return NextResponse.json({ error: 'Failed to save fees' }, { status: 500 });
  }
}
