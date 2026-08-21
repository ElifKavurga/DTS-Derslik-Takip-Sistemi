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

const formatAcademicianName = (acc: PublicAcademicianResponse) => {
  return [acc.title, acc.firstName, acc.lastName].filter(Boolean).join(' ');
};

export const AcademicianSchedulePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedFacultyId = searchParams.get('faculty') || '';
  const selectedDepartmentId = searchParams.get('department') || '';
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
    data: academiciansData,
    isLoading: isAcademiciansLoading,
    isError: isAcademiciansError,
  } = useQuery({
    queryKey: ['public', 'academicians'],
    queryFn: publicCampusService.getAcademicians,
  });

  const academicians = useMemo(() => academiciansData?.academicians ?? [], [academiciansData?.academicians]);
  const filteredAcademicians = useMemo(
    () => academicians.filter((academician) => academician.departmentId === selectedDepartmentId),
    [academicians, selectedDepartmentId],
  );
  const filteredDepartmentsWithAcademicians = useMemo(
    () => filteredDepartments.filter((department) => academicians.some((academician) => academician.departmentId === department.id)),
    [academicians, filteredDepartments],
  );
  const firstFacultyWithAcademicians = useMemo(
    () => faculties.find((faculty) => departments.some(
      (department) => department.facultyId === faculty.id && academicians.some((academician) => academician.departmentId === department.id),
    )),
    [academicians, departments, faculties],
  );

  // Bağımlı seçimleri temizleme ve varsayılan seçim mantığı
  useEffect(() => {
    if (selectedFacultyId || faculties.length === 0 || departments.length === 0 || academicians.length === 0 || isDepartmentsLoading || isAcademiciansLoading) return;
    updateParams({ faculty: firstFacultyWithAcademicians?.id ?? faculties[0].id });
  }, [academicians.length, departments.length, faculties, firstFacultyWithAcademicians, isAcademiciansLoading, isDepartmentsLoading, selectedFacultyId, updateParams]);

  useEffect(() => {
    if (!selectedFacultyId) {
      if (selectedDepartmentId || selectedAcademicianId) {
        updateParams({ department: undefined, academician: undefined });
      }
      return;
    }

    if (isDepartmentsLoading || isAcademiciansLoading) return;
    const departmentStillValid = filteredDepartments.some((department) => department.id === selectedDepartmentId);
    const departmentHasAcademician = filteredDepartmentsWithAcademicians.some((department) => department.id === selectedDepartmentId);
    if (filteredDepartments.length === 0) {
      if (firstFacultyWithAcademicians) {
        updateParams({ faculty: firstFacultyWithAcademicians.id, department: undefined, academician: undefined });
      } else {
        updateParams({ department: undefined, academician: undefined });
      }
      return;
    }

    if (filteredDepartmentsWithAcademicians.length === 0 && firstFacultyWithAcademicians && firstFacultyWithAcademicians.id !== selectedFacultyId) {
      updateParams({ faculty: firstFacultyWithAcademicians.id, department: undefined, academician: undefined });
      return;
    }

    if (!selectedDepartmentId || !departmentStillValid || !departmentHasAcademician) {
      updateParams({ department: (filteredDepartmentsWithAcademicians[0] ?? filteredDepartments[0]).id, academician: undefined });
    }
  }, [filteredDepartments, filteredDepartmentsWithAcademicians, firstFacultyWithAcademicians, isAcademiciansLoading, isDepartmentsLoading, selectedAcademicianId, selectedDepartmentId, selectedFacultyId, updateParams]);

  useEffect(() => {
    if (!selectedDepartmentId) {
      if (selectedAcademicianId) {
        updateParams({ academician: undefined });
      }
      return;
    }

    if (isAcademiciansLoading) return;
    const academicianStillValid = filteredAcademicians.some((academician) => academician.id === selectedAcademicianId);
    if (filteredAcademicians.length === 0) {
      updateParams({ academician: undefined });
      return;
    }

    if (!selectedAcademicianId || !academicianStillValid) {
      updateParams({ academician: filteredAcademicians[0].id });
    }
  }, [filteredAcademicians, isAcademiciansLoading, selectedAcademicianId, selectedDepartmentId, updateParams]);


  const facultyOptions = useMemo(() => faculties.map((faculty) => ({ value: faculty.id, label: faculty.name })), [faculties]);
  const departmentOptions = useMemo(() => filteredDepartments.map((department) => ({ value: department.id, label: department.name })), [filteredDepartments]);
  const academicianOptions = useMemo(() => filteredAcademicians.map((acc) => ({ value: acc.id, label: formatAcademicianName(acc) })), [filteredAcademicians]);

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

  const selectedAcademician = filteredAcademicians.find(a => a.id === selectedAcademicianId);
  const hasFilterError = isFacultiesError || isDepartmentsError || isAcademiciansError;
  const isFilterLoading = isFacultiesLoading || isDepartmentsLoading || isAcademiciansLoading;

  return (
    <main className="min-h-screen bg-slate-50/50 pb-12 pt-4">
      <PageContainer>
        <div className="space-y-4">
          <PublicProgramHeader
            title="Öğretim Görevlisi Programı"
            description="Fakülte, bölüm ve öğretim görevlisi seçerek haftalık ders programını inceleyin."
            showBackLink
          />

          <ProgramTypeSelector />

          <div className="group relative p-[1.5px] rounded-[24px] transition-all duration-300 shadow-xs hover:shadow-md hover:-translate-y-0.5">
            {/* Gradient border on hover */}
            <div aria-hidden="true" className="absolute inset-0 rounded-[24px] bg-gradient-to-r from-[#006482] via-[#00a896] to-[#fabc07] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="relative overflow-hidden rounded-[23px] border border-slate-200/80 bg-gradient-to-br from-[#f6fbfe] via-white to-[#e2f3fa] p-3.5 group-hover:border-transparent transition-colors duration-300">

            {isFilterLoading ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                 <div className="h-10 animate-pulse rounded-lg bg-slate-100/50" />
                 <div className="h-10 animate-pulse rounded-lg bg-slate-100/50" />
                 <div className="h-10 animate-pulse rounded-lg bg-slate-100/50" />
              </div>
            ) : hasFilterError ? (
              <EmptyState title="Fakülte, bölüm veya öğretim görevlileri yüklenemedi." />
            ) : faculties.length === 0 ? (
              <EmptyState title="Sistemde henüz kayıtlı fakülte bulunmuyor." />
            ) : departments.length === 0 ? (
              <EmptyState title="Sistemde henüz kayıtlı bölüm bulunmuyor." />
            ) : academicians.length === 0 ? (
              <EmptyState title="Sistemde henüz kayıtlı öğretim görevlisi bulunmuyor." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <AppSelect
                  id="faculty-select"
                  value={selectedFacultyId}
                  options={facultyOptions}
                  onChange={(val) => updateParams({ faculty: val, department: undefined, academician: undefined, week: getCurrentWeekStart() })}
                  searchable
                  searchPlaceholder="Fakülte ara..."
                  emptyText="Fakülte bulunamadı"
                />
                <AppSelect
                  id="department-select"
                  value={selectedDepartmentId}
                  options={departmentOptions}
                  onChange={(val) => updateParams({ department: val, academician: undefined, week: getCurrentWeekStart() })}
                  searchable
                  searchPlaceholder="Bölüm ara..."
                  emptyText={selectedFacultyId ? 'Bu fakültede bölüm bulunamadı' : 'Önce fakülte seçin'}
                  disabled={!selectedFacultyId || filteredDepartments.length === 0}
                />
                <AppSelect
                  id="academician-select"
                  value={selectedAcademicianId}
                  options={academicianOptions}
                  onChange={(val) => updateParams({ academician: val, week: getCurrentWeekStart() })}
                  searchable
                  searchPlaceholder="Öğretim görevlisi ara..."
                  emptyText={selectedDepartmentId ? 'Bu bölümde öğretim görevlisi bulunamadı' : 'Önce bölüm seçin'}
                  disabled={!selectedDepartmentId || filteredAcademicians.length === 0}
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
