import { getDb } from '@/lib/db';
import { courses } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

// K66 Computer Science curriculum - Chính thức
const DEMO_COURSES = [
  // Semester 1 - Bắt buộc: 13 TC
  { id: 1, courseCode: '18141', courseName: 'Đại số', credits: 3, semester: 1, isMandatory: true, prerequisite: '' },
  { id: 2, courseCode: '17200', courseName: 'Giới thiệu ngành CN thông tin', credits: 2, semester: 1, isMandatory: true, prerequisite: '' },
  { id: 3, courseCode: '17232', courseName: 'Toán rời rạc', credits: 3, semester: 1, isMandatory: true, prerequisite: '' },
  { id: 4, courseCode: '11401', courseName: 'Pháp luật đại cương', credits: 2, semester: 1, isMandatory: true, prerequisite: '' },
  { id: 5, courseCode: '17302', courseName: 'Kiến trúc máy tính và thiết bị NV', credits: 3, semester: 1, isMandatory: true, prerequisite: '' },
  // Semester 1 - Tự chọn
  { id: 6, courseCode: '17102', courseName: 'Tin học văn phòng', credits: 3, semester: 1, isMandatory: false, prerequisite: '' },
  { id: 7, courseCode: '25121', courseName: 'Anh văn cơ bản 1', credits: 3, semester: 1, isMandatory: false, prerequisite: '' },
  { id: 8, courseCode: '29101', courseName: 'Kỹ năng mềm 1', credits: 2, semester: 1, isMandatory: false, prerequisite: '' },
  
  // Semester 2 - Bắt buộc: 17 TC
  { id: 9, courseCode: '19101', courseName: 'Triết học Mác Lênin', credits: 3, semester: 2, isMandatory: true, prerequisite: '' },
  { id: 10, courseCode: '18142', courseName: 'Giải tích', credits: 3, semester: 2, isMandatory: true, prerequisite: '' },
  { id: 11, courseCode: '17206', courseName: 'Kỹ thuật lập trình C', credits: 3, semester: 2, isMandatory: true, prerequisite: '' },
  { id: 12, courseCode: '17426', courseName: 'Cơ sở dữ liệu', credits: 3, semester: 2, isMandatory: true, prerequisite: '' },
  { id: 13, courseCode: '17506', courseName: 'Mạng máy tính', credits: 3, semester: 2, isMandatory: true, prerequisite: '' },
  { id: 14, courseCode: '17432', courseName: 'Nhập môn công nghệ phần mềm', credits: 2, semester: 2, isMandatory: true, prerequisite: '' },
  // Semester 2 - Tự chọn
  { id: 15, courseCode: '25122', courseName: 'Anh văn cơ bản 2', credits: 3, semester: 2, isMandatory: false, prerequisite: '' },
  { id: 16, courseCode: '17303', courseName: 'Nguyên lý hệ điều hành', credits: 2, semester: 2, isMandatory: false, prerequisite: '' },
  
  // Semester 3 - Bắt buộc: 17 TC
  { id: 17, courseCode: '19401', courseName: 'Kinh tế chính trị Mác-Lênin', credits: 2, semester: 3, isMandatory: true, prerequisite: '19101' },
  { id: 18, courseCode: '18143', courseName: 'Xác suất thống kê', credits: 3, semester: 3, isMandatory: true, prerequisite: '' },
  { id: 19, courseCode: '17233', courseName: 'Cấu trúc dữ liệu và giải thuật', credits: 3, semester: 3, isMandatory: true, prerequisite: '17206' },
  { id: 20, courseCode: '17335', courseName: 'Lập trình Windows', credits: 3, semester: 3, isMandatory: true, prerequisite: '' },
  { id: 21, courseCode: '17236', courseName: 'Lập trình hướng đối tượng', credits: 3, semester: 3, isMandatory: true, prerequisite: '17206' },
  { id: 22, courseCode: '17523', courseName: 'Java cơ bản', credits: 3, semester: 3, isMandatory: true, prerequisite: '' },
  // Semester 3 - Tự chọn
  { id: 23, courseCode: '17105', courseName: 'Lập trình Python', credits: 3, semester: 3, isMandatory: false, prerequisite: '' },
  { id: 24, courseCode: '17106', courseName: 'Python nâng cao', credits: 3, semester: 3, isMandatory: false, prerequisite: '' },
  
  // Semester 4 - Bắt buộc: 18 TC
  { id: 25, courseCode: '19501', courseName: 'Chủ nghĩa xã hội khoa học', credits: 2, semester: 4, isMandatory: true, prerequisite: '19401' },
  { id: 26, courseCode: '17212', courseName: 'An toàn và bảo mật thông tin', credits: 3, semester: 4, isMandatory: true, prerequisite: '17233' },
  { id: 27, courseCode: '17430', courseName: 'PT&TK hệ thống hướng đối tượng', credits: 3, semester: 4, isMandatory: true, prerequisite: '17426' },
  { id: 28, courseCode: '17209', courseName: 'Lý thuyết đồ thị', credits: 3, semester: 4, isMandatory: true, prerequisite: '17233' },
  { id: 29, courseCode: '17301', courseName: 'Kỹ thuật Vi xử lý', credits: 3, semester: 4, isMandatory: true, prerequisite: '' },
  { id: 30, courseCode: '25105', courseName: 'Anh Văn cơ bản 3', credits: 4, semester: 4, isMandatory: true, prerequisite: '' },
  // Semester 4 - Tự chọn
  { id: 31, courseCode: '17414', courseName: 'Quản lý dự án Công nghệ thông tin', credits: 3, semester: 4, isMandatory: false, prerequisite: '' },
  { id: 32, courseCode: '17507', courseName: 'Lập trình mạng', credits: 3, semester: 4, isMandatory: false, prerequisite: '' },
  
  // Semester 5 - Bắt buộc: 17 TC
  { id: 33, courseCode: '19201', courseName: 'Tư tưởng Hồ Chí Minh', credits: 2, semester: 5, isMandatory: true, prerequisite: '19501' },
  { id: 34, courseCode: '17434', courseName: 'PT ứng dụng với cơ sở dữ liệu', credits: 3, semester: 5, isMandatory: true, prerequisite: '17426' },
  { id: 35, courseCode: '17423', courseName: 'Lập trình thiết bị di động', credits: 3, semester: 5, isMandatory: true, prerequisite: '17206;17523' },
  { id: 36, courseCode: '17340', courseName: 'Phát triển ứng dụng trên nền Web', credits: 4, semester: 5, isMandatory: true, prerequisite: '' },
  { id: 37, courseCode: '17234', courseName: 'Trí tuệ nhân tạo', credits: 3, semester: 5, isMandatory: true, prerequisite: '17233' },
  { id: 38, courseCode: '17290', courseName: 'Thực tập CN Công nghệ thông tin', credits: 2, semester: 5, isMandatory: true, prerequisite: '17426;17206' },
  // Semester 5 - Tự chọn
  { id: 39, courseCode: '17439', courseName: 'Phương pháp triển khai-DevOps', credits: 3, semester: 5, isMandatory: false, prerequisite: '' },
  { id: 40, courseCode: '17428', courseName: 'BDDL dạng bán CT và ứng dụng', credits: 3, semester: 5, isMandatory: false, prerequisite: '' },
  
  // Semester 6 - Bắt buộc: 14 TC
  { id: 41, courseCode: '19303', courseName: 'Lịch sử Đảng Cộng sản VN', credits: 2, semester: 6, isMandatory: true, prerequisite: '19201' },
  { id: 42, courseCode: '17337', courseName: 'Hệ thống nhúng', credits: 3, semester: 6, isMandatory: true, prerequisite: '' },
  { id: 43, courseCode: '17221', courseName: 'Xử lý ảnh', credits: 3, semester: 6, isMandatory: true, prerequisite: '' },
  { id: 44, courseCode: '17543', courseName: 'Thương mại điện tử', credits: 3, semester: 6, isMandatory: true, prerequisite: '' },
  { id: 45, courseCode: '17314', courseName: 'Phát triển ứng dụng mã nguồn mở', credits: 3, semester: 6, isMandatory: true, prerequisite: '' },
  // Semester 6 - Tự chọn
  { id: 46, courseCode: '17333', courseName: 'Robot và các hệ thống thông minh', credits: 3, semester: 6, isMandatory: false, prerequisite: '' },
  { id: 47, courseCode: '17509', courseName: 'Thiết kế và quản trị mạng', credits: 3, semester: 6, isMandatory: false, prerequisite: '' },
  { id: 48, courseCode: '17429', courseName: 'Kiểm thử và đảm bảo CL phần mềm', credits: 3, semester: 6, isMandatory: false, prerequisite: '' },
  { id: 49, courseCode: '28299', courseName: 'Khởi nghiệp sáng tạo', credits: 3, semester: 6, isMandatory: false, prerequisite: '' },
  
  // Semester 7 - Bắt buộc: 14 TC
  { id: 50, courseCode: '17435', courseName: 'TK giao diện người dùng UI/UX', credits: 3, semester: 7, isMandatory: true, prerequisite: '' },
  { id: 51, courseCode: '17226', courseName: 'Thị giác máy tính', credits: 3, semester: 7, isMandatory: true, prerequisite: '17221' },
  { id: 52, courseCode: '17332', courseName: 'Công nghệ Internet of Things', credits: 3, semester: 7, isMandatory: true, prerequisite: '' },
  { id: 53, courseCode: '17231', courseName: 'Kỹ thuật học sâu và ứng dụng', credits: 3, semester: 7, isMandatory: true, prerequisite: '' },
  { id: 54, courseCode: '17341', courseName: 'Đồ án Tích hợp hệ thống', credits: 2, semester: 7, isMandatory: true, prerequisite: '' },
  // Semester 7 - Tự chọn
  { id: 55, courseCode: '17436', courseName: 'Xử lý dữ liệu lớn', credits: 3, semester: 7, isMandatory: false, prerequisite: '' },
  { id: 56, courseCode: '17540', courseName: 'An ninh mạng', credits: 3, semester: 7, isMandatory: false, prerequisite: '' },
  { id: 57, courseCode: '17419', courseName: 'Điện toán đám mây', credits: 3, semester: 7, isMandatory: false, prerequisite: '' },
  
  // Semester 8 - Bắt buộc: 10 TC
  { id: 58, courseCode: '17901', courseName: 'Thực tập tốt nghiệp', credits: 4, semester: 8, isMandatory: true, prerequisite: '17430' },
  { id: 59, courseCode: '17902', courseName: 'Đồ án tốt nghiệp', credits: 6, semester: 8, isMandatory: true, prerequisite: '' },
];

export async function GET() {
  try {
    const db = getDb();
    if (db) {
      const allCourses = await db.select().from(courses).orderBy(courses.semester);
      if (allCourses.length > 0) {
        return NextResponse.json(allCourses);
      }
    }
  } catch (error) {
    console.log('[v0] Database error (using demo courses):', error);
  }
  
  // Return demo courses if database is empty or error
  return NextResponse.json(DEMO_COURSES);
}
