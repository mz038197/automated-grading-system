import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import ProblemCard from './components/ProblemCard';
import { fileToGenerativePart, parsePdfProblems } from './services/geminiService';
import { ParsingStatus, Problem } from './types';

const App: React.FC = () => {
  const [parsingStatus, setParsingStatus] = useState<ParsingStatus>(ParsingStatus.IDLE);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setParsingStatus(ParsingStatus.PARSING);
    setErrorMsg(null);
    setProblems([]);

    try {
      const base64Data = await fileToGenerativePart(file);
      const extractedProblems = await parsePdfProblems(base64Data);
      
      if (extractedProblems.length === 0) {
        setErrorMsg("未能從 PDF 中識別出任何題目，請確認檔案內容是否清晰。");
        setParsingStatus(ParsingStatus.ERROR);
      } else {
        setProblems(extractedProblems);
        setParsingStatus(ParsingStatus.SUCCESS);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("解析過程中發生錯誤，請稍後再試。");
      setParsingStatus(ParsingStatus.ERROR);
    }
  };

  const handleReset = () => {
    setProblems([]);
    setParsingStatus(ParsingStatus.IDLE);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
            </div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">PyTutor AI</span>
          </div>
          {problems.length > 0 && (
             <button 
                onClick={handleReset}
                className="text-sm text-slate-500 hover:text-primary transition-colors flex items-center gap-1"
             >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                上傳新題目
             </button>
          )}
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        
        {/* Header Section */}
        {parsingStatus === ParsingStatus.IDLE && (
          <div className="text-center mb-10">
            <h1 className="text-4xl font-extrabold text-slate-900 mb-4">
              智能 Python 練習助手
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              上傳您的作業或題庫 PDF，AI 將自動為您建立互動式練習環境，並即時批改您的程式碼。
            </p>
          </div>
        )}

        {/* Upload Section */}
        {parsingStatus !== ParsingStatus.SUCCESS && (
          <>
            <FileUpload onFileSelect={handleFileSelect} status={parsingStatus} />
            {errorMsg && (
                <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-lg text-red-600 text-center animate-pulse">
                    {errorMsg}
                </div>
            )}
          </>
        )}

        {/* Problems List */}
        {parsingStatus === ParsingStatus.SUCCESS && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-slate-800">
                    已提取 {problems.length} 個題目
                </h2>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                    AI 解析完成
                </span>
            </div>
            
            {problems.map((problem, index) => (
              <ProblemCard key={`${problem.id}-${index}`} problem={problem} />
            ))}
            
            <div className="mt-12 text-center text-slate-400 text-sm">
                <p>所有題目均由 Gemini AI 自動解析，結果僅供參考。</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;