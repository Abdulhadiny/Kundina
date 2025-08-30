'use client';

import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  Eye, 
  Edit, 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Code,
  Image,
  Link,
  Heading1,
  Heading2,
  Heading3
} from 'lucide-react';
import { calculateWordCount } from '@/lib/db';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoSave?: boolean;
  onAutoSave?: (value: string) => void;
  className?: string;
}

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Write your thoughts here...",
  autoSave = false,
  onAutoSave,
  className = ""
}: RichTextEditorProps) {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !onAutoSave) return;

    const timer = setTimeout(() => {
      if (value.trim()) {
        onAutoSave(value);
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timer);
  }, [value, autoSave, onAutoSave]);

  // Update counters when content changes
  useEffect(() => {
    setWordCount(calculateWordCount(value));
    setCharacterCount(value.length);
  }, [value]);

  const insertMarkdown = useCallback((prefix: string, suffix: string = '') => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const beforeText = value.substring(0, start);
    const afterText = value.substring(end);
    
    const newText = `${beforeText}${prefix}${selectedText}${suffix}${afterText}`;
    onChange(newText);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length
      );
    }, 0);
  }, [value, onChange]);

  const toolbarButtons = [
    { icon: Heading1, action: () => insertMarkdown('# '), tooltip: 'Heading 1' },
    { icon: Heading2, action: () => insertMarkdown('## '), tooltip: 'Heading 2' },
    { icon: Heading3, action: () => insertMarkdown('### '), tooltip: 'Heading 3' },
    { icon: Bold, action: () => insertMarkdown('**', '**'), tooltip: 'Bold' },
    { icon: Italic, action: () => insertMarkdown('*', '*'), tooltip: 'Italic' },
    { icon: Quote, action: () => insertMarkdown('> '), tooltip: 'Quote' },
    { icon: Code, action: () => insertMarkdown('`', '`'), tooltip: 'Inline Code' },
    { icon: List, action: () => insertMarkdown('- '), tooltip: 'Bullet List' },
    { icon: ListOrdered, action: () => insertMarkdown('1. '), tooltip: 'Numbered List' },
    { icon: Link, action: () => insertMarkdown('[Link Text](', ')'), tooltip: 'Link' },
    { icon: Image, action: () => insertMarkdown('![Alt Text](', ')'), tooltip: 'Image' },
  ];

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 px-3 py-2">
        <div className="flex items-center space-x-1">
          {toolbarButtons.map((button, index) => {
            const Icon = button.icon;
            return (
              <button
                key={index}
                type="button"
                onClick={button.action}
                className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                title={button.tooltip}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Word and Character Count */}
          <div className="text-sm text-gray-500">
            {wordCount} words • {characterCount} characters
          </div>
          
          {/* Preview Toggle */}
          <button
            type="button"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              isPreviewMode
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isPreviewMode ? (
              <>
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor/Preview Content */}
      <div className="min-h-[300px]">
        {isPreviewMode ? (
          <div className="p-4 prose prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={oneDark}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {value || '*Nothing to preview yet...*'}
            </ReactMarkdown>
          </div>
        ) : (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-[300px] p-4 border-none resize-none focus:outline-none font-mono text-sm leading-relaxed"
            style={{ minHeight: '300px' }}
          />
        )}
      </div>

      {/* Helper Text */}
      <div className="bg-gray-50 border-t border-gray-200 px-3 py-2">
        <div className="text-xs text-gray-500">
          Supports Markdown formatting. Use the toolbar buttons or type manually.
          {autoSave && (
            <span className="ml-2 text-green-600">
              • Auto-save enabled
            </span>
          )}
        </div>
      </div>
    </div>
  );
}