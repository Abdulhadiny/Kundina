'use client';

import { useEffect, useRef, useState } from 'react';
import { useSwipeNavigation, useTouchGestures } from '@/hooks/useTouchGestures';
import { ChevronLeft, ChevronRight, Hand, Smartphone } from 'lucide-react';

interface TouchNavigatorProps {
  children: React.ReactNode;
  onPrevious?: () => void;
  onNext?: () => void;
  onRefresh?: () => void;
  showInstructions?: boolean;
  className?: string;
}

export default function TouchNavigator({
  children,
  onPrevious,
  onNext,
  onRefresh,
  showInstructions = false,
  className = ''
}: TouchNavigatorProps) {
  const [showGestureHint, setShowGestureHint] = useState(false);
  const [lastGesture, setLastGesture] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { attachToElement } = useSwipeNavigation(
    onPrevious,
    onNext,
    { 
      swipeThreshold: 80,
      preventScrollOnSwipe: false // Allow vertical scrolling
    }
  );

  const { attachToElement: attachPullToRefresh } = useTouchGestures({
    onSwipeDown: () => {
      if (onRefresh && window.scrollY === 0) {
        setLastGesture('Pull to refresh');
        onRefresh();
        setTimeout(() => setLastGesture(null), 2000);
      }
    }
  }, {
    swipeThreshold: 100,
    preventScrollOnSwipe: false
  });

  useEffect(() => {
    if (containerRef.current) {
      attachToElement(containerRef.current);
      attachPullToRefresh(containerRef.current);
    }
  }, [attachToElement, attachPullToRefresh]);

  useEffect(() => {
    // Show gesture hint on first visit
    const hasSeenHint = localStorage.getItem('kundina_gesture_hint_seen');
    if (!hasSeenHint && showInstructions) {
      setShowGestureHint(true);
      setTimeout(() => {
        setShowGestureHint(false);
        localStorage.setItem('kundina_gesture_hint_seen', 'true');
      }, 4000);
    }
  }, [showInstructions]);

  const handleSwipeLeft = () => {
    if (onNext) {
      setLastGesture('Swipe left - Next');
      onNext();
      setTimeout(() => setLastGesture(null), 1500);
    }
  };

  const handleSwipeRight = () => {
    if (onPrevious) {
      setLastGesture('Swipe right - Previous');
      onPrevious();
      setTimeout(() => setLastGesture(null), 1500);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div
        ref={containerRef}
        className="touch-pan-y"
        style={{
          touchAction: 'pan-y', // Allow vertical scrolling but handle horizontal swipes
        }}
      >
        {children}
      </div>

      {/* Gesture Hint Overlay */}
      {showGestureHint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-auto text-center animate-fade-in">
            <Smartphone className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Touch Gestures Enabled
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Hand className="w-4 h-4" />
                <span>Swipe left/right to navigate</span>
              </div>
              {onRefresh && (
                <div className="flex items-center space-x-2">
                  <Hand className="w-4 h-4 rotate-180" />
                  <span>Pull down to refresh</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Hand className="w-4 h-4" />
                <span>Long press for options</span>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              This hint will only show once
            </div>
          </div>
        </div>
      )}

      {/* Gesture Feedback */}
      {lastGesture && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-full text-sm z-40 animate-fade-in">
          {lastGesture}
        </div>
      )}

      {/* Navigation Indicators */}
      <div className="absolute top-1/2 left-2 transform -translate-y-1/2 pointer-events-none">
        {onPrevious && (
          <div className="bg-black bg-opacity-20 rounded-full p-2 opacity-30">
            <ChevronLeft className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
      
      <div className="absolute top-1/2 right-2 transform -translate-y-1/2 pointer-events-none">
        {onNext && (
          <div className="bg-black bg-opacity-20 rounded-full p-2 opacity-30">
            <ChevronRight className="w-6 h-6 text-white" />
          </div>
        )}
      </div>

      {/* Instructions Panel */}
      {showInstructions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <h4 className="font-medium text-blue-800 mb-2 flex items-center space-x-2">
            <Smartphone className="w-4 h-4" />
            <span>Touch Navigation</span>
          </h4>
          <div className="text-sm text-blue-700 space-y-1">
            <div>← Swipe right to go back</div>
            <div>→ Swipe left to go forward</div>
            {onRefresh && <div>↓ Pull down to refresh</div>}
            <div>👆 Long press for context menu</div>
          </div>
        </div>
      )}
    </div>
  );
}

// Specialized component for calendar navigation
export function CalendarTouchNavigator({
  children,
  onPreviousMonth,
  onNextMonth,
  onToday,
  className = ''
}: {
  children: React.ReactNode;
  onPreviousMonth?: () => void;
  onNextMonth?: () => void;
  onToday?: () => void;
  className?: string;
}) {
  return (
    <TouchNavigator
      onPrevious={onPreviousMonth}
      onNext={onNextMonth}
      onRefresh={onToday}
      className={className}
    >
      {children}
    </TouchNavigator>
  );
}

// Specialized component for entry navigation
export function EntryTouchNavigator({
  children,
  onPreviousEntry,
  onNextEntry,
  onRefresh,
  showInstructions = false,
  className = ''
}: {
  children: React.ReactNode;
  onPreviousEntry?: () => void;
  onNextEntry?: () => void;
  onRefresh?: () => void;
  showInstructions?: boolean;
  className?: string;
}) {
  return (
    <TouchNavigator
      onPrevious={onPreviousEntry}
      onNext={onNextEntry}
      onRefresh={onRefresh}
      showInstructions={showInstructions}
      className={className}
    >
      {children}
    </TouchNavigator>
  );
}