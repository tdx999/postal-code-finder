import { Pool } from 'pg';

// 資料庫連接池
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false, // 本地資料庫不需要 SSL
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

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
        SELECT DISTINCT district 
        FROM postal_codes 
        WHERE city = $1 
        ORDER BY district
      `;
      params = [city];
    }
    // 如果提供了完整地址，先解析地址
    else if (address) {
      const parsed = parseAddress(address);
      if (parsed.error) {
        return res.status(400).json({ success: false, error: parsed.error });
      }

      query = `
        SELECT * FROM postal_codes 
        WHERE city = $1 AND district = $2
      `;
      params = [parsed.city, parsed.district];
      
      if (parsed.road) {
        query += ` AND road ILIKE $${++paramIndex}`;
        params.push(`%${parsed.road}%`);
      }
    }
    // 如果提供了郵遞區號
    else if (zipcode) {
      query = `
        SELECT * FROM postal_codes 
        WHERE zipcode = $1
      `;
      params = [zipcode];
    }
    // 如果提供了城市、區域等參數
    else {
      query = 'SELECT * FROM postal_codes WHERE 1=1';
      
      if (city) {
        query += ` AND city = $${paramIndex}`;
        params.push(city);
        paramIndex++;
      }
      
      if (district) {
        query += ` AND district = $${paramIndex}`;
        params.push(district);
        paramIndex++;
      }
      
      if (road) {
        query += ` AND road ILIKE $${paramIndex}`;
        params.push(`%${road}%`);
        paramIndex++;
      }
    }

    // 添加限制和排序
    if (distinctDistricts !== 'true') {
      query += ` ORDER BY city, district, road LIMIT $${paramIndex}`;
      params.push(parseInt(limit));
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