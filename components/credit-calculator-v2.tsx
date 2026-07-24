'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { convertGrade, calculateGPA, calculateTargetGrades, GPA_LEVELS } from '@/lib/grade-utils';

interface Course {
  id: number;
  courseCode: string;
  courseName: string;
  credits: number;
  semester: number;
  isMandatory: boolean;
  feeType?: string;
}

interface Grade {
  courseId: number;
  score10: number;
  score4: number;
  letterGrade: string;
}

interface CreditSummary {
  mandatoryCreditsRequired: number;
  electiveCreditsRequired: number;
  mandatoryCreditsCompleted: number;
  electiveCreditsCompleted: number;
}

interface CourseFee {
  courseId: number;
  feeOld?: number;
  feeTier1?: number;
  feeTier2?: number;
  feeTier3?: number;
}

const DEFAULT_FEE_OLD = 755000; // Default old fee
const DEFAULT_FEE_TIER1 = 815000; // Default tier 1
const DEFAULT_FEE_TIER2 = 0; // TBD
const DEFAULT_FEE_TIER3 = 0; // TBD
const DEDUCTION = 10200000;

// Get fee per credit based on tier
const getFeeByCourseAndTier = (fees: CourseFee[], courseId: number, tier: 'old' | '1' | '2' | '3'): number => {
  const courseFee = fees.find(f => f.courseId === courseId);
  
  switch (tier) {
    case 'old':
      return courseFee?.feeOld || DEFAULT_FEE_OLD;
    case '1':
      return courseFee?.feeTier1 || DEFAULT_FEE_TIER1;
    case '2':
      return courseFee?.feeTier2 || DEFAULT_FEE_TIER2;
    case '3':
      return courseFee?.feeTier3 || DEFAULT_FEE_TIER3;
    default:
      return DEFAULT_FEE_OLD;
  }
};

