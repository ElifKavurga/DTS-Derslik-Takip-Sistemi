import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; width: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
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

  useEffect(() => {
    if (!isOpen) return;
    const closeMenu = () => setIsOpen(false);
    window.addEventListener('scroll', closeMenu, true);
    window.addEventListener('resize', closeMenu);
    return () => {
      window.removeEventListener('scroll', closeMenu, true);
      window.removeEventListener('resize', closeMenu);
    };
  }, [isOpen]);

  const toggleMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const width = 176;
      const estimatedHeight = actions.length * 40 + 12;
      const margin = 8;
      const opensUp = window.innerHeight - rect.bottom < estimatedHeight + margin;
      const top = opensUp
        ? Math.max(margin, rect.top - estimatedHeight - margin)
        : Math.min(rect.bottom + margin, window.innerHeight - estimatedHeight - margin);
      const left = Math.min(
        Math.max(margin, rect.right - width),
        window.innerWidth - width - margin,
      );

      setMenuStyle({ top, left, width });
    }

    setIsOpen((value) => !value);
  };

  return (
    <div className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleMenu}
        className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
      >
        <MoreVertical className="h-4.5 w-4.5" />
      </button>

      {isOpen && menuStyle && createPortal(
        <div
          ref={menuRef}
          style={{ position: 'fixed', top: menuStyle.top, left: menuStyle.left, width: menuStyle.width, zIndex: 9999 }}
          className="rounded-2xl border border-slate-200/50 bg-white p-1.5 shadow-2xl shadow-slate-300/40 animate-in fade-in zoom-in-95 duration-100"
        >
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
        </div>,
        document.body,
      )}
    </div>
  );
};
