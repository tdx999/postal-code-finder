# 🚀 Vercel 部署檢查清單

## ✅ 部署前檢查

### 1️⃣ Supabase 資料庫設定

- [ ] Supabase 專案已建立
- [ ] 資料表已建立（`postal_codes` 或 `roads`）
- [ ] 資料已匯入
- [ ] 已取得 Transaction Pooler 連接字串（port 6543）

### 2️⃣ 程式碼準備

- [ ] 所有 API 檔案已使用統一的 `lib/db.js`
- [ ] `lib/db.js` 包含正確的 SSL 設定
- [ ] 移除所有硬編碼的資料庫連接
- [ ] `.gitignore` 包含環境變數檔案

### 3️⃣ Vercel 環境變數

在 Vercel 專案設定中新增：

```
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
NODE_ENV=production
```

⚠️ **重要**：
- 使用 **port 6543** (Transaction pooler)
- 替換 `[PROJECT-REF]` 為你的 Supabase 專案 ID
- 替換 `[PASSWORD]` 為你的資料庫密碼
- 在 Production, Preview, Development 三個環境都要設定

## 📝 Supabase 連接字串取得步驟

1. 登入 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇你的專案
3. 點擊 **Settings** → **Database**
4. 找到 **Connection string** 區塊
5. 選擇 **URI** 標籤
6. 在 **Connection pooling** 下方選擇 **Transaction**
7. 複製連接字串

範例格式：
```
postgresql://postgres.gtllzbdttawdekeiutii:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

## 🔧 修改內容摘要

已修改以下檔案來統一使用 `lib/db.js`：

1. ✅ `pages/api/address/areas.js`
2. ✅ `pages/api/address/cities.js`
3. ✅ `pages/api/address/roads.js`
4. ✅ `pages/api/address/postal-code.js`
5. ✅ `pages/api/address/road-translation.js`
6. ✅ `lib/db.js` （增強 SSL 處理和錯誤處理）

## 🧪 部署後測試

部署完成後，測試以下 API：

### 1. 城市列表
```bash
curl https://your-project.vercel.app/api/address/cities
```

預期回應：
```json
{
  "success": true,
  "data": ["基隆市", "臺北市", "新北市", ...],
  "count": 22
}
```

### 2. 區域列表
```bash
curl "https://your-project.vercel.app/api/address/areas?city=臺北市"
```

預期回應：
```json
{
  "success": true,
  "areas": ["中正區", "大同區", "中山區", ...]
}
```

### 3. 道路列表
```bash
curl "https://your-project.vercel.app/api/address/roads?city=臺北市&district=中正區"
```

預期回應：
```json
{
  "success": true,
  "roads": ["八德路", "三元街", ...],
  "count": 100
}
```

### 4. 郵遞區號查詢
```bash
curl "https://your-project.vercel.app/api/address/postal-code?city=臺北市&district=中正區"
```

預期回應：
```json
{
  "success": true,
  "data": [...],
  "count": 50
}
```

## ❌ 錯誤排除

### 錯誤：`ENOTFOUND db.xxx.supabase.co`

**原因**：使用了直接連接（port 5432）而不是 pooler（port 6543）

**解決**：
1. 檢查 Vercel 環境變數中的 `DATABASE_URL`
2. 確認使用 **port 6543**
3. 格式：`postgresql://postgres.[REF]:[PWD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`

### 錯誤：`Connection timeout`

**原因**：連接設定不適合 serverless 環境

**解決**：
1. 確認使用 Transaction pooler (port 6543)
2. 檢查 Supabase 專案狀態
3. 確認網路連接正常

### 錯誤：`SSL connection error`

**原因**：SSL 設定錯誤

**解決**：
1. 確認 `lib/db.js` 包含：
   ```javascript
   ssl: isLocal ? false : { rejectUnauthorized: false }
   ```
2. 確認已推送最新程式碼
3. 重新部署 Vercel

### 錯誤：`Too many connections`

**原因**：連接數超過限制

**解決**：
1. 使用 Transaction pooler (port 6543)
2. 檢查是否有多個部署同時運行
3. 考慮升級 Supabase 方案

## 📊 Vercel 部署狀態檢查

1. 進入 [Vercel Dashboard](https://vercel.com/dashboard)
2. 選擇你的專案
3. 查看 **Deployments** 狀態
4. 點擊最新部署查看日誌
5. 檢查 **Functions** 日誌是否有錯誤

## 🎯 最終確認

- [ ] API 端點正常回應
- [ ] 沒有 500 錯誤
- [ ] 資料正確返回
- [ ] Vercel 日誌沒有錯誤
- [ ] 所有環境變數已設定

## 📚 相關文件

- [完整部署指南](./VERCEL-DEPLOYMENT.md)
- [專案計畫](./docs/PROJECT_PLAN.md)
- [限流管理](./docs/rate-limit-admin.md)

---

**完成此檢查清單後，你的郵遞區號查詢系統應該可以正常運作！** 🎉

