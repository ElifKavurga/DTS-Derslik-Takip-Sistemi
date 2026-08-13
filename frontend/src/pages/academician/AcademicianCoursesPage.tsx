import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Clock, Calendar, Tag, GraduationCap,
  Search, X, CheckCircle2, AlertCircle, Circle,
  AlertTriangle, ChevronRight, MapPin, ArrowRight
} from 'lucide-react';
import { apiClient } from '@/services/axios';
import { cn } from '@/utils/cn';
import { CourseType, Semester } from '@/types';

// ── Types ────────────────────────────────────────────────────────────────────
interface ScheduleSlotSummary {
  dayOfWeek: string;
  timeSlot: string;
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

// ── Course Detail Modal ───────────────────────────────────────────────────────
const CourseDetailModal = ({
  course,
  onClose,
}: {
  course: AcademicianCourseDetailResponse;
  onClose: () => void;
}) => {
  const navigate = useNavigate();
  const statusMeta = SCHEDULE_STATUS_META[course.scheduleStatus];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" />

      {/* Modal Panel */}
      <div
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-2xl shadow-slate-300/40"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-[#eff8ff] via-white to-white px-6 py-5">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#88d0f2]/10 blur-2xl" />
          <div className="flex items-start justify-between gap-4">
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
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-sm transition hover:bg-slate-50 hover:text-slate-700 active:scale-95"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Info grid */}
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

          {/* Schedule status */}
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

          {/* Schedule slots */}
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

        {/* Footer */}
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

// ── Course Row / Card ─────────────────────────────────────────────────────────
const CourseRow = ({
  course,
  onDetail,
}: {
  course: AcademicianCourseDetailResponse;
  onDetail: () => void;
}) => {
  const statusMeta = SCHEDULE_STATUS_META[course.scheduleStatus];
  const firstSlot = course.scheduleSlots[0];

  return (
    <div className="group relative flex items-center gap-4 rounded-2xl border border-slate-200/50 bg-white px-5 py-4 transition-all duration-200 ease-out hover:-translate-y-px hover:border-[#88d0f2]/60 hover:shadow-lg hover:shadow-slate-200/70">
      <div className="absolute inset-y-0 left-0 w-[3px] rounded-l-2xl bg-transparent transition-colors duration-200 group-hover:bg-[#006482]" />

      {/* Kod + Ad */}
      <div className="w-56 shrink-0 min-w-0 border-r border-slate-100 pr-4">
        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold tracking-widest text-slate-600">
          {course.code}
        </span>
        <p className="mt-1.5 truncate text-[13px] font-bold leading-snug text-slate-900" title={course.name}>
          {course.name}
        </p>
        <p className="mt-0.5 truncate text-[10px] font-medium text-slate-400">{course.departmentName}</p>
      </div>

      {/* Meta bilgiler */}
      <div className="flex-1 min-w-0 grid grid-cols-2 gap-x-6 gap-y-1.5 px-2">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
          <GraduationCap className="h-3 w-3 shrink-0 text-slate-400" />
          <span>{course.grade}. Sınıf</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
          <Clock className="h-3 w-3 shrink-0 text-slate-400" />
          <span>T: {course.theoreticalHours} · U: {course.practicalHours} · AKTS: {course.ects}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
          <Calendar className="h-3 w-3 shrink-0 text-slate-400" />
          <span>{SEMESTER_META[course.semester].label}</span>
        </div>
        {firstSlot ? (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
            <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
            <span>{DAY_LABELS[firstSlot.dayOfWeek]} · {firstSlot.timeSlot} · {firstSlot.classroomCode}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate">
            <MapPin className="h-3 w-3 shrink-0" />
            <span>Program yok</span>
          </div>
        )}
      </div>

      {/* Badges + Aksiyon */}
      <div className="flex shrink-0 items-center gap-2">
        <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide', SEMESTER_META[course.semester].cls)}>
          {SEMESTER_META[course.semester].label}
        </span>
        <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide', COURSE_TYPE_META[course.courseType].cls)}>
          {COURSE_TYPE_META[course.courseType].label}
        </span>
        <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold', statusMeta.cls)}>
          {statusMeta.icon}
          {statusMeta.label}
        </span>

        <button
          type="button"
          onClick={onDetail}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm transition-all duration-150 hover:border-[#006482]/40 hover:bg-[#eff8ff] hover:text-[#006482] active:scale-95"
        >
          Detay
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <div className="flex items-center gap-4 rounded-2xl border border-slate-200/50 bg-white px-5 py-4">
    <div className="w-56 shrink-0 space-y-2 border-r border-slate-100 pr-4">
      <div className="h-4 w-20 animate-pulse rounded-md bg-slate-100" />
      <div className="h-4 w-36 animate-pulse rounded-md bg-slate-100" />
    </div>
    <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-2 px-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-3 animate-pulse rounded-md bg-slate-100" />
      ))}
    </div>
    <div className="flex shrink-0 items-center gap-2">
      <div className="h-5 w-14 animate-pulse rounded-full bg-slate-100" />
      <div className="h-5 w-14 animate-pulse rounded-full bg-slate-100" />
      <div className="h-7 w-16 animate-pulse rounded-xl bg-slate-100" />
    </div>
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
export const AcademicianCoursesPage = () => {
  const [selectedSemester, setSelectedSemester] = useState<Semester | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailCourse, setDetailCourse] = useState<AcademicianCourseDetailResponse | null>(null);

  const { data: courses, isLoading, error, refetch } = useQuery({
    queryKey: ['academicianCourses', selectedSemester],
    queryFn: async () => {
      const params = selectedSemester ? { semester: selectedSemester } : undefined;
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

  const semesterOptions: { value: Semester | ''; label: string }[] = [
    { value: '', label: 'Tüm Dönemler' },
    { value: 'GUZ', label: 'Güz' },
    { value: 'BAHAR', label: 'Bahar' },
    { value: 'YAZ_OKULU', label: 'Yaz Okulu' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-3xl border border-[#006482]/15 bg-gradient-to-br from-[#eff8ff] via-white to-white p-6 shadow-md md:p-8">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#88d0f2]/10 blur-2xl" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#006482]/10 text-[#006482]">
                <BookOpen className="h-4.5 w-4.5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Derslerim</h1>
            </div>
            <p className="text-xs font-medium text-slate-400">
              Sisteme atanmış derslerinizi ve program bilgilerini görüntüleyin.
            </p>
          </div>
          {courses && (
            <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200/60 bg-white/70 px-4 py-2.5 shadow-sm">
              <Tag className="h-4 w-4 text-[#006482]" />
              <span className="text-sm font-bold text-slate-700">
                {filtered.length} ders
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Ders kodu veya adı ara…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-10 text-sm font-medium text-slate-800 placeholder-slate-400 shadow-sm transition focus:border-[#006482]/40 focus:outline-none focus:ring-2 focus:ring-[#006482]/10"
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

        {/* Semester Filter */}
        <div className="flex shrink-0 items-center gap-2">
          {semesterOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelectedSemester(opt.value)}
              className={cn(
                'rounded-2xl border px-3.5 py-2 text-xs font-semibold shadow-sm transition-all duration-150 whitespace-nowrap',
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
        <div className="space-y-2.5">
          {[1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)}
        </div>
      )}

      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200/60 bg-white py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-400">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Dersler yüklenemedi</h3>
          <p className="mt-1 max-w-xs text-xs font-medium text-slate-400 leading-normal">
            Veriler alınırken bir sorun oluştu. Lütfen tekrar deneyin.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 rounded-xl bg-[#006482] px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-[#00526b] active:scale-95"
          >
            Yeniden Dene
          </button>
        </div>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200/60 bg-white py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
            <BookOpen className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            {searchQuery ? 'Arama sonucu bulunamadı' : 'Henüz atanmış ders yok'}
          </h3>
          <p className="mt-1 max-w-xs text-xs font-medium text-slate-400 leading-normal">
            {searchQuery
              ? 'Farklı bir arama terimi deneyin.'
              : 'Bölüm admininiz sizi bir derse atadığında burada görünecek.'}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-4 flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              <X className="h-3 w-3" />
              Aramayı Temizle
            </button>
          )}
        </div>
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <div className="space-y-2.5">
          {filtered.map((course) => (
            <CourseRow
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
