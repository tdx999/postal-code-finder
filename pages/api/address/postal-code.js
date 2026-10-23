import pool from '../../../lib/db';
import { checkRate } from '../../../lib/rateLimit';

/**
 * 解析完整地址
 * @param {string} address 完整地址
 * @returns {Object} 解析結果
 */
function parseAddress(address) {
  if (!address) {
    return { error: '地址不能為空' };
  }

  // 清理地址文本
  const cleanedAddress = address.trim().replace(/\s+/g, '');
  
  // 台灣縣市清單
  const cities = [
    '臺北市', '新北市', '桃園市', '臺中市', '臺南市', '高雄市',
    '基隆市', '新竹市', '嘉義市', '新竹縣', '苗栗縣', '彰化縣',
    '南投縣', '雲林縣', '嘉義縣', '屏東縣', '宜蘭縣', '花蓮縣',
    '臺東縣', '澎湖縣', '金門縣', '連江縣', '台北市', '台中市', '台南市', '台東縣'
  ];

  // 搜尋縣市
  let foundCity = null;
  let districtStart = -1;
  
  for (const city of cities) {
    const index = cleanedAddress.indexOf(city);
    if (index !== -1) {
      foundCity = city.replace('台', '臺'); // 標準化台灣/臺灣的寫法
      districtStart = index + city.length;
      break;
    }
  }

  if (!foundCity) {
    return { error: '無法識別地址中的縣市' };
  }

  // 尋找區域
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
    road: road || '',
    fullAddress: cleanedAddress
  };
}

export default async function handler(req, res) {
  // 設置 CORS 標頭
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: '只支援 GET 請求' });
  }

  try {
    const rate = checkRate(req);
    if (!rate.allowed) {
      return res.status(429).json({ success: false, message: '超出每分鐘限制', limit: rate.limit, remaining: rate.remaining, reset: rate.resetAt });
    }
    const { 
      city, 
      district, 
      road, 
      address, 
      zipcode, 
      limit = 100,
      distinctDistricts = false 
    } = req.query;

    let query = '';
    let params = [];
    let paramIndex = 1;

    // 如果請求獲取不重複的區域列表
    if (distinctDistricts === 'true' && city) {
      query = `
        SELECT DISTINCT area AS district 
        FROM roads 
        WHERE city = $1 
        ORDER BY district
      `;
      params = [city];
      paramIndex = 2;
    }
    // 如果提供了完整地址，先解析地址
    else if (address) {
      const parsed = parseAddress(address);
      if (parsed.error) {
        return res.status(400).json({ success: false, error: parsed.error });
      }

      query = `
        SELECT *, area AS district FROM roads 
        WHERE city = $1 AND area = $2
      `;
      params = [parsed.city, parsed.district];
      paramIndex = 3;
      
      if (parsed.road) {
        query += ` AND road ILIKE $${paramIndex}`;
        params.push(`%${parsed.road}%`);
        paramIndex++;
      }
    }
    // 如果提供了郵遞區號
    else if (zipcode) {
      query = `
        SELECT *, area AS district FROM roads 
        WHERE zipcode = $1
      `;
      params = [zipcode];
      paramIndex = 2;
    }
    // 如果提供了城市、區域等參數
    else {
      query = 'SELECT *, area AS district FROM roads WHERE 1=1';
      
      if (city) {
        query += ` AND city = $${paramIndex}`;
        params.push(city);
        paramIndex++;
      }
      
      if (district) {
        query += ` AND area = $${paramIndex}`;
        params.push(district);
        paramIndex++;
      }
      
      if (road) {
        query += ` AND road ILIKE $${paramIndex}`;
        params.push(`%${road}%`);
        paramIndex++;
      }
    }

    let lim = parseInt(limit, 10);
    if (!Number.isFinite(lim) || lim <= 0 || lim > 1000) lim = 100;

    // 添加限制和排序
    if (distinctDistricts !== 'true') {
      query += ` ORDER BY city, district, road LIMIT ${lim}`;
    }

    console.log('執行查詢:', query);
    console.log('參數:', params);

    const result = await pool.query(query, params);
    
    return res.status(200).json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      query: {
        city,
        district,
        road,
        address,
        zipcode,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('資料庫查詢錯誤:', error);
    return res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.message : '伺服器內部錯誤'
    });
  }
}
// 地址查詢 API（依完整地址解析城市/區/路後查詢）
// 輸入：address 或 city/district/road/zipcode
// 功能：解析中文地址、資料庫查詢、每 IP 限流檢查