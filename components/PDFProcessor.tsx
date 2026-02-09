
import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, Calendar, Tag, ChevronDown, X, Plus } from 'lucide-react';
import { extractMCQsFromDocument } from '../services/gemini';
import { Question } from '../types';

interface PDFProcessorProps {
  onQuestionsExtracted: (questions: Question[]) => void;
}

const COMMON_TAGS = [
  "NEET", "JEE Main", "JEE Advanced", "UPSC", "GATE", "SAT", "MCAT", 
  "Physics", "Chemistry", "Biology", "Mathematics", "Organic Chemistry", 
  "Inorganic Chemistry", "History", "Geography", "Civics", "Economics",
  "Computer Science", "General Knowledge", "English Literature"
];

const PDFProcessor: React.FC<PDFProcessorProps> = ({ onQuestionsExtracted }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Tag fields
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Metadata fields
  const [examMonth, setExamMonth] = useState('January');
  const [examYear, setExamYear] = useState(new Date().getFullYear().toString());

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Handle outside clicks to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) && 
          tagInputRef.current && !tagInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const addTag = (tag: string) => {
    const cleanTag = tag.trim();
    if (cleanTag && !tags.includes(cleanTag)) {
      setTags([...tags, cleanTag]);
    }
    setTagInput('');
    setShowSuggestions(false);
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const filteredSuggestions = COMMON_TAGS.filter(
    s => s.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(s)
  ).slice(0, 5);

  const processFile = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const extracted = await extractMCQsFromDocument(base64, file.type);
        
        if (extracted.length === 0) {
          setError("No MCQs could be extracted. Please ensure the file contains valid multiple-choice questions.");
        } else {
          const formattedExamDate = `${examMonth} ${examYear}`;
          const tagString = tags.join(', ');
          
          const taggedQuestions = extracted.map(q => ({
            ...q,
            subject: tagString || undefined,
            examDate: formattedExamDate
          }));
          onQuestionsExtracted(taggedQuestions);
          
          setFile(null);
          setTags([]);
          setExamMonth('January');
          setExamYear(new Date().getFullYear().toString());
        }
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("An unexpected error occurred during processing.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-slate-900 mb-2">Upload MCQ Document</h2>
        <p className="text-slate-500 font-medium">Bulk extract questions and tag them for your library.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
        {/* Upload Area */}
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[2.5rem] p-10 bg-slate-50/50 hover:bg-indigo-50/30 hover:border-indigo-200 transition-all cursor-pointer relative group h-full min-h-[350px]">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />
          {file ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="bg-indigo-600 p-5 rounded-3xl shadow-xl shadow-indigo-100 animate-in zoom-in duration-300">
                <FileText className="w-10 h-10 text-white" />
              </div>
              <div>
                <p className="font-black text-slate-900 text-lg mb-1">{file.name}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{(file.size / 1024 / 1024).toFixed(2)} MB • PDF Document</p>
              </div>
              <button onClick={() => setFile(null)} className="text-sm text-indigo-600 font-black hover:underline mt-4 relative z-20">Change Selection</button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 group-hover:scale-110 group-hover:shadow-indigo-100 transition-all">
                <Upload className="w-10 h-10 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </div>
              <div>
                <p className="font-black text-slate-900 text-lg mb-1">Select PDF Source</p>
                <p className="text-sm font-medium text-slate-400">Drag and drop or click to browse</p>
              </div>
            </div>
          )}
        </div>

        {/* Metadata Form */}
        <div className="space-y-6 flex flex-col justify-center">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-indigo-500" /> Subject & Exam Tags
            </label>
            
            <div className="flex flex-wrap gap-2 p-2 min-h-[56px] rounded-2xl border border-slate-200 bg-white focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500 transition-all">
              {tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold animate-in zoom-in duration-200 shadow-sm">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:bg-white/20 p-0.5 rounded-full transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                ref={tagInputRef}
                type="text"
                value={tagInput}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                placeholder={tags.length === 0 ? "e.g. Physics, NEET..." : ""}
                className="flex-1 min-w-[120px] px-2 py-1.5 bg-transparent border-none outline-none text-slate-900 font-bold placeholder:font-medium placeholder:text-slate-300"
              />
            </div>

            {showSuggestions && tagInput && filteredSuggestions.length > 0 && (
              <div ref={suggestionsRef} className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                <div className="p-2 border-b border-slate-50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 py-1">Suggestions</p>
                </div>
                <div className="max-h-[200px] overflow-y-auto">
                  {filteredSuggestions.map(suggestion => (
                    <button
                      key={suggestion}
                      onClick={() => addTag(suggestion)}
                      className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-between transition-colors"
                    >
                      {suggestion}
                      <Plus className="w-4 h-4 opacity-30" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Exam Date (Month & Year)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <select
                  value={examMonth}
                  onChange={(e) => setExamMonth(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold appearance-none cursor-pointer pr-10"
                >
                  {months.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              <input
                type="number"
                min="1990"
                max="2100"
                value={examYear}
                onChange={(e) => setExamYear(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-8 flex items-center gap-4 bg-rose-50 text-rose-700 p-5 rounded-[2rem] border border-rose-100 animate-in shake duration-500">
          <div className="bg-rose-100 p-2 rounded-xl"><AlertCircle className="w-5 h-5" /></div>
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      <button
        onClick={processFile}
        disabled={!file || isProcessing}
        className={`w-full py-5 rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 transition-all ${
          !file || isProcessing
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed scale-[0.98]'
            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xl shadow-indigo-200 hover:scale-[1.01] active:scale-[0.99]'
        }`}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            Gemini is Extracting Questions...
          </>
        ) : (
          <>
            <CheckCircle className="w-6 h-6" />
            Extract & Organize MCQs
          </>
        )}
      </button>
    </div>
  );
};

export default PDFProcessor;
