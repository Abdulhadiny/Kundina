'use client';

import { useMemo } from 'react';
import { DiaryEntry, MoodType } from '@/lib/db';
import { 
  FileText, 
  Target,
  Clock,
  BarChart3
} from 'lucide-react';

interface DiaryStatsProps {
  entries: DiaryEntry[];
}

interface MoodStats {
  mood: MoodType;
  count: number;
  percentage: number;
  emoji: string;
}

interface WritingStats {
  totalEntries: number;
  totalWords: number;
  totalReadingTime: number;
  averageWordsPerEntry: number;
  currentStreak: number;
  longestStreak: number;
  entriesThisMonth: number;
  entriesLastMonth: number;
  favoriteEntries: number;
  privateEntries: number;
  mostUsedTags: Array<{ tag: string; count: number }>;
  moodStats: MoodStats[];
  weeklyActivity: Array<{ day: string; count: number }>;
  monthlyTrend: Array<{ month: string; count: number; words: number }>;
}

export default function DiaryStats({ entries }: DiaryStatsProps) {
  const getMoodEmoji = (mood: MoodType): string => {
    const moodMap = {
      happy: '😊',
      sad: '😢',
      excited: '🤩',
      anxious: '😰',
      angry: '😠',
      neutral: '😐',
      grateful: '🙏',
      stressed: '😤'
    };
    return moodMap[mood];
  };

  const stats: WritingStats = useMemo(() => {
    if (entries.length === 0) {
      return {
        totalEntries: 0,
        totalWords: 0,
        totalReadingTime: 0,
        averageWordsPerEntry: 0,
        currentStreak: 0,
        longestStreak: 0,
        entriesThisMonth: 0,
        entriesLastMonth: 0,
        favoriteEntries: 0,
        privateEntries: 0,
        mostUsedTags: [],
        moodStats: [],
        weeklyActivity: [],
        monthlyTrend: []
      };
    }

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    // Basic stats
    const totalEntries = entries.length;
    const totalWords = entries.reduce((sum, entry) => sum + (entry.wordCount || 0), 0);
    const totalReadingTime = entries.reduce((sum, entry) => sum + (entry.readingTime || 0), 0);
    const averageWordsPerEntry = totalWords / totalEntries;

    // Monthly counts
    const entriesThisMonth = entries.filter(entry => {
      const date = new Date(entry.date);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    }).length;

    const entriesLastMonth = entries.filter(entry => {
      const date = new Date(entry.date);
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
    }).length;

    // Favorites and private
    const favoriteEntries = entries.filter(entry => entry.isFavorite).length;
    const privateEntries = entries.filter(entry => entry.isPrivate).length;

    // Calculate streaks
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    let currentStreak = 0;
    let longestStreak = 0;
    
    const uniqueDates = [...new Set(sortedEntries.map(entry => 
      new Date(entry.date).toDateString()
    ))].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    // Calculate current streak
    if (uniqueDates.length > 0) {
      const today = new Date().toDateString();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (uniqueDates[0] === today || uniqueDates[0] === yesterday.toDateString()) {
        let checkDate = new Date(uniqueDates[0] === today ? today : yesterday.toDateString());
        
        for (const dateStr of uniqueDates) {
          const entryDate = new Date(dateStr);
          if (entryDate.toDateString() === checkDate.toDateString()) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
      }
    }

    // Calculate longest streak
    if (uniqueDates.length > 0) {
      let maxStreak = 1;
      let currentTempStreak = 1;
      
      for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(uniqueDates[i - 1]);
        const currDate = new Date(uniqueDates[i]);
        const diffTime = prevDate.getTime() - currDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        
        if (diffDays === 1) {
          currentTempStreak++;
          maxStreak = Math.max(maxStreak, currentTempStreak);
        } else {
          currentTempStreak = 1;
        }
      }
      longestStreak = maxStreak;
    }

    // Tag analysis
    const tagCounts = new Map<string, number>();
    entries.forEach(entry => {
      entry.tags?.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });
    
    const mostUsedTags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Mood analysis
    const moodCounts = new Map<MoodType, number>();
    entries.forEach(entry => {
      if (entry.mood) {
        moodCounts.set(entry.mood, (moodCounts.get(entry.mood) || 0) + 1);
      }
    });

    const moodStats: MoodStats[] = Array.from(moodCounts.entries())
      .map(([mood, count]) => ({
        mood,
        count,
        percentage: Math.round((count / entries.length) * 100),
        emoji: getMoodEmoji(mood)
      }))
      .sort((a, b) => b.count - a.count);

    // Weekly activity
    const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weeklyActivity = weekDays.map(day => {
      const dayIndex = weekDays.indexOf(day);
      const count = entries.filter(entry => 
        new Date(entry.date).getDay() === dayIndex
      ).length;
      return { day: day.slice(0, 3), count };
    });

    // Monthly trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthEntries = entries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate.getMonth() === date.getMonth() && 
               entryDate.getFullYear() === date.getFullYear();
      });
      
      monthlyTrend.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        count: monthEntries.length,
        words: monthEntries.reduce((sum, entry) => sum + (entry.wordCount || 0), 0)
      });
    }

    return {
      totalEntries,
      totalWords,
      totalReadingTime,
      averageWordsPerEntry,
      currentStreak,
      longestStreak,
      entriesThisMonth,
      entriesLastMonth,
      favoriteEntries,
      privateEntries,
      mostUsedTags,
      moodStats,
      weeklyActivity,
      monthlyTrend
    };
  }, [entries]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getGrowthIndicator = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? '+∞' : '0';
    const growth = ((current - previous) / previous) * 100;
    return growth >= 0 ? `+${growth.toFixed(0)}%` : `${growth.toFixed(0)}%`;
  };

  const maxWeeklyCount = Math.max(...stats.weeklyActivity.map(d => d.count), 1);
  const maxMonthlyCount = Math.max(...stats.monthlyTrend.map(d => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Entries */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Entries</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalEntries)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className={`${
              stats.entriesThisMonth >= stats.entriesLastMonth 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {getGrowthIndicator(stats.entriesThisMonth, stats.entriesLastMonth)}
            </span>
            <span className="text-gray-500 ml-1">vs last month</span>
          </div>
        </div>

        {/* Total Words */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Words Written</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalWords)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            ~{Math.round(stats.averageWordsPerEntry)} words per entry
          </div>
        </div>

        {/* Current Streak */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Streak</p>
              <p className="text-2xl font-bold text-gray-900">{stats.currentStreak}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Target className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Best: {stats.longestStreak} days
          </div>
        </div>

        {/* Reading Time */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Reading Time</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalReadingTime}m</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Total content created
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Activity</h3>
          <div className="space-y-3">
            {stats.weeklyActivity.map((day, index) => (
              <div key={day.day} className="flex items-center">
                <div className="w-8 text-sm text-gray-600">{day.day}</div>
                <div className="flex-1 mx-3">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(day.count / maxWeeklyCount) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="w-8 text-sm text-gray-900 text-right">{day.count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Mood Distribution */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Mood Distribution</h3>
          {stats.moodStats.length > 0 ? (
            <div className="space-y-3">
              {stats.moodStats.slice(0, 5).map((mood) => (
                <div key={mood.mood} className="flex items-center">
                  <div className="flex items-center space-x-2 w-20">
                    <span className="text-lg">{mood.emoji}</span>
                    <span className="text-sm text-gray-600 capitalize">{mood.mood}</span>
                  </div>
                  <div className="flex-1 mx-3">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${mood.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-12 text-sm text-gray-900 text-right">
                    {mood.count} ({mood.percentage}%)
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No mood data available</p>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">6-Month Trend</h3>
          <div className="space-y-3">
            {stats.monthlyTrend.map((month, index) => (
              <div key={month.month} className="flex items-center">
                <div className="w-8 text-sm text-gray-600">{month.month}</div>
                <div className="flex-1 mx-3">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(month.count / maxMonthlyCount) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-900 text-right">
                  {month.count} entries, {formatNumber(month.words)} words
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Tags & Quick Stats */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Tags & Highlights</h3>
          
          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-lg font-semibold text-yellow-700">{stats.favoriteEntries}</div>
              <div className="text-sm text-yellow-600">Favorites</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-700">{stats.privateEntries}</div>
              <div className="text-sm text-gray-600">Private</div>
            </div>
          </div>

          {/* Top tags */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Most Used Tags</h4>
            {stats.mostUsedTags.length > 0 ? (
              <div className="space-y-2">
                {stats.mostUsedTags.map((tag, index) => (
                  <div key={tag.tag} className="flex items-center justify-between">
                    <span className="text-sm text-gray-900">#{tag.tag}</span>
                    <span className="text-sm text-gray-500">{tag.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No tags used yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}