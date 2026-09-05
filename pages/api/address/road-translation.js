import { Pool } from 'pg'

const isLocal = process.env.DATABASE_URL && (process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1'))
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: isLocal ? false : { rejectUnauthorized: false },
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }
    : {
        user: process.env.POSTGRES_USER || 'realestateadmin',
        password: process.env.POSTGRES_PASSWORD || 'Realestate@123456',
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '15540'),
        database: process.env.POSTGRES_DB || 'realestate_db',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }
)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: '只允許 GET 請求' })
  }

  const { roadName, district } = req.query

  if (!roadName) {
    return res.status(400).json({ success: false, message: '請提供道路名稱' })
  }

  try {
    const cleanedRoadName = roadName
      .replace(/(路|街|大道|巷)$/,'')
      .replace(/[一二三四五六七八九十]段$/,'')

    const queryText = `
      WITH RankedRoads AS (
        SELECT
          road,
          eroad,
          city,
          ecity,
          area,
          earea,
          scoop,
          lane,
          alley,
          no_bgn,
          no_end,
          CASE 
            WHEN road = $1 THEN 0
            WHEN road LIKE $1 || '%' THEN 1
            WHEN road LIKE '%' || $1 || '%' THEN 2
            ELSE 3
          END AS road_rank
        FROM roads
        WHERE road LIKE '%' || $1 || '%'
        ${district ? 'AND area = $2' : ''}
      )
      SELECT road, eroad, city, ecity, area, earea, scoop, lane, alley, no_bgn, no_end
      FROM RankedRoads
      ORDER BY road_rank, road
      LIMIT 1
    `

    const params = district ? [cleanedRoadName, district] : [cleanedRoadName]
    const result = await pool.query(queryText, params)

    let data = result.rows.length > 0 ? {
      road_name: result.rows[0].road,
      english_name: result.rows[0].eroad,
      district_name: result.rows[0].area,
      district_english: result.rows[0].earea,
      city_name: result.rows[0].city,
      city_english: result.rows[0].ecity,
      delivery_range: result.rows[0].scoop,
      lane: result.rows[0].lane,
      alley: result.rows[0].alley,
      no_begin: result.rows[0].no_bgn,
      no_end: result.rows[0].no_end,
    } : null

    // 若未找到道路，至少嘗試提供城市與區域英文名稱
    if (!data && district) {
      const fallback = await pool.query(
        `SELECT DISTINCT city, ecity, area, earea FROM roads WHERE area = $1 LIMIT 1`,
        [district]
      )
      if (fallback.rows.length > 0) {
        data = {
          road_name: cleanedRoadName,
          english_name: '',
          district_name: fallback.rows[0].area,
          district_english: fallback.rows[0].earea,
          city_name: fallback.rows[0].city,
          city_english: fallback.rows[0].ecity,
          delivery_range: '',
          lane: null,
          alley: null,
          no_begin: null,
          no_end: null,
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: data ? '成功查詢道路翻譯資料' : '未找到匹配的道路資料',
      data,
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: '資料庫查詢錯誤', error: { message: error.message } })
  }
}