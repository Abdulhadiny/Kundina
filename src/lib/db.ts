import Dexie, { Table } from 'dexie';

export interface DiaryEntry {
  id?: number;
  title: string;
  content: string;
  date: Date;
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
  }
}

export const db = new KundinaDB();