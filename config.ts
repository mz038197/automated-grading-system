
// 環境設定: 'dev' | 'prod'
// 透過 process.env.NODE_ENV 偵測是否為正式環境 (Render 部署時通常為 production)
export const APP_MODE: 'dev' | 'prod' = process.env.NODE_ENV === 'production' ? 'prod' : 'dev'; 

export const MOCK_USER_ID = "mock-dev-user-001";

// Firebase 設定
// 在 Render 部署時，請在 Environment Variables 設定這些變數
// 注意: 若使用 Vite，您可能需要在 vite.config.ts 中設定 define 或使用 import.meta.env
export const FIREBASE_CONFIG = {
  apiKey: process.env.FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
  appId: process.env.FIREBASE_APP_ID || "YOUR_APP_ID"
};
