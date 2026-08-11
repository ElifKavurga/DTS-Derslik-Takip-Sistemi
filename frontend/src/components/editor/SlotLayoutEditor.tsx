import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  BookOpen,
  Check,
  ChevronLeft,
  FlaskConical,
  Plus,
  Presentation,
  Save,
  Search,
  Trash2,
} from 'lucide-react';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { floorLayoutService } from '@/services/floorLayoutService';
import { useHeaderStore } from '@/store/useHeaderStore';
import {
  type ClassroomPlacement,
  type ClassroomPlacementType,
  type CreateSlotClassroomRequest,
  type FloorDetailResponse,
  type SlotLayoutResponse,
  type SpaceObjectRequest,
  type SpaceObjectResponse,
} from '@/types';
import { cn } from '@/utils/cn';

interface SlotLayoutEditorProps {
  floor: FloorDetailResponse;
}

const AUTO_COLUMNS = 3;
const DEFAULT_SLOT_WIDTH = 160;
const DEFAULT_SLOT_HEIGHT = 100;

type EquipmentState = {
  hasAirConditioning: boolean;
  hasProjector: boolean;
  hasSmartBoard: boolean;
  hasPrinter: boolean;
  hasInternet: boolean;
  hasSoundSystem: boolean;
  hasComputer: boolean;
  computerCount: number;
};

const DEFAULT_EQUIPMENT: EquipmentState = {
  hasAirConditioning: false,
  hasProjector: false,
  hasSmartBoard: false,
  hasPrinter: false,
  hasInternet: false,
  hasSoundSystem: false,
  hasComputer: false,
  computerCount: 1,
};

const EQUIPMENT_OPTIONS: Array<{ key: keyof Omit<EquipmentState, 'hasComputer' | 'computerCount'>; label: string }> = [
  { key: 'hasAirConditioning', label: 'Klima' },
  { key: 'hasProjector', label: 'Projeksiyon' },
  { key: 'hasSmartBoard', label: 'Akıllı Tahta' },
  { key: 'hasPrinter', label: 'Yazıcı' },
  { key: 'hasInternet', label: 'İnternet' },
  { key: 'hasSoundSystem', label: 'Ses Sistemi' },
];

const TEACHING_SPACE_TYPES: ClassroomPlacementType[] = ['CLASSROOM', 'LABORATORY', 'AMPHITHEATER'];

const TEACHING_SPACE_LABELS: Record<ClassroomPlacementType, string> = {
  CLASSROOM: 'Sınıf',
  LABORATORY: 'Laboratuvar',
  AMPHITHEATER: 'Amfi',
};

const TEACHING_SPACE_PLACEHOLDERS: Record<ClassroomPlacementType, { code: string; name: string }> = {
  CLASSROOM: { code: 'Örn. D101', name: 'Örn. Derslik 101' },
  LABORATORY: { code: 'Örn. LAB01', name: 'Örn. Bilgisayar Laboratuvarı' },
  AMPHITHEATER: { code: 'Örn. AMF01', name: 'Örn. Büyük Amfi' },
};

type ClassroomFormErrors = Partial<Record<'code' | 'name' | 'capacity' | 'computerCount' | 'general', string>>;

function isTeachingSpaceType(type: ClassroomPlacement['type'] | SpaceObjectRequest['type'] | undefined): type is ClassroomPlacementType {
  return TEACHING_SPACE_TYPES.includes(type as ClassroomPlacementType);
}

function getTeachingSpaceType(type: ClassroomPlacement['type'] | SpaceObjectRequest['type'] | undefined): ClassroomPlacementType {
  return isTeachingSpaceType(type)
    ? type as ClassroomPlacementType
    : 'CLASSROOM';
}

function getTeachingSpaceLabel(type: ClassroomPlacement['type'] | undefined): string {
  return TEACHING_SPACE_LABELS[getTeachingSpaceType(type)];
}

function getTeachingSpaceIcon(type: ClassroomPlacement['type'] | undefined) {
  switch (getTeachingSpaceType(type)) {
    case 'LABORATORY':
      return FlaskConical;
    case 'AMPHITHEATER':
      return Presentation;
    default:
      return BookOpen;
  }
}

function formatCapacity(capacity: number | undefined): string {
  return typeof capacity === 'number' && Number.isFinite(capacity)
    ? `${capacity} kişi`
    : 'Kapasite belirtilmemiş';
}

function formatName(name: string | undefined): string {
  return name?.trim() ? name : 'Ad belirtilmemiş';
}

function isNotFoundError(error: unknown): boolean {
  return error instanceof AxiosError && error.response?.status === 404;
}

function toRequest(object: SpaceObjectResponse): SpaceObjectRequest {
  return {
    id: object.id,
    classroomId: object.classroomId,
    type: object.type,
    status: object.status,
    label: object.label,
    code: object.code,
    capacity: object.capacity,
    positionX: object.positionX,
    positionY: object.positionY,
    width: object.width,
    height: object.height,
    rotation: object.rotation,
    slotRow: object.slotRow,
    slotColumn: object.slotColumn,
    metadataJson: object.metadataJson,
  };
}

function isClassroomObject(object: SpaceObjectRequest): boolean {
  return isTeachingSpaceType(object.type) && Boolean(object.classroomId);
}

