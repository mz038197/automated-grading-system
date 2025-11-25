import React, { useState } from 'react';
import { Problem, SubmissionResult, GradingStatus } from '../types';
import { gradeCode } from '../services/geminiService';

interface ProblemCardProps {
  problem: Problem;
}

const ProblemCard: React.FC<ProblemCardProps> = ({ problem }) => {
  const [code, setCode] = useState<string>('# 在此撰寫你的 Python 程式碼\n\ndef solution():\n    pass');
  const [status, setStatus] = useState<GradingStatus>(GradingStatus.IDLE);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  
  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(problem.description);

  const handleSubmit = async () => {
    setStatus(GradingStatus.GRADING);
    setResult(null);
    try {
      // Use the potentially edited description for grading context
      const currentProblemContext = { ...problem, description };
      const gradingResult = await gradeCode(currentProblemContext, code);
      setResult(gradingResult);
      setStatus(GradingStatus.SUCCESS);
    } catch (error) {
      console.error(error);
      setStatus(GradingStatus.ERROR);
    }
  };

  const handleSaveDescription = () => {
    setIsEditing(false);
  };

  const handleCancelDescription = () => {
    setDescription(problem.description);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden mb-10 transition-shadow hover:shadow-lg">
      {/* Header / Problem Description */}
      <div className="p-8 border-b border-slate-100">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-lg shadow-sm">
                    {problem.id}
                </span>
                <h3 className="text-2xl font-bold text-slate-800">{problem.title}</h3>
            </div>
            
            {/* Edit Button */}
            {!isEditing && (
                <button 
                    onClick={() => setIsEditing(true)}
                    className="text-slate-400 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-blue-50"
                    title="編輯題目敘述"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                </button>
            )}
        </div>

        {/* Description Box */}
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200/60">
            {isEditing ? (
                <div className="animate-fadeIn">
                    <textarea 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full h-64 p-4 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm leading-relaxed"
                    />
                    <div className="flex justify-end gap-3 mt-3">
                        <button 
                            onClick={handleCancelDescription}
                            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                            取消
                        </button>
                        <button 
                            onClick={handleSaveDescription}
                            className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                        >
                            儲存修改
                        </button>
                    </div>
                </div>
            ) : (
                // Used Tailwind Typography (prose) for better Markdown rendering (Sample Input blocks, etc)
                <div className="prose prose-slate max-w-none text-slate-700 font-medium whitespace-pre-wrap break-words leading-7">
                    {/* Hacky way to handle newlines if not plain markdown, but usually prose handles blocks well */}
                     {description.split('\n').map((line, i) => (
                        <React.Fragment key={i}>
                            {line}
                            <br />
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* Code Editor Area */}
      <div className="p-0 bg-editor group">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
            <span className="text-xs font-mono text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                main.py
            </span>
            <span className="text-xs text-slate-500 font-mono">Python 3</span>
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full h-80 p-6 font-mono text-sm bg-editor text-slate-200 focus:outline-none resize-y leading-relaxed selection:bg-blue-500/30"
          spellCheck={false}
          placeholder="# Write your python code here..."
        />
      </div>

      {/* Action Bar */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end items-center gap-4">
        {status === GradingStatus.ERROR && (
            <span className="text-red-500 text-sm font-medium animate-pulse">發生錯誤，請重試</span>
        )}
        <button
          onClick={handleSubmit}
          disabled={status === GradingStatus.GRADING}
          className={`px-8 py-2.5 rounded-lg font-bold tracking-wide transition-all duration-200 flex items-center gap-2
            ${status === GradingStatus.GRADING 
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
              : 'bg-primary hover:bg-blue-600 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
            }`}
        >
          {status === GradingStatus.GRADING ? (
             <>
               <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
               </svg>
               評分中...
             </>
          ) : '提交程式碼'}
        </button>
      </div>

      {/* Results Section */}
      {result && (
        <div className={`p-8 border-t border-slate-200 animate-fadeIn ${result.isCorrect ? 'bg-green-50/50' : 'bg-red-50/50'}`}>
          <div className="flex items-start justify-between mb-6">
             <div>
                <h4 className={`text-xl font-bold mb-2 flex items-center gap-2 ${result.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                    {result.isCorrect ? '🎉 通過測試' : '⚠️ 需要改進'}
                </h4>
                <div className="flex items-center gap-3">
                    <div className="h-2 w-32 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                            className={`h-full ${result.score >= 80 ? 'bg-green-500' : result.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                            style={{ width: `${result.score}%` }}
                        ></div>
                    </div>
                    <span className={`text-2xl font-bold ${result.score >= 80 ? 'text-green-600' : result.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {result.score} / 100
                    </span>
                </div>
             </div>
             <div className={`p-3 rounded-full shadow-sm ${result.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                 {result.isCorrect ? (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                 ) : (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                 )}
             </div>
          </div>
          
          <div className="space-y-6">
            <div>
                <h5 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    AI 講評
                </h5>
                <div className="bg-white p-5 rounded-lg border border-slate-200 text-slate-700 text-sm leading-relaxed shadow-sm">
                    {result.feedback}
                </div>
            </div>
            
            {!result.isCorrect && result.suggestedSolution && (
                <div>
                    <h5 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        參考解答
                    </h5>
                    <div className="bg-editor rounded-lg p-4 overflow-x-auto shadow-inner border border-slate-700">
                        <pre className="text-sm text-green-400 font-mono leading-relaxed">
                            {result.suggestedSolution}
                        </pre>
                    </div>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProblemCard;