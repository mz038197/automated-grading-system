<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/19-S88wPcEXtCk3m2_1PIsFCwdwmA4ff6

## Run Locally

**Prerequisites:** Node.js (建議 v18 或更高版本)

### 🚀 快速開始

1. **安裝依賴**：
   ```bash
   npm install
   ```

2. **設定環境變數** (可選)：
   - 創建 `.env.local` 檔案
   - 設定 Gemini API Key：
     ```
     API_KEY=your-gemini-api-key-here
     ```
   - 如果沒有 API Key，應用程式仍可運行但 AI 功能會無法使用

3. **啟動開發服務器**：
   ```bash
   npm run dev
   ```

4. **開啟瀏覽器**：
   - 訪問 http://localhost:3000
   - 開發模式使用 Mock 用戶，無需登入

### 📝 開發說明

- **開發模式**：使用 localStorage 存儲，不需要 Firebase 設定
- **生產模式**：使用 Firebase Firestore 和 Authentication
- **端口設定**：開發服務器運行在 3000 端口
