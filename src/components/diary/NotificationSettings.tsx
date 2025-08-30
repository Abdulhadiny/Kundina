'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, Clock, Calendar, Award, Settings } from 'lucide-react';
import { notificationManager, NotificationSchedule } from '@/lib/notifications';

export default function NotificationSettings() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [schedules, setSchedules] = useState<Record<string, NotificationSchedule>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setPermission(Notification.permission);
    setSchedules(notificationManager.getAllSchedules());
  }, []);

  const handleRequestPermission = async () => {
    setIsLoading(true);
    const granted = await notificationManager.requestPermission();
    setPermission(granted ? 'granted' : 'denied');
    setIsLoading(false);
  };

  const handleScheduleChange = (id: string, updates: Partial<NotificationSchedule>) => {
    const currentSchedule = schedules[id];
    if (!currentSchedule) return;

    const updatedSchedule = { ...currentSchedule, ...updates };
    notificationManager.setSchedule(id, updatedSchedule);
    
    setSchedules(prev => ({
      ...prev,
      [id]: updatedSchedule
    }));
  };

  const handleTestNotification = async () => {
    await notificationManager.sendTestNotification();
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour12 = parseInt(hours) % 12 || 12;
    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getDayNames = (days?: number[]) => {
    if (!days) return 'Daily';
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map(day => dayNames[day]).join(', ');
  };

  if (permission === 'denied') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <BellOff className="w-6 h-6 text-red-600" />
          <h3 className="text-lg font-semibold text-red-800">
            Notifications Blocked
          </h3>
        </div>
        <p className="text-red-700 mb-4">
          Notifications have been blocked in your browser. To enable reminders and streak notifications, 
          please allow notifications in your browser settings.
        </p>
        <div className="text-sm text-red-600 bg-red-100 p-3 rounded">
          <strong>How to enable:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Click the lock icon in your address bar</li>
            <li>Set notifications to &quot;Allow&quot;</li>
            <li>Refresh this page</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Permission Request */}
      {permission !== 'granted' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Bell className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-800">
              Enable Notifications
            </h3>
          </div>
          <p className="text-blue-700 mb-4">
            Get gentle reminders to write in your diary and celebrate your writing streaks.
          </p>
          <button
            onClick={handleRequestPermission}
            disabled={isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Requesting...' : 'Allow Notifications'}
          </button>
        </div>
      )}

      {/* Notification Schedules */}
      {permission === 'granted' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Notification Settings</span>
            </h3>
            <button
              onClick={handleTestNotification}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Send Test
            </button>
          </div>

          {/* Daily Reminder */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-orange-500" />
                <div>
                  <h4 className="font-medium text-gray-900">Daily Reminder</h4>
                  <p className="text-sm text-gray-600">
                    Get reminded to write in your diary
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={schedules['daily-reminder']?.enabled || false}
                  onChange={(e) => handleScheduleChange('daily-reminder', { enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            {schedules['daily-reminder']?.enabled && (
              <div className="flex items-center space-x-3">
                <label className="text-sm text-gray-700">Time:</label>
                <input
                  type="time"
                  value={schedules['daily-reminder']?.time || '20:00'}
                  onChange={(e) => handleScheduleChange('daily-reminder', { time: e.target.value })}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                />
                <span className="text-sm text-gray-600">
                  {formatTime(schedules['daily-reminder']?.time || '20:00')}
                </span>
              </div>
            )}
          </div>

          {/* Weekly Reflection */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-purple-500" />
                <div>
                  <h4 className="font-medium text-gray-900">Weekly Reflection</h4>
                  <p className="text-sm text-gray-600">
                    Weekly reminder for deeper reflection
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={schedules['weekly-reflection']?.enabled || false}
                  onChange={(e) => handleScheduleChange('weekly-reflection', { enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            {schedules['weekly-reflection']?.enabled && (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <label className="text-sm text-gray-700">Time:</label>
                  <input
                    type="time"
                    value={schedules['weekly-reflection']?.time || '19:00'}
                    onChange={(e) => handleScheduleChange('weekly-reflection', { time: e.target.value })}
                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                  />
                  <span className="text-sm text-gray-600">
                    {formatTime(schedules['weekly-reflection']?.time || '19:00')}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <label className="text-sm text-gray-700">Day:</label>
                  <select
                    value={schedules['weekly-reflection']?.days?.[0] || 0}
                    onChange={(e) => handleScheduleChange('weekly-reflection', { days: [parseInt(e.target.value)] })}
                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value={0}>Sunday</option>
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                    <option value={6}>Saturday</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Streak Notifications */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Award className="w-5 h-5 text-yellow-500" />
                <div>
                  <h4 className="font-medium text-gray-900">Streak Celebrations</h4>
                  <p className="text-sm text-gray-600">
                    Get notified when you reach writing milestones (7, 14, 30+ days)
                  </p>
                </div>
              </div>
              <div className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                Always enabled
              </div>
            </div>
          </div>

          {/* Usage Tips */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">💡 Tips</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Notifications work even when the app is closed</li>
              <li>• You can customize reminder times to fit your schedule</li>
              <li>• Streak notifications happen automatically when you reach milestones</li>
              <li>• All notifications can be disabled from your browser settings</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}