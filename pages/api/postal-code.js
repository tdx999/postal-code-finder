/**
 * 台灣郵遞區號查詢 API 端點
 *
 * 提供獨立部署版本的郵遞區號與地址解析查詢功能，支援關鍵字、縣市行政區、路名精確比對。
 *
 * 主要功能：
 *   - 地址解析：將中文自然地址字串解析為縣市、行政區、路名與門牌號
 *   - 郵遞區號比對：透過 roads 資料表比對 3+3 碼郵遞區號
 *   - 限流保護：透過 checkRate 機制防範暴力調用
 *
 * API 端點：
 *   - GET /api/postal-code: 查詢郵遞區號與地址對應資料
 *
 * 依賴服務：
 *   - pool: PostgreSQL / Supabase 資料庫連線池 (lib/db)
 *   - checkRate: 頻率限制驗證 (lib/rateLimit)
 *
 * 注意事項：
 *   - 建議使用 Supabase Transaction Pooler (Port 6543) 避免連線數耗盡
 */

import pool from '../../lib/db';
import { checkRate } from '../../lib/rateLimit';

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
  const afterDistrict = cleanedAddress.substring(roadStart);
  const road = afterDistrict.split(/[0-9]/)[0];
  const alleyMatch = cleanedAddress.match(/(\d+)\s*巷/);
  const laneMatch = cleanedAddress.match(/(\d+)\s*弄/);
  const numberMatch = cleanedAddress.match(/(\d+)\s*號/);
  return {
    city: foundCity,
    district: district,
    road: road || null,
    alley: alleyMatch ? alleyMatch[1] : null,
    lane: laneMatch ? laneMatch[1] : null,
    number: numberMatch ? numberMatch[1] : null
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
    const rate = checkRate(req);
    if (!rate.allowed) {
      return res.status(429).json({ success: false, message: '超出每分鐘限制', limit: rate.limit, remaining: rate.remaining, reset: rate.resetAt });
    }
    const { address, city, district, road, postalCode, page = 1, limit = 50, mode } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let query = `
      SELECT DISTINCT 
        city,
        area AS district,
        zipcode AS postal_code,
        road,
        eroad AS english_road,
        ecity AS city_english,
        earea AS district_english,
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
      query += ` AND city = $${paramIndex++} AND area = $${paramIndex++}`;
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
    let rows = result.rows;
    let matchType = null;
    let matchDistance = null;
    let parsedQuery = null;
    if (address) {
      const parsed = parseAddress(address);
      parsedQuery = parsed;
      const targetVal = parsed.lane ? parseInt(parsed.lane) : parsed.alley ? parseInt(parsed.alley) : parsed.number ? parseInt(parsed.number) : null;
      const targetType = parsed.lane ? 'lane' : parsed.alley ? 'alley' : parsed.number ? 'num' : null;
      if (parsed.road) {
        const exactRoad = rows.filter(r => r.road === parsed.road);
        if (exactRoad.length > 0) rows = exactRoad;
      }
      if (targetVal !== null) {
        const exact = [];
        const nearest = [];
        for (const item of rows) {
          const clean = String(item.delivery_range || '').replace(/[\s　]/g, '');
          if (!clean) continue;
          const isSingle = clean.includes('單');
          const isDouble = clean.includes('雙');
          const checkParity = (v) => {
            if (!isSingle && !isDouble) return true;
            const odd = v % 2 === 1;
            if (isSingle && !odd) return false;
            if (isDouble && odd) return false;
            return true;
          };
          const alleyInRange = (() => {
            const m = clean.match(/(\d+)巷/);
            return m ? parseInt(m[1]) : null;
          })();
          const laneInRange = (() => {
            const m = clean.match(/(\d+)弄/);
            return m ? parseInt(m[1]) : null;
          })();
          if (clean.includes('全')) {
            if ((targetType === 'alley' && alleyInRange === targetVal) || (targetType === 'lane' && laneInRange === targetVal)) {
              exact.push(item);
              continue;
            }
          }
          const nums = clean.match(/\d+/g);
          if (!nums) continue;
          const n0 = parseInt(nums[0]);
          const n1 = nums[1] ? parseInt(nums[1]) : null;
          let matched = false;
          let distance = Infinity;
          if (clean.includes('以下')) {
            if (checkParity(targetVal) && targetVal <= n0) {
              matched = true;
              distance = 0;
            } else {
              distance = Math.max(0, targetVal - n0);
            }
          } else if (clean.includes('以上')) {
            if (checkParity(targetVal) && targetVal >= n0) {
              matched = true;
              distance = 0;
            } else {
              distance = Math.max(0, n0 - targetVal);
            }
          } else if (clean.includes('至') && n1 !== null) {
            if (checkParity(targetVal) && targetVal >= n0 && targetVal <= n1) {
              matched = true;
              distance = 0;
            } else if (targetVal < n0) {
              distance = n0 - targetVal;
            } else if (targetVal > n1) {
              distance = targetVal - n1;
            }
          } else {
            if (checkParity(targetVal) && targetVal === n0) {
              matched = true;
              distance = 0;
            } else {
              distance = Math.abs(targetVal - n0);
            }
          }
          if (matched) {
            exact.push(item);
          } else if (isFinite(distance)) {
            nearest.push({ item, distance });
          }
        }
        if (exact.length > 0) {
          rows = exact;
          matchType = 'exact';
          matchDistance = 0;
        } else if (nearest.length > 0) {
          const min = Math.min(...nearest.map(n => n.distance));
          rows = nearest.filter(n => n.distance === min).map(n => n.item);
          matchType = 'nearest';
          matchDistance = min;
        } else {
          matchType = 'original';
          matchDistance = null;
        }
      }
    }

    // 如果要求最佳候選，僅回傳一筆並給出理由
    let reason;
    if (mode === 'best') {
      if (rows.length > 1) {
        // 優先選擇 exact，其次 nearest，最後第一筆
        if (matchType === 'exact') {
          reason = '門牌或巷弄完全匹配';
        } else if (matchType === 'nearest') {
          reason = `門牌或巷弄最接近範圍，距離 ${matchDistance}`;
        } else {
          reason = '無精確匹配，回傳最可能的候選';
        }
        rows = [rows[0]];
      } else if (rows.length === 1) {
        if (matchType === 'exact') {
          reason = '門牌或巷弄完全匹配';
        } else if (matchType === 'nearest') {
          reason = `門牌或巷弄最接近範圍，距離 ${matchDistance}`;
        } else {
          reason = '僅找到一筆候選';
        }
      } else {
        reason = '未找到候選';
      }
    }

    // 構建英文地址（簡易映射版）
    const cityTranslations = {
      '臺北市': 'Taipei City', '新北市': 'New Taipei City', '桃園市': 'Taoyuan City', '臺中市': 'Taichung City', '臺南市': 'Tainan City', '高雄市': 'Kaohsiung City',
      '基隆市': 'Keelung City', '新竹市': 'Hsinchu City', '嘉義市': 'Chiayi City', '新竹縣': 'Hsinchu County', '苗栗縣': 'Miaoli County', '彰化縣': 'Changhua County',
      '南投縣': 'Nantou County', '雲林縣': 'Yunlin County', '嘉義縣': 'Chiayi County', '屏東縣': 'Pingtung County', '宜蘭縣': 'Yilan County', '花蓮縣': 'Hualien County',
      '臺東縣': 'Taitung County', '澎湖縣': 'Penghu County', '金門縣': 'Kinmen County', '連江縣': 'Lienchiang County'
    };
    const districtTypeTranslations = { '區': 'District', '鄉': 'Township', '鎮': 'Town', '市': 'City' };
    const buildEnglishAddress = (addr, pc) => {
      if (!addr) return null;
      const parts = [];
      if (parsedQuery?.number) parts.push(`No. ${parsedQuery.number},`);
      if (parsedQuery?.alley) parts.push(`Lane ${parsedQuery.alley},`);
      if (parsedQuery?.lane) parts.push(`Alley ${parsedQuery.lane},`);
      if (addr.english_road) {
        parts.push(`${addr.english_road},`);
      } else if (addr.road) {
        parts.push(`${addr.road},`);
      }
      if (addr.district) {
        if (addr.district_english) {
          parts.push(`${addr.district_english},`);
        } else {
          const name = addr.district.slice(0, -1);
          const type = addr.district.slice(-1);
          const typeEn = districtTypeTranslations[type] || type;
          parts.push(`${name} ${typeEn},`);
        }
      }
      if (addr.city) {
        const cityEn = addr.city_english || cityTranslations[addr.city] || addr.city;
        parts.push(pc ? `${cityEn} ${pc},` : `${cityEn},`);
      }
      parts.push('Taiwan (R.O.C.)');
      return parts.join(' ');
    };
    let countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) FROM').replace(/ORDER BY[\s\S]*$/, '');
    const countParams = params.slice(0, -2);
    let total;
    if (address) {
      total = rows.length;
    } else {
      const countResult = await pool.query(countQuery, countParams);
      total = parseInt(countResult.rows[0].count);
    }
    if (address) {
      const primary = rows[0] || null;
      const englishFull = primary ? buildEnglishAddress(primary, primary.postal_code) : null;
      let formattedAddress = '';
      if (parsedQuery) {
        formattedAddress = `${parsedQuery.city || primary?.city || ''}${parsedQuery.district || primary?.district || ''}${parsedQuery.road || primary?.road || ''}`;
        if (parsedQuery.alley) formattedAddress += `${parsedQuery.alley}巷`;
        if (parsedQuery.lane) formattedAddress += `${parsedQuery.lane}弄`;
        if (parsedQuery.number) formattedAddress += `${parsedQuery.number}號`;
      } else if (primary) {
        formattedAddress = `${primary.city || ''}${primary.district || ''}${primary.road || ''}`;
      }
      return res.status(200).json({
        success: true,
        data: primary ? {
          address: formattedAddress || null,
          input_address: address,
          postal_code: primary.postal_code || null,
          english_address: englishFull || null
        } : null
      });
    }

    res.status(200).json({
      success: true,
      data: rows,
      query: address ? {
        input: {
          address,
          city: city || null,
          district: district || null,
          road: road || null,
          postalCode: postalCode || null,
          page: parseInt(page),
          limit: parseInt(limit)
        },
        parsed: parsedQuery,
        match: {
          type: matchType,
          distance: matchDistance,
          reason: reason
        },
        english: rows.length > 0 ? {
          fullAddress: buildEnglishAddress(rows[0], rows[0].postal_code)
        } : undefined
      } : undefined,
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
    const isConnRefused = (err) => {
      if (!err) return false
      if (err.code === 'ECONNREFUSED') return true
      if (Array.isArray(err.errors)) {
        for (const e of err.errors) {
          if (e && e.code === 'ECONNREFUSED') return true
        }
      }
      return false
    }
    if (isConnRefused(error)) {
      return res.status(503).json({ success: false, message: '資料庫未連線', error: process.env.NODE_ENV === 'development' ? error.message : undefined })
    }
    res.status(500).json({ success: false, message: '伺服器錯誤，請稍後再試', error: process.env.NODE_ENV === 'development' ? error.message : undefined })
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
// 郵遞區號查詢 API
// 輸入：
// - address：完整地址字串（回傳精簡單筆）
// - city/district/road/postalCode：分段查詢（回傳陣列＋分頁）
// 功能：地址解析（巷/弄/號）、遞送範圍比對、英文地址組合、每 IP 限流檢查