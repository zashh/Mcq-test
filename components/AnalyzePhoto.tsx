
import React, { useState, useRef } from 'react';
import { Camera, RefreshCw, Loader2, Sparkles, CheckCircle, Trash2 } from 'lucide-react';
import { analyzeImageQuestion } from '../services/gemini';
import { Question } from '../types';

interface AnalyzePhotoProps {
  onQuestionCaptured: (q: Question) => void;
}

const AnalyzePhoto: React.FC<AnalyzePhotoProps> = ({ onQuestionCaptured }) => {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedQuestion, setCapturedQuestion] = useState<Question | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setCapturedQuestion(null);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    const base64 = image.split(',')[1];
    const question = await analyzeImageQuestion(base64);
    if (question) {
      setCapturedQuestion(question);
    }
    setIsAnalyzing(false);
  };

  const handleReset = () => {
    setImage(null);
    setCapturedQuestion(null);
  };

  const saveToBank = () => {
    if (capturedQuestion) {
      onQuestionCaptured(capturedQuestion);
      handleReset();
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-8 border-b border-slate-100">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Analyze Question Photo</h2>
        <p className="text-slate-500">Snapped a photo of a textbook or test? Upload it here.</p>
      </div>

      <div className="p-8">
        {!image ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-3xl p-20 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              ref={fileInputRef}
              onChange={handleImageCapture}
              className="hidden" 
            />
            <div className="bg-indigo-100 p-6 rounded-full text-indigo-600 mb-4">
              <Camera className="w-10 h-10" />
            </div>
            <p className="font-bold text-slate-800 text-lg">Click to Take or Upload Photo</p>
            <p className="text-slate-500 mt-2">Works best for single questions</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="relative rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-slate-100 aspect-[4/3] flex items-center justify-center">
                <img src={image} alt="Capture" className="max-h-full max-w-full object-contain" />
                <button 
                  onClick={handleReset}
                  className="absolute top-4 right-4 bg-white/90 backdrop-blur p-3 rounded-2xl text-rose-600 shadow-lg hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50 shadow-xl shadow-indigo-100"
              >
                {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {isAnalyzing ? "Analyzing with Gemini..." : "Extract MCQ with AI"}
              </button>
            </div>

            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
              {capturedQuestion ? (
                <div className="animate-in fade-in slide-in-from-right duration-500">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-lg text-slate-900">Extracted Result</h3>
                    <div className="flex items-center gap-1 text-emerald-600 font-bold text-sm bg-emerald-50 px-3 py-1 rounded-full">
                      <CheckCircle className="w-4 h-4" /> Ready
                    </div>
                  </div>
                  
                  <p className="font-semibold text-slate-800 mb-4">{capturedQuestion.question}</p>
                  
                  <div className="space-y-2 mb-6">
                    {capturedQuestion.options.map((opt, i) => (
                      <div key={i} className={`p-3 rounded-xl border text-sm flex items-center gap-3 ${
                        i === capturedQuestion.correctAnswerIndex 
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                          : 'bg-white border-slate-100 text-slate-600'
                      }`}>
                        <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold shrink-0">
                          {String.fromCharCode(65 + i)}
                        </span>
                        {opt}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={saveToBank}
                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-xl shadow-emerald-100"
                  >
                    Save to Question Bank
                  </button>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <Brain className="w-12 h-12 mb-4" />
                  <p className="font-medium">AI analysis results will appear here</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Brain: React.FC<{className?: string}> = ({className}) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .52 8.245 4 4 0 0 0 7.837 1.117A3 3 0 1 0 12 5z" />
    <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.52 8.245 4 4 0 0 1-7.837 1.117A3 3 0 1 1 12 5z" />
  </svg>
);

export default AnalyzePhoto;
