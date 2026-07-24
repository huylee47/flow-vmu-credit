"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  convertGrade,
  calculateGPA,
  calculateTargetGrades,
  GPA_LEVELS,
} from "@/lib/grade-utils";

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

// Get highest priority fee for a course (Tier 3 > Tier 2 > Tier 1 > Fee Old > Default)
const getHighestFeeForCourse = (
  fees: CourseFee[],
  courseId: number,
): number => {
  const courseFee = fees.find((f) => f.courseId === courseId);
  if (!courseFee) return DEFAULT_FEE_OLD;

  if (courseFee.feeTier3 != null) return courseFee.feeTier3;
  if (courseFee.feeTier2 != null) return courseFee.feeTier2;
  if (courseFee.feeTier1 != null) return courseFee.feeTier1;
  if (courseFee.feeOld != null) return courseFee.feeOld;

  return DEFAULT_FEE_OLD;
};

export function CreditCalculatorV2() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<Set<number>>(
    new Set(),
  );
  const [grades, setGrades] = useState<Map<number, Grade>>(new Map());
  const [gradeInputs, setGradeInputs] = useState<Map<number, string>>(
    new Map(),
  );
  const [creditSummary, setCreditSummary] = useState<CreditSummary | null>(
    null,
  );
  const [gradeInputFocused, setGradeInputFocused] = useState<number | null>(
    null,
  );
  const [courseFees, setCourseFees] = useState<CourseFee[]>([]);
  const [feeTiers, setFeeTiers] = useState<
    Record<number, "old" | "1" | "2" | "3">
  >({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Fetch courses
      try {
        const coursesRes = await fetch("/api/courses");
        const coursesData = await coursesRes.json();
        const coursesArray = Array.isArray(coursesData) ? coursesData : [];
        setCourses(coursesArray);
      } catch (e) {
        console.log("[v0] Error fetching courses:", e);
      }

      // Fetch selected courses from database
      try {
        const exemptionsRes = await fetch("/api/exemptions");
        if (exemptionsRes.ok) {
          const exemptionsData = await exemptionsRes.json();
          const selectedIds = new Set<number>(
            exemptionsData.map((e: any) => Number(e.course.id)),
          );
          setSelectedCourses(selectedIds);
        }
      } catch (e) {
        console.log("[v0] Error fetching exemptions:", e);
      }

      // Fetch course fees
      try {
        const feesRes = await fetch("/api/course-fees");
        if (feesRes.ok) {
          const feesData = await feesRes.json();
          setCourseFees(Array.isArray(feesData) ? feesData : []);
        }
      } catch (e) {
        console.log("[v0] Error fetching course fees:", e);
      }

      // Fetch grades
      try {
        const gradesRes = await fetch("/api/grades");
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
        console.log("[v0] Error fetching grades:", e);
      }

      setCreditSummary({
        mandatoryCreditsRequired: 120,
        electiveCreditsRequired: 12,
        mandatoryCreditsCompleted: 0,
        electiveCreditsCompleted: 0,
      });
    } catch (error) {
      console.error("Error loading data:", error);
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
    const headers = { "Content-Type": "application/json" };

    if (isSelected) {
      await fetch("/api/exemptions", {
        method: "POST",
        headers,
        body: JSON.stringify({ courseId }),
      }).catch((e) => console.log("[v0] Background save failed:", e));
    } else {
      await fetch("/api/exemptions", {
        method: "DELETE",
        headers,
        body: JSON.stringify({ courseId }),
      }).catch((e) => console.log("[v0] Background save failed:", e));
    }
  };

  const handleGradeInputChange = (courseId: number, value: string) => {
    setGradeInputs((prev) => {
      const newInputs = new Map(prev);
      newInputs.set(courseId, value);
      return newInputs;
    });
  };

  const handleGradeBlur = async (courseId: number) => {
    const inputValue = gradeInputs.get(courseId) || "";
    const score10 = parseFloat(inputValue);

    if (isNaN(score10) || score10 < 0 || score10 > 10) {
      console.log("[v0] Invalid score:", score10);
      return;
    }

    const conversion = convertGrade(score10);
    if (!conversion.isValid) {
      console.log("[v0] Invalid conversion:", conversion);
      return;
    }

    console.log("[v0] Grade blur for course", courseId, ":", conversion);

    // Update grades state
    setGrades((prevGrades) => {
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
      const res = await fetch("/api/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, score10 }),
      });
      console.log("[v0] Grade saved:", res.ok);
    } catch (e) {
      console.log("[v0] Background save failed:", e);
    }

    setGradeInputFocused(null);
  };

  const gradesArray = Array.from(grades.values());
  const coursesWithGrades = courses.filter((c) => grades.has(c.id));
  const gpaData = calculateGPA(
    coursesWithGrades.map((c) => ({
      score10: grades.get(c.id)?.score10 || 0,
      credits: c.credits,
    })),
  );

  console.log("[v0] Current GPA data:", gpaData);

  // Calculate target grades
  const totalRequiredCredits =
    (creditSummary?.mandatoryCreditsRequired || 120) +
    (creditSummary?.electiveCreditsRequired || 12);
  const targetData = calculateTargetGrades(
    gradesArray.map((g) => {
      const course = courses.find((c) => c.id === g.courseId);
      return { score4: g.score4, credits: course ? course.credits : 0 };
    }),
    totalRequiredCredits,
  );

  const completedMandatoryCredits = Array.from(selectedCourses)
    .map((id) => courses.find((c) => c.id === id))
    .filter((c) => c && c.isMandatory)
    .reduce((sum, c) => sum + (c ? c.credits : 0), 0);

  const completedElectiveCredits = Array.from(selectedCourses)
    .map((id) => courses.find((c) => c.id === id))
    .filter((c) => c && !c.isMandatory)
    .reduce((sum, c) => sum + (c ? c.credits : 0), 0);

  const mandatoryRemaining = Math.max(
    0,
    (creditSummary?.mandatoryCreditsRequired || 120) -
      completedMandatoryCredits,
  );
  const electiveRemaining = Math.max(
    0,
    (creditSummary?.electiveCreditsRequired || 12) - completedElectiveCredits,
  );

  const uncompletedMandatoryCoursesCount = courses.filter(
    (c) => c.isMandatory && !selectedCourses.has(c.id),
  ).length;
  const suggestedElectiveCoursesCount = Math.ceil(electiveRemaining / 3);

  const totalRemaining = mandatoryRemaining + electiveRemaining;
  const totalRemainingCourses =
    uncompletedMandatoryCoursesCount + suggestedElectiveCoursesCount;
  const avgCreditsPerCourse =
    totalRemainingCourses > 0 ? totalRemaining / totalRemainingCourses : 3;

  const minCoursesAGood = Math.ceil(
    targetData.minAForGood / avgCreditsPerCourse,
  );
  const minCoursesAExcellent = Math.ceil(
    targetData.minAForExcellent / avgCreditsPerCourse,
  );

  // Calculate tuition based on specific course fees for remaining mandatory courses
  let uncompletedMandatoryFee = 0;
  courses.forEach((c) => {
    if (c.isMandatory && !selectedCourses.has(c.id)) {
      const feePerCredit = getHighestFeeForCourse(courseFees, c.id);
      uncompletedMandatoryFee += feePerCredit * c.credits;
    }
  });

  // Estimate elective fee using default fee
  const uncompletedElectiveFee = electiveRemaining * DEFAULT_FEE_OLD;

  const totalBaseFee = uncompletedMandatoryFee + uncompletedElectiveFee;
  const totalCost = Math.max(0, totalBaseFee - DEDUCTION);

  if (loading)
    return (
      <div className="flex items-center justify-center p-8">Đang tải...</div>
    );

  return (
    <div className="grid grid-cols-12 gap-6 p-6 bg-background min-h-screen">
      {/* Main Content - Courses Table */}
      <div className="col-span-12 lg:col-span-8">
        {/* Courses by Semester */}
        {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => {
          const semesterCourses = courses.filter(
            (c) => c.semester === semester,
          );
          if (semesterCourses.length === 0) return null;

          const mandatory = semesterCourses.filter((c) => c.isMandatory);
          const elective = semesterCourses.filter((c) => !c.isMandatory);

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
                      {mandatory.map((course) => {
                        const grade = grades.get(course.id);
                        const gradeInput = document.querySelector(
                          `input[data-course-id="${course.id}"]`,
                        ) as HTMLInputElement;
                        const displayScore = gradeInput?.value || "";
                        
                        const feePerCredit = getHighestFeeForCourse(courseFees, course.id);
                        const courseTotalFee = feePerCredit * course.credits;

                        return (
                          <div
                            key={course.id}
                            className="flex items-center gap-3 p-2 bg-muted rounded"
                          >
                            <Checkbox
                              checked={selectedCourses.has(course.id)}
                              onCheckedChange={(checked) =>
                                handleToggleCourse(
                                  course.id,
                                  checked as boolean,
                                )
                              }
                            />
                            <div className="flex-1">
                              <div className="text-base font-medium">
                                {course.courseName}
                              </div>
                              <div className="text-sm text-muted-foreground mt-0.5 flex flex-wrap gap-2">
                                <span>{course.courseCode} - {course.credits} tín</span>
                                <span>•</span>
                                <span className={selectedCourses.has(course.id) ? "line-through opacity-70" : "font-bold text-emerald-600 dark:text-emerald-500"}>
                                  {feePerCredit.toLocaleString("vi-VN")}đ x {course.credits} = {courseTotalFee.toLocaleString("vi-VN")}đ
                                </span>
                              </div>
                            </div>

                            {/* Score Display */}
                            <div className="w-[140px] text-right">
                              {grade && (
                                <div className="flex items-center justify-end gap-2">
                                  <span className="font-bold text-lg text-primary">
                                    {grade.score10.toFixed(1)}
                                  </span>
                                  <span className="text-base font-medium text-muted-foreground">
                                    {grade.letterGrade} (
                                    {grade.score4.toFixed(2)})
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Grade Input */}
                            <input
                              type="number"
                              placeholder="Điểm"
                              min="0"
                              max="10"
                              step="0.1"
                              value={
                                gradeInputs.get(course.id) ||
                                grade?.score10 ||
                                ""
                              }
                              onChange={(e) =>
                                handleGradeInputChange(
                                  course.id,
                                  e.target.value,
                                )
                              }
                              onBlur={() => handleGradeBlur(course.id)}
                              onFocus={() => setGradeInputFocused(course.id)}
                              className="w-20 px-3 py-1.5 text-sm font-medium border rounded bg-background text-foreground"
                            />
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
                      {elective.map((course) => {
                        const grade = grades.get(course.id);
                        
                        const feePerCredit = getHighestFeeForCourse(courseFees, course.id);
                        const courseTotalFee = feePerCredit * course.credits;

                        return (
                          <div
                            key={course.id}
                            className="flex items-center gap-3 p-2 bg-muted rounded"
                          >
                            <Checkbox
                              checked={selectedCourses.has(course.id)}
                              onCheckedChange={(checked) =>
                                handleToggleCourse(
                                  course.id,
                                  checked as boolean,
                                )
                              }
                            />
                            <div className="flex-1">
                              <div className="text-base font-medium">
                                {course.courseName}
                              </div>
                              <div className="text-sm text-muted-foreground mt-0.5 flex flex-wrap gap-2">
                                <span>{course.courseCode} - {course.credits} tín</span>
                                <span>•</span>
                                <span className={selectedCourses.has(course.id) ? "line-through opacity-70" : "font-bold text-emerald-600 dark:text-emerald-500"}>
                                  {feePerCredit.toLocaleString("vi-VN")}đ x {course.credits} = {courseTotalFee.toLocaleString("vi-VN")}đ
                                </span>
                              </div>
                            </div>

                            {/* Score Display */}
                            <div className="w-[140px] text-right">
                              {grade && (
                                <div className="flex items-center justify-end gap-2">
                                  <span className="font-bold text-lg text-primary">
                                    {grade.score10.toFixed(1)}
                                  </span>
                                  <span className="text-base font-medium text-muted-foreground">
                                    {grade.letterGrade} (
                                    {grade.score4.toFixed(2)})
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Grade Input */}
                            <input
                              type="number"
                              placeholder="Điểm"
                              min="0"
                              max="10"
                              step="0.1"
                              value={
                                gradeInputs.get(course.id) ||
                                grade?.score10 ||
                                ""
                              }
                              onChange={(e) =>
                                handleGradeInputChange(
                                  course.id,
                                  e.target.value,
                                )
                              }
                              onBlur={() => handleGradeBlur(course.id)}
                              onFocus={() => setGradeInputFocused(course.id)}
                              className="w-20 px-3 py-1.5 text-sm font-medium border rounded bg-background text-foreground"
                            />
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
      <div className="col-span-12 lg:col-span-4 space-y-6 sticky top-6 h-fit">
        {/* GPA & Target Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">GPA & Mục Tiêu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  Thang 10
                </div>
                <div className="text-3xl font-bold">
                  {gpaData.gpa10.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {gpaData.letterGrade}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground mb-1">
                  Thang 4
                </div>
                <div className="text-2xl font-semibold">
                  {gpaData.gpa4.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {gpaData.totalCourses} môn đã nhập
                </div>
              </div>
            </div>

            <div className="border-t pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Để đạt Giỏi (3.2):
                </span>
                <span className="font-semibold text-right">
                  Cần ~{minCoursesAGood} học phần A
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Để đạt Xuất sắc (3.6):
                </span>
                <span className="font-semibold text-right">
                  Cần ~{minCoursesAExcellent} học phần A
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tiến Độ Học Tập</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">
                  Bắt buộc ({creditSummary?.mandatoryCreditsRequired || 120}{" "}
                  tín)
                </span>
                <span className="font-medium">
                  {completedMandatoryCredits} /{" "}
                  {creditSummary?.mandatoryCreditsRequired || 120}
                </span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{
                    width: `${Math.min(100, (completedMandatoryCredits / (creditSummary?.mandatoryCreditsRequired || 120)) * 100)}%`,
                  }}
                />
              </div>
              {mandatoryRemaining > 0 && (
                <div className="text-xs text-muted-foreground mt-2">
                  Còn phải học:{" "}
                  <span className="font-medium text-foreground">
                    {uncompletedMandatoryCoursesCount} môn
                  </span>
                </div>
              )}
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">
                  Tự chọn ({creditSummary?.electiveCreditsRequired || 12} tín)
                </span>
                <span className="font-medium">
                  {completedElectiveCredits} /{" "}
                  {creditSummary?.electiveCreditsRequired || 12}
                </span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{
                    width: `${Math.min(100, (completedElectiveCredits / (creditSummary?.electiveCreditsRequired || 12)) * 100)}%`,
                  }}
                />
              </div>
              {electiveRemaining > 0 && (
                <div className="text-xs text-muted-foreground mt-2">
                  Gợi ý: Cần thêm{" "}
                  <span className="font-medium text-foreground">
                    {electiveRemaining} tín
                  </span>{" "}
                  (tương đương ~{suggestedElectiveCoursesCount} môn loại 3 tín)
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tuition Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tóm Tắt Học Phí (Có thay đổi)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-sm text-muted-foreground">
                Tổng tín chỉ còn lại:
              </span>
              <span className="text-xl font-bold">{totalRemaining}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Học phí dự kiến:
              </span>
              <span className="font-medium">
                ~ {totalBaseFee.toLocaleString("vi-VN")}đ
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Khấu trừ (Lệ phí):
              </span>
              <span className="font-medium text-green-600">
                -{DEDUCTION.toLocaleString("vi-VN")}đ
              </span>
            </div>

            <div className="border-t pt-3 flex justify-between items-end">
              <span className="text-sm text-muted-foreground font-medium">
                Phải thanh toán dự kiến:
              </span>
              <span className="text-2xl font-bold text-primary">
               ~ {totalCost.toLocaleString("vi-VN")}đ
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
