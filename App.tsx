
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import PDFProcessor from './components/PDFProcessor';
import QuizView from './components/QuizView';
import AnalyzePhoto from './components/AnalyzePhoto';
import ConfirmationView from './components/ConfirmationView';
import QuestionDetail from './components/QuestionDetail';
import { Question, QuizAttempt, AppView } from './types';
import { searchFactsForQuestion } from './services/gemini';
import { storage } from './services/storage';
import { 
  Trophy, 
  BookOpen, 
  History, 
  Calendar, 
  Search,
  CheckCircle2,
  BrainCircuit,
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
  Zap,
  PlusCircle,
  TrendingUp,
  Sparkles,
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
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  
  // Pending questions for confirmation
  const [pendingQuestions, setPendingQuestions] = useState<Question[] | null>(null);

  // Search facts state
  const [searchingIds, setSearchingIds] = useState<Set<string>>(new Set());
  const [searchResultData, setSearchResultData] = useState<Record<string, { text: string, sources: any[] }>>({});

  // Initial Load from Persistent Storage
  useEffect(() => {
    const init = async () => {
      const qs = await storage.getQuestions();
      const atts = await storage.getAttempts();
      setQuestions(qs);
      setAttempts(atts);
    };
    init();

    // Check URL hash/path for deep linking (SEO)
    const handleRoute = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('q/')) {
        const slug = hash.replace('q/', '');
      }
    };
    handleRoute();
    window.addEventListener('popstate', handleRoute);
    return () => window.removeEventListener('popstate', handleRoute);
  }, []);

  // Post-load route check
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash.startsWith('q/')) {
      const slug = hash.replace('q/', '');
      const q = questions.find(q => q.slug === slug);
      if (q) {
        setSelectedQuestion(q);
        setActiveView('question-detail');
      }
    }
  }, [questions]);

  // Sync to Storage on changes
  useEffect(() => {
    storage.saveQuestions(questions);
  }, [questions]);

  useEffect(() => {
    storage.saveAttempts(attempts);
  }, [attempts]);

  const handleQuestionsExtracted = (newQuestions: Question[]) => {
    setPendingQuestions(newQuestions);
  };

  const confirmPendingSave = (finalQuestions: Question[]) => {
    setQuestions([...questions, ...finalQuestions]);
    setPendingQuestions(null);
    setActiveView('library');
  };

  const handleCaptureSingle = (q: Question) => {
    setPendingQuestions([q]);
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

  const openQuestionDetail = (q: Question) => {
    setSelectedQuestion(q);
    setActiveView('question-detail');
    window.location.hash = `q/${q.slug}`;
  };

  const backToLibrary = () => {
    setActiveView('library');
    window.location.hash = '';
    setSelectedQuestion(null);
  };

  return (
    <Layout activeView={activeView} setView={setActiveView} isAdmin={isAdmin}>
      {pendingQuestions ? (
        <ConfirmationView 
          questions={pendingQuestions} 
          onConfirm={confirmPendingSave} 
          onCancel={() => setPendingQuestions(null)} 
        />
      ) : (
        <>
          {activeView === 'dashboard' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-top-4 duration-700">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
                    <Sparkles className="w-3 h-3" /> Dashboard Overview
                  </div>
                  <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Welcome back!</h1>
                  <p className="text-slate-500 font-medium">
                    You've tackled <span className="text-indigo-600 font-bold">{stats.totalTests}</span> sessions.
                  </p>
                </div>
                <button 
                  onClick={() => setActiveView('upload')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                >
                  <PlusCircle className="w-5 h-5 text-indigo-400" />
                  Upload New Data
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={BookOpen} label="Question Bank" value={stats.totalQuestions} sub="Available items" color="text-indigo-600" bgColor="bg-indigo-50" />
                <StatCard icon={History} label="Active Sessions" value={stats.totalTests} sub="Tests completed" color="text-purple-600" bgColor="bg-purple-50" />
                <StatCard icon={TrendingUp} label="Average Score" value={`${stats.avgScore}%`} sub="All-time perf" color="text-emerald-600" bgColor="bg-emerald-50" />
                <StatCard icon={Trophy} label="Top Score" value={`${stats.bestScore}%`} sub="Personal best" color="text-amber-600" bgColor="bg-amber-50" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-6">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 rounded-xl">
                          <History className="text-slate-400 w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Recent Activity</h3>
                      </div>
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
                              </div>
                              <button onClick={() => startReview(a)} className="p-3 bg-white text-slate-400 rounded-2xl border border-slate-100 hover:text-indigo-600 hover:border-indigo-100 transition-all">
                                <LayoutGrid className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
                        <History className="w-12 h-12 mb-4 opacity-20" />
                        <p className="font-bold">No sessions yet.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-4">
                  <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                    <h3 className="text-3xl font-black mb-4 tracking-tight leading-tight">Master Your Exams</h3>
                    <p className="text-slate-400 mb-10 text-sm font-medium">AI generated tests with deep explanations.</p>
                    <button 
                      onClick={() => setActiveView('quiz')}
                      disabled={questions.length === 0}
                      className="group/btn w-full py-5 rounded-[1.5rem] font-black flex items-center justify-center gap-3 transition-all duration-300 bg-white text-slate-900 hover:bg-indigo-50 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Start Smart Test
                      <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'upload' && <PDFProcessor onQuestionsExtracted={handleQuestionsExtracted} />}
          {activeView === 'analyze' && <AnalyzePhoto onQuestionCaptured={handleCaptureSingle} />}
          {activeView === 'question-detail' && selectedQuestion && <QuestionDetail question={selectedQuestion} onBack={backToLibrary} />}

          {activeView === 'library' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Question Bank</h2>
                <div className="relative flex-1 max-w-md w-full">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search bank..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-sm font-medium"
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
                      <div key={q.id} className="bg-white p-8 rounded-[2rem] border border-slate-200/60 hover:border-indigo-200 transition-all duration-300 group">
                        <div className="flex items-start justify-between gap-6">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-5">
                              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-full uppercase tracking-widest border border-indigo-100">
                                {q.category || "General"}
                              </span>
                              <button 
                                onClick={() => openQuestionDetail(q)}
                                className="px-3 py-1 bg-slate-50 text-slate-400 text-[10px] font-black rounded-full uppercase tracking-widest hover:text-indigo-600 transition-colors flex items-center gap-1.5"
                              >
                                <ExternalLink className="w-3 h-3" /> SEO Page
                              </button>
                            </div>
                            
                            <h3 className="text-xl font-bold text-slate-800 mb-8 leading-relaxed whitespace-pre-wrap">{q.question}</h3>

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
                                  <div key={i} onClick={() => !isRevealed && handleLibraryOptionClick(q.id, i)} className={`px-6 py-4 rounded-2xl text-sm border transition-all duration-200 flex items-center gap-4 ${cardStyle}`}>
                                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all ${isRevealed && isCorrect ? 'bg-emerald-500 text-white' : isRevealed && isSelected ? 'bg-rose-500 text-white' : 'bg-white text-slate-400 shadow-sm'}`}>
                                      {String.fromCharCode(65 + i)}
                                    </span>
                                    <span className="flex-1 leading-tight">{opt}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => handleSearchFacts(q)} disabled={isSearching} className="p-3.5 rounded-2xl bg-slate-50 text-slate-400 hover:text-emerald-600 transition-all">
                              {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Globe className="w-5 h-5" />}
                            </button>
                            <button onClick={() => toggleReveal(q.id)} className={`p-3.5 rounded-2xl transition-all ${isRevealed ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                              {isRevealed ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                            <button onClick={() => setQuestions(questions.filter(item => item.id !== q.id))} className="p-3.5 bg-slate-50 text-slate-400 hover:text-rose-600 rounded-2xl transition-all">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {searchResult && (
                          <div className="mt-8 p-8 bg-emerald-50/50 rounded-[2.5rem] border border-emerald-100/50 relative animate-in slide-in-from-top-2">
                            <button onClick={() => dismissSearchResult(q.id)} className="absolute top-6 right-6 p-2 hover:bg-white rounded-full text-emerald-600"><X className="w-4 h-4" /></button>
                            <div className="bg-white/60 rounded-3xl p-8 mb-8">{formatMarkdown(searchResult.text)}</div>
                            {searchResult.sources.length > 0 && (
                              <div className="flex flex-wrap gap-3">
                                {searchResult.sources.map((src, i) => (
                                  <a key={i} href={src.uri} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-5 py-2.5 bg-white border border-emerald-200 rounded-[1.25rem] text-xs font-bold text-emerald-700 hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
                                    {src.title || "Reference"} <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border border-dashed border-slate-200">
                  <Library className="w-16 h-16 text-slate-100 mb-6" />
                  <p className="text-slate-400 font-bold">Question Bank is empty.</p>
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
                  <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Ready for a challenge?</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12">
                    {[5, 10, 20].map(num => (
                      <button key={num} onClick={() => startQuiz(num)} disabled={questions.length < num} className="p-6 bg-slate-50 border border-slate-200 text-slate-700 rounded-[2rem] font-black hover:border-indigo-500 hover:text-indigo-600 transition-all">
                        <div className="text-3xl mb-1">{num}</div>
                        <div className="text-[10px] uppercase tracking-widest">Items</div>
                      </button>
                    ))}
                    {questions.length > 0 && (
                      <button onClick={() => startQuiz(questions.length)} className="p-6 bg-indigo-600 text-white rounded-[2rem] font-black hover:bg-indigo-700 shadow-xl transition-all">
                        <div className="text-3xl mb-1">∞</div>
                        <div className="text-[10px] uppercase tracking-widest">All</div>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeView === 'review' && currentReviewAttempt && (
            <QuizView questions={selectedQuestions} onFinish={() => {}} reviewMode={true} attemptData={currentReviewAttempt} onExitReview={() => setActiveView('dashboard')} />
          )}

          {activeView === 'results' && attempts.length > 0 && (
            <div className="animate-in zoom-in-95 duration-700 max-w-3xl mx-auto bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden p-16 text-center">
                <Trophy className="w-20 h-20 text-indigo-600 mx-auto mb-8" />
                <h2 className="text-5xl font-black mb-16">Test Complete!</h2>
                <div className="flex justify-center gap-20 mb-16">
                  <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Score</p><p className="text-6xl font-black">{attempts[0].score}/{attempts[0].totalQuestions}</p></div>
                  <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Accuracy</p><p className="text-6xl font-black text-indigo-600">{Math.round((attempts[0].score / attempts[0].totalQuestions) * 100)}%</p></div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => startReview(attempts[0])} className="flex-1 py-5 bg-slate-100 rounded-2xl font-black flex items-center justify-center gap-3"><LayoutGrid className="w-6 h-6" /> Review</button>
                  <button onClick={() => setActiveView('dashboard')} className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-black">Dashboard</button>
                </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
};

const StatCard: React.FC<{icon: any, label: string, value: string | number, sub: string, color: string, bgColor: string}> = ({icon: Icon, label, value, sub, color, bgColor}) => (
  <div className="group bg-white p-7 rounded-[2rem] border border-slate-200/60 shadow-sm hover:shadow-2xl transition-all duration-300">
    <div className={`p-4 rounded-2xl ${bgColor} ${color} mb-6 inline-block`}><Icon className="w-7 h-7" /></div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-3xl font-black text-slate-900 tracking-tight mb-2">{value}</p>
    <p className="text-xs font-bold text-slate-400">{sub}</p>
  </div>
);

export default App;
