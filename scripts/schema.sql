-- ========================================================
-- 台灣 3+3 郵遞區號與道路資料表結構 (Database Schema)
-- 適用資料庫：PostgreSQL 14+ / Supabase
-- 目標資料表：roads（約 79,281 筆資料）
-- ========================================================

-- 1. 建立 roads 資料表
CREATE TABLE IF NOT EXISTS roads (
    id SERIAL PRIMARY KEY,
    city VARCHAR(50) NOT NULL,          -- 縣市名稱（例如：台北市、桃園市）
    area VARCHAR(50) NOT NULL,          -- 鄉鎮市區（例如：中正區、中壢區）
    zipcode VARCHAR(10) NOT NULL,       -- 郵遞區號（3碼或 3+3 碼，例如：100、320）
    road VARCHAR(100) NOT NULL,         -- 道路街名（例如：中山北路一段、中華路）
    scoop VARCHAR(200),                 -- 投遞範圍/門牌規則（例如：全、單全、雙 2至100號）
    created_at TIMESTAMP DEFAULT NOW()  -- 資料建立時間
);

-- 2. 建立查詢加速索引（避免全表掃描，提升 API 查詢速度至毫秒級）
CREATE INDEX IF NOT EXISTS idx_roads_city ON roads(city);
CREATE INDEX IF NOT EXISTS idx_roads_area ON roads(area);
CREATE INDEX IF NOT EXISTS idx_roads_zipcode ON roads(zipcode);
CREATE INDEX IF NOT EXISTS idx_roads_city_area ON roads(city, area);
CREATE INDEX IF NOT EXISTS idx_roads_road ON roads(road);

-- 3. 測試驗證查詢語法
-- SELECT COUNT(*) FROM roads;
-- SELECT * FROM roads WHERE city = '台北市' AND area = '中正區' LIMIT 10;
