# 限流管理與操作說明

本文件說明如何透過管理端點解封指定 IP（重置計數）、加入白名單或移除白名單。

## 管理端點
- 路徑：`/api/admin/rate-limit`
- 方法：`POST`
- 認證：必須提供管理 Token（`RATE_LIMIT_ADMIN_TOKEN`）
- 內容類型：`application/json`

## 必要環境設定
- 在伺服器環境變數或 `.env/.env.local` 設定：
  - `RATE_LIMIT_ADMIN_TOKEN=<你的管理密鑰>`

## 請求格式
- Header（二選一）：
  - `X-Admin-Token: <你的管理密鑰>`
- Body：
  ```json
  { "token": "<你的管理密鑰>", "action": "<操作>", "ip": "<目標IP>" }
  ```
- `action` 可選值：
  - `reset`：解封（重置該 IP 的限流計數）
  - `whitelist`：將 IP 加入白名單（免限流）
  - `unwhitelist`：將 IP 移出白名單
  - `status`：查詢該 IP 的目前視窗狀態（會包含 `allowed`、`remaining`、`limit`、`resetAt`，若封鎖中額外帶 `blocked: true`）

## 範例（curl）

### 解封指定 IP（curl）
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-Admin-Token: YOUR_TOKEN" \
  -d '{"action":"reset","ip":"127.0.0.1"}' \
  http://localhost:3002/api/admin/rate-limit
```

### 加入白名單（curl）
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-Admin-Token: YOUR_TOKEN" \
  -d '{"action":"whitelist","ip":"127.0.0.1"}' \
  http://localhost:3002/api/admin/rate-limit
```

### 移除白名單（curl）
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-Admin-Token: YOUR_TOKEN" \
  -d '{"action":"unwhitelist","ip":"127.0.0.1"}' \
  http://localhost:3002/api/admin/rate-limit
```

### 查詢狀態（curl）
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-Admin-Token: YOUR_TOKEN" \
  -d '{"action":"status","ip":"127.0.0.1"}' \
  http://localhost:3002/api/admin/rate-limit
```

## 範例（Windows PowerShell）

### 解封指定 IP（Windows PowerShell）
```powershell
Invoke-RestMethod -Method Post `
  -Uri "http://localhost:3002/api/admin/rate-limit" `
  -Headers @{ "X-Admin-Token" = "YOUR_TOKEN" } `
  -ContentType "application/json" `
  -Body '{"action":"reset","ip":"127.0.0.1"}'
```

### 加入白名單（Windows PowerShell）
```powershell
Invoke-RestMethod -Method Post `
  -Uri "http://localhost:3002/api/admin/rate-limit" `
  -Headers @{ "X-Admin-Token" = "YOUR_TOKEN" } `
  -ContentType "application/json" `
  -Body '{"action":"whitelist","ip":"127.0.0.1"}'
```

### 移除白名單（Windows PowerShell）
```powershell
Invoke-RestMethod -Method Post `
  -Uri "http://localhost:3002/api/admin/rate-limit" `
  -Headers @{ "X-Admin-Token" = "YOUR_TOKEN" } `
  -ContentType "application/json" `
  -Body '{"action":"unwhitelist","ip":"127.0.0.1"}'
```

### 查詢狀態（Windows PowerShell）
```powershell
Invoke-RestMethod -Method Post `
  -Uri "http://localhost:3002/api/admin/rate-limit" `
  -Headers @{ "X-Admin-Token" = "b8d3a2f9c1e54a76d0b7f3c2a9e1d4c6f8b0a3d7e5c2b1f4a6d8e0c3b7a9f1d2" } `
  -ContentType "application/json" `
  -Body '{"action":"status","ip":"127.0.0.1"}'
```

## 回應範例
- 解封成功：
  ```json
  { "success": true, "message": "已重置" }
  ```
- 加白名單成功：
  ```json
  { "success": true, "message": "已加入白名單", "config": { "whitelist": ["127.0.0.1", "..."] } }
  ```
- 查詢狀態（封鎖中）：
  ```json
  { "success": true, "rate": { "allowed": false, "remaining": 0, "limit": 5, "resetAt": "2025-11-24T12:00:00.000Z", "blocked": true } }
  ```
- 未授權（Token 不正確）：
  ```json
  { "success": false, "message": "未授權" }
  ```

## 注意事項
- 請妥善管理 `RATE_LIMIT_ADMIN_TOKEN`，建議在正式環境使用 HTTPS。
- 白名單 IP 免受限流影響；可透過設定檔或管理端點維護。
- 視窗長度可設定（`windowSeconds`），例如 600 秒（10 分鐘）或 1800 秒（30 分鐘）。
- 可啟用自動封鎖（`ban.enabled`），達到超額違規次數（`violationThreshold`）後封鎖指定秒數（`banDurationSeconds`）。
- 需要自然分鐘或真正滑動視窗（過去 N 秒）可再調整限流演算法。

## 設定檔示例（rateLimit.json）
```json
{
  "defaultPerMinute": 5,
  "windowSeconds": 600,
  "ban": {
    "enabled": true,
    "violationThreshold": 3,
    "banDurationSeconds": 1800
  },
  "overrides": {
    "127.0.0.1": { "perMinute": 1000 }
  },
  "whitelist": ["127.0.0.1"]
}
```

## 設定欄位說明
- `defaultPerMinute`：每個 IP 在一個視窗內允許的請求上限。
- `windowSeconds`：限流視窗長度（秒）。例：600 表示 10 分鐘，1800 表示 30 分鐘。
- `ban.enabled`：是否啟用自動封鎖機制。
- `ban.violationThreshold`：同一 IP 超過上限的違規次數累計到此值時觸發封鎖。
- `ban.banDurationSeconds`：觸發封鎖後封鎖的秒數（期間所有請求拒絕，回應帶 `blocked: true`）。
- `overrides`：為特定 IP 覆蓋速率上限，格式為 `{ "<IP>": { "perMinute": <數值> } }`。
- `whitelist`：白名單 IP 陣列，列入者不受限流與封鎖影響。

### 運作細節
- 視窗採動態起算：以該 IP 在本輪第一個請求時間為起點，持續 `windowSeconds` 秒。
- 違規次數採累計：每次超額會使 `violations` 增 1，達到門檻後封鎖 `banDurationSeconds`。可用管理端點 `reset` 清除該 IP 計數（含違規）。
- 覆蓋上限僅影響速率（`perMinute`），不影響視窗長度與封鎖設定。

### 快速配置範例
- 30 分鐘視窗、首次超額即封鎖 2 小時：
  ```json
  {
    "defaultPerMinute": 5,
    "windowSeconds": 1800,
    "ban": { "enabled": true, "violationThreshold": 1, "banDurationSeconds": 7200 }
  }
  ```

## 其他操作方式
- 圖形介面：`/admin/rate-limit-ui`（輸入管理密鑰與 IP，選擇操作）
- 指令腳本：`postal-code-finder/scripts/rate-limit.ps1`（支援 `status/reset/whitelist/unwhitelist`）

## 相關程式碼位置
- 管理端點：`pages/api/admin/rate-limit.js`
- 限流模組：`lib/rateLimit.js`
- 管理介面：`pages/admin/rate-limit-ui.js`
- 指令腳本：`scripts/rate-limit.ps1`