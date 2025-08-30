'use client';

import { useState } from 'react';
import { ENTRY_TEMPLATES } from '@/lib/db';
import { FileText, X } from 'lucide-react';

interface TemplateSelectorProps {
  onSelect: (templateKey: string, content: string) => void;
  onClose: () => void;
}

const templateIcons = {
  daily: '📝',
  gratitude: '🙏',
  travel: '✈️',
  goals: '🎯'
};

export default function TemplateSelector({ onSelect, onClose }: TemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleTemplateSelect = (templateKey: string) => {
    const template = ENTRY_TEMPLATES[templateKey as keyof typeof ENTRY_TEMPLATES];
    onSelect(templateKey, template.content);
  };

  const templateEntries = Object.entries(ENTRY_TEMPLATES);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Choose a Template</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templateEntries.map(([key, template]) => (
              <div
                key={key}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  selectedTemplate === key
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedTemplate(key)}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">
                    {templateIcons[key as keyof typeof templateIcons]}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {template.name}
                    </h3>
                    <div className="text-sm text-gray-600">
                      <div className="bg-gray-50 p-3 rounded-md font-mono text-xs overflow-hidden">
                        <div className="line-clamp-4">
                          {template.content.split('\n').slice(0, 4).join('\n')}
                        </div>
                        {template.content.split('\n').length > 4 && (
                          <div className="text-gray-400 mt-1">...</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Preview Section */}
          {selectedTemplate && (
            <div className="mt-6 border-t pt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Preview:</h4>
              <div className="bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                  {ENTRY_TEMPLATES[selectedTemplate as keyof typeof ENTRY_TEMPLATES].content}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={() => onSelect('blank', '')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Start Blank
            </button>
            
            {selectedTemplate && (
              <button
                onClick={() => handleTemplateSelect(selectedTemplate)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
              >
                Use Template
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}