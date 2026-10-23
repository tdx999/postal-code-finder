/**
 * 資料庫連接驗證腳本
 *
 * 用於本機環境測試 DATABASE_URL 連線狀態，驗證與 Supabase PostgreSQL 資料庫的連通性。
 *
 * 主要功能：
 *   - 環境變數載入：優先讀取 .env.local，未設定時回退讀取 .env
 *   - 連線與查詢測試：執行 SELECT version() 與資料表計數測試
 *
 * 依賴服務：
 *   - pg (Pool): PostgreSQL 連線管理
 *   - dotenv: 本機環境變數配置
 *
 * 注意事項：
 *   - 正式部署時請在 Vercel 後台設定 DATABASE_URL
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

// 載入環境變數：優先讀取 .env.local，若不存在或未設定則讀取 .env
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
}
if (!process.env.DATABASE_URL && fs.existsSync('.env')) {
  dotenv.config({ path: '.env' });
}

const DATABASE_URL = process.env.DATABASE_URL;

console.log('========================================');
console.log('📡 資料庫連接測試');
console.log('========================================\n');

// 檢查環境變數
if (!DATABASE_URL) {
  console.error('❌ 錯誤：DATABASE_URL 環境變數未設定');
  console.log('\n請確認：');
  console.log('1. 已建立 .env.local 檔案');
  console.log('2. 檔案中包含 DATABASE_URL=...');
  console.log('3. DATABASE_URL 格式正確\n');
  process.exit(1);
}

// 顯示連接資訊（隱藏密碼）
const urlObj = new URL(DATABASE_URL.replace('postgresql://', 'http://'));
console.log('🔗 連接資訊：');
console.log(`   主機：${urlObj.hostname}`);
console.log(`   端口：${urlObj.port}`);
console.log(`   資料庫：${urlObj.pathname.substring(1)}`);
console.log(`   使用者：${urlObj.username}`);
console.log(`   密碼：${'*'.repeat(8)}\n`);

// 判斷 SSL 設定
const isLocal = DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1');
console.log(`🔒 SSL 設定：${isLocal ? '停用（本地連接）' : '啟用（遠端連接）'}\n`);

// 建立連接池
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

async function testConnection() {
  let client;
  
  try {
    console.log('🔄 正在連接資料庫...\n');
    client = await pool.connect();
    console.log('✅ 資料庫連接成功！\n');

    // 測試查詢
    console.log('🔍 執行測試查詢...\n');
    
    // 1. 檢查 PostgreSQL 版本
    const versionResult = await client.query('SELECT version()');
    console.log('📊 PostgreSQL 版本：');
    console.log(`   ${versionResult.rows[0].version.split(',')[0]}\n`);

    // 2. 檢查資料表
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('📋 資料表列表：');
    if (tablesResult.rows.length === 0) {
      console.log('   ⚠️ 沒有找到資料表');
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`   ✓ ${row.table_name}`);
      });
    }
    console.log('');

    // 3. 檢查郵遞區號資料
    const tables = ['postal_codes', 'roads'];
    for (const table of tables) {
      try {
        const countResult = await client.query(
          `SELECT COUNT(*) as count FROM ${table}`
        );
        console.log(`📦 ${table} 資料筆數：${countResult.rows[0].count} 筆`);
      } catch (err) {
        // 資料表不存在，跳過
      }
    }

    console.log('\n========================================');
    console.log('✅ 所有測試通過！');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ 連接失敗：\n');
    console.error(`   錯誤訊息：${error.message}`);
    console.error(`   錯誤代碼：${error.code || 'N/A'}\n`);

    // 提供解決建議
    console.log('💡 可能的解決方法：\n');
    
    if (error.code === 'ENOTFOUND') {
      console.log('   1. 檢查主機名稱是否正確');
      console.log('   2. 確認網路連接正常');
      console.log('   3. 檢查防火牆設定\n');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('   1. 確認資料庫伺服器正在運行');
      console.log('   2. 檢查端口號是否正確');
      console.log('   3. 確認防火牆允許連接\n');
    } else if (error.message.includes('password')) {
      console.log('   1. 檢查密碼是否正確');
      console.log('   2. 確認使用者名稱正確');
      console.log('   3. 檢查資料庫權限設定\n');
    } else if (error.message.includes('SSL')) {
      console.log('   1. 確認 SSL 設定正確');
      console.log('   2. Supabase 需要啟用 SSL');
      console.log('   3. 本地資料庫通常不需要 SSL\n');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
      console.log('   1. 使用 Supabase Transaction pooler (port 6543)');
      console.log('   2. 不要使用直接連接 (port 5432)');
      console.log('   3. 檢查網路穩定性\n');
    } else {
      console.log('   1. 檢查 DATABASE_URL 格式是否正確');
      console.log('   2. 確認資料庫存在');
      console.log('   3. 查看完整錯誤訊息\n');
    }

    console.log('========================================\n');
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// 執行測試
testConnection();

