import Link from 'next/link';
import { 
  BookOpen, 
  CheckSquare, 
  StickyNote, 
  FileText, 
  Bell, 
  Brain,
  ArrowRight 
} from 'lucide-react';

const modules = [
  {
    name: 'Diary',
    description: 'Document your thoughts and daily experiences',
    href: '/diary',
    icon: BookOpen,
    color: 'bg-blue-500',
    available: true,
  },
  {
    name: 'Todo List',
    description: 'Manage tasks with due dates and completion tracking',
    href: '/todo',
    icon: CheckSquare,
    color: 'bg-green-500',
    available: false,
  },
  {
    name: 'Quick Notes',
    description: 'Capture quick thoughts and ideas with timestamps',
    href: '/notes',
    icon: StickyNote,
    color: 'bg-yellow-500',
    available: false,
  },
  {
    name: 'Documents',
    description: 'Upload and store translation documents',
    href: '/docs',
    icon: FileText,
    color: 'bg-purple-500',
    available: false,
  },
  {
    name: 'Reminders',
    description: 'Schedule simple reminders and notifications',
    href: '/reminders',
    icon: Bell,
    color: 'bg-red-500',
    available: false,
  },
  {
    name: 'AI Assistant',
    description: 'AI-powered summarization and insights',
    href: '/ai',
    icon: Brain,
    color: 'bg-indigo-500',
    available: false,
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Kundina
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Your personal diary and productivity companion. Organize your thoughts, 
          manage tasks, and boost your productivity all in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <div
              key={module.name}
              className={`relative bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 ${
                !module.available ? 'opacity-60' : 'hover:scale-105'
              }`}
            >
              {!module.available && (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Coming Soon
                  </span>
                </div>
              )}
              
              <div className="flex items-center mb-4">
                <div className={`p-3 rounded-lg ${module.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="ml-4 text-xl font-semibold text-gray-900">
                  {module.name}
                </h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                {module.description}
              </p>
              
              {module.available ? (
                <Link
                  href={module.href}
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Get Started
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              ) : (
                <div className="inline-flex items-center text-gray-400 font-medium">
                  Coming Soon
                  <ArrowRight className="ml-2 w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 rounded-lg p-6 text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Start with Your Diary
        </h2>
        <p className="text-gray-600 mb-4">
          Begin your journey by documenting your thoughts and experiences. 
          The diary module is fully functional and ready to use.
        </p>
        <Link
          href="/diary"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          <BookOpen className="w-5 h-5 mr-2" />
          Open Diary
        </Link>
      </div>
    </div>
  );
}