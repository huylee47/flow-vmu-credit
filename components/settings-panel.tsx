'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Course {
  id: number;
  courseCode: string;
  courseName: string;
  credits: number;
  semester: number;
}

interface CourseFeeConfig {
  id?: number;
  courseId: number;
  feeOld?: number;
  feeTier1?: number;
  feeTier2?: number;
  feeTier3?: number;
}

function CourseRow({ 
  course, 
  initialFee, 
  onChange 
}: { 
  course: Course; 
  initialFee: CourseFeeConfig; 
  onChange: (courseId: number, fee: CourseFeeConfig) => void; 
}) {
  const [fee, setFee] = useState<CourseFeeConfig>(initialFee);

  const handleFeeChange = (tier: keyof CourseFeeConfig, value: string) => {
    const digits = value.replace(/\\D/g, '');
    const numValue = digits ? parseInt(digits, 10) : undefined;
    setFee(prev => {
      const next = { ...prev, [tier]: numValue };
      onChange(course.id, next);
      return next;
    });
  };

  const formatNumber = (num?: number | null) => {
    if (num === undefined || num === null) return '';
    return num.toLocaleString('vi-VN');
  };

  return (
    <tr className="border-b hover:bg-muted/30">
      <td className="py-3 px-4 font-mono text-xs">{course.courseCode}</td>
      <td className="py-3 px-4">{course.courseName}</td>
      <td className="py-3 px-4 text-center">{course.credits}</td>
      <td className="py-3 px-4">
        <Input
          type="text"
          placeholder="755.000"
          value={formatNumber(fee.feeOld)}
          onChange={(e) => handleFeeChange('feeOld', e.target.value)}
          className="w-28 text-right font-mono"
        />
      </td>
      <td className="py-3 px-4">
        <Input
          type="text"
          placeholder="815.000"
          value={formatNumber(fee.feeTier1)}
          onChange={(e) => handleFeeChange('feeTier1', e.target.value)}
          className="w-28 text-right font-mono"
        />
      </td>
      <td className="py-3 px-4">
        <Input
          type="text"
          placeholder="0"
          value={formatNumber(fee.feeTier2)}
          onChange={(e) => handleFeeChange('feeTier2', e.target.value)}
          className="w-28 text-right font-mono"
        />
      </td>
      <td className="py-3 px-4">
        <Input
          type="text"
          placeholder="0"
          value={formatNumber(fee.feeTier3)}
          onChange={(e) => handleFeeChange('feeTier3', e.target.value)}
          className="w-28 text-right font-mono"
        />
      </td>
    </tr>
  );
}

export function SettingsPanel() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [fees, setFees] = useState<Record<number, CourseFeeConfig>>({});
  const [loading, setLoading] = useState(true);
  const feesRef = useRef<Record<number, CourseFeeConfig>>({});
  const [savingAll, setSavingAll] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [coursesRes, feesRes] = await Promise.all([
        fetch('/api/courses'),
        fetch('/api/course-fees'),
      ]);

      const coursesData = await coursesRes.json();
      const feesData = await feesRes.json();

      const coursesArray: Course[] = Array.isArray(coursesData) ? coursesData : [];
      setCourses(coursesArray);

      const feesMap: Record<number, CourseFeeConfig> = {};
      feesData.forEach((fee: CourseFeeConfig) => {
        feesMap[fee.courseId] = fee;
      });

      coursesArray.forEach(c => {
        const existing = feesMap[c.id];
        if (existing) {
          feesRef.current[c.id] = { ...existing };
        } else {
          feesRef.current[c.id] = {
            courseId: c.id,
            feeOld: 755000,
            feeTier1: 815000,
          };
        }
      });

      setFees(feesMap);
    } catch (error) {
      console.error('[v0] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeeChange = useCallback((courseId: number, fee: CourseFeeConfig) => {
    feesRef.current[courseId] = fee;
  }, []);

  const handleSaveAll = async () => {
    setSavingAll(true);
    try {
      const payload = Object.values(feesRef.current).map(fee => ({
        courseId: fee.courseId,
        feeOld: fee.feeOld ? parseInt(fee.feeOld.toString()) : null,
        feeTier1: fee.feeTier1 ? parseInt(fee.feeTier1.toString()) : null,
        feeTier2: fee.feeTier2 ? parseInt(fee.feeTier2.toString()) : null,
        feeTier3: fee.feeTier3 ? parseInt(fee.feeTier3.toString()) : null,
      }));

      const res = await fetch('/api/course-fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert('Đã lưu tất cả thành công!');
      } else {
        alert('Lỗi khi lưu!');
      }
    } catch (error) {
      console.error('[v0] Error saving fees:', error);
      alert('Đã xảy ra lỗi!');
    } finally {
      setSavingAll(false);
    }
  };

  const semesters = Array.from(new Set(courses.map(c => c.semester))).sort((a, b) => a - b);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Course Fee Management</CardTitle>
          <Button onClick={handleSaveAll} disabled={savingAll}>
            {savingAll ? 'Đang lưu...' : 'Lưu Tất Cả'}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2 px-4">Code</th>
                  <th className="text-left py-2 px-4">Course Name</th>
                  <th className="text-center py-2 px-4">Credits</th>
                  <th className="text-right py-2 px-4">Fee Old</th>
                  <th className="text-right py-2 px-4">Tier 1</th>
                  <th className="text-right py-2 px-4">Tier 2</th>
                  <th className="text-right py-2 px-4">Tier 3</th>
                </tr>
              </thead>
              {semesters.map(semester => (
                <tbody key={`sem-${semester}`}>
                  <tr className="bg-muted/50 border-b">
                    <td colSpan={8} className="py-2 px-4 font-semibold text-primary">
                      Học Kỳ {semester}
                    </td>
                  </tr>
                  {courses.filter(c => c.semester === semester).map(course => (
                    <CourseRow 
                      key={course.id} 
                      course={course} 
                      initialFee={feesRef.current[course.id]} 
                      onChange={handleFeeChange} 
                    />
                  ))}
                </tbody>
              ))}
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
