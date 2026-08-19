import { useState, useMemo, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  BookOpen, Clock, Calendar, Tag, GraduationCap, Users,
  Search, X, CheckCircle2, AlertCircle, Circle,
  AlertTriangle, ChevronRight, MapPin, ArrowRight, Ban, CalendarPlus, RefreshCw
} from 'lucide-react';
import { AppSelect } from '@/components/ui/AppSelect';
import { FormModal } from '@/components/ui/FormModal';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { apiClient } from '@/services/axios';
import { PageHeader } from '@/components/ui/PageHeader';
import { scheduleService } from '@/services/scheduleService';
import { scheduleExceptionService } from '@/services/scheduleExceptionService';
import { semesterService } from '@/services/semesterService';
import { cn } from '@/utils/cn';
import { CourseType, Semester, AcademicPeriod } from '@/types';

// ── Types ────────────────────────────────────────────────────────────────────
interface ScheduleSlotSummary {
  scheduleId: string;
  dayOfWeek: string;
  timeSlot: string;
  classroomId: string;
  classroomCode: string;
  classroomName: string;
}

interface AcademicianCourseDetailResponse {
  id: string;
  code: string;
  name: string;
  departmentName: string;
  facultyName: string;
  theoreticalHours: number;
  practicalHours: number;
  ects: number;
  credits: number;
  studentCount: number;
  courseType: CourseType;
  semester: Semester;
  grade: number;
  active: boolean;
  scheduledHours: number;
  scheduleStatus: 'NOT_SCHEDULED' | 'INCOMPLETE' | 'COMPLETE' | 'OVER_SCHEDULED';
  scheduleSlots: ScheduleSlotSummary[];
}