function hasSlot(object: SpaceObjectRequest): boolean {
  return object.slotRow !== undefined && object.slotColumn !== undefined;
}

function getAutoSlotPosition(index: number) {
  return {
    row: Math.floor(index / AUTO_COLUMNS),
    column: index % AUTO_COLUMNS,
  };
}

function sortBySlot(a: SpaceObjectRequest, b: SpaceObjectRequest): number {
  const aIndex = (a.slotRow ?? 9999) * AUTO_COLUMNS + (a.slotColumn ?? 9999);
  const bIndex = (b.slotRow ?? 9999) * AUTO_COLUMNS + (b.slotColumn ?? 9999);
  return aIndex - bIndex || (a.code ?? a.label).localeCompare(b.code ?? b.label);
}

function getSlotOrderIndex(object: SpaceObjectRequest): number {
  return (object.slotRow ?? 0) * AUTO_COLUMNS + (object.slotColumn ?? 0);
}

function getLinearSlotLabel(index: number): string {
  return `A${index + 1}`;
}

function compactPlacements(objects: SpaceObjectRequest[]): SpaceObjectRequest[] {
  const placedObjects = objects
    .filter((object) => isClassroomObject(object) && hasSlot(object))
    .sort(sortBySlot)
    .map((object, index) => {
      const slot = getAutoSlotPosition(index);
      return { ...object, slotRow: slot.row, slotColumn: slot.column };
    });
  const unassignedObjects = objects.filter((object) => !isClassroomObject(object) || !hasSlot(object));

  return [...placedObjects, ...unassignedObjects];
}

function appendPlacement(objects: SpaceObjectRequest[], placement: SpaceObjectRequest): SpaceObjectRequest[] {
  const placedCount = objects.filter((object) => isClassroomObject(object) && hasSlot(object)).length;
  const slot = getAutoSlotPosition(placedCount);
  return [
    ...objects,
    { ...placement, slotRow: slot.row, slotColumn: slot.column },
  ];
}

function assignNextSlot(objects: SpaceObjectRequest[], classroomId: string, classroom: ClassroomPlacement): SpaceObjectRequest[] {
  const placedCount = objects.filter((object) => isClassroomObject(object) && hasSlot(object)).length;
  const slot = getAutoSlotPosition(placedCount);
  return objects.map((object) => {
    if (object.classroomId !== classroomId) return object;
    return {
      ...object,
      type: classroom.type,
      label: classroom.name,
      code: classroom.code,
      capacity: classroom.capacity,
      slotRow: slot.row,
      slotColumn: slot.column,
    };
  });
}

function buildClassroomObject(classroom: ClassroomPlacement, slotIndex: number): SpaceObjectRequest {
  const slot = getAutoSlotPosition(slotIndex);

  return {
    id: crypto.randomUUID(),
    classroomId: classroom.id,
    type: classroom.type,
    status: 'EMPTY',
    label: classroom.name,
    code: classroom.code,
    capacity: classroom.capacity,
    positionX: 0,
    positionY: 0,
    width: DEFAULT_SLOT_WIDTH,
    height: DEFAULT_SLOT_HEIGHT,
    rotation: 0,
    slotRow: slot.row,
    slotColumn: slot.column,
  };
}

function buildEquipmentPayload(equipment: EquipmentState): string | undefined {
  const payload = {
    hasAirConditioning: equipment.hasAirConditioning,
    hasProjector: equipment.hasProjector,
    hasSmartBoard: equipment.hasSmartBoard,
    hasPrinter: equipment.hasPrinter,
    hasInternet: equipment.hasInternet,
    hasSoundSystem: equipment.hasSoundSystem,
    computerCount: equipment.hasComputer ? equipment.computerCount : undefined,
  };
  const hasAnyValue = Object.values(payload).some((value) => value === true || typeof value === 'number');
  return hasAnyValue ? JSON.stringify(payload) : undefined;
}

