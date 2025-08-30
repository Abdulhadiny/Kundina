'use client';

import { useState } from 'react';
import { MoodType } from '@/lib/db';

interface MoodOption {
  value: MoodType;
  emoji: string;
  label: string;
  color: string;
}

const moodOptions: MoodOption[] = [
  { value: 'happy', emoji: '😊', label: 'Happy', color: 'bg-yellow-100 border-yellow-300 text-yellow-800' },
  { value: 'excited', emoji: '🤩', label: 'Excited', color: 'bg-orange-100 border-orange-300 text-orange-800' },
  { value: 'grateful', emoji: '🙏', label: 'Grateful', color: 'bg-green-100 border-green-300 text-green-800' },
  { value: 'neutral', emoji: '😐', label: 'Neutral', color: 'bg-gray-100 border-gray-300 text-gray-800' },
  { value: 'anxious', emoji: '😰', label: 'Anxious', color: 'bg-purple-100 border-purple-300 text-purple-800' },
  { value: 'sad', emoji: '😢', label: 'Sad', color: 'bg-blue-100 border-blue-300 text-blue-800' },
  { value: 'angry', emoji: '😠', label: 'Angry', color: 'bg-red-100 border-red-300 text-red-800' },
  { value: 'stressed', emoji: '😤', label: 'Stressed', color: 'bg-pink-100 border-pink-300 text-pink-800' },
];

interface MoodSelectorProps {
  value?: MoodType;
  onChange: (mood: MoodType | undefined) => void;
  label?: string;
  className?: string;
}

export default function MoodSelector({ 
  value, 
  onChange, 
  label = "How are you feeling?",
  className = ""
}: MoodSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedMood = moodOptions.find(mood => mood.value === value);

  const handleMoodSelect = (mood: MoodType) => {
    onChange(mood === value ? undefined : mood);
    setIsOpen(false);
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
            selectedMood 
              ? selectedMood.color 
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {selectedMood ? (
                <>
                  <span className="text-lg">{selectedMood.emoji}</span>
                  <span className="font-medium">{selectedMood.label}</span>
                </>
              ) : (
                <span className="text-gray-500">Select your mood...</span>
              )}
            </div>
            <svg
              className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
              {/* Clear Selection Option */}
              {value && (
                <button
                  type="button"
                  onClick={() => {
                    onChange(undefined);
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-gray-500 hover:bg-gray-50 transition-colors border-b border-gray-100"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">✖️</span>
                    <span>Clear selection</span>
                  </div>
                </button>
              )}

              {moodOptions.map((mood) => (
                <button
                  key={mood.value}
                  type="button"
                  onClick={() => handleMoodSelect(mood.value)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors flex items-center space-x-2 ${
                    value === mood.value ? 'bg-blue-50' : ''
                  }`}
                >
                  <span className="text-lg">{mood.emoji}</span>
                  <span className="font-medium">{mood.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}