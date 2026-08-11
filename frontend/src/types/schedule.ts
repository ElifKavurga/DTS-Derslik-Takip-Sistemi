import { CourseType, Semester } from './course';

export type ScheduleDay = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY';

export type WeeklyScheduleResponse = {
  id: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  academicianId: string;
  academicianName: string;
  classroomId: string;
  classroomCode: string;
  classroomName: string;
  classroomCapacity: number;
  classroomType: string;
  departmentId: string;
  departmentName: string;
  dayOfWeek: ScheduleDay;
  timeSlot: string;
  semester: Semester;
};

export type CreateWeeklyScheduleRequest = {
  courseId: string;
  classroomId: string;
  dayOfWeek: ScheduleDay;
  timeSlot: string;
};

export type UpdateWeeklyScheduleRequest = CreateWeeklyScheduleRequest;

export type AvailableClassroomResponse = {
  id: string;
  code: string;
  name: string;
  capacity: number;
  type: string;
  available: boolean;
  conflictMessage?: string | null;
};

export const scheduleDays: { value: ScheduleDay; label: string; shortLabel: string }[] = [
  { value: 'MONDAY', label: 'Pazartesi', shortLabel: 'Pzt' },
  { value: 'TUESDAY', label: 'Salı', shortLabel: 'Salı' },
  { value: 'WEDNESDAY', label: 'Çarşamba', shortLabel: 'Çarş' },
  { value: 'THURSDAY', label: 'Perşembe', shortLabel: 'Perş' },
  { value: 'FRIDAY', label: 'Cuma', shortLabel: 'Cuma' },
];

export const scheduleTimeSlots = [
  '08:00-09:00',
  '09:00-10:00',
  '10:00-11:00',
  '11:00-12:00',
  '13:00-14:00',
  '14:00-15:00',
  '15:00-16:00',
  '16:00-17:00',
];

export const classroomTypeLabels: Record<string, string> = {
  CLASSROOM: 'Sınıf',
  LABORATORY: 'Laboratuvar',
  AMPHITHEATER: 'Amfi',
};

export const courseTypeLabels: Record<CourseType, string> = {
  ZORUNLU: 'Zorunlu',
  SECMELI: 'Seçmeli',
};
