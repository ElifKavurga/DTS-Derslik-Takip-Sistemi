import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, FlaskConical, Landmark, Loader2, LogIn, MapPinned, Presentation, School } from 'lucide-react';
import { Link } from 'react-router-dom';

import { EmptyState } from '@/components/ui/EmptyState';
import { AppSelect } from '@/components/ui/AppSelect';
import { PageContainer } from '@/components/layout/PageContainer';
import { publicCampusService } from '@/services/publicCampusService';
import {
  PublicBuildingResponse,
  PublicFacultyResponse,
  PublicFloorDetailResponse,
  PublicFloorResponse,
  PublicSpaceObjectResponse,
} from '@/types';
import { cn } from '@/utils/cn';

const DEFAULT_FACULTY_CODE = 'MF';
const DEFAULT_BUILDING_CODE = 'A-BLOK';
const TEACHING_TYPE_LABELS: Record<string, string> = {
  CLASSROOM: 'Sınıf',
  LABORATORY: 'Laboratuvar',
  AMPHITHEATER: 'Amfi',
};
const AVAILABILITY_LABELS: Record<string, string> = {
  AVAILABLE: 'Boş',
  STARTING_SOON: 'Yakında dolacak',
  OCCUPIED: 'Dolu',
};
const AVAILABILITY_STYLES: Record<string, { card: string; badge: string; dot: string }> = {
  AVAILABLE: {
    card: 'border-emerald-300 bg-emerald-50/90 text-emerald-950',
    badge: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
  },
  STARTING_SOON: {
    card: 'border-amber-300 bg-amber-50/90 text-amber-950',
    badge: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
  },
  OCCUPIED: {
    card: 'border-red-300 bg-red-50/90 text-red-950',
    badge: 'bg-red-100 text-red-700',
    dot: 'bg-red-500',
  },
};

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

const findDefaultFloor = (floors: PublicFloorResponse[]) => floors[0];

const getCanvasSize = (floorView?: PublicFloorDetailResponse) => {
  const objects = floorView?.objects ?? [];
  const maxObjectX = objects.reduce((max, object) => Math.max(max, object.positionX + object.width), 0);
  const maxObjectY = objects.reduce((max, object) => Math.max(max, object.positionY + object.height), 0);
  return {
    width: Math.max(floorView?.backgroundWidth ?? 0, maxObjectX + 32, 720),
    height: Math.max(floorView?.backgroundHeight ?? 0, maxObjectY + 32, 420),
  };
};

const getObjectIcon = (type: string) => {
  if (type === 'LABORATORY') return FlaskConical;
  if (type === 'AMPHITHEATER') return Presentation;
  return School;
};

const ClassroomSlot = ({
  object,
  selected,
  onSelect,
  absolute = false,
}: {
  object: PublicSpaceObjectResponse;
  selected: boolean;
  onSelect: () => void;
  absolute?: boolean;
}) => {
  const Icon = getObjectIcon(object.type);
  const label = object.code || object.label || 'Derslik';
  const detail = TEACHING_TYPE_LABELS[object.type] ?? object.type;
  const availability = object.availabilityStatus ?? 'AVAILABLE';
  const availabilityStyle = AVAILABILITY_STYLES[availability] ?? AVAILABILITY_STYLES.AVAILABLE;
  const availabilityLabel = AVAILABILITY_LABELS[availability] ?? object.availabilityLabel ?? 'Boş';
  const statusDetail =
    availability === 'OCCUPIED'
      ? [object.currentCourseName, object.currentTimeSlot].filter(Boolean).join(' · ')
      : availability === 'STARTING_SOON'
        ? [object.nextCourseName, object.nextStartTime ? `${object.nextStartTime} başlangıç` : undefined].filter(Boolean).join(' · ')
        : '';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex min-h-28 min-w-36 flex-col items-start justify-between rounded-xl border p-3 text-left shadow-sm transition hover:border-[#006482]/50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#006482]/20',
        availabilityStyle.card,
        selected && 'border-[#006482] ring-2 ring-[#006482]/15',
        absolute && 'absolute overflow-hidden',
      )}
      style={
        absolute
          ? {
              left: object.positionX,
              top: object.positionY,
              width: object.width,
              height: object.height,
              transform: object.rotation ? `rotate(${object.rotation}deg)` : undefined,
              transformOrigin: 'center',
            }
          : undefined
      }
      title={[label, availabilityLabel, statusDetail].filter(Boolean).join(' - ')}
    >
      <span className="flex w-full items-center justify-between gap-2">
        <Icon className="h-4 w-4 shrink-0 text-[#006482]" />
        <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold', availabilityStyle.badge)}>
          <span className={cn('h-2 w-2 rounded-full', availabilityStyle.dot)} />
          {availabilityLabel}
        </span>
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold text-slate-900">{label}</span>
        <span className="mt-1 block truncate text-xs text-slate-500">{detail}</span>
        {object.capacity != null && <span className="mt-1 block text-[11px] text-slate-400">{object.capacity} kişi</span>}
        {statusDetail && <span className="mt-1 block truncate text-[11px] font-medium text-slate-600">{statusDetail}</span>}
        {object.placed === false && <span className="mt-1 block text-[10px] font-semibold text-slate-400">Yerleşim yok</span>}
      </span>
    </button>
  );
};

