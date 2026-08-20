import { CalendarRange, ChevronLeft, ChevronRight, Clock, Loader2, UserRound } from 'lucide-react';
import { PublicWeeklyScheduleDayResponse, PublicWeeklyScheduleResponse } from '@/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/utils/cn';
import { formatWeekRange, getCurrentWeekStart, getWeekEnd, toDateValue } from '@/utils/date';

const EXCEPTION_BADGE: Record<string, { label: string; className: string }> = {
  MAKEUP: { label: 'Telafi', className: 'bg-amber-100 text-amber-700' },
  EXTRA: { label: 'Ek Ders', className: 'bg-blue-100 text-blue-700' },
  CANCELLED: { label: 'İptal', className: 'bg-red-100 text-red-700' },
};

const SHORT_DAY_LABELS: Record<string, string> = {
  MONDAY: 'Pzt',
  TUESDAY: 'Sal',
  WEDNESDAY: 'Çrş',
  THURSDAY: 'Prş',
  FRIDAY: 'Cum',
  SATURDAY: 'Cmt',
  SUNDAY: 'Paz',
};

const WeeklyDayColumn = ({ day, scheduleType }: { day: PublicWeeklyScheduleDayResponse, scheduleType?: 'classroom' | 'department' | 'academician' }) => {
  const isToday = day.date === toDateValue(new Date());
  return (
    <div className="min-w-0 flex-1 group/day">
      {/* Day header */}
      <div
        className={cn(
          'mb-2 rounded-xl px-2 py-1.5 text-center transition-all duration-300',
          isToday
            ? 'bg-[#006482] text-white shadow-xs font-semibold'
            : 'bg-white/90 border border-slate-200/60 text-slate-600 hover:bg-[#eff8ff] hover:text-[#006482] hover:border-[#006482]/20',
        )}
      >
        <p className={cn('text-[10px] font-extrabold uppercase tracking-wider transition-colors', isToday ? 'text-white/80' : 'text-slate-400 group-hover/day:text-[#006482]/70')}>
          {SHORT_DAY_LABELS[day.dayOfWeek] ?? day.dayLabel}
        </p>
        <p className={cn('mt-0.5 text-xs font-bold', isToday ? 'text-white' : 'text-slate-700')}>
          {new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'numeric' }).format(
            new Date(`${day.date}T12:00:00`),
          )}
        </p>
      </div>

      {/* Items */}
      <div className="space-y-1.5">
        {day.items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white/40 px-1 py-3 text-center text-[10px] font-bold text-slate-400 select-none">
            Ders yok
          </div>
        ) : (
          day.items.map((item) => {
            const badge = item.exceptionType ? EXCEPTION_BADGE[item.exceptionType] : null;
            return (
              <div
                key={`${item.sourceType}-${item.id}`}
                className={cn(
                  'group relative p-[1.5px] rounded-xl transition-all duration-300 hover:-translate-y-0.5',
                  badge?.className ? 'shadow-xs hover:shadow-sm' : 'shadow-xs hover:shadow-md',
                )}
              >
                {/* Gradient border on hover — sadece normal (exception olmayan) kartlarda */}
                {!badge && (
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#006482] via-[#00a896] to-[#fabc07] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  />
                )}
                <div
                  className={cn(
                    'relative overflow-hidden rounded-[10px] border p-2 text-left transition-colors duration-300',
                    badge?.className
                      ? 'border-amber-200 bg-amber-50/80'
                      : 'border-slate-200/80 bg-gradient-to-br from-white via-white to-[#eff8ff] group-hover:border-transparent',
                  )}
                >
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-[#006482]">
                  <Clock className="h-3 w-3 shrink-0" />
                  <span className="truncate">{item.startTime}–{item.endTime}</span>
                </div>
                <p className="mt-1 font-bold text-slate-800 text-[11px] leading-tight break-words line-clamp-2" title={item.courseName}>
                  {item.courseName}
                </p>
                <p className="text-[10px] font-semibold text-slate-450 mt-0.5">{item.courseCode}</p>
                {scheduleType !== 'academician' && item.academicianName && (
                  <p className="mt-1 flex items-center gap-1 truncate text-[10px] text-slate-400 font-medium">
                    <UserRound className="h-2.5 w-2.5 shrink-0" />
                    {item.academicianName}
                  </p>
                )}
                {badge && (
                  <span
                    className={cn(
                      'mt-1.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold',
                      badge.className,
                    )}
                  >
                    {badge.label}
                  </span>
                )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export const WeeklySchedulePanel = ({
  title,
  weekStart,
  schedule,
  isLoading,
  isFetching,
  isError,
  emptyStateMessage,
  scheduleType,
  onPreviousWeek,
  onThisWeek,
  onNextWeek,
}: {
  title: string;
  weekStart: string;
  schedule: PublicWeeklyScheduleResponse | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  emptyStateMessage?: string;
  scheduleType?: 'classroom' | 'department' | 'academician';
  onPreviousWeek: () => void;
  onThisWeek: () => void;
  onNextWeek: () => void;
}) => {
  const weekEnd = toDateValue(getWeekEnd(weekStart));
  const isCurrentWeek = weekStart === getCurrentWeekStart();

  const totalItems = schedule?.days.reduce((sum, day) => sum + day.items.length, 0) ?? 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-extrabold text-slate-700 tracking-tight">{title}</h3>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Haftalık Program</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs font-bold text-[#006482]">
            <CalendarRange className="h-4 w-4 shrink-0 text-[#006482]" />
            <span>{formatWeekRange(weekStart, weekEnd)}</span>
            {isFetching && !isLoading && (
              <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onPreviousWeek}
            className="dts-btn-secondary h-9 w-9 p-0 rounded-xl"
            aria-label="Önceki hafta"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onThisWeek}
            className={cn(
              'dts-btn-secondary h-9 px-4 text-xs font-bold rounded-xl transition-all duration-300',
              isCurrentWeek
                ? 'border-[#006482]/20 bg-[#eff8ff] text-[#006482] shadow-xs'
                : 'bg-white hover:bg-slate-50',
            )}
            aria-label="Bu hafta"
          >
            Bu Hafta
          </button>
          <button
            type="button"
            onClick={onNextWeek}
            className="dts-btn-secondary h-9 w-9 p-0 rounded-xl"
            aria-label="Sonraki hafta"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      {isError ? (
        <div>
          <EmptyState title="Haftalık ders programı yüklenemedi." />
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
            </div>
          ))}
        </div>
      ) : schedule && totalItems === 0 ? (
        <div>
          <EmptyState title={emptyStateMessage ?? "Seçilen hafta için planlanmış ders bulunmuyor."} />
        </div>
      ) : schedule ? (
        <div className="max-w-full overflow-x-auto rounded-[20px] border border-slate-200/60 bg-white/40 p-2 shadow-xs">
          <div className="flex min-w-[560px] gap-2">
            {schedule.days.map((day) => (
              <WeeklyDayColumn key={day.date} day={day} scheduleType={scheduleType} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};
