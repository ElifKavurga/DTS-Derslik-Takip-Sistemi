import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  ChevronLeft,
  Grid3X3,
  Move,
  Plus,
  Save,
  Settings2,
  Trash2,
} from 'lucide-react';

import { SPACE_ICONS, STATUS_DOT_CLASS, STATUS_LABELS } from '@/components/editor/spaceNodeConfig';
import { getSlotLabel } from '@/components/editor/slotUtils';
import { AppSelect } from '@/components/ui/AppSelect';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { floorLayoutService } from '@/services/floorLayoutService';
import { useHeaderStore } from '@/store/useHeaderStore';
import {
  PALETTE_ITEM_MAP,
  type ClassroomPlacement,
  type FloorDetailResponse,
  type SlotLayoutResponse,
  type SpaceObjectRequest,
  type SpaceObjectResponse,
  type SpaceObjectStatus,
  type SpaceObjectType,
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
const QUICK_AREA_TYPES: SpaceObjectType[] = [
  'MALE_WC',
  'FEMALE_WC',
  'DISABLED_WC',
  'SINK',
  'STAIRS',
  'MOSQUE',
  'OTHER',
];

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

function buildQuickObject(type: SpaceObjectType, slot: SlotPosition): SpaceObjectRequest {
  const paletteItem = PALETTE_ITEM_MAP[type];

  return {
    id: crypto.randomUUID(),
    type,
    status: 'EMPTY',
    label: paletteItem.label,
    positionX: 0,
    positionY: 0,
    width: paletteItem.defaultWidth ?? DEFAULT_SLOT_WIDTH,
    height: paletteItem.defaultHeight ?? DEFAULT_SLOT_HEIGHT,
    rotation: 0,
    slotRow: slot.row,
    slotColumn: slot.column,
  };
}

function buildClassroomObject(classroom: ClassroomPlacement, slot: SlotPosition): SpaceObjectRequest {
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
    width: PALETTE_ITEM_MAP[classroom.type].defaultWidth ?? DEFAULT_SLOT_WIDTH,
    height: PALETTE_ITEM_MAP[classroom.type].defaultHeight ?? DEFAULT_SLOT_HEIGHT,
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
  const [isDirty, setIsDirty] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<'classroom' | 'quick'>('classroom');
  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [selectedQuickType, setSelectedQuickType] = useState<SpaceObjectType>('MOSQUE');

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

    setRows(slotLayout.rows);
    setColumns(slotLayout.columns);
    setDraftRows(slotLayout.rows);
    setDraftColumns(slotLayout.columns);
    setObjects(slotLayout.objects.map(toRequest));
    setSelectedSlot(null);
    setIsDirty(false);
  }, [slotLayout]);

  const createMutation = useMutation({
    mutationFn: () => floorLayoutService.saveSlotLayout(floor.id, {
      rows: DEFAULT_ROWS,
      columns: DEFAULT_COLUMNS,
      objects: floor.objects.map(toRequest),
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
      objects,
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

  const placedObjects = useMemo(
    () => objects.filter((object) => object.slotRow !== undefined && object.slotColumn !== undefined),
    [objects],
  );

  const objectBySlot = useMemo(() => {
    const map = new Map<string, SpaceObjectRequest>();
    placedObjects.forEach((object) => {
      map.set(`${object.slotRow}:${object.slotColumn}`, object);
    });
    return map;
  }, [placedObjects]);

  const selectedObject = selectedSlot
    ? objectBySlot.get(`${selectedSlot.row}:${selectedSlot.column}`) ?? null
    : null;

  const assignedClassroomIds = useMemo(
    () => new Set(objects
      .map((object) => object.classroomId)
      .filter((id): id is string => Boolean(id))),
    [objects],
  );

  const classroomOptions = useMemo(() => classrooms
    .filter((classroom) => !assignedClassroomIds.has(classroom.id))
    .map((classroom) => ({
      value: classroom.id,
      label: `${classroom.code} - ${classroom.name} (${classroom.capacity} kişi)`,
    })), [assignedClassroomIds, classrooms]);

  const quickTypeOptions = useMemo(() => QUICK_AREA_TYPES.map((type) => ({
    value: type,
    label: PALETTE_ITEM_MAP[type].label,
  })), []);

  const firstEmptySlot = useMemo(() => {
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        if (!objectBySlot.has(`${row}:${column}`)) return { row, column };
      }
    }
    return null;
  }, [columns, objectBySlot, rows]);

  const openAddModal = (slot?: SlotPosition) => {
    const targetSlot = slot ?? selectedSlot ?? firstEmptySlot;

    if (!targetSlot) {
      toast.error('Boş slot bulunamadı.');
      return;
    }

    if (objectBySlot.has(`${targetSlot.row}:${targetSlot.column}`)) {
      toast.error('Bu slot zaten dolu.');
      return;
    }

    setSelectedSlot(targetSlot);
    setSelectedClassroomId('');
    setSelectedQuickType('MOSQUE');
    setAddMode(classroomOptions.length > 0 ? 'classroom' : 'quick');
    setIsAddModalOpen(true);
  };

  const addObjectToSelectedSlot = () => {
    if (!selectedSlot) return;

    if (objectBySlot.has(`${selectedSlot.row}:${selectedSlot.column}`)) {
      toast.error('Bu slot zaten dolu.');
      return;
    }

    if (addMode === 'classroom') {
      const classroom = classrooms.find((item) => item.id === selectedClassroomId);
      if (!classroom) {
        toast.error('Bir derslik seçin.');
        return;
      }
      setObjects((prev) => [...prev, buildClassroomObject(classroom, selectedSlot)]);
    } else {
      setObjects((prev) => [...prev, buildQuickObject(selectedQuickType, selectedSlot)]);
    }

    setIsDirty(true);
    setIsAddModalOpen(false);
  };

  const removeFromSlot = (objectId: string) => {
    setObjects((prev) => prev.map((object) => object.id === objectId
      ? { ...object, slotRow: undefined, slotColumn: undefined }
      : object));
    setIsDirty(true);
  };

  const moveObject = (objectId: string, targetSlot: SlotPosition) => {
    if (objectBySlot.has(`${targetSlot.row}:${targetSlot.column}`)) {
      toast.error('Bu slot zaten dolu.');
      return;
    }

    setObjects((prev) => prev.map((object) => object.id === objectId
      ? { ...object, slotRow: targetSlot.row, slotColumn: targetSlot.column }
      : object));
    setSelectedSlot(targetSlot);
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
      const confirmed = window.confirm(`${outOfBounds.length} alan yeni grid sınırlarının dışında kalacak ve slottan çıkarılacak. Devam edilsin mi?`);
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

  const handleDrop = (event: React.DragEvent<HTMLButtonElement>, slot: SlotPosition) => {
    event.preventDefault();
    const objectId = event.dataTransfer.getData('application/dts-slot-object-id');
    if (!objectId) return;
    moveObject(objectId, slot);
  };

  const handleSlotKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    object: SpaceObjectRequest | undefined,
  ) => {
    if (!object) return;
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      removeFromSlot(object.id);
    }
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
              Bu kat için henüz slot tabanlı yerleşim oluşturulmamış.
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
        <div className="flex min-w-40 flex-col">
          <span className="text-sm font-bold leading-tight text-slate-900">{floor.name}</span>
          <span className="text-[9px] leading-none text-slate-400">{floor.buildingName} · {floor.facultyName}</span>
        </div>

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
            Alan Ekle
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
        <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white p-3 lg:block">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Özet</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-white p-2 shadow-sm">
                <p className="text-[9px] font-semibold text-slate-400">Grid</p>
                <p className="text-sm font-bold text-slate-900">{rows} x {columns}</p>
              </div>
              <div className="rounded-lg bg-white p-2 shadow-sm">
                <p className="text-[9px] font-semibold text-slate-400">Dolu</p>
                <p className="text-sm font-bold text-slate-900">{placedObjects.length}</p>
              </div>
            </div>
          </div>

          {selectedObject && (
            <div className="mt-3 rounded-lg border border-[#88d0f2]/60 bg-[#eff8ff] p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#006482]">Seçili Alan</p>
              <p className="mt-2 truncate text-sm font-bold text-slate-900">{selectedObject.code ?? selectedObject.label}</p>
              <p className="truncate text-xs text-slate-500">{selectedObject.label}</p>
              <SecondaryButton
                type="button"
                onClick={() => removeFromSlot(selectedObject.id)}
                icon={<Trash2 className="h-3.5 w-3.5" />}
                className="mt-3 w-full justify-center text-xs"
              >
                Slottan Çıkar
              </SecondaryButton>
            </div>
          )}
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
                const label = getSlotLabel(row, column);
                const isSelected = selectedSlot?.row === row && selectedSlot.column === column;
                const Icon = object ? SPACE_ICONS[object.type] : Plus;
                const status = (object?.status ?? 'EMPTY') as SpaceObjectStatus;

                return (
                  <button
                    key={slotKey}
                    type="button"
                    draggable={Boolean(object)}
                    onClick={() => setSelectedSlot(slot)}
                    onDoubleClick={() => !object && openAddModal(slot)}
                    onKeyDown={(event) => handleSlotKeyDown(event, object)}
                    onDragStart={(event) => {
                      if (!object) return;
                      event.dataTransfer.setData('application/dts-slot-object-id', object.id);
                      event.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = object ? 'none' : 'move';
                    }}
                    onDrop={(event) => object ? toast.error('Bu slot zaten dolu.') : handleDrop(event, slot)}
                    aria-label={object
                      ? `Slot ${label} - ${object.code ?? object.label} - ${PALETTE_ITEM_MAP[object.type].label}`
                      : `Slot ${label} boş`}
                    className={cn(
                      'group relative flex h-32 flex-col rounded-lg border bg-white p-3 text-left shadow-sm outline-none transition-all focus:ring-2 focus:ring-[#006482]/25',
                      isSelected ? 'border-[#006482] ring-2 ring-[#006482]/15' : 'border-slate-200 hover:border-[#88d0f2] hover:shadow-md',
                      !object && 'border-dashed bg-slate-50/70',
                    )}
                  >
                    <span className="absolute right-2 top-2 text-[10px] font-bold text-slate-300">{label}</span>

                    {object ? (
                      <>
                        <div className="flex items-start gap-2 pr-7">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eff8ff] text-[#006482]">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-900">{object.code ?? object.label}</p>
                            <p className="truncate text-[11px] font-medium text-slate-500">{object.label}</p>
                          </div>
                        </div>
                        <div className="mt-auto flex items-center justify-between gap-2">
                          <span className="truncate text-[10px] font-semibold text-slate-500">
                            {PALETTE_ITEM_MAP[object.type].label}
                          </span>
                          {object.capacity !== undefined && (
                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                              {object.capacity}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="flex min-w-0 items-center gap-1 text-[10px] font-semibold text-slate-500">
                            <span className={cn('h-2 w-2 shrink-0 rounded-full', STATUS_DOT_CLASS[status])} />
                            <span className="truncate">{STATUS_LABELS[status]}</span>
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
                            removeFromSlot(object.id);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              event.stopPropagation();
                              removeFromSlot(object.id);
                            }
                          }}
                          aria-label={`${label} slotundan alanı çıkar`}
                          className="absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 opacity-0 shadow-sm transition hover:border-red-200 hover:text-red-500 group-hover:opacity-100 group-focus:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </span>
                      </>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-slate-400">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white transition-colors group-hover:border-[#88d0f2] group-hover:text-[#006482]">
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-[11px] font-bold opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100">
                          Alan ekle
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
        <span className="text-[9px] text-slate-400">{placedObjects.length} yerleşmiş alan · {rows * columns} slot</span>
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
                <h2 className="mt-1 text-lg font-bold text-slate-900">Alan Ekle</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-md px-2 py-1 text-sm font-bold text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                Kapat
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setAddMode('classroom')}
                disabled={classroomOptions.length === 0}
                className={cn(
                  'rounded-md px-3 py-2 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                  addMode === 'classroom' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800',
                )}
              >
                Mevcut Derslik
              </button>
              <button
                type="button"
                onClick={() => setAddMode('quick')}
                className={cn(
                  'rounded-md px-3 py-2 text-xs font-bold transition-colors',
                  addMode === 'quick' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800',
                )}
              >
                Diğer Alan
              </button>
            </div>

            <div className="mt-4">
              {addMode === 'classroom' ? (
                <AppSelect
                  searchable
                  value={selectedClassroomId}
                  onChange={setSelectedClassroomId}
                  options={classroomOptions}
                  placeholder="Derslik seçin"
                  emptyText="Yerleştirilecek derslik bulunamadı"
                />
              ) : (
                <AppSelect
                  value={selectedQuickType}
                  onChange={(value) => setSelectedQuickType(value as SpaceObjectType)}
                  options={quickTypeOptions}
                  placeholder="Alan tipi seçin"
                />
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <SecondaryButton type="button" onClick={() => setIsAddModalOpen(false)}>
                Vazgeç
              </SecondaryButton>
              <PrimaryButton type="button" onClick={addObjectToSelectedSlot} icon={<Plus className="h-4 w-4" />}>
                Ekle
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
