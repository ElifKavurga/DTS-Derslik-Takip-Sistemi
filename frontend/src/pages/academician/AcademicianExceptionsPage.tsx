import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle, ArrowRight, Ban, CalendarDays, RefreshCw,
  Search, X, CalendarPlus, Filter,
} from 'lucide-react';
import { AppSelect } from '@/components/ui/AppSelect';
import { FormModal } from '@/components/ui/FormModal';
import { PageHeader } from '@/components/ui/PageHeader';
import { scheduleExceptionService } from '@/services/scheduleExceptionService';
import { semesterService } from '@/services/semesterService';
import { apiClient } from '@/services/axios';
import { ScheduleExceptionResponse, ScheduleExceptionType, AcademicPeriod } from '@/types';
import { cn } from '@/utils/cn';

type TypeFilter = 'ALL' | ScheduleExceptionType;
type DateFilter = 'ALL' | 'TODAY' | 'WEEK' | 'FUTURE' | 'PAST';

const TYPE_META: Record<ScheduleExceptionType, { label: string; icon: typeof Ban; cls: string; dot: string }> = {
  CANCELLED: { label: 'İptal',    icon: Ban,          cls: 'border-red-200 bg-red-50 text-red-700',           dot: 'bg-red-400' },
  MAKEUP:    { label: 'Telafi',   icon: RefreshCw,    cls: 'border-amber-200 bg-amber-50 text-amber-700',     dot: 'bg-amber-400' },
  EXTRA:     { label: 'Ek Ders',  icon: CalendarPlus, cls: 'border-emerald-200 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-400' },
};

const typeOptions = [
  { label: 'Tüm Türler', value: 'ALL' },
  { label: 'İptaller',   value: 'CANCELLED' },
  { label: 'Telafiler',  value: 'MAKEUP' },
  { label: 'Ek Dersler', value: 'EXTRA' },
];

const dateOptions = [
  { label: 'Tüm Tarihler', value: 'ALL' },
  { label: 'Bugün',        value: 'TODAY' },
  { label: 'Bu Hafta',     value: 'WEEK' },
  { label: 'Gelecek',      value: 'FUTURE' },
  { label: 'Geçmiş',       value: 'PAST' },
];

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  return new Date(`${value}T12:00:00`).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric', weekday: 'long',
  });
};

