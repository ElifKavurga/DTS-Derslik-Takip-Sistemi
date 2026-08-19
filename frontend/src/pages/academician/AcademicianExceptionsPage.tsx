import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Ban, CalendarDays, RefreshCw, Search, X, CalendarPlus } from 'lucide-react';
import { AppSelect } from '@/components/ui/AppSelect';
import { FormModal } from '@/components/ui/FormModal';
import { PageHeader } from '@/components/ui/PageHeader';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { scheduleExceptionService } from '@/services/scheduleExceptionService';
import { ScheduleExceptionResponse, ScheduleExceptionType } from '@/types';
import { cn } from '@/utils/cn';

type TypeFilter = 'ALL' | ScheduleExceptionType;
type DateFilter = 'ALL' | 'TODAY' | 'WEEK' | 'FUTURE' | 'PAST';

const TYPE_META: Record<ScheduleExceptionType, { label: string; icon: typeof Ban; cls: string }> = {
  CANCELLED: { label: 'İPTAL', icon: Ban, cls: 'border-red-200 bg-red-50 text-red-700' },
  MAKEUP: { label: 'TELAFİ', icon: RefreshCw, cls: 'border-amber-200 bg-amber-50 text-amber-700' },
  EXTRA: { label: 'EK DERS', icon: CalendarPlus, cls: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
};

const typeOptions = [
  { label: 'Tümü', value: 'ALL' },
  { label: 'İptaller', value: 'CANCELLED' },
  { label: 'Telafiler', value: 'MAKEUP' },
  { label: 'Ek Dersler', value: 'EXTRA' },
];

const dateOptions = [
  { label: 'Tüm Tarihler', value: 'ALL' },
  { label: 'Bugün', value: 'TODAY' },
  { label: 'Bu Hafta', value: 'WEEK' },
  { label: 'Gelecek', value: 'FUTURE' },
  { label: 'Geçmiş', value: 'PAST' },
];

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  return new Date(`${value}T12:00:00`).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  });
};

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

const isThisWeek = (date: Date) => {
  const today = startOfToday();
  const day = today.getDay() || 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - day + 1);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return date >= monday && date <= sunday;
};

const exceptionDate = (item: ScheduleExceptionResponse) => new Date(`${item.targetDate}T12:00:00`);

export const AcademicianExceptionsPage = () => {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [dateFilter, setDateFilter] = useState<DateFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedException, setSelectedException] = useState<ScheduleExceptionResponse | null>(null);

  const { data: exceptions = [], isLoading, error, refetch } = useQuery({
    queryKey: ['scheduleExceptions', 'academician'],
    queryFn: () => scheduleExceptionService.getMine(),
  });

  const summary = useMemo(() => ({
    total: exceptions.length,
    cancelled: exceptions.filter((item) => item.type === 'CANCELLED').length,
    makeup: exceptions.filter((item) => item.type === 'MAKEUP').length,
    extra: exceptions.filter((item) => item.type === 'EXTRA').length,
  }), [exceptions]);

  const filtered = useMemo(() => {
    const today = startOfToday();
    const query = searchQuery.trim().toLowerCase();

    return exceptions
      .filter((item) => typeFilter === 'ALL' || item.type === typeFilter)
      .filter((item) => {
        const date = exceptionDate(item);
        if (dateFilter === 'TODAY') return isSameDay(date, today);
        if (dateFilter === 'WEEK') return isThisWeek(date);
        if (dateFilter === 'FUTURE') return date >= today;
        if (dateFilter === 'PAST') return date < today;
        return true;
      })
      .filter((item) => !query || item.courseCode.toLowerCase().includes(query) || item.courseName.toLowerCase().includes(query))
      .sort((a, b) => exceptionDate(a).getTime() - exceptionDate(b).getTime());
  }, [dateFilter, exceptions, searchQuery, typeFilter]);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <PageHeader
        title="Ders Değişikliklerim"
        description="Oluşturduğunuz program istisnalarını yönetin."
        badge={
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-semibold text-emerald-700 shrink-0">
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

      <section className="grid gap-3 sm:grid-cols-4">
        <SummaryCard label="Toplam" value={summary.total} />
        <SummaryCard label="İptal" value={summary.cancelled} tone="red" />
        <SummaryCard label="Telafi" value={summary.makeup} tone="amber" />
        <SummaryCard label="Ek Ders" value={summary.extra} tone="emerald" />
      </section>

      <section className="p-3 bg-gradient-to-br from-[#f6fbfe] via-white to-[#e2f3fa] rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Ders kodu veya adı ara..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-xs font-semibold text-slate-800 placeholder-slate-450 shadow-xs transition hover:border-[#88d0f2] focus:border-[#006482] focus:ring-2 focus:ring-[#006482]/10 focus:outline-none"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-450 hover:text-slate-700" aria-label="Aramayı temizle">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="grid gap-2.5 sm:w-[320px] sm:grid-cols-2">
          <AppSelect value={typeFilter} onChange={(value) => setTypeFilter(value as TypeFilter)} options={typeOptions} />
          <AppSelect value={dateFilter} onChange={(value) => setDateFilter(value as DateFilter)} options={dateOptions} />
        </div>
      </section>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white" />)}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50 px-4 py-12 text-center">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <h2 className="mt-3 text-sm font-bold text-red-700">Ders değişiklikleri yüklenemedi.</h2>
          <SecondaryButton type="button" onClick={() => refetch()} className="mt-4">Tekrar Dene</SecondaryButton>
        </div>
      ) : filtered.length === 0 ? (
        <div className="dts-card flex flex-col items-center justify-center py-10 px-4 text-center border-slate-200/80 bg-gradient-to-br from-[#f6fbfe] via-white to-[#e2f3fa]">
          <CalendarDays className="h-9 w-9 text-slate-400" />
          <h2 className="mt-2.5 text-xs font-bold text-slate-700">Henüz bir ders değişikliği bulunmuyor.</h2>
          <p className="mt-0.5 max-w-sm text-[11px] text-slate-450">İptal, telafi veya ek ders oluşturduğunuzda kayıtlar burada görünecek.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((item) => (
            <ExceptionRow key={item.id} item={item} onClick={() => setSelectedException(item)} />
          ))}
        </div>
      )}

      <FormModal isOpen={!!selectedException} onClose={() => setSelectedException(null)} title="Ders Değişikliği Detayı">
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

