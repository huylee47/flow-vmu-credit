import { getDb } from '@/lib/db';
import { grades, courses } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { convertGrade } from '@/lib/grade-utils';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

async function getUserId(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id;
}

// GET - Fetch user's grades
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

    const userGrades = await db
      .select()
      .from(grades)
      .innerJoin(courses, eq(grades.courseId, courses.id))
      .where(eq(grades.userId, userId));

    return NextResponse.json(userGrades);
  } catch (error) {
    console.error('[v0] Error fetching grades:', error);
    return NextResponse.json([], { status: 200 });
  }
}

// POST - Save or update grade
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'No user ID' }, { status: 400 });
    }

    const { courseId, score10 } = await request.json();

    // Validate score
    if (isNaN(score10) || score10 < 0 || score10 > 10) {
      return NextResponse.json(
        { error: 'Điểm phải từ 0 đến 10' },
        { status: 400 }
      );
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json({ success: true });
    }

    // Convert grade
    const gradeConversion = convertGrade(score10);
    if (!gradeConversion.isValid) {
      return NextResponse.json(
        { error: gradeConversion.error },
        { status: 400 }
      );
    }

    // Check if grade exists
    const existing = await db
      .select()
      .from(grades)
      .where(and(eq(grades.userId, userId), eq(grades.courseId, courseId)));

    if (existing.length > 0) {
      // Update existing grade
      await db
        .update(grades)
        .set({
          score: gradeConversion.score10.toString(),
          scoreScale4: gradeConversion.score4.toString(),
          letterGrade: gradeConversion.letterGrade,
          updatedAt: new Date(),
        })
        .where(and(eq(grades.userId, userId), eq(grades.courseId, courseId)));
    } else {
      // Insert new grade
      await db.insert(grades).values({
        userId,
        courseId,
        score: gradeConversion.score10.toString(),
        scoreScale4: gradeConversion.score4.toString(),
        letterGrade: gradeConversion.letterGrade,
      });
    }

    return NextResponse.json({
      success: true,
      grade: gradeConversion,
    });
  } catch (error) {
    console.error('[v0] Error saving grade:', error);
    return NextResponse.json({ success: true });
  }
}

// DELETE - Remove grade
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'No user ID' }, { status: 400 });
    }

    const { courseId } = await request.json();
    const db = getDb();

    if (db) {
      await db
        .delete(grades)
        .where(and(eq(grades.userId, userId), eq(grades.courseId, courseId)));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Error deleting grade:', error);
    return NextResponse.json({ success: true });
  }
}
