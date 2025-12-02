# 🔧 Gemini API 問題解決記錄

## ✅ 已修復的問題

### **主要問題：模型名稱不正確**

**錯誤的模型名稱**：
- ❌ `"gemini-2.5-flash"` (不存在)
- ❌ `"gemini-3-pro-preview"` (不存在)

**正確的模型名稱**：
- ✅ `"gemini-1.5-flash"` (快速回應，適合文檔處理)
- ✅ `"gemini-1.5-pro"` (增強版本，適合複雜邏輯分析)

### **為什麼模型名稱錯誤會導致 "API key not valid" 錯誤？**

Google Generative AI API 在遇到不存在的模型時，會返回 `API_KEY_INVALID` 錯誤，而不是 `MODEL_NOT_FOUND`。這容易誤導開發者以為是 API key 的問題。

## 🎯 **目前的配置**

```javascript
// PDF 解析使用
const model = "gemini-1.5-flash"; 

// 程式碼評分使用  
const model = "gemini-1.5-pro";
```

## 📋 **有效的 Gemini 模型列表**

### **文字生成模型**：
- `gemini-pro` - 基本模型
- `gemini-1.5-pro` - 增強版本 (推薦)
- `gemini-1.5-flash` - 快速版本

### **多模態模型**：
- `gemini-pro-vision` - 支援圖像
- `gemini-1.5-pro-vision` - 增強版多模態

## 🔍 **調試功能**

已在代碼中添加調試信息：
- API Key 長度檢查
- 使用的模型名稱顯示
- 詳細錯誤信息

## ✅ **驗證步驟**

1. **重啟開發服務器**：`npm run dev`
2. **檢查 Console**：應該看到 "正在呼叫 Gemini API，模型: gemini-1.5-flash"
3. **測試功能**：上傳 PDF 或使用程式碼評分
4. **確認成功**：如果 API key 有效，功能應該正常運作

## ⚠️ **如果問題持續**

1. **檢查 API Key**：確保在 Google AI Studio 中 API key 狀態為 Active
2. **檢查配額**：確保沒有超出使用限制
3. **檢查權限**：確保 API key 有權限使用 Generative Language API

## 🚀 **下一步**

功能測試完成後，建議移除調試 console.log 語句以保持代碼清潔。
