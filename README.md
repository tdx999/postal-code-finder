# Taiwan Postal Code Finder

Next.js 14 / React 18 打造的郵遞區號查詢系統。資料來源為官方 3+3 郵遞區號資料整理後存放於 Supabase (PostgreSQL)，可以部署到 Vercel 並透過 API 對外提供查詢服務。
本地測試連線supabase要用
用 NODE_ENV=production 跑本機：npm run build && npm start
## 專案結構

```
postal-code-finder/
├─ components/        # React UI 元件
├─ lib/               # 共用工具（資料庫連線、限流…）
├─ pages/             # Next.js Pages + API Routes
├─ public/            # 靜態資源
├─ scripts/           # 匯入/檢查資料腳本
├─ database-export/   # 匯出/備份 SQL、CSV
├─ styles/            # CSS Modules
└─ package.json
```

## 主要技術

- **Next.js 14**（`output: 'standalone'`，可部署至 Vercel）
- **React 18**
- **Node.js 18+**
- **Supabase / PostgreSQL**（使用 Transaction Pooler 連線）
- **pg**：Node.js PostgreSQL client

## 環境變數

| 變數名稱      | 範例                                                                                  | 說明 |
|---------------|---------------------------------------------------------------------------------------|------|
| `DATABASE_URL`| `postgresql://postgres.<PROJECT_REF>:<PASSWORD>@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres` | Supabase Transaction Pooler 連線字串 |

> ⚠️ 注意：Supabase Dashboard → Settings → Database → Connection Pooling → Transaction Pooler 會提供 `aws-1-...pooler.supabase.com`（數字是 1）。請勿使用 `aws-0` 或 `db.<project>.supabase.co:5432` 的 direct connection，serverless 環境會因連線數受限而失敗。

## 快速開始

```bash
# 安裝依賴
npm install

# 建立 .env.local
echo "DATABASE_URL=postgresql://postgres.<PROJECT_REF>:<PASSWORD>@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres" > .env.local

# 開發模式
npm run dev

# Production build
npm run build
npm run start
```

## 部署到 Vercel

1. `git push` 到 GitHub/GitLab。
2. Vercel Import 專案 → 在 **Settings → General** 將 Root Directory 設為 `postal-code-finder`。
3. 在 **Settings → Environment Variables** 新增 `DATABASE_URL`（Production/Preview/Development 全部勾選）。
4. 點擊 Deploy（若要重新部署，可到 Deployments → 選最新一筆 → ⋯ → Redeploy）。

## 主要 npm scripts

| 指令              | 說明                                        |
|-------------------|---------------------------------------------|
| `npm run dev`     | 啟動 Next.js 開發環境                       |
| `npm run build`   | 建置 Production 版本                        |
| `npm run start`   | 以 Production 模式啟動                      |
| `npm run lint`    | ESLint                                      |
| `npm run test:db` | 使用 `scripts/test-db-connection.js` 測試 DB 連線 |

## 資料庫（roads 表）

API 目前使用 `roads` 表，主要欄位：
- `city`：縣市
- `area`：行政區
- `road`：道路名稱
- `zipcode`：郵遞區號
- 其他欄位：巷弄/門牌範圍等（可參考 `database-export/` 中的 CSV/SQL）

可透過 `database-export/import-supabase.js` 或 `scripts/` 內工具匯入資料，匯入後使用下列腳本驗證：

```bash
node test-connection-quick.js "postgresql://postgres.<PROJECT_REF>:<PASSWORD>@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres"
```

## API 一覽

所有 API 位於 `pages/api/`。均內建 rate limit（`lib/rateLimit.js`）。

### URL 調用快速範例

以下示範可直接在瀏覽器或 HTTP 客戶端呼叫的完整網址，僅需將網域 `https://your-domain.vercel.app` 換成實際部署網址：

```
# 郵遞區號查詢：完整地址參數
https://postal-code-finder-kshtn6k5n-autoassts-projects.vercel.app/api/postal-code?address=桃園市中壢區中山路100號
```

### 1. 郵遞區號 / 地址搜尋

```
GET /api/address/postal-code
```

| 參數                | 說明                                                     |
|---------------------|----------------------------------------------------------|
| `address`           | 完整地址，系統會自動解析 city/district/road             |
| `city`              | 縣市                                                     |
| `district`          | 區（對應資料庫 `area` 欄位）                             |
| `road`              | 道路名稱（支援模糊查詢）                                 |
| `zipcode`           | 郵遞區號                                                 |
| `limit`             | 回傳筆數（預設 100）                                     |
| `distinctDistricts` | `true` 時只回傳某城市的行政區清單                        |

**範例：**
```
GET /api/address/postal-code?city=桃園市&district=中壢區&road=中山路
```

**回應：**
```json
{
  "success": true,
  "data": [
    {
      "city": "桃園市",
      "area": "中壢區",
      "road": "中山路",
      "zipcode": "320",
      "...": "..."
    }
  ],
  "count": 1
}
```

### 2. 城市列表

```
GET /api/address/cities
```

從 `roads` 取得唯一 `city`，並依預設順序（北→南）排序。

```json
{
  "success": true,
  "data": ["基隆市", "臺北市", "新北市", "..."],
  "count": 22
}
```

### 3. 指定城市的行政區

```
GET /api/address/areas?city=桃園市
```

回傳該城市所有 `area`。

```json
{
  "success": true,
  "areas": ["桃園區", "中壢區", "..."],
  "count": 13
}
```

### 4. 指定城市/區的道路清單

```
GET /api/address/roads?city=桃園市&district=桃園區&search=中山
```

| 參數      | 說明                     |
|-----------|--------------------------|
| `city`    | 必填                     |
| `district`| 必填（對應 `area`）      |
| `search`  | 選填，模糊查道路         |

```json
{
  "success": true,
  "roads": ["中山路", "中山北路", "..."],
  "count": 42
}
```

## 限流與錯誤處理

- `lib/rateLimit.js` 以 IP 為基礎限制每分鐘請求數，Config 在 `config/rateLimit.json`。
- 錯誤訊息：開發模式 (`NODE_ENV=development`) 會回傳詳細錯誤，Production 則顯示泛用訊息。

## 開發注意事項

1. **連線池**：`lib/db.js` 會依 `DATABASE_URL` 判斷是否啟用 SSL（Supabase 會自動 `rejectUnauthorized: false`）。
2. **資料表**：目前所有 API 使用 `roads` 表，如需改回 `postal_codes`，請同步調整 SQL。
3. **部署**：`next.config.js` 已設定 `output: 'standalone'`，並在 client build 停用 `fs/net/tls/dns` 以避免打包錯誤。
4. **Git**：`.env*` 已在 `.gitignore` 中，請勿提交任何密碼或連線字串。

## 後續規劃

- [ ] API Key / 計費模組
- [ ] 管理後台（流量、查詢統計）
- [ ] 多語系介面
- [ ] 與其他系統（物流、不動產…）整合

---

若需資料匯入或部署協助，可參考 `database-export/`、`scripts/` 內的工具，或開 Issue 提問。祝查詢順利！

