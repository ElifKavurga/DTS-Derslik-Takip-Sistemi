import { Eye, EyeOff, Trash2, Focus } from 'lucide-react';
import type { Node } from '@xyflow/react';
import { PALETTE_ITEM_MAP } from '@/types';
import { SPACE_ICONS } from './spaceNodeConfig';

interface LayerPanelProps {
  nodes: Node[];
  selectedNodeId: string | null;
  onSelect:    (id: string) => void;
  onFocus:     (id: string) => void;
  onToggleHide:(id: string) => void;
  onDelete:    (id: string) => void;
}

export function LayerPanel({ nodes, selectedNodeId, onSelect, onFocus, onToggleHide, onDelete }: LayerPanelProps) {
  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-2 p-4 text-center">
        <p className="text-[10px] text-slate-400 font-medium">Henüz nesne eklenmedi</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {[...nodes].reverse().map((node) => {
        const d    = node.data as Record<string, unknown>;
        const type = (d['type'] as string) ?? 'CLASSROOM';
        const label= (d['label'] as string) || (PALETTE_ITEM_MAP[type as keyof typeof PALETTE_ITEM_MAP]?.label ?? type);
        const isHidden = (d['isHidden'] as boolean) ?? false;
        const Icon = SPACE_ICONS[type as keyof typeof SPACE_ICONS];
        const isSelected = node.id === selectedNodeId;

        return (
          <div
            key={node.id}
            onClick={() => onSelect(node.id)}
            className={`group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors border-b border-slate-50 ${
              isSelected ? 'bg-[#eff8ff] border-l-2 border-l-[#006482]' : 'hover:bg-slate-50'
            }`}
          >
            {/* Icon */}
            <div className={`flex-shrink-0 h-6 w-6 rounded-lg flex items-center justify-center ${isSelected ? 'bg-[#006482]/10' : 'bg-slate-100'}`}>
              {Icon && <Icon className={`h-3.5 w-3.5 ${isSelected ? 'text-[#006482]' : 'text-slate-500'}`} strokeWidth={1.8} />}
            </div>

            {/* Label */}
            <span className={`flex-1 text-[10px] font-semibold truncate ${isHidden ? 'line-through text-slate-300' : isSelected ? 'text-[#006482]' : 'text-slate-700'}`}>
              {label}
            </span>

            {/* Actions */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
              <button
                title="Odaklan"
                onClick={() => onFocus(node.id)}
                className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-[#006482] transition"
              >
                <Focus className="h-3 w-3" />
              </button>
              <button
                title={isHidden ? 'Göster' : 'Gizle'}
                onClick={() => onToggleHide(node.id)}
                className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition"
              >
                {isHidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </button>
              <button
                title="Sil"
                onClick={() => onDelete(node.id)}
                className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
