import { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface ActionItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

interface MoreActionsMenuProps {
  actions: ActionItem[];
}

export const MoreActionsMenu = ({ actions }: MoreActionsMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation(); // Stop row click navigation
          setIsOpen(!isOpen);
        }}
        className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
      >
        <MoreVertical className="h-4.5 w-4.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 z-30 w-36 rounded-2xl border border-slate-200/50 bg-white p-1.5 shadow-xl animate-in fade-in slide-in-from-top-1 duration-100">
          {actions.map((action, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                action.onClick();
              }}
              className={cn(
                'flex w-full items-center gap-2 rounded-xl px-2.5 py-2.5 text-xs font-semibold transition',
                action.variant === 'danger'
                  ? 'text-red-600 hover:bg-red-50/50'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <span className="h-4 w-4 shrink-0 flex items-center justify-center text-slate-400 group-hover:text-inherit">
                {action.icon}
              </span>
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