const formatDateShort = (value?: string | null) => {
  if (!value) return '-';
  return new Date(`${value}T12:00:00`).toLocaleDateString('tr-TR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const isSameDay   = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const isThisWeek  = (date: Date) => {
  const today = startOfToday();
  const day   = today.getDay() || 7;
  const mon   = new Date(today); mon.setDate(today.getDate() - day + 1);
  const sun   = new Date(mon);   sun.setDate(mon.getDate() + 6);
  return date >= mon && date <= sun;
};
const exceptionDate = (item: ScheduleExceptionResponse) => new Date(`${item.targetDate}T12:00:00`);

// ── Summary Card ──────────────────────────────────────────────────────────────
const SummaryCard = ({
  label, value, tone = 'slate',
}: {
  label: string; value: number; tone?: 'slate' | 'red' | 'amber' | 'emerald';
}) => {
  const bg = {
    slate:   'from-[#f6fbfe] via-white to-[#e2f3fa]',
    red:     'from-[#fff5f5] via-white to-[#fff0f0]',
    amber:   'from-[#fffbeb] via-white to-[#fff9e6]',
    emerald: 'from-[#f0fdf4] via-white to-[#ecfdf5]',
  }[tone];
  const txt = {
    slate: 'text-slate-700', red: 'text-red-600', amber: 'text-amber-600', emerald: 'text-emerald-600',
  }[tone];

  return (
    <div className="group relative p-[1.5px] rounded-2xl transition-all duration-250 ease-out hover:-translate-y-0.5 cursor-default">
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-250 group-hover:opacity-100"
        style={{ background: 'linear-gradient(135deg, #007d9e, #2da44e, #fabc07)' }}
      />
      <div className={cn(
        'relative rounded-[14px] border border-slate-200/80 bg-gradient-to-br p-3 transition-shadow duration-250 group-hover:shadow-md h-full',
        bg,
      )}>
        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 leading-none">{label}</p>
        <p className={cn('mt-1.5 text-2xl font-black leading-none', txt)}>{value}</p>
      </div>
    </div>
  );
};

// ── Exception Row ─────────────────────────────────────────────────────────────
const ExceptionRow = ({ item, onClick }: { item: ScheduleExceptionResponse; onClick: () => void }) => {
  const meta = TYPE_META[item.type];
  const Icon = meta.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-2xl border border-slate-200/60 bg-white text-left shadow-xs transition-all duration-250 ease-out hover:-translate-y-0.5 hover:shadow-md"
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-250 group-hover:opacity-100"
        style={{ background: 'linear-gradient(135deg, #007d9e, #2da44e, #fabc07)', padding: '1.5px', zIndex: 0, borderRadius: 'inherit' }}
      >
        <div className="h-full w-full rounded-[14px] bg-white" />
      </div>

      <div className="relative z-10 flex items-center gap-3 px-4 py-3">
        <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border', meta.cls)}>
          <Icon className="h-3.5 w-3.5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-slate-900">{item.courseCode} · {item.courseName}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0 text-[11px] font-semibold text-slate-400">
            <span>{formatDateShort(item.targetDate)}</span>
            {item.timeSlot && <><span>·</span><span>{item.timeSlot}</span></>}
            {item.classroomCode && <><span>·</span><span>{item.classroomCode}</span></>}
          </p>
        </div>

        <span className={cn('shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold', meta.cls)}>
          <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
          {meta.label}
        </span>
      </div>
    </button>
  );
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <div className="flex items-center gap-3 rounded-2xl border border-slate-200/50 bg-white px-4 py-3">
    <div className="h-8 w-8 shrink-0 animate-pulse rounded-xl bg-slate-100" />
    <div className="flex-1 space-y-1.5">
      <div className="h-3 w-2/3 animate-pulse rounded-md bg-slate-100" />
      <div className="h-2.5 w-1/3 animate-pulse rounded-md bg-slate-100" />
    </div>
    <div className="h-5 w-16 animate-pulse rounded-full bg-slate-100" />
  </div>
);

