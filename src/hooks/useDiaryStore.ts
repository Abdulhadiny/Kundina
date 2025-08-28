import { create } from 'zustand';
import { db, DiaryEntry } from '@/lib/db';

interface DiaryStore {
  entries: DiaryEntry[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchEntries: () => Promise<void>;
  addEntry: (entry: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEntry: (id: number, entry: Partial<DiaryEntry>) => Promise<void>;
  deleteEntry: (id: number) => Promise<void>;
  getEntry: (id: number) => Promise<DiaryEntry | undefined>;
}

export const useDiaryStore = create<DiaryStore>((set, get) => ({
  entries: [],
  loading: false,
  error: null,

  fetchEntries: async () => {
    set({ loading: true, error: null });
    try {
      const entries = await db.diaryEntries.orderBy('date').reverse().toArray();
      set({ entries, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch diary entries', loading: false });
    }
  },

  addEntry: async (entryData) => {
    set({ loading: true, error: null });
    try {
      const now = new Date();
      const entry: Omit<DiaryEntry, 'id'> = {
        ...entryData,
        createdAt: now,
        updatedAt: now,
      };
      
      await db.diaryEntries.add(entry);
      await get().fetchEntries();
    } catch (error) {
      set({ error: 'Failed to add diary entry', loading: false });
    }
  },

  updateEntry: async (id, entryData) => {
    set({ loading: true, error: null });
    try {
      await db.diaryEntries.update(id, {
        ...entryData,
        updatedAt: new Date(),
      });
      await get().fetchEntries();
    } catch (error) {
      set({ error: 'Failed to update diary entry', loading: false });
    }
  },

  deleteEntry: async (id) => {
    set({ loading: true, error: null });
    try {
      await db.diaryEntries.delete(id);
      await get().fetchEntries();
    } catch (error) {
      set({ error: 'Failed to delete diary entry', loading: false });
    }
  },

  getEntry: async (id) => {
    try {
      return await db.diaryEntries.get(id);
    } catch (error) {
      set({ error: 'Failed to get diary entry' });
      return undefined;
    }
  },
}));