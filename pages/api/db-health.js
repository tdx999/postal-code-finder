/**
 * 資料庫健康檢查與保活 API 端點
 *
 * 用於驗證 PostgreSQL / Supabase 資料庫連線狀態，並作為 Vercel Cron 定時保活的目標端點。
 *
 * 主要功能：
 *   - 連線檢查：執行 SELECT 1 確保資料庫連線池運作正常
 *   - 自動保活：提供 Vercel Cron 排程呼叫，防止 Supabase 免費專案因無活動休眠
 *
 * API 端點：
 *   - GET /api/db-health: 執行資料庫連線測試並回傳狀態
 *
 * 依賴服務：
 *   - pool: 資料庫連線池 (lib/db)
 *
 * 注意事項：
 *   - 僅支援 GET 請求，其他請求方法回傳 405
 */

import pool from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  try {
    await pool.query('SELECT 1');
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(503).json({
      ok: false,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
