
import React from 'react';
import { 
  LayoutDashboard, 
  Upload, 
  Library, 
  PlayCircle, 
  BrainCircuit, 
  Camera,
  ShieldCheck
} from 'lucide-react';
import { AppView } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: AppView;
  setView: (view: AppView) => void;
  isAdmin?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, setView, isAdmin = false }) => {
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', restricted: false },
    { id: 'upload', icon: Upload, label: 'Upload PDF', restricted: true },
    { id: 'library', icon: Library, label: 'Question Bank', restricted: false },
    { id: 'quiz', icon: PlayCircle, label: 'Start Test', restricted: false },
    { id: 'analyze', icon: Camera, label: 'Analyze Photo', restricted: true },
  ];

  const visibleNavItems = navItems.filter(item => !item.restricted || isAdmin);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm">
        <div className="p-6 border-b border-slate-100 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <BrainCircuit className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              MCQ Mastery
            </h1>
          </div>
          {isAdmin && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest mt-1">
              <ShieldCheck className="w-3 h-3" /> Master Admin
            </div>
          )}
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {visibleNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id as AppView)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeView === item.id 
                  ? 'bg-indigo-50 text-indigo-700 font-semibold' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-4 rounded-2xl text-white mb-4">
            <p className="text-xs font-medium opacity-80 mb-1">AI Assistant</p>
            <p className="text-sm font-bold">Powered by Gemini 3</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
