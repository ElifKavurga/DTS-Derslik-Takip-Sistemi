import { useState } from 'react';
import { Layers, LayoutGrid } from 'lucide-react';
import type { Node } from '@xyflow/react';
import { PALETTE_ITEMS, LeftPanelTab } from '@/types';
import { SPACE_ICONS } from './spaceNodeConfig';
import { LayerPanel } from './LayerPanel';

interface ObjectPaletteProps {
  nodes: Node[];
  selectedNodeId: string | null;
  onSelectNode:    (id: string) => void;
  onFocusNode:     (id: string) => void;
  onToggleHide:    (id: string) => void;
  onDeleteNode:    (id: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  classroom:      'Sınıflar',
  office:         'Ofisler',
  wc:             'WC / Tuvalet',
  service:        'Hizmet Alanları',
  infrastructure: 'Altyapı',
};

export function ObjectPalette({
  nodes, selectedNodeId,
  onSelectNode, onFocusNode, onToggleHide, onDeleteNode,
}: ObjectPaletteProps) {
  const [tab, setTab] = useState<LeftPanelTab>('objects');

  const grouped = PALETTE_ITEMS.reduce<Record<string, typeof PALETTE_ITEMS>>((acc, item) => {
    (acc[item.category] ||= []).push(item);
    return acc;
  }, {});

  return (
    <aside className="hidden md:flex flex-col w-56 border-r border-slate-200 bg-white flex-shrink-0 overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-slate-100 flex-shrink-0">
        {(['objects', 'layers'] as LeftPanelTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[9px] font-bold uppercase tracking-widest transition-colors ${
              tab === t
                ? 'text-[#006482] border-b-2 border-[#006482] bg-[#eff8ff]/50'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {t === 'objects' ? <LayoutGrid className="h-3 w-3" /> : <Layers className="h-3 w-3" />}
            {t === 'objects' ? 'Nesneler' : 'Katmanlar'}
          </button>
        ))}
      </div>

      {tab === 'objects' ? (
        <div className="flex-1 overflow-y-auto p-2 space-y-3">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 px-2 pb-1">
                {CATEGORY_LABELS[category] ?? category}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const Icon = SPACE_ICONS[item.type];
                  return (
                    <div
                      key={item.type}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/dts-space-type', item.type);
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
                      className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 cursor-grab active:cursor-grabbing hover:bg-[#eff8ff] group transition select-none"
                    >
                      <div className="h-6 w-6 flex-shrink-0 rounded-lg bg-slate-50 group-hover:bg-[#006482]/10 flex items-center justify-center transition">
                        {Icon && <Icon className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#006482] transition" strokeWidth={1.8} />}
                      </div>
                      <span className="text-[10px] font-semibold text-slate-700 group-hover:text-[#006482] transition-colors leading-tight">
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <LayerPanel
          nodes={nodes}
          selectedNodeId={selectedNodeId}
          onSelect={onSelectNode}
          onFocus={onFocusNode}
          onToggleHide={onToggleHide}
          onDelete={onDeleteNode}
        />
      )}
    </aside>
  );
}
