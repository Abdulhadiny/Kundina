import { FileText, Clock } from 'lucide-react';

export default function DocsPage() {
  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Documents</h1>
        <p className="text-gray-600 mb-6">
          Upload and store translation documents with IndexedDB storage.
        </p>
        <div className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-600 rounded-md">
          <Clock className="w-4 h-4 mr-2" />
          Coming Soon
        </div>
      </div>
    </div>
  );
}