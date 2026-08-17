import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  FlaskConical,
  Landmark,
  Loader2,
  LogIn,
  Presentation,
  School,
  UserRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { EmptyState } from '@/components/ui/EmptyState';
import { FormModal } from '@/components/ui/FormModal';
import { AppSelect } from '@/components/ui/AppSelect';
import { PageContainer } from '@/components/layout/PageContainer';
import { publicCampusService } from '@/services/publicCampusService';
import {
  PublicBuildingResponse,
  PublicClassroomDailyScheduleResponse,
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

const toDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const shiftDate = (dateValue: string, dayOffset: number) => {
  const nextDate = new Date(`${dateValue}T12:00:00`);
  nextDate.setDate(nextDate.getDate() + dayOffset);
  return toDateValue(nextDate);
};

const formatDisplayDate = (dateValue: string) =>
  new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${dateValue}T12:00:00`));

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
        'flex min-h-24 min-w-36 flex-col items-start justify-between rounded-xl border p-3 text-left shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#006482]/20',
        availabilityStyle.card,
        selected ? 'ring-2 ring-offset-1 ring-[#006482] border-[#006482] z-10' : 'hover:border-[#006482]/50',
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

const DetailItem = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p>
    <p className="mt-1 truncate text-sm font-bold text-slate-900">{value ?? '-'}</p>
  </div>
);

const DailySchedulePanel = ({
  schedule,
  selectedDate,
  isLoading,
  isFetching,
  isError,
  classroomCode,
  onPreviousDay,
  onToday,
  onNextDay,
}: {
  schedule?: PublicClassroomDailyScheduleResponse;
  selectedDate: string;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  classroomCode: string;
  onPreviousDay: () => void;
  onToday: () => void;
  onNextDay: () => void;
}) => (
  <div className="border-t border-slate-100 pt-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-lg font-bold text-slate-900">{classroomCode}</h3>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Günlük Program</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-700">
          <CalendarDays className="h-4 w-4 text-[#006482]" />
          <span>{schedule?.dayLabel ?? formatDisplayDate(selectedDate)}</span>
          <span className="text-slate-300">/</span>
          <span>{formatDisplayDate(schedule?.date ?? selectedDate)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button type="button" onClick={onPreviousDay} className="dts-btn-secondary px-3" aria-label="Önceki gün">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button type="button" onClick={onToday} className="dts-btn-secondary px-4 text-xs font-semibold" aria-label="Bugün">
          Bugün
        </button>
        <button type="button" onClick={onNextDay} className="dts-btn-secondary px-3" aria-label="Sonraki gün">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>

    {isError ? (
      <div className="mt-4">
        <EmptyState title="Günlük ders programı yüklenemedi." />
      </div>
    ) : isLoading ? (
      <div className="mt-4 space-y-3">
        {[1, 2].map((item) => (
          <div key={item} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    ) : schedule && schedule.items.length === 0 ? (
      <div className="mt-4">
        <EmptyState title="Bu sınıfta seçilen gün için planlanmış ders bulunmuyor." />
      </div>
    ) : schedule ? (
      <div className="mt-4 space-y-3">
        {isFetching && (
          <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Program yenileniyor...
          </span>
        )}
        {schedule.items.map((item) => (
          <div key={`${item.sourceType}-${item.id}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-bold text-[#006482]">
                  <Clock className="h-4 w-4" />
                  <span>{item.startTime} - {item.endTime}</span>
                </div>
                <h3 className="mt-2 truncate text-sm font-bold text-slate-950">{item.courseName}</h3>
                <p className="mt-1 text-xs font-semibold text-slate-500">{item.courseCode}</p>
              </div>
              {item.exceptionType && (
                <span className="w-fit rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                  {item.exceptionType === 'MAKEUP' ? 'Telafi' : 'Ek Ders'}
                </span>
              )}
            </div>
            {item.academicianName && (
              <p className="mt-3 flex items-center gap-2 truncate text-xs font-medium text-slate-500">
                <UserRound className="h-4 w-4 shrink-0 text-slate-400" />
                {item.academicianName}
              </p>
            )}
          </div>
        ))}
      </div>
    ) : null}
  </div>
);

