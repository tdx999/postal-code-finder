# postal-code-finder 部署命令腳本
# 使用方法：在 PowerShell 中執行此腳本

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📦 postal-code-finder 部署腳本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 確認當前目錄
$currentPath = Get-Location
Write-Host "當前目錄：$currentPath" -ForegroundColor Yellow

# 檢查是否在正確的目錄
if ($currentPath.Path -notlike "*autoasst") {
    Write-Host "⚠️  警告：你不在 autoasst 目錄" -ForegroundColor Red
    Write-Host "請先執行：cd G:\design\autoasst" -ForegroundColor Yellow
    Write-Host ""
    exit
}

Write-Host ""
Write-Host "步驟 1：檢查新增的檔案..." -ForegroundColor Green
Write-Host ""

$newFiles = @(
    "postal-code-finder/.eslintrc.json",
    "postal-code-finder/next.config.js",
    "postal-code-finder/VERCEL-SETUP.md",
    "postal-code-finder/FIX-NOW.md",
    "postal-code-finder/deploy-commands.ps1"
)

foreach ($file in $newFiles) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file (不存在)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "步驟 2：加入變更到 Git..." -ForegroundColor Green
git add postal-code-finder/.eslintrc.json
git add postal-code-finder/next.config.js
git add postal-code-finder/VERCEL-SETUP.md
git add postal-code-finder/FIX-NOW.md
git add postal-code-finder/deploy-commands.ps1

Write-Host ""
Write-Host "步驟 3：提交變更..." -ForegroundColor Green
git commit -m "新增 postal-code-finder Next.js 和 ESLint 配置"

Write-Host ""
Write-Host "步驟 4：推送到遠端..." -ForegroundColor Green
git push

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Git 推送完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "接下來請前往 Vercel Dashboard 設定：" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. 開啟：https://vercel.com/dashboard" -ForegroundColor White
Write-Host "2. 選擇你的專案" -ForegroundColor White
Write-Host "3. Settings → General" -ForegroundColor White
Write-Host "4. Root Directory → Edit" -ForegroundColor White
Write-Host "5. 輸入：postal-code-finder" -ForegroundColor Cyan
Write-Host "6. 點擊 Save" -ForegroundColor White
Write-Host "7. Deployments → Redeploy" -ForegroundColor White
Write-Host ""
Write-Host "詳細步驟請參考：postal-code-finder/FIX-NOW.md" -ForegroundColor Yellow
Write-Host ""

