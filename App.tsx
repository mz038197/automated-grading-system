import React, { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import ProblemCard from './components/ProblemCard';
import { fileToGenerativePart, parsePdfProblems } from './services/geminiService';
import { getFolders, getBanksByFolder, saveFolder, saveQuestionBank, deleteQuestionBank, saveImportedBank, ensureImportFolder } from './services/storageService';
import { generateShareLink, parseShareLink } from './services/shareService';
import { signIn, signOut, observeAuth } from './services/authService';
import { ParsingStatus, Problem, Folder, QuestionBank, User } from './types';
import { APP_MODE } from './config';

type ViewState = 'LOBBY' | 'FOLDER_VIEW' | 'PROBLEM_VIEW';

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

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

  // 1. Initial Auth Check
  useEffect(() => {
    const unsubscribe = observeAuth((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Load Data when User is available
  useEffect(() => {
    const initData = async () => {
      if (!user) return;

      // Check for share link
      const params = new URLSearchParams(window.location.search);
      const shareData = params.get('share');

      if (shareData) {
        const importedBank = parseShareLink(shareData);
        if (importedBank) {
          try {
            const savedBank = await saveImportedBank(importedBank);
            const importFolder = await ensureImportFolder();
            
            window.history.replaceState({}, document.title, window.location.pathname);
            
            const allFolders = await getFolders();
            setFolders(allFolders);
            setActiveFolder(importFolder);
            setActiveBank(savedBank);
            setView('PROBLEM_VIEW');
            showToast(`已成功匯入題庫：${savedBank.title}`);
            return;
          } catch (e) {
            console.error(e);
            showToast("匯入題庫失敗");
          }
        } else {
          showToast("無效的分享連結");
        }
      }

      // Default load
      try {
        const loadedFolders = await getFolders();
        setFolders(loadedFolders);
      } catch (e) {
        console.error("Failed to load folders:", e);
        showToast("載入資料失敗");
      }
    };

    if (!authLoading) {
      initData();
    }
  }, [user, authLoading]);

  // Load banks when folder changes
  useEffect(() => {
    const loadBanks = async () => {
      if (activeFolder && user) {
        const loadedBanks = await getBanksByFolder(activeFolder.id);
        setBanks(loadedBanks);
      }
    };
    loadBanks();
  }, [activeFolder, user]);

  // Auth Handlers
  const handleLogin = async () => {
    try {
      await signIn();
    } catch (e) {
      showToast("登入失敗，請重試");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setFolders([]);
      setBanks([]);
      setActiveFolder(null);
      setActiveBank(null);
      setView('LOBBY');
    } catch (e) {
      showToast("登出失敗");
    }
  };

  // Navigation Handlers
  const goHome = async () => {
    setView('LOBBY');
    setActiveFolder(null);
    setActiveBank(null);
    setIsUploadingBank(false);
    setParsingStatus(ParsingStatus.IDLE);
    // Refresh folders
    if (user) {
        const loadedFolders = await getFolders();
        setFolders(loadedFolders);
    }
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
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    
    try {
      await saveFolder(newFolderName, newFolderDesc);
      // Refresh list
      const updatedFolders = await getFolders();
      setFolders(updatedFolders);
      
      setIsCreatingFolder(false);
      setNewFolderName("");
      setNewFolderDesc("");
    } catch (error) {
      console.error("Failed to create folder", error);
      showToast("建立資料夾失敗");
    }
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
        const defaultTitle = file.name.replace(/\.[^/.]+$/, "");
        const newBank = await saveQuestionBank(activeFolder.id, defaultTitle, extractedProblems);
        
        setBanks([newBank, ...banks]);
        
        setParsingStatus(ParsingStatus.SUCCESS);
        setIsUploadingBank(false); 
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("解析過程中發生錯誤，請稍後再試。");
      setParsingStatus(ParsingStatus.ERROR);
    }
  };

  const handleDeleteBank = async (e: React.MouseEvent, bankId: string) => {
      e.stopPropagation();
      if(window.confirm('確定要刪除這個題庫嗎？')) {
          await deleteQuestionBank(bankId);
          if(activeFolder) {
              const updatedBanks = await getBanksByFolder(activeFolder.id);
              setBanks(updatedBanks);
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

  const scrollToProblem = (problemId: string) => {
    const element = document.getElementById(`problem-${problemId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // --- Render Components ---

  // 1. Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
         <div className="flex flex-col items-center">
            <svg className="animate-spin h-10 w-10 text-primary mb-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-slate-500 font-medium">系統載入中...</p>
         </div>
      </div>
    );
  }

  // 2. Login Screen
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-100">
            <div className="bg-blue-600 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-md text-white">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-800 mb-2">PyTutor AI</h1>
            <p className="text-slate-500 mb-8 leading-relaxed">您的 AI Python 智慧助教。<br/>上傳 PDF，自動出題，即時評分。</p>
            
            <button 
                onClick={handleLogin}
                className="w-full bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-bold py-3 px-4 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3"
            >
                {APP_MODE === 'dev' ? (
                   <>
                     <span className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-xs">🛠️</span>
                     Dev 模式 (模擬登入)
                   </>
                ) : (
                   <>
                     <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6" />
                     使用 Google 帳號登入
                   </>
                )}
            </button>
            <p className="mt-6 text-xs text-slate-400">
                {APP_MODE === 'dev' ? '目前為開發模式，將使用模擬帳號' : '目前為正式模式，資料將儲存於雲端'}
            </p>
        </div>
      </div>
    );
  }

  // 3. Main App View
  const renderBreadcrumbs = () => (
    <nav className="flex items-center text-sm text-slate-500 mb-6 bg-white px-4 py-3 rounded-lg shadow-sm border border-slate-100 sticky top-20 z-40">
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
          <span className="text-slate-900 font-bold truncate max-w-[150px] sm:max-w-xs">{activeBank.title}</span>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={goHome}>
            <div className="bg-blue-600 p-2 rounded-lg text-white shadow-md">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-slate-800 tracking-tight leading-tight">PyTutor AI</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
             {/* User Profile */}
             <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-slate-800">{user.displayName || "使用者"}</p>
                    <p className="text-xs text-slate-400">{APP_MODE === 'dev' ? 'Dev Mode' : 'Pro Member'}</p>
                </div>
                {user.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" className="w-9 h-9 rounded-full border border-slate-200 shadow-sm" />
                ) : (
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                        {user.displayName ? user.displayName[0] : "U"}
                    </div>
                )}
                <button 
                    onClick={handleLogout}
                    className="text-sm text-slate-500 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors ml-1"
                    title="登出"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                </button>
             </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {renderBreadcrumbs()}

        {/* --- VIEW: LOBBY (Folders) --- */}
        {view === 'LOBBY' && (
          <div className="animate-fadeIn max-w-6xl mx-auto">
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
          <div className="animate-fadeIn max-w-6xl mx-auto">
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
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3 flex-wrap">
                        <span className="bg-indigo-600 text-white text-sm px-2 py-1 rounded shadow-sm whitespace-nowrap">題庫</span>
                        <span className="break-all">{activeBank.title}</span>
                    </h2>
                    <div className="mt-1 text-slate-500 text-sm">
                        共 {activeBank.problems.length} 題 • 請依序完成練習
                    </div>
                </div>
                <button 
                    onClick={(e) => handleShareBank(e, activeBank)}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors text-sm font-bold whitespace-nowrap"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                    分享連結
                </button>
            </div>
            
            {/* Mobile Horizontal TOC */}
            <div className="lg:hidden flex overflow-x-auto gap-2 pb-4 mb-2 scrollbar-hide -mx-4 px-4">
                {activeBank.problems.map((problem) => (
                    <button
                        key={problem.id}
                        onClick={() => scrollToProblem(problem.id)}
                        className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full shadow-sm text-sm text-slate-700 active:bg-blue-50 active:border-blue-300"
                    >
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">{problem.id}</span>
                        <span className="max-w-[100px] truncate">{problem.title}</span>
                    </button>
                ))}
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start relative">
                
                {/* Desktop Sticky TOC Sidebar */}
                <aside className="hidden lg:block w-64 sticky top-24 shrink-0 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 scrollbar-thin">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                        <h3 className="font-bold text-slate-800 mb-3 px-2">題目列表</h3>
                        <div className="space-y-1">
                            {activeBank.problems.map((problem) => (
                                <button
                                    key={problem.id}
                                    onClick={() => scrollToProblem(problem.id)}
                                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors text-sm text-slate-600 flex items-center gap-3 group"
                                >
                                    <span className="w-6 h-6 rounded bg-slate-100 text-slate-500 group-hover:bg-blue-200 group-hover:text-blue-700 flex items-center justify-center text-xs font-bold transition-colors">
                                        {problem.id}
                                    </span>
                                    <span className="truncate flex-1">{problem.title}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <div className="flex-1 w-full min-w-0">
                    <div className="space-y-6">
                        {activeBank.problems.map((problem, index) => (
                            <div 
                                id={`problem-${problem.id}`} 
                                key={`${activeBank.id}-${problem.id}-${index}`}
                                className="scroll-mt-28" // Scroll margin for fixed header
                            >
                                <ProblemCard problem={problem} />
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 text-center text-slate-400 text-sm">
                        <p>題目內容由 AI 解析，可點擊題目右上角編輯按鈕修正內容。</p>
                    </div>
                </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;