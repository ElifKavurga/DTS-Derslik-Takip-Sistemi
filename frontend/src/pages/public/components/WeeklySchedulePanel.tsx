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
    <div className="min-w-0 flex-1">
      {/* Day header */}
      <div
        className={cn(
          'mb-2 rounded-xl px-2 py-2 text-center',
          isToday ? 'bg-[#006482] text-white' : 'bg-slate-50 text-slate-600',
        )}
      >
        <p className={cn('text-[11px] font-bold uppercase tracking-wide', isToday ? 'text-white/80' : 'text-slate-400')}>
          {SHORT_DAY_LABELS[day.dayOfWeek] ?? day.dayLabel}
        </p>
        <p className={cn('mt-0.5 text-xs font-semibold', isToday ? 'text-white' : 'text-slate-700')}>
          {new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'numeric' }).format(
            new Date(`${day.date}T12:00:00`),
          )}
        </p>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {day.items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-2 py-4 text-center text-[10px] font-medium text-slate-400">
            Ders yok
          </div>
        ) : (
          day.items.map((item) => {
            const badge = item.exceptionType ? EXCEPTION_BADGE[item.exceptionType] : null;
            return (
              <div
                key={`${item.sourceType}-${item.id}`}
                className={cn(
                  'rounded-xl border p-2 text-left shadow-sm',
                  badge?.className
                    ? 'border-amber-200 bg-amber-50'
                    : 'border-slate-200 bg-white',
                )}
              >
                <div className="flex items-center gap-1 text-[10px] font-bold text-[#006482]">
                  <Clock className="h-3 w-3 shrink-0" />
                  <span className="truncate">{item.startTime}–{item.endTime}</span>
                </div>
                <p className="mt-1 truncate text-[11px] font-bold text-slate-900" title={item.courseName}>
                  {item.courseName}
                </p>
                <p className="truncate text-[10px] text-slate-500">{item.courseCode}</p>
                {scheduleType !== 'academician' && item.academicianName && (
                  <p className="mt-1 flex items-center gap-1 truncate text-[10px] text-slate-400">
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
    <div className="border-t border-slate-100 pt-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Haftalık Program</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-700">
            <CalendarRange className="h-4 w-4 text-[#006482]" />
            <span>{formatWeekRange(weekStart, weekEnd)}</span>
            {isFetching && !isLoading && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPreviousWeek}
            className="dts-btn-secondary px-3"
            aria-label="Önceki hafta"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onThisWeek}
            className={cn(
              'dts-btn-secondary px-4 text-xs font-semibold',
              isCurrentWeek && 'border-[#006482] bg-[#eff8ff] text-[#006482]',
            )}
            aria-label="Bu hafta"
          >
            Bu Hafta
          </button>
          <button
            type="button"
            onClick={onNextWeek}
            className="dts-btn-secondary px-3"
            aria-label="Sonraki hafta"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      {isError ? (
        <div className="mt-4">
          <EmptyState title="Haftalık ders programı yüklenemedi." />
        </div>
      ) : isLoading ? (
        <div className="mt-4 grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-14 animate-pulse rounded-xl bg-slate-100" />
            </div>
          ))}
        </div>
      ) : schedule && totalItems === 0 ? (
        <div className="mt-4">
          <EmptyState title={emptyStateMessage ?? "Seçilen hafta için planlanmış ders bulunmuyor."} />
        </div>
      ) : schedule ? (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
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
