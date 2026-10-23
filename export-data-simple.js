// 簡易資料匯出腳本 - 使用 Node.js (修正版)
// 使用方式: node export-data-simple.js
//用這個指令上傳到supabase: cd g:\design\autoasst\postal-code-finder; $env:DATABASE_URL=(Get-Content .env.local | Select-String "DATABASE_URL" | ForEach-Object { $_ -replace "DATABASE_URL=", "" }); cd database-export; node import-supabase.js
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

    // 建立統計報告物件 statsReport，內容包括：
    // - exportDate: 匯出的日期時間（ISO 格式）
    // - totalRecords: 總筆數
    // - cities: 城市數
    // - columns: 欄位列表
    // - cityDistribution: 每個城市的分佈資料（{城市: 筆數}）
    // - topCities: 筆數最多的前 10 個城市及其數量（依數量遞減排序）
    const statsReport = {
      exportDate: new Date().toISOString(),
      totalRecords: totalRecords,
      cities: Object.keys(cityStats).length,
      columns: selectColumns,
      cityDistribution: cityStats,
      topCities: Object.entries(cityStats)
        .sort(([,a], [,b]) => b - a) // 依城市筆數由多到少排序
        .slice(0, 10) // 只取前 10 名
        .map(([city, count]) => ({ city, count })) // 轉換成 {city, count} 物件陣列
    };
    fs.writeFileSync(
      path.join(exportDir, 'export-stats.json'),
      JSON.stringify(statsReport, null, 2)
    );
    console.log('✅ 統計報告產生完成: export-stats.json');
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