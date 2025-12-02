import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // 載入當前環境變數 (包含 Render 設定的變數)
  // 第三個參數 '' 表示載入所有變數，不限制 VITE_ 開頭
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      port: 3000,
      host: true
    },
    preview: {
      port: 3000,
      host: true
    },
    define: {
      // 這裡定義全域常數替換
      // 將程式碼中的 'process.env' 字串替換為實際的環境變數物件
      'process.env': {
        NODE_ENV: JSON.stringify(mode),
        API_KEY: (() => {
          let key = env.API_KEY || '';
          console.log('🔍 原始 env.API_KEY:', key, '長度:', key.length);
          
          // 強力清理：移除所有引號和空格
          key = key.replace(/["']/g, '').trim();
          console.log('🧹 強力清理後的 API_KEY:', key, '長度:', key.length);
          
          // 驗證 API key 格式
          if (key && !key.startsWith('AIzaSy')) {
            console.warn('⚠️ API Key 格式可能不正確，應該以 AIzaSy 開頭');
          }
          
          return JSON.stringify(key);
        })()
      }
    }
  };
});