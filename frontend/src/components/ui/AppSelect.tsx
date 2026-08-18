import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface Option {
  value: string;
  label: string;
}

interface AppSelectProps {
  options?: Option[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  hasError?: boolean;
  className?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  onBlur?: () => void;
  id?: string;
}

export const AppSelect = ({
  options = [],
  value,
  onChange,
  placeholder = 'Seçiniz...',
  searchable = false,
  disabled = false,
  hasError = false,
  className,
  searchPlaceholder = 'Ara...',
  emptyText = 'Sonuç bulunamadı',
  onBlur,
  id,
}: AppSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; width: number } | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const updateMenuPosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const isBottomSpaceSmall = window.innerHeight - rect.bottom < 260;
    setMenuStyle({
      top: isBottomSpaceSmall ? Math.max(12, rect.top - 8) : rect.bottom + 8,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current && !containerRef.current.contains(target) && menuRef.current && !menuRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleScroll = (event: Event) => {
      const target = event.target;
      if (target instanceof Node && menuRef.current?.contains(target)) {
        return;
      }
      updateMenuPosition();
    };
    const handleResize = () => updateMenuPosition();
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, updateMenuPosition]);

  useEffect(() => {
    if (isOpen && searchable) {
      searchInputRef.current?.focus();
    }
  }, [isOpen, searchable]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery, options, isOpen]);

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchQuery.trim()) return options;
    const lowerQuery = searchQuery.toLowerCase();
    return options.filter((option) => option.label.toLowerCase().includes(lowerQuery));
  }, [options, searchable, searchQuery]);

  const selectedOption = useMemo(() => options.find((option) => String(option.value) === String(value)), [options, value]);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  const handleOpen = () => {
    if (disabled) return;
    if (!isOpen) {
      updateMenuPosition();
      setSearchQuery('');
      setHighlightedIndex(0);
    }
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(0);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (!isOpen) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleOpen();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % Math.max(filteredOptions.length, 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + Math.max(filteredOptions.length, 1)) % Math.max(filteredOptions.length, 1));
        break;
      case 'Enter': {
        event.preventDefault();
        const targetOption = filteredOptions[highlightedIndex];
        if (targetOption) handleSelect(targetOption.value);
        break;
      }
      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        onBlur={() => onBlur?.()}
        onKeyDown={handleKeyDown}
        className={cn(
          'dts-input w-full flex items-center justify-between gap-2 rounded-2xl border border-slate-200/70 bg-white/95 px-3 py-2 text-left text-sm shadow-sm transition-all duration-200 outline-none select-none',
          hasError && 'border-red-300 ring-2 ring-red-100',
          disabled && 'cursor-not-allowed bg-slate-50 opacity-50',
          !disabled && 'hover:border-slate-300 hover:shadow-md focus:border-[#006482] focus:ring-2 focus:ring-[#006482]/20',
          isOpen && 'border-[#006482] ring-2 ring-[#006482]/20',
          className,
        )}
      >
        <span className={cn('block truncate', !selectedOption && 'font-normal text-slate-400')}>
          {displayLabel}
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200', isOpen && 'rotate-180')} />
      </button>

      {isOpen && menuStyle && createPortal(
        <div
          ref={menuRef}
          style={{ position: 'fixed', top: menuStyle.top, left: menuStyle.left, width: menuStyle.width, zIndex: 99999 }}
          className="dts-select-menu rounded-2xl border border-slate-200/70 bg-white p-1.5 shadow-2xl shadow-slate-200/60"
        >
          {searchable && (
            <div className="mb-1.5 px-1.5 py-1">
              <div className="relative flex items-center">
                <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowDown') {
                      event.preventDefault();
                      setHighlightedIndex((prev) => (prev + 1) % Math.max(filteredOptions.length, 1));
                    } else if (event.key === 'ArrowUp') {
                      event.preventDefault();
                      setHighlightedIndex((prev) => (prev - 1 + Math.max(filteredOptions.length, 1)) % Math.max(filteredOptions.length, 1));
                    } else if (event.key === 'Enter') {
                      event.preventDefault();
                      const targetOption = filteredOptions[highlightedIndex];
                      if (targetOption) handleSelect(targetOption.value);
                    } else if (event.key === 'Escape') {
                      event.preventDefault();
                      setIsOpen(false);
                    }
                  }}
                  placeholder={searchPlaceholder}
                  className="w-full rounded-xl border-0 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-900 outline-none ring-1 ring-inset ring-slate-200 transition-all focus:bg-white focus:ring-2 focus:ring-inset focus:ring-[#006482]/40"
                />
              </div>
            </div>
          )}

          <div className="max-h-56 overflow-y-auto overflow-x-hidden p-0.5 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-3 text-center text-xs text-slate-400">{emptyText}</div>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = String(option.value) === String(value);
                const isHighlighted = index === highlightedIndex;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors',
                      isSelected
                        ? 'bg-[#eff8ff] text-[#006482]'
                        : isHighlighted
                          ? 'bg-slate-50 text-slate-900'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                    )}
                  >
                    <span className="block truncate pr-2">{option.label}</span>
                    {isSelected && <Check className="h-4 w-4 shrink-0 text-[#006482]" />}
                  </button>
                );
              })
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};
