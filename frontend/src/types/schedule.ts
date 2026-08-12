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
  scheduleGroupId?: string | null;
};

export type CreateWeeklyScheduleRequest = {
  courseId: string;
  classroomId: string;
  dayOfWeek: ScheduleDay;
  timeSlot: string;
  slotCount: number;
};

export type UpdateWeeklyScheduleRequest = CreateWeeklyScheduleRequest;

export type ScheduleTimeSlotResponse = {
  value: string;
  startTime: string;
  endTime: string;
  index: number;
};

export type ScheduleTimeConfigurationRequest = {
  startTime: string;
  endTime: string;
  lessonDurationMinutes: number;
  breakDurationMinutes: number;
  lunchBreakEnabled: boolean;
  lunchBreakStart: string;
  lunchBreakEnd: string;
};

export type ScheduleTimeConfigurationResponse = ScheduleTimeConfigurationRequest & {
  departmentId: string;
  departmentName: string;
  slots: ScheduleTimeSlotResponse[];
  affectedScheduleCount: number;
};

export type AvailableClassroomResponse = {
  id: string;
  code: string;
  name: string;
  capacity: number;
  type: string;
  available: boolean;
  conflictMessage?: string | null;
  timeSlotAvailable?: boolean | null;
  capacitySufficient?: boolean | null;
  studentCount?: number | null;
  conflictCode?: string | null;
  conflictDetails?: string[] | null;
  selectable: boolean;
};

export type CourseScheduleStatus =
  | 'NOT_SCHEDULED'
  | 'INCOMPLETE'
  | 'COMPLETE'
  | 'OVER_SCHEDULED';

export type CourseScheduleStatusItemResponse = {
  courseId: string;
  courseCode: string;
  courseName: string;
  academicianName: string;
  grade: number;
  requiredHours: number;
  scheduledHours: number;
  remainingHours: number;
  status: CourseScheduleStatus;
};

export type ScheduleCompletionResponse = {
  departmentId: string;
  departmentName: string;
  semester?: Semester | null;
  totalCourses: number;
  completedCourses: number;
  incompleteCourses: number;
  notScheduledCourses: number;
  overScheduledCourses: number;
  completionPercentage: number;
  courses: CourseScheduleStatusItemResponse[];
};

export const scheduleDays: { value: ScheduleDay; label: string; shortLabel: string }[] = [
  { value: 'MONDAY', label: 'Pazartesi', shortLabel: 'Pzt' },
  { value: 'TUESDAY', label: 'Salı', shortLabel: 'Salı' },
  { value: 'WEDNESDAY', label: 'Çarşamba', shortLabel: 'Çarş' },
  { value: 'THURSDAY', label: 'Perşembe', shortLabel: 'Perş' },
  { value: 'FRIDAY', label: 'Cuma', shortLabel: 'Cuma' },
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
