'use client';

import { useEffect, useState } from 'react';
import { useDiaryStore } from '@/hooks/useDiaryStore';
import { DiaryEntry } from '@/lib/db';
import { Calendar, Edit, Trash2, Plus } from 'lucide-react';
import DiaryForm from './DiaryForm';

export default function DiaryList() {
  const { entries, loading, error, fetchEntries, deleteEntry } = useDiaryStore();
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | undefined>();

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleEdit = (entry: DiaryEntry) => {
    setEditingEntry(entry);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      await deleteEntry(id);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingEntry(undefined);
  };

  const handleFormSuccess = () => {
    fetchEntries();
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading && entries.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchEntries}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Diary</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Entry</span>
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No diary entries yet</h3>
          <p className="text-gray-600 mb-6">Start documenting your thoughts and experiences.</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Write Your First Entry
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{entry.title}</h3>
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <Calendar className="w-4 h-4 mr-2" />
                    {formatDate(entry.date)}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(entry)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Edit entry"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => entry.id && handleDelete(entry.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap line-clamp-4">
                  {entry.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <DiaryForm
          entry={editingEntry}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}