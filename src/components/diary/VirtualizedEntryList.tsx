'use client';

import { useState, useMemo } from 'react';
import { Search, Calendar, Tag, ChevronUp } from 'lucide-react';
import { useVirtualList } from '@/hooks/useVirtualScroll';
import { DiaryEntry } from '@/lib/db';
import { format } from 'date-fns';

interface VirtualizedEntryListProps {
  entries: DiaryEntry[];
  onEntryClick: (entry: DiaryEntry) => void;
  onEntrySelect?: (entry: DiaryEntry, selected: boolean) => void;
  selectedEntries?: Set<number>;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  containerHeight?: number;
  showSearch?: boolean;
  className?: string;
}

export default function VirtualizedEntryList({
  entries,
  onEntryClick,
  onEntrySelect,
  selectedEntries = new Set(),
  searchTerm = '',
  onSearchChange,
  containerHeight = 600,
  showSearch = true,
  className = ''
}: VirtualizedEntryListProps) {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  const handleSearchChange = (term: string) => {
    setLocalSearchTerm(term);
    if (onSearchChange) {
      onSearchChange(term);
    }
  };

  const {
    containerProps,
    wrapperProps,
    visibleItems,
    scrollToTop,
    isScrolling,
    filteredCount,
    totalCount,
    hasFilter
  } = useVirtualList(
    entries,
    containerHeight,
    localSearchTerm,
    ['title', 'content', 'tags'],
    {
      itemHeight: 120,
      overscan: 3,
      getItemHeight: (index, entry) => {
        // Dynamic height based on content
        const baseHeight = 120;
        const hasLongContent = entry.content && entry.content.length > 200;
        const hasManyTags = entry.tags && entry.tags.length > 3;
        
        let height = baseHeight;
        if (hasLongContent) height += 20;
        if (hasManyTags) height += 15;
        
        return height;
      }
    }
  );

  const formatDate = (date: Date) => {
    return format(new Date(date), 'MMM dd, yyyy');
  };

  const formatTime = (date: Date) => {
    return format(new Date(date), 'HH:mm');
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const getMoodEmoji = (mood?: string) => {
    const moodEmojis: Record<string, string> = {
      happy: '😊',
      sad: '😢',
      neutral: '😐',
      excited: '🤩',
      anxious: '😰',
      angry: '😠',
      grateful: '🙏',
      stressed: '😤'
    };
    return mood ? moodEmojis[mood] || '😐' : '';
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Search Bar */}
      {showSearch && (
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search entries by title, content, or tags..."
              value={localSearchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Search Results Info */}
          {hasFilter && (
            <div className="mt-2 text-sm text-gray-600">
              {filteredCount === 0 ? (
                <span>No entries found for "{localSearchTerm}"</span>
              ) : (
                <span>
                  {filteredCount} of {totalCount} entries match "{localSearchTerm}"
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Virtual Scrolled List */}
      <div className="flex-1 relative">
        <div {...containerProps}>
          <div {...wrapperProps}>
            {visibleItems.map(({ index, item, style }) => (
              <div key={item.id} style={style}>
                <EntryListItem
                  entry={item}
                  onClick={() => onEntryClick(item)}
                  onSelect={onEntrySelect ? (selected) => onEntrySelect(item, selected) : undefined}
                  isSelected={selectedEntries.has(item.id!)}
                  searchTerm={localSearchTerm}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Scroll to Top Button */}
        {containerProps.ref && (
          <ScrollToTopButton
            onClick={scrollToTop}
            visible={isScrolling}
          />
        )}

        {/* Loading State for Scrolling */}
        {isScrolling && (
          <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
            Scrolling...
          </div>
        )}
      </div>
    </div>
  );
}

// Individual entry item component
interface EntryListItemProps {
  entry: DiaryEntry;
  onClick: () => void;
  onSelect?: (selected: boolean) => void;
  isSelected: boolean;
  searchTerm: string;
}

function EntryListItem({ 
  entry, 
  onClick, 
  onSelect, 
  isSelected, 
  searchTerm 
}: EntryListItemProps) {
  const handleClick = () => {
    onClick();
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(!isSelected);
    }
  };

  const highlightText = (text: string, term: string) => {
    if (!term) return text;
    
    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div
      className={`m-2 p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
      onClick={handleClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            {onSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => {}}
                onClick={handleCheckboxClick}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
            )}
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {entry.title ? highlightText(entry.title, searchTerm) : 'Untitled Entry'}
            </h3>
            {entry.mood && (
              <span className="text-lg" title={entry.mood}>
                {getMoodEmoji(entry.mood)}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-500 ml-2">
          <Calendar className="w-4 h-4" />
          <span>{format(new Date(entry.date), 'MMM dd')}</span>
        </div>
      </div>

      {/* Content Preview */}
      <div className="text-gray-600 text-sm mb-3 line-clamp-2">
        {entry.content ? (
          highlightText(truncateContent(entry.content), searchTerm)
        ) : (
          <span className="italic">No content</span>
        )}
      </div>

      {/* Tags */}
      {entry.tags && entry.tags.length > 0 && (
        <div className="flex items-center space-x-1 mb-2">
          <Tag className="w-3 h-3 text-gray-400" />
          <div className="flex flex-wrap gap-1">
            {entry.tags.slice(0, 4).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
              >
                {highlightText(tag, searchTerm)}
              </span>
            ))}
            {entry.tags.length > 4 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">
                +{entry.tags.length - 4}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          <span>{entry.wordCount} words</span>
          <span>{entry.readingTime} min read</span>
          {entry.isPrivate && (
            <span className="bg-red-100 text-red-600 px-2 py-1 rounded">
              Private
            </span>
          )}
          {entry.isFavorite && (
            <span className="bg-yellow-100 text-yellow-600 px-2 py-1 rounded">
              ⭐ Favorite
            </span>
          )}
        </div>
        <span>{format(new Date(entry.updatedAt), 'HH:mm')}</span>
      </div>
    </div>
  );
}

// Scroll to top button component
function ScrollToTopButton({ 
  onClick, 
  visible 
}: { 
  onClick: () => void; 
  visible: boolean; 
}) {
  if (!visible) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 z-10"
      title="Scroll to top"
    >
      <ChevronUp className="w-5 h-5" />
    </button>
  );
}