'use client';

import { useEffect, useState } from 'react';
import { useDiaryStore } from '@/hooks/useDiaryStore';
import { DiaryEntry, DiaryCategory } from '@/lib/db';
import DiaryListSimple from './DiaryListSimple';
import DiaryCalendar from './DiaryCalendar';
import DiaryStats from './DiaryStats';
import DiaryFilters, { FilterOptions } from './DiaryFilters';
import DiaryForm from './DiaryForm';
import NotificationSettings from './NotificationSettings';
import { 
  List,
  Calendar,
  BarChart3,
  Filter,
  Plus,
  Bell,
  X
} from 'lucide-react';

type ViewMode = 'list' | 'calendar' | 'stats';

export default function DiaryView() {
  const {
    entries,
    filteredEntries,
    loading,
    error,
    currentFilters,
    fetchEntries,
    searchEntries,
    clearFilters
  } = useDiaryStore();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | undefined>();

  // Mock categories for now - in a real app, these would come from a store
  const [categories] = useState<DiaryCategory[]>([
    {
      id: 1,
      name: 'Personal',
      description: 'Personal thoughts and experiences',
      color: '#3B82F6',
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 2,
      name: 'Work',
      description: 'Work-related entries',
      color: '#10B981',
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 3,
      name: 'Travel',
      description: 'Travel experiences',
      color: '#F59E0B',
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  // Get all unique tags from entries
  const availableTags = Array.from(
    new Set(entries.flatMap(entry => entry.tags || []))
  ).sort();

  const displayEntries = filteredEntries.length > 0 || Object.keys(currentFilters).length > 0 
    ? filteredEntries 
    : entries;

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleFiltersChange = (filters: FilterOptions) => {
    searchEntries(filters);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setViewMode('list');
    
    // Filter entries for the selected date
    const dateString = date.toDateString();
    const dateEntries = entries.filter(entry => 
      new Date(entry.date).toDateString() === dateString
    );
    
    if (dateEntries.length === 0) {
      // No entries for this date, create new entry
      setShowForm(true);
    } else {
      // Show entries for this date
      searchEntries({
        dateFrom: date,
        dateTo: date
      });
    }
  };

  const handleCreateEntry = (date?: Date) => {
    setSelectedDate(date);
    setEditingEntry(undefined);
    setShowForm(true);
  };

  const handleEditEntry = (entry: DiaryEntry) => {
    setEditingEntry(entry);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingEntry(undefined);
    setSelectedDate(undefined);
  };

  const handleFormSuccess = () => {
    fetchEntries();
  };

  const viewModes = [
    { id: 'list' as ViewMode, icon: List, label: 'List', active: viewMode === 'list' },
    { id: 'calendar' as ViewMode, icon: Calendar, label: 'Calendar', active: viewMode === 'calendar' },
    { id: 'stats' as ViewMode, icon: BarChart3, label: 'Analytics', active: viewMode === 'stats' }
  ];

  const hasActiveFilters = Object.keys(currentFilters).length > 0;

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
      {/* Header with view mode toggle and actions */}
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
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            {viewModes.map(mode => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id)}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-colors text-sm ${
                    mode.active
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title={mode.label}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{mode.label}</span>
                </button>
              );
            })}
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(true)}
            className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-colors text-sm ${
              hasActiveFilters
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
            title="Filters"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">
              {hasActiveFilters ? 'Filtered' : 'Filter'}
            </span>
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 bg-blue-200 text-blue-800 text-xs rounded-full">
                {Object.keys(currentFilters).length}
              </span>
            )}
          </button>

          {/* Settings/Notifications Toggle */}
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center space-x-1 px-3 py-2 rounded-md transition-colors text-sm bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200"
            title="Notification Settings"
          >
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notifications</span>
          </button>

          {/* New Entry Button */}
          <button
            onClick={() => handleCreateEntry()}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Entry</span>
          </button>
        </div>
      </div>

      {/* Clear filters banner */}
      {hasActiveFilters && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-blue-700">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">
                Showing filtered results ({displayEntries.length} of {entries.length} entries)
              </span>
            </div>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div>
        {viewMode === 'list' && (
          <DiaryListSimple 
            entries={displayEntries}
            onEditEntry={handleEditEntry}
            onCreateEntry={() => handleCreateEntry()}
          />
        )}
        
        {viewMode === 'calendar' && (
          <DiaryCalendar
            entries={displayEntries}
            onDateSelect={handleDateSelect}
            onCreateEntry={handleCreateEntry}
            selectedDate={selectedDate}
          />
        )}
        
        {viewMode === 'stats' && (
          <DiaryStats entries={entries} />
        )}
      </div>

      {/* Filter Panel */}
      <DiaryFilters
        filters={currentFilters}
        onFiltersChange={handleFiltersChange}
        categories={categories}
        availableTags={availableTags}
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
      />

      {/* Entry Form */}
      {showForm && (
        <DiaryForm
          entry={editingEntry}
          selectedDate={selectedDate}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Notification Settings</span>
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <NotificationSettings />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}