import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { AlertTriangle, CalendarDays, CheckCircle2, Circle, Clock, Edit2, MapPin, Plus, Settings, Trash2, User, XCircle } from 'lucide-react';
import { AppSelect } from '@/components/ui/AppSelect';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FormModal } from '@/components/ui/FormModal';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { courseService } from '@/services/courseService';
import { scheduleService } from '@/services/scheduleService';
import { scheduleExceptionService } from '@/services/scheduleExceptionService';
import {
  AvailableClassroomResponse,
  CourseScheduleStatusItemResponse,
  CourseResponse,
  ScheduleDay,
  ScheduleCompletionResponse,
  ScheduleExceptionResponse,
  ScheduleExceptionType,
  ScheduleTimeConfigurationRequest,
  Semester,
  WeeklyScheduleResponse,
  classroomTypeLabels,
  scheduleDays,
} from '@/types';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/store/useAuthStore';

const semesterOptions: { label: string; value: Semester | '' }[] = [
  { label: 'Tüm Dönemler', value: '' },
  { label: 'Güz', value: 'GUZ' },
  { label: 'Bahar', value: 'BAHAR' },
  { label: 'Yaz', value: 'YAZ_OKULU' },
];

type ScheduleFormState = {
  courseId: string;
  dayOfWeek: ScheduleDay | '';
  timeSlot: string;
  slotCount: number;
  classroomId: string;
};

type ScheduleApiError = {
  message?: string;
  code?: string | null;
  details?: string[] | null;
};

type ScheduleValidationAlert = {
  title: string;
  details: string[];
};

type PendingScheduleSubmit = {
  courseId: string;
  classroomId: string;
  dayOfWeek: ScheduleDay;
  timeSlot: string;
  slotCount: number;
};

type ScheduleDetailState = {
  schedule: WeeklyScheduleResponse;
  groupMeta?: ScheduleGroupMeta;
  hasConflict: boolean;
};

const initialForm: ScheduleFormState = {
  courseId: '',
  dayOfWeek: '',
  timeSlot: '',
  slotCount: 1,
  classroomId: '',
};

const initialTimeConfig: ScheduleTimeConfigurationRequest = {
  startTime: '08:15',
  endTime: '17:00',
  lessonDurationMinutes: 45,
  breakDurationMinutes: 10,
  lunchBreakEnabled: true,
  lunchBreakStart: '12:40',
  lunchBreakEnd: '13:30',
};

const mutationErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || fallback;
  }
  return fallback;
};

const dayLabel = (day: string) => scheduleDays.find((item) => item.value === day)?.label ?? day;

const formatSlot = (slot: string) => slot.replace('-', ' - ');

type ScheduleGroupMeta = {
  firstScheduleId: string;
  slotCount: number;
  timeRange: string;
};

type ScheduleVisualItem = {
  id: string;
  dayOfWeek: ScheduleDay;
  startSlot: string;
  schedule: WeeklyScheduleResponse;
  groupMeta: ScheduleGroupMeta;
  top: number;
  height: number;
  exceptionType?: ScheduleExceptionType;
};

const CALENDAR_MINUTE_HEIGHT = 1.45;
const MIN_EVENT_HEIGHT = 56;

const parseTimeToMinutes = (time: string) => {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
};

const slotStart = (slot: string) => slot.split('-')[0]?.trim() ?? slot;
const slotEnd = (slot: string) => slot.split('-')[1]?.trim() ?? slot;

