import Dexie, { Table } from 'dexie';

export type MoodType = 'happy' | 'sad' | 'neutral' | 'excited' | 'anxious' | 'angry' | 'grateful' | 'stressed';

export interface DiaryCategory {
  id?: number;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiaryEntry {
  id?: number;
  title: string;
  content: string;
  date: Date;
  categoryId?: number;
  mood?: MoodType;
  weather?: string;
  location?: string;
  tags: string[];
  wordCount: number;
  readingTime: number; // estimated minutes
  isPrivate: boolean;
  isFavorite: boolean;
  templateUsed?: string;
  linkedEntryIds?: number[];
  // Offline conflict resolution fields
  syncStatus: 'synced' | 'pending' | 'conflict';
  lastSyncedAt?: Date;
  conflictVersion?: DiaryEntry;
  deviceId: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TodoItem {
  id?: number;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Note {
  id?: number;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id?: number;
  name: string;
  content: string;
  type: string;
  size: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reminder {
  id?: number;
  title: string;
  description?: string;
  reminderDate: Date;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class KundinaDB extends Dexie {
  diaryEntries!: Table<DiaryEntry>;
  diaryCategories!: Table<DiaryCategory>;
  todos!: Table<TodoItem>;
  notes!: Table<Note>;
  documents!: Table<Document>;
  reminders!: Table<Reminder>;

  constructor() {
    super('KundinaDB');
    this.version(1).stores({
      diaryEntries: '++id, title, content, date, createdAt, updatedAt',
      todos: '++id, title, description, completed, dueDate, createdAt, updatedAt',
      notes: '++id, title, content, createdAt, updatedAt',
      documents: '++id, name, content, type, size, createdAt, updatedAt',
      reminders: '++id, title, description, reminderDate, completed, createdAt, updatedAt'
    });

    // Enhanced schema with new fields
    this.version(2).stores({
      diaryEntries: '++id, title, content, date, mood, *tags, wordCount, isPrivate, isFavorite, createdAt, updatedAt',
      todos: '++id, title, description, completed, dueDate, createdAt, updatedAt',
      notes: '++id, title, content, createdAt, updatedAt',
      documents: '++id, name, content, type, size, createdAt, updatedAt',
      reminders: '++id, title, description, reminderDate, completed, createdAt, updatedAt'
    });

    // Phase 2 enhancements with categories and relationships
    this.version(3).stores({
      diaryEntries: '++id, title, content, date, categoryId, mood, *tags, wordCount, isPrivate, isFavorite, createdAt, updatedAt',
      diaryCategories: '++id, name, color, isDefault, createdAt, updatedAt',
      todos: '++id, title, description, completed, dueDate, createdAt, updatedAt',
      notes: '++id, title, content, createdAt, updatedAt',
      documents: '++id, name, content, type, size, createdAt, updatedAt',
      reminders: '++id, title, description, reminderDate, completed, createdAt, updatedAt'
    }).upgrade(tx => {
      // Create default categories when upgrading
      return tx.diaryCategories.bulkAdd([
        {
          name: 'Personal',
          description: 'Personal thoughts and experiences',
          color: '#3B82F6',
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Work',
          description: 'Work-related entries and professional thoughts',
          color: '#10B981',
          isDefault: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Travel',
          description: 'Travel experiences and adventures',
          color: '#F59E0B',
          isDefault: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Gratitude',
          description: 'Things you are grateful for',
          color: '#EF4444',
          isDefault: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
    });

    // Phase 3 enhancements with offline sync support
    this.version(4).stores({
      diaryEntries: '++id, title, content, date, categoryId, mood, *tags, wordCount, isPrivate, isFavorite, syncStatus, deviceId, version, createdAt, updatedAt',
      diaryCategories: '++id, name, color, isDefault, createdAt, updatedAt',
      todos: '++id, title, description, completed, dueDate, createdAt, updatedAt',
      notes: '++id, title, content, createdAt, updatedAt',
      documents: '++id, name, content, type, size, createdAt, updatedAt',
      reminders: '++id, title, description, reminderDate, completed, createdAt, updatedAt'
    }).upgrade(tx => {
      // Create default categories when upgrading
      return tx.diaryCategories.bulkAdd([
        {
          name: 'Personal',
          description: 'Personal thoughts and experiences',
          color: '#3B82F6',
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Work',
          description: 'Work-related entries and professional thoughts',
          color: '#10B981',
          isDefault: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Travel',
          description: 'Travel experiences and adventures',
          color: '#F59E0B',
          isDefault: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Gratitude',
          description: 'Things you are grateful for',
          color: '#EF4444',
          isDefault: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
    });
  }
}

// Conflict resolution utilities
export interface ConflictResolution {
  strategy: 'local' | 'remote' | 'manual' | 'merge';
  resolvedEntry?: DiaryEntry;
  timestamp: Date;
}

export class OfflineConflictResolver {
  static async detectConflicts(): Promise<DiaryEntry[]> {
    return await db.diaryEntries.where('syncStatus').equals('conflict').toArray();
  }

  static async resolveConflict(
    entryId: number, 
    resolution: ConflictResolution
  ): Promise<void> {
    const entry = await db.diaryEntries.get(entryId);
    if (!entry) return;

    switch (resolution.strategy) {
      case 'local':
        await db.diaryEntries.update(entryId, {
          syncStatus: 'pending',
          conflictVersion: undefined,
          version: entry.version + 1,
          updatedAt: new Date()
        });
        break;

      case 'remote':
        if (entry.conflictVersion) {
          await db.diaryEntries.update(entryId, {
            ...entry.conflictVersion,
            syncStatus: 'synced',
            conflictVersion: undefined,
            updatedAt: new Date()
          });
        }
        break;

      case 'merge':
        if (resolution.resolvedEntry) {
          await db.diaryEntries.update(entryId, {
            ...resolution.resolvedEntry,
            syncStatus: 'pending',
            conflictVersion: undefined,
            version: Math.max(entry.version, entry.conflictVersion?.version || 0) + 1,
            updatedAt: new Date()
          });
        }
        break;

      case 'manual':
        // Manual resolution handled by user in UI
        break;
    }
  }

  static async markAsConflict(
    localEntry: DiaryEntry, 
    remoteEntry: DiaryEntry
  ): Promise<void> {
    await db.diaryEntries.update(localEntry.id!, {
      syncStatus: 'conflict',
      conflictVersion: remoteEntry,
      updatedAt: new Date()
    });
  }
}

export const db = new KundinaDB();

// Utility functions for diary entries
export const calculateWordCount = (text: string): number => {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

export const calculateReadingTime = (wordCount: number): number => {
  // Average reading speed: 200-300 words per minute, using 250 as middle ground
  return Math.ceil(wordCount / 250);
};

export const generateUniqueId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('kundina_device_id');
  if (!deviceId) {
    deviceId = generateUniqueId();
    localStorage.setItem('kundina_device_id', deviceId);
  }
  return deviceId;
};

// Enhanced entry creation with sync fields
export const createDiaryEntry = (entry: Partial<DiaryEntry>): DiaryEntry => {
  const now = new Date();
  return {
    title: '',
    content: '',
    date: now,
    tags: [],
    wordCount: 0,
    readingTime: 0,
    isPrivate: false,
    isFavorite: false,
    syncStatus: 'pending' as const,
    deviceId: getDeviceId(),
    version: 1,
    createdAt: now,
    updatedAt: now,
    ...entry
  };
};

// Entry templates
export const ENTRY_TEMPLATES = {
  daily: {
    name: 'Daily Reflection',
    content: `## How was your day?

### Highlights
- 

### Challenges
- 

### Grateful for
- 

### Tomorrow's focus
- `
  },
  gratitude: {
    name: 'Gratitude Journal',
    content: `## Today I'm grateful for...

1. 
2. 
3. 

## Why these matter to me:

## How I can show appreciation:`
  },
  travel: {
    name: 'Travel Entry',
    content: `## Location: 

### What I did today
- 

### New discoveries
- 

### Local food/culture
- 

### Memorable moments
- 

### Photos/memories to remember:`
  },
  goals: {
    name: 'Goal Reflection',
    content: `## Current Goals

### Progress made today
- 

### Challenges faced
- 

### Next steps
- 

### Motivation/inspiration
- `
  }
} as const;