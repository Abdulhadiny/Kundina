'use client';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  size: number;
}

interface CacheStats {
  totalItems: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  oldestItem: number;
  newestItem: number;
}

class IntelligentCache {
  private cache: Map<string, CacheItem<any>> = new Map();
  private maxSize: number;
  private maxItems: number;
  private hits: number = 0;
  private misses: number = 0;

  constructor(maxSize: number = 50 * 1024 * 1024, maxItems: number = 1000) {
    this.maxSize = maxSize; // 50MB default
    this.maxItems = maxItems;
    
    // Periodic cleanup
    setInterval(() => this.cleanup(), 5 * 60 * 1000); // Every 5 minutes
  }

  private calculateSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return JSON.stringify(data).length * 2; // Rough estimate
    }
  }

  private shouldEvict(): boolean {
    const stats = this.getStats();
    return stats.totalItems >= this.maxItems || stats.totalSize >= this.maxSize;
  }

  private evictLRU(): void {
    if (this.cache.size === 0) return;

    // Find least recently used item (lowest hits and oldest)
    let lruKey: string | null = null;
    let lruScore = Infinity;

    for (const [key, item] of this.cache) {
      const age = Date.now() - item.timestamp;
      const score = item.hits / (age / 1000 / 60); // hits per minute
      
      if (score < lruScore) {
        lruScore = score;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, item] of this.cache) {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  set<T>(key: string, data: T, ttl: number = 30 * 60 * 1000): void {
    const size = this.calculateSize(data);
    
    // Skip caching if item is too large
    if (size > this.maxSize * 0.1) {
      console.warn(`Item too large to cache: ${key} (${size} bytes)`);
      return;
    }

    // Evict items if necessary
    while (this.shouldEvict()) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0,
      size
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      this.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Update access statistics
    item.hits++;
    item.timestamp = Date.now(); // Update for LRU
    this.hits++;

    return item.data as T;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) return false;
    
    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats(): CacheStats {
    let totalSize = 0;
    let oldestItem = Date.now();
    let newestItem = 0;

    for (const item of this.cache.values()) {
      totalSize += item.size;
      oldestItem = Math.min(oldestItem, item.timestamp);
      newestItem = Math.max(newestItem, item.timestamp);
    }

    const totalRequests = this.hits + this.misses;

    return {
      totalItems: this.cache.size,
      totalSize,
      hitRate: totalRequests > 0 ? this.hits / totalRequests : 0,
      missRate: totalRequests > 0 ? this.misses / totalRequests : 0,
      oldestItem,
      newestItem
    };
  }

  // Advanced cache operations
  warmUp<T>(keys: string[], fetcher: (key: string) => Promise<T>): Promise<void[]> {
    const promises = keys.map(async (key) => {
      if (!this.has(key)) {
        try {
          const data = await fetcher(key);
          this.set(key, data);
        } catch (error) {
          console.warn(`Failed to warm up cache for key: ${key}`, error);
        }
      }
    });

    return Promise.all(promises);
  }

  async getOrSet<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttl: number = 30 * 60 * 1000
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    this.set(key, data, ttl);
    return data;
  }

  // Tag-based invalidation
  private tags: Map<string, Set<string>> = new Map();

  setWithTags<T>(key: string, data: T, tags: string[], ttl?: number): void {
    this.set(key, data, ttl);
    
    tags.forEach(tag => {
      if (!this.tags.has(tag)) {
        this.tags.set(tag, new Set());
      }
      this.tags.get(tag)!.add(key);
    });
  }

  invalidateByTag(tag: string): void {
    const keys = this.tags.get(tag);
    if (keys) {
      keys.forEach(key => this.cache.delete(key));
      this.tags.delete(tag);
    }
  }
}

// Specialized caches for different data types
export class DiaryCache {
  private cache = new IntelligentCache();
  
  // Entry caching
  setEntry(id: number, entry: any): void {
    this.cache.setWithTags(`entry:${id}`, entry, ['entries', `entry:${id}`], 60 * 60 * 1000); // 1 hour
  }

  getEntry(id: number): any | null {
    return this.cache.get(`entry:${id}`);
  }

  // Search results caching
  setSearchResults(query: string, results: any[]): void {
    this.cache.set(`search:${query}`, results, 10 * 60 * 1000); // 10 minutes
  }

  getSearchResults(query: string): any[] | null {
    return this.cache.get(`search:${query}`);
  }

  // Statistics caching
  setStats(type: string, stats: any): void {
    this.cache.setWithTags(`stats:${type}`, stats, ['stats'], 5 * 60 * 1000); // 5 minutes
  }

  getStats(type: string): any | null {
    return this.cache.get(`stats:${type}`);
  }

  // Image caching
  setImage(url: string, imageData: string): void {
    this.cache.set(`image:${url}`, imageData, 24 * 60 * 60 * 1000); // 24 hours
  }

  getImage(url: string): string | null {
    return this.cache.get(`image:${url}`);
  }

  // Category/tag caching
  setCategories(categories: any[]): void {
    this.cache.set('categories', categories, 60 * 60 * 1000); // 1 hour
  }

  getCategories(): any[] | null {
    return this.cache.get('categories');
  }

  setTags(tags: string[]): void {
    this.cache.set('tags', tags, 30 * 60 * 1000); // 30 minutes
  }

  getTags(): string[] | null {
    return this.cache.get('tags');
  }

  // Invalidation methods
  invalidateEntry(id: number): void {
    this.cache.invalidateByTag(`entry:${id}`);
    this.cache.invalidateByTag('entries');
    this.cache.invalidateByTag('stats');
  }

  invalidateAll(): void {
    this.cache.clear();
  }

  getStats() {
    return this.cache.getStats();
  }
}

// Storage cache for persistent caching across sessions
export class PersistentCache {
  private storageKey: string;
  private maxAge: number;

  constructor(storageKey: string = 'kundina_cache', maxAge: number = 24 * 60 * 60 * 1000) {
    this.storageKey = storageKey;
    this.maxAge = maxAge;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    try {
      const cache = this.getStorageCache();
      cache[key] = {
        data,
        timestamp: Date.now(),
        ttl: ttl || this.maxAge
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(cache));
    } catch (error) {
      console.warn('Failed to set persistent cache:', error);
    }
  }

  get<T>(key: string): T | null {
    try {
      const cache = this.getStorageCache();
      const item = cache[key];
      
      if (!item) return null;
      
      if (Date.now() - item.timestamp > item.ttl) {
        delete cache[key];
        localStorage.setItem(this.storageKey, JSON.stringify(cache));
        return null;
      }
      
      return item.data as T;
    } catch (error) {
      console.warn('Failed to get persistent cache:', error);
      return null;
    }
  }

  private getStorageCache(): Record<string, any> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.warn('Failed to clear persistent cache:', error);
    }
  }

  cleanup(): void {
    try {
      const cache = this.getStorageCache();
      const now = Date.now();
      let hasChanged = false;

      for (const [key, item] of Object.entries(cache)) {
        if (now - (item as any).timestamp > (item as any).ttl) {
          delete cache[key];
          hasChanged = true;
        }
      }

      if (hasChanged) {
        localStorage.setItem(this.storageKey, JSON.stringify(cache));
      }
    } catch (error) {
      console.warn('Failed to cleanup persistent cache:', error);
    }
  }
}

// Export singleton instances
export const diaryCache = new DiaryCache();
export const persistentCache = new PersistentCache();

// Initialize cleanup intervals
if (typeof window !== 'undefined') {
  // Cleanup persistent cache every hour
  setInterval(() => {
    persistentCache.cleanup();
  }, 60 * 60 * 1000);
}