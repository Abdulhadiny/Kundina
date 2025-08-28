import { StickyNote, Clock } from 'lucide-react';

export default function NotesPage() {
  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <StickyNote className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Quick Notes</h1>
        <p className="text-gray-600 mb-6">
          Capture quick thoughts and ideas with timestamps.
        </p>
        <div className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-600 rounded-md">
          <Clock className="w-4 h-4 mr-2" />
          Coming Soon
        </div>
      </div>
    </div>
  );
}