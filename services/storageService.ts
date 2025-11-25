import { Folder, QuestionBank, Problem } from "../types";

const FOLDERS_KEY = "pytutor_folders";
const BANKS_KEY = "pytutor_banks";

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

export const deleteQuestionBank = (bankId: string) => {
    const data = localStorage.getItem(BANKS_KEY);
    if(data) {
        const allBanks: QuestionBank[] = JSON.parse(data);
        const filtered = allBanks.filter(b => b.id !== bankId);
        localStorage.setItem(BANKS_KEY, JSON.stringify(filtered));
    }
}
