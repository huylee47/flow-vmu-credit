import { getDb } from '@/lib/db';
import { creditSummaries, exemptions, courses } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

async function getUserId(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({
        mandatoryCreditsRequired: 120,
        electiveCreditsRequired: 12,
        mandatoryCreditsCompleted: 0,
        electiveCreditsCompleted: 0,
      });
    }

    try {
      const db = getDb();
      if (db) {
        let summary = await db
          .select()
          .from(creditSummaries)
          .where(eq(creditSummaries.userId, userId));

        if (summary.length === 0) {
          // Create new summary
          await db.insert(creditSummaries).values({
            userId,
            mandatoryCreditsRequired: 120,
            electiveCreditsRequired: 12,
            mandatoryCreditsCompleted: 0,
            electiveCreditsCompleted: 0,
          });

          summary = await db
            .select()
            .from(creditSummaries)
            .where(eq(creditSummaries.userId, userId));
        }

        return NextResponse.json(summary[0] || {
          mandatoryCreditsRequired: 120,
          electiveCreditsRequired: 12,
          mandatoryCreditsCompleted: 0,
          electiveCreditsCompleted: 0,
        });
      }
    } catch (dbError) {
      console.log('[v0] Database error:', dbError);
    }

    return NextResponse.json({
      mandatoryCreditsRequired: 120,
      electiveCreditsRequired: 12,
      mandatoryCreditsCompleted: 0,
      electiveCreditsCompleted: 0,
    });
  } catch (error) {
    console.error('[v0] Error fetching credit summary:', error);
    return NextResponse.json({
      mandatoryCreditsRequired: 120,
      electiveCreditsRequired: 12,
      mandatoryCreditsCompleted: 0,
      electiveCreditsCompleted: 0,
    });
  }
}
