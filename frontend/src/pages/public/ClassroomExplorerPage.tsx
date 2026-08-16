import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, Landmark, Loader2, MapPinned } from 'lucide-react';

import { EmptyState } from '@/components/ui/EmptyState';
import { AppSelect } from '@/components/ui/AppSelect';
import { PageContainer } from '@/components/layout/PageContainer';
import { publicCampusService } from '@/services/publicCampusService';
import { PublicBuildingResponse, PublicFacultyResponse } from '@/types';

const DEFAULT_FACULTY_CODE = 'MF';
const DEFAULT_BUILDING_CODE = 'A-BLOK';

const normalize = (value: string) =>
  value
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ğ/g, 'g')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c');

const findDefaultFaculty = (faculties: PublicFacultyResponse[]) =>
  faculties.find((faculty) => faculty.code.toLocaleUpperCase('tr-TR') === DEFAULT_FACULTY_CODE) ??
  faculties.find((faculty) => normalize(faculty.name).includes('muhendislik')) ??
  faculties[0];

const findDefaultBuilding = (buildings: PublicBuildingResponse[]) =>
  buildings.find((building) => building.code.toLocaleUpperCase('tr-TR') === DEFAULT_BUILDING_CODE) ??
  buildings.find((building) => normalize(building.name) === 'a blok') ??
  buildings[0];

const SelectionSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-2">
    {[1, 2].map((item) => (
      <div key={item} className="dts-card min-h-32 animate-pulse p-5">
        <div className="mb-4 h-3 w-20 rounded bg-slate-100" />
        <div className="h-11 rounded-2xl bg-slate-100" />
      </div>
    ))}
  </div>
);

export const ClassroomExplorerPage = () => {
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [selectedBuildingId, setSelectedBuildingId] = useState('');

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
    isError: isBuildingsError,
  } = useQuery({
    queryKey: ['public', 'buildings', selectedFacultyId],
    queryFn: () => publicCampusService.getBuildingsByFacultyId(selectedFacultyId),
    enabled: !!selectedFacultyId,
  });

  const buildings = useMemo(() => buildingsData?.buildings ?? [], [buildingsData?.buildings]);
  const selectedFaculty = useMemo(
    () => faculties.find((faculty) => faculty.id === selectedFacultyId),
    [faculties, selectedFacultyId],
  );
  const selectedBuilding = useMemo(
    () => buildings.find((building) => building.id === selectedBuildingId),
    [buildings, selectedBuildingId],
  );

  useEffect(() => {
    if (selectedFacultyId || faculties.length === 0) return;
    const defaultFaculty = findDefaultFaculty(faculties);
    setSelectedFacultyId(defaultFaculty?.id ?? '');
  }, [faculties, selectedFacultyId]);

  useEffect(() => {
    if (!selectedFacultyId || isBuildingsLoading || isBuildingsFetching) return;
    if (buildings.length === 0) {
      setSelectedBuildingId('');
      return;
    }

    const selectedStillValid = buildings.some((building) => building.id === selectedBuildingId);
    if (selectedStillValid) return;

    const defaultBuilding = findDefaultBuilding(buildings);
    setSelectedBuildingId(defaultBuilding?.id ?? '');
  }, [buildings, isBuildingsFetching, isBuildingsLoading, selectedBuildingId, selectedFacultyId]);

  const facultyOptions = useMemo(
    () => faculties.map((faculty) => ({ value: faculty.id, label: faculty.name })),
    [faculties],
  );

  const buildingOptions = useMemo(
    () => buildings.map((building) => ({ value: building.id, label: building.name })),
    [buildings],
  );

  const handleFacultyChange = (facultyId: string) => {
    setSelectedBuildingId('');
    setSelectedFacultyId(facultyId);
  };

  const isBuildingSelectLoading = !!selectedFacultyId && (isBuildingsLoading || isBuildingsFetching);

  return (
    <main className="min-h-screen bg-slate-50">
      <PageContainer>
        <div className="space-y-6">
          <header className="flex flex-col gap-2 border-b border-slate-200/70 pb-5">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#006482]">Genel Kullanıcı</span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Derslik Görüntüleme</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Fakülte ve blok seçimiyle derslik görüntüleme altyapısını başlatın.
              </p>
            </div>
          </header>

          {isFacultiesLoading ? (
            <SelectionSkeleton />
          ) : isFacultiesError ? (
            <EmptyState title="Fakülteler yüklenemedi." />
          ) : faculties.length === 0 ? (
            <EmptyState
              title="Görüntülenecek fakülte bulunamadı."
              description="Sistem henüz derslik görüntüleme verisine sahip değil."
            />
          ) : (
            <>
              <section className="grid gap-4 md:grid-cols-2">
                <div className="dts-card min-w-0 p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-[#006482]">
                      <Landmark className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <label htmlFor="public-faculty" className="dts-input-label mb-1">
                        Fakülte
                      </label>
                      <p className="truncate text-xs text-slate-500">Gerçek fakülte kayıtları listelenir.</p>
                    </div>
                  </div>
                  <AppSelect
                    id="public-faculty"
                    value={selectedFacultyId}
                    options={facultyOptions}
                    onChange={handleFacultyChange}
                    searchable
                    searchPlaceholder="Fakülte ara..."
                    emptyText="Fakülte bulunamadı"
                  />
                </div>

                <div className="dts-card min-w-0 p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-[#006482]">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <label htmlFor="public-building" className="dts-input-label mb-1">
                        Blok
                      </label>
                      <p className="truncate text-xs text-slate-500">Yalnızca seçili fakültenin blokları gelir.</p>
                    </div>
                  </div>

                  {isBuildingSelectLoading ? (
                    <div className="dts-input flex h-11 items-center gap-2 text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Bloklar yükleniyor...
                    </div>
                  ) : isBuildingsError ? (
                    <div className="dts-input border-red-200 bg-red-50 text-red-600">Bloklar yüklenemedi.</div>
                  ) : buildings.length === 0 ? (
                    <div className="dts-input bg-slate-50 text-slate-400">Blok bulunamadı.</div>
                  ) : (
                    <AppSelect
                      id="public-building"
                      value={selectedBuildingId}
                      options={buildingOptions}
                      onChange={setSelectedBuildingId}
                      searchable
                      searchPlaceholder="Blok ara..."
                      emptyText="Blok bulunamadı"
                    />
                  )}
                </div>
              </section>

              {selectedFaculty && buildings.length === 0 && !isBuildingsLoading && !isBuildingsFetching && !isBuildingsError ? (
                <EmptyState title="Bu fakülteye ait blok bulunamadı." />
              ) : selectedFaculty && selectedBuilding ? (
                <section className="dts-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eff8ff] text-[#006482]">
                      <MapPinned className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Seçilen Blok</p>
                      <h2 className="mt-1 truncate text-base font-bold text-slate-950">{selectedBuilding.name}</h2>
                      <p className="mt-1 truncate text-sm text-slate-500">{selectedFaculty.name}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="dts-badge-primary">{selectedFaculty.code}</span>
                    <span className="dts-badge-secondary">{selectedBuilding.code}</span>
                  </div>
                </section>
              ) : null}
            </>
          )}
        </div>
      </PageContainer>
    </main>
  );
};
