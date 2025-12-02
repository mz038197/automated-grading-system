import { Folder, QuestionBank, Problem } from "../types";
import { APP_MODE, FIREBASE_CONFIG } from "../config";
import { getCurrentUserId } from "./authService"; // Import Auth
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  query, 
  where, 
  deleteDoc,
} from "firebase/firestore";

// --- Constants & Keys ---
const LOCAL_FOLDERS_KEY = "pytutor_folders";
const LOCAL_BANKS_KEY = "pytutor_banks";
const IMPORT_FOLDER_ID = "imported-folder-shared";

// --- Firebase Initialization (Lazy) ---
let db: any = null;

const getDb = () => {
  if (APP_MODE === 'prod' && !db) {
    try {
      const app = initializeApp(FIREBASE_CONFIG);
      db = getFirestore(app);
    } catch (e) {
      console.error("Firebase 初始化失敗，請檢查 config.ts 中的設定", e);
    }
  }
  return db;
};

// --- Helper: Default Data ---
const getDefaultFolders = (): Folder[] => [
  { id: "f1", name: "Python 基礎練習", createdAt: Date.now(), description: "變數、迴圈與基礎語法" },
  { id: "f2", name: "期中考題庫", createdAt: Date.now(), description: "學校期中考考古題" },
  { id: "f3", name: "進階演算法", createdAt: Date.now(), description: "資料結構與演算法挑戰" },
];

// ==========================================
// LocalStorage Implementation (DEV Mode)
// ==========================================

