import { useCallback, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, Landmark, LogIn, Presentation } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { AppSelect } from '@/components/ui/AppSelect';
import { EmptyState } from '@/components/ui/EmptyState';
import { publicCampusService } from '@/services/publicCampusService';
import { WeeklySchedulePanel } from './components/WeeklySchedulePanel';
import { getCurrentWeekStart, getWeekStart, shiftDate, toDateValue } from '@/utils/date';
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
    queryFn: () => publicCampusService.getFloorView(selectedFloorId, toDateValue(new Date())),
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

    const classroomStillValid = classrooms.some(
      (c) => (c.classroomId ?? c.id) === selectedClassroomId,
    );
    if (!classroomStillValid && selectedClassroomId) {
      updateParams({ classroom: undefined });
    }
  }, [classrooms, isFloorViewFetching, isFloorViewLoading, selectedClassroomId, selectedFloorId, updateParams, floorView]);


  const facultyOptions = useMemo(() => faculties.map((faculty) => ({ value: faculty.id, label: faculty.name })), [faculties]);
  const buildingOptions = useMemo(() => buildings.map((building) => ({ value: building.id, label: building.name })), [buildings]);
  const floorOptions = useMemo(() => floors.map((floor) => ({ value: floor.id, label: floor.name })), [floors]);
  const classroomOptions = useMemo(() => classrooms.map((c) => ({ value: c.classroomId ?? c.id, label: c.code || c.label || 'Derslik' })), [classrooms]);

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

  const selectedClassroom = classrooms.find(c => (c.classroomId ?? c.id) === selectedClassroomId);

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
                  <span className="text-slate-900">Sınıf Programı</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Sınıf Programı</h1>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                  Fakülte, blok, kat ve sınıf seçerek haftalık ders programını inceleyin.
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
            {isFacultiesLoading ? (
              <div className="grid gap-4 md:grid-cols-4">
                 <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                 <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                 <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                 <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
              </div>
            ) : isFacultiesError ? (
              <EmptyState title="Fakülteler yüklenemedi." />
            ) : faculties.length === 0 ? (
              <EmptyState title="Sistemde henüz kayıtlı fakülte bulunmuyor." />
            ) : (
              <div className="grid gap-4 md:grid-cols-4">
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
                  searchPlaceholder="Sınıf ara..."
                  emptyText="Sınıf bulunamadı"
                  disabled={!selectedFloorId || classrooms.length === 0 || isClassroomSelectLoading}
                />
              </div>
            )}
          </div>

          {selectedClassroomId && selectedClassroom && (
            <div className="rounded-3xl border border-[#006482]/10 bg-white p-5 shadow-sm sm:p-6 mt-6">
              <WeeklySchedulePanel
                classroomId={selectedClassroom.classroomId ?? selectedClassroom.id}
                classroomCode={selectedClassroom.code || selectedClassroom.label || 'Derslik'}
                weekStart={weekAnchor}
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