export const SchedulePage = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const role = useAuthStore((state) => state.user?.role);
  const isReadOnly = role === 'ACADEMICIAN';
  const highlightedCourseId = isReadOnly ? searchParams.get('courseId') : null;
  const [selectedSemester, setSelectedSemester] = useState<Semester | ''>('GUZ');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedAcademicianId, setSelectedAcademicianId] = useState('');
  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [selectedScheduleCourseId, setSelectedScheduleCourseId] = useState('');
  const [selectedDayFilter, setSelectedDayFilter] = useState<ScheduleDay | ''>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isTimeConfigModalOpen, setIsTimeConfigModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<WeeklyScheduleResponse | null>(null);
  const [deletingSchedule, setDeletingSchedule] = useState<WeeklyScheduleResponse | null>(null);
  const [scheduleDetail, setScheduleDetail] = useState<ScheduleDetailState | null>(null);
  const [form, setForm] = useState<ScheduleFormState>(initialForm);
  const [backendValidation, setBackendValidation] = useState<ScheduleValidationAlert | null>(null);
  const [pendingCapacitySubmit, setPendingCapacitySubmit] = useState<PendingScheduleSubmit | null>(null);
  const [timeConfigForm, setTimeConfigForm] = useState<ScheduleTimeConfigurationRequest>(initialTimeConfig);

  const { data: schedules = [], isLoading, error, refetch } = useQuery({
    queryKey: ['weeklySchedules', selectedSemester],
    queryFn: () => scheduleService.getAll(selectedSemester || undefined),
  });

  const { data: scheduleExceptions = [] } = useQuery({
    queryKey: ['scheduleExceptions', role],
    queryFn: () => scheduleExceptionService.getMine(),
    enabled: role === 'ACADEMICIAN' || role === 'DEPARTMENT_ADMIN',
  });

  const { data: scheduleStatus, isLoading: isStatusLoading } = useQuery({
    queryKey: ['scheduleStatus', selectedSemester],
    queryFn: () => scheduleService.getStatus(selectedSemester || undefined),
    enabled: role === 'DEPARTMENT_ADMIN',
  });

  const { data: timeConfiguration } = useQuery({
    queryKey: ['scheduleTimeConfiguration'],
    queryFn: scheduleService.getTimeConfiguration,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: courseService.getAll,
  });

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === form.courseId) ?? null,
    [courses, form.courseId],
  );

  const selectedCourseStatus = useMemo(
    () => scheduleStatus?.courses.find((course) => course.courseId === form.courseId) ?? null,
    [form.courseId, scheduleStatus],
  );

  const gradeOptions = useMemo(() => {
    const grades = Array.from(new Set(
      courses
        .filter((course) => course.active)
        .filter((course) => !selectedSemester || course.semester === selectedSemester)
        .map((course) => course.grade)
        .filter((grade): grade is number => Number.isFinite(grade)),
    )).sort((a, b) => a - b);
    return grades.map((grade) => ({ label: `${grade}. Sınıf`, value: String(grade) }));
  }, [courses, selectedSemester]);

  useEffect(() => {
    if (selectedGrade && !gradeOptions.some((option) => option.value === selectedGrade)) {
      setSelectedGrade('');
    }
  }, [gradeOptions, selectedGrade]);

  const selectedGradeNumber = !isReadOnly && selectedGrade ? Number(selectedGrade) : null;

  const editingGroupSlotCount = useMemo(() => {
    if (!editingSchedule) return 0;
    if (!editingSchedule.scheduleGroupId) return 1;
    return Math.max(1, schedules.filter((schedule) => schedule.scheduleGroupId === editingSchedule.scheduleGroupId).length);
  }, [editingSchedule, schedules]);

  const timeSlots = useMemo(
    () => timeConfiguration?.slots.map((slot) => slot.value) ?? [],
    [timeConfiguration],
  );

  const calendarStartMinute = useMemo(
    () => timeSlots.length > 0 ? parseTimeToMinutes(slotStart(timeSlots[0])) : 0,
    [timeSlots],
  );

  const calendarEndMinute = useMemo(
    () => timeSlots.length > 0 ? parseTimeToMinutes(slotEnd(timeSlots[timeSlots.length - 1])) : 0,
    [timeSlots],
  );

  const calendarBodyHeight = Math.max(0, (calendarEndMinute - calendarStartMinute) * CALENDAR_MINUTE_HEIGHT);

  const selectedSlot = useMemo(
    () => timeConfiguration?.slots.find((slot) => slot.value === form.timeSlot) ?? null,
    [form.timeSlot, timeConfiguration],
  );
  const selectedSlotIndex = selectedSlot?.index ?? -1;
  const courseRemainingHours = selectedCourseStatus
    ? Math.max(0, selectedCourseStatus.remainingHours + (editingSchedule?.courseId === form.courseId ? editingGroupSlotCount : 0))
    : selectedCourse
      ? selectedCourse.theoreticalHours + selectedCourse.practicalHours
      : 0;
  const consecutiveSlotCount = selectedSlotIndex >= 0 ? Math.max(1, timeSlots.length - selectedSlotIndex) : 0;
  const maxSlotCount = Math.min(consecutiveSlotCount, courseRemainingHours);
  const slotCountOptions = useMemo(
    () => Array.from({ length: Math.min(maxSlotCount, 12) }, (_, index) => ({
      label: `${index + 1} ders saati`,
      value: String(index + 1),
    })),
    [maxSlotCount],
  );
  const selectedSlots = selectedSlotIndex >= 0
    ? timeSlots.slice(selectedSlotIndex, selectedSlotIndex + Math.min(form.slotCount, maxSlotCount))
    : [];

  useEffect(() => {
    if (!form.timeSlot) return;
    if (maxSlotCount > 0 && form.slotCount > maxSlotCount) {
      updateForm({ slotCount: maxSlotCount });
    }
    if (maxSlotCount === 0 && form.slotCount !== 1) {
      updateForm({ slotCount: 1 });
    }
  }, [form.timeSlot, form.slotCount, maxSlotCount]);

  const canQueryClassrooms = Boolean(form.courseId && form.dayOfWeek && form.timeSlot && form.slotCount && maxSlotCount > 0);

  const { data: classrooms = [], isFetching: isClassroomsLoading, isError: isClassroomsError } = useQuery({
    queryKey: ['availableClassrooms', form.courseId, form.dayOfWeek, form.timeSlot, form.slotCount, editingSchedule?.id],
    queryFn: () => scheduleService.getAvailableClassrooms({
      dayOfWeek: form.dayOfWeek,
      timeSlot: form.timeSlot,
      slotCount: form.slotCount,
      courseId: form.courseId,
      excludeScheduleId: editingSchedule?.id,
    }),
    enabled: canQueryClassrooms,
  });

  const suitableClassrooms = useMemo(
    () => classrooms.filter((classroom) => classroom.selectable && classroom.capacitySufficient !== false),
    [classrooms],
  );

  const alternativeClassrooms = useMemo(
    () => classrooms.filter((classroom) => classroom.selectable && classroom.capacitySufficient === false),
    [classrooms],
  );

  const busyClassrooms = useMemo(
    () => classrooms.filter((classroom) => !classroom.selectable),
    [classrooms],
  );

  const selectedClassroomOption = useMemo(
    () => classrooms.find((classroom) => classroom.id === form.classroomId) ?? null,
    [classrooms, form.classroomId],
  );

  const formValidationAlert = useMemo<ScheduleValidationAlert | null>(() => {
    if (slotCountOptions.length === 0 && form.courseId && form.timeSlot) {
      return {
        title: 'Bu saate ders koyulamaz.',
        details: ['Seçilen ders için bu başlangıç saatinde programlanabilir ders saati kalmadı.'],
      };
    }

    if (selectedClassroomOption && !selectedClassroomOption.selectable) {
      return {
        title: selectedClassroomOption.conflictCode === 'CAPACITY_CONFLICT'
          ? 'Bu derslik yeterli kapasiteye sahip değil.'
          : 'Bu saate ders koyulamaz.',
        details: validationDetails(selectedClassroomOption),
      };
    }

    if (selectedClassroomOption?.capacitySufficient === false) {
      return {
        title: 'Kapasite uyarısı',
        details: validationDetails(selectedClassroomOption),
      };
    }

    if (canQueryClassrooms && !isClassroomsLoading && classrooms.length > 0 && suitableClassrooms.length === 0 && alternativeClassrooms.length > 0) {
      return {
        title: 'Yeterli kapasitede derslik bulunamadı.',
        details: ['Alternatif derslikler kapasite açısından yetersizdir, ancak seçilebilir.'],
      };
    }

    if (canQueryClassrooms && !isClassroomsLoading && classrooms.length > 0 && suitableClassrooms.length === 0 && alternativeClassrooms.length === 0) {
      const firstConflict = classrooms[0];
      return {
        title: 'Bu saate ders koyulamaz.',
        details: [
          'Seçilen zaman aralığında uygun derslik bulunamadı.',
          ...validationDetails(firstConflict),
        ],
      };
    }

    return null;
  }, [alternativeClassrooms.length, canQueryClassrooms, classrooms, form.courseId, form.timeSlot, isClassroomsLoading, selectedClassroomOption, slotCountOptions.length, suitableClassrooms.length]);

  const activeValidationAlert = backendValidation ?? formValidationAlert;

  const courseById = useMemo(
    () => new Map(courses.map((course) => [course.id, course])),
    [courses],
  );

  const scheduleFilterOptions = useMemo(() => {
    const courseOptionsById = new Map<string, { label: string; value: string }>();
    const academicianOptionsById = new Map<string, { label: string; value: string }>();
    const classroomOptionsById = new Map<string, { label: string; value: string }>();

    schedules.forEach((schedule) => {
      courseOptionsById.set(schedule.courseId, {
        label: `${schedule.courseCode} - ${schedule.courseName}`,
        value: schedule.courseId,
      });
      academicianOptionsById.set(schedule.academicianId, {
        label: schedule.academicianName,
        value: schedule.academicianId,
      });
      classroomOptionsById.set(schedule.classroomId, {
        label: `${schedule.classroomCode} - ${schedule.classroomName}`,
        value: schedule.classroomId,
      });
    });

    const sortByLabel = (a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label, 'tr');
    return {
      courses: Array.from(courseOptionsById.values()).sort(sortByLabel),
      academicians: Array.from(academicianOptionsById.values()).sort(sortByLabel),
      classrooms: Array.from(classroomOptionsById.values()).sort(sortByLabel),
    };
  }, [schedules]);

  const hasScheduleFilters = Boolean(selectedGrade || selectedAcademicianId || selectedClassroomId || selectedScheduleCourseId || selectedDayFilter);

  const clearScheduleFilters = () => {
    setSelectedGrade('');
    setSelectedAcademicianId('');
    setSelectedClassroomId('');
    setSelectedScheduleCourseId('');
    setSelectedDayFilter('');
  };

  const visibleSchedules = useMemo(
    () => schedules.filter((schedule) => {
      if (selectedGradeNumber !== null && courseById.get(schedule.courseId)?.grade !== selectedGradeNumber) return false;
      if (selectedAcademicianId && schedule.academicianId !== selectedAcademicianId) return false;
      if (selectedClassroomId && schedule.classroomId !== selectedClassroomId) return false;
      if (selectedScheduleCourseId && schedule.courseId !== selectedScheduleCourseId) return false;
      if (selectedDayFilter && schedule.dayOfWeek !== selectedDayFilter) return false;
      return true;
    }),
    [courseById, schedules, selectedAcademicianId, selectedClassroomId, selectedDayFilter, selectedGradeNumber, selectedScheduleCourseId],
  );

  const visibleExceptions = useMemo(
    () => (role === 'ACADEMICIAN' || role === 'DEPARTMENT_ADMIN')
      ? scheduleExceptions.filter((exception) => {
        const course = courseById.get(exception.courseId);
        if (selectedGradeNumber !== null && course?.grade !== selectedGradeNumber) return false;
        if (selectedAcademicianId && exception.academicianId !== selectedAcademicianId) return false;
        if (selectedClassroomId && exception.classroomId !== selectedClassroomId) return false;
        if (selectedScheduleCourseId && exception.courseId !== selectedScheduleCourseId) return false;
        return !selectedSemester || !course || course.semester === selectedSemester;
      })
      : [],
    [courseById, role, scheduleExceptions, selectedAcademicianId, selectedClassroomId, selectedGradeNumber, selectedScheduleCourseId, selectedSemester],
  );

  const cancellationByScheduleId = useMemo(() => {
    const map = new Map<string, ScheduleExceptionResponse>();
    visibleExceptions
      .filter((exception) => exception.type === 'CANCELLED' && exception.originalScheduleId)
      .forEach((exception) => map.set(exception.originalScheduleId!, exception));
    return map;
  }, [visibleExceptions]);

  const readOnlyScheduleSummary = useMemo(() => {
    const uniqueBlocks = new Set(visibleSchedules.map((schedule) => schedule.scheduleGroupId ?? schedule.id));
    return {
      courseCount: new Set(visibleSchedules.map((schedule) => schedule.courseId)).size,
      blockCount: uniqueBlocks.size,
      scheduledHours: visibleSchedules.length,
    };
  }, [visibleSchedules]);

  const schedulesByCell = useMemo(() => {
    const map = new Map<string, WeeklyScheduleResponse[]>();
    visibleSchedules.forEach((schedule) => {
      const key = `${schedule.dayOfWeek}:${schedule.timeSlot}`;
      map.set(key, [...(map.get(key) ?? []), schedule]);
    });
    return map;
  }, [visibleSchedules]);

  const visualScheduleItems = useMemo(() => {
    const groups = new Map<string, WeeklyScheduleResponse[]>();
    visibleSchedules.forEach((schedule) => {
      const key = `${schedule.courseId}:${schedule.classroomId}:${schedule.academicianId}:${schedule.dayOfWeek}`;
      groups.set(key, [...(groups.get(key) ?? []), schedule]);
    });

    const items: ScheduleVisualItem[] = [];
    groups.forEach((groupSchedules) => {
      const sortedSchedules = [...groupSchedules]
        .map((schedule) => ({ schedule, index: timeSlots.indexOf(schedule.timeSlot) }))
        .filter((item) => item.index >= 0)
        .sort((a, b) => a.index - b.index);

      let segment: typeof sortedSchedules = [];
      const flushSegment = () => {
        if (segment.length === 0) return;
        const first = segment[0];
        const last = segment[segment.length - 1];
        const startTime = slotStart(first.schedule.timeSlot);
        const endTime = slotEnd(last.schedule.timeSlot);
        const top = (parseTimeToMinutes(startTime) - calendarStartMinute) * CALENDAR_MINUTE_HEIGHT;
        const height = Math.max(MIN_EVENT_HEIGHT, (parseTimeToMinutes(endTime) - parseTimeToMinutes(startTime)) * CALENDAR_MINUTE_HEIGHT);
        items.push({
          id: `${first.schedule.id}:${segment.length}`,
          dayOfWeek: first.schedule.dayOfWeek,
          startSlot: first.schedule.timeSlot,
          schedule: first.schedule,
          groupMeta: {
            firstScheduleId: first.schedule.id,
            slotCount: segment.length,
            timeRange: `${startTime} - ${endTime}`,
          },
          top,
          height,
          exceptionType: cancellationByScheduleId.has(first.schedule.id) ? 'CANCELLED' : undefined,
        });
        segment = [];
      };

      sortedSchedules.forEach((item) => {
        const previous = segment[segment.length - 1];
        if (previous && item.index !== previous.index + 1) {
          flushSegment();
        }
        segment.push(item);
      });
      flushSegment();
    });
    visibleExceptions
      .filter((exception) => exception.type === 'MAKEUP' || exception.type === 'EXTRA')
      .forEach((exception) => {
        const startIndex = timeSlots.indexOf(exception.timeSlot);
        if (startIndex < 0) return;
        const dayOfWeek = exception.dayOfWeek as ScheduleDay;
        if (!scheduleDays.some((day) => day.value === dayOfWeek)) return;
        if (selectedDayFilter && dayOfWeek !== selectedDayFilter) return;

        const slotCount = Math.max(1, exception.slotCount);
        const lastSlot = timeSlots[Math.min(timeSlots.length - 1, startIndex + slotCount - 1)] ?? exception.timeSlot;
        const startTime = slotStart(exception.timeSlot);
        const endTime = slotEnd(lastSlot);
        const top = (parseTimeToMinutes(startTime) - calendarStartMinute) * CALENDAR_MINUTE_HEIGHT;
        const height = Math.max(MIN_EVENT_HEIGHT, (parseTimeToMinutes(endTime) - parseTimeToMinutes(startTime)) * CALENDAR_MINUTE_HEIGHT);
        const course = courseById.get(exception.courseId);

        items.push({
          id: `exception:${exception.id}`,
          dayOfWeek,
          startSlot: exception.timeSlot,
          schedule: {
            id: exception.id,
            courseId: exception.courseId,
            courseCode: exception.courseCode,
            courseName: exception.courseName,
            academicianId: exception.academicianId,
            academicianName: exception.academicianName,
            classroomId: exception.classroomId ?? '',
            classroomCode: exception.classroomCode ?? '-',
            classroomName: exception.classroomName ?? '-',
            classroomCapacity: 0,
            classroomType: 'CLASSROOM',
            departmentId: course?.departmentId ?? '',
            departmentName: course?.departmentName ?? '',
            dayOfWeek,
            timeSlot: exception.timeSlot,
            semester: course?.semester ?? 'GUZ',
            scheduleGroupId: exception.id,
          },
          groupMeta: {
            firstScheduleId: exception.id,
            slotCount,
            timeRange: `${startTime} - ${endTime}`,
          },
          top,
          height,
          exceptionType: exception.type,
        });
      });
    return items;
  }, [calendarStartMinute, cancellationByScheduleId, courseById, selectedDayFilter, timeSlots, visibleExceptions, visibleSchedules]);

  const courseOptions = useMemo(
    () => courses
      .filter((course) => course.active)
      .filter((course) => !selectedSemester || course.semester === selectedSemester)
      .filter((course) => selectedGradeNumber === null || course.grade === selectedGradeNumber)
      .filter((course) => {
        if (editingSchedule?.courseId === course.id) return true;
        const status = scheduleStatus?.courses.find((item) => item.courseId === course.id);
        return !status || status.remainingHours > 0;
      })
      .map((course) => ({ label: `${course.code} - ${course.name}`, value: course.id })),
    [courses, editingSchedule, scheduleStatus, selectedGradeNumber, selectedSemester],
  );

  const filteredScheduleStatus = useMemo(() => {
    if (!scheduleStatus || selectedGradeNumber === null) return scheduleStatus;
    const coursesForGrade = scheduleStatus.courses.filter((course) => course.grade === selectedGradeNumber);
    const completedCourses = coursesForGrade.filter((course) => course.status === 'COMPLETE').length;
    const incompleteCount = coursesForGrade.filter((course) => course.status === 'INCOMPLETE').length;
    const notScheduledCount = coursesForGrade.filter((course) => course.status === 'NOT_SCHEDULED').length;
    const overScheduledCourses = coursesForGrade.filter((course) => course.status === 'OVER_SCHEDULED').length;
    const totalCourses = coursesForGrade.length;
    const requiredHours = coursesForGrade.reduce((total, course) => total + course.requiredHours, 0);
    const scheduledHours = coursesForGrade.reduce((total, course) => total + course.scheduledHours, 0);
    const missingHours = coursesForGrade.reduce((total, course) => total + Math.max(course.remainingHours, 0), 0);
    const excessHours = coursesForGrade.reduce((total, course) => total + Math.max(-course.remainingHours, 0), 0);
    const completedHours = coursesForGrade.reduce((total, course) => total + Math.min(course.scheduledHours, course.requiredHours), 0);
    return {
      ...scheduleStatus,
      totalCourses,
      completedCourses,
      incompleteCourses: incompleteCount,
      notScheduledCourses: notScheduledCount,
      overScheduledCourses,
      requiredHours,
      scheduledHours,
      missingHours,
      excessHours,
      completionPercentage: requiredHours === 0 ? 0 : Math.round((completedHours * 100) / requiredHours),
      courses: coursesForGrade,
    };
  }, [scheduleStatus, selectedGradeNumber]);

  const selectedGradeLabel = selectedGrade
    ? gradeOptions.find((option) => option.value === selectedGrade)?.label ?? 'Sınıf'
    : 'Tüm Sınıflar';

  const gradeScheduleSummary = useMemo(() => {
    if (!filteredScheduleStatus) return null;
    return {
      courseCount: filteredScheduleStatus.totalCourses,
      requiredHours: filteredScheduleStatus.requiredHours,
      scheduledHours: filteredScheduleStatus.scheduledHours,
      missingHours: filteredScheduleStatus.missingHours,
      excessHours: filteredScheduleStatus.excessHours,
    };
  }, [filteredScheduleStatus]);

  const compactProblemCourses = useMemo(
    () => filteredScheduleStatus?.courses
      .filter((course) => course.status === 'INCOMPLETE' || course.status === 'NOT_SCHEDULED' || course.status === 'OVER_SCHEDULED')
      .slice(0, 5) ?? [],
    [filteredScheduleStatus],
  );

  const openCreate = (courseId = '') => {
    setEditingSchedule(null);
    setBackendValidation(null);
    setForm({ ...initialForm, courseId });
    setIsModalOpen(true);
  };

  const openEdit = (schedule: WeeklyScheduleResponse) => {
    const groupedSchedules = schedule.scheduleGroupId
      ? schedules
        .filter((item) => item.scheduleGroupId === schedule.scheduleGroupId)
        .sort((a, b) => timeSlots.indexOf(a.timeSlot) - timeSlots.indexOf(b.timeSlot))
      : [schedule];
    const firstSchedule = groupedSchedules[0] ?? schedule;
    setEditingSchedule(schedule);
    setBackendValidation(null);
    setForm({
      courseId: firstSchedule.courseId,
      dayOfWeek: firstSchedule.dayOfWeek,
      timeSlot: firstSchedule.timeSlot,
      slotCount: groupedSchedules.length,
      classroomId: firstSchedule.classroomId,
    });
    setIsModalOpen(true);
  };

  const openTimeConfig = () => {
    setTimeConfigForm(timeConfiguration ? {
      startTime: timeConfiguration.startTime,
      endTime: timeConfiguration.endTime,
      lessonDurationMinutes: timeConfiguration.lessonDurationMinutes,
      breakDurationMinutes: timeConfiguration.breakDurationMinutes,
      lunchBreakEnabled: timeConfiguration.lunchBreakEnabled,
      lunchBreakStart: timeConfiguration.lunchBreakStart,
      lunchBreakEnd: timeConfiguration.lunchBreakEnd,
    } : initialTimeConfig);
    setIsTimeConfigModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSchedule(null);
    setBackendValidation(null);
    setPendingCapacitySubmit(null);
    setForm(initialForm);
  };

  const updateForm = (patch: Partial<ScheduleFormState>) => {
    setBackendValidation(null);
    setForm((current) => {
      const next = { ...current, ...patch };
      if ('dayOfWeek' in patch || 'timeSlot' in patch || 'slotCount' in patch) {
        next.classroomId = '';
      }
      if ('courseId' in patch) {
        next.classroomId = '';
      }
      return next;
    });
  };

  const createMutation = useMutation({
    mutationFn: scheduleService.create,
    onSuccess: async (createdSchedules) => {
      const firstSchedule = createdSchedules[0];
      toast.success(firstSchedule ? `${firstSchedule.courseCode} ${dayLabel(firstSchedule.dayOfWeek)} ${formatSlot(firstSchedule.timeSlot)} programına eklendi.` : 'Ders programı eklendi.');
      queryClient.invalidateQueries({ queryKey: ['weeklySchedules'] });
      queryClient.invalidateQueries({ queryKey: ['scheduleStatus'] });
      await notifyCourseStatus(createdSchedules[0]?.courseId ?? form.courseId);
      closeModal();
    },
    onError: (err: AxiosError<ScheduleApiError>) => {
      const alert = apiErrorToValidationAlert(err, 'Ders programı eklenemedi.');
      setBackendValidation(alert);
      toast.error(alert.title);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ScheduleFormState }) => scheduleService.update(id, {
      courseId: payload.courseId,
      classroomId: payload.classroomId,
      dayOfWeek: payload.dayOfWeek as ScheduleDay,
      timeSlot: payload.timeSlot,
      slotCount: payload.slotCount,
    }),
    onSuccess: async (updatedSchedules) => {
      const firstSchedule = updatedSchedules[0];
      toast.success(firstSchedule ? `${firstSchedule.courseCode} ${dayLabel(firstSchedule.dayOfWeek)} ${formatSlot(firstSchedule.timeSlot)} programı güncellendi.` : 'Ders programı güncellendi.');
      queryClient.invalidateQueries({ queryKey: ['weeklySchedules'] });
      queryClient.invalidateQueries({ queryKey: ['scheduleStatus'] });
      await notifyCourseStatus(updatedSchedules[0]?.courseId ?? form.courseId);
      closeModal();
    },
    onError: (err: AxiosError<ScheduleApiError>) => {
      const alert = apiErrorToValidationAlert(err, 'Ders programı güncellenemedi.');
      setBackendValidation(alert);
      toast.error(alert.title);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: scheduleService.delete,
    onSuccess: () => {
      toast.success('Ders programı kaldırıldı.');
      queryClient.invalidateQueries({ queryKey: ['weeklySchedules'] });
      queryClient.invalidateQueries({ queryKey: ['scheduleStatus'] });
      setDeletingSchedule(null);
    },
    onError: (error: unknown) => toast.error(mutationErrorMessage(error, 'Ders programı kaldırılamadı.')),
  });

  const updateTimeConfigMutation = useMutation({
    mutationFn: scheduleService.updateTimeConfiguration,
    onSuccess: (config) => {
      toast.success('Ders saatleri güncellendi.');
      if (config.affectedScheduleCount > 0) {
        toast.error(`${config.affectedScheduleCount} mevcut program kaydı yeni saat aralıklarının dışında kaldı.`);
      }
      queryClient.invalidateQueries({ queryKey: ['scheduleTimeConfiguration'] });
      queryClient.invalidateQueries({ queryKey: ['availableClassrooms'] });
      setIsTimeConfigModalOpen(false);
    },
    onError: (error: unknown) => toast.error(mutationErrorMessage(error, 'Ders saatleri güncellenemedi.')),
  });

  const saveSchedule = (payload: PendingScheduleSubmit) => {
    if (editingSchedule) updateMutation.mutate({ id: editingSchedule.id, payload });
    else createMutation.mutate(payload);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.courseId || !form.dayOfWeek || !form.timeSlot || !form.slotCount || !form.classroomId) {
      toast.error('Ders, gün, saat ve sınıf seçimi zorunludur.');
      return;
    }

    if (slotCountOptions.length === 0 || form.slotCount > maxSlotCount) {
      toast.error('Seçilen ders için bu başlangıç saatinde programlanabilir ders saati kalmadı.');
      return;
    }

    if (selectedClassroomOption && !selectedClassroomOption.selectable) {
      const alert = formValidationAlert ?? {
        title: 'Bu saate ders koyulamaz.',
        details: validationDetails(selectedClassroomOption),
      };
      setBackendValidation(alert);
      toast.error(alert.title);
      return;
    }

    const payload: PendingScheduleSubmit = {
      courseId: form.courseId,
      classroomId: form.classroomId,
      dayOfWeek: form.dayOfWeek,
      timeSlot: form.timeSlot,
      slotCount: form.slotCount,
    };

    if (selectedClassroomOption?.capacitySufficient === false) {
      setPendingCapacitySubmit(payload);
      return;
    }

    saveSchedule(payload);
  };

  const submitTimeConfig = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateTimeConfigMutation.mutate(timeConfigForm);
  };

  const notifyCourseStatus = async (courseId: string) => {
    const status = await scheduleService.getStatus(selectedSemester || undefined);
    const course = status.courses.find((item) => item.courseId === courseId);
    if (!course) return;
    if (course.status === 'INCOMPLETE') {
      toast.error(`${course.courseCode} için ${course.remainingHours} saat eksik.`);
    }
    if (course.status === 'OVER_SCHEDULED') {
      toast.error(`${course.courseCode} için haftalık ders saati ${Math.abs(course.remainingHours)} saat aşılmıştır.`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">{isReadOnly ? 'Haftalık Programım' : 'Ders Programı'}</h1>
          <p className="mt-0.5 text-[13px] text-slate-400">
            {isReadOnly ? 'Size atanan derslerin haftalık programını görüntüleyin.' : 'Bölüm derslerini haftalık takvime manuel yerleştirin.'}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          {!isReadOnly && (
            <SecondaryButton type="button" onClick={openTimeConfig} icon={<Settings className="h-4 w-4" />}>Saat Ayarları</SecondaryButton>
          )}
          <div className="flex w-full min-w-[180px] items-center gap-2 sm:w-44">
            <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
            <AppSelect
              value={selectedSemester}
              onChange={(value) => setSelectedSemester(value as Semester | '')}
              options={semesterOptions}
              placeholder="Dönem seçiniz"
              className="min-w-[150px]"
            />
          </div>
        </div>
      </div>

      {!isReadOnly && filteredScheduleStatus && (
        <div className="grid gap-3 xl:grid-cols-[1.1fr_1.4fr]">
          <ScheduleStatusOverview
            status={filteredScheduleStatus}
            isLoading={isStatusLoading}
            showCapacityWarnings={selectedGradeNumber === null}
            onShowDetails={() => setIsStatusModalOpen(true)}
          />
          {gradeScheduleSummary && (
            <GradeScheduleSummary
              gradeLabel={selectedGradeLabel}
              summary={gradeScheduleSummary}
              problemCourses={compactProblemCourses}
              onOpenCourse={(courseId) => openCreate(courseId)}
              onShowDetails={() => setIsStatusModalOpen(true)}
            />
          )}
        </div>
      )}

      {isReadOnly && (
        <section className="grid gap-3 sm:grid-cols-3">
          <SummaryMetric label="Ders" value={readOnlyScheduleSummary.courseCount} />
          <SummaryMetric label="Program Bloğu" value={readOnlyScheduleSummary.blockCount} />
          <SummaryMetric label="Ders Saati" value={readOnlyScheduleSummary.scheduledHours} />
        </section>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">Haftalık Ders Programı</h2>
          {isReadOnly && (
            <p className="mt-0.5 text-xs font-medium text-slate-400">
              Ders kartları salt okunurdur; düzenleme işlemleri bölüm admini tarafından yapılır.
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {!isReadOnly && (
            <PrimaryButton onClick={() => openCreate()} icon={<Plus className="h-4 w-4" />}>Programa Ders Ekle</PrimaryButton>
          )}
        </div>
      </div>

      {!isReadOnly && (
        <section className="rounded-2xl border border-slate-200/70 bg-white p-3">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
            <AppSelect
              value={selectedGrade}
              onChange={setSelectedGrade}
              options={gradeOptions}
              placeholder="Tüm sınıflar"
            />
            <AppSelect
              value={selectedAcademicianId}
              onChange={setSelectedAcademicianId}
              options={scheduleFilterOptions.academicians}
              searchable
              placeholder="Tüm akademisyenler"
              emptyText="Programda akademisyen bulunamadı"
            />
            <AppSelect
              value={selectedClassroomId}
              onChange={setSelectedClassroomId}
              options={scheduleFilterOptions.classrooms}
              searchable
              placeholder="Tüm derslikler"
              emptyText="Programda derslik bulunamadı"
            />
            <AppSelect
              value={selectedScheduleCourseId}
              onChange={setSelectedScheduleCourseId}
              options={scheduleFilterOptions.courses}
              searchable
              placeholder="Tüm dersler"
              emptyText="Programda ders bulunamadı"
            />
            <AppSelect
              value={selectedDayFilter}
              onChange={(value) => setSelectedDayFilter(value as ScheduleDay | '')}
              options={scheduleDays.map((day) => ({ label: day.label, value: day.value }))}
              placeholder="Tüm günler"
            />
            <SecondaryButton
              type="button"
              onClick={clearScheduleFilters}
              disabled={!hasScheduleFilters}
              className="h-12"
            >
              Filtreleri Temizle
            </SecondaryButton>
          </div>
        </section>
      )}

      {isLoading ? (
        <div className="grid gap-2">
          {[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl border border-slate-200/50 bg-white" />)}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-8 text-center">
          <p className="text-sm font-bold text-red-700">Ders programı yüklenemedi.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-700 transition hover:bg-red-50"
          >
            Tekrar Dene
          </button>
        </div>
      ) : timeSlots.length === 0 ? (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-8 text-center">
          <p className="text-sm font-bold text-amber-800">Ders saatleri oluşturulamadı. Saat ayarlarını kontrol edin.</p>
        </div>
      ) : visibleSchedules.length === 0 && visualScheduleItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <CalendarDays className="h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-base font-bold text-slate-700">
            {hasScheduleFilters
              ? 'Bu filtrelerle eşleşen ders programı bulunamadı.'
              : isReadOnly ? 'Henüz oluşturulmuş bir ders programınız bulunmuyor.' : 'Henüz haftalık ders programı oluşturulmadı.'}
          </h3>
          {!isReadOnly && !hasScheduleFilters && filteredScheduleStatus && filteredScheduleStatus.totalCourses > 0 && (
            <p className="mt-1 text-xs font-semibold text-slate-400">
              {selectedGradeLabel} için {filteredScheduleStatus.totalCourses} ders programlanmayı bekliyor.
            </p>
          )}
          {!isReadOnly && hasScheduleFilters && (
            <SecondaryButton type="button" onClick={clearScheduleFilters} className="mt-5">Filtreleri Temizle</SecondaryButton>
          )}
          {!isReadOnly && (
            <PrimaryButton onClick={() => openCreate()} className="mt-5" icon={<Plus className="h-4 w-4" />}>Programa Ders Ekle</PrimaryButton>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white">
          <div className="min-w-[980px]">
            <div className="grid" style={{ gridTemplateColumns: '116px repeat(5, minmax(160px, 1fr))' }}>
              <div className="border-b border-r border-slate-100 bg-slate-50 px-3 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Saat</div>
              {scheduleDays.map((day) => (
                <div key={day.value} className="border-b border-r border-slate-100 bg-slate-50 px-3 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                  {day.label}
                </div>
              ))}
            </div>
            <div className="relative grid" style={{ gridTemplateColumns: '116px repeat(5, minmax(160px, 1fr))', height: calendarBodyHeight }}>
              {timeSlots.map((slot) => {
                const top = (parseTimeToMinutes(slotStart(slot)) - calendarStartMinute) * CALENDAR_MINUTE_HEIGHT;
                const height = Math.max(1, (parseTimeToMinutes(slotEnd(slot)) - parseTimeToMinutes(slotStart(slot))) * CALENDAR_MINUTE_HEIGHT);
                return (
                  <div key={slot} className="contents">
                    <div
                      className="absolute left-0 w-[116px] border-r border-slate-100 px-3 pt-2 text-xs font-bold text-slate-500"
                      style={{ top, height }}
                    >
                      {formatSlot(slot)}
                    </div>
                    <div
                      className="absolute left-[116px] right-0 border-t border-slate-100"
                      style={{ top }}
                    />
                    {scheduleDays.map((day, index) => {
                      const cellSchedules = schedulesByCell.get(`${day.value}:${slot}`) ?? [];
                      const hasConflict = cellSchedules.some((schedule, scheduleIndex) =>
                        cellSchedules.findIndex((other) => other.classroomId === schedule.classroomId) !== scheduleIndex
                      );
                      return (
                        <div
                          key={`${day.value}-${slot}`}
                          className={cn('absolute border-r border-slate-100', hasConflict && 'bg-red-50/30')}
                          style={{ left: `calc(116px + ${index} * ((100% - 116px) / 5))`, width: 'calc((100% - 116px) / 5)', top, height }}
                        />
                      );
                    })}
                  </div>
                );
              })}
              {visualScheduleItems.map((item) => {
                const dayIndex = scheduleDays.findIndex((day) => day.value === item.dayOfWeek);
                const hasConflict = (schedulesByCell.get(`${item.dayOfWeek}:${item.startSlot}`) ?? []).some((schedule, index, cellSchedules) =>
                  cellSchedules.findIndex((other) => other.classroomId === schedule.classroomId) !== index
                );
                return (
                  <div
                    key={item.id}
                    className="absolute z-10 p-2"
                    style={{
                      left: `calc(116px + ${dayIndex} * ((100% - 116px) / 5))`,
                      width: 'calc((100% - 116px) / 5)',
                      top: item.top,
                      height: item.height,
                    }}
                  >
                    <ScheduleCard
                      schedule={item.schedule}
                      groupMeta={item.groupMeta}
                      hasConflict={hasConflict}
                      highlighted={highlightedCourseId === item.schedule.courseId}
                      exceptionType={item.exceptionType}
                      onOpenDetails={() => setScheduleDetail({ schedule: item.schedule, groupMeta: item.groupMeta, hasConflict })}
                      onEdit={() => openEdit(item.schedule)}
                      onDelete={() => setDeletingSchedule(item.schedule)}
                      isReadOnly={isReadOnly}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <FormModal isOpen={isModalOpen} onClose={closeModal} title={editingSchedule ? 'Ders Programını Düzenle' : 'Ders Programı Ekle'}>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1">
            <label className="dts-input-label">Ders</label>
            <AppSelect
              value={form.courseId}
              onChange={(courseId) => updateForm({ courseId })}
              options={courseOptions}
              searchable
              placeholder="Ders seçiniz"
              emptyText="Bu dönem için ders bulunamadı"
            />
          </div>

          <ReadonlyLecturer course={selectedCourse} />
          <CourseSummary course={selectedCourse} />

          {activeValidationAlert && <ScheduleValidationBanner alert={activeValidationAlert} />}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="dts-input-label">Gün</label>
              <AppSelect
                value={form.dayOfWeek}
                onChange={(dayOfWeek) => updateForm({ dayOfWeek: dayOfWeek as ScheduleDay })}
                options={scheduleDays.map((day) => ({ label: day.label, value: day.value }))}
                placeholder="Gün seçiniz"
              />
            </div>
            <div className="space-y-1">
              <label className="dts-input-label">Saat</label>
              <AppSelect
                value={form.timeSlot}
                onChange={(timeSlot) => updateForm({ timeSlot, slotCount: 1 })}
                options={(timeConfiguration?.slots ?? []).map((slot) => ({ label: slot.startTime, value: slot.value }))}
                placeholder="Saat seçiniz"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[160px_1fr]">
            <div className="space-y-1">
              <label className="dts-input-label">Ders Saati</label>
              <AppSelect
                value={String(form.slotCount)}
                onChange={(slotCount) => updateForm({ slotCount: Number(slotCount) })}
                options={slotCountOptions}
                placeholder="Saat"
                disabled={!form.timeSlot || slotCountOptions.length === 0}
              />
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Oluşacak Bloklar</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {selectedSlots.length === 0 ? (
                  <span className="text-xs font-semibold text-slate-400">Başlangıç saati seçiniz</span>
                ) : selectedSlots.map((slot) => (
                  <span key={slot} className="rounded-full border border-[#006482]/15 bg-white px-2 py-1 text-[11px] font-bold text-slate-600">
                    {formatSlot(slot)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <ClassroomPicker
            selectedClassroomId={form.classroomId}
            availableClassrooms={suitableClassrooms}
            alternativeClassrooms={alternativeClassrooms}
            unavailableClassrooms={busyClassrooms}
            loading={isClassroomsLoading}
            hasError={isClassroomsError}
            canQuery={canQueryClassrooms}
            onSelect={(classroomId) => updateForm({ classroomId })}
          />

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <SecondaryButton type="button" onClick={closeModal}>İptal</SecondaryButton>
            <PrimaryButton
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
              disabled={Boolean(selectedClassroomOption && !selectedClassroomOption.selectable)}
            >
              Kaydet
            </PrimaryButton>
          </div>
        </form>
      </FormModal>

      <ConfirmDialog
        isOpen={!!deletingSchedule}
        onClose={() => setDeletingSchedule(null)}
        onConfirm={() => deletingSchedule && deleteMutation.mutate(deletingSchedule.id)}
        title="Dersi Programdan Sil"
        message={deletingSchedule
          ? `${deletingSchedule.courseCode} - ${deletingSchedule.courseName} programdan kaldırılacak. Ders kaydı sistemde kalır.`
          : 'Bu ders programdan kaldırılacak. Ders kaydı sistemde kalır.'}
        confirmText="Programdan Sil"
        cancelText="Vazgeç"
        confirmLoading={deleteMutation.isPending}
      />

      <ConfirmDialog
        isOpen={!!pendingCapacitySubmit}
        onClose={() => setPendingCapacitySubmit(null)}
        onConfirm={() => {
          if (!pendingCapacitySubmit) return;
          saveSchedule(pendingCapacitySubmit);
          setPendingCapacitySubmit(null);
        }}
        title="Kapasite Uyarısı"
        message={selectedClassroomOption
          ? `Ders mevcudu ${selectedClassroomOption.studentCount ?? 0} kişi, seçilen derslik kapasitesi ${selectedClassroomOption.capacity} kişi. Bu derslik ders mevcudu için yetersizdir. Yine de kullanmak istiyor musunuz?`
          : 'Seçilen derslik ders mevcudu için yetersizdir. Yine de kullanmak istiyor musunuz?'}
        confirmText="Yine de Kullan"
        cancelText="Vazgeç"
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      />

      <FormModal isOpen={!!scheduleDetail} onClose={() => setScheduleDetail(null)} title="Ders Programı Detayı">
        {scheduleDetail && (
          <ScheduleDetailPanel
            detail={scheduleDetail}
            course={courseById.get(scheduleDetail.schedule.courseId) ?? null}
            onEdit={() => {
              setScheduleDetail(null);
              openEdit(scheduleDetail.schedule);
            }}
            onDelete={() => {
              setDeletingSchedule(scheduleDetail.schedule);
              setScheduleDetail(null);
            }}
            isReadOnly={isReadOnly}
          />
        )}
      </FormModal>

      <FormModal isOpen={isTimeConfigModalOpen} onClose={() => setIsTimeConfigModalOpen(false)} title="Ders Saatleri">
        <form onSubmit={submitTimeConfig} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <TimeInput label="Başlangıç" value={timeConfigForm.startTime} onChange={(startTime) => setTimeConfigForm((current) => ({ ...current, startTime }))} />
            <TimeInput label="Bitiş" value={timeConfigForm.endTime} onChange={(endTime) => setTimeConfigForm((current) => ({ ...current, endTime }))} />
            <NumberInput label="Ders Süresi" value={timeConfigForm.lessonDurationMinutes} onChange={(lessonDurationMinutes) => setTimeConfigForm((current) => ({ ...current, lessonDurationMinutes }))} />
            <NumberInput label="Ara Süresi" value={timeConfigForm.breakDurationMinutes} onChange={(breakDurationMinutes) => setTimeConfigForm((current) => ({ ...current, breakDurationMinutes }))} />
          </div>
          <label className="flex items-center gap-2 rounded-2xl border border-slate-200/70 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-600">
            <input
              type="checkbox"
              checked={timeConfigForm.lunchBreakEnabled}
              onChange={(event) => setTimeConfigForm((current) => ({ ...current, lunchBreakEnabled: event.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-[#006482] focus:ring-[#006482]"
            />
            Öğle arası kullan
          </label>
          <div className="grid grid-cols-2 gap-3">
            <TimeInput label="Öğle Başlangıç" value={timeConfigForm.lunchBreakStart} onChange={(lunchBreakStart) => setTimeConfigForm((current) => ({ ...current, lunchBreakStart }))} />
            <TimeInput label="Öğle Bitiş" value={timeConfigForm.lunchBreakEnd} onChange={(lunchBreakEnd) => setTimeConfigForm((current) => ({ ...current, lunchBreakEnd }))} />
          </div>
          {timeConfiguration && timeConfiguration.affectedScheduleCount > 0 && (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
              {timeConfiguration.affectedScheduleCount} mevcut program kaydı geçerli saat bloklarının dışında. Ayarlar değişirse kayıtlar silinmez veya taşınmaz.
            </div>
          )}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <SecondaryButton type="button" onClick={() => setIsTimeConfigModalOpen(false)}>İptal</SecondaryButton>
            <PrimaryButton type="submit" loading={updateTimeConfigMutation.isPending}>Kaydet</PrimaryButton>
          </div>
        </form>
      </FormModal>

      {filteredScheduleStatus && (
        <FormModal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} title="Program Durumu">
          <div className="space-y-3">
            {selectedGradeNumber === null && filteredScheduleStatus.capacityWarningCount > 0 && (
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                {filteredScheduleStatus.capacityWarningCount} program kaydında kapasite uyarısı var. Bu uyarılar eksik ders olarak değerlendirilmez.
              </div>
            )}
            {filteredScheduleStatus.courses.filter((course) => course.status === 'INCOMPLETE' || course.status === 'OVER_SCHEDULED').length === 0 && filteredScheduleStatus.courses.filter((course) => course.status === 'NOT_SCHEDULED').length === 0 ? (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                Seçili dönemde programı eksik ders bulunmuyor.
              </div>
            ) : (
              <>
                {filteredScheduleStatus.courses.filter((course) => course.status === 'INCOMPLETE' || course.status === 'OVER_SCHEDULED').length > 0 && (
                  <CourseStatusPanel title="Programı Tamamlanmayan Dersler" courses={filteredScheduleStatus.courses.filter((course) => course.status === 'INCOMPLETE' || course.status === 'OVER_SCHEDULED')} onOpenCourse={(courseId) => { setIsStatusModalOpen(false); openCreate(courseId); }} />
                )}
                {filteredScheduleStatus.courses.filter((course) => course.status === 'NOT_SCHEDULED').length > 0 && (
                  <CourseStatusPanel title="Henüz Programa Eklenmeyen Dersler" courses={filteredScheduleStatus.courses.filter((course) => course.status === 'NOT_SCHEDULED')} onOpenCourse={(courseId) => { setIsStatusModalOpen(false); openCreate(courseId); }} />
                )}
              </>
            )}
          </div>
        </FormModal>
      )}
    </div>
  );
};

function validationDetails(classroom: AvailableClassroomResponse) {
  if (classroom.conflictDetails && classroom.conflictDetails.length > 0) {
    return classroom.conflictDetails;
  }
  if (classroom.conflictMessage) {
    return [classroom.conflictMessage];
  }
  if (classroom.capacitySufficient === false) {
    return ['Bu derslik yeterli kapasiteye sahip değil.'];
  }
  return ['Seçilen zaman aralığı bu derslik için uygun değil.'];
}

function apiErrorToValidationAlert(error: AxiosError<ScheduleApiError>, fallback: string): ScheduleValidationAlert {
  const data = error.response?.data;
  const isScheduleConflict = Boolean(data?.code && data.code.includes('CONFLICT'));
  return {
    title: isScheduleConflict ? data?.message || 'Bu saate ders koyulamaz.' : fallback,
    details: data?.details && data.details.length > 0
      ? data.details
      : [data?.message || fallback],
  };
}

const ScheduleValidationBanner = ({ alert }: { alert: ScheduleValidationAlert }) => (
  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
    <div className="flex items-start gap-2">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <div className="min-w-0">
        <p className="font-extrabold">{alert.title}</p>
        <ul className="mt-1 space-y-1 font-semibold leading-snug text-amber-800">
          {alert.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

const TimeInput = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => (
  <div className="space-y-1">
    <label className="dts-input-label">{label}</label>
    <input
      type="time"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="dts-input"
      required
    />
  </div>
);

const NumberInput = ({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) => (
  <div className="space-y-1">
    <label className="dts-input-label">{label} (dk)</label>
    <input
      type="number"
      min={0}
      max={240}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="dts-input"
      required
    />
  </div>
);

const ReadonlyLecturer = ({ course }: { course: CourseResponse | null }) => (
  <div className="rounded-2xl border border-slate-200/70 bg-slate-50 px-3 py-2.5">
    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Akademisyen</p>
    <p className={cn('mt-1 text-sm font-semibold', course ? 'text-slate-700' : 'text-slate-400')}>
      {course?.academicianName ?? 'Ders seçildiğinde otomatik gösterilir'}
    </p>
  </div>
);

const CourseSummary = ({ course }: { course: CourseResponse | null }) => {
  if (!course) return null;
  const weeklyHours = course.theoreticalHours + course.practicalHours;
  return (
    <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-200/70 bg-white p-3 text-[11px] font-semibold text-slate-500">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ders</p>
        <p className="mt-1 truncate text-slate-800">{course.code} · {course.name}</p>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sınıf / Saat</p>
        <p className="mt-1 text-slate-800">{course.grade}. Sınıf · {weeklyHours} saat/hafta</p>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Öğrenci</p>
        <p className="mt-1 text-slate-800">{course.studentCount} kişi</p>
      </div>
    </div>
  );
};

const ClassroomPicker = ({
  selectedClassroomId,
  availableClassrooms,
  alternativeClassrooms,
  unavailableClassrooms,
  loading,
  hasError,
  canQuery,
  onSelect,
}: {
  selectedClassroomId: string;
  availableClassrooms: AvailableClassroomResponse[];
  alternativeClassrooms: AvailableClassroomResponse[];
  unavailableClassrooms: AvailableClassroomResponse[];
  loading: boolean;
  hasError: boolean;
  canQuery: boolean;
  onSelect: (classroomId: string) => void;
}) => {
  const allClassrooms = [...availableClassrooms, ...alternativeClassrooms, ...unavailableClassrooms];
  const selectedClassroom = allClassrooms.find((classroom) => classroom.id === selectedClassroomId);
  const studentCount = allClassrooms.find((classroom) => classroom.studentCount !== null && classroom.studentCount !== undefined)?.studentCount;
  return (
    <div className="space-y-2">
      <label className="dts-input-label">Sınıf</label>
      {!canQuery ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-semibold text-slate-400">
          Önce ders, gün ve saat seçiniz.
        </div>
      ) : loading ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-semibold text-slate-400">
          Sınıflar kontrol ediliyor...
        </div>
      ) : hasError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-3 py-3 text-xs font-semibold text-red-600">
          Derslikler yüklenirken bir hata oluştu.
        </div>
      ) : (
        <div className="max-h-[22rem] space-y-3 overflow-y-auto rounded-2xl border border-slate-200/70 bg-white p-3">
          <p className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-500">
            {studentCount !== undefined ? `Ders mevcudu: ${studentCount} kişi` : 'Ders mevcudu bulunamadı.'}
          </p>
          {allClassrooms.length === 0 ? (
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-400">Kullanılabilir derslik bulunamadı.</p>
          ) : (
            <>
              <ClassroomGroup title="Uygun Sınıflar" classrooms={availableClassrooms} selectedClassroomId={selectedClassroomId} onSelect={onSelect} />
              {availableClassrooms.length === 0 && alternativeClassrooms.length > 0 && (
                <p className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-700">
                  Yeterli kapasitede derslik bulunamadı.
                </p>
              )}
              <ClassroomGroup title="Alternatif Derslikler" classrooms={alternativeClassrooms} selectedClassroomId={selectedClassroomId} onSelect={onSelect} variant="warning" />
              <ClassroomGroup title="Uygun Olmayan Sınıflar" classrooms={unavailableClassrooms} selectedClassroomId={selectedClassroomId} onSelect={onSelect} disabled />
            </>
          )}
        </div>
      )}
      {selectedClassroom?.selectable && (
        <div className={cn(
          'rounded-2xl border px-3 py-2 text-xs font-semibold',
          selectedClassroom.capacitySufficient === false
            ? 'border-amber-100 bg-amber-50/70 text-amber-700'
            : 'border-emerald-100 bg-emerald-50/70 text-emerald-700',
        )}>
          {selectedClassroom.code} seçildi · Kapasite: {selectedClassroom.capacity} kişi · {selectedClassroom.capacitySufficient === false ? 'Kapasite yetersiz' : 'Zaman dilimi uygun'}
        </div>
      )}
    </div>
  );
};

const ClassroomGroup = ({
  title,
  classrooms,
  selectedClassroomId,
  disabled = false,
  variant = 'default',
  onSelect,
}: {
  title: string;
  classrooms: AvailableClassroomResponse[];
  selectedClassroomId: string;
  disabled?: boolean;
  variant?: 'default' | 'warning';
  onSelect: (classroomId: string) => void;
}) => (
  <div className="space-y-2">
    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{title}</p>
    {classrooms.length === 0 ? (
      <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-400">Kayıt yok</p>
    ) : (
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {classrooms.map((classroom) => {
      const selected = selectedClassroomId === classroom.id;
      return (
        <button
          key={classroom.id}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(classroom.id)}
          className={cn(
            'flex min-h-24 w-full items-start justify-between gap-2 rounded-xl border px-3 py-2 text-left transition',
            selected ? 'border-[#006482] bg-[#eff8ff] ring-2 ring-[#006482]/10' : variant === 'warning' ? 'border-amber-200 bg-amber-50/40' : 'border-slate-200 bg-white',
            disabled ? 'cursor-not-allowed opacity-75' : 'hover:border-[#006482]/30 hover:bg-[#eff8ff]',
          )}
        >
          <span className="min-w-0">
            <span className="block text-sm font-bold text-slate-800">{classroom.code} · {classroom.name}</span>
            <span className="mt-0.5 block text-[11px] font-semibold text-slate-500">
              {classroom.capacity} kişi · {classroomTypeLabels[classroom.type] ?? classroom.type}
            </span>
            {variant === 'warning' && classroom.studentCount !== null && classroom.studentCount !== undefined && (
              <span className="mt-1 block text-[11px] font-semibold text-amber-700">
                {classroom.studentCount - classroom.capacity} kişi kapasite eksik
              </span>
            )}
            {disabled && (
              <span className="mt-1 block space-y-0.5 text-[11px] font-semibold text-amber-700">
                {validationDetails(classroom).slice(0, 2).map((detail) => (
                  <span key={detail} className="block line-clamp-2">{detail}</span>
                ))}
              </span>
            )}
          </span>
          <span className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-black', selected ? 'border-[#006482] bg-[#006482] text-white' : 'border-slate-300 text-transparent')}>
            ✓
          </span>
        </button>
      );
        })}
      </div>
    )}
  </div>
);

const GradeScheduleSummary = ({
  gradeLabel,
  summary,
  problemCourses,
  onOpenCourse,
  onShowDetails,
}: {
  gradeLabel: string;
  summary: { courseCount: number; requiredHours: number; scheduledHours: number; missingHours: number; excessHours: number };
  problemCourses: CourseScheduleStatusItemResponse[];
  onOpenCourse: (courseId: string) => void;
  onShowDetails: () => void;
}) => (
  <section className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-[#f6fbfe] via-white to-[#e2f3fa] p-4 sm:p-5 shadow-xs relative overflow-hidden">
    <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#004b62] via-[#006482] to-[#fabc07]" />
    
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Sol Taraf: Metrikler */}
      <div className="min-w-0 lg:col-span-7 flex flex-col justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{gradeLabel} Program Özeti</p>
          <div className="mt-3 grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-2">
            <SummaryMetric label="Ders" value={summary.courseCount} />
            <SummaryMetric label="Saat" value={summary.requiredHours} />
            <SummaryMetric label="Planlanan" value={summary.scheduledHours} />
            <SummaryMetric label="Eksik" value={summary.missingHours} tone={summary.missingHours > 0 ? 'warn' : 'ok'} />
            <SummaryMetric label="Fazla" value={summary.excessHours} tone={summary.excessHours > 0 ? 'warn' : 'ok'} />
          </div>
        </div>
      </div>

      {/* Sağ Taraf: Sorunlu Dersler */}
      <div className="min-w-0 lg:col-span-5 border-t lg:border-t-0 lg:border-l border-slate-100/90 lg:pl-5 pt-4 lg:pt-0">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Eksik / Fazla Dersler ({problemCourses.length})</p>
          <button type="button" onClick={onShowDetails} className="text-[11px] font-bold text-[#006482] hover:underline">Detay</button>
        </div>
        {problemCourses.length === 0 ? (
          <p className="mt-3 rounded-xl bg-emerald-50 border border-emerald-100/60 px-3 py-2 text-xs font-semibold text-emerald-700">Seçili sınıf için program tamam.</p>
        ) : (
          <div className="mt-3 max-h-28 space-y-1.5 overflow-y-auto pr-1">
            {problemCourses.map((course) => (
              <button
                key={course.courseId}
                type="button"
                onClick={() => onOpenCourse(course.courseId)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white hover:border-[#88d0f2] hover:bg-[#eff8ff] px-3 py-2 text-left text-xs font-semibold transition duration-150"
              >
                <span className="min-w-0 truncate text-slate-700">{course.courseCode} - {course.courseName}</span>
                <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold border', course.remainingHours < 0 ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-amber-50 text-amber-700 border-amber-100')}>
                  {course.remainingHours < 0 ? `Fazla ${Math.abs(course.remainingHours)}` : `Eksik ${course.remainingHours}`}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  </section>
);

const SummaryMetric = ({ label, value, tone = 'default' }: { label: string; value: number; tone?: 'default' | 'warn' | 'ok' }) => (
  <div className={cn(
    'rounded-xl border px-3 py-2',
    tone === 'warn' ? 'border-amber-100 bg-amber-50' : tone === 'ok' ? 'border-emerald-100 bg-emerald-50' : 'border-slate-100 bg-slate-50',
  )}>
    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
    <p className={cn('mt-0.5 text-base font-black', tone === 'warn' ? 'text-amber-700' : tone === 'ok' ? 'text-emerald-700' : 'text-slate-800')}>{value}</p>
  </div>
);

const ScheduleDetailPanel = ({
  detail,
  course,
  onEdit,
  onDelete,
  isReadOnly = false,
}: {
  detail: ScheduleDetailState;
  course: CourseResponse | null;
  onEdit: () => void;
  onDelete: () => void;
  isReadOnly?: boolean;
}) => {
  const { schedule, groupMeta, hasConflict } = detail;
  const rows = [
    ['Ders', `${schedule.courseCode} - ${schedule.courseName}`],
    ['Sınıf Seviyesi', course ? `${course.grade}. Sınıf` : '-'],
    ['Akademisyen', schedule.academicianName],
    ['Derslik', `${schedule.classroomCode} - ${schedule.classroomName}`],
    ['Gün', dayLabel(schedule.dayOfWeek)],
    ['Saat', groupMeta?.timeRange ?? formatSlot(schedule.timeSlot)],
    ['Ders Saati', String(groupMeta?.slotCount ?? 1)],
  ];

  return (
    <div className="space-y-4">
      {hasConflict && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
          Bu program kaydında çakışma görünüyor.
        </div>
      )}
      <div className="rounded-2xl border border-slate-200/70 bg-white">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[120px_1fr] gap-3 border-b border-slate-100 px-3 py-2.5 last:border-b-0">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{label}</p>
            <p className="min-w-0 text-sm font-semibold text-slate-700">{value}</p>
          </div>
        ))}
      </div>
      {!isReadOnly && (
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <SecondaryButton type="button" onClick={onDelete}>Programdan Sil</SecondaryButton>
          <PrimaryButton type="button" onClick={onEdit}>Düzenle</PrimaryButton>
        </div>
      )}
    </div>
  );
};

const ScheduleStatusOverview = ({
  status,
  isLoading,
  showCapacityWarnings,
  onShowDetails,
}: {
  status: ScheduleCompletionResponse;
  isLoading: boolean;
  showCapacityWarnings: boolean;
  onShowDetails: () => void;
}) => {
  const hasCourses = status.totalCourses > 0;
  const hasScheduleProblems = status.incompleteCourses > 0 || status.notScheduledCourses > 0 || status.overScheduledCourses > 0;
  const visibleCapacityWarningCount = showCapacityWarnings ? status.capacityWarningCount : 0;
  const hasWarnings = hasScheduleProblems || visibleCapacityWarningCount > 0;
  const isComplete = hasCourses && !hasWarnings;
  const title = !hasCourses
    ? 'Programlanacak ders bulunmuyor'
    : !hasScheduleProblems && visibleCapacityWarningCount > 0
      ? 'Programda kapasite uyarıları var'
    : isComplete
      ? 'Ders programı tamamlandı'
      : 'Ders programı tamamlanmadı';
  const Icon = !hasCourses ? Circle : isComplete ? CheckCircle2 : AlertTriangle;

  return (
    <section className={cn(
      'rounded-2xl border px-4 py-3',
      !hasCourses ? 'border-slate-200 bg-white' : hasWarnings ? 'border-amber-100 bg-amber-50/70' : 'border-emerald-100 bg-emerald-50/70',
    )}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', !hasCourses ? 'text-slate-400' : hasWarnings ? 'text-amber-600' : 'text-emerald-600')} />
          <div className="min-w-0">
            <p className={cn('text-sm font-bold', !hasCourses ? 'text-slate-700' : hasWarnings ? 'text-amber-800' : 'text-emerald-800')}>
              {title}
            </p>
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              {isLoading
                ? 'Program durumu hesaplanıyor...'
                : !hasCourses
                  ? 'Bu seçim için programlanacak ders bulunmuyor.'
                  : `${status.completedCourses} tamamlandı · ${status.incompleteCourses} eksik · ${status.notScheduledCourses} programlanmadı · ${status.overScheduledCourses} fazla saat${showCapacityWarnings ? ` · ${status.capacityWarningCount} kapasite uyarısı` : ''}`}
            </p>
            {hasCourses && (
              <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                {status.scheduledHours} / {status.requiredHours} saat · Eksik {status.missingHours} · Fazla {status.excessHours}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-28">
            <div className="h-2 overflow-hidden rounded-full bg-white/80">
              <div className="h-full rounded-full bg-[#006482]" style={{ width: `${status.completionPercentage}%` }} />
            </div>
            <p className="mt-1 text-right text-[11px] font-bold text-slate-500">{status.completionPercentage}%</p>
          </div>
          <SecondaryButton type="button" onClick={onShowDetails}>Detayları Gör</SecondaryButton>
        </div>
      </div>
    </section>
  );
};

const CourseStatusPanel = ({
  title,
  courses,
  onOpenCourse,
}: {
  title: string;
  courses: CourseScheduleStatusItemResponse[];
  onOpenCourse: (courseId: string) => void;
}) => (
  <div className="rounded-2xl border border-slate-200/70 bg-white p-4">
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">{title}</h2>
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{courses.length}</span>
    </div>
    <div className="space-y-2">
      {courses.map((course) => (
        <div key={course.courseId} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">{course.courseCode} - {course.courseName}</p>
              <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-400">{course.academicianName} · {course.grade}. Sınıf</p>
            </div>
            <StatusBadge status={course.status} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] font-semibold text-slate-500">
            <span>Gereken: <b className="text-slate-800">{course.requiredHours}</b></span>
            <span>Planlanan: <b className="text-slate-800">{course.scheduledHours}</b></span>
            <span>{course.remainingHours < 0 ? 'Fazla' : 'Eksik'}: <b className="text-slate-800">{Math.abs(course.remainingHours)}</b></span>
          </div>
          <div className="mt-3 flex justify-end">
            <SecondaryButton type="button" onClick={() => onOpenCourse(course.courseId)}>Programa Git</SecondaryButton>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: CourseScheduleStatusItemResponse['status'] }) => {
  const meta = {
    COMPLETE: { label: 'Tamamlandı', cls: 'border-emerald-100 bg-emerald-50 text-emerald-700', icon: CheckCircle2 },
    INCOMPLETE: { label: 'Eksik', cls: 'border-amber-100 bg-amber-50 text-amber-700', icon: AlertTriangle },
    NOT_SCHEDULED: { label: 'Programlanmadı', cls: 'border-slate-200 bg-white text-slate-500', icon: Circle },
    OVER_SCHEDULED: { label: 'Fazla Saat', cls: 'border-rose-100 bg-rose-50 text-rose-700', icon: AlertTriangle },
  }[status];
  const Icon = meta.icon;
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold', meta.cls)}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
};

const ScheduleCard = ({
  schedule,
  groupMeta,
  hasConflict,
  highlighted = false,
  exceptionType,
  onOpenDetails,
  onEdit,
  onDelete,
  isReadOnly = false,
}: {
  schedule: WeeklyScheduleResponse;
  groupMeta?: ScheduleGroupMeta;
  hasConflict: boolean;
  highlighted?: boolean;
  exceptionType?: ScheduleExceptionType;
  onOpenDetails: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isReadOnly?: boolean;
}) => {
  const shouldCenterContent = (groupMeta?.slotCount ?? 1) >= 3;
  const compactCard = (groupMeta?.slotCount ?? 1) <= 2;
  const exceptionMeta = exceptionType
    ? {
      CANCELLED: { label: 'İPTAL', cls: 'border-red-200 bg-red-50 text-red-700', cardCls: 'border-red-200 bg-red-50' },
      MAKEUP: { label: 'TELAFİ', cls: 'border-amber-200 bg-amber-50 text-amber-700', cardCls: 'border-amber-200 bg-amber-50' },
      EXTRA: { label: 'EK DERS', cls: 'border-emerald-200 bg-emerald-50 text-emerald-700', cardCls: 'border-emerald-200 bg-emerald-50' },
    }[exceptionType]
    : null;
  return (
  <article
    role="button"
    tabIndex={0}
    onClick={onOpenDetails}
    onKeyDown={(event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onOpenDetails();
      }
    }}
    className={cn(
      'flex h-full flex-col overflow-hidden rounded-xl border p-2.5 shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#006482]/20',
      shouldCenterContent && 'justify-center',
      exceptionMeta ? exceptionMeta.cardCls : hasConflict ? 'border-red-200 bg-red-50' : 'border-[#006482]/15 bg-[#eff8ff]',
      highlighted && 'ring-2 ring-[#fabc07]/70',
    )}
  >
    <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className={cn('truncate text-xs font-extrabold text-slate-900', exceptionType === 'CANCELLED' && 'text-red-800')}>
              {compactCard ? schedule.courseName : schedule.courseCode}
            </p>
            {exceptionMeta && (
              <span className={cn('shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-black tracking-wide', exceptionMeta.cls)}>
                {exceptionMeta.label}
              </span>
            )}
          </div>
        {!compactCard && <p className="mt-0.5 line-clamp-2 text-[11px] font-semibold leading-snug text-slate-600">{schedule.courseName}</p>}
      </div>
      {!isReadOnly && (
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" onClick={(event) => { event.stopPropagation(); onEdit(); }} className="rounded-lg p-1 text-slate-400 transition hover:bg-white hover:text-[#006482]" aria-label="Düzenle">
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={(event) => { event.stopPropagation(); onDelete(); }} className="rounded-lg p-1 text-slate-400 transition hover:bg-white hover:text-red-600" aria-label="Sil">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
    {!compactCard && <div className="mt-2 space-y-1 text-[10px] font-semibold text-slate-500">
      <p className="flex items-center gap-1.5"><User className="h-3 w-3" /> <span className="truncate">{schedule.academicianName}</span></p>
      <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> <span className="truncate">{schedule.classroomCode} · {schedule.classroomName}</span></p>
      <p className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {groupMeta && groupMeta.slotCount > 1 ? `${groupMeta.slotCount} ders saati · ${groupMeta.timeRange}` : formatSlot(schedule.timeSlot)}</p>
      {exceptionType === 'CANCELLED' && <p className="flex items-center gap-1.5 font-bold text-red-700"><XCircle className="h-3 w-3" /> İPTAL EDİLDİ</p>}
      {hasConflict && <p className="flex items-center gap-1.5 font-bold text-red-600"><XCircle className="h-3 w-3" /> Çakışma</p>}
    </div>}
  </article>
  );
};
