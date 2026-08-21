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
import { PublicBuildingResponse, PublicFacultyResponse, PublicFloorResponse } from '@/types';

// Yardımcı fonksiyonlar
const findDefaultFaculty = (faculties: PublicFacultyResponse[]) => {
  if (faculties.length === 0) return undefined;
  const engineering = faculties.find((f) => f.name.toLowerCase().includes('mühendislik'));
  return engineering || faculties[0];
};

const findDefaultBuilding = (buildings: PublicBuildingResponse[]) => {
  if (buildings.length === 0) return undefined;
  return buildings[0];
};

const findDefaultFloor = (floors: PublicFloorResponse[]) => {
  if (floors.length === 0) return undefined;
  const groundFloor = floors.find((f) => f.name.toLowerCase().includes('zemin'));
  const floor1 = floors.find((f) => f.name.includes('1.'));
  return groundFloor || floor1 || floors[0];
};

export const ClassroomSchedulePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedFacultyId = searchParams.get('faculty') || '';
  const selectedBuildingId = searchParams.get('building') || '';
  const selectedFloorId = searchParams.get('floor') || '';
  const selectedClassroomId = searchParams.get('classroom') || '';
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
    data: buildingsData,
    isLoading: isBuildingsLoading,
    isFetching: isBuildingsFetching,
  } = useQuery({
    queryKey: ['public', 'buildings', selectedFacultyId],
    queryFn: () => publicCampusService.getBuildingsByFacultyId(selectedFacultyId),
    enabled: !!selectedFacultyId,
  });

  const buildings = useMemo(() => buildingsData?.buildings ?? [], [buildingsData?.buildings]);

  const {
    data: floorsData,
    isLoading: isFloorsLoading,
    isFetching: isFloorsFetching,
  } = useQuery({
    queryKey: ['public', 'floors', selectedBuildingId],
    queryFn: () => publicCampusService.getFloorsByBuildingId(selectedBuildingId),
    enabled: !!selectedBuildingId,
  });

  const floors = useMemo(() => floorsData?.floors ?? [], [floorsData?.floors]);

  const {
    data: floorView,
    isLoading: isFloorViewLoading,
    isFetching: isFloorViewFetching,
  } = useQuery({
    queryKey: ['public', 'floorView', selectedFloorId],
    queryFn: () => publicCampusService.getFloorView(selectedBuildingId, selectedFloorId),
    enabled: !!selectedFloorId,
  });

  const classrooms = useMemo(() => {
    if (!floorView) return [];
    return floorView.objects.filter((obj) => obj.type === 'CLASSROOM' && (obj.classroomId || obj.id));
  }, [floorView]);

  // Varsayılan seçimler ve temizleme mantığı
  useEffect(() => {
    if (selectedFacultyId || faculties.length === 0) return;
    const defaultFaculty = findDefaultFaculty(faculties);
    updateParams({ faculty: defaultFaculty?.id ?? '' });
  }, [faculties, selectedFacultyId, updateParams]);

  useEffect(() => {
    if (!selectedFacultyId) {
      if (selectedBuildingId || selectedFloorId || selectedClassroomId) {
        updateParams({ building: undefined, floor: undefined, classroom: undefined });
      }
      return;
    }

    if (isBuildingsLoading || isBuildingsFetching) return;
    if (buildings.length === 0) {
      updateParams({ building: undefined, floor: undefined, classroom: undefined });
      return;
    }

    const selectedStillValid = buildings.some((building) => building.id === selectedBuildingId);
    if (selectedStillValid) return;

    const defaultBuilding = findDefaultBuilding(buildings);
    updateParams({ building: defaultBuilding?.id ?? '', floor: undefined, classroom: undefined });
  }, [buildings, isBuildingsFetching, isBuildingsLoading, selectedBuildingId, selectedClassroomId, selectedFacultyId, selectedFloorId, updateParams]);

  useEffect(() => {
    if (!selectedBuildingId) {
      if (selectedFloorId || selectedClassroomId) {
        updateParams({ floor: undefined, classroom: undefined });
      }
      return;
    }

    if (isFloorsLoading || isFloorsFetching) return;
    if (floors.length === 0) {
      updateParams({ floor: undefined, classroom: undefined });
      return;
    }

    const selectedStillValid = floors.some((floor: PublicFloorResponse) => floor.id === selectedFloorId);
    if (selectedStillValid) return;

    const defaultFloor = findDefaultFloor(floors);
    updateParams({ floor: defaultFloor?.id ?? '', classroom: undefined });
  }, [floors, isFloorsFetching, isFloorsLoading, selectedBuildingId, selectedClassroomId, selectedFloorId, updateParams]);

  useEffect(() => {
    if (!selectedFloorId || isFloorViewLoading || isFloorViewFetching || !floorView) return;

    if (classrooms.length === 0) {
      if (selectedClassroomId) {
        updateParams({ classroom: undefined });
      }
      return;
    }

    const classroomStillValid = classrooms.some(
      (c) => (c.classroomId ?? c.id) === selectedClassroomId,
    );
    if (!classroomStillValid) {
      const defaultClassroom = classrooms[0];
      const defaultClassroomId = defaultClassroom.classroomId ?? defaultClassroom.id;
      updateParams({ classroom: defaultClassroomId });
    }
  }, [classrooms, isFloorViewFetching, isFloorViewLoading, selectedClassroomId, selectedFloorId, updateParams, floorView]);


  const facultyOptions = useMemo(() => faculties.map((faculty) => ({ value: faculty.id, label: faculty.name })), [faculties]);
  const buildingOptions = useMemo(() => buildings.map((building) => ({ value: building.id, label: building.name })), [buildings]);
  const floorOptions = useMemo(() => floors.map((floor) => ({ value: floor.id, label: floor.name })), [floors]);
  const classroomOptions = useMemo(() => classrooms.map((c) => ({ value: c.classroomId ?? c.id, label: c.code || c.label || 'Derslik' })), [classrooms]);

  const selectedClassroom = classrooms.find(c => (c.classroomId ?? c.id) === selectedClassroomId);
  const activeClassroomId = selectedClassroom?.classroomId ?? selectedClassroom?.id;
  const weekEnd = toDateValue(getWeekEnd(weekAnchor));

  const {
    data: weeklyData,
    isLoading: isScheduleLoading,
    isFetching: isScheduleFetching,
    isError: isScheduleError,
  } = useQuery({
    queryKey: ['public', 'classroom-weekly-schedule', activeClassroomId, weekAnchor, weekEnd],
    queryFn: () => publicCampusService.getClassroomWeeklySchedule(activeClassroomId!, weekAnchor, weekEnd),
    enabled: !!activeClassroomId,
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

  const isBuildingSelectLoading = !!selectedFacultyId && (isBuildingsLoading || isBuildingsFetching);
  const isFloorSelectLoading = !!selectedBuildingId && (isFloorsLoading || isFloorsFetching);
  const isClassroomSelectLoading = !!selectedFloorId && (isFloorViewLoading || isFloorViewFetching);

  return (
    <main className="min-h-screen bg-slate-50/50 pb-12 pt-4">
      <PageContainer>
        <div className="space-y-4">
          <PublicProgramHeader
            title="Derslik Programı"
            description="Seçilen dersliğin haftalık programını görüntüleyin."
          />

          <ProgramTypeSelector />

          <PublicProgramCard contentClassName="p-3.5">
            {isFacultiesLoading ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                 <div className="h-10 animate-pulse rounded-lg bg-slate-100/50" />
                 <div className="h-10 animate-pulse rounded-lg bg-slate-100/50" />
                 <div className="h-10 animate-pulse rounded-lg bg-slate-100/50" />
                 <div className="h-10 animate-pulse rounded-lg bg-slate-100/50" />
              </div>
            ) : isFacultiesError ? (
              <EmptyState title="Fakülteler yüklenemedi." />
            ) : faculties.length === 0 ? (
              <EmptyState title="Sistemde henüz kayıtlı fakülte bulunmuyor." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <AppSelect
                  id="faculty-select"
                  value={selectedFacultyId}
                  options={facultyOptions}
                  onChange={(val) => updateParams({ faculty: val, building: undefined, floor: undefined, classroom: undefined, week: getCurrentWeekStart() })}
                  searchable
                  searchPlaceholder="Fakülte ara..."
                  emptyText="Fakülte bulunamadı"
                />
                <AppSelect
                  id="building-select"
                  value={selectedBuildingId}
                  options={buildingOptions}
                  onChange={(val) => updateParams({ building: val, floor: undefined, classroom: undefined, week: getCurrentWeekStart() })}
                  searchable
                  searchPlaceholder="Blok ara..."
                  emptyText="Blok bulunamadı"
                  disabled={!selectedFacultyId || buildings.length === 0 || isBuildingSelectLoading}
                />
                <AppSelect
                  id="floor-select"
                  value={selectedFloorId}
                  options={floorOptions}
                  onChange={(val) => updateParams({ floor: val, classroom: undefined, week: getCurrentWeekStart() })}
                  searchable
                  searchPlaceholder="Kat ara..."
                  emptyText="Kat bulunamadı"
                  disabled={!selectedBuildingId || floors.length === 0 || isFloorSelectLoading}
                />
                <AppSelect
                  id="classroom-select"
                  value={selectedClassroomId}
                  options={classroomOptions}
                  onChange={(val) => updateParams({ classroom: val }, false)}
                  searchable
                  searchPlaceholder="Derslik ara..."
                  emptyText="Bu katta derslik bulunamadı"
                  disabled={!selectedFloorId || classrooms.length === 0 || isClassroomSelectLoading}
                />
              </div>
            )}
          </PublicProgramCard>

          {selectedClassroomId && selectedClassroom && (
            <PublicProgramCard className="mt-4" contentClassName="p-4 sm:p-5">
              <WeeklySchedulePanel
                title={selectedClassroom.code || selectedClassroom.label || 'Derslik'}
                weekStart={weekAnchor}
                schedule={weeklyData?.classroomId === activeClassroomId ? weeklyData : undefined}
                isLoading={isScheduleLoading}
                isFetching={isScheduleFetching}
                isError={isScheduleError}
                emptyStateMessage="Bu derslikte seçilen hafta için planlanmış ders bulunmuyor."
                scheduleType="classroom"
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
