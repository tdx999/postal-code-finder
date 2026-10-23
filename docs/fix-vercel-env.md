# 🔧 修復 Vercel 環境變數 - 詳細步驟

## 問題
錯誤訊息：`getaddrinfo ENOTFOUND base`
原因：環境變數 `DATABASE_URL` 被截斷或格式錯誤

## ✅ 解決步驟（請逐步執行）

### 步驟 1：刪除舊的環境變數

1. 前往 https://vercel.com/dashboard
2. 點擊你的專案
3. 點擊 **Settings** 標籤（頂部）
4. 點擊左側選單 **Environment Variables**
5. 找到 `DATABASE_URL`
6. 點擊該變數右側的 **⋮** (三個點) 或 **Edit** 按鈕
7. 點擊 **Delete** 或 **Remove**
8. 確認刪除

### 步驟 2：清除瀏覽器快取

**重要**：關閉 Vercel Dashboard 分頁，重新開啟

### 步驟 3：重新建立環境變數

1. 再次進入 **Settings** → **Environment Variables**
2. 點擊 **Add New** 按鈕
3. 填寫以下資訊：

**Name (Key)**：
```
DATABASE_URL
```
（全大寫，沒有空格）

**Value**：
```
postgresql://postgres.gtllzbdttawdekeiutii:99ixigliL%2A@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

⚠️ **超級重要的注意事項**：
- ✋ **不要**手動輸入
- ✋ **不要**加引號 `"` 或 `'`
- ✋ **不要**有前後空格
- ✅ **直接**從這裡複製整行
- ✅ **確認**貼上後沒有換行
- ✅ **檢查**開頭是 `postgresql://`
- ✅ **檢查**結尾是 `/postgres`

**Environments (選擇哪些環境)**：
```
☑ Production
☑ Preview
☑ Development
```
（三個都要勾選）

4. 再次**確認** Value 欄位：
   - 開頭：`postgresql://`
   - 結尾：`/postgres`
   - 長度：約 130 個字元
   - 沒有引號、沒有空格

5. 點擊 **Save** 按鈕

### 步驟 4：驗證設定

儲存後，在環境變數列表中確認：
- ✅ 變數名稱：`DATABASE_URL`
- ✅ 環境：Production, Preview, Development
- ✅ 值的前幾個字元：`postgr...`（會被隱藏）

### 步驟 5：清除建置快取並重新部署

1. 點擊頂部的 **Deployments** 標籤
2. 找到最新的部署記錄（最上方）
3. 點擊該部署
4. 點擊右上角的 **⋯** (三個點) 按鈕
5. 選擇 **Redeploy**
6. **取消勾選** "Use existing Build Cache"（重要！）
7. 點擊 **Redeploy** 按鈕確認

### 步驟 6：等待部署完成

- 通常需要 1-2 分鐘
- 等待狀態變為 "Ready" (綠色)

### 步驟 7：測試 API

部署完成後，在瀏覽器或命令列測試：

```
https://your-project-name.vercel.app/api/address/cities
```

**預期結果**：
```json
{
  "success": true,
  "data": ["基隆市", "臺北市", "新北市", ...],
  "count": 22
}
```

## 📋 檢查清單

執行前確認：
- [ ] 我已經刪除了舊的 `DATABASE_URL` 環境變數
- [ ] 我關閉並重新開啟了 Vercel Dashboard
- [ ] 我直接複製貼上連接字串（沒有手動輸入）
- [ ] 連接字串**沒有**引號
- [ ] 連接字串**沒有**空格
- [ ] 我勾選了所有三個環境
- [ ] 我取消了 "Use existing Build Cache"
- [ ] 我等待部署完全完成

## 🆘 如果還是失敗

### 檢查 A：查看部署日誌

1. Deployments → 點擊最新部署
2. 點擊 **Functions** 標籤
3. 點擊任一函數（例如 `api/address/cities`）
4. 查看錯誤訊息

如果還是顯示 `ENOTFOUND base`，請截圖傳給我。

### 檢查 B：使用 Vercel CLI

```powershell
cd G:\design\autoasst\postal-code-finder

# 列出環境變數
vercel env ls

# 應該看到：
# DATABASE_URL   Production, Preview, Development
```

### 檢查 C：手動驗證連接字串

在本地測試：
```powershell
node test-connection-quick.js "postgresql://postgres.gtllzbdttawdekeiutii:99ixigliL%2A@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
```

應該看到 "✅ 連接成功！"

## 💡 為什麼會出現 'base' 錯誤？

可能的原因：
1. **複製貼上時有隱藏字元** - 某些編輯器或筆記工具會加入不可見字元
2. **環境變數被截斷** - Vercel 介面有時會有 bug
3. **舊的快取** - 之前的錯誤連接字串被快取了
4. **引號問題** - 如果加了引號，Node.js 可能會解析錯誤

## 🎯 正確的連接字串（再次確認）

完整字串（一行，沒有換行）：
```
postgresql://postgres.gtllzbdttawdekeiutii:99ixigliL%2A@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

分解說明：
- `postgresql://` - 協議
- `postgres.gtllzbdttawdekeiutii` - 使用者名（包含專案 ID）
- `:` - 分隔符
- `99ixigliL%2A` - 密碼（`*` 編碼為 `%2A`）
- `@` - 分隔符
- `aws-0-ap-southeast-1.pooler.supabase.com` - 主機名
- `:6543` - 端口
- `/postgres` - 資料庫名

總長度：130 個字元

---

**按照以上步驟，應該可以解決 'base' 錯誤！** 🎉

