
import React, { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import ProblemCard from './components/ProblemCard';
import { fileToGenerativePart, parsePdfProblems } from './services/geminiService';
import { getFolders, getBanksByFolder, saveFolder, saveQuestionBank, deleteQuestionBank, saveImportedBank, ensureImportFolder } from './services/storageService';
import { generateShareLink, parseShareLink } from './services/shareService';
import { ParsingStatus, Problem, Folder, QuestionBank } from './types';

type ViewState = 'LOBBY' | 'FOLDER_VIEW' | 'PROBLEM_VIEW';

const App: React.FC = () => {
  // Navigation State
  const [view, setView] = useState<ViewState>('LOBBY');
  const [activeFolder, setActiveFolder] = useState<Folder | null>(null);
  const [activeBank, setActiveBank] = useState<QuestionBank | null>(null);

  // Data State
  const [folders, setFolders] = useState<Folder[]>([]);
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  
  // Upload/Creation State
  const [parsingStatus, setParsingStatus] = useState<ParsingStatus>(ParsingStatus.IDLE);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDesc, setNewFolderDesc] = useState("");
  const [isUploadingBank, setIsUploadingBank] = useState(false);
  
  // Notification
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Helper to show toast
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // 1. Initial Load & URL Check
  useEffect(() => {
    // Check for share link
    const params = new URLSearchParams(window.location.search);
    const shareData = params.get('share');

    if (shareData) {
      const importedBank = parseShareLink(shareData);
      if (importedBank) {
        // Save to local storage
        const savedBank = saveImportedBank(importedBank);
        const importFolder = ensureImportFolder();
        
        // Update URL to remove the long query string
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Update State
        setFolders(getFolders());
        setActiveFolder(importFolder);
        setActiveBank(savedBank);
        setView('PROBLEM_VIEW');
        showToast(`已成功匯入題庫：${savedBank.title}`);
        return; // Skip default loading
      } else {
        showToast("無效的分享連結");
      }
    }

    // Default load
    setFolders(getFolders());
  }, []);

  // Load banks when folder changes
  useEffect(() => {
    if (activeFolder) {
      setBanks(getBanksByFolder(activeFolder.id));
    }
  }, [activeFolder]);

  // Navigation Handlers
  const goHome = () => {
    setView('LOBBY');
    setActiveFolder(null);
    setActiveBank(null);
    setIsUploadingBank(false);
    setParsingStatus(ParsingStatus.IDLE);
    // Refresh folders in case something changed
    setFolders(getFolders());
  };

  const openFolder = (folder: Folder) => {
    setActiveFolder(folder);
    setView('FOLDER_VIEW');
  };

  const openBank = (bank: QuestionBank) => {
    setActiveBank(bank);
    setView('PROBLEM_VIEW');
  };

  // Creation Handlers
  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const newFolder = saveFolder(newFolderName, newFolderDesc);
    setFolders([...folders, newFolder]);
    setIsCreatingFolder(false);
    setNewFolderName("");
    setNewFolderDesc("");
  };

  const handleFileSelect = async (file: File) => {
    if (!activeFolder) return;
    setParsingStatus(ParsingStatus.PARSING);
    setErrorMsg(null);

    try {
      const base64Data = await fileToGenerativePart(file);
      const extractedProblems = await parsePdfProblems(base64Data);
      
      if (extractedProblems.length === 0) {
        setErrorMsg("未能從 PDF 中識別出任何題目，請確認檔案內容是否清晰。");
        setParsingStatus(ParsingStatus.ERROR);
      } else {
        // Use filename as default title (removing extension)
        const defaultTitle = file.name.replace(/\.[^/.]+$/, "");
        const newBank = saveQuestionBank(activeFolder.id, defaultTitle, extractedProblems);
        setBanks([newBank, ...banks]);
        setParsingStatus(ParsingStatus.SUCCESS);
        setIsUploadingBank(false); // Close uploader
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("解析過程中發生錯誤，請稍後再試。");
      setParsingStatus(ParsingStatus.ERROR);
    }
  };

  const handleDeleteBank = (e: React.MouseEvent, bankId: string) => {
      e.stopPropagation();
      if(window.confirm('確定要刪除這個題庫嗎？')) {
          deleteQuestionBank(bankId);
          if(activeFolder) {
              setBanks(getBanksByFolder(activeFolder.id));
          }
      }
  };

  const handleShareBank = (e: React.MouseEvent, bank: QuestionBank) => {
    e.stopPropagation();
    const url = generateShareLink(bank);
    if (url) {
      navigator.clipboard.writeText(url).then(() => {
        showToast("📋 連結已複製！傳送給學生即可開始練習。");
      }).catch(() => {
        showToast("❌ 複製失敗，請手動複製網址");
      });
    }
  };

  // --- Render Components ---

  const renderBreadcrumbs = () => (
    <nav className="flex items-center text-sm text-slate-500 mb-6 bg-white px-4 py-3 rounded-lg shadow-sm border border-slate-100">
      <button onClick={goHome} className="hover:text-primary font-medium flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
        大廳
      </button>
      {activeFolder && (
        <>
          <span className="mx-2">/</span>
          <button 
            onClick={() => openFolder(activeFolder)} 
            className={`hover:text-primary font-medium ${view === 'FOLDER_VIEW' ? 'text-slate-900 font-bold' : ''}`}
          >
            {activeFolder.name}
          </button>
        </>
      )}
      {activeBank && (
        <>
          <span className="mx-2">/</span>
          <span className="text-slate-900 font-bold">{activeBank.title}</span>
        </>
      )}
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20 relative">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-[100] animate-bounceIn">
          <div className="bg-slate-800 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
             <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
             {toastMsg}
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={goHome}>
            <div className="bg-blue-600 p-2 rounded-lg text-white shadow-md">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
            </div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">PyTutor AI</span>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {renderBreadcrumbs()}

        {/* --- VIEW: LOBBY (Folders) --- */}
        {view === 'LOBBY' && (
          <div className="animate-fadeIn">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900">我的題庫大廳</h1>
                    <p className="text-slate-500 mt-2">選擇一個分類資料夾開始練習，或建立新的分類。</p>
                </div>
                <button 
                    onClick={() => setIsCreatingFolder(true)}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-lg shadow hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    建立新分類
                </button>
            </div>

            {/* Create Folder Form */}
            {isCreatingFolder && (
                <div className="mb-8 bg-white p-6 rounded-xl shadow-md border border-blue-100">
                    <h3 className="font-bold text-lg mb-4">建立新分類</h3>
                    <form onSubmit={handleCreateFolder} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">分類名稱</label>
                            <input 
                                type="text" 
                                value={newFolderName} 
                                onChange={(e) => setNewFolderName(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                placeholder="例如：期末考複習"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">描述 (選填)</label>
                            <input 
                                type="text" 
                                value={newFolderDesc} 
                                onChange={(e) => setNewFolderDesc(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                placeholder="簡短描述這個資料夾的內容"
                            />
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button type="button" onClick={() => setIsCreatingFolder(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">取消</button>
                            <button type="submit" disabled={!newFolderName.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">建立</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {folders.map(folder => (
                    <div 
                        key={folder.id} 
                        onClick={() => openFolder(folder)}
                        className={`bg-white p-6 rounded-xl shadow-sm border cursor-pointer hover:shadow-md transition-all group
                             ${folder.id === 'imported-folder-shared' ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200 hover:border-blue-300'}
                        `}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-lg transition-colors
                                ${folder.id === 'imported-folder-shared' 
                                    ? 'bg-amber-100 text-amber-600 group-hover:bg-amber-500 group-hover:text-white' 
                                    : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'}
                            `}>
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">{folder.name}</h3>
                        <p className="text-slate-500 text-sm line-clamp-2">{folder.description || "沒有描述"}</p>
                        <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400 flex justify-between">
                            <span>建立於 {new Date(folder.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        )}

        {/* --- VIEW: FOLDER (Banks List) --- */}
        {view === 'FOLDER_VIEW' && activeFolder && (
          <div className="animate-fadeIn">
             <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        {activeFolder.name}
                        {activeFolder.id === 'imported-folder-shared' && (
                            <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full">外部匯入</span>
                        )}
                    </h2>
                    <p className="text-slate-500 mt-1">{activeFolder.description}</p>
                </div>
                {!isUploadingBank && activeFolder.id !== 'imported-folder-shared' && (
                    <button 
                        onClick={() => setIsUploadingBank(true)}
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-lg shadow hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                        上傳新題庫 (PDF)
                    </button>
                )}
            </div>

            {/* Upload Area */}
            {isUploadingBank && (
                <div className="mb-10 bg-white p-6 rounded-xl border border-blue-200 shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-slate-800">上傳 PDF 以建立新題庫</h3>
                        <button onClick={() => setIsUploadingBank(false)} className="text-slate-400 hover:text-slate-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                    {parsingStatus !== ParsingStatus.SUCCESS && (
                        <>
                            <FileUpload onFileSelect={handleFileSelect} status={parsingStatus} />
                            {errorMsg && (
                                <div className="mt-4 p-3 bg-red-50 text-red-600 text-center rounded-lg">{errorMsg}</div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Bank List */}
            {banks.length === 0 && !isUploadingBank ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                    <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    <p className="text-slate-500 text-lg">此資料夾尚未建立題庫</p>
                    {activeFolder.id !== 'imported-folder-shared' && (
                        <p className="text-slate-400 text-sm mt-1">點擊右上方按鈕上傳 PDF 來建立第一個題庫</p>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {banks.map(bank => (
                        <div 
                            key={bank.id}
                            onClick={() => openBank(bank)}
                            className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800 group-hover:text-blue-600 transition-colors">{bank.title}</h3>
                                    <p className="text-sm text-slate-500">包含 {bank.problems.length} 個題目 • 建立於 {new Date(bank.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* Share Button */}
                                <button 
                                    onClick={(e) => handleShareBank(e, bank)}
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors flex items-center gap-1 group-hover/btn:w-auto"
                                    title="分享連結給學生"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                                </button>

                                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-medium">
                                    進入練習
                                </span>
                                <button 
                                    onClick={(e) => handleDeleteBank(e, bank.id)}
                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                    title="刪除題庫"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </div>
        )}

        {/* --- VIEW: PROBLEM (Solver) --- */}
        {view === 'PROBLEM_VIEW' && activeBank && (
          <div className="animate-fadeIn">
            <div className="mb-8 flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <span className="bg-indigo-600 text-white text-sm px-2 py-1 rounded shadow-sm">題庫</span>
                        {activeBank.title}
                    </h2>
                    <div className="mt-2 text-slate-500 text-sm">
                        共 {activeBank.problems.length} 題 • 請依序完成練習
                    </div>
                </div>
                <button 
                    onClick={(e) => handleShareBank(e, activeBank)}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors text-sm font-bold"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                    分享連結
                </button>
            </div>
            
            <div className="space-y-6">
                {activeBank.problems.map((problem, index) => (
                    <ProblemCard key={`${activeBank.id}-${problem.id}-${index}`} problem={problem} />
                ))}
            </div>

             <div className="mt-12 text-center text-slate-400 text-sm">
                <p>題目內容由 AI 解析，可點擊題目右上角編輯按鈕修正內容。</p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;
