// 簡易資料匯出腳本 - 使用 Node.js (修正版)
// 使用方式: node export-data-simple.js

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// 資料庫連線設定
const pool = new Pool({
  user: 'realestateadmin',
  password: 'Realestate@123456',
  host: 'localhost',
  port: 15540,
  database: 'realestate_db'
});

async function exportData() {
  console.log('🚀 開始匯出郵遞區號資料...');
  
  try {
    // 建立匯出目錄
    const exportDir = path.join(__dirname, 'database-export');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir);
    }

    // 查詢資料總數
    const countResult = await pool.query('SELECT COUNT(*) as total FROM roads');
    const totalRecords = countResult.rows[0].total;
    console.log(`📊 找到 ${totalRecords} 筆資料`);

    // 先檢查資料表結構
    console.log('🔍 檢查資料表結構...');
    const structureResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'roads' 
      ORDER BY ordinal_position
    `);
    
    console.log('資料表結構：');
    structureResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable}`);
    });

    // 根據實際結構調整查詢
    const availableColumns = structureResult.rows.map(col => col.column_name);
    const selectColumns = ['city', 'area', 'zipcode', 'road', 'scoop'].filter(col => availableColumns.includes(col));
    
    console.log(`📋 將匯出欄位：${selectColumns.join(', ')}`);

    // 匯出所有資料
    console.log('📥 正在匯出資料...');
    const result = await pool.query(`
      SELECT ${selectColumns.join(', ')}
      FROM roads 
      ORDER BY city, area, zipcode, road
    `);

    // 儲存為 JSON 格式
    const jsonData = {
      exportDate: new Date().toISOString(),
      totalRecords: totalRecords,
      columns: selectColumns,
      data: result.rows
    };
    
    fs.writeFileSync(
      path.join(exportDir, 'taiwan-postal-codes.json'),
      JSON.stringify(jsonData, null, 2)
    );
    console.log('✅ JSON 檔案匯出完成: taiwan-postal-codes.json');

    // 儲存為 CSV 格式
    const csvHeaders = selectColumns.map(col => {
      const headerMap = {
        'city': '城市',
        'area': '區域',
        'zipcode': '郵遞區號',
        'road': '道路',
        'scoop': '配送範圍'
      };
      return headerMap[col] || col;
    }).join(',') + '\n';
    
    const csvData = result.rows.map(row => {
      return selectColumns.map(col => {
        const value = row[col] || '';
        return `"${value.toString().replace(/"/g, '""')}"`;
      }).join(',');
    }).join('\n');
    
    fs.writeFileSync(
      path.join(exportDir, 'taiwan-postal-codes.csv'),
      csvHeaders + csvData
    );
    console.log('✅ CSV 檔案匯出完成: taiwan-postal-codes.csv');

    // 產生統計報告
    const cityStats = {};
    result.rows.forEach(row => {
      if (!cityStats[row.city]) {
        cityStats[row.city] = 0;
      }
      cityStats[row.city]++;
    });

    const statsReport = {
      exportDate: new Date().toISOString(),
      totalRecords: totalRecords,
      cities: Object.keys(cityStats).length,
      columns: selectColumns,
      cityDistribution: cityStats,
      topCities: Object.entries(cityStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([city, count]) => ({ city, count }))
    };

    fs.writeFileSync(
      path.join(exportDir, 'export-stats.json'),
      JSON.stringify(statsReport, null, 2)
    );
    console.log('✅ 統計報告產生完成: export-stats.json');

    // 產生 Supabase 匯入腳本
    const supabaseScript = `-- 郵遞區號資料匯入 Supabase 腳本
-- 執行時間: ${new Date().toISOString()}
-- 資料筆數: ${totalRecords}

-- 建立資料表
CREATE TABLE IF NOT EXISTS roads (
    id SERIAL PRIMARY KEY,
    city VARCHAR(50) NOT NULL,
    area VARCHAR(50) NOT NULL,
    zipcode VARCHAR(10) NOT NULL,
    road VARCHAR(100) NOT NULL,
    scoop VARCHAR(200),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_roads_city ON roads(city);
CREATE INDEX IF NOT EXISTS idx_roads_area ON roads(area);
CREATE INDEX IF NOT EXISTS idx_roads_zipcode ON roads(zipcode);
CREATE INDEX IF NOT EXISTS idx_roads_city_area ON roads(city, area);
CREATE INDEX IF NOT EXISTS idx_roads_road ON roads(road);

-- 插入資料（請分批執行，避免超時）
`;

    fs.writeFileSync(
      path.join(exportDir, 'supabase-import.sql'),
      supabaseScript
    );
    console.log('✅ Supabase 匯入腳本產生完成: supabase-import.sql');

    // 產生資料插入腳本（分批）
    const batchSize = 1000;
    for (let i = 0; i < result.rows.length; i += batchSize) {
      const batch = result.rows.slice(i, i + batchSize);
      const insertScript = `-- 批次 ${Math.floor(i/batchSize) + 1}
INSERT INTO roads (${selectColumns.join(', ')}) VALUES\n` +
        batch.map(row => {
          const values = selectColumns.map(col => {
            const value = row[col];
            if (value === null || value === undefined) {
              return 'NULL';
            }
            return `'${value.toString().replace(/'/g, "''")}'`;
          });
          return `(${values.join(', ')})`;
        }).join(',\n') + ';\n';
      
      fs.writeFileSync(
        path.join(exportDir, `batch-${Math.floor(i/batchSize) + 1}.sql`),
        insertScript
      );
    }
    console.log(`✅ 分批插入腳本產生完成：共 ${Math.ceil(result.rows.length/batchSize)} 個檔案`);

    console.log('\n📁 匯出檔案清單：');
    const files = fs.readdirSync(exportDir);
    files.forEach(file => {
      const stats = fs.statSync(path.join(exportDir, file));
      console.log(`  - ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
    });

    console.log('\n🎯 下一步建議：');
    console.log('1. 檢查匯出的資料檔案');
    console.log('2. 上傳資料到 Supabase');
    console.log('3. 更新應用程式的 DATABASE_URL');
    console.log('4. 測試資料連線');

  } catch (error) {
    console.error('❌ 匯出失敗:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
    console.log('\n✨ 匯出程序完成！');
  }
}

// 執行匯出
exportData();