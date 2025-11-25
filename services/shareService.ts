
import { QuestionBank } from "../types";

// 使用 Base64 編碼，並處理 Unicode (中文) 問題
export const generateShareLink = (bank: QuestionBank): string => {
  try {
    // 為了縮短網址，我們可以只保留必要欄位 (雖然在這個架構下我們傳送整個物件)
    const jsonString = JSON.stringify(bank);
    
    // 解決中文編碼問題: encodeURIComponent -> unescape -> btoa
    const encoded = btoa(unescape(encodeURIComponent(jsonString)));
    
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?share=${encoded}`;
  } catch (error) {
    console.error("Error generating share link:", error);
    return "";
  }
};

export const parseShareLink = (encodedData: string): QuestionBank | null => {
  try {
    // 解碼: atob -> escape -> decodeURIComponent
    const jsonString = decodeURIComponent(escape(atob(encodedData)));
    const bank = JSON.parse(jsonString) as QuestionBank;
    
    // 簡單驗證資料結構
    if (!bank.id || !bank.title || !Array.isArray(bank.problems)) {
      throw new Error("Invalid bank structure");
    }
    
    return bank;
  } catch (error) {
    console.error("Error parsing share link:", error);
    return null;
  }
};
