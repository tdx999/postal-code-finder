# 🚨 立即修復：Vercel 部署錯誤

## ⚡ 問題

```
錯誤：找不到模組 "./components/ApiUsageMonitor.tsx"
```

**原因**：Vercel 正在建置主專案（autoasst），而不是子專案（postal-code-finder）

## ✅ 解決方法（2 分鐘）

### 步驟 1：推送新的配置檔案

```powershell
# 在 PowerShell 中執行
cd G:\design\autoasst

# 加入新增的配置檔案
git add postal-code-finder/.eslintrc.json
git add postal-code-finder/next.config.js
git add postal-code-finder/VERCEL-SETUP.md
git add postal-code-finder/FIX-NOW.md

# 提交
git commit -m "新增 postal-code-finder 配置檔案"

# 推送
git push
```

### 步驟 2：設定 Vercel Root Directory

1. 開啟瀏覽器，前往：https://vercel.com/dashboard
2. 選擇你的專案
3. 點擊 **Settings** 標籤
4. 點擊左側 **General**
5. 找到 **Root Directory**
6. 點擊 **Edit** 按鈕
7. 輸入：`postal-code-finder`
8. 點擊 **Save**

視覺化：
```
┌─────────────────────────────────────┐
│ Root Directory                      │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ postal-code-finder           │  │  ← 輸入這個
│  └──────────────────────────────┘  │
│                                     │
│  [Cancel]  [Save]                   │  ← 點擊 Save
└─────────────────────────────────────┘
```

### 步驟 3：重新部署

1. 點擊 **Deployments** 標籤
2. 點擊最上方（最新）的部署記錄
3. 點擊右上角「...」按鈕
4. 選擇 **Redeploy**
5. 點擊 **Redeploy** 確認

## 🧪 驗證

部署完成後（約 1-2 分鐘），測試：

```powershell
# 在 PowerShell 中測試（替換為你的網域）
curl https://your-project.vercel.app/api/address/cities
```

應該看到：
```json
{
  "success": true,
  "data": ["基隆市", "臺北市", "新北市", ...],
  "count": 22
}
```

## 🎯 完整步驟總結

```
1. git push                              ← 推送新檔案
2. Vercel Dashboard → Settings → General → Root Directory = "postal-code-finder"
3. Deployments → Redeploy
4. 測試 API
```

## ❌ 如果還是失敗

查看詳細指南：
- [VERCEL-SETUP.md](./VERCEL-SETUP.md) - 完整設定說明
- [QUICK-FIX-SUMMARY.md](./QUICK-FIX-SUMMARY.md) - 資料庫連接修復

## 📞 關鍵設定確認

在 Vercel Settings 確認：

| 設定項目 | 正確值 |
|---------|--------|
| Root Directory | `postal-code-finder` |
| Framework Preset | Next.js |
| Build Command | (空白或 `npm run build`) |
| Node.js Version | 18.x 或 20.x |
| DATABASE_URL | `postgresql://...pooler.supabase.com:6543/...` |

---

**執行完以上 3 個步驟後，你的專案應該就能成功部署了！** 🎉

