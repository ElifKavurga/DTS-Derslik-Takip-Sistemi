export type CourseType = 'ZORUNLU' | 'SECMELI';
export type Semester = 'GUZ' | 'BAHAR' | 'YAZ_OKULU';

export type CourseResponse = {
  id: string;
  code: string;
  name: string;
  facultyId: string;
  facultyName: string;
  departmentId: string;
  departmentName: string;
  academicianId: string;
  academicianName: string;
  theoreticalHours: number;
  practicalHours: number;
  ects: number;
  credits: number;
  courseType: CourseType;
  semester: Semester;
  grade: number;
  active: boolean;
};

export type CourseListResponse = {
  courses: CourseResponse[];
};

export type CreateCourseRequest = {
  code: string;
  name: string;
  facultyId: string;
  departmentId: string;
  academicianId: string;
  theoreticalHours: number;
  practicalHours: number;
  ects: number;
  credits: number;
  courseType: CourseType;
  semester: Semester;
  grade: number;
  active: boolean;
};

export type UpdateCourseRequest = CreateCourseRequest;

export type AcademicianResponse = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  facultyId: string;
  facultyName: string;
  departmentId: string;
  departmentName: string;
};
