import { create } from 'zustand';
import { db, Document } from '@/lib/db';

interface DocsStore {
  documents: Document[];
  loading: boolean;
  error: string | null;
  
  // Actions (placeholder for future implementation)
  fetchDocuments: () => Promise<void>;
  addDocument: (doc: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateDocument: (id: number, doc: Partial<Document>) => Promise<void>;
  deleteDocument: (id: number) => Promise<void>;
}

export const useDocsStore = create<DocsStore>((set, get) => ({
  documents: [],
  loading: false,
  error: null,

  fetchDocuments: async () => {
    // Placeholder implementation
    set({ loading: true });
    setTimeout(() => set({ loading: false }), 500);
  },

  addDocument: async (docData) => {
    // Placeholder implementation
    console.log('Add document:', docData);
  },

  updateDocument: async (id, docData) => {
    // Placeholder implementation
    console.log('Update document:', id, docData);
  },

  deleteDocument: async (id) => {
    // Placeholder implementation
    console.log('Delete document:', id);
  },
}));