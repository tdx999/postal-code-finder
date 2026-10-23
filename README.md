# 📮 Taiwan Postal Code Finder (台灣 3+3 郵遞區號查詢系統)

> 🌐 **線上體驗網址 (Live Demo)**：[https://postal-code-finder-lac.vercel.app/](https://postal-code-finder-lac.vercel.app/)

一個簡單、快速、現代化的台灣郵遞區號查詢系統。基於 **Next.js 14** 與 **Supabase (PostgreSQL)** 開發，支援智慧地址解析、視覺化前端查詢頁面，並提供開箱即用的 RESTful API，可直接免費一鍵部署到 **Vercel**！

---

## ✨ 核心特色

- 🔍 **智慧地址查詢**：直接輸入完整地址（如「桃園市中壢區中山路100號」），自動精準解析 3+3 碼郵遞區號。
- 🏙️ **階層式下拉查詢**：提供「縣市 → 行政區 → 路名」三級連動快速檢索。
- ⚡ **高效能連線池**：採用 Supabase Transaction Pooler，在 Serverless 環境下穩定不斷線。
- 🛡️ **內建 API 限流保護**：防止被高頻惡意刷量，保障伺服器安全。
- 📱 **RWD 響應式介面**：手機、平板、電腦都能完美瀏覽使用。
- 🚀 **一鍵部署**：完整支援 Vercel，5 分鐘即可上線對外服務。

---

## 📁 專案目錄簡介

```text
postal-code-finder/
├── components/          # 視覺化 UI 元件（地址表單、廣告、展示元件）
├── pages/               # 頁面與 API 端點
│   ├── index.js         # 前端首頁
│   ├── api-docs.js      # API 線上文件說明頁
│   └── api/             # 後端 API (查詢郵遞區號、縣市、區域、路名)
├── lib/                 # 共用工具（PostgreSQL 連線池、API 限流器）
├── config/              # 設定檔（限流規則 rateLimit.json）
├── scripts/             # 資料庫連線測試與匯入工具
├── docs/                # 詳細部署與疑難排解指南
└── public/              # 靜態資源與外部嵌入小工具 (zip-widget.js)
```

---

## 🚀 小白 3 步驟快速上手（本機運行）

### 第 1 步：安裝專案套件
確保電腦已安裝 [Node.js](https://nodejs.org/) (建議 v18 或以上)，在終端機執行：

```bash
npm install
```

### 第 2 步：設定資料庫連線（環境變數）
在專案根目錄新增一個名為 `.env.local` 的檔案，並填入您的 Supabase 資料庫連線字串：

```env
DATABASE_URL="postgresql://postgres.[專案ID]:[你的資料庫密碼]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres"
```

> **新手注意**：
> 1. 請使用 Supabase 的 **Transaction Pooler** 連線（連接埠為 `6543`，網址通常包含 `pooler.supabase.com`）。
> 2. 請**不要**使用 5432 的直接連線，避免 Serverless 環境因連線數過多而報錯。
> 3. 您可以隨時執行 `npm run test:db` 測試連線是否正常。

### 第 3 步：啟動本機開發伺服器

```bash
npm run dev
```

打開瀏覽器前往 [http://localhost:3000](http://localhost:3000)，即可看到查詢系統！

---

## 📡 常用 API 調用範例（新手秒懂）

所有 API 均支援直接以 GET 方式呼叫，回傳標準 JSON 格式：

### 1. 輸入完整地址，查詢郵遞區號（最常用）
- **請求格式**：`GET /api/postal-code?address=完整地址`
- **範例網址**：
  ```
  http://localhost:3000/api/postal-code?address=桃園市中壢區中山路100號
  ```
- **回傳範例**：
  ```json
  {
    "success": true,
    "zipcode": "320001",
    "city": "桃園市",
    "district": "中壢區",
    "road": "中山路"
  }
  ```

### 2. 取得全台灣縣市清單
- **範例網址**：`GET /api/address/cities`
- **回傳範例**：
  ```json
  {
    "success": true,
    "data": ["基隆市", "臺北市", "新北市", "桃園市", "..."],
    "count": 22
  }
  ```

### 3. 取得某縣市的行政區
- **範例網址**：`GET /api/address/areas?city=桃園市`
- **回傳範例**：
  ```json
  {
    "success": true,
    "areas": ["桃園區", "中壢區", "八德區", "..."],
    "count": 13
  }
  ```

### 4. 取得某區域的道路清單（支援模糊搜尋）
- **範例網址**：`GET /api/address/roads?city=桃園市&district=中壢區&search=中山`
- **回傳範例**：
  ```json
  {
    "success": true,
    "roads": ["中山路", "中山東路", "中山東路一段", "..."]
  }
  ```

---

## ☁️ 如何一鍵免費部署到 Vercel

想要把網站放到網路上讓大家使用？跟著以下步驟走：

1. **推送到 GitHub**：確認最新程式碼已推送到您的 GitHub 倉庫。
2. **登入 Vercel**：前往 [Vercel 官網](https://vercel.com/)，使用 GitHub 帳號登入。
3. **匯入專案 (Import Project)**：
   - 點擊 **「Add New...」** → **「Project」**。
   - 找到您的 `postal-code-finder` 儲存庫，點擊 **「Import」**。
4. **設定環境變數 (Environment Variables)**：
   - 在專案設定中的 **Environment Variables** 區塊：
     - **Key**：`DATABASE_URL`
     - **Value**：貼上您的 Supabase 連線字串
     - Environment 全部勾選（Production, Preview, Development）
5. **點擊「Deploy」**：約等待 1~2 分鐘，完成後即可獲得專屬網址！🎉

---

## ❓ 常見問題 Q&A

**Q1：為什麼執行 `npm run dev` 搜尋時會顯示資料庫連線失敗？**  
A：請檢查 `.env.local` 裡面的 `DATABASE_URL` 密碼是否正確，並且確認使用的是 Supabase 的 Pooler 連線（連接埠 `6543`）。

**Q2：如何自訂 API 請求次數限制？**  
A：可直接修改 `config/rateLimit.json`，調整每分鐘允許呼叫的次數上限。

**Q3：如何把查詢小工具嵌入到其他網站？**  
A：本專案已提供 `public/zip-widget.js`，其他網站只需引入該 script 即可輕鬆顯示查詢小工具。詳細可參考 `/pages/embed-demo.js`。

---

## 📜 開源協議 (License)

本專案採用 [MIT License](LICENSE) 授權。歡迎自由修改、學習與使用！