const SummaryCard = ({ label, value, tone = 'slate' }: { label: string; value: number; tone?: 'slate' | 'red' | 'amber' | 'emerald' }) => (
  <div className="relative group p-[1.5px] rounded-2xl transition-all duration-300 hover:-translate-y-0.5 cursor-pointer">
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#007d9e] via-[#00acc1] to-[#fabc07] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    
    <div className={cn(
      'relative rounded-[14px] p-3 border transition-all duration-300 text-left h-full bg-gradient-to-br border-slate-200/80',
      tone === 'red' ? 'from-[#fff5f5] via-white to-[#fff0f0] text-red-700' :
      tone === 'amber' ? 'from-[#fffbeb] via-white to-[#fff9e6] text-amber-700' :
      tone === 'emerald' ? 'from-[#f0fdf4] via-white to-[#ecfdf5] text-emerald-700' :
      'from-[#f6fbfe] via-white to-[#e2f3fa] text-slate-700'
    )}>
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-450 leading-none">{label}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  </div>
);

const ExceptionRow = ({ item, onClick }: { item: ScheduleExceptionResponse; onClick: () => void }) => {
  const meta = TYPE_META[item.type];
  const Icon = meta.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className="dts-interactive-card flex w-full flex-col gap-3 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-[#f6fbfe] via-white to-[#e2f3fa] p-3 text-left shadow-xs transition-all duration-300 hover:-translate-y-0.5 sm:flex-row sm:items-center"
    >
      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border', meta.cls)}>
        <Icon className="h-4.5 w-4.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-bold text-slate-900">{item.courseCode} - {item.courseName}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] font-semibold text-slate-450">
          <span>{formatDate(item.targetDate)}</span>
          <span>{item.timeSlot}</span>
          {item.classroomCode && <span>{item.classroomCode}</span>}
        </span>
      </span>
      <span className={cn('inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[9px] font-extrabold tracking-wide', meta.cls)}>
        {meta.label}
      </span>
    </button>
  );
};

const ExceptionDetail = ({ item, onOpenProgram }: { item: ScheduleExceptionResponse; onOpenProgram: () => void }) => {
  const meta = TYPE_META[item.type];
  const originalLine = item.originalDate
    ? `${formatDate(item.originalDate)} · ${item.originalTimeSlot ?? item.timeSlot}`
    : '-';
  const targetTitle = item.type === 'MAKEUP' ? 'Telafi Dersi' : item.type === 'EXTRA' ? 'Ek Ders' : 'İptal Edilen Ders';

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-slate-900">{item.courseCode} - {item.courseName}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">Program İstisnası</p>
        </div>
        <span className={cn('shrink-0 rounded-full border px-3 py-1 text-[10px] font-black tracking-wide', meta.cls)}>{meta.label}</span>
      </div>

      {item.type !== 'EXTRA' && (
        <InfoBlock title="Orijinal Ders" rows={[
          ['Tarih', originalLine],
          ['Derslik', item.originalClassroomCode ? `${item.originalClassroomCode} · ${item.originalClassroomName ?? ''}` : '-'],
        ]} />
      )}

      <InfoBlock title={targetTitle} rows={[
        ['Tarih', formatDate(item.targetDate)],
        ['Saat', item.timeSlot],
        ['Ders Saati', `${item.slotCount} saat`],
        ['Derslik', item.classroomCode ? `${item.classroomCode} · ${item.classroomName ?? ''}` : '-'],
      ]} />

      <div className="rounded-2xl border border-[#006482]/10 bg-[#eff8ff] px-3 py-2 text-xs font-semibold text-[#006482]">
        Ana program değiştirilmemiştir; bu kayıt yalnızca ilgili tarih için geçerlidir.
      </div>

      <div className="flex justify-end border-t border-slate-100 pt-4">
        <SecondaryButton type="button" onClick={onOpenProgram}>Programda Gör</SecondaryButton>
      </div>
    </div>
  );
};

const InfoBlock = ({ title, rows }: { title: string; rows: [string, string][] }) => (
  <div className="rounded-2xl border border-slate-200/70 bg-white">
    <p className="border-b border-slate-100 px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{title}</p>
    {rows.map(([label, value]) => (
      <div key={label} className="grid grid-cols-[110px_1fr] gap-3 border-b border-slate-100 px-3 py-2.5 last:border-b-0">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{label}</span>
        <span className="min-w-0 text-sm font-semibold text-slate-700">{value}</span>
      </div>
    ))}
  </div>
);
