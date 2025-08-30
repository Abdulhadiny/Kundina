'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDiaryStore } from '@/hooks/useDiaryStore';
import { DiaryEntry, MoodType, calculateWordCount, calculateReadingTime } from '@/lib/db';
import { Calendar, Save, X, FileText, MapPin } from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import MoodSelector from './MoodSelector';
import TagInput from './TagInput';
import TemplateSelector from './TemplateSelector';

const diarySchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  content: z.string().min(1, 'Content is required').max(10000, 'Content must be less than 10000 characters'),
  date: z.string().min(1, 'Date is required'),
  mood: z.string().optional(),
  weather: z.string().max(50, 'Weather must be less than 50 characters').optional(),
  location: z.string().max(100, 'Location must be less than 100 characters').optional(),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed'),
  isPrivate: z.boolean(),
  isFavorite: z.boolean(),
});

type DiaryFormData = z.infer<typeof diarySchema>;

interface DiaryFormProps {
  entry?: DiaryEntry;
  selectedDate?: Date;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DiaryForm({ entry, selectedDate, onClose, onSuccess }: DiaryFormProps) {
  const { addEntry, updateEntry, loading } = useDiaryStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<DiaryFormData>({
    resolver: zodResolver(diarySchema),
    defaultValues: {
      title: entry?.title || '',
      content: entry?.content || '',
      date: entry?.date 
        ? new Date(entry.date).toISOString().split('T')[0] 
        : selectedDate 
        ? selectedDate.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      mood: entry?.mood || '',
      weather: entry?.weather || '',
      location: entry?.location || '',
      tags: entry?.tags || [],
      isPrivate: entry?.isPrivate || false,
      isFavorite: entry?.isFavorite || false,
    },
  });

  const watchedContent = watch('content');
  const watchedTags = watch('tags');
  const watchedMood = watch('mood');

  const onSubmit = async (data: DiaryFormData) => {
    setIsSubmitting(true);
    try {
      const wordCount = calculateWordCount(data.content);
      const entryData = {
        title: data.title,
        content: data.content,
        date: new Date(data.date),
        mood: data.mood as MoodType || undefined,
        weather: data.weather || undefined,
        location: data.location || undefined,
        tags: data.tags,
        wordCount,
        readingTime: calculateReadingTime(wordCount),
        isPrivate: data.isPrivate,
        isFavorite: data.isFavorite,
        templateUsed: undefined, // Will be set when using templates
      };

      if (entry?.id) {
        await updateEntry(entry.id, entryData);
      } else {
        await addEntry(entryData);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoSave = async (content: string) => {
    if (!content.trim() || isSubmitting) return;
    
    setAutoSaveStatus('Saving...');
    try {
      // Here you would implement draft saving to localStorage or IndexedDB
      setTimeout(() => {
        setAutoSaveStatus('Saved');
        setTimeout(() => setAutoSaveStatus(''), 2000);
      }, 500);
    } catch (error) {
      setAutoSaveStatus('Error');
      setTimeout(() => setAutoSaveStatus(''), 2000);
    }
  };

  const handleTemplateSelect = (templateKey: string, content: string) => {
    setValue('content', content);
    setValue('title', `${new Date().toLocaleDateString()} - ${templateKey.charAt(0).toUpperCase() + templateKey.slice(1)} Entry`);
    setShowTemplateSelector(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-semibold text-gray-900">
                {entry ? 'Edit Entry' : 'New Diary Entry'}
              </h2>
              {autoSaveStatus && (
                <span className={`text-sm px-2 py-1 rounded-md ${
                  autoSaveStatus === 'Saved' ? 'bg-green-100 text-green-700' :
                  autoSaveStatus === 'Saving...' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {autoSaveStatus}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {!entry && (
                <button
                  type="button"
                  onClick={() => setShowTemplateSelector(true)}
                  className="flex items-center space-x-2 px-3 py-1.5 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>Use Template</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto max-h-[calc(95vh-140px)]">
            <div className="p-6 space-y-6">
              {/* Top row: Date, Mood, Privacy settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="date"
                      {...register('date')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <Calendar className="absolute right-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                  {errors.date && (
                    <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
                  )}
                </div>

                <MoodSelector
                  value={watchedMood as MoodType}
                  onChange={(mood) => setValue('mood', mood || '')}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Settings
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('isPrivate')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Private entry</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('isFavorite')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Mark as favorite</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  {...register('title')}
                  placeholder="What's on your mind today?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              {/* Weather and Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="weather" className="block text-sm font-medium text-gray-700 mb-2">
                    Weather (optional)
                  </label>
                  <input
                    type="text"
                    id="weather"
                    {...register('weather')}
                    placeholder="e.g., Sunny, Rainy, Cloudy"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    Location (optional)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="location"
                      {...register('location')}
                      placeholder="Where are you writing from?"
                      className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <MapPin className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Tags */}
              <TagInput
                value={watchedTags}
                onChange={(tags) => setValue('tags', tags)}
                label="Tags"
                maxTags={10}
              />

              {/* Content Editor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <RichTextEditor
                  value={watchedContent}
                  onChange={(content) => setValue('content', content)}
                  placeholder="Write your thoughts here... You can use Markdown formatting!"
                  autoSave={true}
                  onAutoSave={handleAutoSave}
                />
                {errors.content && (
                  <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="sticky bottom-0 bg-white border-t px-6 py-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {watchedContent && (
                    <span>
                      {calculateWordCount(watchedContent)} words • 
                      {calculateReadingTime(calculateWordCount(watchedContent))} min read
                    </span>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || loading}
                    className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSubmitting ? 'Saving...' : 'Save Entry'}</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <TemplateSelector
          onSelect={handleTemplateSelect}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}
    </>
  );
}