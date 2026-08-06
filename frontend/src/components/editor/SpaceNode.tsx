import { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import { PALETTE_ITEM_MAP } from '@/types';
import { SPACE_ICONS, STATUS_BORDER_CLASS, STATUS_BG_CLASS, STATUS_DOT_CLASS } from './spaceNodeConfig';

export const SpaceNode = memo(({ data, selected }: NodeProps) => {
  const d = data as Record<string, unknown>;
  const type     = (d['type'] as string) ?? 'CLASSROOM';
  const status   = (d['status'] as string) ?? 'EMPTY';
  const label    = d['label'] as string | undefined;
  const code     = d['code'] as string | undefined;
  const capacity = d['capacity'] as number | undefined;
  const isLocked = d['isLocked'] as boolean | undefined;
  const isHidden = d['isHidden'] as boolean | undefined;

  const paletteItem = PALETTE_ITEM_MAP[type as keyof typeof PALETTE_ITEM_MAP];
  const Icon = SPACE_ICONS[type as keyof typeof SPACE_ICONS];

  const borderClass = STATUS_BORDER_CLASS[status] ?? STATUS_BORDER_CLASS['EMPTY'];
  const bgClass     = STATUS_BG_CLASS[status]     ?? STATUS_BG_CLASS['EMPTY'];
  const dotClass    = STATUS_DOT_CLASS[status]    ?? STATUS_DOT_CLASS['EMPTY'];

  return (
    <>
      <NodeResizer
        isVisible={selected && !isLocked}
        minWidth={60}
        minHeight={50}
        lineStyle={{ borderColor: '#006482' }}
        handleStyle={{ borderColor: '#006482', backgroundColor: '#fff', width: 8, height: 8 }}
      />

      <Handle type="source" position={Position.Right} style={{ opacity: 0, pointerEvents: 'none' }} />
      <Handle type="target" position={Position.Left}  style={{ opacity: 0, pointerEvents: 'none' }} />

      <div
        className={`
          relative h-full w-full flex flex-col items-center justify-center gap-0.5
          rounded-xl border-2 text-center select-none transition-all duration-150
          ${bgClass} ${borderClass}
          ${isHidden ? 'opacity-30' : 'opacity-100'}
          ${isLocked ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}
          ${selected ? 'ring-2 ring-[#006482] ring-offset-1 shadow-lg shadow-[#006482]/20' : 'shadow-sm'}
        `}
      >
        {/* Status dot */}
        <span className={`absolute top-1.5 right-1.5 h-2 w-2 rounded-full ${dotClass} flex-shrink-0`} />

        {/* Lock indicator */}
        {isLocked && (
          <span className="absolute top-1.5 left-1.5 text-slate-400">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </span>
        )}

        {/* Icon */}
        {Icon && <Icon className="h-4 w-4 text-slate-500 flex-shrink-0" strokeWidth={1.8} />}

        {/* Code */}
        {code && (
          <span className="text-[9px] font-extrabold text-slate-800 leading-tight tracking-wide truncate w-full px-1.5 text-center">
            {code}
          </span>
        )}

        {/* Type label */}
        <span className="text-[8px] font-semibold text-slate-400 leading-none truncate w-full text-center px-1">
          {paletteItem?.label ?? type}
        </span>

        {/* Capacity */}
        {capacity != null && (
          <span className="text-[7px] text-slate-400 font-medium leading-none">{capacity} kişi</span>
        )}

        {/* Room name below capacity */}
        {label && label !== code && (
          <span className="text-[7px] text-slate-300 leading-none truncate w-full text-center px-1">
            {label}
          </span>
        )}
      </div>
    </>
  );
});

SpaceNode.displayName = 'SpaceNode';
