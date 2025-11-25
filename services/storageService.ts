
import { Folder, QuestionBank, Problem } from "../types";

const FOLDERS_KEY = "pytutor_folders";
const BANKS_KEY = "pytutor_banks";
const IMPORT_FOLDER_ID = "imported-folder-shared";

// 初始化預設資料 (如果沒有資料的話)
const initData = () => {
  if (!localStorage.getItem(FOLDERS_KEY)) {
    const defaultFolders: Folder[] = [
      { id: "f1", name: "Python 基礎練習", createdAt: Date.now(), description: "變數、迴圈與基礎語法" },
      { id: "f2", name: "期中考題庫", createdAt: Date.now(), description: "學校期中考考古題" },
      { id: "f3", name: "進階演算法", createdAt: Date.now(), description: "資料結構與演算法挑戰" },
    ];
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(defaultFolders));
  }
  if (!localStorage.getItem(BANKS_KEY)) {
    localStorage.setItem(BANKS_KEY, JSON.stringify([]));
  }
};

export const getFolders = (): Folder[] => {
  initData();
  const data = localStorage.getItem(FOLDERS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveFolder = (name: string, description: string = ""): Folder => {
  const folders = getFolders();
  const newFolder: Folder = {
    id: Date.now().toString(),
    name,
    description,
    createdAt: Date.now(),
  };
  localStorage.setItem(FOLDERS_KEY, JSON.stringify([...folders, newFolder]));
  return newFolder;
};

// 確保有一個專門放匯入題庫的資料夾
export const ensureImportFolder = (): Folder => {
  const folders = getFolders();
  const existing = folders.find(f => f.id === IMPORT_FOLDER_ID);
  if (existing) return existing;

  const importFolder: Folder = {
    id: IMPORT_FOLDER_ID,
    name: "📥 匯入的題庫",
    description: "來自連結分享的題庫集合",
    createdAt: Date.now(),
  };
  
  // 將匯入資料夾放在最前面
  localStorage.setItem(FOLDERS_KEY, JSON.stringify([importFolder, ...folders]));
  return importFolder;
};

export const getBanksByFolder = (folderId: string): QuestionBank[] => {
  initData();
  const data = localStorage.getItem(BANKS_KEY);
  const allBanks: QuestionBank[] = data ? JSON.parse(data) : [];
  return allBanks.filter(b => b.folderId === folderId).sort((a, b) => b.createdAt - a.createdAt);
};

export const saveQuestionBank = (folderId: string, title: string, problems: Problem[]): QuestionBank => {
  const data = localStorage.getItem(BANKS_KEY);
  const allBanks: QuestionBank[] = data ? JSON.parse(data) : [];
  
  const newBank: QuestionBank = {
    id: Date.now().toString(),
    folderId,
    title,
    problems,
    createdAt: Date.now(),
  };

  localStorage.setItem(BANKS_KEY, JSON.stringify([...allBanks, newBank]));
  return newBank;
};

export const saveImportedBank = (bank: QuestionBank): QuestionBank => {
  const importFolder = ensureImportFolder();
  const data = localStorage.getItem(BANKS_KEY);
  const allBanks: QuestionBank[] = data ? JSON.parse(data) : [];

  // 檢查是否已經存在相同的題庫 (避免重複匯入)
  // 這裡簡單用 ID 判斷，如果 ID 衝突則重新產生 ID
  const existingIndex = allBanks.findIndex(b => b.id === bank.id);
  
  const newBank = { ...bank, folderId: importFolder.id };
  
  // 如果是自己的題庫連結，或已經匯入過，我們選擇更新它，或者把它當作新副本
  // 為了避免混亂，我們這裡策略是：如果 ID 存在，就更新；不存在就新增
  if (existingIndex >= 0) {
    allBanks[existingIndex] = newBank;
  } else {
    allBanks.push(newBank);
  }

  localStorage.setItem(BANKS_KEY, JSON.stringify(allBanks));
  return newBank;
};

export const deleteQuestionBank = (bankId: string) => {
    const data = localStorage.getItem(BANKS_KEY);
    if(data) {
        const allBanks: QuestionBank[] = JSON.parse(data);
        const filtered = allBanks.filter(b => b.id !== bankId);
        localStorage.setItem(BANKS_KEY, JSON.stringify(filtered));
    }
}
