
import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, HelpCircle, Share2, Copy, ExternalLink, BrainCircuit } from 'lucide-react';
import { Question } from '../types';

interface QuestionDetailProps {
  question: Question;
  onBack: () => void;
}

const QuestionDetail: React.FC<QuestionDetailProps> = ({ question, onBack }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Dynamically update SEO metadata
    document.title = `${question.question.slice(0, 60)}... | MCQ Mastery AI`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', `Learn the answer and explanation for: ${question.question.slice(0, 150)}`);
    }

    // Canonical link for Google indexation
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.href);
  }, [question]);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={onBack}
        className="mb-8 flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        Back to Library
      </button>

      <article className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden">
        <div className="p-10 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-full uppercase tracking-widest border border-indigo-100">
              {question.category || "General"}
            </span>
            {question.subject && (
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-full uppercase tracking-widest border border-emerald-100">
                {question.subject}
              </span>
            )}
            <span className="ml-auto text-xs text-slate-400 font-bold flex items-center gap-2">
              ID: {question.id}
            </span>
          </div>

          <h1 className="text-3xl font-black text-slate-900 leading-tight mb-10 whitespace-pre-wrap">
            {question.question}
          </h1>

          <div className="grid grid-cols-1 gap-4 mb-8">
            {question.options.map((opt, i) => {
              const isCorrect = i === question.correctAnswerIndex;
              return (
                <div 
                  key={i}
                  className={`p-6 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                    showAnswer && isCorrect 
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                      : 'bg-slate-50 border-slate-100 text-slate-700'
                  }`}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                    showAnswer && isCorrect ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 shadow-sm'
                  }`}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="font-medium">{opt}</span>
                  {showAnswer && isCorrect && <CheckCircle2 className="w-6 h-6 ml-auto" />}
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button 
              onClick={() => setShowAnswer(!showAnswer)}
              className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 ${
                showAnswer ? 'bg-slate-900 text-white' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700'
              }`}
            >
              <BrainCircuit className="w-5 h-5" />
              {showAnswer ? 'Hide Correct Answer' : 'Show Correct Answer'}
            </button>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button 
                onClick={handleCopy}
                className="flex-1 sm:flex-none p-4 rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all flex items-center justify-center gap-2 font-bold text-sm"
              >
                {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                {copied ? 'Copied' : 'Copy URL'}
              </button>
              <button className="flex-1 sm:flex-none p-4 rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {showAnswer && (
          <div className="p-10 bg-indigo-50/50 animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3 mb-6 text-indigo-700">
              <HelpCircle className="w-6 h-6" />
              <h2 className="text-xl font-black tracking-tight">Logical Explanation</h2>
            </div>
            <div className="prose prose-indigo max-w-none text-indigo-900 leading-relaxed font-medium">
              {question.explanation.split('\n').map((p, i) => (
                <p key={i} className="mb-4 last:mb-0">{p}</p>
              ))}
            </div>
          </div>
        )}
      </article>

      <footer className="mt-12 text-center">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mb-4">You might also be interested in</p>
        <div className="flex flex-wrap justify-center gap-4">
          <button onClick={onBack} className="text-sm font-black text-indigo-600 hover:underline">Full Question Bank</button>
          <span className="text-slate-200">|</span>
          <button className="text-sm font-black text-indigo-600 hover:underline">Start Random Quiz</button>
        </div>
      </footer>
    </div>
  );
};

export default QuestionDetail;
