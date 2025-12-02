# 🔧 Gemini API Key 測試步驟

## 🚨 當前問題
儘管已修正模型名稱，但仍出現 "API key not valid" 錯誤。

## 🔍 徹底測試步驟

### 1. 在瀏覽器 Console 中測試

1. **打開應用程式**: http://localhost:3003
2. **開啟開發者工具**: F12 → Console
3. **執行測試函數**:
   ```javascript
   // 導入測試函數（如果可用）
   import { testApiKey } from './services/geminiService.js';
   testApiKey();
   ```

### 2. 檢查 API Key 載入狀態

在 Console 中檢查：
```javascript
console.log('API_KEY:', process.env.API_KEY);
console.log('API_KEY length:', process.env.API_KEY?.length);
console.log('API_KEY starts with:', process.env.API_KEY?.substring(0, 10));
```

### 3. 直接測試 Google API

使用 Postman 或 curl 直接測試：

```bash
curl -X POST \
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "contents": [{"parts": [{"text": "Hello"}]}]
  }'
```

將 `YOUR_API_KEY` 替換為實際的 API key。

### 4. 檢查 Google AI Studio

1. 前往 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 檢查 API Key 狀態：
   - ✅ Active
   - ❌ Disabled/Expired
3. 檢查使用配額
4. 檢查權限設定

### 5. 重新生成 API Key

如果上述都正常，嘗試：
1. 刪除現有 API Key
2. 創建新的 API Key
3. 更新環境變數
4. 重啟服務器

### 6. 檢查網路和地區限制

- 確認您的網路可以存取 Google AI 服務
- 檢查是否有企業防火牆阻擋
- 確認您的地區是否支援 Gemini API

## 🎯 最可能的原因排序

1. **API Key 本身無效或過期** (70%)
2. **Google Cloud 專案配置問題** (20%)  
3. **網路或地區限制** (10%)

## 🔧 立即行動項目

1. ✅ **重新生成 API Key** - 最有可能解決問題
2. ✅ **檢查 Google Cloud Console** - 確保 API 已啟用
3. ✅ **使用 curl 直接測試** - 排除代碼問題
4. ✅ **檢查計費設定** - 某些 API 需要啟用計費

## 📝 測試記錄

請記錄每個測試步驟的結果：

- [ ] Console 中 API Key 顯示正常
- [ ] curl 測試成功/失敗
- [ ] Google AI Studio 顯示 API Key 為 Active
- [ ] 重新生成 API Key 後測試
- [ ] Google Cloud Console 中 API 已啟用
