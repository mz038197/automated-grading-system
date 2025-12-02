
// 環境設定: 'dev' | 'prod'
// 透過 process.env.NODE_ENV 偵測是否為正式環境 (Render 部署時通常為 production)
export const APP_MODE: 'dev' | 'prod' = process.env.NODE_ENV === 'production' ? 'prod' : 'dev'; 

export const MOCK_USER_ID = "mock-dev-user-001";

// Firebase 設定
// 在 Render 部署時，請在 Environment Variables 設定這些變數
// 注意: 若使用 Vite，您可能需要在 vite.config.ts 中設定 define 或使用 import.meta.env
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDPbNsYIW-aYegp-ZjTEit4S2xB4KjR0OM",
  authDomain: "auto-graded-system.firebaseapp.com",
  projectId: "auto-graded-system",
  storageBucket: "auto-graded-system.firebasestorage.app",
  messagingSenderId: "140000015688",
  appId: "1:140000015688:web:010c92ba074db653da6f7d",
  measurementId: "G-9DW2L4DNT4"
};
