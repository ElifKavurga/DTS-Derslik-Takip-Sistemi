import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { AppSelect } from '@/components/ui/AppSelect';
import { ClassroomPlacement, PALETTE_ITEM_MAP, SpaceObjectType } from '@/types';
import { SPACE_ICONS } from './spaceNodeConfig';

interface PendingDrop {
  type: SpaceObjectType;
  position: { x: number; y: number };
  width: number;
  height: number;
}

interface AddNodeValues {
  classroomId?: string;
  label: string;
  code?: string;
  capacity?: number;
}

interface AddNodeModalProps {
  pending: PendingDrop;
  classrooms?: ClassroomPlacement[];
  placedClassroomIds?: string[];
  onConfirm: (values: AddNodeValues) => void;
  onCancel: () => void;
}

const CLASSROOM_TYPES = new Set<SpaceObjectType>(['CLASSROOM', 'LABORATORY', 'AMPHITHEATER']);

const schema = z.object({
  label:    z.string().min(1, 'Ad zorunludur.'),
  code:     z.string().optional(),
  capacity: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number().positive().optional()
  ),
});

export function AddNodeModal({
  pending,
  classrooms = [],
  placedClassroomIds = [],
  onConfirm,
  onCancel,
}: AddNodeModalProps) {
  const paletteItem = PALETTE_ITEM_MAP[pending.type];
  const Icon = SPACE_ICONS[pending.type];
  const hasCapacity = ['CLASSROOM', 'LABORATORY', 'AMPHITHEATER', 'MOSQUE'].includes(pending.type);
  const hasCode     = ['CLASSROOM', 'LABORATORY', 'AMPHITHEATER', 'ACADEMICIAN_OFFICE'].includes(pending.type);
  const isClassroomType = CLASSROOM_TYPES.has(pending.type);

  const availableClassrooms = useMemo(() => {
    const placed = new Set(placedClassroomIds);
    return classrooms.filter((item) => item.type === pending.type && !placed.has(item.id));
  }, [classrooms, pending.type, placedClassroomIds]);

  const classroomOptions = useMemo(() => availableClassrooms.map((item) => ({
    value: item.id,
    label: `${item.code} - ${item.name}${item.capacity ? ` (${item.capacity})` : ''}`,
  })), [availableClassrooms]);

  const [mode, setMode] = useState<'existing' | 'new'>(
    isClassroomType && availableClassrooms.length > 0 ? 'existing' : 'new'
  );
  const [selectedClassroomId, setSelectedClassroomId] = useState('');

  const { register, handleSubmit, setFocus, formState: { errors } } = useForm<AddNodeValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!isClassroomType) {
      setTimeout(() => setFocus('label'), 80);
      return;
    }
    if (availableClassrooms.length === 0) {
      setMode('new');
      setSelectedClassroomId('');
      return;
    }
    setMode('existing');
    setSelectedClassroomId((current) => current || availableClassrooms[0].id);
  }, [availableClassrooms, isClassroomType, setFocus]);

  useEffect(() => {
    if (mode === 'new') setTimeout(() => setFocus('label'), 80);
  }, [mode, setFocus]);

  const handleExistingSubmit = () => {
    const classroom = availableClassrooms.find((item) => item.id === selectedClassroomId);
    if (!classroom) return;
    onConfirm({
      classroomId: classroom.id,
      label: classroom.name,
      code: classroom.code,
      capacity: classroom.capacity,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-sm p-6 animate-[auth-card-enter_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[#eff8ff] flex items-center justify-center">
              {Icon && <Icon className="h-5 w-5 text-[#006482]" strokeWidth={1.8} />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{paletteItem?.label ?? pending.type} Ekle</h3>
              <p className="text-[10px] text-slate-400">Temel bilgileri girin</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        {isClassroomType && (
          <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setMode('existing')}
              disabled={availableClassrooms.length === 0}
              className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                mode === 'existing' ? 'bg-white text-[#006482] shadow-sm' : 'text-slate-500 hover:text-slate-700'
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              Mevcut
            </button>
            <button
              type="button"
              onClick={() => setMode('new')}
              className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                mode === 'new' ? 'bg-white text-[#006482] shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Yeni
            </button>
          </div>
        )}

        {isClassroomType && mode === 'existing' ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="dts-input-label">Derslik kaydı</label>
              <AppSelect
                options={classroomOptions}
                value={selectedClassroomId}
                onChange={setSelectedClassroomId}
                searchable
                placeholder="Derslik seçin"
                emptyText="Uygun kayıt bulunamadı"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <SecondaryButton type="button" onClick={onCancel}>İptal</SecondaryButton>
              <PrimaryButton type="button" onClick={handleExistingSubmit} disabled={!selectedClassroomId}>
                Ekle
              </PrimaryButton>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onConfirm)} className="space-y-4">
            <div className="space-y-1">
              <label className="dts-input-label">Ad *</label>
              <input {...register('label')} placeholder="Örn. D101 Dersliği" className="dts-input" autoComplete="off" />
              {errors.label && <p className="text-[11px] text-red-500">{errors.label.message}</p>}
            </div>

            {hasCode && (
              <div className="space-y-1">
                <label className="dts-input-label">Kod</label>
                <input {...register('code')} placeholder="Örn. D101" className="dts-input" autoComplete="off" />
              </div>
            )}

            {hasCapacity && (
              <div className="space-y-1">
                <label className="dts-input-label">Kapasite</label>
                <input type="number" min={1} placeholder="Örn. 40" className="dts-input" {...register('capacity')} />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <SecondaryButton type="button" onClick={onCancel}>İptal</SecondaryButton>
              <PrimaryButton type="submit">Ekle</PrimaryButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
