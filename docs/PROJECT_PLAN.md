# 台灣郵遞區號查詢系統 - 專案計畫書

## 專案概述

### 專案名稱
台灣郵遞區號查詢系統（Taiwan Postal Code Finder）

### 專案目標
建立一個功能完整、易於使用的台灣郵遞區號查詢平台，提供多種查詢方式，並結合廣告系統創造收益。

### 技術架構
- **前端**: Next.js 14, React 18
- **後端**: Node.js, PostgreSQL
- **部署**: Vercel (支援 Edge Functions)
- **資料庫**: PostgreSQL (本地/Surperbase)

## 功能規劃

### 第一階段 - 核心功能
- [x] 郵遞區號查詢功能
- [x] 地址解析功能
- [x] API 接口開發
- [x] 資料庫匯出與備份
- [x] Google AdSense 廣告整合
- [x] API 使用介紹頁面

### 第二階段 - 擴展功能
- [ ] 廣告收益優化
- [ ] 使用統計分析
- [ ] 多語言支援

### 第三階段 - 商業化
- [ ] 付費 API 方案
- [ ] 廣告投放平台
- [ ] 企業合作方案

## 資料庫架構

### 主要資料表
```sql
-- 郵遞區號資料表
CREATE TABLE roads (
    id SERIAL PRIMARY KEY,
    city VARCHAR(50) NOT NULL,
    area VARCHAR(50) NOT NULL,
    zipcode VARCHAR(10) NOT NULL,
    road VARCHAR(100) NOT NULL,
    scoop VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 廣告資料表
CREATE TABLE advertisements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    image_url VARCHAR(500),
    link_url VARCHAR(500),
    position VARCHAR(50) DEFAULT 'sidebar',
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    click_count INTEGER DEFAULT 0,
    impression_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API 使用紀錄
CREATE TABLE api_usage_logs (
    id SERIAL PRIMARY KEY,
    endpoint VARCHAR(100) NOT NULL,
    method VARCHAR(10) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    response_status INTEGER,
    response_time INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API 設計

### 1. 郵遞區號查詢 API
```
GET /api/postal-code
參數：
- address: 完整地址 (ex: "台北市大安區信義路")
- city: 城市名稱
- district: 區域名稱  
- road: 道路名稱
- postalCode: 郵遞區號
- page: 頁碼 (預設: 1)
- limit: 每頁筆數 (預設: 50)
```

### 2. 地址元件 API
```
GET /api/address/cities
GET /api/address/areas?city=台北市
GET /api/address/roads?city=台北市&area=大安區
```

### 3. Google AdSense 整合
- 已整合 Google AdSense 廣告代碼
- 支援多種廣告格式和版位
- 自動廣告優化和收益最大化

## 廣告系統設計

### Google AdSense 廣告整合

### 廣告版位配置
1. **頁首橫幅廣告** - 響應式 (728x90px)
2. **側邊欄廣告** - 矩形 (300x250px)
3. **內容間廣告** - 響應式廣告單元
4. **頁尾橫幅廣告** - 響應式

### AdSense 功能特色
- 自動廣告優化
- 內容比對廣告
- 行動裝置友善
- 收益最佳化
- 詳細報表分析

## 技術實現

### 資料庫匯出計畫
1. 使用 pg_dump 匯出目前資料
2. 清理和標準化資料格式
3. 上傳到 Supabase
4. 更新應用程式連線設定

### 前端優化
- 響應式設計
- 載入速度優化
- SEO 優化
- 無障礙設計

### 後端優化
- API 快取機制
- 資料庫索引優化
- 錯誤處理機制
- 安全性強化

## 收益模式

### 1. 廣告收益
- Google AdSense 整合 ✅
- 廣告收益優化
- 聯盟行銷推廣

### 2. API 付費服務
- 免費額度：每月 1000 次查詢
- 基本方案：$9/月，10,000 次查詢
- 專業方案：$29/月，50,000 次查詢
- 企業方案：$99/月，無限查詢

### 3. 加值服務
- 批量查詢工具
- API 諮詢服務
- 客製化開發

## 預期效益

### 技術效益
- 提供穩定的郵遞區號查詢服務
- 建立可擴展的 API 架構
- 累積地理資料處理經驗

### 商業效益
- 預計每月廣告收益：$100-500
- API 付費用戶：10-50 個
- 網站流量：每日 1000-5000 PV

### 社會效益
- 提供免費的郵遞區號查詢服務
- 促進地址標準化
- 支援相關產業發展

## 風險評估

### 技術風險
- 資料庫效能瓶頸
- API 濫用風險
- 資料準確性問題

### 商業風險
- 市場競爭激烈
- 廣告收益不穩定
- 法規政策變化

### 因應策略
- 實施 API 速率限制
- 建立資料驗證機制
- 多元化收益來源

## 開發時程

### 第一階段（2 週）
- 週 1：資料庫遷移、廣告系統開發
- 週 2：API 文件、使用介紹頁面

### 第二階段（2 週）
- 週 3：廣告管理後台、統計分析
- 週 4：效能優化、安全性強化

### 第三階段（1 週）
- 週 5：測試、部署、上線

## 結論

這個專案結合了實用的郵遞區號查詢功能與商業化的廣告系統，具有良好的技術價值和商業潛力。透過分階段開發和持續優化，可以建立一個穩定且有收益的線上服務平台。

---

**文件版本**: 1.0  
**更新日期**: 2024年  
**負責人**: 開發團隊