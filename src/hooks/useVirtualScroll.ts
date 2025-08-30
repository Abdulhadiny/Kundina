'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

interface VirtualScrollItem {
  id: string | number;
  height?: number;
}

interface UseVirtualScrollOptions {
  itemHeight?: number;
  overscan?: number;
  scrollingDelay?: number;
  getItemHeight?: (index: number, item: any) => number;
}

interface UseVirtualScrollReturn {
  containerProps: {
    style: React.CSSProperties;
    onScroll: React.UIEventHandler<HTMLDivElement>;
    ref: React.RefCallback<HTMLDivElement>;
  };
  wrapperProps: {
    style: React.CSSProperties;
  };
  visibleItems: Array<{
    index: number;
    item: any;
    style: React.CSSProperties;
  }>;
  scrollToIndex: (index: number, align?: 'start' | 'center' | 'end' | 'auto') => void;
  scrollToTop: () => void;
  totalHeight: number;
  isScrolling: boolean;
}

export function useVirtualScroll<T extends VirtualScrollItem>(
  items: T[],
  containerHeight: number,
  options: UseVirtualScrollOptions = {}
): UseVirtualScrollReturn {
  const {
    itemHeight = 60,
    overscan = 5,
    scrollingDelay = 150,
    getItemHeight
  } = options;

  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [scrollingTimeout, setScrollingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Calculate item heights
  const itemHeights = useMemo(() => {
    return items.map((item, index) => {
      if (getItemHeight) {
        return getItemHeight(index, item);
      }
      return item.height || itemHeight;
    });
  }, [items, itemHeight, getItemHeight]);

  // Calculate item offsets for efficient positioning
  const itemOffsets = useMemo(() => {
    const offsets: number[] = [0];
    for (let i = 0; i < itemHeights.length; i++) {
      offsets.push(offsets[i] + itemHeights[i]);
    }
    return offsets;
  }, [itemHeights]);

  const totalHeight = itemOffsets[itemOffsets.length - 1] || 0;

  // Find visible range
  const visibleRange = useMemo(() => {
    const start = Math.max(0, 
      itemOffsets.findIndex(offset => offset + itemHeights[itemOffsets.indexOf(offset)] > scrollTop) - 1
    );
    
    const end = Math.min(
      items.length - 1,
      itemOffsets.findIndex(offset => offset > scrollTop + containerHeight) - 1
    );

    return {
      start: Math.max(0, start - overscan),
      end: Math.min(items.length - 1, end === -1 ? items.length - 1 : end + overscan)
    };
  }, [scrollTop, containerHeight, itemOffsets, itemHeights, items.length, overscan]);

  // Generate visible items with positioning
  const visibleItems = useMemo(() => {
    const result = [];
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      if (i >= 0 && i < items.length) {
        result.push({
          index: i,
          item: items[i],
          style: {
            position: 'absolute' as const,
            top: itemOffsets[i],
            left: 0,
            right: 0,
            height: itemHeights[i],
            zIndex: 1
          }
        });
      }
    }
    return result;
  }, [visibleRange, items, itemOffsets, itemHeights]);

  // Handle scroll events
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = event.currentTarget.scrollTop;
    setScrollTop(scrollTop);
    setIsScrolling(true);

    // Clear existing timeout
    if (scrollingTimeout) {
      clearTimeout(scrollingTimeout);
    }

    // Set new timeout to detect end of scrolling
    const timeout = setTimeout(() => {
      setIsScrolling(false);
    }, scrollingDelay);

    setScrollingTimeout(timeout);
  }, [scrollingDelay, scrollingTimeout]);

  // Scroll to specific index
  const scrollToIndex = useCallback((
    index: number, 
    align: 'start' | 'center' | 'end' | 'auto' = 'auto'
  ) => {
    if (!container || index < 0 || index >= items.length) return;

    const itemOffset = itemOffsets[index];
    const itemHeight = itemHeights[index];
    
    let scrollTop: number;

    switch (align) {
      case 'start':
        scrollTop = itemOffset;
        break;
      case 'end':
        scrollTop = itemOffset + itemHeight - containerHeight;
        break;
      case 'center':
        scrollTop = itemOffset + itemHeight / 2 - containerHeight / 2;
        break;
      case 'auto':
      default:
        const currentScrollTop = container.scrollTop;
        const itemStart = itemOffset;
        const itemEnd = itemOffset + itemHeight;
        const viewStart = currentScrollTop;
        const viewEnd = currentScrollTop + containerHeight;

        if (itemStart < viewStart) {
          scrollTop = itemStart;
        } else if (itemEnd > viewEnd) {
          scrollTop = itemEnd - containerHeight;
        } else {
          return; // Already visible
        }
    }

    container.scrollTo({
      top: Math.max(0, Math.min(scrollTop, totalHeight - containerHeight)),
      behavior: 'smooth'
    });
  }, [container, items.length, itemOffsets, itemHeights, containerHeight, totalHeight]);

  // Scroll to top
  const scrollToTop = useCallback(() => {
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [container]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollingTimeout) {
        clearTimeout(scrollingTimeout);
      }
    };
  }, [scrollingTimeout]);

  return {
    containerProps: {
      style: {
        height: containerHeight,
        overflow: 'auto',
        position: 'relative'
      },
      onScroll: handleScroll,
      ref: setContainer
    },
    wrapperProps: {
      style: {
        height: totalHeight,
        position: 'relative'
      }
    },
    visibleItems,
    scrollToIndex,
    scrollToTop,
    totalHeight,
    isScrolling
  };
}

// Specialized hook for list virtualization with search
export function useVirtualList<T extends VirtualScrollItem>(
  items: T[],
  containerHeight: number,
  searchTerm: string = '',
  searchFields: (keyof T)[] = [],
  options: UseVirtualScrollOptions = {}
) {
  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!searchTerm || searchFields.length === 0) {
      return items;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    return items.filter(item => 
      searchFields.some(field => {
        const value = item[field];
        return value && String(value).toLowerCase().includes(lowerSearchTerm);
      })
    );
  }, [items, searchTerm, searchFields]);

  const virtualScroll = useVirtualScroll(filteredItems, containerHeight, options);

  return {
    ...virtualScroll,
    filteredCount: filteredItems.length,
    totalCount: items.length,
    hasFilter: searchTerm.length > 0
  };
}

// Hook for infinite scroll with virtual scrolling
export function useInfiniteVirtualScroll<T extends VirtualScrollItem>(
  items: T[],
  containerHeight: number,
  loadMore: () => Promise<void>,
  hasNextPage: boolean,
  options: UseVirtualScrollOptions = {}
) {
  const [isLoading, setIsLoading] = useState(false);
  const virtualScroll = useVirtualScroll(items, containerHeight, options);

  // Load more items when scrolling near the bottom
  useEffect(() => {
    const { scrollTop, scrollHeight, clientHeight } = 
      virtualScroll.containerProps.ref as any || {};
    
    if (!scrollTop || !scrollHeight || !clientHeight) return;

    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
    
    if (scrollPercentage > 0.8 && hasNextPage && !isLoading) {
      setIsLoading(true);
      loadMore().finally(() => setIsLoading(false));
    }
  }, [virtualScroll.containerProps, hasNextPage, isLoading, loadMore]);

  return {
    ...virtualScroll,
    isLoading,
    hasNextPage
  };
}