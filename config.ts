
// 環境設定: 'dev' | 'prod'
// dev: 使用 LocalStorage 與 Mock 帳號
// prod: 使用 Firestore
export const APP_MODE: 'dev' | 'prod' = 'dev'; 

export const MOCK_USER_ID = "mock-dev-user-001";

// 請在此填入您的 Firebase 設定 (Prod 模式需要)
export const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
