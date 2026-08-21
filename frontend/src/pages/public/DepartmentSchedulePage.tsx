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
import { PublicProgramCard } from './components/PublicProgramCard';
import { getCurrentWeekStart, getWeekStart, shiftDate, toDateValue, getWeekEnd } from '@/utils/date';

export const DepartmentSchedulePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedFacultyId = searchParams.get('faculty') || '';
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
    data: facultiesData,
    isLoading: isFacultiesLoading,
    isError: isFacultiesError,
  } = useQuery({
    queryKey: ['public', 'faculties'],
    queryFn: publicCampusService.getFaculties,
  });

  const faculties = useMemo(() => facultiesData?.faculties ?? [], [facultiesData?.faculties]);

  const {
    data: departmentsData,
    isLoading: isDepartmentsLoading,
    isError: isDepartmentsError,
  } = useQuery({
    queryKey: ['public', 'departments'],
    queryFn: publicCampusService.getDepartments,
  });

  const departments = useMemo(() => departmentsData?.departments ?? [], [departmentsData?.departments]);
  const filteredDepartments = useMemo(
    () => departments.filter((department) => department.facultyId === selectedFacultyId),
    [departments, selectedFacultyId],
  );

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

  // Bağımlı seçimleri temizleme ve doğrulama mantığı
  useEffect(() => {
    if (selectedFacultyId || faculties.length === 0) return;
    updateParams({ faculty: faculties[0].id });
  }, [faculties, selectedFacultyId, updateParams]);

  useEffect(() => {
    if (!selectedFacultyId) {
      if (selectedDepartmentId || selectedClassLevelStr) {
        updateParams({ department: undefined, classLevel: undefined });
      }
      return;
    }

    if (isDepartmentsLoading) return;
    const departmentStillValid = filteredDepartments.some((department) => department.id === selectedDepartmentId);
    if (filteredDepartments.length === 0) {
      updateParams({ department: undefined, classLevel: undefined });
      return;
    }

    if (!selectedDepartmentId || !departmentStillValid) {
      updateParams({ department: filteredDepartments[0].id, classLevel: undefined });
    }
  }, [filteredDepartments, isDepartmentsLoading, selectedClassLevelStr, selectedDepartmentId, selectedFacultyId, updateParams]);

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


  const facultyOptions = useMemo(() => faculties.map((faculty) => ({ value: faculty.id, label: faculty.name })), [faculties]);
  const departmentOptions = useMemo(() => filteredDepartments.map((dep) => ({ value: dep.id, label: dep.name })), [filteredDepartments]);
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

  const selectedDepartment = filteredDepartments.find(d => d.id === selectedDepartmentId);
  const hasFilterError = isFacultiesError || isDepartmentsError;
  const isFilterLoading = isFacultiesLoading || isDepartmentsLoading;

  return (
    <main className="min-h-screen bg-slate-50/50 pb-12 pt-4">
      <PageContainer>
        <div className="space-y-4">
          <PublicProgramHeader
            title="Bölüm Programı"
            description="Seçilen bölümün haftalık ders programını görüntüleyin."
          />

          <ProgramTypeSelector />

          <PublicProgramCard contentClassName="p-3.5">
            {isFilterLoading ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                 <div className="h-10 animate-pulse rounded-lg bg-slate-100/50" />
                 <div className="h-10 animate-pulse rounded-lg bg-slate-100/50" />
                 <div className="h-10 animate-pulse rounded-lg bg-slate-100/50" />
              </div>
            ) : hasFilterError ? (
              <EmptyState title="Fakülte veya bölümler yüklenemedi." />
            ) : faculties.length === 0 ? (
              <EmptyState title="Sistemde henüz kayıtlı fakülte bulunmuyor." />
            ) : departments.length === 0 ? (
              <EmptyState title="Sistemde henüz kayıtlı bölüm bulunmuyor." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <AppSelect
                  id="faculty-select"
                  value={selectedFacultyId}
                  options={facultyOptions}
                  onChange={(val) => updateParams({ faculty: val, department: undefined, classLevel: undefined, week: getCurrentWeekStart() })}
                  searchable
                  searchPlaceholder="Fakülte ara..."
                  emptyText="Fakülte bulunamadı"
                />
                <AppSelect
                  id="department-select"
                  value={selectedDepartmentId}
                  options={departmentOptions}
                  onChange={(val) => updateParams({ department: val, classLevel: undefined, week: getCurrentWeekStart() })}
                  searchable
                  searchPlaceholder="Bölüm ara..."
                  emptyText={selectedFacultyId ? 'Bu fakültede bölüm bulunamadı' : 'Önce fakülte seçin'}
                  disabled={!selectedFacultyId || filteredDepartments.length === 0}
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
          </PublicProgramCard>

          {selectedDepartmentId && selectedClassLevel && selectedDepartment && (
            <PublicProgramCard className="mt-4" contentClassName="p-4 sm:p-5">
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
            </PublicProgramCard>
          )}
        </div>
      </PageContainer>
    </main>
  );
};