export const SlotLayoutEditor = ({ floor }: SlotLayoutEditorProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setMeta = useHeaderStore((state) => state.setMeta);

  const [objects, setObjects] = useState<SpaceObjectRequest[]>([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);
  const [classroomSearch, setClassroomSearch] = useState('');
  const [newClassroom, setNewClassroom] = useState<CreateSlotClassroomRequest>({
    type: 'CLASSROOM',
    code: '',
    name: '',
    capacity: 30,
  });
  const [equipment, setEquipment] = useState<EquipmentState>({ ...DEFAULT_EQUIPMENT });
  const [formErrors, setFormErrors] = useState<ClassroomFormErrors>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [pendingRemovalClassroomId, setPendingRemovalClassroomId] = useState<string | null>(null);
  const [pendingDeleteClassroomId, setPendingDeleteClassroomId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const {
    data: slotLayout,
    error: slotLayoutError,
    isLoading: isSlotLoading,
  } = useQuery<SlotLayoutResponse>({
    queryKey: ['slotLayout', floor.id],
    queryFn: () => floorLayoutService.getSlotLayout(floor.id),
    retry: false,
  });

  const { data: classrooms = [] } = useQuery<ClassroomPlacement[]>({
    queryKey: ['floorClassrooms', floor.id],
    queryFn: () => floorLayoutService.getClassroomsForPlacement(floor.id),
  });

  const eligibleClassrooms = useMemo(
    () => classrooms.filter((classroom) => isTeachingSpaceType(classroom.type)),
    [classrooms],
  );

  const classroomById = useMemo(() => {
    const map = new Map<string, ClassroomPlacement>();
    eligibleClassrooms.forEach((classroom) => map.set(classroom.id, classroom));
    return map;
  }, [eligibleClassrooms]);

  const saveObjects = useMemo(
    () => compactPlacements(objects.filter((object) => isClassroomObject(object) && classroomById.has(object.classroomId!))),
    [classroomById, objects],
  );

  const placedObjects = useMemo(
    () => saveObjects.filter(hasSlot).sort(sortBySlot),
    [saveObjects],
  );

  const objectByClassroomId = useMemo(() => {
    const map = new Map<string, SpaceObjectRequest>();
    saveObjects.forEach((object) => {
      if (object.classroomId) map.set(object.classroomId, object);
    });
    return map;
  }, [saveObjects]);

  const autoRows = Math.max(1, Math.ceil(Math.max(placedObjects.length, 1) / AUTO_COLUMNS));
  const unassignedCount = Math.max(eligibleClassrooms.length - placedObjects.length, 0);

  useEffect(() => {
    setMeta(`${floor.name} - Slot Düzeni`, [
      'Ana Ekran',
      'Kampüs Yönetimi',
      'Fakülteler',
      floor.facultyName,
      floor.buildingName,
      floor.name,
    ]);
  }, [floor, setMeta]);

  useEffect(() => {
    if (!slotLayout) return;

    const classroomObjects = slotLayout.objects
      .map(toRequest)
      .filter(isClassroomObject);

    setObjects(compactPlacements(classroomObjects));
    setSelectedClassroomId(null);
    setIsDirty(false);
  }, [slotLayout]);

  const saveMutation = useMutation({
    mutationFn: () => floorLayoutService.saveSlotLayout(floor.id, {
      rows: autoRows,
      columns: AUTO_COLUMNS,
      objects: saveObjects,
    }),
    onSuccess: (data) => {
      queryClient.setQueryData(['slotLayout', floor.id], data);
      queryClient.invalidateQueries({ queryKey: ['floorDetail', floor.id] });
      queryClient.invalidateQueries({ queryKey: ['floorClassrooms', floor.id] });
      toast.success('Slot yerleşimi kaydedildi.');
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message ?? 'Slot yerleşimi kaydedilemedi.');
    },
  });

  const createClassroomMutation = useMutation({
    mutationFn: (payload: CreateSlotClassroomRequest) => floorLayoutService.createSlotTeachingSpace(floor.id, payload),
    onSuccess: (data) => {
      const createdObject = data.objects
        .filter((object) => isClassroomObject(toRequest(object)))
        .sort((a, b) => (a.code ?? '').localeCompare(b.code ?? ''))
        .find((object) => object.code?.toLowerCase() === newClassroom.code.trim().toLowerCase());

      if (createdObject?.classroomId) {
        queryClient.setQueryData<ClassroomPlacement[]>(['floorClassrooms', floor.id], (current = []) => {
          if (current.some((classroom) => classroom.id === createdObject.classroomId)) return current;
          return [
            ...current,
            {
              id: createdObject.classroomId!,
              code: createdObject.code ?? newClassroom.code.trim(),
              name: createdObject.label,
              capacity: createdObject.capacity ?? newClassroom.capacity,
              type: newClassroom.type ?? 'CLASSROOM',
              equipment: buildEquipmentPayload(equipment),
            },
          ].sort((a, b) => a.code.localeCompare(b.code));
        });
        setSelectedClassroomId(createdObject.classroomId);
      }

      queryClient.setQueryData(['slotLayout', floor.id], data);
      queryClient.invalidateQueries({ queryKey: ['floorDetail', floor.id] });
      queryClient.invalidateQueries({ queryKey: ['floorClassrooms', floor.id] });
      setObjects(compactPlacements(data.objects.map(toRequest).filter(isClassroomObject)));
      resetClassroomForm();
      setIsAddModalOpen(false);
      setIsDirty(false);
      toast.success('Ders alanı oluşturuldu ve slota yerleştirildi.');
    },
    onError: (error: AxiosError<{ message: string }>) => {
      const message = error.response?.data?.message ?? 'Ders alanı oluşturulamadı.';
      setFormErrors((prev) => ({
        ...prev,
        [message.toLowerCase().includes('kod') ? 'code' : 'general']: message,
      }));
      toast.error(message);
    },
  });

  const deleteTeachingSpaceMutation = useMutation({
    mutationFn: (classroomId: string) => floorLayoutService.deleteUnassignedSlotTeachingSpace(floor.id, classroomId),
    onSuccess: (_, classroomId) => {
      queryClient.setQueryData<ClassroomPlacement[]>(['floorClassrooms', floor.id], (current = []) =>
        current.filter((classroom) => classroom.id !== classroomId)
      );
      queryClient.invalidateQueries({ queryKey: ['floorDetail', floor.id] });
      queryClient.invalidateQueries({ queryKey: ['floorClassrooms', floor.id] });
      queryClient.invalidateQueries({ queryKey: ['slotLayout', floor.id] });
      setObjects((prev) => prev.filter((object) => object.classroomId !== classroomId));
      if (selectedClassroomId === classroomId) {
        setSelectedClassroomId(null);
      }
      setPendingDeleteClassroomId(null);
      toast.success('Ders alanı silindi.');
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message ?? 'Ders alanı silinemedi.');
    },
  });

  const filteredClassrooms = useMemo(() => {
    const query = classroomSearch.trim().toLowerCase();
    if (!query) return eligibleClassrooms;

    return eligibleClassrooms.filter((classroom) =>
      classroom.code.toLowerCase().includes(query) ||
      classroom.name.toLowerCase().includes(query) ||
      getTeachingSpaceLabel(classroom.type).toLowerCase().includes(query)
    );
  }, [classroomSearch, eligibleClassrooms]);

  const placedClassrooms = useMemo(
    () => filteredClassrooms.filter((classroom) => hasSlot(objectByClassroomId.get(classroom.id) ?? {} as SpaceObjectRequest)),
    [filteredClassrooms, objectByClassroomId],
  );

  const unassignedClassrooms = useMemo(
    () => filteredClassrooms.filter((classroom) => !hasSlot(objectByClassroomId.get(classroom.id) ?? {} as SpaceObjectRequest)),
    [filteredClassrooms, objectByClassroomId],
  );

  const selectedClassroom = selectedClassroomId ? classroomById.get(selectedClassroomId) ?? null : null;
  const selectedObject = selectedClassroomId ? objectByClassroomId.get(selectedClassroomId) ?? null : null;
  const pendingRemovalClassroom = pendingRemovalClassroomId ? classroomById.get(pendingRemovalClassroomId) ?? null : null;
  const pendingDeleteClassroom = pendingDeleteClassroomId ? classroomById.get(pendingDeleteClassroomId) ?? null : null;

  const resetClassroomForm = () => {
    setNewClassroom({ type: 'CLASSROOM', code: '', name: '', capacity: 30 });
    setEquipment({ ...DEFAULT_EQUIPMENT });
    setFormErrors({});
  };

  const openAddModal = () => {
    resetClassroomForm();
    setIsAddModalOpen(true);
  };

  const submitNewClassroom = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = newClassroom.code.trim();
    const name = newClassroom.name.trim();
    const type = newClassroom.type ?? 'CLASSROOM';
    const nextErrors: ClassroomFormErrors = {};

    if (!code) {
      nextErrors.code = 'Ders alanı kodu zorunludur.';
    }
    if (!name) {
      nextErrors.name = 'Ders alanı adı zorunludur.';
    }
    if (!Number.isInteger(Number(newClassroom.capacity)) || Number(newClassroom.capacity) <= 0) {
      nextErrors.capacity = 'Kapasite 1 veya daha büyük olmalıdır.';
    }
    if (eligibleClassrooms.some((classroom) => classroom.code.toLowerCase() === code.toLowerCase())) {
      nextErrors.code = 'Bu ders alanı kodu zaten kullanılıyor.';
    }
    if (
      equipment.hasComputer &&
      (!Number.isInteger(Number(equipment.computerCount)) || Number(equipment.computerCount) < 1)
    ) {
      nextErrors.computerCount = 'Bilgisayar sayısı pozitif tam sayı olmalıdır.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    setFormErrors({});
    createClassroomMutation.mutate({
      code,
      name,
      type,
      capacity: Number(newClassroom.capacity),
      equipment: buildEquipmentPayload(equipment),
    });
  };

  const placeClassroom = (classroomId: string) => {
    const classroom = classroomById.get(classroomId);
    if (!classroom) {
      toast.error('Slot Layout yalnızca sınıf, laboratuvar ve amfi için kullanılabilir.');
      return;
    }

    const existing = objectByClassroomId.get(classroomId);
    if (existing && hasSlot(existing)) {
      setSelectedClassroomId(classroomId);
      toast.error(`${classroom.code} zaten slotta yer alıyor.`);
      return;
    }

    const nextSlotIndex = placedObjects.length;
    setObjects((prev) => {
      const current = prev.find((object) => object.classroomId === classroomId);
      if (current) {
        return compactPlacements(assignNextSlot(prev, classroomId, classroom));
      }

      return compactPlacements(appendPlacement(prev, buildClassroomObject(classroom, nextSlotIndex)));
    });

    setSelectedClassroomId(classroomId);
    setIsDirty(true);
    setIsAddModalOpen(false);
  };

  const removeClassroomFromSlot = (classroomId: string) => {
    setObjects((prev) => compactPlacements(prev.map((object) => object.classroomId === classroomId
      ? { ...object, slotRow: undefined, slotColumn: undefined }
      : object)));
    setSelectedClassroomId(classroomId);
    setPendingRemovalClassroomId(null);
    setIsDirty(true);
  };

  const selectClassroom = (classroomId: string) => {
    setSelectedClassroomId(classroomId);
  };

  const handlePlacedClassroomClick = (classroomId: string) => {
    const targetObject = objectByClassroomId.get(classroomId);
    if (!targetObject || !hasSlot(targetObject)) {
      setSelectedClassroomId(classroomId);
      return;
    }

    if (!selectedClassroomId) {
      setSelectedClassroomId(classroomId);
      return;
    }

    if (selectedClassroomId === classroomId) {
      setSelectedClassroomId(null);
      return;
    }

    const sourceObject = objectByClassroomId.get(selectedClassroomId);
    if (!sourceObject || !hasSlot(sourceObject)) {
      setSelectedClassroomId(classroomId);
      return;
    }

    setObjects((prev) => prev.map((object) => {
      if (object.id === sourceObject.id) {
        return { ...object, slotRow: targetObject.slotRow, slotColumn: targetObject.slotColumn };
      }
      if (object.id === targetObject.id) {
        return { ...object, slotRow: sourceObject.slotRow, slotColumn: sourceObject.slotColumn };
      }
      return object;
    }));
    setSelectedClassroomId(null);
    setIsDirty(true);
  };

  if (isSlotLoading && !slotLayout) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#006482] border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Slot düzeni yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (slotLayoutError && !slotLayout && !isNotFoundError(slotLayoutError)) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 p-6">
        <div className="rounded-lg border border-red-200 bg-white p-6 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-500" />
          <p className="mt-3 text-sm font-semibold text-slate-800">Slot düzeni yüklenemedi.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-2 shadow-sm">
        <button
          type="button"
          onClick={() => navigate(`/super-admin/binalar/${floor.buildingId}`)}
          className="group flex items-center gap-1 text-[10px] font-semibold text-slate-400 transition-colors hover:text-slate-800"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Geri
        </button>
        <div className="h-4 w-px bg-slate-200" />
        <div className="flex min-w-44 flex-col">
          <span className="text-sm font-bold leading-tight text-slate-900">{floor.name} - Slot Yerleşimi</span>
          <span className="text-[9px] leading-none text-slate-400">{floor.buildingName} · {floor.facultyName}</span>
        </div>
        <span className="rounded-full border border-[#88d0f2]/50 bg-[#eff8ff] px-2.5 py-1 text-[10px] font-bold text-[#006482]">
          Dinamik Slot
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <SecondaryButton
            type="button"
            onClick={openAddModal}
            icon={<Plus className="h-3.5 w-3.5" />}
            className="h-8 text-xs"
          >
            Ders Alanı Ekle
          </SecondaryButton>
          <PrimaryButton
            type="button"
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
            disabled={!isDirty}
            icon={<Save className="h-3.5 w-3.5" />}
            className={cn('h-8 text-xs', !isDirty && 'bg-slate-300 hover:bg-slate-300')}
          >
            {isDirty ? 'Kaydet' : 'Kaydedildi'}
          </PrimaryButton>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="flex w-72 shrink-0 flex-col border-r border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Ders Alanları</p>
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={classroomSearch}
                onChange={(event) => setClassroomSearch(event.target.value)}
                placeholder="Ders alanı ara..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs font-medium text-slate-800 outline-none focus:border-[#006482] focus:ring-2 focus:ring-[#006482]/20"
              />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                <p className="text-[9px] font-semibold text-slate-400">Toplam alan</p>
                <p className="text-sm font-bold text-slate-900">{eligibleClassrooms.length}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                <p className="text-[9px] font-semibold text-slate-400">Slot</p>
                <p className="text-sm font-bold text-slate-900">{placedObjects.length}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                <p className="text-[9px] font-semibold text-slate-400">Yerleşmemiş</p>
                <p className="text-sm font-bold text-slate-900">{unassignedCount}</p>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {eligibleClassrooms.length === 0 ? (
              <EmptyPanel
                title="Bu katta henüz ders alanı bulunmuyor."
                description="Ders alanı ekleyerek başlayın."
                action={(
                  <PrimaryButton
                    type="button"
                    onClick={openAddModal}
                    icon={<Plus className="h-3.5 w-3.5" />}
                    className="h-8 text-xs"
                  >
                    Ders Alanı Ekle
                  </PrimaryButton>
                )}
              />
            ) : (
              <div className="space-y-4">
                <ClassroomSection
                  title="Slotta"
                  classrooms={placedClassrooms}
                  objectByClassroomId={objectByClassroomId}
                  selectedClassroomId={selectedClassroomId}
                  onSelect={selectClassroom}
                />
                <ClassroomSection
                  title="Yerleştirilmemiş"
                  classrooms={unassignedClassrooms}
                  objectByClassroomId={objectByClassroomId}
                  selectedClassroomId={selectedClassroomId}
                  onSelect={selectClassroom}
                  onDelete={(classroomId) => setPendingDeleteClassroomId(classroomId)}
                />
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 p-3">
            {selectedClassroom ? (
              <div className="rounded-lg border border-[#88d0f2]/60 bg-[#eff8ff] p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#006482]">Seçili Ders Alanı</p>
                <p className="mt-2 truncate text-sm font-bold text-slate-900">{selectedClassroom.code}</p>
                <p className="truncate text-xs text-slate-500">{formatName(selectedClassroom.name)}</p>
                <p className="mt-1 text-xs font-semibold text-slate-600">
                  {getTeachingSpaceLabel(selectedClassroom.type)} · {formatCapacity(selectedClassroom.capacity)}
                </p>
                {selectedObject && hasSlot(selectedObject) ? (
                  <SecondaryButton
                    type="button"
                    onClick={() => setPendingRemovalClassroomId(selectedClassroom.id)}
                    icon={<Trash2 className="h-3.5 w-3.5" />}
                    className="mt-3 w-full justify-center text-xs"
                  >
                    Slotu Kaldır
                  </SecondaryButton>
                ) : (
                  <PrimaryButton
                    type="button"
                    onClick={() => placeClassroom(selectedClassroom.id)}
                    icon={<Plus className="h-3.5 w-3.5" />}
                    className="mt-3 w-full justify-center text-xs"
                  >
                    Slot Oluştur
                  </PrimaryButton>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-500">Ders alanı seçimi yok</p>
              </div>
            )}
          </div>
        </aside>

        <main
          className="min-w-0 flex-1 overflow-auto p-4"
          onClick={() => setSelectedClassroomId(null)}
        >
          {eligibleClassrooms.length === 0 ? (
            <div className="flex min-h-full items-center justify-center">
              <EmptyPanel
                title="Bu katta henüz ders alanı bulunmuyor."
                description="Ders alanı ekleyerek başlayın."
                action={(
                  <PrimaryButton
                    type="button"
                    onClick={openAddModal}
                    icon={<Plus className="h-3.5 w-3.5" />}
                    className="h-8 text-xs"
                  >
                    Ders Alanı Ekle
                  </PrimaryButton>
                )}
              />
            </div>
          ) : placedObjects.length === 0 ? (
            <div className="flex min-h-full items-center justify-center">
              <EmptyPanel
                title="Henüz yerleşim bulunmuyor."
                description="Sol panelden bir ders alanı seçip slot oluşturabilirsiniz."
              />
            </div>
          ) : (
            <div className="grid w-full grid-cols-[repeat(auto-fit,minmax(200px,220px))] justify-start gap-3">
              {placedObjects.map((object, index) => {
                const classroom = object.classroomId ? classroomById.get(object.classroomId) : null;
                if (!classroom) return null;

                const label = getLinearSlotLabel(index);
                const isSelected = object.classroomId === selectedClassroomId;
                const Icon = getTeachingSpaceIcon(classroom.type);

                return (
                  <button
                    key={object.id}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handlePlacedClassroomClick(classroom.id);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Delete' || event.key === 'Backspace') {
                        event.preventDefault();
                        setPendingRemovalClassroomId(classroom.id);
                      }
                    }}
                    aria-label={`Slot ${label} - ${classroom.code} - ${getTeachingSpaceLabel(classroom.type)} - ${formatCapacity(classroom.capacity)}`}
                    className={cn(
                      'group relative flex h-36 flex-col rounded-lg border bg-white p-4 text-left shadow-sm outline-none transition-all focus:ring-2 focus:ring-[#006482]/25',
                      isSelected ? 'border-[#006482] ring-2 ring-[#006482]/15' : 'border-slate-200 hover:border-[#88d0f2] hover:shadow-md',
                    )}
                  >
                    <span className="absolute right-3 top-3 text-[10px] font-bold text-slate-300">{label}</span>
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eff8ff] text-[#006482]">
                        <Icon className="h-4 w-4" />
                      </div>
                      <p className="mt-3 max-w-full truncate text-xl font-extrabold text-slate-900">{classroom.code}</p>
                      <p className="mt-1 max-w-full truncate text-xs font-semibold text-slate-500">{getTeachingSpaceLabel(classroom.type)}</p>
                      <p className="mt-1 text-xs font-bold text-slate-600">{formatCapacity(classroom.capacity)}</p>
                    </div>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(event) => {
                        event.stopPropagation();
                        setPendingRemovalClassroomId(classroom.id);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          event.stopPropagation();
                          setPendingRemovalClassroomId(classroom.id);
                        }
                      }}
                      aria-label={`${label} slotundan ${classroom.code} ders alanını çıkar`}
                      className="absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 opacity-0 shadow-sm transition hover:border-red-200 hover:text-red-500 group-hover:opacity-100 group-focus:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </main>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 bg-white px-4 py-1">
        <span className="text-[9px] text-slate-400">
          Toplam {eligibleClassrooms.length} ders alanı · {placedObjects.length} slot
          {unassignedCount > 0 ? ` · ${unassignedCount} yerleştirilmemiş` : ''}
        </span>
        <span className={cn('text-[9px] font-semibold', isDirty ? 'text-amber-600' : 'text-slate-300')}>
          {isDirty ? 'Kaydedilmemiş değişiklik var' : 'Güncel'}
        </span>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4">
          <div className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-lg border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Ders Alanı Ekle</p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">Yeni ders alanı bilgilerini girin</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetClassroomForm();
                  setIsAddModalOpen(false);
                }}
                className="rounded-md px-2 py-1 text-sm font-bold text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                Kapat
              </button>
            </div>

            <form onSubmit={submitNewClassroom} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
                {formErrors.general && (
                  <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-600">
                    {formErrors.general}
                  </div>
                )}

                <div className="space-y-2">
                  <span className="dts-input-label">Ders Alanı Türü</span>
                  <div className="grid grid-cols-3 gap-2">
                    {TEACHING_SPACE_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setNewClassroom((prev) => ({ ...prev, type }));
                          setFormErrors({});
                        }}
                        className={cn(
                          'rounded-lg border px-3 py-2 text-xs font-bold transition-colors',
                          (newClassroom.type ?? 'CLASSROOM') === type
                            ? 'border-[#006482] bg-[#eff8ff] text-[#006482]'
                            : 'border-slate-200 bg-white text-slate-500 hover:border-[#88d0f2] hover:text-slate-800',
                        )}
                      >
                        {TEACHING_SPACE_LABELS[type]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="dts-input-label">Kod *</label>
                  <input
                    value={newClassroom.code}
                    onChange={(event) => {
                      setNewClassroom((prev) => ({ ...prev, code: event.target.value }));
                      setFormErrors((prev) => ({ ...prev, code: undefined, general: undefined }));
                    }}
                    placeholder={TEACHING_SPACE_PLACEHOLDERS[newClassroom.type ?? 'CLASSROOM'].code}
                    className={cn('dts-input', formErrors.code && 'border-red-300 focus:border-red-400 focus:ring-red-100')}
                    autoComplete="off"
                  />
                  {formErrors.code && <p className="text-xs font-semibold text-red-500">{formErrors.code}</p>}
                </div>

                <div className="space-y-1">
                  <label className="dts-input-label">Ad *</label>
                  <input
                    value={newClassroom.name}
                    onChange={(event) => {
                      setNewClassroom((prev) => ({ ...prev, name: event.target.value }));
                      setFormErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    placeholder={TEACHING_SPACE_PLACEHOLDERS[newClassroom.type ?? 'CLASSROOM'].name}
                    className={cn('dts-input', formErrors.name && 'border-red-300 focus:border-red-400 focus:ring-red-100')}
                    autoComplete="off"
                  />
                  {formErrors.name && <p className="text-xs font-semibold text-red-500">{formErrors.name}</p>}
                </div>

                <div className="space-y-1">
                  <label className="dts-input-label">Kapasite *</label>
                  <input
                    type="number"
                    min={1}
                    value={newClassroom.capacity}
                    onChange={(event) => {
                      setNewClassroom((prev) => ({ ...prev, capacity: Number(event.target.value) }));
                      setFormErrors((prev) => ({ ...prev, capacity: undefined }));
                    }}
                    className={cn('dts-input', formErrors.capacity && 'border-red-300 focus:border-red-400 focus:ring-red-100')}
                  />
                  {formErrors.capacity && <p className="text-xs font-semibold text-red-500">{formErrors.capacity}</p>}
                </div>

                <div className="space-y-2">
                  <span className="dts-input-label">Donanımlar</span>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {EQUIPMENT_OPTIONS.map((option) => (
                      <EquipmentToggle
                        key={option.key}
                        label={option.label}
                        checked={equipment[option.key]}
                        onChange={() => setEquipment((prev) => ({ ...prev, [option.key]: !prev[option.key] }))}
                      />
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-slate-800">Bilgisayar</p>
                    <div className="grid grid-cols-2 gap-1 rounded-md bg-white p-1 shadow-sm">
                      <button
                        type="button"
                        onClick={() => {
                          setEquipment((prev) => ({ ...prev, hasComputer: true }));
                          setFormErrors((prev) => ({ ...prev, computerCount: undefined }));
                        }}
                        className={cn(
                          'rounded px-3 py-1.5 text-xs font-bold transition-colors',
                          equipment.hasComputer ? 'bg-[#006482] text-white' : 'text-slate-500 hover:bg-slate-100',
                        )}
                      >
                        Var
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEquipment((prev) => ({ ...prev, hasComputer: false, computerCount: 1 }));
                          setFormErrors((prev) => ({ ...prev, computerCount: undefined }));
                        }}
                        className={cn(
                          'rounded px-3 py-1.5 text-xs font-bold transition-colors',
                          !equipment.hasComputer ? 'bg-slate-200 text-slate-700' : 'text-slate-500 hover:bg-slate-100',
                        )}
                      >
                        Yok
                      </button>
                    </div>
                  </div>

                  {equipment.hasComputer && (
                    <div className="mt-3 space-y-1">
                      <label className="dts-input-label">Bilgisayar Sayısı *</label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={equipment.computerCount}
                        onChange={(event) => {
                          setEquipment((prev) => ({ ...prev, computerCount: Number(event.target.value) }));
                          setFormErrors((prev) => ({ ...prev, computerCount: undefined }));
                        }}
                        className={cn('dts-input', formErrors.computerCount && 'border-red-300 focus:border-red-400 focus:ring-red-100')}
                      />
                      {formErrors.computerCount && (
                        <p className="text-xs font-semibold text-red-500">{formErrors.computerCount}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 bg-white p-5">
                <SecondaryButton
                  type="button"
                  onClick={() => {
                    resetClassroomForm();
                    setIsAddModalOpen(false);
                  }}
                >
                  Vazgeç
                </SecondaryButton>
                <PrimaryButton type="submit" loading={createClassroomMutation.isPending}>
                  Ders Alanı Oluştur
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {pendingRemovalClassroom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4">
          <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500">
                <Trash2 className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Slotu kaldır</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  Bu işlem {pendingRemovalClassroom.code} ders alanını silmez. Sadece slot yerleşimini kaldırır.
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <SecondaryButton type="button" onClick={() => setPendingRemovalClassroomId(null)}>
                Vazgeç
              </SecondaryButton>
              <PrimaryButton
                type="button"
                onClick={() => removeClassroomFromSlot(pendingRemovalClassroom.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                Slotu Kaldır
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {pendingDeleteClassroom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4">
          <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500">
                <Trash2 className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Ders alanını sil</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  {pendingDeleteClassroom.code} kaydını tamamen silmek istediğinize emin misiniz? Bu işlem yalnızca slot yerleşimini değil, fiziksel ders alanı kaydını da siler.
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <SecondaryButton
                type="button"
                onClick={() => setPendingDeleteClassroomId(null)}
                disabled={deleteTeachingSpaceMutation.isPending}
              >
                Vazgeç
              </SecondaryButton>
              <PrimaryButton
                type="button"
                onClick={() => deleteTeachingSpaceMutation.mutate(pendingDeleteClassroom.id)}
                loading={deleteTeachingSpaceMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                Sil
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface EmptyPanelProps {
  title: string;
  description: string;
  action?: ReactNode;
}

interface EquipmentToggleProps {
  label: string;
  checked: boolean;
  onChange: () => void;
}

const EquipmentToggle = ({ label, checked, onChange }: EquipmentToggleProps) => (
  <button
    type="button"
    aria-pressed={checked}
    onClick={onChange}
    className={cn(
      'flex min-h-10 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-semibold transition-colors',
      checked
        ? 'border-[#006482] bg-[#eff8ff] text-slate-900'
        : 'border-slate-200 bg-white text-slate-500 hover:border-[#88d0f2] hover:text-slate-800',
    )}
  >
    <span
      className={cn(
        'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors',
        checked ? 'border-[#006482] bg-[#006482] text-white' : 'border-slate-300 bg-white text-transparent',
      )}
    >
      <Check className="h-3.5 w-3.5" />
    </span>
    <span className="min-w-0 truncate">{label}</span>
  </button>
);

const EmptyPanel = ({ title, description, action }: EmptyPanelProps) => (
  <div className="w-full max-w-sm rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center shadow-sm">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-[#88d0f2]/40 bg-[#eff8ff] text-[#006482]">
      <BookOpen className="h-6 w-6" />
    </div>
    <p className="mt-3 text-sm font-bold text-slate-900">{title}</p>
    <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
    {action && <div className="mt-4 flex justify-center">{action}</div>}
  </div>
);

interface ClassroomSectionProps {
  title: string;
  classrooms: ClassroomPlacement[];
  objectByClassroomId: Map<string, SpaceObjectRequest>;
  selectedClassroomId: string | null;
  onSelect: (classroomId: string) => void;
  onDelete?: (classroomId: string) => void;
}

const ClassroomSection = ({
  title,
  classrooms,
  objectByClassroomId,
  selectedClassroomId,
  onSelect,
  onDelete,
}: ClassroomSectionProps) => (
  <section>
    <div className="mb-2 flex items-center justify-between">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{title}</p>
      <span className="text-[10px] font-bold text-slate-300">{classrooms.length}</span>
    </div>
    <div className="space-y-1">
      {classrooms.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-400">
          Kayıt yok
        </div>
      ) : classrooms.map((classroom) => (
        <ClassroomListButton
          key={classroom.id}
          classroom={classroom}
          object={objectByClassroomId.get(classroom.id)}
          selected={classroom.id === selectedClassroomId}
          onSelect={() => onSelect(classroom.id)}
          onDelete={onDelete ? () => onDelete(classroom.id) : undefined}
        />
      ))}
    </div>
  </section>
);

interface ClassroomListButtonProps {
  classroom: ClassroomPlacement;
  object?: SpaceObjectRequest;
  selected: boolean;
  onSelect: () => void;
  onDelete?: () => void;
}

const ClassroomListButton = ({ classroom, object, selected, onSelect, onDelete }: ClassroomListButtonProps) => {
  const slotLabel = object && hasSlot(object)
    ? getLinearSlotLabel(getSlotOrderIndex(object))
    : 'Yerleştirilmemiş';
  const Icon = getTeachingSpaceIcon(classroom.type);

  return (
    <div
      className={cn(
        'group relative rounded-lg border outline-none transition-all focus-within:ring-2 focus-within:ring-[#006482]/20',
        selected
          ? 'border-[#006482] bg-[#eff8ff] shadow-sm'
          : 'border-slate-200 bg-white hover:border-[#88d0f2] hover:bg-slate-50',
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-label={`${classroom.code} - ${getTeachingSpaceLabel(classroom.type)} - ${formatCapacity(classroom.capacity)} - ${slotLabel}`}
        className="flex w-full items-center gap-2 rounded-lg p-2 pr-9 text-left outline-none"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-bold text-slate-900">{classroom.code}</p>
          </div>
          <p className="truncate text-[11px] font-medium text-slate-500">
            {getTeachingSpaceLabel(classroom.type)} · {formatCapacity(classroom.capacity)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="max-w-24 truncate text-[10px] font-bold text-slate-600">{formatName(classroom.name)}</p>
          <p className={cn(
            'text-[10px] font-bold',
            slotLabel === 'Yerleştirilmemiş' ? 'text-slate-300' : 'text-[#006482]',
          )}
          >
            {slotLabel}
          </p>
        </div>
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          aria-label={`${classroom.code} ders alanını sil`}
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md border border-red-100 bg-white text-red-500 opacity-100 shadow-sm transition hover:bg-red-50 focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};
