
import React, { useState, useMemo } from 'react';
import { 
  Brain, 
  ArrowRight, 
  ArrowLeft, 
  Send, 
  Sparkles, 
  Loader2, 
  Bookmark, 
  BookmarkCheck,
  LayoutGrid,
  ChevronRight,
  ChevronLeft,
  XCircle,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { Question, QuizAttempt } from '../types';
import { getDeepExplanation } from '../services/gemini';

interface QuizViewProps {
  questions: Question[];
  onFinish: (attempt: QuizAttempt) => void;
  reviewMode?: boolean;
  attemptData?: QuizAttempt;
  onExitReview?: () => void;
}

const QuizView: React.FC<QuizViewProps> = ({ 
  questions, 
  onFinish, 
  reviewMode = false, 
  attemptData,
  onExitReview 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>(attemptData?.answers || {});
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [deepExplanation, setDeepExplanation] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  // Real-time stats
  const stats = useMemo(() => {
    const attempted = Object.keys(userAnswers).length;
    return {
      total: questions.length,
      attempted: attempted,
      notAttempted: questions.length - attempted,
      marked: markedForReview.size
    };
  }, [userAnswers, markedForReview, questions.length]);

  const handleSelect = (index: number) => {
    if (reviewMode) return; // Cannot change answers in review mode
    
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: index
    }));
  };

  const toggleMarkForReview = () => {
    if (reviewMode) return;
    setMarkedForReview(prev => {
      const next = new Set(prev);
      if (next.has(currentQuestion.id)) next.delete(currentQuestion.id);
      else next.add(currentQuestion.id);
      return next;
    });
  };

  const jumpToQuestion = (index: number) => {
    setCurrentIndex(index);
    setDeepExplanation(null);
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      jumpToQuestion(currentIndex + 1);
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      jumpToQuestion(currentIndex - 1);
    }
  };

  const handleDeepThink = async () => {
    setIsThinking(true);
    try {
      const explanation = await getDeepExplanation(currentQuestion);
      setDeepExplanation(explanation);
    } finally {
      setIsThinking(false);
    }
  };

  const handleSubmit = () => {
    let score = 0;
    questions.forEach(q => {
      if (userAnswers[q.id] === q.correctAnswerIndex) score++;
    });

    onFinish({
      id: `attempt-${Date.now()}`,
      date: new Date().toISOString(),
      score,
      totalQuestions: questions.length,
      answers: userAnswers
    });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto py-8 px-4">
      {/* Sidebar - Question Navigator */}
      <aside className="w-full lg:w-80 order-1 lg:order-2">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm sticky top-8 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-indigo-600" />
                {reviewMode ? 'Review Result' : 'Test Navigator'}
              </h3>
              {reviewMode && onExitReview && (
                <button 
                  onClick={onExitReview}
                  className="p-2 hover:bg-slate-200 rounded-full text-slate-500"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {reviewMode ? 'Score' : 'Attempted'}
                </p>
                <p className={`text-xl font-black ${reviewMode ? 'text-indigo-600' : 'text-emerald-600'}`}>
                  {reviewMode ? `${attemptData?.score}/${attemptData?.totalQuestions}` : stats.attempted}
                </p>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {reviewMode ? 'Result' : 'Remaining'}
                </p>
                <p className="text-xl font-black text-slate-400">
                  {reviewMode ? `${Math.round((attemptData!.score / attemptData!.totalQuestions) * 100)}%` : stats.notAttempted}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAttempted = userAnswers[q.id] !== undefined;
                const isMarked = markedForReview.has(q.id);
                const isCorrect = userAnswers[q.id] === q.correctAnswerIndex;
                
                let bgColor = "bg-slate-50 text-slate-400 border-slate-200 hover:border-indigo-300";
                
                if (reviewMode) {
                   if (!isAttempted) bgColor = "bg-slate-100 text-slate-400 border-slate-200";
                   else if (isCorrect) bgColor = "bg-emerald-500 text-white border-emerald-500";
                   else bgColor = "bg-rose-500 text-white border-rose-500";
                } else {
                   if (isAttempted) bgColor = "bg-emerald-500 text-white border-emerald-500";
                   if (isMarked) bgColor = "bg-amber-500 text-white border-amber-500";
                }
                
                return (
                  <button
                    key={q.id}
                    onClick={() => jumpToQuestion(idx)}
                    className={`aspect-square rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-center ${bgColor} ${
                      isCurrent ? 'ring-4 ring-indigo-500/20 border-indigo-600 scale-110 z-10' : ''
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-8 space-y-2">
              {reviewMode ? (
                <>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <div className="w-3 h-3 rounded bg-emerald-500" /> Correct
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <div className="w-3 h-3 rounded bg-rose-500" /> Incorrect
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <div className="w-3 h-3 rounded bg-slate-100 border border-slate-200" /> Unattempted
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <div className="w-3 h-3 rounded bg-emerald-500" /> Attempted
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <div className="w-3 h-3 rounded bg-amber-500" /> Marked for Review
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <div className="w-3 h-3 rounded bg-slate-100 border border-slate-200" /> Unattempted
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100">
            {reviewMode ? (
              <button
                onClick={onExitReview}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 shadow-xl transition-all flex items-center justify-center gap-2"
              >
                Exit Review
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 transition-all"
              >
                <Send className="w-4 h-4" />
                Finish Test
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Quiz Area */}
      <div className="flex-1 order-2 lg:order-1 min-w-0">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden transition-all duration-300">
          <div className="p-6 sm:p-10">
            <div className="flex items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <span className="px-4 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-black rounded-full uppercase tracking-widest border border-indigo-100">
                  Question {currentIndex + 1}
                </span>
                <span className="px-4 py-1.5 bg-slate-50 text-slate-500 text-xs font-bold rounded-full border border-slate-100">
                  {currentQuestion.category || "General"}
                </span>
              </div>
              
              {!reviewMode && (
                <button
                  onClick={toggleMarkForReview}
                  className={`p-3 rounded-2xl border transition-all flex items-center gap-2 font-bold text-sm ${
                    markedForReview.has(currentQuestion.id)
                      ? 'bg-amber-50 border-amber-500 text-amber-600 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-400 hover:text-amber-500 hover:border-amber-300'
                  }`}
                >
                  {markedForReview.has(currentQuestion.id) ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                  <span className="hidden sm:inline">Review Later</span>
                </button>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-8 leading-relaxed whitespace-pre-wrap">
              {currentQuestion.question}
            </h2>

            <div className="space-y-4 mb-10">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = userAnswers[currentQuestion.id] === idx;
                const isCorrect = idx === currentQuestion.correctAnswerIndex;
                
                let style = "bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-white";
                
                if (isSelected && !reviewMode) {
                  style = "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100 scale-[1.02]";
                }
                
                if (reviewMode) {
                  if (isCorrect) {
                    style = "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100 scale-[1.02]";
                  } else if (isSelected) {
                    style = "bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-100";
                  } else {
                    style = "bg-slate-50 border-slate-100 text-slate-400 opacity-60";
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    className={`w-full p-5 rounded-2xl border-2 text-left transition-all flex items-center gap-4 group ${style}`}
                  >
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm transition-all ${
                      isSelected || (reviewMode && isCorrect)
                        ? 'bg-white/20 text-white' 
                        : 'bg-white text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1 font-medium">{option}</span>
                    {reviewMode && isCorrect && <CheckCircle2 className="w-6 h-6 text-white" />}
                    {reviewMode && isSelected && !isCorrect && <XCircle className="w-6 h-6 text-white" />}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-8 mt-auto">
              <div className="flex items-center gap-2">
                <button
                  onClick={prevQuestion}
                  disabled={currentIndex === 0}
                  className="p-4 rounded-2xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextQuestion}
                  disabled={currentIndex === questions.length - 1}
                  className="p-4 rounded-2xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                {reviewMode && (
                  <button
                    onClick={handleDeepThink}
                    disabled={isThinking}
                    className="px-6 py-4 bg-indigo-50 text-indigo-700 rounded-2xl font-bold hover:bg-indigo-100 transition-colors flex items-center gap-2"
                  >
                    {isThinking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    <span className="hidden sm:inline">Deep Dive</span>
                  </button>
                )}

                {!reviewMode && isLastQuestion ? (
                  <button
                    onClick={handleSubmit}
                    className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 shadow-xl shadow-emerald-100 flex items-center gap-2 transition-all"
                  >
                    <Send className="w-5 h-5" />
                    Finish Test
                  </button>
                ) : (
                  <button
                    onClick={nextQuestion}
                    className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 flex items-center gap-2 transition-all"
                  >
                    Next Question
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {(reviewMode || (reviewMode && deepExplanation)) && (
            <div className="bg-indigo-50 p-10 border-t border-indigo-100 animate-in slide-in-from-bottom duration-500">
              <div className="flex items-center gap-2 text-indigo-700 mb-4">
                <HelpCircle className="w-5 h-5" />
                <h4 className="font-bold">Explanation</h4>
              </div>
              <div className="prose prose-indigo max-w-none text-indigo-900 leading-relaxed opacity-90">
                {deepExplanation ? (
                  deepExplanation.split('\n').map((para, i) => (
                    <p key={i} className="mb-2">{para}</p>
                  ))
                ) : (
                  <p>{currentQuestion.explanation || "No static explanation provided. Use 'Deep Dive' for AI analysis."}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizView;
