import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: '方法不允許' });
  }

  const { city } = req.query;

  if (!city) {
    return res.status(400).json({ success: false, message: '缺少城市參數' });
  }

  try {
    const client = await pool.connect();
    try {
      // 先嘗試從 postal_codes 表獲取區域
      let result = await client.query(
        'SELECT DISTINCT district as area FROM postal_codes WHERE city = $1 ORDER BY district',
        [city]
      );
      
      // 如果 postal_codes 表沒有數據，嘗試從 roads 表獲取
      if (result.rows.length === 0) {
        result = await client.query(
          'SELECT DISTINCT area FROM roads WHERE city = $1 ORDER BY area',
          [city]
        );
      }
      
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