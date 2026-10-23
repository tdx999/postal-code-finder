import pool from '../../../lib/db';
import { checkRate } from '../../../lib/rateLimit';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: '方法不允許' });
  }

  const rate = checkRate(req);
  if (!rate.allowed) {
    return res.status(429).json({ success: false, message: '超出每分鐘限制', limit: rate.limit, remaining: rate.remaining, reset: rate.resetAt });
  }

  const { city } = req.query;

  if (!city) {
    return res.status(400).json({ success: false, message: '缺少城市參數' });
  }

  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT DISTINCT area FROM roads WHERE city = $1 ORDER BY area',
        [city]
      );
      
      const areas = result.rows.map(row => row.area);
      res.status(200).json({ success: true, areas });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('獲取區域列表時發生錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '伺服器錯誤',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
// 區域清單 API（指定城市）
// 功能：從 roads 取區域清單；每 IP 限流檢查