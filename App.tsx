
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
  ShieldCheck
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

  // Simple Markdown formatter for Gemini output
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

      return (
        <p key={idx} className="text-emerald-900/80 leading-relaxed mb-3 text-sm">
          {content}
        </p>
      );
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
      {isAdmin && activeView === 'dashboard' && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3">
          <ShieldCheck className="text-amber-600 w-6 h-6" />
          <div>
            <p className="font-bold text-amber-900">Admin Mode Active</p>
            <p className="text-sm text-amber-700">You have access to PDF uploads and photo analysis.</p>
          </div>
        </div>
      )}

      {activeView === 'dashboard' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard icon={BookOpen} label="Questions Bank" value={stats.totalQuestions} color="bg-indigo-600" />
            <StatCard icon={History} label="Tests Taken" value={stats.totalTests} color="bg-purple-600" />
            <StatCard icon={BarChart2} label="Average Score" value={`${stats.avgScore}%`} color="bg-emerald-600" />
            <StatCard icon={Trophy} label="Best Score" value={`${stats.bestScore}%`} color="bg-amber-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-3xl border border-slate-200">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <History className="text-slate-400" /> Recent Activity
                </h3>
                {attempts.length > 0 ? (
                  <div className="space-y-4">
                    {attempts.slice(0, 5).map(a => (
                      <div key={a.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl text-white ${a.score / a.totalQuestions >= 0.7 ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">Test Attempt #{a.id.slice(-4)}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(a.date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-lg font-black text-slate-900">{a.score}/{a.totalQuestions}</p>
                            <p className="text-xs font-bold text-slate-500">{Math.round((a.score / a.totalQuestions) * 100)}%</p>
                          </div>
                          <button 
                            onClick={() => startReview(a)}
                            className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                          >
                            <LayoutGrid className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No tests taken yet. Start by {isAdmin ? 'uploading questions!' : 'requesting questions from admin!'}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-100">
                <BrainCircuit className="w-10 h-10 mb-6 opacity-80" />
                <h3 className="text-2xl font-bold mb-3">Ready to Study?</h3>
                <p className="text-indigo-100 mb-8 text-sm leading-relaxed">
                  Generate a randomized test from your question bank and let Gemini guide your learning with deep logic thinking.
                </p>
                <button 
                  onClick={() => setActiveView('quiz')}
                  disabled={questions.length === 0}
                  className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                    questions.length === 0 
                      ? 'bg-white/10 text-white/40 cursor-not-allowed' 
                      : 'bg-white text-indigo-700 hover:bg-indigo-50 shadow-lg'
                  }`}
                >
                  Quick Start Test
                  <ArrowRight className="w-5 h-5" />
                </button>
                {questions.length === 0 && (
                  <p className="text-center mt-4 text-xs font-medium text-white/60">No questions available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
            <h2 className="text-2xl font-bold text-slate-900">Question Bank</h2>
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search questions, subjects, or years..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {filteredQuestions.map((q) => {
              const isRevealed = revealedIds.has(q.id);
              const selectedIdx = selectedInLibrary[q.id];
              const isSearching = searchingIds.has(q.id);
              const searchResult = searchResultData[q.id];

              return (
                <div key={q.id} className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-indigo-200 transition-all group relative">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded uppercase tracking-tighter">
                          {q.category || "General"}
                        </span>
                        {q.subject && (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded uppercase tracking-tighter flex items-center gap-1">
                            <GraduationCap className="w-3 h-3" /> {q.subject}
                          </span>
                        )}
                        {q.year && (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded uppercase tracking-tighter flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {q.year}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-slate-800 font-semibold mb-6 leading-relaxed whitespace-pre-wrap">
                        {q.question}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        {q.options.map((opt, i) => {
                          const isCorrect = i === q.correctAnswerIndex;
                          const isSelected = selectedIdx === i;
                          
                          let cardStyle = "bg-slate-50 border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-white cursor-pointer";
                          if (isRevealed) {
                            if (isCorrect) cardStyle = "bg-emerald-50 border-emerald-500 text-emerald-700 font-bold cursor-default";
                            else if (isSelected) cardStyle = "bg-rose-50 border-rose-500 text-rose-700 font-bold cursor-default";
                            else cardStyle = "bg-slate-50 border-slate-200 text-slate-400 opacity-60 cursor-default";
                          }

                          return (
                            <div 
                              key={i} 
                              onClick={() => !isRevealed && handleLibraryOptionClick(q.id, i)}
                              className={`px-4 py-3 rounded-xl text-sm border transition-all ${cardStyle}`}
                            >
                              <span className={`font-bold mr-2 ${isRevealed && isCorrect ? 'text-emerald-500' : 'text-slate-400'}`}>
                                {String.fromCharCode(65 + i)}.
                              </span>
                              {opt}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleSearchFacts(q)}
                        disabled={isSearching}
                        className={`p-3 rounded-xl transition-colors ${isSearching ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'}`}
                        title="Google Search Facts"
                      >
                        {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Globe className="w-5 h-5" />}
                      </button>
                      <button 
                        onClick={() => toggleReveal(q.id)}
                        className={`p-3 rounded-xl transition-colors ${isRevealed ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        title={isRevealed ? "Hide Answer" : "Show Answer"}
                      >
                        {isRevealed ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                      {isAdmin && (
                        <button 
                          onClick={() => {
                            setQuestions(questions.filter(item => item.id !== q.id));
                          }}
                          className="p-3 bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors"
                          title="Delete Question"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {searchResult && (
                    <div className="mt-6 p-6 bg-gradient-to-br from-emerald-50/80 to-teal-50/80 rounded-[2rem] border border-emerald-100 shadow-sm animate-in zoom-in-95 slide-in-from-top-4 duration-500 relative">
                      <button 
                        onClick={() => dismissSearchResult(q.id)}
                        className="absolute top-4 right-4 p-1.5 hover:bg-emerald-100 rounded-full text-emerald-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-200">
                          <Globe className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em] mb-0.5">Fact Verification</p>
                          <h4 className="text-base font-bold text-slate-800">Google Search Insights</h4>
                        </div>
                      </div>
                      <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-6 border border-white/60 mb-6">
                        {formatMarkdown(searchResult.text)}
                      </div>
                      {searchResult.sources.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Verified Sources</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {searchResult.sources.map((src, i) => (
                              <a 
                                key={i} 
                                href={src.uri} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="group inline-flex items-center gap-2 px-4 py-2 bg-white border border-emerald-200/60 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all duration-300 shadow-sm"
                              >
                                {src.title || "Reference Link"} 
                                <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {isRevealed && q.explanation && !searchResult && (
                    <div className="mt-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-sm text-indigo-900 animate-in slide-in-from-top-2 duration-300">
                      <p className="font-bold mb-1 flex items-center gap-1">
                        <BrainCircuit className="w-4 h-4" /> Explanation:
                      </p>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeView === 'quiz' && (
        <div className="animate-in slide-in-from-bottom duration-500">
          {selectedQuestions.length > 0 ? (
            <QuizView questions={selectedQuestions} onFinish={handleQuizFinish} />
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center">
              <BrainCircuit className="w-16 h-16 mx-auto mb-6 text-indigo-500" />
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Start New Test</h2>
              <p className="text-slate-500 mb-8 max-w-sm mx-auto">Choose how many questions you want to tackle from your bank.</p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                {[5, 10, 20].map(num => (
                  <button
                    key={num}
                    onClick={() => startQuiz(num)}
                    disabled={questions.length < num}
                    className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900"
                  >
                    {num} Questions
                  </button>
                ))}
                {questions.length > 0 && (
                   <button
                    onClick={() => startQuiz(questions.length)}
                    className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100"
                  >
                    All {questions.length} Questions
                  </button>
                )}
              </div>
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
          <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-12 text-center text-white">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/20 backdrop-blur-md mb-6 animate-bounce">
                <Trophy className="w-12 h-12" />
              </div>
              <h2 className="text-4xl font-black mb-2">Test Completed!</h2>
              <p className="text-indigo-100 font-medium opacity-80">Great job on finishing the session.</p>
            </div>
            <div className="p-12 text-center">
              <div className="flex items-center justify-center gap-12 mb-12">
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Score</p>
                  <p className="text-5xl font-black text-slate-900">{attempts[0].score}/{attempts[0].totalQuestions}</p>
                </div>
                <div className="w-px h-16 bg-slate-100" />
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Percentage</p>
                  <p className="text-5xl font-black text-indigo-600">{Math.round((attempts[0].score / attempts[0].totalQuestions) * 100)}%</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                  onClick={() => startReview(attempts[0])}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  <LayoutGrid className="w-5 h-5" />
                  Review Answers
                </button>
                <button 
                  onClick={() => {
                    setSelectedQuestions([]);
                    setActiveView('quiz');
                  }}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100"
                >
                  Take Another Test
                </button>
              </div>
              <button 
                onClick={() => setActiveView('dashboard')}
                className="mt-4 w-full py-3 text-slate-500 font-bold hover:text-indigo-600 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

const StatCard: React.FC<{icon: any, label: string, value: string | number, color: string}> = ({icon: Icon, label, value, color}) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
    <div className={`p-3 rounded-2xl text-white ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-black text-slate-900">{value}</p>
    </div>
  </div>
);

export default App;
