# 🗄️ 資料庫架構與資料建置說明 (Database Guide)

本專案採用 **Supabase (PostgreSQL)** 作為後端資料庫，儲存全台灣各縣市、行政區、道路與 3+3 郵遞區號的對照資料。

---

## 📌 為什麼 Git 沒有直接放完整的資料庫檔案？

1. **雲端託管架構**：本專案為前後端分離的雲端架構，網站部署在 Vercel 上，透過環境變數 `DATABASE_URL` 直接連線至雲端 Supabase，不需要依賴本地資料庫檔案。
2. **檔案大小限制**：全台 79,281 筆道路與門牌規則的 SQL / CSV / JSON 備份檔合計超過 100MB。推送到 GitHub 會使儲存庫過於肥大，甚至超出 GitHub 的檔案大小上限（100MB），因此在 `.gitignore` 中將備份檔予以排除。
3. **安全考量**：資料庫主機與帳密屬於機密資訊，透過雲端隔離與環境變數管理更符合資安規範。

---

## 📊 資料表架構 (Schema)

本系統核心資料表為 `roads`，包含以下欄位：

| 欄位名稱 | 型別 | 必填 | 說明 | 範例 |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `SERIAL PRIMARY KEY` | 是 | 自動遞增唯一識別碼 | `1` |
| `city` | `VARCHAR(50)` | 是 | 縣市名稱 | `台北市`、`桃園市` |
| `area` | `VARCHAR(50)` | 是 | 鄉鎮市區 | `中正區`、`中壢區` |
| `zipcode` | `VARCHAR(10)` | 是 | 郵遞區號（3碼或 3+3 碼） | `100`、`320` |
| `road` | `VARCHAR(100)` | 是 | 道路名稱 | `中山路`、`忠孝東路一段` |
| `scoop` | `VARCHAR(200)` | 否 | 門牌投遞範圍規則 | `單全`、`雙 2至100號` |
| `created_at` | `TIMESTAMP` | 否 | 建立時間戳記 | `2025-11-20 16:53:03` |

### 查詢優化索引 (Indexes)

為了確保在 8 萬筆資料中，前端查詢與 API 可以在 50ms 內完成回應，我們在資料庫建立了 5 個專用索引：
- `idx_roads_city`：依縣市快速篩選
- `idx_roads_area`：依行政區快速篩選
- `idx_roads_city_area`：縣市與行政區複合查詢
- `idx_roads_road`：道路名稱模糊比對加速
- `idx_roads_zipcode`：郵遞區號反查加速

---

## 🚀 如何在新的 Supabase 專案中建立資料庫？

若您未來需要重新建立一個全新的 Supabase 專案，只需 2 步驟：

### 步驟 1：建立資料表結構
1. 登入 [Supabase Dashboard](https://supabase.com/dashboard) 並進入專案。
2. 點選左側選單的 **「SQL Editor」**。
3. 開啟本專案的 [`scripts/schema.sql`](../scripts/schema.sql)，複製內容並貼到 SQL Editor 執行（Run）。
4. 執行完成後，`roads` 資料表與所有索引即建立完成！

### 步驟 2：資料來源與匯入說明
- **資料來源**：官方中華郵政 3+3 郵遞區號開放資料（經清洗後轉換為道路對照表）。
- **匯入方式**：可透過 Supabase Dashboard 的 Table Editor 直接匯入 CSV，或利用本機執行 SQL 分批匯入指令碼。
- **資料驗證**：在終端機執行 `npm run test:db`，即可自動檢查資料表是否存在以及資料總筆數（正確筆數應約為 79,281 筆）。
