// Grade conversion utilities

// Define grade conversion scale from 10 to 4
const GRADE_SCALE_MAP: Record<string, { min: number; max: number; scale4: number; letter: string }> = {
  A: { min: 8.5, max: 10, scale4: 4.0, letter: 'A' },
  B: { min: 7.0, max: 8.4, scale4: 3.0, letter: 'B' },
  'B+': { min: 8.0, max: 8.4, scale4: 3.5, letter: 'B+' },
  C: { min: 5.5, max: 6.9, scale4: 2.0, letter: 'C' },
  'C+': { min: 6.5, max: 6.9, scale4: 2.5, letter: 'C+' },
  D: { min: 4.0, max: 5.4, scale4: 1.0, letter: 'D' },
  F: { min: 0, max: 3.9, scale4: 0, letter: 'F' },
};

interface GradeResult {
  score10: number;
  score4: number;
  letterGrade: string;
  isValid: boolean;
  error?: string;
}

/**
 * Convert score from scale 10 to scale 4 with letter grade
 */
export function convertGrade(score10: number): GradeResult {
  // Validate input
  if (isNaN(score10) || score10 < 0 || score10 > 10) {
    return {
      score10: 0,
      score4: 0,
      letterGrade: 'F',
      isValid: false,
      error: 'Điểm phải từ 0 đến 10',
    };
  }

  let letterGrade = 'F';
  let score4 = 0;

  // Determine letter grade and scale 4
  if (score10 >= 8.5 && score10 <= 10) {
    letterGrade = 'A';
    score4 = 4.0;
  } else if (score10 >= 8.0 && score10 < 8.5) {
    letterGrade = 'B+';
    score4 = 3.5;
  } else if (score10 >= 7.0 && score10 < 8.0) {
    letterGrade = 'B';
    score4 = 3.0;
  } else if (score10 >= 6.5 && score10 < 7.0) {
    letterGrade = 'C+';
    score4 = 2.5;
  } else if (score10 >= 5.5 && score10 < 6.5) {
    letterGrade = 'C';
    score4 = 2.0;
  } else if (score10 >= 4.0 && score10 < 5.5) {
    letterGrade = 'D';
    score4 = 1.0;
  } else {
    letterGrade = 'F';
    score4 = 0;
  }

  return {
    score10: Math.round(score10 * 100) / 100,
    score4: Math.round(score4 * 100) / 100,
    letterGrade,
    isValid: true,
  };
}

interface GPACalculation {
  gpa10: number;
  gpa4: number;
  letterGrade: string;
  totalCredits: number;
  totalCourses: number;
}

/**
 * Calculate average GPA from array of scores
 */
export function calculateGPA(grades: { score10: number; credits: number }[]): GPACalculation {
  if (grades.length === 0) {
    return {
      gpa10: 0,
      gpa4: 0,
      letterGrade: 'F',
      totalCredits: 0,
      totalCourses: 0,
    };
  }

  let totalScore10 = 0;
  let totalScore4 = 0;
  let totalCredits = 0;

  grades.forEach(({ score10, credits }) => {
    const converted = convertGrade(score10);
    totalScore10 += score10;
    totalScore4 += converted.score4;
    totalCredits += credits;
  });

  const gpa10 = totalScore10 / grades.length;
  const gpa4 = totalScore4 / grades.length;

  // Determine letter grade based on GPA scale 10
  let letterGrade = 'F';
  if (gpa10 >= 8.5) letterGrade = 'A';
  else if (gpa10 >= 8.0) letterGrade = 'B+';
  else if (gpa10 >= 7.0) letterGrade = 'B';
  else if (gpa10 >= 6.5) letterGrade = 'C+';
  else if (gpa10 >= 5.5) letterGrade = 'C';
  else if (gpa10 >= 4.0) letterGrade = 'D';

  return {
    gpa10: Math.round(gpa10 * 100) / 100,
    gpa4: Math.round(gpa4 * 100) / 100,
    letterGrade,
    totalCredits,
    totalCourses: grades.length,
  };
}

interface TargetCalculation {
  aGradesNeeded: number;
  bPlusGradesNeeded: number;
  bGradesNeeded: number;
  minAForGood: number; // Giỏi = >= 8.0
  minAForExcellent: number; // Xuất sắc = >= 8.5
}

/**
 * Calculate how many A/B+ grades needed to reach target GPA
 * Giỏi (Good): GPA >= 8.0
 * Xuất sắc (Excellent): GPA >= 8.5
 */
export function calculateTargetGrades(
  currentGrades: { score4: number; credits: number }[],
  totalCreditsInProgram: number
): TargetCalculation {
  const currentPoints = currentGrades.reduce((sum, g) => sum + (g.score4 * g.credits), 0);

  // For Giỏi (3.2 GPA)
  const targetSumGood = 3.2 * totalCreditsInProgram;
  const pointsNeededGood = targetSumGood - currentPoints;
  const minCreditsAForGood = Math.ceil(pointsNeededGood / 4.0); // Assuming A = 4.0 per credit

  // For Xuất sắc (3.6 GPA)
  const targetSumExcellent = 3.6 * totalCreditsInProgram;
  const pointsNeededExcellent = targetSumExcellent - currentPoints;
  const minCreditsAForExcellent = Math.ceil(pointsNeededExcellent / 4.0);

  return {
    aGradesNeeded: 0,
    bPlusGradesNeeded: 0,
    bGradesNeeded: 0,
    minAForGood: Math.max(0, minCreditsAForGood),
    minAForExcellent: Math.max(0, minCreditsAForExcellent),
  };
}

export const GPA_LEVELS = {
  EXCELLENT: { min: 3.6, label: 'Xuất sắc', color: 'text-green-600' },
  GOOD: { min: 3.2, label: 'Giỏi', color: 'text-blue-600' },
  AVERAGE: { min: 2.5, label: 'Khá', color: 'text-yellow-600' },
  PASS: { min: 4.0, label: 'Đạt', color: 'text-orange-600' },
  FAIL: { min: 0, label: 'Không đạt', color: 'text-red-600' },
};
