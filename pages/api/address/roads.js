import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: '方法不允許' })
  }

  const { city, district, search } = req.query

  if (!city || !district) {
    return res.status(400).json({ success: false, message: '缺少城市或區域參數' })
  }

  try {
    let sql = `SELECT DISTINCT road FROM roads WHERE city = $1 AND area = $2`
    const params = [city, district]
    if (search) {
      sql += ` AND road ILIKE $3`
      params.push(`%${search}%`)
    }
    sql += ` ORDER BY road`

    const result = await pool.query(sql, params)
    const roads = result.rows.map(r => r.road).filter(Boolean)
    return res.status(200).json({ success: true, roads, count: roads.length })
  } catch (error) {
    return res.status(500).json({ success: false, message: '伺服器錯誤', error: error.message })
  }
}