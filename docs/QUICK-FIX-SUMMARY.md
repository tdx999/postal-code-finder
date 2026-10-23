# 🔧 快速修復摘要 - ENOTFOUND 錯誤

## ❌ 原始問題

```
Error: getaddrinfo ENOTFOUND db.gtllzbdttawdekeiutii.supabase.co
```

**原因**：
1. API 檔案使用了 `ssl: false`，但 Supabase 需要 SSL
2. 各個 API 檔案重複建立資料庫連接池
3. 可能使用了錯誤的端口（5432 而非 6543）

## ✅ 已修復內容

### 1. 統一資料庫連接（6 個檔案）

將所有 API 改為使用統一的 `lib/db.js`：

- ✅ `pages/api/address/areas.js`
- ✅ `pages/api/address/cities.js`
- ✅ `pages/api/address/roads.js`
- ✅ `pages/api/address/postal-code.js`
- ✅ `pages/api/address/road-translation.js`
- ✅ `lib/db.js` （增強版）

### 2. 改進 `lib/db.js`

```javascript
// 自動判斷本地或遠端環境
const isLocal = process.env.DATABASE_URL && 
  (process.env.DATABASE_URL.includes('localhost') || 
   process.env.DATABASE_URL.includes('127.0.0.1'));

// 自動設定 SSL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false }, // 🔑 關鍵修復
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 3. 新增測試工具

新增 `npm run test:db` 命令來測試資料庫連接：
```bash
npm run test:db
```

## 🚀 立即部署步驟

### 第 1 步：設定 Vercel 環境變數

1. 登入 [Vercel Dashboard](https://vercel.com/dashboard)
2. 選擇你的專案
3. 進入 **Settings** → **Environment Variables**
4. 新增或更新以下變數：

```
變數名稱: DATABASE_URL
值: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
環境: Production, Preview, Development (全選)
```

⚠️ **超級重要**：
- 使用 **port 6543** (Transaction pooler)
- 不要用 **port 5432** (Direct connection)
- 替換 `[PROJECT-REF]` 和 `[PASSWORD]` 為實際值

### 第 2 步：取得正確的連接字串

在 Supabase Dashboard：

1. 進入你的專案
2. **Settings** → **Database**
3. 找到 **Connection string**
4. 選擇 **URI** 標籤
5. 在下拉選單選擇 **Transaction** (不是 Session)
6. 複製顯示的連接字串

範例（正確）：
```
✅ postgresql://postgres.gtllzbdttawdekeiutii:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

範例（錯誤）：
```
❌ postgresql://postgres:password@db.gtllzbdttawdekeiutii.supabase.com:5432/postgres
```

### 第 3 步：推送程式碼並部署

```bash
# 如果使用 Git
git add .
git commit -m "修復：統一資料庫連接並啟用 SSL"
git push

# 或使用 Vercel CLI
vercel --prod
```

### 第 4 步：驗證部署

測試 API 是否正常：

```bash
# 替換為你的 Vercel 網域
curl https://your-project.vercel.app/api/address/cities
```

預期看到城市列表，而不是錯誤訊息。

## 🔍 檢查 Vercel 環境變數

確認 Vercel 環境變數設定正確：

```bash
# 使用 Vercel CLI
vercel env ls
```

應該看到：
```
DATABASE_URL   Production, Preview, Development
NODE_ENV       Production
```

## 📝 本地開發設定

建立 `.env.local` 檔案（不要提交到 Git）：

```bash
# 本地開發（如果有本地資料庫）
DATABASE_URL=postgresql://postgres:password@localhost:5432/postgres

# 或使用 Supabase（本地開發也可以）
DATABASE_URL=postgresql://postgres.[REF]:[PWD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

測試本地連接：
```bash
npm run test:db
```

## ❓ 還是有問題？

### 檢查清單

1. ✅ Vercel 環境變數已設定？
2. ✅ 使用 port 6543（不是 5432）？
3. ✅ 連接字串格式正確？
4. ✅ 密碼沒有特殊字元（或已正確編碼）？
5. ✅ Supabase 專案正常運作？
6. ✅ 已推送最新程式碼？
7. ✅ Vercel 已重新部署？

### 查看 Vercel 日誌

1. Vercel Dashboard → 你的專案
2. **Deployments** → 最新部署
3. **Functions** 標籤
4. 查看函數日誌

### 測試 Supabase 連接

在 Supabase Dashboard：
1. **SQL Editor**
2. 執行：`SELECT COUNT(*) FROM postal_codes;`
3. 應該看到資料筆數

## 📚 完整文件

- [完整部署指南](./VERCEL-DEPLOYMENT.md) - 詳細說明
- [部署檢查清單](./DEPLOYMENT-CHECKLIST.md) - 逐步檢查
- [專案計畫](./docs/PROJECT_PLAN.md) - 專案架構

## 🎯 預期結果

修復後，API 應該：
- ✅ 正常回應資料
- ✅ 沒有 `ENOTFOUND` 錯誤
- ✅ 沒有 SSL 錯誤
- ✅ 沒有連接逾時

---

**如果按照以上步驟操作，問題應該可以解決！** 🎉

需要更多協助？查看 [VERCEL-DEPLOYMENT.md](./VERCEL-DEPLOYMENT.md) 的常見問題章節。

