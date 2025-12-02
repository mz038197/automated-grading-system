# 🔐 Firestore 資料安全性指南

## ✅ 已實現的安全措施

### 1. **用戶資料隔離**
- ✅ 所有 Firestore 資料存放在 `/users/{uid}/` 路徑下
- ✅ 每個用戶只能存取自己的資料夾和題庫
- ✅ 身份驗證檢查在每次資料庫操作時進行

### 2. **身份驗證**
- ✅ Firebase Authentication 整合
- ✅ Google OAuth 登入
- ✅ 開發模式的 Mock 用戶支援
- ✅ 登出時清理用戶狀態

### 3. **資料存取控制**
```typescript
// 所有資料庫操作都經過身份驗證檢查
getFolderCol: () => {
  const uid = getCurrentUserId();
  if (!uid) throw new Error("User not authenticated");
  return collection(getDb(), "users", uid, "folders");
}
```

## 🛡️ Firestore Security Rules

請在 Firebase Console 中設定以下安全規則：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 用戶只能存取自己的資料
    match /users/{userId}/folders/{folderId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /users/{userId}/banks/{bankId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 拒絶所有其他路径的存取
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## 🔧 部署檢查清單

### Render 部署前確認：

1. **環境變數設定** ✅
   ```
   NODE_ENV=production
   FIREBASE_API_KEY=your-api-key
   FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   FIREBASE_APP_ID=your-app-id
   API_KEY=your-gemini-api-key
   ```

2. **Firebase 專案設定** ✅
   - Firebase Authentication 啟用 Google 提供者
   - Firestore 資料庫已建立
   - 安全規則已部署

3. **應用程式配置** ✅
   - `package.json` 包含 `start` script
   - `server.js` 設定正確的 PORT
   - 建構命令：`npm install && npm run build`
   - 啟動命令：`npm start`

## 🔍 安全性特點

### ✅ **已確保的安全性**
1. **完全的用戶隔離**：每個用戶只能看到自己的資料夾和題庫
2. **身份驗證保護**：未登入用戶無法存取任何資料
3. **分享功能安全**：題庫分享透過 URL 編碼，不涉及資料庫權限
4. **錯誤處理**：未授權存取會記錄並拋出錯誤

### 🛡️ **多層防護**
1. **前端檢查**：`getCurrentUserId()` 驗證
2. **資料庫路徑隔離**：`/users/{uid}/`
3. **Firestore 規則**：伺服器端權限控制
4. **Firebase Auth**：Google OAuth 身份驗證

## ⚠️ 注意事項

1. **Gemini API Key**：目前在前端使用，建議未來移至後端
2. **分享連結**：包含完整題庫資料，請確保不分享敏感內容
3. **開發模式**：使用 localStorage，生產環境會自動切換到 Firestore

## 🚀 驗證步驟

部署後請驗證：
1. 不同用戶登入後看不到彼此的資料
2. 未登入狀態無法存取任何功能
3. 分享功能正常運作
4. Firebase Console 中可看到正確的用戶資料結構
