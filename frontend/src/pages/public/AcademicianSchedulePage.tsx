import { useCallback, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LogIn, Presentation } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { AppSelect } from '@/components/ui/AppSelect';
import { EmptyState } from '@/components/ui/EmptyState';
import { publicCampusService } from '@/services/publicCampusService';
import { WeeklySchedulePanel } from './components/WeeklySchedulePanel';
import { getCurrentWeekStart, getWeekStart, shiftDate, toDateValue, getWeekEnd } from '@/utils/date';
import { PublicAcademicianResponse } from '@/types';

// Yardımcı fonksiyonlar
const findDefaultAcademician = (academicians: PublicAcademicianResponse[]) => {
  if (academicians.length === 0) return undefined;
  return academicians[0];
};

const formatAcademicianName = (acc: PublicAcademicianResponse) => {
  return [acc.title, acc.firstName, acc.lastName].filter(Boolean).join(' ');
};

export const AcademicianSchedulePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedAcademicianId = searchParams.get('academician') || '';
  const weekAnchor = searchParams.get('week') || getCurrentWeekStart();

  const updateParams = useCallback((updates: Record<string, string | undefined>, replace = true) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      let changed = false;
      Object.entries(updates).forEach(([key, value]) => {
        const currentValue = next.get(key);
        if (value === undefined || value === '') {
          if (next.has(key)) {
            next.delete(key);
            changed = true;
          }
        } else {
          if (currentValue !== value) {
            next.set(key, value);
            changed = true;
          }
        }
      });
      return changed ? next : prev;
    }, { replace });
  }, [setSearchParams]);

  const {
    data: academiciansData,
    isLoading: isAcademiciansLoading,
    isError: isAcademiciansError,
  } = useQuery({
    queryKey: ['public', 'academicians'],
    queryFn: publicCampusService.getAcademicians,
  });

  const academicians = useMemo(() => academiciansData?.academicians ?? [], [academiciansData?.academicians]);

  // Varsayılan seçimler ve temizleme mantığı
  useEffect(() => {
    if (selectedAcademicianId || academicians.length === 0) return;
    const defaultAcademician = findDefaultAcademician(academicians);
    updateParams({ academician: defaultAcademician?.id ?? '' });
  }, [academicians, selectedAcademicianId, updateParams]);


  const academicianOptions = useMemo(() => academicians.map((acc) => ({ value: acc.id, label: formatAcademicianName(acc) })), [academicians]);

  const weekEnd = toDateValue(getWeekEnd(weekAnchor));

  const {
    data: weeklyData,
    isLoading: isScheduleLoading,
    isFetching: isScheduleFetching,
    isError: isScheduleError,
  } = useQuery({
    queryKey: ['public', 'academician-weekly-schedule', selectedAcademicianId, weekAnchor, weekEnd],
    queryFn: () => publicCampusService.getAcademicianWeeklySchedule(selectedAcademicianId, weekAnchor, weekEnd),
    enabled: !!selectedAcademicianId,
    staleTime: 60_000,
  });

  const handlePreviousWeek = () => {
    updateParams({ week: toDateValue(getWeekStart(shiftDate(weekAnchor, -7))) });
  };

  const handleThisWeek = () => {
    updateParams({ week: getCurrentWeekStart() });
  };

  const handleNextWeek = () => {
    updateParams({ week: toDateValue(getWeekStart(shiftDate(weekAnchor, 7))) });
  };

  const selectedAcademician = academicians.find(a => a.id === selectedAcademicianId);

  return (
    <main className="min-h-screen bg-slate-50/50 pb-12 pt-8">
      <PageContainer>
        <div className="space-y-6">
          <header className="relative overflow-hidden rounded-3xl border border-[#006482]/15 bg-gradient-to-br from-[#eff8ff] via-white to-white px-5 py-4 shadow-md sm:px-6">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#004b62] via-[#006482] to-[#fabc07]" />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-500">
                  <Link to="/programlar" className="hover:text-[#006482]">&larr; Programlar</Link>
                  <span>/</span>
                  <span className="text-slate-900">Öğretim Görevlisi Programı</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Öğretim Görevlisi Programı</h1>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                  Akademisyen seçerek haftalık ders programını inceleyin.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Link to="/classrooms" className="dts-btn-secondary">
                  <Presentation className="h-4 w-4" />
                  Derslik Görüntüleme
                </Link>
                <Link to="/giris" className="dts-btn-secondary">
                  <LogIn className="h-4 w-4" />
                  Giriş Yap
                </Link>
              </div>
            </div>
          </header>

          <div className="rounded-3xl border border-[#006482]/10 bg-white p-5 shadow-sm sm:p-6">
            {isAcademiciansLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                 <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
              </div>
            ) : isAcademiciansError ? (
              <EmptyState title="Öğretim görevlileri yüklenemedi." />
            ) : academicians.length === 0 ? (
              <EmptyState title="Sistemde henüz kayıtlı öğretim görevlisi bulunmuyor." />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <AppSelect
                  id="academician-select"
                  value={selectedAcademicianId}
                  options={academicianOptions}
                  onChange={(val) => updateParams({ academician: val, week: getCurrentWeekStart() })}
                  searchable
                  searchPlaceholder="Öğretim görevlisi ara..."
                  emptyText="Öğretim görevlisi bulunamadı"
                />
              </div>
            )}
          </div>

          {selectedAcademicianId && selectedAcademician && (
            <div className="rounded-3xl border border-[#006482]/10 bg-white p-5 shadow-sm sm:p-6 mt-6">
              <WeeklySchedulePanel
                title={formatAcademicianName(selectedAcademician)}
                weekStart={weekAnchor}
                schedule={weeklyData?.classroomId === selectedAcademicianId ? weeklyData : undefined}
                isLoading={isScheduleLoading}
                isFetching={isScheduleFetching}
                isError={isScheduleError}
                emptyStateMessage="Bu akademisyenin seçilen hafta için planlanmış dersi bulunmuyor."
                onPreviousWeek={handlePreviousWeek}
                onThisWeek={handleThisWeek}
                onNextWeek={handleNextWeek}
              />
            </div>
          )}
        </div>
      </PageContainer>
    </main>
  );
};
