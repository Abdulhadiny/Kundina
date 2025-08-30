'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  label?: string;
  placeholder?: string;
  maxTags?: number;
  suggestions?: string[];
  className?: string;
}

export default function TagInput({
  value = [],
  onChange,
  label = "Tags",
  placeholder = "Add tags...",
  maxTags = 10,
  suggestions = [],
  className = ""
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Common tags for suggestions
  const defaultSuggestions = [
    'work', 'personal', 'travel', 'family', 'friends', 'goals',
    'gratitude', 'reflection', 'challenges', 'achievements', 
    'health', 'learning', 'creative', 'memories', 'planning'
  ];

  const allSuggestions = [...new Set([...suggestions, ...defaultSuggestions])];
  const filteredSuggestions = allSuggestions
    .filter(tag => 
      !value.includes(tag) && 
      tag.toLowerCase().includes(inputValue.toLowerCase())
    )
    .slice(0, 8);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue.trim());
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  const addTag = (tag: string) => {
    if (!tag || value.includes(tag) || value.length >= maxTags) return;
    
    // Clean tag: remove special characters, convert to lowercase
    const cleanTag = tag.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim();
    if (!cleanTag) return;

    onChange([...value, cleanTag]);
    setInputValue('');
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleSuggestionClick = (suggestion: string) => {
    addTag(suggestion);
    inputRef.current?.focus();
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {maxTags && (
          <span className="text-gray-500 font-normal">
            {' '}({value.length}/{maxTags})
          </span>
        )}
      </label>

      <div className="relative">
        {/* Tag Input Container */}
        <div
          className={`min-h-[42px] px-3 py-2 border rounded-md shadow-sm cursor-text transition-colors ${
            isInputFocused
              ? 'border-blue-500 ring-1 ring-blue-500'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onClick={() => inputRef.current?.focus()}
        >
          <div className="flex flex-wrap items-center gap-1">
            {/* Existing Tags */}
            {value.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-md text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200"
              >
                {tag}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(index);
                  }}
                  className="ml-1 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {/* Input */}
            {value.length < maxTags && (
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => {
                  setTimeout(() => setIsInputFocused(false), 150);
                  if (inputValue.trim()) {
                    addTag(inputValue.trim());
                  }
                }}
                placeholder={value.length === 0 ? placeholder : ''}
                className="flex-1 min-w-[120px] border-none outline-none bg-transparent text-sm"
              />
            )}
          </div>
        </div>

        {/* Suggestions Dropdown */}
        {isInputFocused && filteredSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-32 overflow-auto">
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-3 h-3 text-gray-400" />
                <span>{suggestion}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Helper Text */}
      <div className="mt-1 text-xs text-gray-500">
        Press Enter or comma to add tags. Click tags to remove them.
      </div>
    </div>
  );
}