# 🔧 修復 Supabase Transaction Pooler 連接問題

## ✅ 測試結果

- ✅ Direct Connection 成功（專案 ID 和密碼正確）
- ❌ Transaction Pooler 失敗（Tenant or user not found）

## 🔍 問題分析

Direct Connection 可以連接，表示：
- ✅ 專案 ID 正確：`gtllzbdttawdekeiutii`
- ✅ 密碼正確：`99ixigliLLL`
- ❌ Transaction Pooler 可能未啟用或配置錯誤

## 🎯 解決方法

### 方法 1：在 Supabase 啟用 Connection Pooling（推薦）

1. 前往 https://supabase.com/dashboard
2. 點擊你的專案
3. **Settings** → **Database**
4. 往下滾動找到 **"Connection Pooling"** 或 **"Pooler Configuration"** 區塊
5. 如果看到 **"Enable Connection Pooling"** 按鈕，點擊啟用
6. 確認 **Pool Mode** 設定為 **Transaction**
7. 複製顯示的連接字串

### 方法 2：使用 Supavisor（新版的 Pooler）

某些 Supabase 專案使用新的 Supavisor Pooler，格式可能不同。

在 Supabase Dashboard → Settings → Database → Connection Pooling：
- 查看是否有 **Supavisor** 選項
- 複製 Supavisor 提供的連接字串

### 方法 3：檢查專案方案

1. Supabase Dashboard → 你的專案
2. **Settings** → **General**
3. 查看 **Plan** 或 **Subscription**
4. 某些免費方案可能不支援 Connection Pooling

如果沒有 Connection Pooling，可能需要：
- 升級 Supabase 方案
- 或使用其他連接方式

### 方法 4：使用 Session Pooler（如果 Transaction 不行）

試試 Session Pooler（雖然不推薦，但可能可用）：

```
postgresql://postgres.gtllzbdttawdekeiutii:99ixigliLLL@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?pgbouncer=true
```

注意：端口是 `5432`，不是 `6543`

## 🧪 測試 Session Pooler

建立測試腳本測試 Session Pooler：

```javascript
// 測試 Session Pooler
const sessionUrl = 'postgresql://postgres.gtllzbdttawdekeiutii:99ixigliLLL@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?pgbouncer=true';
```

## 📋 檢查清單

在 Supabase Dashboard 確認：

- [ ] Settings → Database → 有 "Connection Pooling" 區塊
- [ ] Connection Pooling 已啟用
- [ ] Pool Mode = Transaction
- [ ] 有顯示連接字串
- [ ] 專案方案支援 Connection Pooling

## 🆘 如果還是無法使用 Pooler

如果 Supabase 專案不支援 Connection Pooling，可以考慮：

1. **升級 Supabase 方案**（如果有免費額度限制）
2. **使用 Supabase REST API** 而不是直接連接 PostgreSQL
3. **使用 Supabase Client Library**（JavaScript SDK）

---

**請先檢查 Supabase Dashboard 是否有 Connection Pooling 選項！** 🎯

