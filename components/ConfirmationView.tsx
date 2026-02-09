
import React, { useState } from 'react';
import { Check, X, Code, List, Save, AlertTriangle, Edit3, Trash2, CheckCircle2 } from 'lucide-react';
import { Question } from '../types';

interface ConfirmationViewProps {
  questions: Question[];
  onConfirm: (finalQuestions: Question[]) => void;
  onCancel: () => void;
}

const ConfirmationView: React.FC<ConfirmationViewProps> = ({ questions: initialQuestions, onConfirm, onCancel }) => {
  const [viewMode, setViewMode] = useState<'list' | 'json'>('list');
  const [localQuestions, setLocalQuestions] = useState<Question[]>(initialQuestions);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleUpdateQuestion = (id: string, updates: Partial<Question>) => {
    setLocalQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const handleOptionChange = (id: string, optIndex: number, value: string) => {
    const q = localQuestions.find(item => item.id === id);
    if (!q) return;
    const newOptions = [...q.options];
    newOptions[optIndex] = value;
    handleUpdateQuestion(id, { options: newOptions });
  };

  const removeQuestion = (id: string) => {
    setLocalQuestions(prev => prev.filter(q => q.id !== id));
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500 max-w-5xl mx-auto mb-20">
      <div className="p-8 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Review & Refine</h2>
          <p className="text-slate-500 font-medium">Verify or edit {localQuestions.length} questions before saving.</p>
        </div>
        <div className="flex bg-white rounded-xl border border-slate-200 p-1 shrink-0">
          <button 
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <List className="w-4 h-4" /> List View
          </button>
          <button 
            onClick={() => setViewMode('json')}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'json' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Code className="w-4 h-4" /> Raw JSON
          </button>
        </div>
      </div>

      <div className="p-8 max-h-[65vh] overflow-y-auto bg-slate-50/30">
        {viewMode === 'list' ? (
          <div className="space-y-6">
            {localQuestions.map((q, idx) => {
              const isEditing = editingId === q.id;
              return (
                <div key={q.id} className={`bg-white p-6 rounded-[2rem] border transition-all duration-300 ${isEditing ? 'border-indigo-500 ring-4 ring-indigo-500/5 shadow-xl' : 'border-slate-100 shadow-sm'}`}>
                  <div className="flex items-start gap-4">
                    <span className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm shrink-0">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="space-y-6 animate-in fade-in duration-300">
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Question Text</label>
                            <textarea 
                              value={q.question}
                              onChange={(e) => handleUpdateQuestion(q.id, { question: e.target.value })}
                              className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold text-slate-800 transition-all min-h-[100px]"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Options (Mark correct with radio)</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {q.options.map((opt, i) => (
                                <div key={i} className="flex items-center gap-3">
                                  <input 
                                    type="radio" 
                                    name={`correct-${q.id}`} 
                                    checked={q.correctAnswerIndex === i}
                                    onChange={() => handleUpdateQuestion(q.id, { correctAnswerIndex: i })}
                                    className="w-5 h-5 accent-emerald-500 shrink-0"
                                  />
                                  <input 
                                    type="text" 
                                    value={opt}
                                    onChange={(e) => handleOptionChange(q.id, i, e.target.value)}
                                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none text-sm font-medium transition-all"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Explanation</label>
                            <textarea 
                              value={q.explanation}
                              placeholder="Add a logical explanation here..."
                              onChange={(e) => handleUpdateQuestion(q.id, { explanation: e.target.value })}
                              className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-medium text-slate-600 transition-all text-sm"
                            />
                          </div>

                          <div className="flex justify-end pt-2">
                            <button 
                              onClick={() => setEditingId(null)}
                              className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-black text-xs hover:bg-indigo-700 transition-all flex items-center gap-2"
                            >
                              <CheckCircle2 className="w-4 h-4" /> Save Edit
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-4">
                            <p className="font-bold text-slate-800 whitespace-pre-wrap pr-4">{q.question}</p>
                            <div className="flex items-center gap-2 shrink-0">
                              <button 
                                onClick={() => setEditingId(q.id)}
                                className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                                title="Edit Question"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => removeQuestion(q.id)}
                                className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                title="Remove Question"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                            {q.options.map((opt, i) => (
                              <div key={i} className={`px-4 py-3 rounded-xl border text-xs font-bold flex items-center gap-3 ${i === q.correctAnswerIndex ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm shadow-emerald-100' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] ${i === q.correctAnswerIndex ? 'bg-emerald-500 text-white' : 'bg-white text-slate-300 shadow-sm'}`}>
                                  {String.fromCharCode(65 + i)}
                                </span>
                                {opt}
                              </div>
                            ))}
                          </div>
                          {q.explanation && (
                            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">AI Explanation</p>
                              <p className="text-xs text-indigo-700/80 leading-relaxed line-clamp-2 italic font-medium">{q.explanation}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <pre className="bg-slate-900 text-indigo-300 p-8 rounded-[2.5rem] text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner border border-white/5">
            {JSON.stringify(localQuestions, null, 2)}
          </pre>
        )}
      </div>

      <div className="p-8 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3 text-amber-600 bg-amber-50 px-5 py-3 rounded-2xl border border-amber-100">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="text-xs font-bold">Review all changes. Saving will persist these to the system JSON file.</p>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button 
            onClick={onCancel}
            className="flex-1 sm:flex-none px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
          >
            Discard
          </button>
          <button 
            onClick={() => onConfirm(localQuestions)}
            disabled={editingId !== null}
            className="flex-1 sm:flex-none px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-2xl shadow-indigo-200 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" /> Save All to DB
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationView;
