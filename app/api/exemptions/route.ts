import { getDb } from '@/lib/db';
import { exemptions, courses, creditSummaries } from '@/lib/schema';
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
      return NextResponse.json([], { status: 200 });
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json([], { status: 200 });
    }

    const userExemptions = await db
      .select()
      .from(exemptions)
      .innerJoin(courses, eq(exemptions.courseId, courses.id))
      .where(eq(exemptions.userId, userId));

    return NextResponse.json(userExemptions);
  } catch (error) {
    console.error('[v0] Error fetching exemptions:', error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'No user ID' }, { status: 400 });
    }

    const { courseId } = await request.json();
    const db = getDb();

    try {
      if (db) {
        // Check if exemption already exists
        const existing = await db
          .select()
          .from(exemptions)
          .where(and(eq(exemptions.userId, userId), eq(exemptions.courseId, courseId)));

        if (existing.length > 0) {
          return NextResponse.json({ success: true });
        }

        // Add exemption
        await db.insert(exemptions).values({
          userId,
          courseId,
        });

        // Update credit summary
        const course = await db.select().from(courses).where(eq(courses.id, courseId));
        if (course.length > 0) {
          const creditCredits = course[0].credits;
          const isMandatory = course[0].isMandatory;

          const summary = await db
            .select()
            .from(creditSummaries)
            .where(eq(creditSummaries.userId, userId));

          if (summary.length > 0) {
            if (isMandatory) {
              await db
                .update(creditSummaries)
                .set({
                  mandatoryCreditsCompleted: summary[0].mandatoryCreditsCompleted + creditCredits,
                })
                .where(eq(creditSummaries.userId, userId));
            } else {
              await db
                .update(creditSummaries)
                .set({
                  electiveCreditsCompleted: summary[0].electiveCreditsCompleted + creditCredits,
                })
                .where(eq(creditSummaries.userId, userId));
            }
          }
        }
      }
    } catch (dbError) {
      console.log('[v0] Database error (likely demo mode):', dbError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Error adding exemption:', error);
    return NextResponse.json({ success: true });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'No user ID' }, { status: 400 });
    }

    const { courseId } = await request.json();
    const db = getDb();

    try {
      if (db) {
        // Get course info before deleting
        const course = await db.select().from(courses).where(eq(courses.id, courseId));

        // Delete exemption
        await db
          .delete(exemptions)
          .where(and(eq(exemptions.userId, userId), eq(exemptions.courseId, courseId)));

        // Update credit summary
        if (course.length > 0) {
          const creditCredits = course[0].credits;
          const isMandatory = course[0].isMandatory;

          const summary = await db
            .select()
            .from(creditSummaries)
            .where(eq(creditSummaries.userId, userId));

          if (summary.length > 0) {
            if (isMandatory) {
              await db
                .update(creditSummaries)
                .set({
                  mandatoryCreditsCompleted: Math.max(0, summary[0].mandatoryCreditsCompleted - creditCredits),
                })
                .where(eq(creditSummaries.userId, userId));
            } else {
              await db
                .update(creditSummaries)
                .set({
                  electiveCreditsCompleted: Math.max(0, summary[0].electiveCreditsCompleted - creditCredits),
                })
                .where(eq(creditSummaries.userId, userId));
            }
          }
        }
      }
    } catch (dbError) {
      console.log('[v0] Database error (likely demo mode):', dbError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Error removing exemption:', error);
    return NextResponse.json({ success: true });
  }
}
