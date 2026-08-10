import { useRef } from 'react';
import { Upload, Trash2, Lock, Unlock, ImageIcon } from 'lucide-react';
import { BackgroundImageState } from '@/types';

interface BackgroundPanelProps {
  bgState: BackgroundImageState | null;
  onUpload:        (file: File) => void;
  onRemove:        () => void;
  onToggleLock:    () => void;
  onOpacityChange: (opacity: number) => void;
}

export function BackgroundPanel({ bgState, onUpload, onRemove, onToggleLock, onOpacityChange }: BackgroundPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    // Reset so same file can be re-selected
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg"
        onChange={handleFileChange}
        className="hidden"
      />

      {bgState ? (
        <>
          {/* Preview */}
          <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 h-24">
            <img
              src={`data:${bgState.type};base64,${bgState.base64}`}
              alt="Kat Planı Önizleme"
              className="w-full h-full object-contain"
              style={{ opacity: bgState.opacity }}
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition bg-black/20 rounded-xl">
              <span className="text-[9px] font-bold text-white bg-black/50 px-2 py-1 rounded-full">Ön İzleme</span>
            </div>
          </div>

          {/* Opacity */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="dts-input-label mb-0">Saydamlık</label>
              <span className="text-[10px] font-bold text-[#006482]">{Math.round(bgState.opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min={10} max={100}
              value={Math.round(bgState.opacity * 100)}
              onChange={(e) => onOpacityChange(Number(e.target.value) / 100)}
              className="w-full h-1.5 rounded-full accent-[#006482] cursor-pointer"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={onToggleLock}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-[10px] font-semibold transition ${
                bgState.isLocked
                  ? 'border-[#006482] bg-[#eff8ff] text-[#006482]'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {bgState.isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
              {bgState.isLocked ? 'Kilitli' : 'Kilitsiz'}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              <Upload className="h-3 w-3" />
              Değiştir
            </button>
          </div>
          <button
            onClick={onRemove}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-red-100 px-3 py-2 text-[10px] font-semibold text-red-500 hover:bg-red-50 transition"
          >
            <Trash2 className="h-3 w-3" />
            Arka Planı Kaldır
          </button>
        </>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 p-6 text-center hover:border-[#006482] hover:bg-[#eff8ff]/50 transition group"
        >
          <ImageIcon className="h-6 w-6 text-slate-300 group-hover:text-[#006482] transition" />
          <div>
            <p className="text-[10px] font-bold text-slate-500 group-hover:text-[#006482] transition">Kat Planı Yükle</p>
            <p className="text-[9px] text-slate-400">PNG veya JPG/JPEG - Maks. 5 MB</p>
          </div>
        </button>
      )}
    </div>
  );
}
