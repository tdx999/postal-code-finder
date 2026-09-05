// 獨立部署用的郵遞區號 API
// 檔案位置：pages/api/postal-code.js

import { Pool } from 'pg';

const isLocal = process.env.DATABASE_URL && (process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1'));
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
);

function parseAddress(address) {
  if (!address) {
    return { error: '地址不能為空' };
  }
  const cleanedAddress = address.trim().replace(/\s+/g, '');
  const cities = [
    '臺北市', '新北市', '桃園市', '臺中市', '臺南市', '高雄市',
    '基隆市', '新竹市', '嘉義市', '新竹縣', '苗栗縣', '彰化縣',
    '南投縣', '雲林縣', '嘉義縣', '屏東縣', '宜蘭縣', '花蓮縣',
    '臺東縣', '澎湖縣', '金門縣', '連江縣', '台北市', '台中市', '台南市', '台東縣'
  ];
  let foundCity = null;
  let districtStart = -1;
  for (const city of cities) {
    const index = cleanedAddress.indexOf(city);
    if (index !== -1) {
      foundCity = city.replace('台', '臺');
      districtStart = index + city.length;
      break;
    }
  }
  if (!foundCity) {
    return { error: '無法識別地址中的縣市' };
  }
  const restOfAddress = cleanedAddress.substring(districtStart);
  const districtRegex = /(.+?[區鄉鎮市])/;
  const districtMatch = restOfAddress.match(districtRegex);
  if (!districtMatch) {
    return { error: '無法識別地址中的區域' };
  }
  const district = districtMatch[1];
  const roadStart = districtStart + district.length;
  const road = cleanedAddress.substring(roadStart).split(/[0-9]/)[0];
  return {
    city: foundCity,
    district: district,
    road: road || null
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: '僅支援 GET 請求' });
  }
  try {
    const { address, city, district, road, postalCode, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let query = `
      SELECT DISTINCT 
        city,
        area AS district,
        zipcode AS postal_code,
        road,
        CASE 
          WHEN scoop IS NOT NULL AND scoop != '' THEN scoop
          ELSE '全區'
        END AS delivery_range
      FROM roads
      WHERE 1=1
    `;
    let params = [];
    let paramIndex = 1;
    if (address) {
      const parsed = parseAddress(address);
      if (parsed.error) {
        return res.status(400).json({ success: false, message: parsed.error });
      }
      query += ` AND city = $${paramIndex++} AND district = $${paramIndex++}`;
      params.push(parsed.city, parsed.district);
      if (parsed.road) {
        query += ` AND road ILIKE $${paramIndex++}`;
        params.push(`%${parsed.road}%`);
      }
    } else if (city && district) {
      query += ` AND city = $${paramIndex++} AND area = $${paramIndex++}`;
      params.push(city, district);
      if (road) {
        query += ` AND road LIKE $${paramIndex++}`;
        params.push(`${road}%`);
      }
    } else if (postalCode) {
      query += ` AND zipcode = $${paramIndex++}`;
      params.push(postalCode);
    } else {
      return res.status(400).json({ 
        success: false, 
        message: '請提供 address 或 (city + district) 或 postalCode 參數' 
      });
    }
    query += ` ORDER BY city, district, road LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit), offset);
    const result = await pool.query(query, params);
    let countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) FROM').replace(/ORDER BY[\s\S]*$/, '');
    const countParams = params.slice(0, -2);
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    res.status(200).json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        totalPages: Math.ceil(total / parseInt(limit))
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('API 錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '伺服器錯誤，請稍後再試',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export async function healthCheck() {
  try {
    const result = await pool.query('SELECT 1');
    return { status: 'healthy', database: 'connected' };
  } catch (error) {
    return { status: 'unhealthy', database: 'disconnected', error: error.message };
  }
}