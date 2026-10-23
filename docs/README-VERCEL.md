# 📦 郵遞區號查詢系統 - Vercel 部署指南

> 快速部署台灣郵遞區號查詢系統到 Vercel + Supabase

## 🎯 架構概覽

```
使用者瀏覽器
    ↓
Vercel (Next.js API Routes)
    ↓
Supabase (PostgreSQL Database)
```

## ⚡ 快速開始（5 分鐘部署）

### 1️⃣ 取得 Supabase 連接字串

```bash
📍 登入 Supabase Dashboard
   → 選擇專案
   → Settings → Database
   → Connection string
   → 選擇 "URI" 標籤
   → 下拉選單選 "Transaction" (重要！)
   → 複製連接字串
```

正確格式（注意 port **6543**）：
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

### 2️⃣ 設定 Vercel 環境變數

```bash
📍 Vercel Dashboard
   → 選擇專案
   → Settings → Environment Variables
   → Add New
```

新增以下變數：

| 變數名稱 | 值 | 環境 |
|---------|-----|------|
| `DATABASE_URL` | 你的 Supabase 連接字串 | ✅ Production<br>✅ Preview<br>✅ Development |
| `NODE_ENV` | `production` | ✅ Production |

### 3️⃣ 部署

**方式 A：從 GitHub（推薦）**
```bash
git add .
git commit -m "設定資料庫連接"
git push
```

**方式 B：使用 Vercel CLI**
```bash
vercel --prod
```

### 4️⃣ 測試

```bash
# 測試 API（替換為你的網域）
curl https://your-project.vercel.app/api/address/cities

# 預期回應
{
  "success": true,
  "data": ["基隆市", "臺北市", "新北市", ...],
  "count": 22
}
```

## 📋 完整部署檢查清單

### Supabase 準備
- [ ] 專案已建立
- [ ] 資料表 `postal_codes` 或 `roads` 已建立
- [ ] 資料已匯入（約 7.9 萬筆）
- [ ] 索引已建立

### 程式碼準備
- [x] ✅ 已統一使用 `lib/db.js`
- [x] ✅ SSL 設定已修正
- [x] ✅ 所有 API 已更新

### Vercel 設定
- [ ] 環境變數 `DATABASE_URL` 已設定
- [ ] 使用 port **6543** (不是 5432)
- [ ] 三個環境都已設定

### 驗證
- [ ] API 正常回應
- [ ] 無 `ENOTFOUND` 錯誤
- [ ] 無 SSL 錯誤
- [ ] 資料正確返回

## 🔧 修復內容

### 修正前（❌ 錯誤）

```javascript
// ❌ 每個 API 都自己建立連接池
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false, // ❌ Supabase 需要 SSL！
  ...
});
```

### 修正後（✅ 正確）

```javascript
// ✅ 統一使用 lib/db.js
import pool from '../../../lib/db';
```

```javascript
// lib/db.js - 自動處理 SSL
const isLocal = DATABASE_URL.includes('localhost');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false }, // ✅ 自動判斷
  ...
});
```

## 🔍 錯誤排除

### ❌ 錯誤 1：ENOTFOUND

```
Error: getaddrinfo ENOTFOUND db.xxx.supabase.co
```

**原因**：使用了 port 5432 而非 6543

**解決**：
```bash
# ❌ 錯誤（Direct connection）
postgresql://...@db.xxx.supabase.co:5432/postgres

# ✅ 正確（Transaction pooler）
postgresql://...@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

### ❌ 錯誤 2：SSL Connection Error

**原因**：程式碼中 `ssl: false`

**解決**：已修復，使用 `lib/db.js`

### ❌ 錯誤 3：Connection Timeout

**原因**：連接設定不適合 serverless

**解決**：使用 Transaction pooler (port 6543)

### ❌ 錯誤 4：Too Many Connections

**原因**：超過連接數限制

**解決**：
1. 使用 pooler (port 6543)
2. 檢查是否有多個部署
3. 考慮升級 Supabase 方案

## 📊 API 端點

### 城市列表
```
GET /api/address/cities
```

### 區域列表
```
GET /api/address/areas?city=臺北市
```

### 道路列表
```
GET /api/address/roads?city=臺北市&district=中正區
```

### 郵遞區號查詢
```
GET /api/address/postal-code?city=臺北市&district=中正區&road=八德路
```

## 🧪 本地測試

### 1. 安裝依賴
```bash
npm install
```

### 2. 建立環境變數檔案
```bash
# 建立 .env.local
echo "DATABASE_URL=your-connection-string" > .env.local
```

### 3. 測試資料庫連接
```bash
npm run test:db
```

### 4. 啟動開發伺服器
```bash
npm run dev
```

### 5. 測試 API
```bash
curl http://localhost:3000/api/address/cities
```

## 📚 相關文件

| 文件 | 用途 |
|------|------|
| [QUICK-FIX-SUMMARY.md](./QUICK-FIX-SUMMARY.md) | 快速修復指南 |
| [VERCEL-DEPLOYMENT.md](./VERCEL-DEPLOYMENT.md) | 完整部署說明 |
| [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md) | 部署檢查清單 |
| [PROJECT_PLAN.md](./docs/PROJECT_PLAN.md) | 專案計畫 |

## 🎉 部署成功！

如果按照以上步驟操作，你的郵遞區號查詢系統應該已經成功部署到 Vercel！

**測試你的部署**：
```bash
curl https://your-project.vercel.app/api/address/cities
```

---

### 🆘 需要協助？

1. 查看 [QUICK-FIX-SUMMARY.md](./QUICK-FIX-SUMMARY.md)
2. 檢查 Vercel 函數日誌
3. 確認環境變數設定
4. 測試 Supabase 連接

### 💡 小技巧

- 使用 **Transaction pooler** (port 6543) 而非直接連接
- 在 Vercel 設定環境變數時，三個環境都要勾選
- 密碼中如有特殊字元，需要進行 URL 編碼
- 定期檢查 Supabase 連接數使用量

---

**專案資訊**
- 🔧 框架：Next.js 14
- 🗄️ 資料庫：Supabase (PostgreSQL)
- 🚀 部署：Vercel
- 📦 資料筆數：79,282 筆台灣郵遞區號資料

