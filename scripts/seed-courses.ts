import { db } from '@/lib/db';
import { courses } from '@/lib/schema';

const courseData = [
  // Semester 1
  { courseCode: '18141', courseName: 'Đại số', credits: 3, semester: 1, isMandatory: true, prerequisite: '' },
  { courseCode: '17200', courseName: 'Giới thiệu ngành CN thông tin', credits: 2, semester: 1, isMandatory: true, prerequisite: '' },
  { courseCode: '17232', courseName: 'Toán rời rạc', credits: 3, semester: 1, isMandatory: true, prerequisite: '' },
  { courseCode: '11401', courseName: 'Pháp luật đại cương', credits: 2, semester: 1, isMandatory: true, prerequisite: '' },
  { courseCode: '17302', courseName: 'Kiến trúc máy tính và thiết bị NV', credits: 3, semester: 1, isMandatory: true, prerequisite: '' },
  { courseCode: '17102', courseName: 'Tin học văn phòng', credits: 3, semester: 1, isMandatory: false, prerequisite: '' },
  { courseCode: '25121', courseName: 'Anh văn cơ bản 1', credits: 3, semester: 1, isMandatory: false, prerequisite: '' },
  { courseCode: '29101', courseName: 'Kỹ năng mềm 1', credits: 2, semester: 1, isMandatory: false, prerequisite: '' },

  // Semester 2
  { courseCode: '19101', courseName: 'Triết học Mác Lênin', credits: 3, semester: 2, isMandatory: true, prerequisite: '' },
  { courseCode: '18142', courseName: 'Giải tích', credits: 3, semester: 2, isMandatory: true, prerequisite: '' },
  { courseCode: '17206', courseName: 'Kỹ thuật lập trình C', credits: 3, semester: 2, isMandatory: true, prerequisite: '' },
  { courseCode: '17426', courseName: 'Cơ sở dữ liệu', credits: 3, semester: 2, isMandatory: true, prerequisite: '' },
  { courseCode: '17506', courseName: 'Mạng máy tính', credits: 3, semester: 2, isMandatory: true, prerequisite: '' },
  { courseCode: '17432', courseName: 'Nhập môn công nghệ phần mềm', credits: 2, semester: 2, isMandatory: true, prerequisite: '' },
  { courseCode: '25122', courseName: 'Anh văn cơ bản 2', credits: 3, semester: 2, isMandatory: false, prerequisite: '' },
  { courseCode: '17303', courseName: 'Nguyên lý hệ điều hành', credits: 2, semester: 2, isMandatory: false, prerequisite: '' },

  // Semester 3
  { courseCode: '19401', courseName: 'Kinh tế chính trị Mác-Lênin', credits: 2, semester: 3, isMandatory: true, prerequisite: '19101' },
  { courseCode: '18143', courseName: 'Xác suất thống kê', credits: 3, semester: 3, isMandatory: true, prerequisite: '' },
  { courseCode: '17233', courseName: 'Cấu trúc dữ liệu và giải thuật', credits: 3, semester: 3, isMandatory: true, prerequisite: '17206' },
  { courseCode: '17335', courseName: 'Lập trình Windows', credits: 3, semester: 3, isMandatory: true, prerequisite: '' },
  { courseCode: '17236', courseName: 'Lập trình hướng đối tượng', credits: 3, semester: 3, isMandatory: true, prerequisite: '17206' },
  { courseCode: '17523', courseName: 'Java cơ bản', credits: 3, semester: 3, isMandatory: true, prerequisite: '' },
  { courseCode: '17105', courseName: 'Lập trình Python', credits: 3, semester: 3, isMandatory: false, prerequisite: '' },
  { courseCode: '17106', courseName: 'Python nâng cao', credits: 3, semester: 3, isMandatory: false, prerequisite: '' },

  // Semester 4
  { courseCode: '19501', courseName: 'Chủ nghĩa xã hội khoa học', credits: 2, semester: 4, isMandatory: true, prerequisite: '19401' },
  { courseCode: '17212', courseName: 'An toàn và bảo mật thông tin', credits: 3, semester: 4, isMandatory: true, prerequisite: '17233' },
  { courseCode: '17430', courseName: 'PT&TK hệ thống hướng đối tượng', credits: 3, semester: 4, isMandatory: true, prerequisite: '17426' },
  { courseCode: '17209', courseName: 'Lý thuyết đồ thị', credits: 3, semester: 4, isMandatory: true, prerequisite: '17233' },
  { courseCode: '17301', courseName: 'Kỹ thuật Vi xử lý', credits: 3, semester: 4, isMandatory: true, prerequisite: '' },
  { courseCode: '25105', courseName: 'Anh Văn cơ bản 3', credits: 4, semester: 4, isMandatory: true, prerequisite: '' },
  { courseCode: '17414', courseName: 'Quản lý dự án Công nghệ thông tin', credits: 3, semester: 4, isMandatory: false, prerequisite: '' },
  { courseCode: '17507', courseName: 'Lập trình mạng', credits: 3, semester: 4, isMandatory: false, prerequisite: '' },

  // Semester 5
  { courseCode: '19201', courseName: 'Tư tưởng Hồ Chí Minh', credits: 2, semester: 5, isMandatory: true, prerequisite: '19501' },
  { courseCode: '17434', courseName: 'PT ứng dụng với cơ sở dữ liệu', credits: 3, semester: 5, isMandatory: true, prerequisite: '17426' },
  { courseCode: '17423', courseName: 'Lập trình thiết bị di động', credits: 3, semester: 5, isMandatory: true, prerequisite: '17206,17523' },
  { courseCode: '17340', courseName: 'Phát triển ứng dụng trên nền Web', credits: 4, semester: 5, isMandatory: true, prerequisite: '' },
  { courseCode: '17234', courseName: 'Trí tuệ nhân tạo', credits: 3, semester: 5, isMandatory: true, prerequisite: '17233' },
  { courseCode: '17290', courseName: 'Thực tập CN Công nghệ thông tin', credits: 2, semester: 5, isMandatory: true, prerequisite: '17426,17206' },
  { courseCode: '17333', courseName: 'Robot và các hệ thống thông minh', credits: 3, semester: 5, isMandatory: false, prerequisite: '' },
  { courseCode: '17428', courseName: 'BDDL dạng bán CT và ứng dụng', credits: 3, semester: 5, isMandatory: false, prerequisite: '' },

  // Semester 6
  { courseCode: '19303', courseName: 'Lịch sử Đảng Cộng sản VN', credits: 2, semester: 6, isMandatory: true, prerequisite: '19201' },
  { courseCode: '17337', courseName: 'Hệ thống nhúng', credits: 3, semester: 6, isMandatory: true, prerequisite: '' },
  { courseCode: '17221', courseName: 'Xử lý ảnh', credits: 3, semester: 6, isMandatory: true, prerequisite: '' },
  { courseCode: '17543', courseName: 'Thương mại điện tử', credits: 3, semester: 6, isMandatory: true, prerequisite: '' },
  { courseCode: '17314', courseName: 'Phát triển ứng dụng mã nguồn mở', credits: 3, semester: 6, isMandatory: true, prerequisite: '' },
  { courseCode: '17439', courseName: 'Phương pháp triển khai-DevOps', credits: 3, semester: 6, isMandatory: false, prerequisite: '' },
  { courseCode: '17509', courseName: 'Thiết kế và quản trị mạng', credits: 3, semester: 6, isMandatory: false, prerequisite: '' },
  { courseCode: '17429', courseName: 'Kiểm thử và đảm bảo CL phần mềm', credits: 3, semester: 6, isMandatory: false, prerequisite: '' },
  { courseCode: '28299', courseName: 'Khởi nghiệp sáng tạo', credits: 3, semester: 6, isMandatory: false, prerequisite: '' },

  // Semester 7
  { courseCode: '17435', courseName: 'TK giao diện người dùng UI/UX', credits: 3, semester: 7, isMandatory: true, prerequisite: '' },
  { courseCode: '17226', courseName: 'Thị giác máy tính', credits: 3, semester: 7, isMandatory: true, prerequisite: '17221' },
  { courseCode: '17332', courseName: 'Công nghệ Internet of Things', credits: 3, semester: 7, isMandatory: true, prerequisite: '' },
  { courseCode: '17231', courseName: 'Kỹ thuật học sâu và ứng dụng', credits: 3, semester: 7, isMandatory: true, prerequisite: '' },
  { courseCode: '17341', courseName: 'Đồ án Tích hợp hệ thống', credits: 2, semester: 7, isMandatory: true, prerequisite: '' },
  { courseCode: '17436', courseName: 'Xử lý dữ liệu lớn', credits: 3, semester: 7, isMandatory: false, prerequisite: '' },
  { courseCode: '17540', courseName: 'An ninh mạng', credits: 3, semester: 7, isMandatory: false, prerequisite: '' },
  { courseCode: '17419', courseName: 'Điện toán đám mây', credits: 3, semester: 7, isMandatory: false, prerequisite: '' },

  // Semester 8
  { courseCode: '17901', courseName: 'Thực tập tốt nghiệp', credits: 4, semester: 8, isMandatory: true, prerequisite: '17430' },
  { courseCode: '17902', courseName: 'Đồ án tốt nghiệp', credits: 6, semester: 8, isMandatory: true, prerequisite: '' },
];

async function seed() {
  console.log('Starting course seeding...');
  try {
    await db.insert(courses).values(courseData);
    console.log('✅ Course seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding courses:', error);
    process.exit(1);
  }
}

seed();
