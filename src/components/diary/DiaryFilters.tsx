'use client';

import { useState, useEffect } from 'react';
import { DiaryCategory, MoodType } from '@/lib/db';
import { 
  Filter, 
  X, 
  Calendar,
  Tag,
  Heart,
  Lock,
  Folder,
  RotateCcw
} from 'lucide-react';

export interface FilterOptions {
  query?: string;
  tags?: string[];
  mood?: MoodType;
  categoryId?: number;
  dateFrom?: Date;
  dateTo?: Date;
  isPrivate?: boolean;
  isFavorite?: boolean;
}

interface DiaryFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  categories: DiaryCategory[];
  availableTags: string[];
  isOpen: boolean;
  onClose: () => void;
}

const moodOptions = [
  { value: 'happy', emoji: '😊', label: 'Happy' },
  { value: 'sad', emoji: '😢', label: 'Sad' },
  { value: 'excited', emoji: '🤩', label: 'Excited' },
  { value: 'anxious', emoji: '😰', label: 'Anxious' },
  { value: 'angry', emoji: '😠', label: 'Angry' },
  { value: 'neutral', emoji: '😐', label: 'Neutral' },
  { value: 'grateful', emoji: '🙏', label: 'Grateful' },
  { value: 'stressed', emoji: '😤', label: 'Stressed' },
];

export default function DiaryFilters({
  filters,
  onFiltersChange,
  categories,
  availableTags,
  isOpen,
  onClose
}: DiaryFiltersProps) {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleTagToggle = (tag: string) => {
    const currentTags = localFilters.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    
    handleFilterChange('tags', newTags.length > 0 ? newTags : undefined);
  };

  const clearAllFilters = () => {
    const clearedFilters: FilterOptions = {};
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = Object.keys(filters).some(key => 
    filters[key as keyof FilterOptions] !== undefined && 
    filters[key as keyof FilterOptions] !== ''
  );

  const formatDateForInput = (date?: Date) => {
    return date ? date.toISOString().split('T')[0] : '';
  };

  const parseDateFromInput = (dateString: string) => {
    return dateString ? new Date(dateString) : undefined;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-25 z-40" onClick={onClose} />
      
      {/* Filter Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            </div>
            <div className="flex items-center space-x-2">
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Date Range */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Date Range
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">From</label>
                <input
                  type="date"
                  value={formatDateForInput(localFilters.dateFrom)}
                  onChange={(e) => handleFilterChange('dateFrom', parseDateFromInput(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">To</label>
                <input
                  type="date"
                  value={formatDateForInput(localFilters.dateTo)}
                  onChange={(e) => handleFilterChange('dateTo', parseDateFromInput(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Category */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <Folder className="w-4 h-4 mr-2" />
              Category
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => handleFilterChange('categoryId', undefined)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  !localFilters.categoryId 
                    ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                }`}
              >
                All Categories
              </button>
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => handleFilterChange('categoryId', category.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center space-x-2 ${
                    localFilters.categoryId === category.id
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  />
                  <span>{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mood */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Mood</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleFilterChange('mood', undefined)}
                className={`px-3 py-2 rounded-md text-sm transition-colors ${
                  !localFilters.mood 
                    ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                }`}
              >
                All Moods
              </button>
              {moodOptions.map(mood => (
                <button
                  key={mood.value}
                  onClick={() => handleFilterChange('mood', mood.value as MoodType)}
                  className={`px-3 py-2 rounded-md text-sm transition-colors flex items-center space-x-2 ${
                    localFilters.mood === mood.value
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <span>{mood.emoji}</span>
                  <span>{mood.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          {availableTags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <Tag className="w-4 h-4 mr-2" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {availableTags.slice(0, 20).map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      localFilters.tags?.includes(tag)
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
                {availableTags.length > 20 && (
                  <span className="px-3 py-1 text-xs text-gray-500">
                    +{availableTags.length - 20} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Special Filters */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Special Filters</h3>
            <div className="space-y-3">
              {/* Favorites */}
              <label className="flex items-center">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={localFilters.isFavorite === true}
                    onChange={(e) => handleFilterChange('isFavorite', e.target.checked || undefined)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    localFilters.isFavorite === true
                      ? 'bg-yellow-500 border-yellow-500'
                      : 'border-gray-300'
                  }`}>
                    {localFilters.isFavorite === true && (
                      <Heart className="w-3 h-3 text-white fill-current" />
                    )}
                  </div>
                </div>
                <span className="ml-3 text-sm text-gray-700">Favorite entries only</span>
              </label>

              {/* Private */}
              <label className="flex items-center">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={localFilters.isPrivate === true}
                    onChange={(e) => handleFilterChange('isPrivate', e.target.checked || undefined)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    localFilters.isPrivate === true
                      ? 'bg-gray-600 border-gray-600'
                      : 'border-gray-300'
                  }`}>
                    {localFilters.isPrivate === true && (
                      <Lock className="w-3 h-3 text-white" />
                    )}
                  </div>
                </div>
                <span className="ml-3 text-sm text-gray-700">Private entries only</span>
              </label>
            </div>
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-2">Active filters:</div>
            <div className="flex flex-wrap gap-2">
              {localFilters.categoryId && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-700">
                  Category: {categories.find(c => c.id === localFilters.categoryId)?.name}
                </span>
              )}
              {localFilters.mood && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-purple-100 text-purple-700">
                  Mood: {localFilters.mood}
                </span>
              )}
              {localFilters.tags && localFilters.tags.length > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-green-100 text-green-700">
                  {localFilters.tags.length} tag{localFilters.tags.length !== 1 ? 's' : ''}
                </span>
              )}
              {localFilters.dateFrom && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-orange-100 text-orange-700">
                  From: {localFilters.dateFrom.toLocaleDateString()}
                </span>
              )}
              {localFilters.dateTo && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-orange-100 text-orange-700">
                  To: {localFilters.dateTo.toLocaleDateString()}
                </span>
              )}
              {localFilters.isFavorite && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-yellow-100 text-yellow-700">
                  Favorites only
                </span>
              )}
              {localFilters.isPrivate && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700">
                  Private only
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}