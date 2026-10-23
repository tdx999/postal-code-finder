# 🔍 Supabase 連接字串取得詳細指南

## 📍 方法 1：從 Database Settings 取得（推薦）

### 步驟 1：進入 Database Settings

1. 前往 https://supabase.com/dashboard
2. 登入你的帳號
3. 在專案列表中，點擊你的專案（`gtllzbdttawdekeiutii`）
4. 在左側選單找到並點擊 **⚙️ Project Settings**（最下方，齒輪圖示）
5. 在 Settings 子選單中，點擊 **Database**

### 步驟 2：找到 Connection string 區塊

在 Database 頁面中，向下滾動，你會看到以下區塊（按順序）：

```
┌─────────────────────────────────────────┐
│ Database Settings                       │
│                                         │
│ 1. General                              │
│    - Host, Database name, Port, etc.    │
│                                         │
│ 2. Connection Info                      │  ← 可能在這裡
│                                         │
│ 3. Connection string                    │  ← 主要在這裡
│    [Nodejs] [URI] [JDBC] [.NET]         │
│                                         │
│ 4. Connection pooling                   │  ← 或在這裡
│                                         │
└─────────────────────────────────────────┘
```

### 步驟 3：選擇正確的模式

找到 Connection string 或 Connection pooling 區塊後：

1. 點擊 **URI** 標籤（不是 Nodejs、JDBC 或 .NET）
2. 查看是否有 **Mode** 或 **Pooler** 下拉選單
3. 如果有，選擇 **Transaction** 模式
4. 複製顯示的連接字串

## 📍 方法 2：從 Connection Pooling 區塊取得

如果你看到 "Connection pooling" 標題：

1. 展開 **Connection pooling** 區塊
2. 確認 **Pool mode** 設定為 **Transaction**
3. 找到 **Connection string** 欄位
4. 複製連接字串

預期格式：
```
postgresql://postgres.gtllzbdttawdekeiutii:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

## 📍 方法 3：手動組合連接字串

如果以上方法都找不到，你可以手動組合：

### 取得各個部分：

1. **專案 Reference ID**：`gtllzbdttawdekeiutii`（你已經有了）
2. **資料庫密碼**：在建立專案時設定的密碼
3. **區域**：在 Settings → General → Region 查看

### 組合格式：

```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@[REGION].pooler.supabase.com:6543/postgres
```

### 區域對應表：

| Supabase Region | Pooler Host |
|----------------|-------------|
| Singapore (Southeast Asia) | `aws-0-ap-southeast-1.pooler.supabase.com` |
| North Virginia (US East) | `aws-0-us-east-1.pooler.supabase.com` |
| Ireland (EU West) | `aws-0-eu-west-1.pooler.supabase.com` |
| Tokyo (Northeast Asia) | `aws-0-ap-northeast-1.pooler.supabase.com` |
| Sydney (Australia) | `aws-0-ap-southeast-2.pooler.supabase.com` |

### 範例（Singapore 區域）：

```
postgresql://postgres.gtllzbdttawdekeiutii:你的密碼@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

⚠️ **注意**：如果密碼包含特殊字元，需要進行 URL 編碼！

## 📍 方法 4：使用 Supabase CLI

如果你有安裝 Supabase CLI：

```bash
# 登入
supabase login

# 取得專案資訊
supabase projects list

# 取得連接字串
supabase db remote get --project-id gtllzbdttawdekeiutii
```

## 🔑 如何確認你的資料庫密碼

如果你忘記密碼：

1. Supabase Dashboard → 你的專案
2. Settings → Database
3. 找到 **Reset Database Password** 按鈕
4. 點擊並設定新密碼
5. ⚠️ **記下新密碼！**

## 🧪 測試連接字串

使用以下腳本測試連接字串是否正確：

建立檔案 `test-supabase-connection.js`：

```javascript
const { Client } = require('pg');

// 替換為你的連接字串
const connectionString = 'postgresql://postgres.gtllzbdttawdekeiutii:YOUR_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function test() {
  try {
    console.log('正在連接...');
    await client.connect();
    console.log('✅ 連接成功！');
    
    const result = await client.query('SELECT version()');
    console.log('PostgreSQL 版本:', result.rows[0].version);
    
    const count = await client.query('SELECT COUNT(*) FROM postal_codes');
    console.log('postal_codes 資料筆數:', count.rows[0].count);
    
    await client.end();
  } catch (error) {
    console.error('❌ 連接失敗:', error.message);
  }
}

test();
```

執行測試：
```bash
node test-supabase-connection.js
```

## 📸 視覺化指引

在 Supabase Dashboard 的位置：

```
左側選單：
├── 📊 Table Editor
├── 🔍 SQL Editor
├── 🗄️ Database
│   └── Tables, Extensions, Roles, etc.
├── 🔐 Authentication
├── 📦 Storage
└── ⚙️ Project Settings        ← 點這裡
    ├── General
    ├── Database                ← 然後點這裡
    │   └── Connection string   ← 在這個頁面裡找
    ├── API
    └── Auth
```

## 🎯 最快速的方法

如果你已經知道：
- 專案 ID: `gtllzbdttawdekeiutii`
- 密碼: `你的密碼`
- 區域: Singapore (最常見)

直接使用：
```
postgresql://postgres.gtllzbdttawdekeiutii:你的密碼@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

如果不在 Singapore，嘗試：
- `aws-0-us-east-1.pooler.supabase.com:6543` (美東)
- `aws-0-eu-west-1.pooler.supabase.com:6543` (歐洲)
- `aws-0-ap-northeast-1.pooler.supabase.com:6543` (東京)

## ✅ 確認清單

你的連接字串應該：
- [ ] 以 `postgresql://` 開頭
- [ ] 包含 `postgres.gtllzbdttawdekeiutii`（不是只有 `postgres`）
- [ ] 包含你的密碼
- [ ] 包含 `pooler.supabase.com`（不是 `db.xxx.supabase.co`）
- [ ] 端口是 `6543`（不是 `5432`）
- [ ] 以 `/postgres` 結尾

正確範例：
```
postgresql://postgres.gtllzbdttawdekeiutii:MyPassword123@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

## 🆘 還是找不到？

### 選項 1：提供截圖
如果你能提供 Supabase Database Settings 頁面的截圖，我可以幫你找到具體位置。

### 選項 2：聯絡 Supabase 支援
前往 Supabase Dashboard → 右下角的 Help 按鈕

### 選項 3：使用 SQL Editor
在 Supabase SQL Editor 執行：
```sql
-- 查看當前連接資訊
SELECT current_database(), current_user, inet_server_addr(), inet_server_port();
```

---

**完成後，將連接字串貼到 Vercel 環境變數即可！** 🎯

