# 🔑 Gemini API Key 設定指南

## 📋 快速設定步驟

### 1. 取得 Gemini API Key

1. 訪問 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 點擊 "Create API Key"
3. 複製生成的 API Key

### 2. 本地端設定

**方法一：使用指令創建**
```bash
# 在專案根目錄執行
echo "API_KEY=your-actual-api-key-here" > .env.local
echo "NODE_ENV=development" >> .env.local
```

**方法二：手動創建**
1. 在專案根目錄創建 `.env.local` 文件
2. 添加以下內容：
   ```env
   API_KEY=your-actual-api-key-here
   NODE_ENV=development
   ```

### 3. 重啟開發服務器

```bash
# 停止現有服務器 (Ctrl+C)
# 重新啟動
npm run dev
```

## 🔍 驗證設定

### 檢查 API Key 是否載入

1. 開啟瀏覽器開發者工具 (F12)
2. 嘗試上傳 PDF 或使用評分功能
3. 如果出現 API 相關錯誤，檢查 Console 是否有錯誤訊息

### 測試 AI 功能

✅ **PDF 解析**：上傳包含程式題目的 PDF  
✅ **程式碼評分**：提交 Python 程式碼進行評分  

## ⚠️ 安全性注意事項

- ✅ `.env.local` 已被 `.gitignore` 忽略，不會提交到 git
- ✅ API Key 只在建構時注入，不會暴露在瀏覽器中
- ❌ **不要**將 API Key 直接寫在程式碼中
- ❌ **不要**將 `.env.local` 文件提交到版控

## 🛠️ 故障排除

### 問題：AI 功能無法使用

**可能原因**：
1. API Key 未設定或不正確
2. API Key 配額已用盡
3. 環境變數未正確載入

**解決方法**：
1. 確認 `.env.local` 文件存在且格式正確
2. 檢查 API Key 是否有效
3. 重啟開發服務器
4. 檢查 Google AI Studio 的配額使用情況

### 問題：環境變數未載入

```bash
# 檢查 .env.local 文件內容
type .env.local

# 確認文件格式正確
# API_KEY=abc123... (不要有多餘的空格或引號)
```

## 📁 文件結構

```
專案根目錄/
├── .env.local          # 你的本地環境變數 (不會被提交)
├── env.template        # 環境變數模板參考
├── vite.config.ts      # Vite 配置 (已設定環境變數載入)
└── services/
    └── geminiService.ts # 使用 API Key 的服務
```

設定完成後，您就可以在本地開發中使用所有 AI 功能了！
