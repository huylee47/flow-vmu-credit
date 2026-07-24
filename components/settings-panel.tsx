'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';

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
        toast.success('Đã lưu tất cả thành công!');
      } else {
        toast.error('Lỗi khi lưu!');
      }
    } catch (error) {
      console.error('[v0] Error saving fees:', error);
      toast.error('Đã xảy ra lỗi!');
    } finally {
      setSavingAll(false);
    }
  };

  const semesters = Array.from(new Set(courses.map(c => c.semester))).sort((a, b) => a - b);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-4">
        <div className="h-8 w-64 bg-muted animate-pulse rounded-md"></div>
        <Card>
          <CardHeader>
            <div className="h-6 w-48 bg-muted animate-pulse rounded-md"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 w-full bg-muted animate-pulse rounded-md"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Quản lý học phí môn học</CardTitle>
          <Button 
            onClick={handleSaveAll} 
            disabled={savingAll}
            className="group relative overflow-hidden bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            {savingAll ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                Lưu Tất Cả
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2 px-4">Mã Học phần</th>
                  <th className="text-left py-2 px-4">Tên học phần</th>
                  <th className="text-center py-2 px-4">Tín chỉ</th>
                  <th className="text-left py-2 px-4">H/P ban đầu</th>
                  <th className="text-left py-2 px-4">H/P tăng lần 1</th>
                  <th className="text-left py-2 px-4">H/P tăng lần 2</th>
                  <th className="text-left py-2 px-4">H/P tăng lần 3</th>
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