export function CreditCalculatorV2() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<Set<number>>(new Set());
  const [grades, setGrades] = useState<Map<number, Grade>>(new Map());
  const [gradeInputs, setGradeInputs] = useState<Map<number, string>>(new Map());
  const [creditSummary, setCreditSummary] = useState<CreditSummary | null>(null);
  const [gradeInputFocused, setGradeInputFocused] = useState<number | null>(null);
  const [courseFees, setCourseFees] = useState<CourseFee[]>([]);
  const [feeTiers, setFeeTiers] = useState<Record<number, 'old' | '1' | '2' | '3'>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Fetch courses
      try {
        const coursesRes = await fetch('/api/courses');
        const coursesData = await coursesRes.json();
        const coursesArray = Array.isArray(coursesData) ? coursesData : [];
        setCourses(coursesArray);
      } catch (e) {
        console.log('[v0] Error fetching courses:', e);
      }

      // Fetch selected courses from database
      try {
        const exemptionsRes = await fetch('/api/exemptions');
        if (exemptionsRes.ok) {
          const exemptionsData = await exemptionsRes.json();
          const selectedIds = new Set(exemptionsData.map((e: any) => e.course.id));
          setSelectedCourses(selectedIds);
        }
      } catch (e) {
        console.log('[v0] Error fetching exemptions:', e);
      }

      // Fetch course fees
      try {
        const feesRes = await fetch('/api/course-fees');
        if (feesRes.ok) {
          const feesData = await feesRes.json();
          setCourseFees(Array.isArray(feesData) ? feesData : []);
        }
      } catch (e) {
        console.log('[v0] Error fetching course fees:', e);
      }

      // Fetch grades
      try {
        const gradesRes = await fetch('/api/grades');
        if (gradesRes.ok) {
          const gradesData = await gradesRes.json();
          const gradesMap = new Map<number, Grade>();
          gradesData.forEach((g: any) => {
            gradesMap.set(g.grade.courseId, {
              courseId: g.grade.courseId,
              score10: parseFloat(g.grade.score),
              score4: parseFloat(g.grade.scoreScale4),
              letterGrade: g.grade.letterGrade,
            });
          });
          setGrades(gradesMap);
        }
      } catch (e) {
        console.log('[v0] Error fetching grades:', e);
      }

      setCreditSummary({
        mandatoryCreditsRequired: 120,
        electiveCreditsRequired: 12,
        mandatoryCreditsCompleted: 0,
        electiveCreditsCompleted: 0,
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCourse = async (courseId: number, isSelected: boolean) => {
    const newSelected = new Set(selectedCourses);
    if (isSelected) {
      newSelected.add(courseId);
    } else {
      newSelected.delete(courseId);
    }
    setSelectedCourses(newSelected);

    // Save to API
    const headers = { 'Content-Type': 'application/json' };

    if (isSelected) {
      await fetch('/api/exemptions', {
        method: 'POST',
        headers,
        body: JSON.stringify({ courseId }),
      }).catch(e => console.log('[v0] Background save failed:', e));
    } else {
      await fetch('/api/exemptions', {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ courseId }),
      }).catch(e => console.log('[v0] Background save failed:', e));
    }
  };

  const handleGradeInputChange = (courseId: number, value: string) => {
    setGradeInputs(prev => {
      const newInputs = new Map(prev);
      newInputs.set(courseId, value);
      return newInputs;
    });
  };

  const handleGradeBlur = async (courseId: number) => {
    const inputValue = gradeInputs.get(courseId) || '';
    const score10 = parseFloat(inputValue);

    if (isNaN(score10) || score10 < 0 || score10 > 10) {
      console.log('[v0] Invalid score:', score10);
      return;
    }

    const conversion = convertGrade(score10);
    if (!conversion.isValid) {
      console.log('[v0] Invalid conversion:', conversion);
      return;
    }

    console.log('[v0] Grade blur for course', courseId, ':', conversion);

    // Update grades state
    setGrades(prevGrades => {
      const newGrades = new Map(prevGrades);
      newGrades.set(courseId, {
        courseId,
        score10: conversion.score10,
        score4: conversion.score4,
        letterGrade: conversion.letterGrade,
      });
      return newGrades;
    });

    // Save to API
    try {
      const res = await fetch('/api/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, score10 }),
      });
      console.log('[v0] Grade saved:', res.ok);
    } catch (e) {
      console.log('[v0] Background save failed:', e);
    }

    setGradeInputFocused(null);
  };

  const gradesArray = Array.from(grades.values());
  const coursesWithGrades = courses.filter(c => grades.has(c.id));
  const gpaData = calculateGPA(
    coursesWithGrades.map(c => ({
      score10: grades.get(c.id)?.score10 || 0,
      credits: c.credits,
    }))
  );

  console.log('[v0] Current GPA data:', gpaData);

  // Calculate target grades
  const targetData = calculateTargetGrades(
    gradesArray.map(g => ({ score10: g.score10 })),
    courses.length
  );

  const totalRemaining = creditSummary
    ? creditSummary.mandatoryCreditsRequired - creditSummary.mandatoryCreditsCompleted +
      (creditSummary.electiveCreditsRequired - creditSummary.electiveCreditsCompleted)
    : 132;

  // Calculate tuition based on selected courses and their fee types
  let totalCreditsForFee = 0;
  selectedCourses.forEach(courseId => {
    const course = courses.find(c => c.id === courseId);
    if (course) {
      totalCreditsForFee += course.credits;
    }
  });

  // Use selected courses' credits for tuition if available, otherwise estimate
  const creditsForCalculation = totalCreditsForFee > 0 
    ? totalCreditsForFee
    : totalRemaining;

  const totalCost = Math.max(0, creditsForCalculation * CREDIT_PRICE_A - DEDUCTION);

  if (loading) return <div className="flex items-center justify-center p-8">Đang tải...</div>;

  return (
    <div className="flex gap-6 p-6 bg-background min-h-screen">
      {/* Main Content - Courses Table */}
      <div className="flex-1">
        <h1 className="text-3xl font-bold mb-6">Tính Toán Học Phí</h1>

        {/* Courses by Semester */}
        {[1, 2, 3, 4, 5, 6, 7, 8].map(semester => {
          const semesterCourses = courses.filter(c => c.semester === semester);
          if (semesterCourses.length === 0) return null;

          const mandatory = semesterCourses.filter(c => c.isMandatory);
          const elective = semesterCourses.filter(c => !c.isMandatory);

          return (
            <Card key={semester} className="mb-6">
              <CardHeader>
                <CardTitle>Học Kỳ {semester}</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Mandatory Courses */}
                {mandatory.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-sm text-muted-foreground mb-3">
                      Bắt Buộc
                    </h3>
                    <div className="space-y-3">
                      {mandatory.map(course => {
                        const grade = grades.get(course.id);
                        const gradeInput = document.querySelector(
                          `input[data-course-id="${course.id}"]`
                        ) as HTMLInputElement;
                        const displayScore = gradeInput?.value || '';

                        return (
                          <div key={course.id} className="flex items-center gap-3 p-2 bg-muted rounded">
                            <Checkbox
                              checked={selectedCourses.has(course.id)}
                              onCheckedChange={(checked) =>
                                handleToggleCourse(course.id, checked as boolean)
                              }
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium">{course.courseName}</div>
                              <div className="text-xs text-muted-foreground">
                                {course.courseCode} - {course.credits} tín
                              </div>
                            </div>
                            
                            {/* Grade Input */}
                            <input
                              type="number"
                              placeholder="Điểm"
                              min="0"
                              max="10"
                              step="0.1"
                              value={gradeInputs.get(course.id) || (grade?.score10 || '')}
                              onChange={(e) => handleGradeInputChange(course.id, e.target.value)}
                              onBlur={() => handleGradeBlur(course.id)}
                              onFocus={() => setGradeInputFocused(course.id)}
                              className="w-16 px-2 py-1 text-xs border rounded bg-background text-foreground"
                            />

                            {/* Score Display */}
                            {grade && (
                              <div className="text-right text-xs">
                                <div className="font-semibold">{grade.score10.toFixed(1)}</div>
                                <div className="text-muted-foreground">
                                  {grade.letterGrade} ({grade.score4.toFixed(2)})
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Elective Courses */}
                {elective.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-3">
                      Tự Chọn
                    </h3>
                    <div className="space-y-3">
                      {elective.map(course => {
                        const grade = grades.get(course.id);

                        return (
                          <div key={course.id} className="flex items-center gap-3 p-2 bg-muted rounded">
                            <Checkbox
                              checked={selectedCourses.has(course.id)}
                              onCheckedChange={(checked) =>
                                handleToggleCourse(course.id, checked as boolean)
                              }
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium">{course.courseName}</div>
                              <div className="text-xs text-muted-foreground">
                                {course.courseCode} - {course.credits} tín
                              </div>
                            </div>

                            {/* Grade Input */}
                            <input
                              type="number"
                              placeholder="Điểm"
                              min="0"
                              max="10"
                              step="0.1"
                              value={gradeInputs.get(course.id) || (grade?.score10 || '')}
                              onChange={(e) => handleGradeInputChange(course.id, e.target.value)}
                              onBlur={() => handleGradeBlur(course.id)}
                              onFocus={() => setGradeInputFocused(course.id)}
                              className="w-16 px-2 py-1 text-xs border rounded bg-background text-foreground"
                            />

                            {/* Score Display */}
                            {grade && (
                              <div className="text-right text-xs">
                                <div className="font-semibold">{grade.score10.toFixed(1)}</div>
                                <div className="text-muted-foreground">
                                  {grade.letterGrade} ({grade.score4.toFixed(2)})
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Right Sidebar - Summary */}
      <div className="w-80 space-y-6">
        {/* GPA Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">GPA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Thang 10</div>
              <div className="text-3xl font-bold">{gpaData.gpa10.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">{gpaData.letterGrade}</div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-1">Thang 4</div>
              <div className="text-2xl font-semibold">{gpaData.gpa4.toFixed(2)}</div>
            </div>

            <div className="text-xs">
              <div className="text-muted-foreground">{gpaData.totalCourses} môn đã nhập</div>
            </div>
          </CardContent>
        </Card>

        {/* Target Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mục Tiêu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <div className="text-muted-foreground mb-1">Để đạt GPA Giỏi (8.0):</div>
              <div className="font-semibold">
                Cần {targetData.minAForGood} môn A
              </div>
            </div>

            <div>
              <div className="text-muted-foreground mb-1">Để đạt GPA Xuất sắc (8.5):</div>
              <div className="font-semibold">
                Cần {targetData.minAForExcellent} môn A
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tuition Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tóm Tắt Học Phí</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Tổng tín chỉ còn lại:</div>
              <div className="text-2xl font-bold">{totalRemaining}</div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-1">Học phí ban đầu:</div>
              <div className="font-medium">₫{(totalRemaining * CREDIT_PRICE).toLocaleString('vi-VN')}</div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-1">Khấu trừ (Lệ phí):</div>
              <div className="font-medium text-green-600">-₫{DEDUCTION.toLocaleString('vi-VN')}</div>
            </div>

            <div className="border-t pt-3">
              <div className="text-xs text-muted-foreground mb-2">Tổng phải thanh toán:</div>
              <div className="text-3xl font-bold text-primary">
                ₫{totalCost.toLocaleString('vi-VN')}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
