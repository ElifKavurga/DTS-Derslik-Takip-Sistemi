import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  BookOpen,
  ChevronLeft,
  Grid3X3,
  Move,
  Plus,
  Save,
  Search,
  Settings2,
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
  type FloorDetailResponse,
  type SlotLayoutResponse,
  type SpaceObjectRequest,
  type SpaceObjectResponse,
} from '@/types';
import { cn } from '@/utils/cn';

interface SlotLayoutEditorProps {
  floor: FloorDetailResponse;
}

type SlotPosition = {
  row: number;
  column: number;
};

const DEFAULT_ROWS = 3;
const DEFAULT_COLUMNS = 4;
const DEFAULT_SLOT_WIDTH = 160;
const DEFAULT_SLOT_HEIGHT = 100;

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

function buildClassroomObject(classroom: ClassroomPlacement, slot: SlotPosition): SpaceObjectRequest {
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

export const SlotLayoutEditor = ({ floor }: SlotLayoutEditorProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setMeta = useHeaderStore((state) => state.setMeta);

  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [draftRows, setDraftRows] = useState(DEFAULT_ROWS);
  const [draftColumns, setDraftColumns] = useState(DEFAULT_COLUMNS);
  const [objects, setObjects] = useState<SpaceObjectRequest[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SlotPosition | null>(null);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);
  const [classroomSearch, setClassroomSearch] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState('');

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

    setRows(slotLayout.rows);
    setColumns(slotLayout.columns);
    setDraftRows(slotLayout.rows);
    setDraftColumns(slotLayout.columns);
    setObjects(classroomObjects);
    setSelectedSlot(null);
    setSelectedClassroomId(null);
    setIsDirty(false);
  }, [slotLayout]);

  const placedObjects = useMemo(
    () => objects.filter((object) =>
      isClassroomObject(object) &&
      object.slotRow !== undefined &&
      object.slotColumn !== undefined &&
      classroomById.has(object.classroomId!)
    ),
    [classroomById, objects],
  );

  const saveObjects = useMemo(
    () => objects.filter((object) => isClassroomObject(object) && classroomById.has(object.classroomId!)),
    [classroomById, objects],
  );

  const objectBySlot = useMemo(() => {
    const map = new Map<string, SpaceObjectRequest>();
    placedObjects.forEach((object) => {
      map.set(`${object.slotRow}:${object.slotColumn}`, object);
    });
    return map;
  }, [placedObjects]);

  const objectByClassroomId = useMemo(() => {
    const map = new Map<string, SpaceObjectRequest>();
    saveObjects.forEach((object) => {
      if (object.classroomId) map.set(object.classroomId, object);
    });
    return map;
  }, [saveObjects]);

  const createMutation = useMutation({
    mutationFn: () => floorLayoutService.saveSlotLayout(floor.id, {
      rows: DEFAULT_ROWS,
      columns: DEFAULT_COLUMNS,
      objects: floor.objects.map(toRequest).filter(isClassroomObject),
    }),
    onSuccess: (data) => {
      queryClient.setQueryData(['slotLayout', floor.id], data);
      queryClient.invalidateQueries({ queryKey: ['floorDetail', floor.id] });
      toast.success('Slot düzeni oluşturuldu.');
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message ?? 'Slot düzeni oluşturulamadı.');
    },
  });

  const saveMutation = useMutation({
    mutationFn: () => floorLayoutService.saveSlotLayout(floor.id, {
      rows,
      columns,
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

  const filteredClassrooms = useMemo(() => {
    const query = classroomSearch.trim().toLowerCase();
    if (!query) return eligibleClassrooms;

    return eligibleClassrooms.filter((classroom) =>
      classroom.code.toLowerCase().includes(query) ||
      classroom.name.toLowerCase().includes(query)
    );
  }, [classroomSearch, eligibleClassrooms]);

  const placedClassrooms = useMemo(
    () => filteredClassrooms.filter((classroom) => {
      const object = objectByClassroomId.get(classroom.id);
      return object?.slotRow !== undefined && object.slotColumn !== undefined;
    }),
    [filteredClassrooms, objectByClassroomId],
  );

  const unassignedClassrooms = useMemo(
    () => filteredClassrooms.filter((classroom) => {
      const object = objectByClassroomId.get(classroom.id);
      return !object || object.slotRow === undefined || object.slotColumn === undefined;
    }),
    [filteredClassrooms, objectByClassroomId],
  );

  const selectedClassroom = selectedClassroomId ? classroomById.get(selectedClassroomId) ?? null : null;
  const selectedObject = selectedClassroomId ? objectByClassroomId.get(selectedClassroomId) ?? null : null;

  const modalClassrooms = useMemo(() => {
    const query = modalSearch.trim().toLowerCase();
    if (!query) return eligibleClassrooms;

    return eligibleClassrooms.filter((classroom) =>
      classroom.code.toLowerCase().includes(query) ||
      classroom.name.toLowerCase().includes(query)
    );
  }, [eligibleClassrooms, modalSearch]);

  const openAddModal = (slot?: SlotPosition) => {
    const targetSlot = slot ?? selectedSlot;

    if (!targetSlot) {
      toast.error('Önce boş bir slot seçin.');
      return;
    }

    const occupied = objectBySlot.get(`${targetSlot.row}:${targetSlot.column}`);
    if (occupied) {
      toast.error(`Bu slot zaten ${occupied.code ?? occupied.label} sınıfı tarafından kullanılıyor.`);
      return;
    }

    setSelectedSlot(targetSlot);
    setModalSearch('');
    setIsAddModalOpen(true);
  };

  const placeClassroom = (classroomId: string, targetSlot: SlotPosition) => {
    const classroom = classroomById.get(classroomId);
    if (!classroom) {
      toast.error('Slot Layout yalnızca sınıflar için kullanılabilir.');
      return;
    }

    const occupied = objectBySlot.get(`${targetSlot.row}:${targetSlot.column}`);
    if (occupied && occupied.classroomId !== classroomId) {
      toast.error(`Bu slot zaten ${occupied.code ?? occupied.label} sınıfı tarafından kullanılıyor.`);
      return;
    }

    setObjects((prev) => {
      const existing = prev.find((object) => object.classroomId === classroomId);
      if (existing) {
        return prev.map((object) => object.classroomId === classroomId
          ? {
              ...object,
              type: 'CLASSROOM',
              label: classroom.name,
              code: classroom.code,
              capacity: classroom.capacity,
              slotRow: targetSlot.row,
              slotColumn: targetSlot.column,
            }
          : object);
      }

      return [...prev, buildClassroomObject(classroom, targetSlot)];
    });

    setSelectedClassroomId(classroomId);
    setSelectedSlot(targetSlot);
    setIsDirty(true);
    setIsAddModalOpen(false);
  };

  const removeClassroomFromSlot = (classroomId: string) => {
    setObjects((prev) => prev.map((object) => object.classroomId === classroomId
      ? { ...object, slotRow: undefined, slotColumn: undefined }
      : object));
    setSelectedClassroomId(classroomId);
    setIsDirty(true);
  };

  const applyGridSize = () => {
    const nextRows = Number(draftRows);
    const nextColumns = Number(draftColumns);

    if (!Number.isInteger(nextRows) || !Number.isInteger(nextColumns) || nextRows < 1 || nextColumns < 1) {
      toast.error('Satır ve sütun değerleri 1 veya daha büyük olmalı.');
      return;
    }

    const outOfBounds = placedObjects.filter((object) =>
      object.slotRow !== undefined &&
      object.slotColumn !== undefined &&
      (object.slotRow >= nextRows || object.slotColumn >= nextColumns)
    );

    if (outOfBounds.length > 0) {
      const confirmed = window.confirm(`${outOfBounds.length} sınıf yeni grid sınırlarının dışında kalacak ve slottan çıkarılacak. Devam edilsin mi?`);
      if (!confirmed) return;

      const ids = new Set(outOfBounds.map((object) => object.id));
      setObjects((prev) => prev.map((object) => ids.has(object.id)
        ? { ...object, slotRow: undefined, slotColumn: undefined }
        : object));
    }

    setRows(nextRows);
    setColumns(nextColumns);
    if (selectedSlot && (selectedSlot.row >= nextRows || selectedSlot.column >= nextColumns)) {
      setSelectedSlot(null);
    }
    setIsDirty(true);
  };

  const handleSlotClick = (slot: SlotPosition, object?: SpaceObjectRequest) => {
    if (selectedClassroomId && !object) {
      placeClassroom(selectedClassroomId, slot);
      return;
    }

    if (selectedClassroomId && object && object.classroomId !== selectedClassroomId) {
      toast.error(`Bu slot zaten ${object.code ?? object.label} sınıfı tarafından kullanılıyor.`);
      setSelectedSlot(slot);
      return;
    }

    setSelectedSlot(slot);
    if (object?.classroomId) setSelectedClassroomId(object.classroomId);
  };

  const handleSlotDrop = (event: React.DragEvent<HTMLButtonElement>, slot: SlotPosition, object?: SpaceObjectRequest) => {
    event.preventDefault();
    const classroomId = event.dataTransfer.getData('application/dts-classroom-id');
    if (!classroomId) return;

    if (object && object.classroomId !== classroomId) {
      toast.error(`Bu slot zaten ${object.code ?? object.label} sınıfı tarafından kullanılıyor.`);
      return;
    }

    placeClassroom(classroomId, slot);
  };

  const slotLayoutMissing = slotLayoutError && isNotFoundError(slotLayoutError);

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

  if (slotLayoutMissing) {
    return (
      <div className="flex h-screen flex-col bg-slate-50">
        <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2 shadow-sm">
          <button
            type="button"
            onClick={() => navigate(`/super-admin/binalar/${floor.buildingId}`)}
            className="group flex items-center gap-1 text-[10px] font-semibold text-slate-400 transition-colors hover:text-slate-800"
          >
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Geri
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex flex-col">
            <span className="text-sm font-bold leading-tight text-slate-900">{floor.name}</span>
            <span className="text-[9px] leading-none text-slate-400">{floor.buildingName} · {floor.facultyName}</span>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-md rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-[#88d0f2]/40 bg-[#eff8ff] text-[#006482]">
              <Grid3X3 className="h-6 w-6" />
            </div>
            <h1 className="mt-4 text-lg font-bold text-slate-900">Slot düzeni bulunamadı</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Bu katta dijital kroki bulunmuyor. Sınıfları slot düzeninde yönetebilirsiniz.
            </p>
            <PrimaryButton
              type="button"
              onClick={() => createMutation.mutate()}
              loading={createMutation.isPending}
              icon={<Plus className="h-4 w-4" />}
              className="mx-auto mt-5"
            >
              Slot Düzeni Oluştur
            </PrimaryButton>
          </div>
        </div>
      </div>
    );
  }

  if (slotLayoutError && !slotLayout) {
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
          Slot Yerleşimi
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">
            <Settings2 className="h-4 w-4 text-slate-400" />
            <label className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
              Satır
              <input
                type="number"
                min={1}
                value={draftRows}
                onChange={(event) => setDraftRows(Number(event.target.value))}
                className="h-7 w-14 rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-900 outline-none focus:border-[#006482] focus:ring-2 focus:ring-[#006482]/20"
              />
            </label>
            <label className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
              Sütun
              <input
                type="number"
                min={1}
                value={draftColumns}
                onChange={(event) => setDraftColumns(Number(event.target.value))}
                className="h-7 w-14 rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-900 outline-none focus:border-[#006482] focus:ring-2 focus:ring-[#006482]/20"
              />
            </label>
            <SecondaryButton type="button" onClick={applyGridSize} className="h-7 px-2 text-[10px]">
              Uygula
            </SecondaryButton>
          </div>

          <SecondaryButton
            type="button"
            onClick={() => openAddModal()}
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
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
                <BookOpen className="mx-auto h-6 w-6 text-slate-400" />
                <p className="mt-2 text-sm font-bold text-slate-800">Bu katta henüz sınıf bulunmuyor.</p>
              </div>
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
                {selectedObject?.slotRow !== undefined && selectedObject.slotColumn !== undefined && (
                  <SecondaryButton
                    type="button"
                    onClick={() => removeClassroomFromSlot(selectedClassroom.id)}
                    icon={<Trash2 className="h-3.5 w-3.5" />}
                    className="mt-3 w-full justify-center text-xs"
                  >
                    Slottan Çıkar
                  </SecondaryButton>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-500">Sınıf seçimi yok</p>
              </div>
            )}
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-auto p-4">
          <div
            className="grid min-w-max gap-3"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(132px, 180px))`,
            }}
          >
            {Array.from({ length: rows }).map((_, row) =>
              Array.from({ length: columns }).map((__, column) => {
                const slot = { row, column };
                const slotKey = `${row}:${column}`;
                const object = objectBySlot.get(slotKey);
                const classroom = object?.classroomId ? classroomById.get(object.classroomId) : null;
                const label = getSlotLabel(row, column);
                const isSelectedSlot = selectedSlot?.row === row && selectedSlot.column === column;
                const isSelectedClassroomSlot = object?.classroomId === selectedClassroomId;

                return (
                  <button
                    key={slotKey}
                    type="button"
                    draggable={Boolean(object?.classroomId)}
                    onClick={() => handleSlotClick(slot, object)}
                    onDoubleClick={() => !object && openAddModal(slot)}
                    onKeyDown={(event) => {
                      if (!object?.classroomId) return;
                      if (event.key === 'Delete' || event.key === 'Backspace') {
                        event.preventDefault();
                        removeClassroomFromSlot(object.classroomId);
                      }
                    }}
                    onDragStart={(event) => {
                      if (!object?.classroomId) return;
                      event.dataTransfer.setData('application/dts-classroom-id', object.classroomId);
                      event.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = object ? 'none' : 'move';
                    }}
                    onDrop={(event) => handleSlotDrop(event, slot, object)}
                    aria-label={classroom
                      ? `Slot ${label} - ${classroom.code} sınıfı - ${classroom.capacity} kişi`
                      : `Slot ${label} boş`}
                    className={cn(
                      'group relative flex h-32 flex-col rounded-lg border bg-white p-3 text-left shadow-sm outline-none transition-all focus:ring-2 focus:ring-[#006482]/25',
                      isSelectedSlot || isSelectedClassroomSlot
                        ? 'border-[#006482] ring-2 ring-[#006482]/15'
                        : 'border-slate-200 hover:border-[#88d0f2] hover:shadow-md',
                      !object && 'border-dashed bg-slate-50/70',
                    )}
                  >
                    <span className="absolute right-2 top-2 text-[10px] font-bold text-slate-300">{label}</span>

                    {classroom && object ? (
                      <>
                        <div className="flex items-start gap-2 pr-7">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eff8ff] text-[#006482]">
                            <BookOpen className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-base font-extrabold text-slate-900">{classroom.code}</p>
                            <p className="truncate text-[11px] font-medium text-slate-500">{classroom.name}</p>
                          </div>
                        </div>
                        <div className="mt-auto flex items-center justify-between gap-2">
                          <span className="flex min-w-0 items-center gap-1 text-[10px] font-semibold text-slate-500">
                            <span className={cn('h-2 w-2 shrink-0 rounded-full', STATUS_DOT_CLASS[object.status])} />
                            <span className="truncate">Sınıf</span>
                          </span>
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                            {classroom.capacity} kişi
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-slate-400">Slot {label}</span>
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
                      </>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-slate-400">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white transition-colors group-hover:border-[#88d0f2] group-hover:text-[#006482]">
                          <Plus className="h-4 w-4" />
                        </div>
                        <span className="text-[11px] font-bold opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100">
                          Sınıf ekle
                        </span>
                      </div>
                    )}
                  </button>
                );
              }),
            )}
          </div>
        </main>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 bg-white px-4 py-1">
        <span className="text-[9px] text-slate-400">{placedObjects.length} yerleşmiş sınıf · {rows * columns} slot</span>
        <span className={cn('text-[9px] font-semibold', isDirty ? 'text-amber-600' : 'text-slate-300')}>
          {isDirty ? 'Kaydedilmemiş değişiklik var' : 'Güncel'}
        </span>
      </div>

      {isAddModalOpen && selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Slot {getSlotLabel(selectedSlot.row, selectedSlot.column)}
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">Sınıf Ekle</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-md px-2 py-1 text-sm font-bold text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                Kapat
              </button>
            </div>

            <div className="relative mt-4">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={modalSearch}
                onChange={(event) => setModalSearch(event.target.value)}
                placeholder="Sınıf ara..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs font-medium text-slate-800 outline-none focus:border-[#006482] focus:ring-2 focus:ring-[#006482]/20"
              />
            </div>

            <div className="mt-3 max-h-80 space-y-1 overflow-y-auto">
              {modalClassrooms.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm font-semibold text-slate-500">
                  Bu katta henüz sınıf bulunmuyor.
                </div>
              ) : (
                modalClassrooms.map((classroom) => (
                  <ClassroomListButton
                    key={classroom.id}
                    classroom={classroom}
                    object={objectByClassroomId.get(classroom.id)}
                    selected={classroom.id === selectedClassroomId}
                    onSelect={() => placeClassroom(classroom.id, selectedSlot)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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
  const slotLabel = object?.slotRow !== undefined && object.slotColumn !== undefined
    ? getSlotLabel(object.slotRow, object.slotColumn)
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
