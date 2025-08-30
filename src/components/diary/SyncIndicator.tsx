'use client';

import { useSyncStatus } from '@/lib/background-sync';
import { Wifi, WifiOff, RefreshCw, Check, AlertCircle, Cloud } from 'lucide-react';

export default function SyncIndicator() {
  const { isOnline, queueLength, syncInProgress, lastAttempt } = useSyncStatus();

  const getStatusIcon = () => {
    if (!isOnline) {
      return <WifiOff className="w-4 h-4 text-red-500" />;
    }
    
    if (syncInProgress) {
      return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
    }
    
    if (queueLength > 0) {
      return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
    
    return <Check className="w-4 h-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (!isOnline) {
      return 'Offline';
    }
    
    if (syncInProgress) {
      return 'Syncing...';
    }
    
    if (queueLength > 0) {
      return `${queueLength} pending`;
    }
    
    return 'Synced';
  };

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-600 bg-red-50';
    if (syncInProgress) return 'text-blue-600 bg-blue-50';
    if (queueLength > 0) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
      <Cloud className="w-3 h-3" />
      {getStatusIcon()}
      <span>{getStatusText()}</span>
      {lastAttempt && (
        <span className="text-xs opacity-75">
          {new Date(lastAttempt).toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}