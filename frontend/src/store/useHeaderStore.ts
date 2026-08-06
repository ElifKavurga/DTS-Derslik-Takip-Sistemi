import { create } from 'zustand';

interface HeaderState {
  title: string;
  breadcrumbs: string[];
  setMeta: (title: string, breadcrumbs: string[]) => void;
  resetMeta: () => void;
}

export const useHeaderStore = create<HeaderState>((set) => ({
  title: 'Ana Ekran',
  breadcrumbs: ['Ana Ekran'],
  setMeta: (title, breadcrumbs) => set({ title, breadcrumbs }),
  resetMeta: () => set({ title: 'Ana Ekran', breadcrumbs: ['Ana Ekran'] }),
}));
