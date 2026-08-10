import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  Edit2,
  Copy,
  CopyPlus,
  Trash2,
  ArrowUpToLine,
  ArrowDownToLine,
  Lock,
  Unlock,
  Eye,
  EyeOff,
} from 'lucide-react';

export interface ContextMenuAction {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  danger?: boolean;
  dividerBefore?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  nodeId: string;
  isLocked: boolean;
  isHidden?: boolean;
  isClassroomLinked?: boolean;
  selectedCount?: number;
  onEdit:       () => void;
  onCopy:       () => void;
  onDuplicate:  () => void;
  onDelete:     () => void;
  onBringFront: () => void;
  onSendBack:   () => void;
  onToggleLock: () => void;
  onToggleHide: () => void;
  onClose:      () => void;
}

export function ContextMenu({
  x,
  y,
  isLocked,
  isHidden = false,
  isClassroomLinked = false,
  selectedCount = 1,
  onEdit,
  onCopy,
  onDuplicate,
  onDelete,
  onBringFront,
  onSendBack,
  onToggleLock,
  onToggleHide,
  onClose,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const viewportWidth  = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const menuWidth  = 192;
  const menuHeight = selectedCount > 1 ? 72 : 304;
  const finalX = x + menuWidth  > viewportWidth  ? x - menuWidth  : x;
  const finalY = y + menuHeight > viewportHeight ? y - menuHeight : y;

  const actions: ContextMenuAction[] = selectedCount > 1
    ? [
        {
          label: `${selectedCount} Alanı Sil`,
          icon: <Trash2 className="h-3.5 w-3.5" />,
          onClick: () => { onDelete(); onClose(); },
          danger: true,
        },
      ]
    : [
        { label: 'Düzenle',          icon: <Edit2 className="h-3.5 w-3.5" />,          onClick: () => { onEdit();       onClose(); } },
        { label: 'Kopyala',          icon: <Copy className="h-3.5 w-3.5" />,            onClick: () => { onCopy();       onClose(); } },
        ...(!isClassroomLinked ? [{
          label: 'Çoğalt',
          icon: <CopyPlus className="h-3.5 w-3.5" />,
          onClick: () => { onDuplicate(); onClose(); },
        }] : []),
        { label: 'En Öne Getir',     icon: <ArrowUpToLine className="h-3.5 w-3.5" />,   onClick: () => { onBringFront(); onClose(); }, dividerBefore: true },
        { label: 'En Alta Gönder',   icon: <ArrowDownToLine className="h-3.5 w-3.5" />, onClick: () => { onSendBack();   onClose(); } },
        {
          label: isLocked ? 'Kilidi Aç' : 'Kilitle',
          icon: isLocked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />,
          onClick: () => { onToggleLock(); onClose(); },
          dividerBefore: true,
        },
        {
          label: isHidden ? 'Göster' : 'Gizle',
          icon: isHidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />,
          onClick: () => { onToggleHide(); onClose(); },
        },
        { label: 'Sil', icon: <Trash2 className="h-3.5 w-3.5" />, onClick: () => { onDelete(); onClose(); }, danger: true, dividerBefore: true },
      ];

  return createPortal(
    <div
      ref={menuRef}
      style={{ position: 'fixed', left: finalX, top: finalY, zIndex: 9999 }}
      className="w-48 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-1.5 overflow-hidden"
      onContextMenu={(e) => e.preventDefault()}
    >
      {actions.map((action) => (
        <div key={action.label}>
          {action.dividerBefore && <div className="my-1 border-t border-slate-100" />}
          <button
            onClick={action.onClick}
            className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-semibold transition-colors ${
              action.danger
                ? 'text-red-500 hover:bg-red-50'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className={action.danger ? 'text-red-400' : 'text-slate-400'}>{action.icon}</span>
            {action.label}
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
}
