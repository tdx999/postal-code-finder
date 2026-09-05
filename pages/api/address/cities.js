import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 定义台湾城市的排序顺序（从北到南）
const cityOrder = [
  '基隆市',
  '臺北市',
  '台北市',
  '新北市',
  '桃園市',
  '新竹市',
  '新竹縣',
  '苗栗縣',
  '臺中市',
  '台中市',
  '彰化縣',
  '南投縣',
  '雲林縣',
  '嘉義市',
  '嘉義縣',
  '臺南市',
  '台南市',
  '高雄市',
  '屏東縣',
  '宜蘭縣',
  '花蓮縣',
  '臺東縣',
  '台東縣',
  '澎湖縣',
  '金門縣',
  '連江縣'
];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: '方法不允許' });
  }

  try {
    const result = await pool.query('SELECT DISTINCT city FROM postal_codes ORDER BY city');
    
    // 按照台湾地理位置排序
    const sortedCities = result.rows
      .map(row => row.city)
      .sort((a, b) => {
        const indexA = cityOrder.indexOf(a);
        const indexB = cityOrder.indexOf(b);
        
        // 如果城市不在排序列表中，放到最后
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        
        return indexA - indexB;
      });

    res.status(200).json({
      success: true,
      data: sortedCities,
      count: sortedCities.length
    });
  } catch (error) {
    console.error('獲取城市列表錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取城市列表失敗',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}