import { useQuery } from '@tanstack/react-query';
import { Loader2, Search, X } from 'lucide-react';
import { KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { globalSearchService, GlobalSearchResult, GlobalSearchResultType } from '@/services/globalSearchService';
import { Role } from '@/types';

type GlobalSearchPanelProps = {
  role?: Role;
  onClose: () => void;
};

const categoryLabels: Record<GlobalSearchResultType, string> = {
  COURSE: 'DERSLER',
  ACADEMICIAN: 'AKADEMİSYENLER',
  FACULTY: 'FAKÜLTELER',
};

const useDebouncedValue = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeoutId);
  }, [value, delay]);

  return debouncedValue;
};

export const GlobalSearchPanel = ({ role, onClose }: GlobalSearchPanelProps) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const debouncedQuery = useDebouncedValue(query, 250);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['global-search', debouncedQuery, role],
    queryFn: () => globalSearchService.search(debouncedQuery, role),
    enabled: debouncedQuery.trim().length >= 2,
  });

  const groupedResults = useMemo(
    () =>
      results.reduce<Record<GlobalSearchResultType, GlobalSearchResult[]>>(
        (acc, result) => {
          acc[result.type].push(result);
          return acc;
        },
        { COURSE: [], ACADEMICIAN: [], FACULTY: [] },
      ),
    [results],
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [debouncedQuery]);

  const openResult = (result: GlobalSearchResult) => {
    navigate(result.targetUrl);
    onClose();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      onClose();
      return;
    }

    if (!results.length) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + results.length) % results.length);
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      openResult(results[activeIndex]);
    }
  };

  const hasQuery = query.trim().length > 0;
  const hasSearchableQuery = debouncedQuery.trim().length >= 2;
  const hasResults = results.length > 0;
  let renderedIndex = 0;

  return (
    <div className="fixed left-3 right-3 top-16 z-50 mx-auto max-w-2xl rounded-2xl border border-[#DCE4EA] bg-white shadow-2xl shadow-slate-900/10 sm:left-1/2 sm:right-auto sm:w-[640px] sm:-translate-x-1/2">
      <div className="border-b border-[#DCE4EA] p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-xs font-bold tracking-[0.18em] text-[#647488]">ARAMA</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Aramayı kapat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#647488]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            className="h-11 w-full rounded-xl border border-[#DCE4EA] bg-[#F6F8FA] pl-10 pr-10 text-sm text-[#102033] outline-none transition placeholder:text-[#647488] focus:border-[#006482] focus:bg-white focus:ring-4 focus:ring-[#006482]/10"
            placeholder="Ders, fakülte veya akademisyen ara..."
          />
          {isFetching && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#006482]" />}
        </div>
      </div>

      <div className="max-h-[60vh] overflow-y-auto p-3">
        {!hasQuery && <div className="px-3 py-10 text-center text-sm font-medium text-[#647488]">Aramaya başlayın.</div>}
        {hasQuery && !hasSearchableQuery && (
          <div className="px-3 py-10 text-center text-sm font-medium text-[#647488]">En az 2 karakter yazın.</div>
        )}
        {hasSearchableQuery && !isFetching && !hasResults && (
          <div className="px-3 py-10 text-center text-sm font-medium text-[#647488]">
            Aramanızla eşleşen kayıt bulunamadı.
          </div>
        )}

        {hasResults &&
          (Object.keys(groupedResults) as GlobalSearchResultType[]).map((type) => {
            const items = groupedResults[type];
            if (!items.length) return null;

            return (
              <div key={type} className="mb-3 last:mb-0">
                <div className="px-3 py-2 text-[11px] font-bold tracking-[0.16em] text-[#647488]">{categoryLabels[type]}</div>
                <div className="space-y-1">
                  {items.map((result) => {
                    const currentIndex = renderedIndex;
                    renderedIndex += 1;

                    return (
                      <button
                        key={`${result.type}-${result.id}`}
                        type="button"
                        onClick={() => openResult(result)}
                        className={`w-full rounded-xl px-3 py-2.5 text-left transition ${
                          activeIndex === currentIndex ? 'bg-[#006482]/10 text-[#102033]' : 'hover:bg-[#F6F8FA]'
                        }`}
                      >
                        <div className="text-sm font-bold text-[#102033]">{result.title}</div>
                        {result.subtitle && <div className="mt-0.5 text-xs font-medium text-[#647488]">{result.subtitle}</div>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
