
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import PDFProcessor from './components/PDFProcessor';
import QuizView from './components/QuizView';
import AnalyzePhoto from './components/AnalyzePhoto';
import { Question, QuizAttempt, AppView } from './types';
import { searchFactsForQuestion } from './services/gemini';
import { 
  Trophy, 
  BookOpen, 
  History, 
  Calendar, 
  Search,
  CheckCircle2,
  BrainCircuit,
  BarChart2,
  ArrowRight,
  Eye,
  EyeOff,
  Trash2,
  GraduationCap,
  Clock,
  LayoutGrid,
  Globe,
  Loader2,
  ExternalLink,
  X,
  ShieldCheck,
  Zap,
  PlusCircle,
  TrendingUp,
  Sparkles,
  // Fix: Added missing icons referenced in the code
  Library,
  PlayCircle
} from 'lucide-react';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>('dashboard');
  const [isAdmin, setIsAdmin] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [selectedInLibrary, setSelectedInLibrary] = useState<Record<string, number>>({});
  const [currentReviewAttempt, setCurrentReviewAttempt] = useState<QuizAttempt | null>(null);
  
  // Search facts state
  const [searchingIds, setSearchingIds] = useState<Set<string>>(new Set());
  const [searchResultData, setSearchResultData] = useState<Record<string, { text: string, sources: any[] }>>({});

  // Admin access check on mount
  useEffect(() => {
    if (window.location.pathname === '/master-admin') {
      setIsAdmin(true);
    }
  }, []);

  // Load from LocalStorage
  useEffect(() => {
    const savedQuestions = localStorage.getItem('mcq_questions');
    const savedAttempts = localStorage.getItem('mcq_attempts');
    if (savedQuestions) setQuestions(JSON.parse(savedQuestions));
    if (savedAttempts) setAttempts(JSON.parse(savedAttempts));
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('mcq_questions', JSON.stringify(questions));
  }, [questions]);

  useEffect(() => {
    localStorage.setItem('mcq_attempts', JSON.stringify(attempts));
  }, [attempts]);

  const handleQuestionsExtracted = (newQuestions: Question[]) => {
    setQuestions([...questions, ...newQuestions]);
    setActiveView('library');
  };

  const handleCaptureSingle = (q: Question) => {
    setQuestions([q, ...questions]);
    setActiveView('library');
  };

  const startQuiz = (num: number) => {
    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    setSelectedQuestions(shuffled.slice(0, num));
    setActiveView('quiz');
  };

  const handleQuizFinish = (attempt: QuizAttempt) => {
    setAttempts([attempt, ...attempts]);
    setActiveView('results');
  };

  const startReview = (attempt: QuizAttempt) => {
    setCurrentReviewAttempt(attempt);
    const attemptQuestionIds = Object.keys(attempt.answers);
    const reviewQuestions = questions.filter(q => attemptQuestionIds.includes(q.id));
    
    if (reviewQuestions.length > 0) {
      setSelectedQuestions(reviewQuestions);
      setActiveView('review');
    }
  };

  const toggleReveal = (id: string) => {
    const newRevealed = new Set(revealedIds);
    if (newRevealed.has(id)) {
      newRevealed.delete(id);
      const newSelected = {...selectedInLibrary};
      delete newSelected[id];
      setSelectedInLibrary(newSelected);
    } else {
      newRevealed.add(id);
    }
    setRevealedIds(newRevealed);
  };

  const handleLibraryOptionClick = (questionId: string, optionIndex: number) => {
    const newRevealed = new Set(revealedIds);
    newRevealed.add(questionId);
    setRevealedIds(newRevealed);
    setSelectedInLibrary({
      ...selectedInLibrary,
      [questionId]: optionIndex
    });
  };

  const handleSearchFacts = async (q: Question) => {
    if (searchingIds.has(q.id)) return;
    
    setSearchingIds(prev => new Set(prev).add(q.id));
    try {
      const result = await searchFactsForQuestion(q);
      setSearchResultData(prev => ({ ...prev, [q.id]: result }));
    } catch (err) {
      console.error("Failed to search facts:", err);
    } finally {
      setSearchingIds(prev => {
        const next = new Set(prev);
        next.delete(q.id);
        return next;
      });
    }
  };

  const dismissSearchResult = (id: string) => {
    setSearchResultData(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const formatMarkdown = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let content: React.ReactNode = line;
      if (line.startsWith('###')) {
        return (
          <h4 key={idx} className="text-emerald-800 font-bold text-lg mt-4 mb-2 flex items-center gap-2">
            <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
            {line.replace(/^###\s*/, '')}
          </h4>
        );
      }
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = line.split(boldRegex);
      if (parts.length > 1) {
        content = parts.map((part, pIdx) => 
          pIdx % 2 === 1 ? <strong key={pIdx} className="font-bold text-emerald-950">{part}</strong> : part
        );
      }
      if (line.includes('|') && line.trim().startsWith('|')) {
        const cells = line.split('|').filter(c => c.trim() !== '');
        return (
          <div key={idx} className="flex border-b border-emerald-100 bg-white/50 first:bg-emerald-100/30 first:font-bold">
            {cells.map((cell, cIdx) => (
              <div key={cIdx} className="flex-1 p-2 text-xs border-r border-emerald-100 last:border-0 italic">
                {cell.trim()}
              </div>
            ))}
          </div>
        );
      }
      return <p key={idx} className="text-emerald-900/80 leading-relaxed mb-3 text-sm">{content}</p>;
    });
  };

  const filteredQuestions = questions.filter(q => 
    q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.year?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalQuestions: questions.length,
    totalTests: attempts.length,
    avgScore: attempts.length 
      ? Math.round((attempts.reduce((acc, curr) => acc + (curr.score / curr.totalQuestions), 0) / attempts.length) * 100) 
      : 0,
    bestScore: attempts.length 
      ? Math.max(...attempts.map(a => Math.round((a.score / a.totalQuestions) * 100))) 
      : 0
  };

  return (
    <Layout activeView={activeView} setView={setActiveView} isAdmin={isAdmin}>
      {activeView === 'dashboard' && (
        <div className="space-y-10 animate-in fade-in slide-in-from-top-4 duration-700">
          {/* Welcome Hero Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
                <Sparkles className="w-3 h-3" /> Dashboard Overview
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
                Welcome back{isAdmin ? ', Admin' : ''}!
              </h1>
              <p className="text-slate-500 font-medium">
                You've tackled <span className="text-indigo-600 font-bold">{stats.totalTests}</span> sessions so far. Ready to push your limits?
              </p>
            </div>
            {isAdmin && (
              <button 
                onClick={() => setActiveView('upload')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
              >
                <PlusCircle className="w-5 h-5 text-indigo-400" />
                Upload New Data
              </button>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              icon={BookOpen} 
              label="Question Bank" 
              value={stats.totalQuestions} 
              sub="Available items"
              color="text-indigo-600"
              bgColor="bg-indigo-50"
            />
            <StatCard 
              icon={History} 
              label="Active Sessions" 
              value={stats.totalTests} 
              sub="Tests completed"
              color="text-purple-600"
              bgColor="bg-purple-50"
            />
            <StatCard 
              icon={TrendingUp} 
              label="Average Score" 
              value={`${stats.avgScore}%`} 
              sub="All-time perf"
              color="text-emerald-600"
              bgColor="bg-emerald-50"
            />
            <StatCard 
              icon={Trophy} 
              label="Top Score" 
              value={`${stats.bestScore}%`} 
              sub="Personal best"
              color="text-amber-600"
              bgColor="bg-amber-50"
            />
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Column: Activity */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 rounded-xl">
                      <History className="text-slate-400 w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Recent Activity</h3>
                  </div>
                  {attempts.length > 0 && (
                    <button 
                      onClick={() => setActiveView('library')}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      View All Bank Items
                    </button>
                  )}
                </div>

                {attempts.length > 0 ? (
                  <div className="space-y-4">
                    {attempts.slice(0, 5).map(a => (
                      <div key={a.id} className="group flex items-center justify-between p-5 rounded-[1.75rem] bg-slate-50 border border-slate-100/50 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
                        <div className="flex items-center gap-5">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110 ${a.score / a.totalQuestions >= 0.7 ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-emerald-200' : 'bg-gradient-to-tr from-amber-500 to-orange-400 shadow-amber-200'}`}>
                            <CheckCircle2 className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-black text-slate-800 tracking-tight mb-0.5">Session #{a.id.slice(-4)}</p>
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1.5 text-xs text-slate-400 font-bold uppercase tracking-wider">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(a.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                              <span className="w-1 h-1 rounded-full bg-slate-200" />
                              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                                {a.totalQuestions} Questions
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-xl font-black text-slate-900 tracking-tight">{a.score}/{a.totalQuestions}</p>
                            <p className={`text-[10px] font-black uppercase tracking-[0.1em] ${a.score / a.totalQuestions >= 0.7 ? 'text-emerald-500' : 'text-amber-500'}`}>
                              {Math.round((a.score / a.totalQuestions) * 100)}% Match
                            </p>
                          </div>
                          <button 
                            onClick={() => startReview(a)}
                            className="p-3 bg-white text-slate-400 rounded-2xl border border-slate-100 hover:text-indigo-600 hover:border-indigo-100 hover:shadow-lg transition-all"
                            title="Review Attempt"
                          >
                            <LayoutGrid className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-indigo-50 blur-3xl rounded-full opacity-60" />
                      <div className="relative bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                        <History className="w-12 h-12 text-slate-200" />
                      </div>
                    </div>
                    <h4 className="text-xl font-bold text-slate-800 mb-2">Your history is clear</h4>
                    <p className="text-slate-500 max-w-xs mx-auto text-sm leading-relaxed mb-8">
                      {isAdmin ? 'Upload your first PDF or snap a photo to populate your bank.' : 'Once admin adds questions, they will appear here.'}
                    </p>
                    {isAdmin && (
                      <button 
                        onClick={() => setActiveView('upload')}
                        className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all"
                      >
                        <PlusCircle className="w-5 h-5" />
                        Add First Document
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: CTA */}
            <div className="lg:col-span-4 space-y-8">
              <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] p-10 rounded-[3rem] text-white shadow-2xl shadow-indigo-900/10 relative overflow-hidden group">
                <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700" />
                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center p-4 bg-indigo-500/20 rounded-3xl mb-8 group-hover:scale-110 transition-transform duration-500">
                    <Zap className="w-8 h-8 text-indigo-400 fill-indigo-400/20" />
                  </div>
                  <h3 className="text-3xl font-black mb-4 tracking-tight leading-tight">Master Your Exams</h3>
                  <p className="text-slate-400 mb-10 text-sm leading-relaxed font-medium">
                    Our AI generates randomized tests and provides deep logical explanations for every answer.
                  </p>
                  <button 
                    onClick={() => setActiveView('quiz')}
                    disabled={questions.length === 0}
                    className={`group/btn w-full py-5 rounded-[1.5rem] font-black flex items-center justify-center gap-3 transition-all duration-300 ${
                      questions.length === 0 
                        ? 'bg-white/5 text-white/30 cursor-not-allowed border border-white/5' 
                        : 'bg-white text-slate-900 hover:bg-indigo-50 shadow-lg hover:shadow-indigo-500/20 active:scale-95'
                    }`}
                  >
                    Start Smart Test
                    <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                  {questions.length === 0 && (
                    <p className="text-center mt-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                      {isAdmin ? 'Waiting for content upload' : 'Bank is currently empty'}
                    </p>
                  )}
                </div>
              </div>

              {/* Achievement Placeholder */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-amber-50 rounded-xl">
                    <Trophy className="text-amber-600 w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Milestones</h3>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-4 opacity-50 grayscale">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-200">
                      <Zap className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <div className="h-2 w-full bg-slate-200 rounded-full mb-2" />
                      <div className="h-2 w-1/2 bg-slate-200 rounded-full" />
                    </div>
                  </div>
                  <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">More coming soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin specific views restricted by Layout, but logic kept here */}
      {isAdmin && activeView === 'upload' && (
        <div className="animate-in fade-in zoom-in-95 duration-500">
          <PDFProcessor onQuestionsExtracted={handleQuestionsExtracted} />
        </div>
      )}

      {isAdmin && activeView === 'analyze' && (
        <div className="animate-in fade-in zoom-in-95 duration-500">
          <AnalyzePhoto onQuestionCaptured={handleCaptureSingle} />
        </div>
      )}

      {activeView === 'library' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Question Bank</h2>
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Filter by subject, year or keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all shadow-sm font-medium text-slate-700"
              />
            </div>
          </div>

          {filteredQuestions.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {filteredQuestions.map((q) => {
                const isRevealed = revealedIds.has(q.id);
                const selectedIdx = selectedInLibrary[q.id];
                const isSearching = searchingIds.has(q.id);
                const searchResult = searchResultData[q.id];

                return (
                  <div key={q.id} className="bg-white p-8 rounded-[2rem] border border-slate-200/60 hover:border-indigo-200 transition-all duration-300 group relative">
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-5">
                          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-full uppercase tracking-widest border border-indigo-100/50">
                            {q.category || "General"}
                          </span>
                          {q.subject && (
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-full uppercase tracking-widest border border-emerald-100/50 flex items-center gap-1.5">
                              <GraduationCap className="w-3 h-3" /> {q.subject}
                            </span>
                          )}
                          {q.year && (
                            <span className="px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-black rounded-full uppercase tracking-widest border border-amber-100/50 flex items-center gap-1.5">
                              <Clock className="w-3 h-3" /> {q.year}
                            </span>
                          )}
                        </div>
                        
                        <h3 className="text-xl font-bold text-slate-800 mb-8 leading-relaxed whitespace-pre-wrap">
                          {q.question}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          {q.options.map((opt, i) => {
                            const isCorrect = i === q.correctAnswerIndex;
                            const isSelected = selectedIdx === i;
                            
                            let cardStyle = "bg-slate-50 border-slate-200/50 text-slate-600 hover:border-indigo-200 hover:bg-white cursor-pointer";
                            if (isRevealed) {
                              if (isCorrect) cardStyle = "bg-emerald-50 border-emerald-500 text-emerald-700 font-bold cursor-default shadow-sm";
                              else if (isSelected) cardStyle = "bg-rose-50 border-rose-500 text-rose-700 font-bold cursor-default shadow-sm";
                              else cardStyle = "bg-slate-50 border-slate-100 text-slate-300 opacity-60 cursor-default";
                            }

                            return (
                              <div 
                                key={i} 
                                onClick={() => !isRevealed && handleLibraryOptionClick(q.id, i)}
                                className={`px-6 py-4 rounded-2xl text-sm border transition-all duration-200 flex items-center gap-4 ${cardStyle}`}
                              >
                                <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                                  isRevealed && isCorrect 
                                    ? 'bg-emerald-500 text-white' 
                                    : isRevealed && isSelected 
                                      ? 'bg-rose-500 text-white'
                                      : 'bg-white text-slate-400 shadow-sm'
                                }`}>
                                  {String.fromCharCode(65 + i)}
                                </span>
                                <span className="flex-1 leading-tight">{opt}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                        <button 
                          onClick={() => handleSearchFacts(q)}
                          disabled={isSearching}
                          className={`p-3.5 rounded-2xl transition-all ${isSearching ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 border border-transparent hover:border-emerald-100 shadow-sm'}`}
                          title="Google Search Facts"
                        >
                          {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Globe className="w-5 h-5" />}
                        </button>
                        <button 
                          onClick={() => toggleReveal(q.id)}
                          className={`p-3.5 rounded-2xl transition-all ${isRevealed ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 border border-transparent hover:border-indigo-100 shadow-sm'}`}
                          title={isRevealed ? "Hide Answer" : "Show Answer"}
                        >
                          {isRevealed ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                        {isAdmin && (
                          <button 
                            onClick={() => {
                              setQuestions(questions.filter(item => item.id !== q.id));
                            }}
                            className="p-3.5 bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-100 rounded-2xl transition-all shadow-sm"
                            title="Delete Question"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {searchResult && (
                      <div className="mt-8 p-8 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 rounded-[2.5rem] border border-emerald-100/50 shadow-sm animate-in zoom-in-95 slide-in-from-top-4 duration-500 relative">
                        <button 
                          onClick={() => dismissSearchResult(q.id)}
                          className="absolute top-6 right-6 p-2 hover:bg-white rounded-full text-emerald-600 transition-colors shadow-sm"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-4 mb-8">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/10">
                            <Globe className="w-6 h-6 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-0.5">Gemini 3 Grounding</p>
                            <h4 className="text-lg font-bold text-slate-800 tracking-tight">Search Verified Insights</h4>
                          </div>
                        </div>
                        <div className="bg-white/60 backdrop-blur-md rounded-3xl p-8 border border-white shadow-sm mb-8">
                          {formatMarkdown(searchResult.text)}
                        </div>
                        {searchResult.sources.length > 0 && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Linked Sources</p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                              {searchResult.sources.map((src, i) => (
                                <a 
                                  key={i} 
                                  href={src.uri} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="group inline-flex items-center gap-3 px-5 py-2.5 bg-white border border-emerald-200/50 rounded-[1.25rem] text-xs font-bold text-emerald-700 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all duration-300 shadow-sm"
                                >
                                  {src.title || "Reference"} 
                                  <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {isRevealed && q.explanation && !searchResult && (
                      <div className="mt-8 p-6 bg-indigo-50/50 rounded-[1.75rem] border border-indigo-100/50 text-sm text-indigo-900 animate-in slide-in-from-top-4 duration-300">
                        <p className="font-black mb-3 flex items-center gap-2 uppercase tracking-widest text-[10px] text-indigo-600">
                          <BrainCircuit className="w-4 h-4" /> Logic Breakdown:
                        </p>
                        <p className="font-medium leading-relaxed opacity-90">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border border-dashed border-slate-200">
               <Library className="w-16 h-16 text-slate-100 mb-6" />
               <h3 className="text-2xl font-black text-slate-900 mb-2">No Questions Found</h3>
               <p className="text-slate-500 max-w-sm text-center">Your search didn't return any results. Try adjusting your filters or upload more items.</p>
            </div>
          )}
        </div>
      )}

      {activeView === 'quiz' && (
        <div className="animate-in slide-in-from-bottom duration-500">
          {selectedQuestions.length > 0 ? (
            <QuizView questions={selectedQuestions} onFinish={handleQuizFinish} />
          ) : (
            <div className="bg-white p-16 rounded-[3rem] border border-slate-200 shadow-2xl text-center max-w-3xl mx-auto">
              <div className="relative inline-flex mb-8">
                <div className="absolute inset-0 bg-indigo-100 blur-3xl opacity-60 rounded-full" />
                <div className="relative bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl">
                  <PlayCircle className="w-16 h-16 text-indigo-600" />
                </div>
              </div>
              <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Ready for a challenge?</h2>
              <p className="text-slate-500 mb-12 max-w-sm mx-auto font-medium text-lg leading-relaxed">Choose your session intensity. We'll shuffle the questions for a fresh experience.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[5, 10, 20].map(num => (
                  <button
                    key={num}
                    onClick={() => startQuiz(num)}
                    disabled={questions.length < num}
                    className="p-6 bg-slate-50 border border-slate-200 text-slate-700 rounded-[2rem] font-black hover:bg-white hover:border-indigo-500 hover:text-indigo-600 hover:shadow-2xl hover:shadow-indigo-500/10 disabled:opacity-30 disabled:hover:bg-slate-50 disabled:hover:border-slate-200 transition-all duration-300"
                  >
                    <div className="text-3xl mb-1">{num}</div>
                    <div className="text-[10px] uppercase tracking-widest">Items</div>
                  </button>
                ))}
                {questions.length > 0 && (
                   <button
                    onClick={() => startQuiz(questions.length)}
                    className="p-6 bg-indigo-600 text-white rounded-[2rem] font-black hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all duration-300"
                  >
                    <div className="text-3xl mb-1">∞</div>
                    <div className="text-[10px] uppercase tracking-widest">All {questions.length}</div>
                  </button>
                )}
              </div>
              {questions.length === 0 && (
                <div className="mt-10 p-5 bg-amber-50 rounded-2xl border border-amber-100 inline-flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-amber-600" />
                  <p className="text-xs font-bold text-amber-900">Please populate your Question Bank first.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeView === 'review' && currentReviewAttempt && (
        <div className="animate-in slide-in-from-bottom duration-500">
          <QuizView 
            questions={selectedQuestions} 
            onFinish={() => {}} 
            reviewMode={true} 
            attemptData={currentReviewAttempt}
            onExitReview={() => setActiveView('dashboard')}
          />
        </div>
      )}

      {activeView === 'results' && attempts.length > 0 && (
        <div className="animate-in zoom-in-95 duration-700">
          <div className="max-w-3xl mx-auto bg-white rounded-[3.5rem] border border-slate-200 shadow-[0_32px_128px_rgba(0,0,0,0.08)] overflow-hidden">
            <div className="bg-slate-900 p-16 text-center text-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-600/20 to-purple-600/20" />
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-28 h-28 rounded-[2.5rem] bg-indigo-500 text-white shadow-2xl shadow-indigo-500/40 mb-10 transform -rotate-6 animate-in zoom-in-50 duration-500">
                  <Trophy className="w-14 h-14" />
                </div>
                <h2 className="text-5xl font-black mb-4 tracking-tighter">Session Complete!</h2>
                <p className="text-slate-400 font-medium text-lg">Fantastic progress. Review your results below.</p>
              </div>
            </div>
            <div className="p-16 text-center">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-10 sm:gap-20 mb-16">
                <div className="text-center group">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 group-hover:text-indigo-500 transition-colors">Total Accuracy</p>
                  <p className="text-7xl font-black text-slate-900 tracking-tighter">{attempts[0].score}<span className="text-slate-200 mx-2">/</span><span className="text-slate-400 text-5xl">{attempts[0].totalQuestions}</span></p>
                </div>
                <div className="hidden sm:block w-px h-24 bg-slate-100" />
                <div className="text-center group">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 group-hover:text-emerald-500 transition-colors">Success Rate</p>
                  <p className="text-7xl font-black text-indigo-600 tracking-tighter">{Math.round((attempts[0].score / attempts[0].totalQuestions) * 100)}<span className="text-indigo-200 text-5xl font-black">%</span></p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-xl mx-auto">
                <button 
                  onClick={() => startReview(attempts[0])}
                  className="w-full py-5 bg-slate-100 text-slate-800 rounded-[1.5rem] font-black hover:bg-slate-200 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  <LayoutGrid className="w-6 h-6" />
                  Review Answers
                </button>
                <button 
                  onClick={() => {
                    setSelectedQuestions([]);
                    setActiveView('quiz');
                  }}
                  className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  New Test Attempt
                </button>
              </div>
              <button 
                onClick={() => setActiveView('dashboard')}
                className="mt-10 inline-flex items-center gap-2 text-slate-400 font-bold hover:text-indigo-600 transition-all"
              >
                Return to Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

const StatCard: React.FC<{icon: any, label: string, value: string | number, sub: string, color: string, bgColor: string}> = ({icon: Icon, label, value, sub, color, bgColor}) => (
  <div className="group bg-white p-7 rounded-[2rem] border border-slate-200/60 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-300">
    <div className="flex items-start justify-between mb-6">
      <div className={`p-4 rounded-2xl ${bgColor} ${color} group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="w-7 h-7" />
      </div>
      <TrendingUp className="w-5 h-5 text-slate-100 group-hover:text-emerald-500/20 transition-colors" />
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">{label}</p>
    <p className="text-3xl font-black text-slate-900 tracking-tight mb-2">{value}</p>
    <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> {sub}
    </p>
  </div>
);

export default App;
