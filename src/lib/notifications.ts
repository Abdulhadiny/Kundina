'use client';

export interface NotificationConfig {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  data?: Record<string, unknown>;
  actions?: NotificationAction[];
}

export interface NotificationSchedule {
  type: 'daily' | 'weekly' | 'streak' | 'reminder';
  time: string; // HH:MM format
  days?: number[]; // 0-6, where 0 is Sunday
  enabled: boolean;
}

class NotificationManager {
  private permission: NotificationPermission = 'default';
  private schedules: Map<string, NotificationSchedule> = new Map();
  private scheduledTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initializePermissions();
    this.loadSchedules();
    this.setupDefaultSchedules();
  }

  private async initializePermissions() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
      
      if (this.permission === 'default') {
        // Don't auto-request permission, let user trigger it
      }
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      
      if (permission === 'granted') {
        this.scheduleAllNotifications();
        return true;
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
    }
    
    return false;
  }

  async showNotification(config: NotificationConfig): Promise<void> {
    if (this.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    if ('serviceWorker' in navigator) {
      // Use service worker for better persistence
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(config.title, {
        body: config.body,
        icon: config.icon || '/icon-192x192.png',
        badge: config.badge || '/icon-192x192.png',
        tag: config.tag,
        requireInteraction: config.requireInteraction || false,
        silent: config.silent || false,
        data: config.data,
        actions: config.actions || [
          {
            action: 'open',
            title: 'Open App'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ]
      });
    } else {
      // Fallback to regular notification
      const notification = new Notification(config.title, {
        body: config.body,
        icon: config.icon || '/icon-192x192.png',
        tag: config.tag,
        requireInteraction: config.requireInteraction || false,
        silent: config.silent || false,
        data: config.data
      });

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }

  // Daily reminder notifications
  async showDailyReminder() {
    const today = new Date();
    const streak = await this.calculateStreak();
    
    const messages = [
      'Time to reflect on your day! 📝',
      'What made today special? Share your thoughts! ✨',
      'A few minutes of writing can make all the difference 💭',
      'Capture today\'s memories before they fade 📖',
      'Your daily dose of mindfulness awaits 🧘‍♀️'
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    await this.showNotification({
      title: 'Daily Journal Reminder',
      body: streak > 0 ? `${randomMessage} (${streak} day streak!)` : randomMessage,
      tag: 'daily-reminder',
      requireInteraction: true,
      data: { type: 'daily-reminder', streak }
    });
  }

  // Streak milestone notifications
  async showStreakMilestone(streak: number) {
    const milestones = [7, 14, 30, 60, 100, 365];
    if (!milestones.includes(streak)) return;

    const messages: Record<number, string> = {
      7: 'Amazing! One week of consistent journaling! 🎉',
      14: 'Two weeks strong! You\'re building a great habit! 💪',
      30: 'One month milestone! Your dedication is inspiring! ⭐',
      60: 'Two months of journaling! You\'re on fire! 🔥',
      100: '100 days! You\'re officially a journaling master! 🏆',
      365: 'One year of journaling! This is legendary! 👑'
    };

    await this.showNotification({
      title: `${streak} Day Streak!`,
      body: messages[streak] || `${streak} days of consistent journaling!`,
      tag: 'streak-milestone',
      requireInteraction: true,
      data: { type: 'streak-milestone', streak }
    });
  }

  // Schedule management
  setSchedule(id: string, schedule: NotificationSchedule) {
    this.schedules.set(id, schedule);
    this.saveSchedules();
    
    if (schedule.enabled && this.permission === 'granted') {
      this.scheduleNotification(id, schedule);
    } else {
      this.clearScheduledNotification(id);
    }
  }

  getSchedule(id: string): NotificationSchedule | undefined {
    return this.schedules.get(id);
  }

  getAllSchedules(): Record<string, NotificationSchedule> {
    return Object.fromEntries(this.schedules);
  }

  private scheduleNotification(id: string, schedule: NotificationSchedule) {
    this.clearScheduledNotification(id);
    
    const now = new Date();
    const [hours, minutes] = schedule.time.split(':').map(Number);
    
    const scheduleNext = () => {
      const nextNotification = new Date();
      nextNotification.setHours(hours, minutes, 0, 0);
      
      // If time has passed today, schedule for tomorrow
      if (nextNotification <= now) {
        nextNotification.setDate(nextNotification.getDate() + 1);
      }
      
      // For weekly schedules, find next matching day
      if (schedule.type === 'weekly' && schedule.days) {
        while (!schedule.days.includes(nextNotification.getDay())) {
          nextNotification.setDate(nextNotification.getDate() + 1);
        }
      }
      
      const delay = nextNotification.getTime() - now.getTime();
      
      const timeoutId = setTimeout(() => {
        this.triggerScheduledNotification(id, schedule);
        scheduleNext(); // Schedule next occurrence
      }, delay);
      
      this.scheduledTimeouts.set(id, timeoutId);
    };
    
    scheduleNext();
  }

  private async triggerScheduledNotification(id: string, schedule: NotificationSchedule) {
    switch (schedule.type) {
      case 'daily':
        await this.showDailyReminder();
        break;
      case 'streak':
        const streak = await this.calculateStreak();
        if (streak > 0 && [7, 14, 30, 60, 100, 365].includes(streak)) {
          await this.showStreakMilestone(streak);
        }
        break;
      // Add other notification types as needed
    }
  }

  private clearScheduledNotification(id: string) {
    const timeoutId = this.scheduledTimeouts.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.scheduledTimeouts.delete(id);
    }
  }

  private scheduleAllNotifications() {
    this.schedules.forEach((schedule, id) => {
      if (schedule.enabled) {
        this.scheduleNotification(id, schedule);
      }
    });
  }

  async calculateStreak(): Promise<number> {
    try {
      const { db } = await import('./db');
      const entries = await db.diaryEntries.orderBy('date').reverse().toArray();
      
      if (entries.length === 0) return 0;
      
      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Check if there's an entry today or yesterday (to account for late night entries)
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let currentDate = new Date(today);
      let hasEntryToday = false;
      
      // Check today first
      const todaysEntries = entries.filter(entry => {
        const entryDate = new Date(entry.date);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === today.getTime();
      });
      
      if (todaysEntries.length > 0) {
        hasEntryToday = true;
        streak = 1;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        // If no entry today, start checking from yesterday
        currentDate = new Date(yesterday);
      }
      
      // Count consecutive days backwards
      for (const entry of entries) {
        const entryDate = new Date(entry.date);
        entryDate.setHours(0, 0, 0, 0);
        
        if (entryDate.getTime() === currentDate.getTime()) {
          if (!hasEntryToday && entryDate.getTime() === yesterday.getTime()) {
            // First entry found is yesterday, start streak
            streak = 1;
            hasEntryToday = true;
          } else if (hasEntryToday) {
            streak++;
          }
          currentDate.setDate(currentDate.getDate() - 1);
        } else if (entryDate.getTime() < currentDate.getTime()) {
          // Gap found, streak ends
          break;
        }
      }
      
      return streak;
    } catch (error) {
      console.error('Failed to calculate streak:', error);
      return 0;
    }
  }

  private setupDefaultSchedules() {
    // Daily reminder at 8 PM
    if (!this.schedules.has('daily-reminder')) {
      this.setSchedule('daily-reminder', {
        type: 'daily',
        time: '20:00',
        enabled: false // User needs to enable manually
      });
    }

    // Weekly reflection on Sunday at 7 PM
    if (!this.schedules.has('weekly-reflection')) {
      this.setSchedule('weekly-reflection', {
        type: 'weekly',
        time: '19:00',
        days: [0], // Sunday
        enabled: false
      });
    }
  }

  private loadSchedules() {
    try {
      const stored = localStorage.getItem('kundina_notification_schedules');
      if (stored) {
        const schedules = JSON.parse(stored);
        this.schedules = new Map(Object.entries(schedules));
      }
    } catch (error) {
      console.error('Failed to load notification schedules:', error);
    }
  }

  private saveSchedules() {
    try {
      const schedules = Object.fromEntries(this.schedules);
      localStorage.setItem('kundina_notification_schedules', JSON.stringify(schedules));
    } catch (error) {
      console.error('Failed to save notification schedules:', error);
    }
  }

  // Test notification
  async sendTestNotification() {
    await this.showNotification({
      title: 'Kundina Test Notification',
      body: 'Notifications are working correctly! 🎉',
      tag: 'test-notification'
    });
  }

  // Cleanup
  destroy() {
    this.scheduledTimeouts.forEach(timeout => clearTimeout(timeout));
    this.scheduledTimeouts.clear();
  }
}

// Singleton instance
export const notificationManager = new NotificationManager();

// Service Worker Integration
if ('serviceWorker' in navigator) {
  // Handle notification clicks
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data.type === 'notification-click') {
      window.focus();
      
      const { action, data } = event.data;
      
      switch (action) {
        case 'open':
          window.location.href = '/diary';
          break;
        case 'create-entry':
          window.location.href = '/diary/new';
          break;
        case 'dismiss':
          // Just close the notification
          break;
      }
    }
  });

  // Add notification event listeners to service worker when it's ready
  navigator.serviceWorker.ready.then(registration => {
    // Add event listeners for notification interactions
    registration.addEventListener('notificationclick', (event) => {
      event.notification.close();
      
      const action = event.action;
      const data = event.notification.data;
      
      event.waitUntil(
        clients.matchAll().then(clientList => {
          // Check if app is already open
          for (const client of clientList) {
            if (client.url === '/' && 'focus' in client) {
              client.focus();
              client.postMessage({ 
                type: 'notification-click', 
                action: action || 'open', 
                data 
              });
              return;
            }
          }
          
          // If app is not open, open it
          if (clients.openWindow) {
            return clients.openWindow('/diary');
          }
        })
      );
    });
  }).catch(error => {
    console.error('Service worker not ready:', error);
  });
}