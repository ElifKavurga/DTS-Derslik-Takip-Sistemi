import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  BookOpen,
  Check,
  ChevronLeft,
  Move,
  Plus,
  Save,
  Search,
  Trash2,
} from 'lucide-react';

import { STATUS_DOT_CLASS } from '@/components/editor/spaceNodeConfig';
import { getSlotLabel } from '@/components/editor/slotUtils';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { floorLayoutService } from '@/services/floorLayoutService';
import { useHeaderStore } from '@/store/useHeaderStore';
import {
  type ClassroomPlacement,
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

type ClassroomFormErrors = Partial<Record<'code' | 'name' | 'capacity' | 'computerCount' | 'general', string>>;

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
  return object.type === 'CLASSROOM' && Boolean(object.classroomId);
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

function compactPlacements(objects: SpaceObjectRequest[]): SpaceObjectRequest[] {
  let nextSlotIndex = 0;
  const placedIds = new Set(
    objects
      .filter((object) => isClassroomObject(object) && hasSlot(object))
      .sort(sortBySlot)
      .map((object) => object.id),
  );

  return objects.map((object) => {
    if (!placedIds.has(object.id)) return object;
    const slot = getAutoSlotPosition(nextSlotIndex);
    nextSlotIndex += 1;
    return { ...object, slotRow: slot.row, slotColumn: slot.column };
  });
}

function buildClassroomObject(classroom: ClassroomPlacement, slotIndex: number): SpaceObjectRequest {
  const slot = getAutoSlotPosition(slotIndex);

  return {
    id: crypto.randomUUID(),
    classroomId: classroom.id,
    type: 'CLASSROOM',
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
    code: '',
    name: '',
    capacity: 30,
  });
  const [equipment, setEquipment] = useState<EquipmentState>({ ...DEFAULT_EQUIPMENT });
  const [formErrors, setFormErrors] = useState<ClassroomFormErrors>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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
    () => classrooms.filter((classroom) => classroom.type === 'CLASSROOM'),
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
      .filter((object) => object.type === 'CLASSROOM' && object.classroomId);

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
    mutationFn: (payload: CreateSlotClassroomRequest) => floorLayoutService.createSlotClassroom(floor.id, payload),
    onSuccess: (data) => {
      const createdObject = data.objects
        .filter((object) => object.type === 'CLASSROOM' && object.classroomId)
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
              type: 'CLASSROOM' as const,
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
      toast.success('Sınıf oluşturuldu ve slota yerleştirildi.');
    },
    onError: (error: AxiosError<{ message: string }>) => {
      const message = error.response?.data?.message ?? 'Sınıf oluşturulamadı.';
      setFormErrors((prev) => ({
        ...prev,
        [message.toLowerCase().includes('kod') ? 'code' : 'general']: message,
      }));
      toast.error(message);
    },
  });

  const filteredClassrooms = useMemo(() => {
    const query = classroomSearch.trim().toLowerCase();
    if (!query) return eligibleClassrooms;

    return eligibleClassrooms.filter((classroom) =>
      classroom.code.toLowerCase().includes(query) ||
      classroom.name.toLowerCase().includes(query)
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

  const resetClassroomForm = () => {
    setNewClassroom({ code: '', name: '', capacity: 30 });
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
    const nextErrors: ClassroomFormErrors = {};

    if (!code) {
      nextErrors.code = 'Sınıf kodu zorunludur.';
    }
    if (!name) {
      nextErrors.name = 'Sınıf adı zorunludur.';
    }
    if (!Number.isInteger(Number(newClassroom.capacity)) || Number(newClassroom.capacity) <= 0) {
      nextErrors.capacity = 'Kapasite 1 veya daha büyük olmalıdır.';
    }
    if (eligibleClassrooms.some((classroom) => classroom.code.toLowerCase() === code.toLowerCase())) {
      nextErrors.code = 'Bu sınıf kodu zaten kullanılıyor.';
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
      capacity: Number(newClassroom.capacity),
      equipment: buildEquipmentPayload(equipment),
    });
  };

  const placeClassroom = (classroomId: string) => {
    const classroom = classroomById.get(classroomId);
    if (!classroom) {
      toast.error('Slot Layout yalnızca sınıflar için kullanılabilir.');
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
        const slot = getAutoSlotPosition(nextSlotIndex);
        return compactPlacements(prev.map((object) => object.classroomId === classroomId
          ? {
              ...object,
              type: 'CLASSROOM',
              label: classroom.name,
              code: classroom.code,
              capacity: classroom.capacity,
              slotRow: slot.row,
              slotColumn: slot.column,
            }
          : object));
      }

      return compactPlacements([...prev, buildClassroomObject(classroom, nextSlotIndex)]);
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
    setIsDirty(true);
  };

  const handleDropOnCanvas = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    const classroomId = event.dataTransfer.getData('application/dts-classroom-id');
    if (classroomId) placeClassroom(classroomId);
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
            Sınıf Ekle
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
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sınıflar</p>
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={classroomSearch}
                onChange={(event) => setClassroomSearch(event.target.value)}
                placeholder="Sınıf ara..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs font-medium text-slate-800 outline-none focus:border-[#006482] focus:ring-2 focus:ring-[#006482]/20"
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                <p className="text-[9px] font-semibold text-slate-400">Yerleşmiş</p>
                <p className="text-sm font-bold text-slate-900">{placedObjects.length}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                <p className="text-[9px] font-semibold text-slate-400">Yerleşmemiş</p>
                <p className="text-sm font-bold text-slate-900">{Math.max(eligibleClassrooms.length - placedObjects.length, 0)}</p>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {eligibleClassrooms.length === 0 ? (
              <EmptyPanel
                title="Bu katta henüz sınıf bulunmuyor."
                description="Sınıfları önce tanımlayın."
              />
            ) : (
              <div className="space-y-4">
                <ClassroomSection
                  title="Yerleştirilmiş"
                  classrooms={placedClassrooms}
                  objectByClassroomId={objectByClassroomId}
                  selectedClassroomId={selectedClassroomId}
                  onSelect={setSelectedClassroomId}
                />
                <ClassroomSection
                  title="Yerleştirilmemiş"
                  classrooms={unassignedClassrooms}
                  objectByClassroomId={objectByClassroomId}
                  selectedClassroomId={selectedClassroomId}
                  onSelect={setSelectedClassroomId}
                />
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 p-3">
            {selectedClassroom ? (
              <div className="rounded-lg border border-[#88d0f2]/60 bg-[#eff8ff] p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#006482]">Seçili Sınıf</p>
                <p className="mt-2 truncate text-sm font-bold text-slate-900">{selectedClassroom.code}</p>
                <p className="truncate text-xs text-slate-500">{selectedClassroom.name}</p>
                <p className="mt-1 text-xs font-semibold text-slate-600">{selectedClassroom.capacity} kişi</p>
                {selectedObject && hasSlot(selectedObject) ? (
                  <SecondaryButton
                    type="button"
                    onClick={() => removeClassroomFromSlot(selectedClassroom.id)}
                    icon={<Trash2 className="h-3.5 w-3.5" />}
                    className="mt-3 w-full justify-center text-xs"
                  >
                    Slottan Çıkar
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
                <p className="text-xs font-semibold text-slate-500">Sınıf seçimi yok</p>
              </div>
            )}
          </div>
        </aside>

        <main
          className="min-w-0 flex-1 overflow-auto p-4"
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
          }}
          onDrop={handleDropOnCanvas}
          onClick={() => {
            if (selectedClassroomId && !hasSlot(objectByClassroomId.get(selectedClassroomId) ?? {} as SpaceObjectRequest)) {
              placeClassroom(selectedClassroomId);
            }
          }}
        >
          {eligibleClassrooms.length === 0 ? (
            <div className="flex min-h-full items-center justify-center">
              <EmptyPanel
                title="Bu katta henüz sınıf bulunmuyor."
                description="Sınıfları önce tanımlayın."
              />
            </div>
          ) : placedObjects.length === 0 ? (
            <div className="flex min-h-full items-center justify-center">
              <EmptyPanel
                title="Henüz sınıf yerleşimi yapılmadı."
                description="Bir sınıf seçerek ya da sürükleyerek ilk slotu oluşturabilirsiniz."
              />
            </div>
          ) : (
            <div className="grid max-w-4xl grid-cols-[repeat(auto-fit,minmax(180px,220px))] gap-3">
              {placedObjects.map((object, index) => {
                const classroom = object.classroomId ? classroomById.get(object.classroomId) : null;
                if (!classroom) return null;

                const slot = getAutoSlotPosition(index);
                const label = getSlotLabel(slot.row, slot.column);
                const isSelected = object.classroomId === selectedClassroomId;

                return (
                  <button
                    key={object.id}
                    type="button"
                    draggable
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedClassroomId(classroom.id);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Delete' || event.key === 'Backspace') {
                        event.preventDefault();
                        removeClassroomFromSlot(classroom.id);
                      }
                    }}
                    onDragStart={(event) => {
                      event.dataTransfer.setData('application/dts-classroom-id', classroom.id);
                      event.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = 'none';
                    }}
                    onDrop={(event) => {
                      event.stopPropagation();
                      event.preventDefault();
                      toast.error(`Bu slot zaten ${classroom.code} sınıfı tarafından kullanılıyor.`);
                    }}
                    aria-label={`Slot ${label} - ${classroom.code} sınıfı - ${classroom.capacity} kişi`}
                    className={cn(
                      'group relative flex h-36 flex-col rounded-lg border bg-white p-4 text-left shadow-sm outline-none transition-all focus:ring-2 focus:ring-[#006482]/25',
                      isSelected ? 'border-[#006482] ring-2 ring-[#006482]/15' : 'border-slate-200 hover:border-[#88d0f2] hover:shadow-md',
                    )}
                  >
                    <span className="absolute right-3 top-3 text-[10px] font-bold text-slate-300">{label}</span>
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eff8ff] text-[#006482]">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <p className="mt-3 max-w-full truncate text-xl font-extrabold text-slate-900">{classroom.code}</p>
                      <p className="mt-1 max-w-full truncate text-xs font-semibold text-slate-500">Sınıf</p>
                      <p className="mt-1 text-xs font-bold text-slate-600">{classroom.capacity} kişi</p>
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1 text-[10px] font-semibold text-slate-500">
                        <span className={cn('h-2 w-2 shrink-0 rounded-full', STATUS_DOT_CLASS[object.status])} />
                        <span className="truncate">Yerleşmiş</span>
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                        <Move className="h-3 w-3" />
                        Taşı
                      </span>
                    </div>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(event) => {
                        event.stopPropagation();
                        removeClassroomFromSlot(classroom.id);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          event.stopPropagation();
                          removeClassroomFromSlot(classroom.id);
                        }
                      }}
                      aria-label={`${label} slotundan ${classroom.code} sınıfını çıkar`}
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
          {placedObjects.length} slot · {Math.max(eligibleClassrooms.length - placedObjects.length, 0)} yerleştirilmemiş sınıf
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
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Sinif Ekle</p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">Yeni sinif bilgilerini girin</h2>
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

                <div className="space-y-1">
                  <label className="dts-input-label">Sinif Kodu *</label>
                  <input
                    value={newClassroom.code}
                    onChange={(event) => {
                      setNewClassroom((prev) => ({ ...prev, code: event.target.value }));
                      setFormErrors((prev) => ({ ...prev, code: undefined, general: undefined }));
                    }}
                    placeholder="Orn. D101"
                    className={cn('dts-input', formErrors.code && 'border-red-300 focus:border-red-400 focus:ring-red-100')}
                    autoComplete="off"
                  />
                  {formErrors.code && <p className="text-xs font-semibold text-red-500">{formErrors.code}</p>}
                </div>

                <div className="space-y-1">
                  <label className="dts-input-label">Sinif Adi *</label>
                  <input
                    value={newClassroom.name}
                    onChange={(event) => {
                      setNewClassroom((prev) => ({ ...prev, name: event.target.value }));
                      setFormErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    placeholder="Orn. Derslik 101"
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
                  <span className="dts-input-label">Donanimlar</span>
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
                      <label className="dts-input-label">Bilgisayar Sayisi *</label>
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
                  Vazgec
                </SecondaryButton>
                <PrimaryButton type="submit" loading={createClassroomMutation.isPending}>
                  Sinifi Olustur
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

interface EmptyPanelProps {
  title: string;
  description: string;
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

const EmptyPanel = ({ title, description }: EmptyPanelProps) => (
  <div className="w-full max-w-sm rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center shadow-sm">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-[#88d0f2]/40 bg-[#eff8ff] text-[#006482]">
      <BookOpen className="h-6 w-6" />
    </div>
    <p className="mt-3 text-sm font-bold text-slate-900">{title}</p>
    <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
  </div>
);

interface ClassroomSectionProps {
  title: string;
  classrooms: ClassroomPlacement[];
  objectByClassroomId: Map<string, SpaceObjectRequest>;
  selectedClassroomId: string | null;
  onSelect: (classroomId: string) => void;
}

const ClassroomSection = ({
  title,
  classrooms,
  objectByClassroomId,
  selectedClassroomId,
  onSelect,
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
}

const ClassroomListButton = ({ classroom, object, selected, onSelect }: ClassroomListButtonProps) => {
  const slotLabel = object && hasSlot(object)
    ? getSlotLabel(object.slotRow!, object.slotColumn!)
    : 'Yerleştirilmemiş';

  return (
    <button
      type="button"
      draggable
      onClick={onSelect}
      onDragStart={(event) => {
        event.dataTransfer.setData('application/dts-classroom-id', classroom.id);
        event.dataTransfer.effectAllowed = 'move';
      }}
      aria-label={`${classroom.code} - Sınıf - ${classroom.capacity} kişi - ${slotLabel}`}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg border p-2 text-left outline-none transition-all focus:ring-2 focus:ring-[#006482]/20',
        selected
          ? 'border-[#006482] bg-[#eff8ff] shadow-sm'
          : 'border-slate-200 bg-white hover:border-[#88d0f2] hover:bg-slate-50',
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <BookOpen className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-bold text-slate-900">{classroom.code}</p>
          {selected && <span className="text-[10px] font-bold text-[#006482]">Seçili</span>}
        </div>
        <p className="truncate text-[11px] font-medium text-slate-500">{classroom.name}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[10px] font-bold text-slate-600">{classroom.capacity} kişi</p>
        <p className={cn(
          'text-[10px] font-bold',
          slotLabel === 'Yerleştirilmemiş' ? 'text-slate-300' : 'text-[#006482]',
        )}
        >
          {slotLabel}
        </p>
      </div>
    </button>
  );
};
