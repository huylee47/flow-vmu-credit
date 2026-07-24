'use client';

import { useState, useEffect } from 'react';
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
  id: number;
  courseId: number;
  feeOld?: number;
  feeTier1?: number;
  feeTier2?: number;
  feeTier3?: number;
}

export function SettingsPanel() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [fees, setFees] = useState<Record<number, CourseFeeConfig>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);

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

      setCourses(Array.isArray(coursesData) ? coursesData : []);

      const feesMap: Record<number, CourseFeeConfig> = {};
      feesData.forEach((fee: CourseFeeConfig) => {
        feesMap[fee.courseId] = fee;
      });
      setFees(feesMap);
    } catch (error) {
      console.error('[v0] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFee = async (courseId: number) => {
    setSaving(courseId);
    const fee = fees[courseId] || {};

    try {
      const res = await fetch('/api/course-fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          feeOld: fee.feeOld ? parseInt(fee.feeOld.toString()) : null,
          feeTier1: fee.feeTier1 ? parseInt(fee.feeTier1.toString()) : null,
          feeTier2: fee.feeTier2 ? parseInt(fee.feeTier2.toString()) : null,
          feeTier3: fee.feeTier3 ? parseInt(fee.feeTier3.toString()) : null,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setFees(prev => ({ ...prev, [courseId]: updated }));
      }
    } catch (error) {
      console.error('[v0] Error saving fee:', error);
    } finally {
      setSaving(null);
    }
  };

  const handleFeeChange = (courseId: number, tier: string, value: string) => {
    const numValue = value ? parseInt(value) : undefined;
    setFees(prev => ({
      ...prev,
      [courseId]: {
        ...prev[courseId],
        [tier]: numValue,
      },
    }));
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Course Fee Management</CardTitle>
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
                  <th className="text-center py-2 px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(course => {
                  const fee = fees[course.id] || {};
                  return (
                    <tr key={course.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-mono text-xs">{course.courseCode}</td>
                      <td className="py-3 px-4">{course.courseName}</td>
                      <td className="py-3 px-4 text-center">{course.credits}</td>
                      <td className="py-3 px-4">
                        <Input
                          type="number"
                          placeholder="0"
                          value={fee.feeOld || ''}
                          onChange={(e) => handleFeeChange(course.id, 'feeOld', e.target.value)}
                          className="w-24 text-right"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <Input
                          type="number"
                          placeholder="0"
                          value={fee.feeTier1 || ''}
                          onChange={(e) => handleFeeChange(course.id, 'feeTier1', e.target.value)}
                          className="w-24 text-right"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <Input
                          type="number"
                          placeholder="0"
                          value={fee.feeTier2 || ''}
                          onChange={(e) => handleFeeChange(course.id, 'feeTier2', e.target.value)}
                          className="w-24 text-right"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <Input
                          type="number"
                          placeholder="0"
                          value={fee.feeTier3 || ''}
                          onChange={(e) => handleFeeChange(course.id, 'feeTier3', e.target.value)}
                          className="w-24 text-right"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          size="sm"
                          onClick={() => handleSaveFee(course.id)}
                          disabled={saving === course.id}
                        >
                          {saving === course.id ? 'Saving...' : 'Save'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
