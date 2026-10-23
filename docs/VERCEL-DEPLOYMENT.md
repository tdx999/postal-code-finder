# Vercel + Supabase 部署指南

## 📋 部署前準備

### 1. Supabase 資料庫設定

確保你的 Supabase 專案已經：
- ✅ 建立了資料庫表格（`postal_codes` 或 `roads`）
- ✅ 匯入了郵遞區號資料
- ✅ 取得了連線資訊

### 2. 取得 Supabase 連線資訊

登入 [Supabase Dashboard](https://supabase.com/dashboard)：

1. 選擇你的專案
2. 點擊左側選單 **Settings** → **Database**
3. 找到 **Connection string** 區塊
4. 選擇 **URI** 模式
5. 複製連接字串（格式如下）：

```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

⚠️ **重要**：
- 使用 **Transaction pooler** (port `6543`)，不要用 Session pooler (port `5432`)
- Transaction pooler 更適合 Vercel serverless 環境
- 記得替換 `[YOUR-PASSWORD]` 為你的資料庫密碼

## 🚀 Vercel 部署步驟

### 方法一：從 GitHub 部署（推薦）

1. **推送程式碼到 GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/your-username/postal-code-finder.git
   git push -u origin main
   ```

2. **連接 Vercel**
   - 登入 [Vercel Dashboard](https://vercel.com)
   - 點擊 **Add New** → **Project**
   - 選擇你的 GitHub repository
   - 點擊 **Import**

3. **設定環境變數**
   
   在 Vercel 專案設定中，進入 **Settings** → **Environment Variables**，新增以下變數：

   | 變數名稱 | 值 | 環境 |
   |---------|-----|------|
   | `DATABASE_URL` | `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres` | Production, Preview, Development |
   | `NODE_ENV` | `production` | Production |

   ⚠️ **注意**：
   - 確保使用 **port 6543** (Transaction pooler)
   - 替換 `[PROJECT-REF]` 和 `[PASSWORD]` 為實際值
   - 所有三個環境（Production, Preview, Development）都要設定

4. **部署**
   - 點擊 **Deploy**
   - 等待建置完成

### 方法二：使用 Vercel CLI

1. **安裝 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登入 Vercel**
   ```bash
   vercel login
   ```

3. **部署**
   ```bash
   vercel
   ```

4. **設定環境變數**
   ```bash
   vercel env add DATABASE_URL
   # 貼上你的 DATABASE_URL
   # 選擇 Production, Preview, Development (按空白鍵選擇多個)
   ```

5. **重新部署**
   ```bash
   vercel --prod
   ```

## 🔍 驗證部署

### 1. 檢查 API 端點

訪問以下 URL（替換為你的 Vercel 網域）：

```bash
# 測試城市列表
https://your-project.vercel.app/api/address/cities

# 測試區域列表
https://your-project.vercel.app/api/address/areas?city=臺北市

# 測試郵遞區號查詢
https://your-project.vercel.app/api/address/postal-code?city=臺北市&district=中正區
```

### 2. 查看 Vercel 日誌

如果遇到錯誤：
1. 進入 Vercel Dashboard
2. 選擇你的專案
3. 點擊 **Deployments**
4. 選擇最新的部署
5. 點擊 **Functions**
6. 查看函數日誌

## ❌ 常見問題排除

### 錯誤 1: `ENOTFOUND db.xxx.supabase.co`

**原因**：使用了直接連接端口（5432）而不是 pooler 端口（6543）

**解決**：
- 確認 `DATABASE_URL` 使用 **port 6543**
- 格式：`postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`

### 錯誤 2: `SSL connection error`

**原因**：SSL 設定不正確

**解決**：
- 程式碼已自動處理 SSL
- 確保 `DATABASE_URL` 正確
- 檢查 `lib/db.js` 是否有正確的 SSL 設定

### 錯誤 3: `Connection timeout`

**原因**：連接池設定不適合 serverless

**解決**：
- 使用 Transaction pooler (port 6543)
- 不要用 Session pooler (port 5432)
- 確保 Supabase 專案在正確的區域

### 錯誤 4: `Too many connections`

**原因**：連接數超過限制

**解決**：
- 使用 Supabase 的 pooler (port 6543)
- 檢查是否有多個部署同時運行
- 考慮升級 Supabase 方案

## 📝 環境變數說明

### DATABASE_URL 格式解析

```
postgresql://[user]:[password]@[host]:[port]/[database]?[options]
```

**Supabase Transaction Pooler 範例**：
```
postgresql://postgres.gtllzbdttawdekeiutii:your_password_here@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

**欄位說明**：
- `user`: `postgres.[PROJECT-REF]`
- `password`: 你的資料庫密碼
- `host`: `aws-0-ap-southeast-1.pooler.supabase.com` （依區域不同）
- `port`: `6543` （Transaction pooler）
- `database`: `postgres`

## 🎯 最佳實踐

### 1. 使用環境變數

永遠不要在程式碼中硬編碼：
- ❌ 資料庫密碼
- ❌ API 金鑰
- ❌ 連接字串

### 2. 使用 Connection Pooler

在 Vercel/serverless 環境中：
- ✅ 使用 Transaction pooler (port 6543)
- ❌ 避免使用 Direct connection (port 5432)
- ❌ 避免使用 Session pooler (port 6543)

### 3. 錯誤處理

確保所有 API 都有適當的錯誤處理：
```javascript
try {
  const result = await pool.query(sql, params);
  return res.json({ success: true, data: result.rows });
} catch (error) {
  console.error('Database error:', error);
  return res.status(500).json({ 
    success: false, 
    message: '伺服器錯誤',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
}
```

### 4. 監控與日誌

- 定期檢查 Vercel 函數日誌
- 監控 Supabase 資料庫連接數
- 設定錯誤通知

## 🔗 相關資源

- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [PostgreSQL Connection Pooling](https://www.postgresql.org/docs/current/runtime-config-connection.html)

## 📞 需要協助？

如果遇到問題：
1. 檢查 Vercel 部署日誌
2. 確認環境變數設定正確
3. 測試 Supabase 連接
4. 查看本文件的常見問題

