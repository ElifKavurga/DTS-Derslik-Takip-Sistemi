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
import { PublicDepartmentResponse } from '@/types';

// Yardımcı fonksiyonlar
const findDefaultDepartment = (departments: PublicDepartmentResponse[]) => {
  if (departments.length === 0) return undefined;
  const engineering = departments.find((d) => d.name.toLowerCase().includes('bilgisayar'));
  return engineering || departments[0];
};

export const DepartmentSchedulePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedDepartmentId = searchParams.get('department') || '';
  const selectedClassLevelStr = searchParams.get('classLevel') || '';
  const selectedClassLevel = selectedClassLevelStr ? parseInt(selectedClassLevelStr, 10) : undefined;
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
    data: departmentsData,
    isLoading: isDepartmentsLoading,
    isError: isDepartmentsError,
  } = useQuery({
    queryKey: ['public', 'departments'],
    queryFn: publicCampusService.getDepartments,
  });

  const departments = useMemo(() => departmentsData?.departments ?? [], [departmentsData?.departments]);

  const {
    data: classLevelsData,
    isLoading: isClassLevelsLoading,
    isFetching: isClassLevelsFetching,
  } = useQuery({
    queryKey: ['public', 'department-class-levels', selectedDepartmentId],
    queryFn: () => publicCampusService.getDepartmentClassLevels(selectedDepartmentId),
    enabled: !!selectedDepartmentId,
  });

  const classLevels = useMemo(() => classLevelsData?.classLevels ?? [], [classLevelsData?.classLevels]);

  // Varsayılan seçimler ve temizleme mantığı
  useEffect(() => {
    if (selectedDepartmentId || departments.length === 0) return;
    const defaultDepartment = findDefaultDepartment(departments);
    updateParams({ department: defaultDepartment?.id ?? '' });
  }, [departments, selectedDepartmentId, updateParams]);

  useEffect(() => {
    if (!selectedDepartmentId) {
      if (selectedClassLevelStr) {
        updateParams({ classLevel: undefined });
      }
      return;
    }

    if (isClassLevelsLoading || isClassLevelsFetching) return;
    if (classLevels.length === 0) {
      updateParams({ classLevel: undefined });
      return;
    }

    const selectedStillValid = selectedClassLevel && classLevels.includes(selectedClassLevel);
    if (selectedStillValid) return;

    updateParams({ classLevel: classLevels[0].toString() });
  }, [classLevels, isClassLevelsFetching, isClassLevelsLoading, selectedClassLevel, selectedClassLevelStr, selectedDepartmentId, updateParams]);


  const departmentOptions = useMemo(() => departments.map((dep) => ({ value: dep.id, label: dep.name })), [departments]);
  const classLevelOptions = useMemo(() => classLevels.map((lvl) => ({ value: lvl.toString(), label: `${lvl}. Sınıf` })), [classLevels]);

  const weekEnd = toDateValue(getWeekEnd(weekAnchor));

  const {
    data: weeklyData,
    isLoading: isScheduleLoading,
    isFetching: isScheduleFetching,
    isError: isScheduleError,
  } = useQuery({
    queryKey: ['public', 'department-weekly-schedule', selectedDepartmentId, selectedClassLevel, weekAnchor, weekEnd],
    queryFn: () => publicCampusService.getDepartmentWeeklySchedule(selectedDepartmentId, selectedClassLevel!, weekAnchor, weekEnd),
    enabled: !!selectedDepartmentId && !!selectedClassLevel,
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

  const isClassLevelSelectLoading = !!selectedDepartmentId && (isClassLevelsLoading || isClassLevelsFetching);

  const selectedDepartment = departments.find(d => d.id === selectedDepartmentId);

  return (
    <main className="min-h-screen bg-slate-50/50 pb-12 pt-8">
      <PageContainer>
        <div className="space-y-6">
          <PublicProgramHeader
            title="Bölüm Programı"
            description="Bölüm ve sınıf seviyesi seçerek haftalık ders programını inceleyin."
            showBackLink
          />

          <ProgramTypeSelector />

          <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-[#f2fbfd] p-4 shadow-sm sm:p-5">
            {isDepartmentsLoading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                 <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                 <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
              </div>
            ) : isDepartmentsError ? (
              <EmptyState title="Bölümler yüklenemedi." />
            ) : departments.length === 0 ? (
              <EmptyState title="Sistemde henüz kayıtlı bölüm bulunmuyor." />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <AppSelect
                  id="department-select"
                  value={selectedDepartmentId}
                  options={departmentOptions}
                  onChange={(val) => updateParams({ department: val, classLevel: undefined, week: getCurrentWeekStart() })}
                  searchable
                  searchPlaceholder="Bölüm ara..."
                  emptyText="Bölüm bulunamadı"
                />
                <AppSelect
                  id="classlevel-select"
                  value={selectedClassLevelStr}
                  options={classLevelOptions}
                  onChange={(val) => updateParams({ classLevel: val, week: getCurrentWeekStart() })}
                  searchPlaceholder="Sınıf Seviyesi ara..."
                  emptyText="Sınıf Seviyesi bulunamadı"
                  disabled={!selectedDepartmentId || classLevels.length === 0 || isClassLevelSelectLoading}
                />
              </div>
            )}
          </div>

          {selectedDepartmentId && selectedClassLevel && selectedDepartment && (
            <div className="mt-5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
              <WeeklySchedulePanel
                title={`${selectedDepartment.name} - ${selectedClassLevel}. Sınıf`}
                weekStart={weekAnchor}
                schedule={weeklyData?.classroomId === selectedDepartmentId ? weeklyData : undefined}
                isLoading={isScheduleLoading}
                isFetching={isScheduleFetching}
                isError={isScheduleError}
                emptyStateMessage="Bu bölümün seçili sınıf seviyesi için seçilen haftada planlanmış ders bulunmuyor."
                scheduleType="department"
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
