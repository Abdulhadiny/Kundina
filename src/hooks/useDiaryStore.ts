import { create } from 'zustand';
import { db, DiaryEntry, MoodType } from '@/lib/db';
import { notificationManager } from '@/lib/notifications';

interface SearchFilters {
  query?: string;
  tags?: string[];
  mood?: MoodType;
  dateFrom?: Date;
  dateTo?: Date;
  isPrivate?: boolean;
  isFavorite?: boolean;
}

interface DiaryStore {
  entries: DiaryEntry[];
  filteredEntries: DiaryEntry[];
  loading: boolean;
  error: string | null;
  currentFilters: SearchFilters;
  
  // Actions
  fetchEntries: () => Promise<void>;
  addEntry: (entry: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEntry: (id: number, entry: Partial<DiaryEntry>) => Promise<void>;
  deleteEntry: (id: number) => Promise<void>;
  getEntry: (id: number) => Promise<DiaryEntry | undefined>;
  
  // Search and filter
  searchEntries: (filters: SearchFilters) => void;
  clearFilters: () => void;
  
  // Bulk operations
  bulkDelete: (ids: number[]) => Promise<void>;
  bulkExport: (ids: number[]) => Promise<string>;
  
  // Export
  exportEntries: (format: 'json' | 'csv' | 'markdown') => Promise<string>;
}

const applyFilters = (entries: DiaryEntry[], filters: SearchFilters): DiaryEntry[] => {
  let filtered = [...entries];

  // Text search
  if (filters.query) {
    const query = filters.query.toLowerCase();
    filtered = filtered.filter(entry => 
      entry.title.toLowerCase().includes(query) ||
      entry.content.toLowerCase().includes(query) ||
      entry.location?.toLowerCase().includes(query) ||
      entry.weather?.toLowerCase().includes(query)
    );
  }

  // Tags filter
  if (filters.tags && filters.tags.length > 0) {
    filtered = filtered.filter(entry =>
      filters.tags!.some(tag => entry.tags.includes(tag))
    );
  }

  // Mood filter
  if (filters.mood) {
    filtered = filtered.filter(entry => entry.mood === filters.mood);
  }

  // Date range filter
  if (filters.dateFrom) {
    filtered = filtered.filter(entry => new Date(entry.date) >= filters.dateFrom!);
  }
  if (filters.dateTo) {
    filtered = filtered.filter(entry => new Date(entry.date) <= filters.dateTo!);
  }

  // Privacy filter
  if (filters.isPrivate !== undefined) {
    filtered = filtered.filter(entry => entry.isPrivate === filters.isPrivate);
  }

  // Favorite filter
  if (filters.isFavorite !== undefined) {
    filtered = filtered.filter(entry => entry.isFavorite === filters.isFavorite);
  }

  return filtered;
};

export const useDiaryStore = create<DiaryStore>((set, get) => ({
  entries: [],
  filteredEntries: [],
  loading: false,
  error: null,
  currentFilters: {},

  fetchEntries: async () => {
    set({ loading: true, error: null });
    try {
      const entries = await db.diaryEntries.orderBy('date').reverse().toArray();
      const { currentFilters } = get();
      const filteredEntries = applyFilters(entries, currentFilters);
      set({ entries, filteredEntries, loading: false });
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
        tags: entryData.tags || [],
        wordCount: entryData.wordCount || 0,
        readingTime: entryData.readingTime || 0,
        isPrivate: entryData.isPrivate || false,
        isFavorite: entryData.isFavorite || false,
        createdAt: now,
        updatedAt: now,
      };
      
      await db.diaryEntries.add(entry);
      await get().fetchEntries();
      
      // Check for streak milestones after adding entry
      setTimeout(async () => {
        try {
          const streak = await notificationManager.calculateStreak();
          const milestones = [7, 14, 30, 60, 100, 365];
          if (milestones.includes(streak)) {
            await notificationManager.showStreakMilestone(streak);
          }
        } catch (error) {
          console.error('Failed to check streak milestone:', error);
        }
      }, 1000); // Small delay to ensure data is saved
      
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

  searchEntries: (filters: SearchFilters) => {
    const { entries } = get();
    const filteredEntries = applyFilters(entries, filters);
    set({ currentFilters: filters, filteredEntries });
  },

  clearFilters: () => {
    const { entries } = get();
    set({ currentFilters: {}, filteredEntries: entries });
  },

  bulkDelete: async (ids: number[]) => {
    set({ loading: true, error: null });
    try {
      await db.transaction('rw', db.diaryEntries, async () => {
        for (const id of ids) {
          await db.diaryEntries.delete(id);
        }
      });
      await get().fetchEntries();
    } catch (error) {
      set({ error: 'Failed to delete entries', loading: false });
    }
  },

  bulkExport: async (ids: number[]) => {
    try {
      const entries = await db.diaryEntries.where('id').anyOf(ids).toArray();
      return JSON.stringify(entries, null, 2);
    } catch (error) {
      throw new Error('Failed to export entries');
    }
  },

  exportEntries: async (format: 'json' | 'csv' | 'markdown') => {
    const { filteredEntries } = get();
    const entries = filteredEntries.length > 0 ? filteredEntries : get().entries;
    
    switch (format) {
      case 'json':
        return JSON.stringify(entries, null, 2);
        
      case 'csv':
        const headers = ['Date', 'Title', 'Content', 'Mood', 'Tags', 'Location', 'Weather', 'Word Count', 'Private', 'Favorite'];
        const csvRows = [
          headers.join(','),
          ...entries.map(entry => [
            entry.date.toISOString().split('T')[0],
            `"${entry.title.replace(/"/g, '""')}"`,
            `"${entry.content.replace(/"/g, '""').replace(/\n/g, '\\n')}"`,
            entry.mood || '',
            `"${entry.tags.join(', ')}"`,
            entry.location || '',
            entry.weather || '',
            entry.wordCount.toString(),
            entry.isPrivate.toString(),
            entry.isFavorite.toString()
          ].join(','))
        ];
        return csvRows.join('\n');
        
      case 'markdown':
        return entries.map(entry => {
          const tags = entry.tags.length > 0 ? `\n**Tags:** ${entry.tags.map(tag => `#${tag}`).join(' ')}` : '';
          const mood = entry.mood ? `\n**Mood:** ${entry.mood}` : '';
          const location = entry.location ? `\n**Location:** ${entry.location}` : '';
          const weather = entry.weather ? `\n**Weather:** ${entry.weather}` : '';
          
          return `# ${entry.title}

**Date:** ${entry.date.toLocaleDateString()}${mood}${location}${weather}${tags}

---

${entry.content}

---
*Word count: ${entry.wordCount} | Reading time: ${entry.readingTime} min*

`;
        }).join('\n\n');
        
      default:
        throw new Error('Unsupported export format');
    }
  },
}));