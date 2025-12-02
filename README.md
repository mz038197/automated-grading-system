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

2. **設定 Gemini API Key** (AI 功能必需)：
   - 取得 API Key：訪問 [Google AI Studio](https://makersuite.google.com/app/apikey)
   - 創建 `.env.local` 檔案：
     ```bash
     # 在專案根目錄執行
     echo "API_KEY=your-actual-gemini-api-key" > .env.local
     ```
   - 或手動創建 `.env.local`：
     ```env
     API_KEY=your-actual-gemini-api-key
     NODE_ENV=development
     ```
   - ⚠️ **重要**：`.env.local` 不會被提交到 git（已在 .gitignore 中）

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
