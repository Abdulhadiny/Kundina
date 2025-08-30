'use client';

import { db, DiaryEntry, getDeviceId } from './db';

export interface SyncQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  entryId?: number;
  data?: Partial<DiaryEntry>;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
}

class BackgroundSyncManager {
  private syncQueue: SyncQueueItem[] = [];
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initializeEventListeners();
    this.loadSyncQueue();
    this.startPeriodicSync();
  }

  private initializeEventListeners() {
    // Online/Offline detection
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Background sync registration (if supported)
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then(registration => {
        return registration.sync.register('diary-sync');
      }).catch(err => {
        console.warn('Background sync not supported:', err);
      });
    }

    // Visibility change detection for immediate sync
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.processQueue();
      }
    });
  }

  private async loadSyncQueue() {
    try {
      const stored = localStorage.getItem('kundina_sync_queue');
      if (stored) {
        this.syncQueue = JSON.parse(stored).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
      this.syncQueue = [];
    }
  }

  private saveSyncQueue() {
    try {
      localStorage.setItem('kundina_sync_queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  private startPeriodicSync() {
    // Sync every 30 seconds when online
    setInterval(() => {
      if (this.isOnline && !this.syncInProgress && this.syncQueue.length > 0) {
        this.processQueue();
      }
    }, 30000);

    // Check for pending sync items every 5 minutes
    setInterval(() => {
      this.queuePendingEntries();
    }, 300000);
  }

  async addToQueue(
    type: SyncQueueItem['type'],
    entryId?: number,
    data?: Partial<DiaryEntry>
  ) {
    const queueItem: SyncQueueItem = {
      id: `${type}_${entryId || Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      entryId,
      data,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: 3
    };

    this.syncQueue.push(queueItem);
    this.saveSyncQueue();

    // Process immediately if online
    if (this.isOnline) {
      this.processQueue();
    }

    return queueItem.id;
  }

  async processQueue() {
    if (this.syncInProgress || !this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    const failedItems: SyncQueueItem[] = [];

    try {
      for (const item of this.syncQueue) {
        try {
          await this.syncItem(item);
          
          // Clear any retry timeout for this item
          if (this.retryTimeouts.has(item.id)) {
            clearTimeout(this.retryTimeouts.get(item.id)!);
            this.retryTimeouts.delete(item.id);
          }
        } catch (error) {
          console.error('Sync failed for item:', item.id, error);
          
          if (item.retryCount < item.maxRetries) {
            item.retryCount++;
            failedItems.push(item);
            this.scheduleRetry(item);
          } else {
            console.warn('Max retries exceeded for sync item:', item.id);
            // Optionally notify user about persistent sync failures
          }
        }
      }

      // Update queue with only failed items
      this.syncQueue = failedItems;
      this.saveSyncQueue();
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncItem(item: SyncQueueItem) {
    switch (item.type) {
      case 'create':
      case 'update':
        if (item.entryId && item.data) {
          await this.syncEntry(item.entryId, item.data);
        }
        break;
      case 'delete':
        if (item.entryId) {
          await this.syncDelete(item.entryId);
        }
        break;
    }
  }

  private async syncEntry(entryId: number, data: Partial<DiaryEntry>) {
    // Simulate API call - replace with actual sync logic
    const entry = await db.diaryEntries.get(entryId);
    if (!entry) return;

    // Update sync status and timestamp
    await db.diaryEntries.update(entryId, {
      syncStatus: 'synced',
      lastSyncedAt: new Date(),
      updatedAt: new Date()
    });

    // Trigger sync event for UI updates
    window.dispatchEvent(new CustomEvent('diaryEntrySynced', { 
      detail: { entryId, entry } 
    }));
  }

  private async syncDelete(entryId: number) {
    // Simulate API call for delete
    // In real implementation, this would call your backend API
    
    // Remove from local database if sync successful
    // await db.diaryEntries.delete(entryId);
    
    window.dispatchEvent(new CustomEvent('diaryEntryDeleted', { 
      detail: { entryId } 
    }));
  }

  private scheduleRetry(item: SyncQueueItem) {
    // Exponential backoff: 2^retryCount * 1000ms
    const delay = Math.pow(2, item.retryCount) * 1000;
    
    const timeoutId = setTimeout(() => {
      if (this.isOnline) {
        this.processQueue();
      }
    }, delay);

    this.retryTimeouts.set(item.id, timeoutId);
  }

  async queuePendingEntries() {
    try {
      const pendingEntries = await db.diaryEntries
        .where('syncStatus')
        .equals('pending')
        .toArray();

      for (const entry of pendingEntries) {
        // Check if already in queue
        const alreadyQueued = this.syncQueue.some(
          item => item.entryId === entry.id && item.type === 'update'
        );

        if (!alreadyQueued) {
          await this.addToQueue('update', entry.id, entry);
        }
      }
    } catch (error) {
      console.error('Failed to queue pending entries:', error);
    }
  }

  // Manual sync trigger
  async forcSync(): Promise<boolean> {
    if (!this.isOnline) {
      return false;
    }

    await this.queuePendingEntries();
    await this.processQueue();
    return true;
  }

  // Get sync status for UI
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      queueLength: this.syncQueue.length,
      syncInProgress: this.syncInProgress,
      lastAttempt: this.syncQueue.length > 0 
        ? Math.max(...this.syncQueue.map(item => item.timestamp.getTime()))
        : null
    };
  }

  // Clear sync queue (for testing/debugging)
  clearQueue() {
    this.syncQueue = [];
    this.saveSyncQueue();
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryTimeouts.clear();
  }
}

// Singleton instance
export const backgroundSync = new BackgroundSyncManager();

// Helper hook for React components
import { useState, useEffect } from 'react';

export function useSyncStatus() {
  const [status, setStatus] = useState(backgroundSync.getSyncStatus());

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(backgroundSync.getSyncStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return status;
}