'use client';

import { useState } from 'react';
import { DiaryEntry } from '@/lib/db';
import { 
  Calendar, 
  Edit, 
  Trash2, 
  Eye,
  Star,
  Lock,
  MapPin,
  Cloud,
  Clock,
  Tag
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useDiaryStore } from '@/hooks/useDiaryStore';

interface DiaryListSimpleProps {
  entries: DiaryEntry[];
  onEditEntry: (entry: DiaryEntry) => void;
  onCreateEntry: () => void;
}

export default function DiaryListSimple({ 
  entries, 
  onEditEntry, 
  onCreateEntry 
}: DiaryListSimpleProps) {
  const { deleteEntry } = useDiaryStore();
  const [expandedEntry, setExpandedEntry] = useState<number | null>(null);

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

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      await deleteEntry(id);
    }
  };

  const formatShortDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No diary entries found</h3>
        <p className="text-gray-600 mb-6">Start documenting your thoughts and experiences.</p>
        <button
          onClick={onCreateEntry}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Write Your First Entry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                {/* Title and indicators */}
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

              {/* Action buttons */}
              <div className="flex space-x-1 ml-4">
                <button
                  onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id!)}
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Preview entry"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onEditEntry(entry)}
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
  );
}