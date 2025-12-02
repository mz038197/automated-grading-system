import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // 載入當前環境變數 (包含 Render 設定的變數)
  // 第三個參數 '' 表示載入所有變數，不限制 VITE_ 開頭
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // 這裡定義全域常數替換
      // 將程式碼中的 'process.env' 字串替換為實際的環境變數物件
      'process.env': {
        NODE_ENV: JSON.stringify(mode),
        API_KEY: JSON.stringify(env.API_KEY),
        FIREBASE_API_KEY: JSON.stringify(env.FIREBASE_API_KEY),
        FIREBASE_AUTH_DOMAIN: JSON.stringify(env.FIREBASE_AUTH_DOMAIN),
        FIREBASE_PROJECT_ID: JSON.stringify(env.FIREBASE_PROJECT_ID),
        FIREBASE_STORAGE_BUCKET: JSON.stringify(env.FIREBASE_STORAGE_BUCKET),
        FIREBASE_MESSAGING_SENDER_ID: JSON.stringify(env.FIREBASE_MESSAGING_SENDER_ID),
        FIREBASE_APP_ID: JSON.stringify(env.FIREBASE_APP_ID),
      }
    }
  };
});