'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, User, Merge, Check, X } from 'lucide-react';
import { DiaryEntry, OfflineConflictResolver, ConflictResolution } from '@/lib/db';
import ReactMarkdown from 'react-markdown';

interface ConflictResolverProps {
  conflicts: DiaryEntry[];
  onResolve: (entryId: number, resolution: ConflictResolution) => void;
  onClose: () => void;
}

export default function ConflictResolver({ conflicts, onResolve, onClose }: ConflictResolverProps) {
  const [selectedConflict, setSelectedConflict] = useState<DiaryEntry | null>(
    conflicts.length > 0 ? conflicts[0] : null
  );
  const [mergedContent, setMergedContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (selectedConflict && selectedConflict.conflictVersion) {
      // Auto-merge by combining both versions
      setMergedContent(
        `${selectedConflict.content}\n\n---\n\n${selectedConflict.conflictVersion.content}`
      );
    }
  }, [selectedConflict]);

  const handleResolve = async (strategy: ConflictResolution['strategy']) => {
    if (!selectedConflict) return;

    let resolution: ConflictResolution;

    switch (strategy) {
      case 'local':
        resolution = { strategy: 'local', timestamp: new Date() };
        break;
      case 'remote':
        resolution = { strategy: 'remote', timestamp: new Date() };
        break;
      case 'merge':
        resolution = {
          strategy: 'merge',
          resolvedEntry: {
            ...selectedConflict,
            content: mergedContent,
            title: selectedConflict.title || selectedConflict.conflictVersion?.title || 'Merged Entry'
          },
          timestamp: new Date()
        };
        break;
      default:
        return;
    }

    await onResolve(selectedConflict.id!, resolution);
    
    // Move to next conflict or close if done
    const remainingConflicts = conflicts.filter(c => c.id !== selectedConflict.id);
    if (remainingConflicts.length > 0) {
      setSelectedConflict(remainingConflicts[0]);
    } else {
      onClose();
    }
  };

  if (!selectedConflict) {
    return null;
  }

  const localVersion = selectedConflict;
  const remoteVersion = selectedConflict.conflictVersion;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-red-50">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <h2 className="text-xl font-semibold text-red-800">
                Sync Conflict Detected
              </h2>
              <p className="text-sm text-red-600 mt-1">
                This entry was modified on multiple devices. Choose how to resolve the conflict.
              </p>
            </div>
            <div className="ml-auto bg-red-100 px-3 py-1 rounded-full">
              <span className="text-sm font-medium text-red-800">
                {conflicts.findIndex(c => c.id === selectedConflict.id) + 1} of {conflicts.length}
              </span>
            </div>
          </div>
        </div>

        {/* Conflict Navigation */}
        {conflicts.length > 1 && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex space-x-2 overflow-x-auto">
              {conflicts.map((conflict, index) => (
                <button
                  key={conflict.id}
                  onClick={() => setSelectedConflict(conflict)}
                  className={`px-3 py-1 rounded text-sm whitespace-nowrap ${
                    selectedConflict.id === conflict.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {conflict.title || `Entry ${index + 1}`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content Comparison */}
        <div className="flex-1 overflow-hidden flex">
          <div className="w-1/2 border-r border-gray-200">
            <div className="p-4 bg-blue-50 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-800">Local Version</span>
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                  Your Device
                </span>
              </div>
              <div className="text-xs text-blue-600 mt-1">
                Modified: {localVersion.updatedAt.toLocaleString()}
              </div>
            </div>
            <div className="p-4 h-64 overflow-y-auto">
              <h3 className="font-medium mb-2">{localVersion.title}</h3>
              <div className="text-sm text-gray-600 prose prose-sm max-w-none">
                <ReactMarkdown>{localVersion.content}</ReactMarkdown>
              </div>
            </div>
          </div>

          <div className="w-1/2">
            <div className="p-4 bg-green-50 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-800">Remote Version</span>
                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                  Other Device
                </span>
              </div>
              <div className="text-xs text-green-600 mt-1">
                Modified: {remoteVersion?.updatedAt.toLocaleString()}
              </div>
            </div>
            <div className="p-4 h-64 overflow-y-auto">
              <h3 className="font-medium mb-2">{remoteVersion?.title}</h3>
              <div className="text-sm text-gray-600 prose prose-sm max-w-none">
                <ReactMarkdown>{remoteVersion?.content || ''}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>

        {/* Merge Editor */}
        <div className="border-t border-gray-200">
          <div className="p-4 bg-purple-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Merge className="w-4 h-4 text-purple-600" />
                <span className="font-medium text-purple-800">Merged Version</span>
              </div>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-sm text-purple-600 hover:text-purple-800"
              >
                {showPreview ? 'Edit' : 'Preview'}
              </button>
            </div>
          </div>
          <div className="p-4">
            {showPreview ? (
              <div className="prose prose-sm max-w-none h-32 overflow-y-auto border border-gray-200 rounded p-3">
                <ReactMarkdown>{mergedContent}</ReactMarkdown>
              </div>
            ) : (
              <textarea
                value={mergedContent}
                onChange={(e) => setMergedContent(e.target.value)}
                className="w-full h-32 border border-gray-300 rounded p-3 text-sm font-mono"
                placeholder="Edit the merged content..."
              />
            )}
          </div>
        </div>

        {/* Resolution Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Resolve Later
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={() => handleResolve('local')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Use Local</span>
            </button>
            
            <button
              onClick={() => handleResolve('remote')}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Use Remote</span>
            </button>
            
            <button
              onClick={() => handleResolve('merge')}
              className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            >
              <Merge className="w-4 h-4" />
              <span>Use Merged</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}