const AvailabilityLegend = () => (
  <div className="flex flex-wrap gap-2">
    {[
      ['AVAILABLE', 'Boş'],
      ['STARTING_SOON', 'Yakında dolacak'],
      ['OCCUPIED', 'Dolu'],
    ].map(([status, label]) => {
      const style = AVAILABILITY_STYLES[status];
      return (
        <span key={status} className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', style.badge)}>
          <span className={cn('h-2.5 w-2.5 rounded-full', style.dot)} />
          {label}
        </span>
      );
    })}
  </div>
);

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
  const [selectedFloorId, setSelectedFloorId] = useState('');
  const [selectedClassroomId, setSelectedClassroomId] = useState('');

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

  const {
    data: floorsData,
    isLoading: isFloorsLoading,
    isFetching: isFloorsFetching,
    isError: isFloorsError,
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
    isError: isFloorViewError,
  } = useQuery({
    queryKey: ['public', 'floor-view', selectedBuildingId, selectedFloorId],
    queryFn: () => publicCampusService.getFloorView(selectedBuildingId, selectedFloorId),
    enabled: !!selectedBuildingId && !!selectedFloorId,
    refetchInterval: 60_000,
    staleTime: 20_000,
  });

  const selectedFaculty = useMemo(
    () => faculties.find((faculty) => faculty.id === selectedFacultyId),
    [faculties, selectedFacultyId],
  );
  const selectedBuilding = useMemo(
    () => buildings.find((building) => building.id === selectedBuildingId),
    [buildings, selectedBuildingId],
  );
  const selectedFloor = useMemo(
    () => floors.find((floor) => floor.id === selectedFloorId),
    [floors, selectedFloorId],
  );
  const selectedClassroom = useMemo(
    () => floorView?.objects.find((object) => object.classroomId === selectedClassroomId || object.id === selectedClassroomId),
    [floorView?.objects, selectedClassroomId],
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

  useEffect(() => {
    if (!selectedBuildingId || isFloorsLoading || isFloorsFetching) return;
    if (floors.length === 0) {
      setSelectedFloorId('');
      setSelectedClassroomId('');
      return;
    }

    const selectedStillValid = floors.some((floor) => floor.id === selectedFloorId);
    if (selectedStillValid) return;

    const defaultFloor = findDefaultFloor(floors);
    setSelectedFloorId(defaultFloor?.id ?? '');
    setSelectedClassroomId('');
  }, [floors, isFloorsFetching, isFloorsLoading, selectedBuildingId, selectedFloorId]);

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
    setSelectedFloorId('');
    setSelectedClassroomId('');
    setSelectedFacultyId(facultyId);
  };

  const handleBuildingChange = (buildingId: string) => {
    setSelectedFloorId('');
    setSelectedClassroomId('');
    setSelectedBuildingId(buildingId);
  };

  const handleFloorChange = (floorId: string) => {
    setSelectedClassroomId('');
    setSelectedFloorId(floorId);
  };

  const isBuildingSelectLoading = !!selectedFacultyId && (isBuildingsLoading || isBuildingsFetching);
  const isFloorLoading = !!selectedBuildingId && (isFloorsLoading || isFloorsFetching);
  const isLayoutLoading = !!selectedFloorId && isFloorViewLoading;
  const hasFloorPlan = !!floorView?.backgroundImageBase64 && !!floorView.backgroundImageType;
  const canvasSize = getCanvasSize(floorView);
  const placedObjects = useMemo(() => floorView?.objects.filter((object) => object.placed !== false) ?? [], [floorView?.objects]);
  const unplacedObjects = useMemo(() => floorView?.objects.filter((object) => object.placed === false) ?? [], [floorView?.objects]);

  return (
    <main className="min-h-screen bg-slate-50">
      <PageContainer>
        <div className="space-y-6">
          <header className="flex flex-col gap-2 border-b border-slate-200/70 pb-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#006482]">Genel Kullanıcı</span>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Derslik Görüntüleme</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Fakülte, blok ve kat seçerek mevcut derslik yerleşimini görüntüleyin.
                </p>
              </div>
              <Link to="/giris" className="dts-btn-secondary shrink-0">
                <LogIn className="h-4 w-4" />
                Giriş Yap
              </Link>
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
                      onChange={handleBuildingChange}
                      searchable
                      searchPlaceholder="Blok ara..."
                      emptyText="Blok bulunamadı"
                    />
                  )}
                </div>
              </section>

              {selectedBuilding && (
                <section className="dts-card p-5">
                  <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-950">Katlar</h2>
                      <p className="text-xs text-slate-500">{selectedBuilding.name} için tanımlı katlar</p>
                    </div>
                    {isFloorLoading && (
                      <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-400">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Katlar yükleniyor...
                      </span>
                    )}
                  </div>

                  {isFloorsError ? (
                    <EmptyState title="Katlar yüklenemedi." />
                  ) : !isFloorLoading && floors.length === 0 ? (
                    <EmptyState title="Bu blokta kat bilgisi bulunamadı." />
                  ) : (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {floors.map((floor) => (
                        <button
                          key={floor.id}
                          type="button"
                          onClick={() => handleFloorChange(floor.id)}
                          className={cn(
                            'min-w-24 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#006482]/20',
                            selectedFloorId === floor.id
                              ? 'border-[#006482] bg-[#eff8ff] text-[#006482]'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                          )}
                        >
                          {floor.name}
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              )}

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

              {selectedFloor && (
                <section className="dts-card p-5">
                  <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Kat Yerleşimi</p>
                      <h2 className="mt-1 text-base font-bold text-slate-950">{selectedFloor.name}</h2>
                    </div>
                    <div className="flex flex-col gap-2 sm:items-end">
                      <AvailabilityLegend />
                      {isLayoutLoading && (
                        <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-400">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Sınıflar ve anlık durum yükleniyor...
                        </span>
                      )}
                      {isFloorViewFetching && !isFloorViewLoading && (
                        <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-400">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Durum yenileniyor...
                        </span>
                      )}
                    </div>
                  </div>

                  {isFloorViewError ? (
                    <EmptyState title="Kat yerleşimi yüklenemedi." />
                  ) : isLayoutLoading ? (
                    <div className="h-80 animate-pulse rounded-2xl bg-slate-100" />
                  ) : floorView && floorView.objects.length === 0 ? (
                    <EmptyState title="Bu katta görüntülenecek derslik bulunamadı." />
                  ) : floorView ? (
                    <div className="space-y-4">
                      {!hasFloorPlan && (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-500">
                          Kat planı bulunamadı. Derslikler slot görünümünde gösteriliyor.
                        </div>
                      )}

                      {hasFloorPlan ? (
                        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-100 p-3">
                          <div
                            className="relative mx-auto overflow-hidden rounded-xl bg-white"
                            style={{ width: canvasSize.width, height: canvasSize.height }}
                          >
                            <img
                              src={`data:${floorView.backgroundImageType};base64,${floorView.backgroundImageBase64}`}
                              alt={`${floorView.name} kat planı`}
                              className="absolute max-w-none select-none object-contain"
                              style={{
                                left: floorView.backgroundX,
                                top: floorView.backgroundY,
                                width: floorView.backgroundWidth ?? canvasSize.width,
                                height: floorView.backgroundHeight ?? canvasSize.height,
                                opacity: floorView.backgroundOpacity ?? 0.35,
                              }}
                            />
                            {placedObjects.map((object) => (
                              <ClassroomSlot
                                key={object.id}
                                object={object}
                                selected={selectedClassroomId === (object.classroomId ?? object.id)}
                                onSelect={() => setSelectedClassroomId(object.classroomId ?? object.id)}
                                absolute
                              />
                            ))}
                          </div>
                          {unplacedObjects.length > 0 && (
                            <div className="mt-4">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                                Yerleşimi olmayan derslikler
                              </p>
                              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {unplacedObjects.map((object) => (
                                  <ClassroomSlot
                                    key={object.id}
                                    object={object}
                                    selected={selectedClassroomId === (object.classroomId ?? object.id)}
                                    onSelect={() => setSelectedClassroomId(object.classroomId ?? object.id)}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {floorView.objects.map((object) => (
                            <ClassroomSlot
                              key={object.id}
                              object={object}
                              selected={selectedClassroomId === (object.classroomId ?? object.id)}
                              onSelect={() => setSelectedClassroomId(object.classroomId ?? object.id)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </section>
              )}

              {selectedClassroom && (
                <section className="dts-card flex flex-col gap-2 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Seçilen Sınıf</p>
                  <h2 className="text-base font-bold text-slate-950">{selectedClassroom.code || selectedClassroom.label}</h2>
                  <p className="text-sm text-slate-500">
                    {TEACHING_TYPE_LABELS[selectedClassroom.type] ?? selectedClassroom.type}
                    {selectedClassroom.capacity != null ? ` · ${selectedClassroom.capacity} kişi` : ''}
                  </p>
                  <p className="text-sm font-semibold text-slate-700">
                    {AVAILABILITY_LABELS[selectedClassroom.availabilityStatus ?? 'AVAILABLE'] ?? selectedClassroom.availabilityLabel}
                  </p>
                  {(selectedClassroom.currentCourseName || selectedClassroom.nextCourseName) && (
                    <p className="text-xs text-slate-500">
                      {selectedClassroom.currentCourseName
                        ? `${selectedClassroom.currentCourseName} · ${selectedClassroom.currentTimeSlot ?? ''}`
                        : `${selectedClassroom.nextCourseName} · ${selectedClassroom.nextStartTime ?? ''}`}
                    </p>
                  )}
                </section>
              )}
            </>
          )}
        </div>
      </PageContainer>
    </main>
  );
};
