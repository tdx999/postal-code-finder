import pool from '../../../lib/db'
import { checkRate } from '../../../lib/rateLimit'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: '方法不允許' })
  }

  const rate = checkRate(req)
  if (!rate.allowed) {
    return res.status(429).json({ success: false, message: '超出每分鐘限制', limit: rate.limit, remaining: rate.remaining, reset: rate.resetAt })
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
// 道路清單 API（指定城市與區域）
// 輸入：city、district、search（可選，模糊搜尋路名）
// 功能：列出道路清單、每 IP 限流檢查