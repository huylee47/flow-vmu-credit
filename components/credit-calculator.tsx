'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface Course {
  id: number;
  courseCode: string;
  courseName: string;
  credits: number;
  semester: number;
  isMandatory: boolean;
  prerequisite: string;
}

interface CreditSummary {
  mandatoryCreditsRequired: number;
  electiveCreditsRequired: number;
  mandatoryCreditsCompleted: number;
  electiveCreditsCompleted: number;
}

const CREDIT_PRICE = 750000; // VND per credit
const DEDUCTION = 10200000; // VND - Lệ phí thu trước

export function CreditCalculator() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<Set<number>>(new Set());
  const [creditSummary, setCreditSummary] = useState<CreditSummary | null>(null);

  useEffect(() => {
    const initUser = async () => {
      // Try to get existing user ID from localStorage
      let localUserId = localStorage.getItem('demo_user_id');
      
      if (!localUserId) {
        // Create a demo user ID
        localUserId = `demo_${Date.now()}`;
        localStorage.setItem('demo_user_id', localUserId);
      }
      
      setUserId(localUserId);
      await loadData(localUserId);
    };
    initUser();
  }, []);

  // Calculate credits whenever courses or selectedCourses change
  useEffect(() => {
    if (courses.length > 0 && selectedCourses.size > 0) {
      let mandatoryCompleted = 0;
      let electiveCompleted = 0;
      
      selectedCourses.forEach(selectedId => {
        const course = courses.find(c => c.id === selectedId);
        if (course) {
          if (course.isMandatory) {
            mandatoryCompleted += course.credits;
          } else {
            electiveCompleted += course.credits;
          }
        }
      });

      setCreditSummary({
        mandatoryCreditsRequired: 120,
        electiveCreditsRequired: 12,
        mandatoryCreditsCompleted: Math.min(mandatoryCompleted, 120),
        electiveCreditsCompleted: Math.min(electiveCompleted, 12),
      });
    }
  }, [courses, selectedCourses]);

  const loadData = async (currentUserId?: string) => {
    try {
      const headers: any = { 'Content-Type': 'application/json' };
      const userIdToUse = currentUserId || userId;
      if (userIdToUse) {
        headers['x-demo-user-id'] = userIdToUse;
      }

      // Fetch courses
      const coursesRes = await fetch('/api/courses');
      const coursesData = await coursesRes.json();
      const coursesArray = Array.isArray(coursesData) ? coursesData : [];
      setCourses(coursesArray);

      // Load selected courses from localStorage first
      const savedSelectedStr = localStorage.getItem(`selected_courses_${userIdToUse}`);
      let selectedFromLocal = new Set<number>();
      if (savedSelectedStr) {
        try {
          const selectedArray = JSON.parse(savedSelectedStr);
          selectedFromLocal = new Set(selectedArray);
        } catch (e) {
          console.log('[v0] Error parsing saved selections:', e);
        }
      }
      setSelectedCourses(selectedFromLocal);

      // Calculate credits right away after loading courses and selections
      if (coursesArray.length > 0 && selectedFromLocal.size > 0) {
        let mandatoryCompleted = 0;
        let electiveCompleted = 0;
        
        selectedFromLocal.forEach(selectedId => {
          const course = coursesArray.find(c => c.id === selectedId);
          if (course) {
            if (course.isMandatory) {
              mandatoryCompleted += course.credits;
            } else {
              electiveCompleted += course.credits;
            }
          }
        });

        setCreditSummary({
          mandatoryCreditsRequired: 120,
          electiveCreditsRequired: 12,
          mandatoryCreditsCompleted: Math.min(mandatoryCompleted, 120),
          electiveCreditsCompleted: Math.min(electiveCompleted, 12),
        });
      } else {
        // Set default credit summary
        setCreditSummary({
          mandatoryCreditsRequired: 120,
          electiveCreditsRequired: 12,
          mandatoryCreditsCompleted: 0,
          electiveCreditsCompleted: 0,
        });
      }

      // Try to fetch user exemptions from API as backup
      const exemptionsRes = await fetch('/api/exemptions', { headers });
      if (exemptionsRes.ok) {
        const exemptionsData = await exemptionsRes.json();
        if (exemptionsData.length > 0) {
          const exemptedIds = new Set(exemptionsData.map((e: any) => e.course.id));
          setSelectedCourses(exemptedIds);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCourse = async (courseId: number, isSelected: boolean) => {
    try {
      // Update selected courses immediately for instant UI feedback
      const newSelected = new Set(selectedCourses);
      if (isSelected) {
        newSelected.add(courseId);
      } else {
        newSelected.delete(courseId);
      }
      setSelectedCourses(newSelected);

      // Save to localStorage immediately
      const selectedArray = Array.from(newSelected);
      localStorage.setItem(`selected_courses_${userId}`, JSON.stringify(selectedArray));

      // Calculate credits locally
      let mandatoryCompleted = 0;
      let electiveCompleted = 0;
      
      newSelected.forEach(selectedId => {
        const course = courses.find(c => c.id === selectedId);
        if (course) {
          if (course.isMandatory) {
            mandatoryCompleted += course.credits;
          } else {
            electiveCompleted += course.credits;
          }
        }
      });

      // Update summary with calculated values
      setCreditSummary({
        ...creditSummary,
        mandatoryCreditsCompleted: Math.min(mandatoryCompleted, 120),
        electiveCreditsCompleted: Math.min(electiveCompleted, 12),
      });

      // Save to API in background
      const headers: any = {
        'Content-Type': 'application/json',
      };
      if (userId) {
        headers['x-demo-user-id'] = userId;
      }

      if (isSelected) {
        // Add exemption
        await fetch('/api/exemptions', {
          method: 'POST',
          headers,
          body: JSON.stringify({ courseId }),
        }).catch(e => console.log('[v0] Background save failed:', e));
      } else {
        // Remove exemption
        await fetch('/api/exemptions', {
          method: 'DELETE',
          headers,
          body: JSON.stringify({ courseId }),
        }).catch(e => console.log('[v0] Background save failed:', e));
      }
    } catch (error) {
      console.error('Error toggling course:', error);
    }
  };

  if (loading || !creditSummary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Group courses by semester
  const coursesBySemester = courses.reduce((acc: { [key: number]: Course[] }, course) => {
    if (!acc[course.semester]) acc[course.semester] = [];
    acc[course.semester].push(course);
    return acc;
  }, {});

  // Calculate remaining credits
  const mandatoryRemaining = Math.max(
    0,
    creditSummary.mandatoryCreditsRequired - creditSummary.mandatoryCreditsCompleted
  );
  const electiveRemaining = Math.max(
    0,
    creditSummary.electiveCreditsRequired - creditSummary.electiveCreditsCompleted
  );
  const totalRemaining = mandatoryRemaining + electiveRemaining;
  const totalCost = Math.max(0, totalRemaining * CREDIT_PRICE - DEDUCTION);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Tính Toán Học Phí</h1>
          <p className="text-sm text-muted-foreground">Demo Mode - User ID: {userId?.substring(0, 12)}</p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main content - Courses */}
          <div className="lg:col-span-3 space-y-6">
            {Array.from({ length: 8 }).map((_, semesterIdx) => {
              const semester = semesterIdx + 1;
              const semesterCourses = coursesBySemester[semester] || [];
              const mandatoryCourses = semesterCourses.filter(c => c.isMandatory);
              const electiveCourses = semesterCourses.filter(c => !c.isMandatory);

              return (
                <Card key={semester}>
                  <CardHeader>
                    <CardTitle>Học Kỳ {semester}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Mandatory courses */}
                    {mandatoryCourses.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-sm mb-3 text-foreground">Bắt Buộc ({mandatoryCourses.length} môn)</h3>
                        <div className="space-y-2">
                          {mandatoryCourses.map(course => (
                            <div
                              key={course.id}
                              className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                            >
                              <Checkbox
                                id={`course-${course.id}`}
                                checked={selectedCourses.has(course.id)}
                                onCheckedChange={(checked) => handleToggleCourse(course.id, checked as boolean)}
                              />
                              <label
                                htmlFor={`course-${course.id}`}
                                className="flex-1 cursor-pointer"
                              >
                                <div className="font-medium text-sm">
                                  {course.courseName}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Mã: {course.courseCode} • {course.credits} tín chỉ
                                </div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Elective courses */}
                    {electiveCourses.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-sm mb-3 text-foreground">Tự Chọn ({electiveCourses.length} môn)</h3>
                        <div className="space-y-2">
                          {electiveCourses.map(course => (
                            <div
                              key={course.id}
                              className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                            >
                              <Checkbox
                                id={`course-${course.id}`}
                                checked={selectedCourses.has(course.id)}
                                onCheckedChange={(checked) => handleToggleCourse(course.id, checked as boolean)}
                              />
                              <label
                                htmlFor={`course-${course.id}`}
                                className="flex-1 cursor-pointer"
                              >
                                <div className="font-medium text-sm">
                                  {course.courseName}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Mã: {course.courseCode} • {course.credits} tín chỉ
                                </div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Sidebar - Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Tóm Tắt Học Phí</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Mandatory credits */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Bắt Buộc:</span>
                    <span className="font-medium">
                      {creditSummary.mandatoryCreditsCompleted}/{creditSummary.mandatoryCreditsRequired}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{
                        width: `${(creditSummary.mandatoryCreditsCompleted / creditSummary.mandatoryCreditsRequired) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Còn lại: {mandatoryRemaining} tín
                  </div>
                </div>

                {/* Elective credits */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tự Chọn:</span>
                    <span className="font-medium">
                      {creditSummary.electiveCreditsCompleted}/{creditSummary.electiveCreditsRequired}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{
                        width: `${(creditSummary.electiveCreditsCompleted / creditSummary.electiveCreditsRequired) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Còn lại: {electiveRemaining} tín
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="text-sm">
                    <div className="text-muted-foreground mb-1">Tổng tín chỉ còn lại:</div>
                    <div className="text-2xl font-bold text-primary">{totalRemaining}</div>
                  </div>

                  <div className="text-sm">
                    <div className="text-muted-foreground mb-1">Giá/tín:</div>
                    <div className="text-sm font-medium">
                      ₫{CREDIT_PRICE.toLocaleString('vi-VN')}
                    </div>
                  </div>

                  <div className="border-t pt-3 space-y-2">
                    <div className="text-sm">
                      <div className="text-xs text-muted-foreground">Học phí ban đầu:</div>
                      <div className="font-medium">
                        ₫{(totalRemaining * CREDIT_PRICE).toLocaleString('vi-VN')}
                      </div>
                    </div>
                    <div className="text-sm">
                      <div className="text-xs text-muted-foreground">Khấu trừ (Lệ phí):</div>
                      <div className="font-medium text-green-600">
                        -₫{DEDUCTION.toLocaleString('vi-VN')}
                      </div>
                    </div>
                    <div className="border-t pt-2">
                      <div className="text-xs text-muted-foreground mb-1">Tổng phải thanh toán:</div>
                      <div className="text-3xl font-bold text-primary">
                        ₫{totalCost.toLocaleString('vi-VN')}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 text-xs text-muted-foreground text-center">
                  Tick chọn các môn đã hoàn thành để giảm học phí
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
