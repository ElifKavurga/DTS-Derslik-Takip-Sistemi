export type ScheduleExceptionType = 'CANCELLED' | 'MAKEUP' | 'EXTRA';

export type ScheduleExceptionResponse = {
  id: string;
  type: ScheduleExceptionType;
  originalScheduleId?: string | null;
  courseId: string;
  courseCode: string;
  courseName: string;
  academicianId: string;
  academicianName: string;
  originalDate?: string | null;
  targetDate: string;
  dayOfWeek: string;
  timeSlot: string;
  slotCount: number;
  classroomId?: string | null;
  classroomCode?: string | null;
  classroomName?: string | null;
};

export type CreateScheduleCancellationRequest = {
  scheduleId: string;
  date: string;
};

export type CreateScheduleMakeupRequest = {
  scheduleId: string;
  originalDate: string;
  makeupDate: string;
  timeSlot: string;
  slotCount: number;
  classroomId: string;
};

export type CreateExtraLessonRequest = {
  courseId: string;
  date: string;
  timeSlot: string;
  slotCount: number;
  classroomId: string;
};
