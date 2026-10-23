# ⚠️ Vercel 專案設定指南

## 🚨 重要：Root Directory 設定

你的專案結構：
```
autoasst/                    ← 主專案（不要部署這個）
└── postal-code-finder/      ← 子專案（要部署這個）
```

**Vercel 必須設定為建置 `postal-code-finder` 目錄！**

## 📋 Vercel Dashboard 設定步驟

### 1️⃣ 設定 Root Directory

1. 前往 [Vercel Dashboard](https://vercel.com/dashboard)
2. 選擇你的專案
3. 進入 **Settings** → **General**
4. 找到 **Build & Development Settings**
5. 找到 **Root Directory** 欄位
6. 點擊 **Edit**
7. 輸入：`postal-code-finder`
8. 勾選 **Include source files outside of the Root Directory in the Build Step**（如果有這個選項）
9. 點擊 **Save**

### 2️⃣ 設定環境變數

在 **Settings** → **Environment Variables**：

| 變數名稱 | 值 | 環境 |
|---------|-----|------|
| `DATABASE_URL` | `postgresql://postgres.[REF]:[PWD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres` | ✅ Production<br>✅ Preview<br>✅ Development |
| `NODE_ENV` | `production` | ✅ Production |

⚠️ **重要**：
- 使用 **port 6543** (Transaction pooler)
- 替換 `[REF]` 和 `[PWD]` 為實際值

### 3️⃣ 框架預設

確認以下設定：

- **Framework Preset**: Next.js
- **Build Command**: `npm run build` 或留空（自動偵測）
- **Output Directory**: 留空（自動偵測）
- **Install Command**: `npm install` 或留空（自動偵測）

### 4️⃣ Node.js 版本

在 **Settings** → **General** → **Node.js Version**：
- 選擇：**18.x** 或 **20.x**

## 🔄 重新部署

設定完成後：

1. 回到 **Deployments** 標籤
2. 點擊最新的部署
3. 點擊右上角的「...」選單
4. 選擇 **Redeploy**
5. 勾選 **Use existing Build Cache**（可選）
6. 點擊 **Redeploy**

## 🧪 驗證部署

部署成功後測試：

```bash
# 測試城市列表 API
curl https://your-project.vercel.app/api/address/cities

# 預期回應
{
  "success": true,
  "data": ["基隆市", "臺北市", ...],
  "count": 22
}
```

## ❌ 常見錯誤

### 錯誤 1：找不到 components/ApiUsageMonitor.tsx

**原因**：Vercel 正在建置主專案，而不是 postal-code-finder

**解決**：設定 Root Directory 為 `postal-code-finder`

### 錯誤 2：ESLint 無效選項

**原因**：缺少 .eslintrc.json

**解決**：已建立 `.eslintrc.json` 檔案

### 錯誤 3：找不到模組

**原因**：路徑錯誤或 Root Directory 設定錯誤

**解決**：確認 Root Directory 為 `postal-code-finder`

## 📁 專案結構確認

正確的 postal-code-finder 結構：

```
postal-code-finder/
├── .eslintrc.json          ✅ 新增
├── .gitignore
├── next.config.js          ✅ 新增
├── package.json
├── vercel.json
├── components/
│   ├── GoogleAd.js
│   └── SimpleAddressForm.js
├── lib/
│   ├── db.js               ✅ 已修正
│   └── rateLimit.js
├── pages/
│   ├── api/
│   │   └── address/
│   │       ├── areas.js    ✅ 已修正
│   │       ├── cities.js   ✅ 已修正
│   │       ├── roads.js    ✅ 已修正
│   │       └── ...
│   └── index.js
└── ...
```

**不應該包含**：
- ❌ `components/ApiUsageMonitor.tsx`
- ❌ `components/map/`
- ❌ 主專案的其他檔案

## 🚀 方法 2：使用 Vercel CLI（如果 Dashboard 無法使用）

如果你想使用 CLI：

```bash
# 1. 進入正確的目錄
cd G:\design\autoasst\postal-code-finder

# 2. 確認在正確的目錄
pwd

# 3. 移除舊的 Vercel 設定（如果有）
Remove-Item -Path .vercel -Recurse -Force

# 4. 重新連結專案
vercel link

# 5. 設定環境變數
vercel env add DATABASE_URL production
# 貼上你的 DATABASE_URL
# 格式：postgresql://postgres.[REF]:[PWD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres

vercel env add DATABASE_URL preview
# 貼上相同的值

vercel env add DATABASE_URL development
# 貼上相同的值

# 6. 部署
vercel --prod
```

## 📝 Git 推送前檢查

在推送到 Git 前，確認：

```bash
cd G:\design\autoasst\postal-code-finder

# 查看新增的檔案
git status

# 應該看到：
# .eslintrc.json (new file)
# next.config.js (new file)
# lib/db.js (modified)
# pages/api/address/*.js (modified)

# 加入變更
git add .eslintrc.json next.config.js

# 提交
git commit -m "新增 ESLint 和 Next.js 配置"

# 推送（如果使用 Git 部署）
git push
```

## 🎯 檢查清單

部署前確認：

- [ ] Vercel Root Directory = `postal-code-finder`
- [ ] 環境變數 DATABASE_URL 已設定（三個環境）
- [ ] DATABASE_URL 使用 port 6543
- [ ] .eslintrc.json 已建立
- [ ] next.config.js 已建立
- [ ] Framework Preset = Next.js
- [ ] Node.js Version = 18.x 或 20.x

## 🆘 還是失敗？

1. **清除快取重新部署**
   - Vercel Dashboard → Deployments → Redeploy
   - 取消勾選 "Use existing Build Cache"

2. **檢查建置日誌**
   - Deployments → 點擊失敗的部署
   - 查看詳細的錯誤訊息

3. **本地測試**
   ```bash
   cd G:\design\autoasst\postal-code-finder
   npm install
   npm run build
   ```

4. **聯絡我**
   - 提供完整的建置日誌
   - 提供 Vercel 專案設定截圖

---

**完成以上設定後，Vercel 應該能正確建置 postal-code-finder 專案！** 🎉