// ── Meta mappings ─────────────────────────────────────────────────────────────
const SEMESTER_META: Record<Semester, { label: string; cls: string }> = {
  GUZ: { label: 'Güz', cls: 'bg-amber-50 text-amber-600 border-amber-200' },
  BAHAR: { label: 'Bahar', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  YAZ_OKULU: { label: 'Yaz Okulu', cls: 'bg-orange-50 text-orange-600 border-orange-200' },
};

const COURSE_TYPE_META: Record<CourseType, { label: string; cls: string }> = {
  ZORUNLU: { label: 'Zorunlu', cls: 'bg-rose-50 text-rose-600 border-rose-200' },
  SECMELI: { label: 'Seçmeli', cls: 'bg-sky-50 text-sky-600 border-sky-200' },
};

const SCHEDULE_STATUS_META = {
  COMPLETE: {
    label: 'Programlandı',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  INCOMPLETE: {
    label: 'Eksik',
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    cls: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  NOT_SCHEDULED: {
    label: 'Programlanmadı',
    icon: <Circle className="h-3.5 w-3.5" />,
    cls: 'bg-slate-50 text-slate-500 border-slate-200',
  },
  OVER_SCHEDULED: {
    label: 'Fazla Programlandı',
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    cls: 'bg-rose-50 text-rose-600 border-rose-200',
  },
};

const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Pzt',
  TUESDAY: 'Sal',
  WEDNESDAY: 'Çar',
  THURSDAY: 'Per',
  FRIDAY: 'Cum',
};

const todayValue = () => new Date().toISOString().slice(0, 10);

const DATE_DAY_TO_SCHEDULE_DAY = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const scheduleDayFromDate = (date: string) => date ? DATE_DAY_TO_SCHEDULE_DAY[new Date(`${date}T12:00:00`).getDay()] : '';

type LessonAction = 'cancel' | 'makeup' | 'extra';

type ExceptionFormState = {
  action: LessonAction | null;
  scheduleId: string;
  scheduleIds: string[];
  originalDate: string;
  targetDate: string;
  timeSlot: string;
  slotCount: number;
  classroomId: string;
};

const initialExceptionForm = (course: AcademicianCourseDetailResponse): ExceptionFormState => ({
  action: null,
  scheduleId: course.scheduleSlots[0]?.scheduleId ?? '',
  scheduleIds: course.scheduleSlots[0]?.scheduleId ? [course.scheduleSlots[0].scheduleId] : [],
  originalDate: todayValue(),
  targetDate: todayValue(),
  timeSlot: '',
  slotCount: 1,
  classroomId: '',
});

// ── DTS Custom Date Picker ────────────────────────────────────────────────────
const TR_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const TR_DAYS_SHORT = ['Pt', 'Sa', 'Çar', 'Per', 'Cu', 'Ct', 'Pz'];

const DtsDatePicker = ({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const [viewYear, setViewYear] = useState(() => value ? +value.slice(0, 4) : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => value ? +value.slice(5, 7) - 1 : today.getMonth());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const firstDay = (y: number, m: number) => {
    const d = new Date(y, m, 1).getDay();
    return d === 0 ? 6 : d - 1; // Mon-first
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const selectDay = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onChange(`${viewYear}-${m}-${d}`);
    setOpen(false);
  };

  const displayValue = value
    ? new Date(value + 'T12:00:00').toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'Tarih seçiniz';

  const blanks = firstDay(viewYear, viewMonth);
  const total = daysInMonth(viewYear, viewMonth);
  const cells: (number | null)[] = [...Array(blanks).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex h-10 w-full items-center gap-2 rounded-xl border bg-white px-3 text-left text-xs font-semibold shadow-xs transition',
          open ? 'border-[#006482] ring-2 ring-[#006482]/10' : 'border-slate-200 hover:border-[#88d0f2]',
          !value ? 'text-slate-400' : 'text-slate-800',
        )}
      >
        <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span className="flex-1 truncate">{displayValue}</span>
        <ChevronRight className={cn('h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-150', open ? 'rotate-90' : '')} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          {/* Month nav */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-br from-[#f6fbfe] to-white px-4 py-2.5">
            <button type="button" onClick={prevMonth} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
              <ChevronRight className="h-4 w-4 rotate-180" />
            </button>
            <span className="text-xs font-bold text-slate-700">{TR_MONTHS[viewMonth]} {viewYear}</span>
            <button type="button" onClick={nextMonth} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/60 px-2 py-1.5">
            {TR_DAYS_SHORT.map(d => (
              <div key={d} className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-px p-2">
            {cells.map((day, i) => {
              if (!day) return <div key={`e-${i}`} />;
              const m = String(viewMonth + 1).padStart(2, '0');
              const dStr = String(day).padStart(2, '0');
              const iso = `${viewYear}-${m}-${dStr}`;
              const isSelected = iso === value;
              const isToday = iso === todayStr;
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={cn(
                    'flex h-8 w-full items-center justify-center rounded-lg text-xs font-semibold transition-all duration-100',
                    isSelected
                      ? 'bg-[#006482] text-white shadow-sm'
                      : isToday
                        ? 'border border-[#006482]/30 text-[#006482] hover:bg-[#eff8ff]'
                        : 'text-slate-700 hover:bg-slate-100',
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2">
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); }}
              className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 transition"
            >
              Temizle
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(todayStr);
                setViewYear(today.getFullYear());
                setViewMonth(today.getMonth());
                setOpen(false);
              }}
              className="text-[11px] font-semibold text-[#006482] hover:text-[#00526b] transition"
            >
              Bugün
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Course Detail Modal ───────────────────────────────────────────────────────
const CourseDetailModal = ({
  course,
  onClose,
}: {
  course: AcademicianCourseDetailResponse;
  onClose: () => void;
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const statusMeta = SCHEDULE_STATUS_META[course.scheduleStatus];
  const [form, setForm] = useState<ExceptionFormState>(() => initialExceptionForm(course));
  const selectedAction = form.action;

  const selectedSchedule = course.scheduleSlots.find((slot) => slot.scheduleId === form.scheduleId) ?? course.scheduleSlots[0] ?? null;

  const { data: timeConfiguration } = useQuery({
    queryKey: ['scheduleTimeConfiguration'],
    queryFn: scheduleService.getTimeConfiguration,
  });

  const timeSlotOptions = useMemo(
    () => timeConfiguration?.slots.map((slot) => ({ label: `${slot.startTime} - ${slot.endTime}`, value: slot.value })) ?? [],
    [timeConfiguration],
  );

  const canQueryClassrooms = Boolean(
    selectedAction && selectedAction !== 'cancel' && course.id && form.targetDate && form.timeSlot && form.slotCount,
  );

  const targetDay = scheduleDayFromDate(form.targetDate);
  const cancelDay = scheduleDayFromDate(form.originalDate);
  const cancellationSlots = course.scheduleSlots.filter((slot) => slot.dayOfWeek === cancelDay);

  const { data: classrooms = [], isFetching: isClassroomsLoading, error: classroomsError } = useQuery({
    queryKey: ['academicianExceptionClassrooms', course.id, targetDay, form.timeSlot, form.slotCount],
    queryFn: () => scheduleService.getAvailableClassrooms({
      courseId: course.id,
      dayOfWeek: targetDay,
      timeSlot: form.timeSlot,
      slotCount: form.slotCount,
    }),
    enabled: canQueryClassrooms && targetDay !== 'SATURDAY' && targetDay !== 'SUNDAY',
  });

  const availableClassroomOptions = classrooms
    .filter((classroom) => classroom.selectable && classroom.capacitySufficient !== false)
    .map((classroom) => ({ label: `${classroom.code} - ${classroom.name} (${classroom.capacity} kişi)`, value: classroom.id }));
  const blockedClassroomDetails = classrooms
    .filter((classroom) => !classroom.selectable)
    .flatMap((classroom) => classroom.conflictDetails?.length ? classroom.conflictDetails : [classroom.conflictMessage])
    .filter((detail): detail is string => Boolean(detail))
    .slice(0, 3);
  const classroomErrorMessage = classroomsError
    ? ((classroomsError as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Derslikler yüklenemedi.')
    : null;

  const resetAction = () => setForm(initialExceptionForm(course));

  const handleSuccess = (message: string) => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ['academicianCourses'] });
    queryClient.invalidateQueries({ queryKey: ['weeklySchedules'] });
    queryClient.invalidateQueries({ queryKey: ['scheduleExceptions'] });
    // Reset form action panel back to neutral (button-only) state
    setForm(prev => ({ ...prev, action: null, timeSlot: '', classroomId: '', targetDate: todayValue(), originalDate: todayValue() }));
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  void resetAction; // kept for Vazgeç / direct calls

  const errorMessage = (error: unknown) => {
    const response = (error as { response?: { data?: { message?: string; details?: string[] } } }).response?.data;
    return response?.details?.[0] ?? response?.message ?? 'İşlem tamamlanamadı.';
  };

  const cancelMutation = useMutation({
    mutationFn: scheduleExceptionService.cancelLesson,
    onError: (error) => toast.error(errorMessage(error)),
  });

  const makeupMutation = useMutation({
    mutationFn: scheduleExceptionService.createMakeup,
    onSuccess: () => handleSuccess('Telafi dersi oluşturuldu.'),
    onError: (error) => toast.error(errorMessage(error)),
  });

  const extraMutation = useMutation({
    mutationFn: scheduleExceptionService.createExtraLesson,
    onSuccess: () => handleSuccess('Ek ders oluşturuldu.'),
    onError: (error) => toast.error(errorMessage(error)),
  });

  const submitAction = async () => {
    if (selectedAction === 'cancel') {
      await Promise.all(form.scheduleIds.map((scheduleId) => cancelMutation.mutateAsync({ scheduleId, date: form.originalDate })));
      handleSuccess(`${form.scheduleIds.length} ders saati seçilen tarih için iptal edildi.`);
    }
    if (selectedAction === 'makeup') {
      makeupMutation.mutate({
        scheduleId: form.scheduleId,
        originalDate: form.originalDate,
        makeupDate: form.targetDate,
        timeSlot: form.timeSlot,
        slotCount: form.slotCount,
        classroomId: form.classroomId,
      });
    }
    if (selectedAction === 'extra') {
      extraMutation.mutate({
        courseId: course.id,
        date: form.targetDate,
        timeSlot: form.timeSlot,
        slotCount: form.slotCount,
        classroomId: form.classroomId,
      });
    }
  };

  return (
    <FormModal isOpen onClose={onClose} title="Ders Detayı" maxWidthClassName="max-w-xl">
        {/* Header */}
        <div className="relative -mx-6 -mt-6 overflow-hidden border-b border-slate-100 bg-gradient-to-br from-[#eff8ff] via-white to-white px-6 py-4">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#88d0f2]/10 blur-2xl" />
          <div className="relative flex items-start justify-between gap-3 min-w-0">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold tracking-widest text-slate-600">
                {course.code}
              </span>
              <h2 className="mt-1.5 text-sm font-bold leading-snug text-slate-900">{course.name}</h2>
              <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                {course.departmentName} · {course.facultyName}
              </p>
            </div>
            <span className={cn('mt-0.5 shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold', statusMeta.cls)}>
              {statusMeta.icon}
              {statusMeta.label}
            </span>
          </div>
        </div>

        {/* Info grid — compact 3-col */}
        <div className="grid grid-cols-3 gap-2 py-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-2.5 py-2">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Dönem</p>
            <span className={cn('mt-1 inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-bold', SEMESTER_META[course.semester].cls)}>
              {SEMESTER_META[course.semester].label}
            </span>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-2.5 py-2">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Tür</p>
            <span className={cn('mt-1 inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-bold', COURSE_TYPE_META[course.courseType].cls)}>
              {COURSE_TYPE_META[course.courseType].label}
            </span>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-2.5 py-2">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Sınıf</p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800">{course.grade}. Sınıf</span>
              <span className={cn('inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[9px] font-bold', course.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-500 border-red-200')}>
                <span className={cn('h-1.5 w-1.5 rounded-full', course.active ? 'bg-emerald-500' : 'bg-red-400')} />
                {course.active ? 'Aktif' : 'Pasif'}
              </span>
            </div>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-2.5 py-2">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Haftalık</p>
            <p className="mt-1 text-xs font-bold text-slate-800">T:{course.theoreticalHours} U:{course.practicalHours}</p>
            <p className="text-[9px] text-slate-400">{course.ects} AKTS · {course.credits} Kredi</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-2.5 py-2">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Öğrenci</p>
            <p className="mt-1 text-xs font-bold text-slate-800">{course.studentCount} kişi</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-2.5 py-2">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Program</p>
            <p className="mt-1 text-xs font-bold text-slate-800">{course.scheduledHours}/{course.theoreticalHours + course.practicalHours} saat</p>
          </div>
        </div>

        {/* Schedule slots */}
        {course.scheduleSlots.length > 0 && (
          <div className="space-y-1.5 pb-3">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Program Slotları</p>
            {course.scheduleSlots.map((slot) => (
              <div key={slot.scheduleId} className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/40 px-3 py-1.5">
                <span className="flex h-6 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eff8ff] text-[10px] font-extrabold text-[#006482]">
                  {DAY_LABELS[slot.dayOfWeek] ?? slot.dayOfWeek}
                </span>
                <span className="flex-1 text-xs font-semibold text-slate-700">{slot.timeSlot}</span>
                <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {slot.classroomCode} · {slot.classroomName}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 rounded-2xl border border-slate-200/70 bg-slate-50/60 p-3">
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Ders İşlemleri</p>
          <div className="grid grid-cols-3 gap-2">
            <SecondaryButton
              type="button"
              className="h-9 w-full justify-center text-[11px]"
              disabled={!selectedSchedule}
              onClick={() => setForm((current) => {
                const daySlots = course.scheduleSlots.filter((slot) => slot.dayOfWeek === scheduleDayFromDate(current.originalDate));
                return { ...current, action: 'cancel', scheduleIds: daySlots.map((slot) => slot.scheduleId), scheduleId: daySlots[0]?.scheduleId ?? current.scheduleId };
              })}
              icon={<Ban className="h-3.5 w-3.5" />}
            >
              İptal Et
            </SecondaryButton>
            <SecondaryButton type="button" className="h-9 w-full justify-center text-[11px]" disabled={!selectedSchedule} onClick={() => setForm((current) => ({ ...current, action: 'makeup' }))} icon={<RefreshCw className="h-3.5 w-3.5" />}>
              Telafi
            </SecondaryButton>
            <SecondaryButton type="button" className="h-9 w-full justify-center text-[11px]" onClick={() => setForm((current) => ({ ...current, action: 'extra' }))} icon={<CalendarPlus className="h-3.5 w-3.5" />}>
              Ek Ders
            </SecondaryButton>
          </div>

          {selectedAction && (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {selectedAction === 'cancel' ? 'Dersi İptal Et' : selectedAction === 'makeup' ? 'Telafi Et' : 'Ek Ders Oluştur'}
                  </p>
                  <p className="mt-0.5 text-[10px] font-medium text-slate-400">Seçilen tarih için istisna kaydı oluşturur.</p>
                </div>
                <button type="button" onClick={resetAction} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700" aria-label="İşlemi kapat">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {selectedAction !== 'extra' && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="min-w-0 space-y-1">
                    <label className="dts-input-label">Program Slotu</label>
                    {selectedAction === 'cancel' ? (
                      <div className="max-h-36 space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2">
                        {cancellationSlots.length === 0 && (
                          <p className="px-2 py-1.5 text-xs font-semibold text-amber-700">Seçilen tarihte program slotu yok.</p>
                        )}
                        {cancellationSlots.map((slot) => {
                          const checked = form.scheduleIds.includes(slot.scheduleId);
                          return (
                            <label key={slot.scheduleId} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(event) => setForm((current) => ({
                                  ...current,
                                  scheduleIds: event.target.checked
                                    ? [...current.scheduleIds, slot.scheduleId]
                                    : current.scheduleIds.filter((id) => id !== slot.scheduleId),
                                  scheduleId: event.target.checked ? slot.scheduleId : current.scheduleId,
                                }))}
                                className="h-4 w-4 rounded border-slate-300 text-[#006482] focus:ring-[#006482]"
                              />
                              <span className="min-w-0 truncate">{DAY_LABELS[slot.dayOfWeek] ?? slot.dayOfWeek} · {slot.timeSlot} · {slot.classroomCode}</span>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <AppSelect
                        value={form.scheduleId}
                        onChange={(scheduleId) => setForm((current) => ({ ...current, scheduleId, scheduleIds: [scheduleId] }))}
                        options={course.scheduleSlots.map((slot) => ({ label: `${DAY_LABELS[slot.dayOfWeek] ?? slot.dayOfWeek} · ${slot.timeSlot} · ${slot.classroomCode}`, value: slot.scheduleId }))}
                        placeholder="Slot seçiniz"
                        className="h-10"
                      />
                    )}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <label className="dts-input-label">{selectedAction === 'cancel' ? 'İptal Tarihi' : 'İptal Edilecek Tarih'}</label>
                    <DtsDatePicker
                      value={form.originalDate}
                      onChange={(nextDate) => setForm((current) => {
                        if (selectedAction !== 'cancel') {
                          return { ...current, originalDate: nextDate };
                        }
                        const daySlots = course.scheduleSlots.filter((slot) => slot.dayOfWeek === scheduleDayFromDate(nextDate));
                        return {
                          ...current,
                          originalDate: nextDate,
                          scheduleIds: daySlots.map((slot) => slot.scheduleId),
                          scheduleId: daySlots[0]?.scheduleId ?? '',
                        };
                      })}
                    />
                  </div>
                </div>
              )}

              {selectedAction !== 'cancel' && (
                <>
                  {/* Date picker — full width so dropdown can open */}
                  <div className="space-y-1">
                    <label className="dts-input-label">{selectedAction === 'makeup' ? 'Telafi Tarihi' : 'Ek Ders Tarihi'}</label>
                    <DtsDatePicker
                      value={form.targetDate}
                      onChange={(val) => setForm((current) => ({ ...current, targetDate: val, classroomId: '' }))}
                    />
                  </div>
                  {/* Saat + Süre */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="min-w-0 space-y-1">
                      <label className="dts-input-label">Saat</label>
                      <AppSelect
                        value={form.timeSlot}
                        onChange={(timeSlot) => setForm((current) => ({ ...current, timeSlot, classroomId: '' }))}
                        options={timeSlotOptions}
                        placeholder="Saat seçiniz"
                        className="h-10"
                      />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <label className="dts-input-label">Süre</label>
                      <AppSelect
                        value={String(form.slotCount)}
                        onChange={(slotCount) => setForm((current) => ({ ...current, slotCount: Number(slotCount), classroomId: '' }))}
                        options={Array.from({ length: 6 }, (_, index) => ({ label: `${index + 1} saat`, value: String(index + 1) }))}
                        placeholder="Süre"
                        className="h-10"
                      />
                    </div>
                  </div>
                  <div className="min-w-0 space-y-1">
                    <label className="dts-input-label">Derslik</label>
                    <AppSelect
                      value={form.classroomId}
                      onChange={(classroomId) => setForm((current) => ({ ...current, classroomId }))}
                      options={availableClassroomOptions}
                      disabled={!canQueryClassrooms || isClassroomsLoading || Boolean(classroomsError)}
                      placeholder={isClassroomsLoading ? 'Derslikler kontrol ediliyor...' : 'Derslik seçiniz'}
                      emptyText="Uygun derslik bulunamadı"
                      className="h-10"
                    />
                    {canQueryClassrooms && !isClassroomsLoading && classroomErrorMessage && (
                      <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700">
                        {classroomErrorMessage}
                      </div>
                    )}
                    {canQueryClassrooms && !isClassroomsLoading && !classroomErrorMessage && availableClassroomOptions.length === 0 && (
                      <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800">
                        Bu tarih ve saat için uygun derslik bulunamadı.
                        {blockedClassroomDetails.length > 0 && (
                          <ul className="mt-1 list-disc space-y-0.5 pl-4">
                            {blockedClassroomDetails.map((detail) => (
                              <li key={detail}>{detail}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}

              {selectedAction === 'cancel' && selectedSchedule && (
                <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800">
                  {selectedSchedule.timeSlot} saatindeki ders yalnızca seçilen tarihte iptal edilecek; haftalık program değişmeyecek.
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-2">
                <SecondaryButton type="button" onClick={resetAction}>Vazgeç</SecondaryButton>
                <PrimaryButton
                  type="button"
                  onClick={submitAction}
                  loading={cancelMutation.isPending || makeupMutation.isPending || extraMutation.isPending}
                  disabled={
                    (selectedAction === 'makeup' && !form.scheduleId)
                    || (selectedAction === 'cancel' && (!form.originalDate || form.scheduleIds.length === 0))
                    || (selectedAction === 'makeup' && (!form.originalDate || !form.targetDate || !form.timeSlot || !form.classroomId))
                    || (selectedAction === 'extra' && (!form.targetDate || !form.timeSlot || !form.classroomId))
                  }
                >
                  {selectedAction === 'cancel' ? 'Dersi İptal Et' : selectedAction === 'makeup' ? 'Telafi Oluştur' : 'Ek Dersi Oluştur'}
                </PrimaryButton>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="-mx-6 -mb-6 mt-3 border-t border-slate-100 px-6 py-3">
          <button
            type="button"
            onClick={() => { onClose(); navigate(`/academician/ders-programi?courseId=${course.id}`); }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#006482]/20 bg-[#eff8ff] py-2 text-xs font-bold text-[#006482] shadow-xs transition hover:bg-[#ddf0fb] active:scale-95"
          >
            Ders Programında Gör
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
    </FormModal>
  );
};



/*
            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold tracking-widest text-slate-600">
                {course.code}
              </span>
              <h2 className="mt-2 text-base font-bold leading-snug text-slate-900">{course.name}</h2>
              <p className="mt-1 text-xs font-medium text-slate-400">
                {course.departmentName} · {course.facultyName}
              </p>
            </div>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onClose();
              }}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-sm transition hover:bg-slate-50 hover:text-slate-700 active:scale-95"
              aria-label="Kapat"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        Body
        <div className="p-6 space-y-5">
          Info grid
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Dönem</p>
              <span className={cn('mt-1.5 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold', SEMESTER_META[course.semester].cls)}>
                {SEMESTER_META[course.semester].label}
              </span>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tür</p>
              <span className={cn('mt-1.5 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold', COURSE_TYPE_META[course.courseType].cls)}>
                {COURSE_TYPE_META[course.courseType].label}
              </span>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Haftalık Saat</p>
              <p className="mt-1 text-sm font-bold text-slate-800">
                T: {course.theoreticalHours} · U: {course.practicalHours}
              </p>
              <p className="text-[10px] text-slate-400">AKTS: {course.ects} · Kredi: {course.credits}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sınıf & Durum</p>
              <p className="mt-1 text-sm font-bold text-slate-800">{course.grade}. Sınıf</p>
              <span className={cn('mt-0.5 inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-bold', course.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-500 border-red-200')}>
                <span className={cn('h-1.5 w-1.5 rounded-full', course.active ? 'bg-emerald-500' : 'bg-red-400')} />
                {course.active ? 'Aktif' : 'Pasif'}
              </span>
            </div>
          </div>

          Schedule status
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Program Durumu</p>
              <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold', statusMeta.cls)}>
                {statusMeta.icon}
                {statusMeta.label}
              </span>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
              <p className="text-xs text-slate-500">
                <span className="font-bold text-slate-800">{course.scheduledHours}</span>
                {' '}/ {course.theoreticalHours + course.practicalHours} saat programlandı
              </p>
            </div>
          </div>

          Schedule slots
          {course.scheduleSlots.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Program Slotları</p>
              <div className="space-y-1.5">
                {course.scheduleSlots.map((slot, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/40 px-3 py-2">
                    <span className="flex h-7 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eff8ff] text-[10px] font-extrabold text-[#006482]">
                      {DAY_LABELS[slot.dayOfWeek] ?? slot.dayOfWeek}
                    </span>
                    <span className="flex-1 text-xs font-semibold text-slate-700">{slot.timeSlot}</span>
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {slot.classroomCode} · {slot.classroomName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        Footer
        <div className="border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={() => { onClose(); navigate(`/academician/ders-programi?courseId=${course.id}`); }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#006482]/20 bg-[#eff8ff] py-2.5 text-xs font-bold text-[#006482] shadow-sm transition hover:bg-[#ddf0fb] active:scale-95"
          >
            Ders Programında Gör
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
*/

// ── Course Card ────────────────────────────────────────────────────────────────
const CourseCard = ({
  course,
  onDetail,
}: {
  course: AcademicianCourseDetailResponse;
  onDetail: () => void;
}) => {
  const statusMeta = SCHEDULE_STATUS_META[course.scheduleStatus];
  const firstSlot = course.scheduleSlots[0];

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-xs transition-all duration-250 ease-out hover:-translate-y-0.5 hover:shadow-md" style={{}}>
      {/* Gradient border on hover — achieved via pseudo-ring using box-shadow override and a gradient top bar that slides in */}
      {/* We use a before-like approach: wrap with a gradient container on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-250 group-hover:opacity-100" style={{ background: 'linear-gradient(135deg, #007d9e, #2da44e, #fabc07)', padding: '2px', zIndex: 0, borderRadius: 'inherit' }}>
        <div className="h-full w-full rounded-[14px] bg-white" />
      </div>

      {/* Card content */}
      <div className="relative z-10 flex flex-col gap-3 p-4">
        {/* Top: code badge + status */}
        <div className="flex items-start justify-between gap-2">
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold tracking-widest text-slate-600 shrink-0">
            {course.code}
          </span>
          <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold shrink-0', statusMeta.cls)}>
            {statusMeta.icon}
            {statusMeta.label}
          </span>
        </div>

        {/* Course name */}
        <div className="min-w-0">
          <p className="text-[13px] font-bold leading-snug text-slate-900 line-clamp-2" title={course.name}>
            {course.name}
          </p>
          <p className="mt-0.5 truncate text-[10px] font-medium text-slate-400">{course.departmentName}</p>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
            <GraduationCap className="h-3 w-3 shrink-0 text-slate-400" />
            <span>{course.grade}. Sınıf</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
            <Users className="h-3 w-3 shrink-0 text-slate-400" />
            <span>{course.studentCount} kişi</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
            <Clock className="h-3 w-3 shrink-0 text-slate-400" />
            <span>T:{course.theoreticalHours} U:{course.practicalHours} · {course.ects}AKTS</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
            <Calendar className="h-3 w-3 shrink-0 text-slate-400" />
            <span>{SEMESTER_META[course.semester].label}</span>
          </div>
          {firstSlot && (
            <div className="col-span-2 flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
              <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
              <span>{DAY_LABELS[firstSlot.dayOfWeek]} · {firstSlot.timeSlot} · {firstSlot.classroomCode}</span>
            </div>
          )}
        </div>

        {/* Footer: badges + detail button */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100/80">
          <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide', COURSE_TYPE_META[course.courseType].cls)}>
            {COURSE_TYPE_META[course.courseType].label}
          </span>
          <div className="flex-1" />
          <button
            type="button"
            onClick={onDetail}
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 shadow-xs transition-all duration-150 hover:border-[#006482]/40 hover:bg-[#eff8ff] hover:text-[#006482] active:scale-95"
          >
            Detay
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Skeleton Card ─────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/50 bg-white p-4 shadow-xs">
    <div className="flex items-start justify-between gap-2">
      <div className="h-4 w-20 animate-pulse rounded-md bg-slate-100" />
      <div className="h-4 w-20 animate-pulse rounded-full bg-slate-100" />
    </div>
    <div className="space-y-1.5">
      <div className="h-4 w-3/4 animate-pulse rounded-md bg-slate-100" />
      <div className="h-3 w-1/2 animate-pulse rounded-md bg-slate-100" />
    </div>
    <div className="grid grid-cols-2 gap-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-3 animate-pulse rounded-md bg-slate-100" />
      ))}
    </div>
    <div className="flex items-center justify-between border-t border-slate-100 pt-2">
      <div className="h-4 w-14 animate-pulse rounded-full bg-slate-100" />
      <div className="h-7 w-16 animate-pulse rounded-xl bg-slate-100" />
    </div>
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
export const AcademicianCoursesPage = () => {
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailCourse, setDetailCourse] = useState<AcademicianCourseDetailResponse | null>(null);

  const { data: periods = [] } = useQuery({
    queryKey: ['academicPeriodsDropdown'],
    queryFn: () => semesterService.getAll(3),
  });

  const periodOptions = useMemo(() => {
    return [
      { label: 'Tüm Dönemler', value: '' },
      ...periods.map((p: AcademicPeriod) => ({ label: p.displayName, value: p.id })),
    ];
  }, [periods]);

  useEffect(() => {
    if (periods.length > 0 && !selectedSemester) {
      const active = periods.find((p: AcademicPeriod) => p.isActive) || periods[0];
      setSelectedSemester(active.id);
    }
  }, [periods, selectedSemester]);

  const { data: courses, isLoading, error, refetch } = useQuery({
    queryKey: ['academicianCourses', selectedSemester],
    queryFn: async () => {
      const params = selectedSemester ? { periodId: selectedSemester } : undefined;
      const res = await apiClient.get<AcademicianCourseDetailResponse[]>('/academician/courses', { params });
      return res.data;
    },
  });

  const filtered = useMemo(() => {
    if (!courses) return [];
    if (!searchQuery.trim()) return courses;
    const q = searchQuery.trim().toLowerCase();
    return courses.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.departmentName.toLowerCase().includes(q),
    );
  }, [courses, searchQuery]);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <PageHeader
        title="Derslerim"
        badge={
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-semibold text-emerald-700 shrink-0">
            <BookOpen className="h-3 w-3" />
            Dersler
          </span>
        }
        action={
          courses && (
            <div className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-1.5 shadow-xs backdrop-blur-sm">
              <Tag className="h-3.5 w-3.5 text-[#006482]" />
              <span className="text-xs font-bold text-slate-700">
                {filtered.length} ders
              </span>
            </div>
          )
        }
      />

      {/* Toolbar */}
      <div className="p-3 bg-gradient-to-br from-[#f6fbfe] via-white to-[#e2f3fa] rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Ders ara…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-xs font-semibold text-slate-800 placeholder:text-slate-400 shadow-xs transition hover:border-[#88d0f2] focus:border-[#006482] focus:ring-2 focus:ring-[#006482]/10 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Period filter — inline chips (compact for ≤4 options) */}
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          {periodOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelectedSemester(opt.value)}
              className={cn(
                'rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-xs transition-all duration-150 whitespace-nowrap',
                selectedSemester === opt.value
                  ? 'border-[#006482]/30 bg-[#eff8ff] text-[#006482]'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {error && !isLoading && (
        <div className="dts-card flex flex-col items-center justify-center py-10 px-4 text-center border-slate-200/80 bg-gradient-to-br from-[#fff5f5] via-white to-[#fff0f0]">
          <div className="mb-3.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-red-500 border border-red-100">
            <AlertCircle className="h-5 w-5" />
          </div>
          <h3 className="text-xs font-bold text-slate-800">Dersler yüklenemedi</h3>
          <p className="mt-0.5 max-w-xs text-[11px] text-slate-500 leading-normal">
            Veriler alınırken bir sorun oluştu. Lütfen tekrar deneyin.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3.5 rounded-lg bg-[#006482] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#00526b] active:scale-95"
          >
            Yeniden Dene
          </button>
        </div>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <div className="dts-card flex flex-col items-center justify-center py-8 px-4 text-center border-slate-200/80 bg-gradient-to-br from-[#f6fbfe] via-white to-[#e2f3fa]">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#006482] border border-slate-200/50">
            <BookOpen className="h-4 w-4" />
          </div>
          <h3 className="text-xs font-bold text-slate-800">
            {searchQuery ? 'Arama sonucu bulunamadı' : 'Bu dönemde size atanmış ders bulunmuyor.'}
          </h3>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-3 flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-xs transition hover:bg-slate-50"
            >
              <X className="h-3 w-3" />
              Aramayı Temizle
            </button>
          )}
        </div>
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onDetail={() => setDetailCourse(course)}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {detailCourse && (
        <CourseDetailModal
          course={detailCourse}
          onClose={() => setDetailCourse(null)}
        />
      )}
    </div>
  );
};