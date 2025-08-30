'use client';

import { useEffect, useRef, useCallback } from 'react';

interface TouchGestureHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinchIn?: (scale: number) => void;
  onPinchOut?: (scale: number) => void;
  onTouchStart?: (e: TouchEvent) => void;
  onTouchEnd?: (e: TouchEvent) => void;
  onLongPress?: (e: TouchEvent) => void;
  onDoubleTap?: (e: TouchEvent) => void;
}

interface TouchGestureOptions {
  swipeThreshold?: number;
  pinchThreshold?: number;
  longPressDelay?: number;
  doubleTapDelay?: number;
  preventScrollOnSwipe?: boolean;
}

export function useTouchGestures(
  handlers: TouchGestureHandlers,
  options: TouchGestureOptions = {}
) {
  const {
    swipeThreshold = 50,
    pinchThreshold = 0.1,
    longPressDelay = 500,
    doubleTapDelay = 300,
    preventScrollOnSwipe = true
  } = options;

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTouchRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const pinchStartDistanceRef = useRef<number | null>(null);
  const preventScrollRef = useRef<boolean>(false);

  const getDistance = useCallback((touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    const currentTime = Date.now();
    
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: currentTime
    };

    // Handle pinch gesture start
    if (e.touches.length === 2) {
      pinchStartDistanceRef.current = getDistance(e.touches[0], e.touches[1]);
      
      // Clear any long press timer when starting pinch
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    } else {
      // Single touch - set up long press detection
      longPressTimerRef.current = setTimeout(() => {
        if (handlers.onLongPress) {
          handlers.onLongPress(e);
        }
      }, longPressDelay);
    }

    // Call custom touch start handler
    if (handlers.onTouchStart) {
      handlers.onTouchStart(e);
    }
  }, [handlers, longPressDelay, getDistance]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    // Handle pinch gesture
    if (e.touches.length === 2 && pinchStartDistanceRef.current) {
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / pinchStartDistanceRef.current;
      
      if (Math.abs(scale - 1) > pinchThreshold) {
        if (scale > 1 && handlers.onPinchOut) {
          handlers.onPinchOut(scale);
        } else if (scale < 1 && handlers.onPinchIn) {
          handlers.onPinchIn(scale);
        }
      }
      
      // Prevent default pinch-to-zoom behavior
      e.preventDefault();
    }

    // Cancel long press if finger moves too much
    if (longPressTimerRef.current && touchStartRef.current) {
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
      const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
      
      if (deltaX > 10 || deltaY > 10) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }

    // Prevent scrolling during swipe if enabled
    if (preventScrollOnSwipe && preventScrollRef.current) {
      e.preventDefault();
    }
  }, [handlers, pinchThreshold, getDistance, preventScrollOnSwipe]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    const currentTime = Date.now();
    
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Reset pinch tracking
    if (e.touches.length === 0) {
      pinchStartDistanceRef.current = null;
      preventScrollRef.current = false;
    }

    // Handle swipe gestures (only for single touch)
    if (touchStartRef.current && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = currentTime - touchStartRef.current.time;
      
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      
      // Check if it's a swipe (fast enough and far enough)
      if (deltaTime < 300 && (absDeltaX > swipeThreshold || absDeltaY > swipeThreshold)) {
        preventScrollRef.current = true;
        
        // Determine swipe direction
        if (absDeltaX > absDeltaY) {
          // Horizontal swipe
          if (deltaX > 0 && handlers.onSwipeRight) {
            handlers.onSwipeRight();
          } else if (deltaX < 0 && handlers.onSwipeLeft) {
            handlers.onSwipeLeft();
          }
        } else {
          // Vertical swipe
          if (deltaY > 0 && handlers.onSwipeDown) {
            handlers.onSwipeDown();
          } else if (deltaY < 0 && handlers.onSwipeUp) {
            handlers.onSwipeUp();
          }
        }
      }
      
      // Handle double tap
      if (absDeltaX < 10 && absDeltaY < 10 && deltaTime < 200) {
        if (currentTime - lastTapTimeRef.current < doubleTapDelay && handlers.onDoubleTap) {
          handlers.onDoubleTap(e);
          lastTapTimeRef.current = 0; // Reset to prevent triple tap
        } else {
          lastTapTimeRef.current = currentTime;
        }
      }
    }

    touchStartRef.current = null;

    // Call custom touch end handler
    if (handlers.onTouchEnd) {
      handlers.onTouchEnd(e);
    }
  }, [handlers, swipeThreshold, doubleTapDelay]);

  const elementRef = useRef<HTMLElement | null>(null);

  const attachToElement = useCallback((element: HTMLElement | null) => {
    if (elementRef.current) {
      // Remove existing listeners
      elementRef.current.removeEventListener('touchstart', handleTouchStart, { passive: false });
      elementRef.current.removeEventListener('touchmove', handleTouchMove, { passive: false });
      elementRef.current.removeEventListener('touchend', handleTouchEnd);
    }

    elementRef.current = element;

    if (element) {
      // Add new listeners
      element.addEventListener('touchstart', handleTouchStart, { passive: false });
      element.addEventListener('touchmove', handleTouchMove, { passive: false });
      element.addEventListener('touchend', handleTouchEnd);
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (elementRef.current) {
        elementRef.current.removeEventListener('touchstart', handleTouchStart);
        elementRef.current.removeEventListener('touchmove', handleTouchMove);
        elementRef.current.removeEventListener('touchend', handleTouchEnd);
      }
      
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { attachToElement };
}

// Specialized hook for swipe navigation
export function useSwipeNavigation(
  onPrevious?: () => void,
  onNext?: () => void,
  options?: TouchGestureOptions
) {
  return useTouchGestures({
    onSwipeLeft: onNext,
    onSwipeRight: onPrevious
  }, options);
}

// Specialized hook for pinch-to-zoom
export function usePinchZoom(
  onZoomIn?: (scale: number) => void,
  onZoomOut?: (scale: number) => void,
  options?: TouchGestureOptions
) {
  return useTouchGestures({
    onPinchOut: onZoomIn,
    onPinchIn: onZoomOut
  }, options);
}