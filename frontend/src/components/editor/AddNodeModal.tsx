import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { PALETTE_ITEM_MAP, SpaceObjectType } from '@/types';
import { SPACE_ICONS } from './spaceNodeConfig';

interface PendingDrop {
  type: SpaceObjectType;
  position: { x: number; y: number };
  width: number;
  height: number;
}

interface AddNodeValues {
  label: string;
  code?: string;
  capacity?: number;
}

interface AddNodeModalProps {
  pending: PendingDrop;
  onConfirm: (values: AddNodeValues) => void;
  onCancel: () => void;
}

const schema = z.object({
  label:    z.string().min(1, 'Ad zorunludur.'),
  code:     z.string().optional(),
  capacity: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number().positive().optional()
  ),
});

export function AddNodeModal({ pending, onConfirm, onCancel }: AddNodeModalProps) {
  const paletteItem = PALETTE_ITEM_MAP[pending.type];
  const Icon = SPACE_ICONS[pending.type];
  const hasCapacity = ['CLASSROOM', 'LABORATORY', 'AMPHITHEATER', 'MOSQUE'].includes(pending.type);
  const hasCode     = ['CLASSROOM', 'LABORATORY', 'AMPHITHEATER', 'ACADEMICIAN_OFFICE'].includes(pending.type);

  const { register, handleSubmit, setFocus, formState: { errors } } = useForm<AddNodeValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    setTimeout(() => setFocus('label'), 80);
  }, [setFocus]);

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
      </div>
    </div>
  );
}
