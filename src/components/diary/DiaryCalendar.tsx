'use client';

import { useState, useMemo } from 'react';
import { DiaryEntry } from '@/lib/db';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, List } from 'lucide-react';

interface DiaryCalendarProps {
  entries: DiaryEntry[];
  onDateSelect: (date: Date) => void;
  onCreateEntry: (date: Date) => void;
  selectedDate?: Date;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  entries: DiaryEntry[];
  isToday: boolean;
  isSelected: boolean;
}

export default function DiaryCalendar({ 
  entries, 
  onDateSelect, 
  onCreateEntry, 
  selectedDate 
}: DiaryCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  const today = new Date();
  
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
    return mood ? moodMap[mood as keyof typeof moodMap] : null;
  };

  const getMonthData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of month and adjust for week start (Sunday = 0)
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: CalendarDay[] = [];
    const currentDay = new Date(startDate);
    
    // Generate 6 weeks (42 days) to fill the calendar grid
    for (let i = 0; i < 42; i++) {
      const dayEntries = entries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate.toDateString() === currentDay.toDateString();
      });
      
      days.push({
        date: new Date(currentDay),
        isCurrentMonth: currentDay.getMonth() === month,
        entries: dayEntries,
        isToday: currentDay.toDateString() === today.toDateString(),
        isSelected: selectedDate ? currentDay.toDateString() === selectedDate.toDateString() : false
      });
      
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return days;
  }, [currentDate, entries, selectedDate, today]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const handleDateClick = (day: CalendarDay) => {
    onDateSelect(day.date);
  };

  const handleCreateEntry = (day: CalendarDay, e: React.MouseEvent) => {
    e.stopPropagation();
    onCreateEntry(day.date);
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (viewMode === 'week') {
    // Week view implementation would go here
    // For now, we'll focus on month view
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {formatMonthYear(currentDate)}
          </h2>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Today
          </button>
          
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'month'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'week'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              disabled
              title="Week view coming soon"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-px mb-2">
          {weekDays.map(day => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium text-gray-500"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {getMonthData.map((day, index) => (
            <div
              key={index}
              onClick={() => handleDateClick(day)}
              className={`
                min-h-[80px] p-2 bg-white hover:bg-gray-50 cursor-pointer transition-colors
                ${!day.isCurrentMonth ? 'text-gray-400 bg-gray-50' : ''}
                ${day.isToday ? 'bg-blue-50 ring-2 ring-blue-200' : ''}
                ${day.isSelected ? 'bg-blue-100 ring-2 ring-blue-300' : ''}
              `}
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-medium ${
                  day.isToday ? 'text-blue-600' : 
                  day.isSelected ? 'text-blue-700' :
                  !day.isCurrentMonth ? 'text-gray-400' : 'text-gray-900'
                }`}>
                  {day.date.getDate()}
                </span>
                
                {/* Add entry button (show on hover or if no entries) */}
                {day.isCurrentMonth && (
                  <button
                    onClick={(e) => handleCreateEntry(day, e)}
                    className="opacity-0 group-hover:opacity-100 hover:opacity-100 p-0.5 text-gray-400 hover:text-blue-600 transition-all"
                    title="Add entry for this day"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Entry indicators */}
              <div className="space-y-1">
                {day.entries.slice(0, 2).map((entry, entryIndex) => (
                  <div
                    key={entryIndex}
                    className="flex items-center space-x-1 text-xs"
                  >
                    {entry.mood && (
                      <span className="text-sm">
                        {getMoodEmoji(entry.mood)}
                      </span>
                    )}
                    <div 
                      className={`flex-1 truncate px-1 py-0.5 rounded text-xs ${
                        entry.isFavorite 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : entry.isPrivate
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                      title={entry.title}
                    >
                      {entry.title}
                    </div>
                  </div>
                ))}
                
                {/* Show more indicator */}
                {day.entries.length > 2 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{day.entries.length - 2} more
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Legend */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-50 border-2 border-blue-200 rounded"></div>
            <span>Today</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-100 rounded"></div>
            <span>Favorite entries</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-100 rounded"></div>
            <span>Private entries</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>😊</span>
            <span>Mood indicators</span>
          </div>
        </div>
      </div>
    </div>
  );
}