const LocalStorage = {
  initData: () => {
    if (!localStorage.getItem(LOCAL_FOLDERS_KEY)) {
      localStorage.setItem(LOCAL_FOLDERS_KEY, JSON.stringify(getDefaultFolders()));
    }
    if (!localStorage.getItem(LOCAL_BANKS_KEY)) {
      localStorage.setItem(LOCAL_BANKS_KEY, JSON.stringify([]));
    }
  },

  getFolders: async (): Promise<Folder[]> => {
    LocalStorage.initData();
    const data = localStorage.getItem(LOCAL_FOLDERS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveFolder: async (name: string, description: string): Promise<Folder> => {
    const folders = await LocalStorage.getFolders();
    const newFolder: Folder = {
      id: Date.now().toString(),
      name,
      description,
      createdAt: Date.now(),
    };
    localStorage.setItem(LOCAL_FOLDERS_KEY, JSON.stringify([...folders, newFolder]));
    return newFolder;
  },

  ensureImportFolder: async (): Promise<Folder> => {
    const folders = await LocalStorage.getFolders();
    const existing = folders.find(f => f.id === IMPORT_FOLDER_ID);
    if (existing) return existing;

    const importFolder: Folder = {
      id: IMPORT_FOLDER_ID,
      name: "📥 匯入的題庫",
      description: "來自連結分享的題庫集合",
      createdAt: Date.now(),
    };
    localStorage.setItem(LOCAL_FOLDERS_KEY, JSON.stringify([importFolder, ...folders]));
    return importFolder;
  },

  getBanksByFolder: async (folderId: string): Promise<QuestionBank[]> => {
    LocalStorage.initData();
    const data = localStorage.getItem(LOCAL_BANKS_KEY);
    const allBanks: QuestionBank[] = data ? JSON.parse(data) : [];
    return allBanks.filter(b => b.folderId === folderId).sort((a, b) => b.createdAt - a.createdAt);
  },

  saveQuestionBank: async (folderId: string, title: string, problems: Problem[]): Promise<QuestionBank> => {
    const data = localStorage.getItem(LOCAL_BANKS_KEY);
    const allBanks: QuestionBank[] = data ? JSON.parse(data) : [];
    
    const newBank: QuestionBank = {
      id: Date.now().toString(),
      folderId,
      title,
      problems,
      createdAt: Date.now(),
    };
    localStorage.setItem(LOCAL_BANKS_KEY, JSON.stringify([...allBanks, newBank]));
    return newBank;
  },

  saveImportedBank: async (bank: QuestionBank): Promise<QuestionBank> => {
    const importFolder = await LocalStorage.ensureImportFolder();
    const data = localStorage.getItem(LOCAL_BANKS_KEY);
    const allBanks: QuestionBank[] = data ? JSON.parse(data) : [];
    
    const existingIndex = allBanks.findIndex(b => b.id === bank.id);
    const newBank = { ...bank, folderId: importFolder.id };
    
    if (existingIndex >= 0) {
      allBanks[existingIndex] = newBank;
    } else {
      allBanks.push(newBank);
    }
    localStorage.setItem(LOCAL_BANKS_KEY, JSON.stringify(allBanks));
    return newBank;
  },

  deleteQuestionBank: async (bankId: string): Promise<void> => {
    const data = localStorage.getItem(LOCAL_BANKS_KEY);
    if(data) {
      const allBanks: QuestionBank[] = JSON.parse(data);
      const filtered = allBanks.filter(b => b.id !== bankId);
      localStorage.setItem(LOCAL_BANKS_KEY, JSON.stringify(filtered));
    }
  }
};

// ==========================================
// Firestore Implementation (PROD Mode)
// ==========================================

const FirestoreStorage = {
  // Helpers to get collection ref with user isolation
  getFolderCol: () => {
     const uid = getCurrentUserId();
     if (!uid) {
       console.error("Unauthorized access attempt - user not authenticated");
       throw new Error("User not authenticated");
     }
     return collection(getDb(), "users", uid, "folders");
  },
  getBankCol: () => {
     const uid = getCurrentUserId();
     if (!uid) {
       console.error("Unauthorized access attempt - user not authenticated");
       throw new Error("User not authenticated");
     }
     return collection(getDb(), "users", uid, "banks");
  },

  getFolders: async (): Promise<Folder[]> => {
    const snapshot = await getDocs(FirestoreStorage.getFolderCol());
    if (snapshot.empty) {
        // Init default folders for new user
        const defaults = getDefaultFolders();
        for(const f of defaults) {
            await setDoc(doc(FirestoreStorage.getFolderCol(), f.id), f);
        }
        return defaults;
    }
    const folders = snapshot.docs.map(d => d.data() as Folder);
    return folders.sort((a, b) => b.createdAt - a.createdAt);
  },

  saveFolder: async (name: string, description: string): Promise<Folder> => {
    const newFolder: Folder = {
      id: Date.now().toString(), 
      name,
      description,
      createdAt: Date.now(),
    };
    await setDoc(doc(FirestoreStorage.getFolderCol(), newFolder.id), newFolder);
    return newFolder;
  },

  ensureImportFolder: async (): Promise<Folder> => {
    const folders = await FirestoreStorage.getFolders();
    const existing = folders.find(f => f.id === IMPORT_FOLDER_ID);
    
    if (existing) return existing;

    const importFolder: Folder = {
      id: IMPORT_FOLDER_ID,
      name: "📥 匯入的題庫",
      description: "來自連結分享的題庫集合",
      createdAt: Date.now(),
    };
    await setDoc(doc(FirestoreStorage.getFolderCol(), IMPORT_FOLDER_ID), importFolder);
    return importFolder;
  },

  getBanksByFolder: async (folderId: string): Promise<QuestionBank[]> => {
    const q = query(FirestoreStorage.getBankCol(), where("folderId", "==", folderId));
    const snapshot = await getDocs(q);
    const banks = snapshot.docs.map(d => d.data() as QuestionBank);
    return banks.sort((a, b) => b.createdAt - a.createdAt);
  },

  saveQuestionBank: async (folderId: string, title: string, problems: Problem[]): Promise<QuestionBank> => {
    const newBank: QuestionBank = {
      id: Date.now().toString(),
      folderId,
      title,
      problems,
      createdAt: Date.now(),
    };
    await setDoc(doc(FirestoreStorage.getBankCol(), newBank.id), newBank);
    return newBank;
  },

  saveImportedBank: async (bank: QuestionBank): Promise<QuestionBank> => {
    const importFolder = await FirestoreStorage.ensureImportFolder();
    const newBank = { ...bank, folderId: importFolder.id };
    await setDoc(doc(FirestoreStorage.getBankCol(), newBank.id), newBank);
    return newBank;
  },

  deleteQuestionBank: async (bankId: string): Promise<void> => {
    await deleteDoc(doc(FirestoreStorage.getBankCol(), bankId));
  }
};

// ==========================================
// Public Facade
// ==========================================

const getService = () => (APP_MODE === 'prod' ? FirestoreStorage : LocalStorage);

export const getFolders = async () => getService().getFolders();
export const saveFolder = async (name: string, desc: string) => getService().saveFolder(name, desc);
export const ensureImportFolder = async () => getService().ensureImportFolder();
export const getBanksByFolder = async (fid: string) => getService().getBanksByFolder(fid);
export const saveQuestionBank = async (fid: string, title: string, probs: Problem[]) => getService().saveQuestionBank(fid, title, probs);
export const saveImportedBank = async (bank: QuestionBank) => getService().saveImportedBank(bank);
export const deleteQuestionBank = async (bid: string) => getService().deleteQuestionBank(bid);