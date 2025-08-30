'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface SpeechRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
  maxAlternatives?: number;
}

interface UseSpeechRecognitionReturn {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  browserSupportMessage: string;
}

// Extend the Window interface to include webkitSpeechRecognition
declare global {
  interface Window {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof SpeechRecognition;
  }
}

export function useSpeechRecognition(
  options: SpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const {
    continuous = false,
    interimResults = true,
    language = 'en-US',
    maxAlternatives = 1
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');

  // Check if speech recognition is supported
  const isSupported = typeof window !== 'undefined' && 
    (window.SpeechRecognition || window.webkitSpeechRecognition) !== undefined;

  const browserSupportMessage = (() => {
    if (typeof window === 'undefined') return 'Not available on server';
    if (window.SpeechRecognition) return 'Native support';
    if (window.webkitSpeechRecognition) return 'WebKit support';
    return 'Not supported in this browser';
  })();

  // Initialize speech recognition
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) return;

    const recognition = new SpeechRecognitionClass();
    recognitionRef.current = recognition;

    // Configure recognition
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language;
    recognition.maxAlternatives = maxAlternatives;

    // Event handlers
    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      setError(getErrorMessage(event.error));
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = finalTranscriptRef.current;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else if (interimResults) {
          interimTranscript += result[0].transcript;
        }
      }

      finalTranscriptRef.current = finalTranscript;
      setTranscript(finalTranscript);
      setInterimTranscript(interimTranscript);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [isSupported, continuous, interimResults, language, maxAlternatives]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;

    try {
      setError(null);
      recognitionRef.current.start();
    } catch (err) {
      setError('Failed to start speech recognition');
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;

    recognitionRef.current.stop();
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    finalTranscriptRef.current = '';
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript,
    browserSupportMessage
  };
}

// Error message mapping
function getErrorMessage(error: string): string {
  switch (error) {
    case 'network':
      return 'Network error occurred';
    case 'not-allowed':
      return 'Microphone access not allowed';
    case 'service-not-allowed':
      return 'Speech recognition service not allowed';
    case 'bad-grammar':
      return 'Grammar error';
    case 'language-not-supported':
      return 'Language not supported';
    case 'no-speech':
      return 'No speech detected';
    case 'audio-capture':
      return 'Audio capture failed';
    default:
      return `Speech recognition error: ${error}`;
  }
}

// Helper hook for voice-to-text with auto-punctuation
export function useVoiceToText(onTextUpdate?: (text: string) => void) {
  const {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript,
    browserSupportMessage
  } = useSpeechRecognition({
    continuous: true,
    interimResults: true,
    language: navigator.language || 'en-US'
  });

  const [processedText, setProcessedText] = useState('');

  // Auto-punctuation and capitalization
  const processText = useCallback((text: string): string => {
    if (!text) return text;

    let processed = text;
    
    // Capitalize first letter
    processed = processed.charAt(0).toUpperCase() + processed.slice(1);
    
    // Add period if text ends without punctuation
    const lastChar = processed.trim().slice(-1);
    if (lastChar && !'.,!?;:'.includes(lastChar)) {
      processed += '.';
    }
    
    // Basic sentence capitalization
    processed = processed.replace(/([.!?])\s+([a-z])/g, (match, p1, p2) => {
      return p1 + ' ' + p2.toUpperCase();
    });

    return processed;
  }, []);

  // Update processed text when transcript changes
  useEffect(() => {
    if (transcript) {
      const processed = processText(transcript);
      setProcessedText(processed);
      
      if (onTextUpdate) {
        onTextUpdate(processed);
      }
    }
  }, [transcript, processText, onTextUpdate]);

  const reset = useCallback(() => {
    resetTranscript();
    setProcessedText('');
  }, [resetTranscript]);

  return {
    isSupported,
    isListening,
    rawTranscript: transcript,
    processedText,
    interimText: interimTranscript,
    error,
    startListening,
    stopListening,
    reset,
    browserSupportMessage
  };
}