import { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageContainer } from '@/components/layout/PageContainer';
import { AppSelect } from '@/components/ui/AppSelect';
import { EmptyState } from '@/components/ui/EmptyState';
import { publicCampusService } from '@/services/publicCampusService';
import { WeeklySchedulePanel } from './components/WeeklySchedulePanel';
import { ProgramTypeSelector } from './components/ProgramTypeSelector';
import { PublicProgramHeader } from './components/PublicProgramHeader';
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
    <main className="min-h-screen bg-slate-50/50 pb-12 pt-4">
      <PageContainer>
        <div className="space-y-4">
          <PublicProgramHeader
            title="Öğretim Görevlisi Programı"
            description="Akademisyen seçerek haftalık ders programını inceleyin."
            showBackLink
          />

          <ProgramTypeSelector />

          <div className="group relative p-[1.5px] rounded-[24px] transition-all duration-300 shadow-xs hover:shadow-md hover:-translate-y-0.5">
            {/* Gradient border on hover */}
            <div aria-hidden="true" className="absolute inset-0 rounded-[24px] bg-gradient-to-r from-[#006482] via-[#00a896] to-[#fabc07] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="relative overflow-hidden rounded-[23px] border border-slate-200/80 bg-gradient-to-br from-[#f6fbfe] via-white to-[#e2f3fa] p-3.5 group-hover:border-transparent transition-colors duration-300">

            {isAcademiciansLoading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                 <div className="h-10 animate-pulse rounded-lg bg-slate-100/50" />
              </div>
            ) : isAcademiciansError ? (
              <EmptyState title="Öğretim görevlileri yüklenemedi." />
            ) : academicians.length === 0 ? (
              <EmptyState title="Sistemde henüz kayıtlı öğretim görevlisi bulunmuyor." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
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
          </div>

          {selectedAcademicianId && selectedAcademician && (
            <div className="group relative p-[1.5px] rounded-[24px] transition-all duration-300 shadow-xs hover:shadow-md hover:-translate-y-0.5 mt-4">
              {/* Gradient border on hover */}
              <div aria-hidden="true" className="absolute inset-0 rounded-[24px] bg-gradient-to-r from-[#006482] via-[#00a896] to-[#fabc07] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <div className="relative overflow-hidden rounded-[23px] border border-slate-200/80 bg-gradient-to-br from-[#f6fbfe] via-white to-[#e2f3fa] p-4 sm:p-5 group-hover:border-transparent transition-colors duration-300">


              <WeeklySchedulePanel
                title={formatAcademicianName(selectedAcademician)}
                weekStart={weekAnchor}
                schedule={weeklyData?.classroomId === selectedAcademicianId ? weeklyData : undefined}
                isLoading={isScheduleLoading}
                isFetching={isScheduleFetching}
                isError={isScheduleError}
                emptyStateMessage="Bu akademisyenin seçilen hafta için planlanmış dersi bulunmuyor."
                scheduleType="academician"
                onPreviousWeek={handlePreviousWeek}
                onThisWeek={handleThisWeek}
                onNextWeek={handleNextWeek}
              />
              </div>
            </div>
          )}
        </div>
      </PageContainer>
    </main>
  );
};
