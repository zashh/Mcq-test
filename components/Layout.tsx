
import React from 'react';
import { 
  LayoutDashboard, 
  Upload, 
  Library, 
  PlayCircle, 
  BrainCircuit, 
  Camera,
  ShieldCheck,
  ChevronRight
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
    { id: 'upload', icon: Upload, label: 'Upload PDF', restricted: false },
    { id: 'library', icon: Library, label: 'Question Bank', restricted: false },
    { id: 'quiz', icon: PlayCircle, label: 'Start Test', restricted: false },
    { id: 'analyze', icon: Camera, label: 'Analyze Photo', restricted: false },
  ];

  const visibleNavItems = navItems.filter(item => !item.restricted || isAdmin);

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-inter">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200/60 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50">
        <div className="p-8 pb-6">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setView('dashboard')}>
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-600 blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative bg-gradient-to-tr from-indigo-600 to-indigo-500 p-2.5 rounded-2xl shadow-lg shadow-indigo-100 group-hover:scale-105 transition-transform">
                <BrainCircuit className="text-white w-6 h-6" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">
                MCQ <span className="text-indigo-600">Mastery</span>
              </h1>
              {isAdmin && (
                <div className="flex items-center gap-1 text-[9px] font-black text-amber-600 uppercase tracking-widest mt-1 opacity-80">
                  <ShieldCheck className="w-2.5 h-2.5" /> Admin Access
                </div>
              )}
            </div>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Main Menu</p>
          {visibleNavItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id as AppView)}
                className={`w-full group flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-700 shadow-[0_4px_12px_rgba(79,70,229,0.08)]' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-transparent group-hover:bg-slate-100'}`}>
                    <item.icon className="w-4.5 h-4.5" />
                  </div>
                  <span className={`text-sm ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
                </div>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                {!isActive && <ChevronRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />}
              </button>
            );
          })}
        </nav>

        <div className="p-6">
          <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] p-6 text-white group cursor-default">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-indigo-500/20 transition-colors" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">System Ready</span>
              </div>
              <p className="text-xs font-medium opacity-80 leading-relaxed mb-4">
                Powered by <span className="font-bold text-white">Gemini 3 Flash</span> for real-time analysis & search.
              </p>
              <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-indigo-500 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Subtle background gradient blob */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-[100px] -mr-64 -mt-64 pointer-events-none" />
        <div className="max-w-7xl mx-auto p-10 relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
