
import React, { useState } from 'react';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, Calendar, GraduationCap, Clock } from 'lucide-react';
import { extractMCQsFromDocument } from '../services/gemini';
import { Question } from '../types';

interface PDFProcessorProps {
  onQuestionsExtracted: (questions: Question[]) => void;
}

const PDFProcessor: React.FC<PDFProcessorProps> = ({ onQuestionsExtracted }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Metadata fields
  const [subject, setSubject] = useState('');
  const [year, setYear] = useState('');
  const [examDate, setExamDate] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

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
          // Tag extracted questions with metadata
          const taggedQuestions = extracted.map(q => ({
            ...q,
            subject: subject || undefined,
            year: year || undefined,
            examDate: examDate || undefined
          }));
          onQuestionsExtracted(taggedQuestions);
          // Reset form
          setFile(null);
          setSubject('');
          setYear('');
          setExamDate('');
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
    <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Upload MCQ Document</h2>
        <p className="text-slate-500">Add metadata to help organize your question bank.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Upload Area */}
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl p-8 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative group h-full min-h-[300px]">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          {file ? (
            <div className="flex flex-col items-center gap-3">
              <div className="bg-indigo-100 p-4 rounded-full">
                <FileText className="w-8 h-8 text-indigo-600" />
              </div>
              <p className="font-semibold text-slate-800 text-center">{file.name}</p>
              <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              <button onClick={() => setFile(null)} className="text-xs text-rose-500 font-bold hover:underline mt-2">Change File</button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="bg-slate-200 p-4 rounded-full group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                <Upload className="w-8 h-8 text-slate-500" />
              </div>
              <p className="font-semibold text-slate-800">Click to select PDF</p>
              <p className="text-xs text-slate-500 text-center">Only PDF files are supported for bulk extraction</p>
            </div>
          )}
        </div>

        {/* Metadata Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-slate-400" /> Subject / Exam Name
            </label>
            <input
              type="text"
              placeholder="e.g. Modern History, NEET 2024"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" /> Year
              </label>
              <input
                type="text"
                placeholder="e.g. 2023"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" /> Exam Date
              </label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>
          <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
            <p className="text-xs text-indigo-700 leading-relaxed font-medium">
              Metadata helps you filter and search your questions later in the library. Subject and Year will be used as tags.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-6 flex items-center gap-3 bg-red-50 text-red-700 p-4 rounded-2xl border border-red-100">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <button
        onClick={processFile}
        disabled={!file || isProcessing}
        className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
          !file || isProcessing
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
        }`}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Gemini is Extracting Questions...
          </>
        ) : (
          <>
            <CheckCircle className="w-5 h-5" />
            Extract & Tag MCQs
          </>
        )}
      </button>
    </div>
  );
};

export default PDFProcessor;