const ClassroomDetailContent = ({
  classroom,
  facultyName,
  buildingName,
  floorName,
  dailySchedule,
  selectedDate,
  isDailyScheduleLoading,
  isDailyScheduleFetching,
  isDailyScheduleError,
  onPreviousDay,
  onToday,
  onNextDay,
}: {
  classroom?: PublicSpaceObjectResponse;
  facultyName?: string;
  buildingName?: string;
  floorName?: string;
  dailySchedule?: PublicClassroomDailyScheduleResponse;
  selectedDate: string;
  isDailyScheduleLoading: boolean;
  isDailyScheduleFetching: boolean;
  isDailyScheduleError: boolean;
  onPreviousDay: () => void;
  onToday: () => void;
  onNextDay: () => void;
}) => {
  if (!classroom) {
    return <EmptyState title="Derslik bilgileri yüklenemedi." />;
  }

  if (!classroom.classroomId) {
    return <EmptyState title="Bu slot için görüntülenecek derslik bilgisi bulunamadı." />;
  }

  const availability = classroom.availabilityStatus ?? 'AVAILABLE';
  const availabilityStyle = AVAILABILITY_STYLES[availability] ?? AVAILABILITY_STYLES.AVAILABLE;
  const availabilityLabel = AVAILABILITY_LABELS[availability] ?? classroom.availabilityLabel ?? 'Boş';
  const typeLabel = TEACHING_TYPE_LABELS[classroom.type] ?? classroom.type;
  const statusDescription =
    availability === 'OCCUPIED'
      ? [classroom.currentCourseName, classroom.currentTimeSlot].filter(Boolean).join(' · ')
      : availability === 'STARTING_SOON'
        ? [classroom.nextCourseName, classroom.nextStartTime ? `${classroom.nextStartTime} başlangıç` : undefined].filter(Boolean).join(' · ')
        : 'Şu anda ders görünmüyor.';

  return (
    <div className="space-y-5">
      <div className={cn('rounded-2xl border p-4', availabilityStyle.card)}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Derslik</p>
            <h2 className="mt-1 truncate text-2xl font-bold text-slate-950">{classroom.code || classroom.label}</h2>
            <p className="mt-1 text-sm text-slate-600">{classroom.label && classroom.label !== classroom.code ? classroom.label : typeLabel}</p>
          </div>
          <span className={cn('inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold', availabilityStyle.badge)}>
            <span className={cn('h-2.5 w-2.5 rounded-full', availabilityStyle.dot)} />
            {availabilityLabel}
          </span>
        </div>
        <p className="mt-3 text-sm font-medium text-slate-700">{statusDescription}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <DetailItem label="Derslik Türü" value={typeLabel} />
        <DetailItem label="Kapasite" value={classroom.capacity != null ? `${classroom.capacity} kişi` : null} />
        <DetailItem label="Fakülte" value={facultyName} />
        <DetailItem label="Blok" value={buildingName} />
        <DetailItem label="Kat" value={floorName} />
        <DetailItem label="Yerleşim" value={classroom.placed === false ? 'Kat planında yerleşim yok' : 'Kat planında yerleşik'} />
      </div>

      <DailySchedulePanel
        schedule={dailySchedule}
        selectedDate={selectedDate}
        isLoading={isDailyScheduleLoading}
        isFetching={isDailyScheduleFetching}
        isError={isDailyScheduleError}
        classroomCode={classroom.code || classroom.label || 'Derslik'}
        onPreviousDay={onPreviousDay}
        onToday={onToday}
        onNextDay={onNextDay}
      />
    </div>
  );
};

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
  const [selectedDate, setSelectedDate] = useState(() => toDateValue(new Date()));

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

  const buildings = useMemo(
    () => (buildingsData?.buildings ?? []).filter((building) => building.facultyId === selectedFacultyId),
    [buildingsData?.buildings, selectedFacultyId],
  );

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

  const floors = useMemo(
    () => (floorsData?.floors ?? []).filter((floor) => floor.buildingId === selectedBuildingId),
    [floorsData?.floors, selectedBuildingId],
  );

  const {
    data: floorViewData,
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

  const floorView = useMemo(
    () =>
      floorViewData?.id === selectedFloorId && floorViewData.buildingId === selectedBuildingId
        ? floorViewData
        : undefined,
    [floorViewData, selectedBuildingId, selectedFloorId],
  );

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
  const selectedClassroomScheduleId = selectedClassroom?.classroomId;

  const {
    data: dailyScheduleData,
    isLoading: isDailyScheduleLoading,
    isFetching: isDailyScheduleFetching,
    isError: isDailyScheduleError,
  } = useQuery({
    queryKey: ['public', 'classroom-daily-schedule', selectedClassroomScheduleId, selectedDate],
    queryFn: () => publicCampusService.getClassroomDailySchedule(selectedClassroomScheduleId ?? '', selectedDate),
    enabled: !!selectedClassroomScheduleId && !!selectedDate,
    staleTime: 20_000,
  });

  const dailySchedule = useMemo(
    () => {
      if (!dailyScheduleData) return undefined;
      return dailyScheduleData.classroomId === selectedClassroomScheduleId && dailyScheduleData.date === selectedDate
        ? dailyScheduleData
        : undefined;
    },
    [dailyScheduleData, selectedClassroomScheduleId, selectedDate],
  );

  useEffect(() => {
    if (selectedFacultyId || faculties.length === 0) return;
    const defaultFaculty = findDefaultFaculty(faculties);
    setSelectedFacultyId(defaultFaculty?.id ?? '');
  }, [faculties, selectedFacultyId]);

  useEffect(() => {
    if (!selectedFacultyId) {
      if (selectedBuildingId) setSelectedBuildingId('');
      if (selectedFloorId) setSelectedFloorId('');
      if (selectedClassroomId) setSelectedClassroomId('');
      return;
    }

    if (isBuildingsLoading || isBuildingsFetching) return;
    if (buildings.length === 0) {
      setSelectedBuildingId('');
      setSelectedFloorId('');
      setSelectedClassroomId('');
      return;
    }

    const selectedStillValid = buildings.some((building) => building.id === selectedBuildingId);
    if (selectedStillValid) return;

    const defaultBuilding = findDefaultBuilding(buildings);
    setSelectedFloorId('');
    setSelectedClassroomId('');
    setSelectedBuildingId(defaultBuilding?.id ?? '');
  }, [
    buildings,
    isBuildingsFetching,
    isBuildingsLoading,
    selectedBuildingId,
    selectedClassroomId,
    selectedFacultyId,
    selectedFloorId,
  ]);

  useEffect(() => {
    if (!selectedBuildingId) {
      if (selectedFloorId) setSelectedFloorId('');
      if (selectedClassroomId) setSelectedClassroomId('');
      return;
    }

    if (isFloorsLoading || isFloorsFetching) return;
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
  }, [floors, isFloorsFetching, isFloorsLoading, selectedBuildingId, selectedClassroomId, selectedFloorId]);

  useEffect(() => {
    if (!selectedClassroomId || isFloorViewLoading || !floorView) return;

    const classroomStillVisible = floorView.objects.some(
      (object) => object.classroomId === selectedClassroomId || object.id === selectedClassroomId,
    );
    if (!classroomStillVisible) {
      setSelectedClassroomId('');
    }
  }, [floorView, isFloorViewLoading, selectedClassroomId]);

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

  const handlePreviousDay = () => {
    setSelectedDate((current) => shiftDate(current, -1));
  };

  const handleToday = () => {
    setSelectedDate(toDateValue(new Date()));
  };

  const handleNextDay = () => {
    setSelectedDate((current) => shiftDate(current, 1));
  };

  const isBuildingSelectLoading = !!selectedFacultyId && (isBuildingsLoading || isBuildingsFetching);
  const isFloorLoading = !!selectedBuildingId && (isFloorsLoading || isFloorsFetching);
  const isLayoutLoading = !!selectedFloorId && (isFloorViewLoading || (isFloorViewFetching && !floorView));
  const isDailySchedulePending = !!selectedClassroomScheduleId && (isDailyScheduleLoading || (isDailyScheduleFetching && !dailySchedule));
  const hasFloorPlan = !!floorView?.backgroundImageBase64 && !!floorView.backgroundImageType;
  const canvasSize = getCanvasSize(floorView);
  const placedObjects = useMemo(() => floorView?.objects.filter((object) => object.placed !== false) ?? [], [floorView?.objects]);
  const unplacedObjects = useMemo(() => floorView?.objects.filter((object) => object.placed === false) ?? [], [floorView?.objects]);

  return (
    <main className="min-h-screen bg-slate-50">
      <PageContainer>
        <div className="space-y-4">
          <header className="relative overflow-hidden rounded-3xl border border-[#006482]/15 bg-gradient-to-br from-[#eff8ff] via-white to-white px-5 py-4 shadow-md sm:px-6">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#004b62] via-[#006482] to-[#fabc07]" />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Derslik Görüntüleme</h1>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
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
              <section className="dts-card grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(280px,1.2fr)]">
                <div className="min-w-0">
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#006482]/10 bg-[#eff8ff] text-[#006482]">
                      <Landmark className="h-4 w-4" />
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

                <div className="min-w-0">
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#006482]/10 bg-[#eff8ff] text-[#006482]">
                      <Building2 className="h-4 w-4" />
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

                <div className="min-w-0">
                  <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="text-sm font-bold text-slate-950">Katlar</h2>
                      <p className="truncate text-xs text-slate-500">
                        {selectedBuilding ? `${selectedBuilding.name} için tanımlı katlar` : 'Blok seçildiğinde listelenir.'}
                      </p>
                    </div>
                    {isFloorLoading && (
                      <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-400">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Katlar yükleniyor...
                      </span>
                    )}
                  </div>

                  {!selectedBuilding ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-xs font-semibold text-slate-400">
                      Katları görüntülemek için blok seçin.
                    </div>
                  ) : isFloorsError ? (
                    <EmptyState title="Katlar yüklenemedi." />
                  ) : !isFloorLoading && floors.length === 0 ? (
                    <EmptyState title="Bu blokta kat bilgisi bulunamadı." />
                  ) : (
                    <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-wrap">
                      {floors.map((floor) => (
                        <button
                          key={floor.id}
                          type="button"
                          onClick={() => handleFloorChange(floor.id)}
                          className={cn(
                            'min-w-24 rounded-2xl border px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#006482]/20',
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
                </div>
              </section>

              {selectedFloor && (
                <section className="dts-card p-4 sm:p-5">
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Kat Yerleşimi</p>
                      <span className="rounded-full bg-[#eff8ff] px-2.5 py-1 text-xs font-bold text-[#006482]">{selectedFloor.name}</span>
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

              <FormModal
                isOpen={!!selectedClassroomId}
                onClose={() => setSelectedClassroomId('')}
                title="Derslik Detayı"
                maxWidthClassName="max-w-2xl"
              >
                <ClassroomDetailContent
                  classroom={selectedClassroom}
                  facultyName={selectedFaculty?.name}
                  buildingName={selectedBuilding?.name}
                  floorName={selectedFloor?.name}
                  dailySchedule={dailySchedule}
                  selectedDate={selectedDate}
                  isDailyScheduleLoading={isDailySchedulePending}
                  isDailyScheduleFetching={isDailyScheduleFetching}
                  isDailyScheduleError={isDailyScheduleError}
                  onPreviousDay={handlePreviousDay}
                  onToday={handleToday}
                  onNextDay={handleNextDay}
                />
              </FormModal>
            </>
          )}
        </div>
      </PageContainer>
    </main>
  );
};
