'use client';

import { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, AlertCircle, Settings, Play, Pause } from 'lucide-react';
import { useVoiceToText } from '@/hooks/useSpeechRecognition';

interface VoiceInputProps {
  onTextUpdate: (text: string) => void;
  onInsertText: (text: string) => void;
  className?: string;
  placeholder?: string;
}

export default function VoiceInput({
  onTextUpdate,
  onInsertText,
  className = '',
  placeholder = 'Click microphone and start speaking...'
}: VoiceInputProps) {
  const {
    isSupported,
    isListening,
    processedText,
    interimText,
    error,
    startListening,
    stopListening,
    reset,
    browserSupportMessage
  } = useVoiceToText();

  const [showSettings, setShowSettings] = useState(false);
  const [autoInsert, setAutoInsert] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  // Auto-insert processed text when listening stops
  useEffect(() => {
    if (!isListening && processedText && autoInsert) {
      onInsertText(processedText);
      reset();
    }
  }, [isListening, processedText, autoInsert, onInsertText, reset]);

  // Update parent with current text
  useEffect(() => {
    onTextUpdate(processedText);
  }, [processedText, onTextUpdate]);

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      if (processedText) {
        reset();
      }
      startListening();
    }
  };

  const handleInsertText = () => {
    if (processedText) {
      onInsertText(processedText);
      reset();
    }
  };

  const handleClear = () => {
    reset();
  };

  if (!isSupported) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-3">
          <MicOff className="w-5 h-5 text-gray-400" />
          <div>
            <h4 className="font-medium text-gray-700">Voice Input Not Available</h4>
            <p className="text-sm text-gray-500">
              Speech recognition is not supported in this browser.
              <br />
              Try using Chrome, Edge, or Safari for voice input.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Volume2 className="w-5 h-5 text-blue-600" />
          <h3 className="font-medium text-gray-900">Voice Input</h3>
          {isListening && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-red-600">Recording</span>
            </div>
          )}
        </div>
        
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-1 text-gray-400 hover:text-gray-600 rounded"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={autoInsert}
                onChange={(e) => setAutoInsert(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Auto-insert text when recording stops
              </span>
            </label>
            
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={showPreview}
                onChange={(e) => setShowPreview(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Show live preview
              </span>
            </label>
          </div>
          
          <div className="mt-3 text-xs text-gray-500">
            Browser: {browserSupportMessage}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
          {error.includes('not allowed') && (
            <div className="mt-2 text-xs text-red-600">
              Please allow microphone access and try again.
            </div>
          )}
        </div>
      )}

      {/* Voice Input Area */}
      <div className="p-4">
        {/* Microphone Button */}
        <div className="flex justify-center mb-4">
          <button
            onClick={handleToggleListening}
            disabled={!!error}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
              isListening
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg scale-110'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:scale-105'
            } ${error ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isListening ? (
              <Pause className="w-8 h-8" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </button>
        </div>

        {/* Status Text */}
        <div className="text-center mb-4">
          {isListening ? (
            <p className="text-sm text-gray-600">
              Listening... speak clearly into your microphone
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              {processedText ? 'Click Insert to add text' : 'Click microphone to start recording'}
            </p>
          )}
        </div>

        {/* Text Preview */}
        {showPreview && (processedText || interimText) && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 min-h-[100px]">
            <div className="text-sm text-gray-700">
              {processedText && (
                <span className="font-medium">{processedText}</span>
              )}
              {interimText && (
                <span className="text-gray-500 italic">
                  {processedText ? ' ' : ''}{interimText}
                </span>
              )}
              {!processedText && !interimText && (
                <span className="text-gray-400">
                  {placeholder}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {processedText && (
          <div className="flex justify-center space-x-3 mt-4">
            <button
              onClick={handleInsertText}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>Insert Text</span>
            </button>
            
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="text-xs text-gray-600">
          <strong>Tips:</strong>
          <ul className="mt-1 space-y-1">
            <li>• Speak clearly and at normal pace</li>
            <li>• Pause briefly between sentences</li>
            <li>• Say &quot;period&quot;, &quot;comma&quot;, or &quot;question mark&quot; for punctuation</li>
            <li>• Use a quiet environment for best results</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Compact version for toolbar integration
export function VoiceInputButton({
  onTextInsert,
  className = ''
}: {
  onTextInsert: (text: string) => void;
  className?: string;
}) {
  const {
    isSupported,
    isListening,
    processedText,
    error,
    startListening,
    stopListening,
    reset
  } = useVoiceToText();

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!isListening && processedText) {
      onTextInsert(processedText);
      reset();
      setIsExpanded(false);
    }
  }, [isListening, processedText, onTextInsert, reset]);

  if (!isSupported) {
    return null;
  }

  const handleToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
      setIsExpanded(true);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleToggle}
        disabled={!!error}
        className={`p-1.5 rounded transition-colors ${
          isListening
            ? 'bg-red-100 text-red-600 hover:bg-red-200'
            : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
        } ${error ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={isListening ? 'Stop recording' : 'Start voice input'}
      >
        {isListening ? (
          <MicOff className="w-4 h-4" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </button>

      {/* Status Indicator */}
      {isListening && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
      )}

      {/* Error Tooltip */}
      {error && (
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-red-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
}