'use client';

import { useEffect, useState } from 'react';
import { useDiaryStore } from '@/hooks/useDiaryStore';
import { DiaryEntry } from '@/lib/db';
import { 
  Calendar, 
  Edit, 
  Trash2, 
  Plus, 
  Search,
  Download,
  Star,
  Lock,
  MapPin,
  Cloud,
  Clock,
  Tag,
  Eye,
  CheckSquare,
  Square,
  X
} from 'lucide-react';
import DiaryForm from './DiaryForm';
import ReactMarkdown from 'react-markdown';

export default function DiaryList() {
  const { 
    entries, 
    filteredEntries,
    loading, 
    error, 
    currentFilters,
    fetchEntries, 
    deleteEntry,
    searchEntries,
    clearFilters,
    bulkDelete,
    exportEntries
  } = useDiaryStore();
  
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | undefined>();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntries, setSelectedEntries] = useState<number[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState<number | null>(null);
  
  const displayEntries = filteredEntries.length > 0 || Object.keys(currentFilters).length > 0 ? filteredEntries : entries;

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  useEffect(() => {
    if (searchQuery) {
      const timeoutId = setTimeout(() => {
        searchEntries({ query: searchQuery });
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      clearFilters();
    }
  }, [searchQuery, searchEntries, clearFilters]);

  const handleEdit = (entry: DiaryEntry) => {
    setEditingEntry(entry);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      await deleteEntry(id);
      setSelectedEntries(prev => prev.filter(entryId => entryId !== id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedEntries.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedEntries.length} entries?`)) {
      await bulkDelete(selectedEntries);
      setSelectedEntries([]);
      setBulkMode(false);
    }
  };

  const handleSelectEntry = (id: number) => {
    if (selectedEntries.includes(id)) {
      setSelectedEntries(prev => prev.filter(entryId => entryId !== id));
    } else {
      setSelectedEntries(prev => [...prev, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedEntries.length === displayEntries.length) {
      setSelectedEntries([]);
    } else {
      setSelectedEntries(displayEntries.map(entry => entry.id!).filter(Boolean));
    }
  };

  const handleExport = async (format: 'json' | 'csv' | 'markdown') => {
    try {
      const data = await exportEntries(format);
      const blob = new Blob([data], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `diary-entries.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setShowExportMenu(false);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getMoodEmoji = (mood?: string) => {
    const moodMap = {
      happy: '😊',
      sad: '😢',
      excited: '🤩',
      anxious: '😰',
      angry: '😠',
      neutral: '😐',
      grateful: '🙏',
      stressed: '😤'
    };
    return mood ? moodMap[mood as keyof typeof moodMap] || '😐' : null;
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

  const formatShortDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
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
      {/* Header with search and actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">My Diary</h1>
          {displayEntries.length > 0 && (
            <span className="text-sm text-gray-500">
              {displayEntries.length} {displayEntries.length === 1 ? 'entry' : 'entries'}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search entries..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Bulk mode toggle */}
          {displayEntries.length > 0 && (
            <button
              onClick={() => {
                setBulkMode(!bulkMode);
                setSelectedEntries([]);
              }}
              className={`p-2 rounded-md transition-colors ${
                bulkMode ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Select multiple entries"
            >
              <CheckSquare className="w-4 h-4" />
            </button>
          )}

          {/* Export menu */}
          {displayEntries.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Export entries"
              >
                <Download className="w-4 h-4" />
              </button>
              {showExportMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-20">
                    <div className="py-1">
                      <button
                        onClick={() => handleExport('json')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Export as JSON
                      </button>
                      <button
                        onClick={() => handleExport('csv')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Export as CSV
                      </button>
                      <button
                        onClick={() => handleExport('markdown')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Export as Markdown
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* New entry button */}
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Entry</span>
          </button>
        </div>
      </div>

      {/* Bulk actions bar */}
      {bulkMode && selectedEntries.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedEntries.length} {selectedEntries.length === 1 ? 'entry' : 'entries'} selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 text-sm text-red-600 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
              >
                Delete Selected
              </button>
              <button
                onClick={() => {
                  setSelectedEntries([]);
                  setBulkMode(false);
                }}
                className="px-3 py-1 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      {displayEntries.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'No matching entries found' : 'No diary entries yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery 
              ? 'Try adjusting your search terms or clearing the search.'
              : 'Start documenting your thoughts and experiences.'
            }
          </p>
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Clear Search
            </button>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Write Your First Entry
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6">
          {/* Select all checkbox in bulk mode */}
          {bulkMode && (
            <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
              <button
                onClick={handleSelectAll}
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
              >
                {selectedEntries.length === displayEntries.length ? (
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                <span>Select all</span>
              </button>
            </div>
          )}

          {/* Entries grid */}
          {displayEntries.map((entry) => (
            <div
              key={entry.id}
              className={`bg-white rounded-lg shadow-md border transition-all ${
                selectedEntries.includes(entry.id!) 
                  ? 'border-blue-300 ring-2 ring-blue-100' 
                  : 'border-gray-200 hover:shadow-lg'
              }`}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start space-x-3 flex-1">
                    {/* Bulk select checkbox */}
                    {bulkMode && (
                      <button
                        onClick={() => handleSelectEntry(entry.id!)}
                        className="mt-1"
                      >
                        {selectedEntries.includes(entry.id!) ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    )}

                    <div className="flex-1">
                      {/* Title and privacy/favorite indicators */}
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{entry.title}</h3>
                        {entry.isFavorite && (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        )}
                        {entry.isPrivate && (
                          <Lock className="w-4 h-4 text-gray-400" />
                        )}
                      </div>

                      {/* Date and metadata */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatShortDate(entry.date)}
                        </div>
                        
                        {entry.mood && (
                          <div className="flex items-center">
                            <span className="mr-1">{getMoodEmoji(entry.mood)}</span>
                            <span className="capitalize">{entry.mood}</span>
                          </div>
                        )}
                        
                        {entry.location && (
                          <div className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {entry.location}
                          </div>
                        )}
                        
                        {entry.weather && (
                          <div className="flex items-center">
                            <Cloud className="w-3 h-3 mr-1" />
                            {entry.weather}
                          </div>
                        )}
                        
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {entry.wordCount} words • {entry.readingTime} min
                        </div>
                      </div>

                      {/* Tags */}
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {entry.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              <Tag className="w-3 h-3 mr-1" />
                              {tag}
                            </span>
                          ))}
                          {entry.tags.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{entry.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id!)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Preview entry"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
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

                {/* Content preview */}
                <div className="prose prose-sm max-w-none">
                  {expandedEntry === entry.id ? (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <ReactMarkdown className="text-gray-700">
                        {entry.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-gray-700 line-clamp-3">
                      {entry.content.length > 200 
                        ? entry.content.substring(0, 200) + '...'
                        : entry.content
                      }
                    </p>
                  )}
                </div>
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