// ── Exception Detail ──────────────────────────────────────────────────────────
const ExceptionDetail = ({ item, onOpenProgram }: { item: ScheduleExceptionResponse; onOpenProgram: () => void }) => {
  const meta = TYPE_META[item.type];
  const targetTitle  = item.type === 'MAKEUP' ? 'Telafi Dersi' : item.type === 'EXTRA' ? 'Ek Ders' : 'İptal Edilen Ders';
  const originalLine = item.originalDate
    ? `${formatDate(item.originalDate)} · ${item.originalTimeSlot ?? item.timeSlot}`
    : '-';

  return (
    <div className="space-y-3">
      <div className="relative -mx-6 -mt-6 overflow-hidden border-b border-slate-100 bg-gradient-to-br from-[#f6fbfe] via-white to-white px-6 py-4">
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#88d0f2]/10 blur-2xl" />
        <div className="relative min-w-0">
          <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold', meta.cls)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
            {meta.label}
          </span>
          <p className="mt-1.5 truncate text-sm font-bold text-slate-900">{item.courseCode} · {item.courseName}</p>
        </div>
      </div>

      {item.type !== 'EXTRA' && (
        <CompactInfoBlock title="Orijinal Ders" rows={[
          ['Tarih', originalLine],
          ['Derslik', item.originalClassroomCode
            ? `${item.originalClassroomCode}${item.originalClassroomName ? ` · ${item.originalClassroomName}` : ''}`
            : '-'],
        ]} />
      )}

      <CompactInfoBlock title={targetTitle} rows={[
        ['Tarih',    formatDate(item.targetDate)],
        ['Saat',     item.timeSlot ?? '-'],
        ['Süre',     `${item.slotCount ?? 1} saat`],
        ['Derslik',  item.classroomCode
          ? `${item.classroomCode}${item.classroomName ? ` · ${item.classroomName}` : ''}`
          : '-'],
      ]} />

      <div className="rounded-xl border border-[#006482]/10 bg-[#eff8ff] px-3 py-2 text-[11px] font-semibold text-[#006482]">
        Ana program değiştirilmemiştir; bu kayıt yalnızca ilgili tarih için geçerlidir.
      </div>

      <div className="-mx-6 -mb-6 border-t border-slate-100 px-6 py-3">
        <button
          type="button"
          onClick={onOpenProgram}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#006482]/20 bg-[#eff8ff] py-2 text-xs font-bold text-[#006482] shadow-xs transition hover:bg-[#ddf0fb] active:scale-95"
        >
          Ders Programında Gör
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

const CompactInfoBlock = ({ title, rows }: { title: string; rows: [string, string][] }) => (
  <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white">
    <p className="border-b border-slate-100 bg-slate-50/60 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-widest text-slate-400">{title}</p>
    {rows.map(([label, value]) => (
      <div key={label} className="grid grid-cols-[100px_1fr] gap-2 border-b border-slate-100 px-3 py-2 last:border-b-0">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
        <span className="min-w-0 truncate text-xs font-semibold text-slate-700">{value}</span>
      </div>
    ))}
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
export const AcademicianExceptionsPage = () => {
  const navigate = useNavigate();
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [dateFilter, setDateFilter] = useState<DateFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedException, setSelectedException] = useState<ScheduleExceptionResponse | null>(null);

  const { data: periods = [] } = useQuery({
    queryKey: ['academicPeriodsDropdown'],
    queryFn: () => semesterService.getAll(3),
  });

  const periodOptions = useMemo(() => {
    return [
      { label: 'Tüm Dönemler', value: 'ALL' },
      ...periods.map((p: AcademicPeriod) => ({ label: p.displayName, value: p.id })),
    ];
  }, [periods]);

  useEffect(() => {
    if (periods.length > 0 && !selectedSemester) {
      const active = periods.find((p: AcademicPeriod) => p.isActive) || periods[0];
      setSelectedSemester(active.id);
    }
  }, [periods, selectedSemester]);

  const { data: courses = [] } = useQuery({
    queryKey: ['academicianCourses', selectedSemester],
    queryFn: async () => {
      if (!selectedSemester || selectedSemester === 'ALL') return [];
      const res = await apiClient.get<any[]>('/academician/courses', { params: { periodId: selectedSemester } });
      return res.data;
    },
    enabled: !!selectedSemester,
  });

  const courseIdsInPeriod = useMemo(() => {
    return new Set(courses.map((c) => c.id));
  }, [courses]);

  const { data: exceptions = [], isLoading, error, refetch } = useQuery({
    queryKey: ['scheduleExceptions', 'academician'],
    queryFn: () => scheduleExceptionService.getMine(),
  });

  const filtered = useMemo(() => {
    const today = startOfToday();
    const q = searchQuery.trim().toLowerCase();

    let result = exceptions;
    if (selectedSemester && selectedSemester !== 'ALL') {
      result = result.filter((i) => courseIdsInPeriod.has(i.courseId));
    }

    return result
      .filter((i) => typeFilter === 'ALL' || i.type === typeFilter)
      .filter((i) => {
        const d = exceptionDate(i);
        if (dateFilter === 'TODAY')  return isSameDay(d, today);
        if (dateFilter === 'WEEK')   return isThisWeek(d);
        if (dateFilter === 'FUTURE') return d >= today;
        if (dateFilter === 'PAST')   return d < today;
        return true;
      })
      .filter((i) => !q || i.courseCode.toLowerCase().includes(q) || i.courseName.toLowerCase().includes(q))
      .sort((a, b) => exceptionDate(a).getTime() - exceptionDate(b).getTime());
  }, [selectedSemester, courseIdsInPeriod, exceptions, typeFilter, dateFilter, searchQuery]);

  const summary = useMemo(() => ({
    total:     filtered.length,
    cancelled: filtered.filter((i) => i.type === 'CANCELLED').length,
    makeup:    filtered.filter((i) => i.type === 'MAKEUP').length,
    extra:     filtered.filter((i) => i.type === 'EXTRA').length,
  }), [filtered]);

  const hasFilters = typeFilter !== 'ALL' || dateFilter !== 'ALL' || searchQuery.trim() !== '' || (selectedSemester !== '' && selectedSemester !== 'ALL');
  const clearFilters = () => {
    setTypeFilter('ALL');
    setDateFilter('ALL');
    setSearchQuery('');
    if (periods.length > 0) {
      const active = periods.find((p: AcademicPeriod) => p.isActive) || periods[0];
      setSelectedSemester(active.id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <PageHeader
        title="Ders Değişikliklerim"
        badge={
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-semibold text-amber-700 shrink-0">
            <RefreshCw className="h-3 w-3" />
            İstisnalar
          </span>
        }
        action={
          <Link
            to="/academician/ders-programi"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#006482]/20 bg-white px-3 text-xs font-bold text-[#006482] shadow-xs transition hover:bg-[#eff8ff]"
          >
            Programda Gör
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      {/* Summary Cards */}
      <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <SummaryCard label="Toplam"  value={summary.total} />
        <SummaryCard label="İptal"   value={summary.cancelled} tone="red" />
        <SummaryCard label="Telafi"  value={summary.makeup}    tone="amber" />
        <SummaryCard label="Ek Ders" value={summary.extra}     tone="emerald" />
      </section>

      {/* Toolbar */}
      <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-[#f6fbfe] via-white to-[#e2f3fa] p-3 shadow-xs">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ders ara…"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-9 text-xs font-semibold text-slate-800 placeholder:text-slate-400 shadow-xs transition hover:border-[#88d0f2] focus:border-[#006482] focus:ring-2 focus:ring-[#006482]/10 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Aramayı temizle"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filters dropdowns */}
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <AppSelect
              value={selectedSemester}
              onChange={(v) => setSelectedSemester(v)}
              options={periodOptions}
              className="h-10 w-44"
            />
            <AppSelect
              value={typeFilter}
              onChange={(v) => setTypeFilter(v as TypeFilter)}
              options={typeOptions}
              className="h-10 w-32"
            />
            <AppSelect
              value={dateFilter}
              onChange={(v) => setDateFilter(v as DateFilter)}
              options={dateOptions}
              className="h-10 w-32"
            />
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-xs transition hover:border-[#88d0f2] hover:bg-slate-50 active:scale-95 h-10"
              >
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                Temizle
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Count */}
      {!isLoading && !error && hasFilters && (
        <p className="px-1 text-[11px] font-semibold text-slate-400">
          {filtered.length} kayıt gösteriliyor{filtered.length !== exceptions.length && ` (toplam ${exceptions.length})`}
        </p>
      )}

      {/* Content area */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-gradient-to-br from-[#fff5f5] via-white to-[#fff0f0] px-4 py-10 text-center">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-red-100 text-red-500">
            <AlertCircle className="h-5 w-5" />
          </div>
          <h2 className="text-xs font-bold text-slate-850">Ders değişiklikleri yüklenemedi.</h2>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 rounded-lg bg-[#006482] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#00526b] active:scale-95"
          >
            Yeniden Dene
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-gradient-to-br from-[#f6fbfe] via-white to-[#e2f3fa] px-4 py-8 text-center">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200/50 text-slate-400">
            <CalendarDays className="h-4 w-4" />
          </div>
          <h2 className="text-xs font-bold text-slate-800">
            {hasFilters ? 'Filtrelere uygun değişiklik bulunamadı.' : 'Henüz bir ders değişikliği bulunmuyor.'}
          </h2>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-655 shadow-xs transition hover:bg-slate-50"
            >
              <X className="h-3 w-3" />
              Filtreleri Temizle
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <ExceptionRow key={item.id} item={item} onClick={() => setSelectedException(item)} />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <FormModal
        isOpen={!!selectedException}
        onClose={() => setSelectedException(null)}
        title="Değişiklik Detayı"
        maxWidthClassName="max-w-md"
      >
        {selectedException && (
          <ExceptionDetail
            item={selectedException}
            onOpenProgram={() => {
              setSelectedException(null);
              navigate(`/academician/ders-programi?courseId=${selectedException.courseId}`);
            }}
          />
        )}
      </FormModal>
    </div>
  );
};
