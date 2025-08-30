'use client';

import { useState, useEffect } from 'react';
import { Database, Trash2, RefreshCw, TrendingUp, HardDrive } from 'lucide-react';
import { diaryCache, persistentCache } from '@/lib/cache-manager';

export default function CacheStatus() {
  const [stats, setStats] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const updateStats = () => {
    const cacheStats = diaryCache.getStats();
    setStats(cacheStats);
  };

  const handleClearCache = async () => {
    setIsRefreshing(true);
    diaryCache.invalidateAll();
    persistentCache.clear();
    await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay for UX
    updateStats();
    setIsRefreshing(false);
  };

  const handleRefreshStats = () => {
    setIsRefreshing(true);
    updateStats();
    setTimeout(() => setIsRefreshing(false), 300);
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatPercentage = (value: number): string => {
    return (value * 100).toFixed(1) + '%';
  };

  const formatAge = (timestamp: number): string => {
    if (timestamp === 0) return 'N/A';
    const age = Date.now() - timestamp;
    const minutes = Math.floor(age / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  if (!stats) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 text-gray-600">
          <Database className="w-5 h-5 animate-pulse" />
          <span>Loading cache statistics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          <Database className="w-5 h-5 text-blue-600" />
          <h3 className="font-medium text-gray-900">Cache Performance</h3>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handleRefreshStats}
            disabled={isRefreshing}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors disabled:opacity-50"
            title="Refresh stats"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={handleClearCache}
            disabled={isRefreshing}
            className="p-1.5 text-red-400 hover:text-red-600 rounded transition-colors disabled:opacity-50"
            title="Clear cache"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Hit Rate */}
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-2">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-semibold text-gray-900">
              {formatPercentage(stats.hitRate)}
            </div>
            <div className="text-sm text-gray-600">Hit Rate</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.hitRate >= 0.8 ? 'Excellent' : stats.hitRate >= 0.6 ? 'Good' : 'Poor'}
            </div>
          </div>

          {/* Items Cached */}
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-2">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-semibold text-gray-900">
              {stats.totalItems}
            </div>
            <div className="text-sm text-gray-600">Items</div>
            <div className="text-xs text-gray-500 mt-1">
              Cached entries
            </div>
          </div>

          {/* Memory Usage */}
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-2">
              <HardDrive className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-2xl font-semibold text-gray-900">
              {formatSize(stats.totalSize)}
            </div>
            <div className="text-sm text-gray-600">Memory</div>
            <div className="text-xs text-gray-500 mt-1">
              Cache size
            </div>
          </div>

          {/* Cache Age */}
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-2">
              <RefreshCw className="w-6 h-6 text-orange-600" />
            </div>
            <div className="text-2xl font-semibold text-gray-900">
              {formatAge(stats.oldestItem)}
            </div>
            <div className="text-sm text-gray-600">Oldest</div>
            <div className="text-xs text-gray-500 mt-1">
              Cache entry
            </div>
          </div>
        </div>

        {/* Performance Indicators */}
        <div className="space-y-4">
          {/* Hit Rate Bar */}
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Cache Hit Rate</span>
              <span>{formatPercentage(stats.hitRate)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  stats.hitRate >= 0.8 ? 'bg-green-500' : 
                  stats.hitRate >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${stats.hitRate * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Performance Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="font-medium text-blue-800 mb-2">💡 Performance Tips</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              {stats.hitRate < 0.6 && (
                <li>• Low hit rate detected - consider increasing cache TTL</li>
              )}
              {stats.totalItems === 0 && (
                <li>• Cache is empty - data will be cached as you browse</li>
              )}
              {stats.hitRate >= 0.8 && (
                <li>• Excellent cache performance! Your app should feel snappy</li>
              )}
              <li>• Clear cache if you're experiencing stale data issues</li>
              <li>• Cache automatically clears expired items every 5 minutes</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={handleClearCache}
                disabled={isRefreshing}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors disabled:opacity-50"
              >
                Clear All Cache
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact cache indicator for status bar
export function CacheIndicator() {
  const [hitRate, setHitRate] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const updateStats = () => {
      const stats = diaryCache.getStats();
      setHitRate(stats.hitRate);
      setTotalItems(stats.totalItems);
    };

    updateStats();
    const interval = setInterval(updateStats, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (hitRate >= 0.8) return 'text-green-600 bg-green-50';
    if (hitRate >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className={`inline-flex items-center space-x-2 px-2 py-1 rounded text-xs ${getStatusColor()}`}>
      <Database className="w-3 h-3" />
      <span>{totalItems} cached</span>
      <span>({(hitRate * 100).toFixed(0)}% hit)</span>
    </div>
  );
}