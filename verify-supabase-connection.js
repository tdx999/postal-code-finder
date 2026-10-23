/**
 * 驗證 Supabase 連接
 * 測試不同的連接方式
 */

const { Client } = require('pg');

// 測試連接字串
const connectionStrings = [
  {
    name: 'Transaction Pooler (Singapore)',
    url: 'postgresql://postgres.gtllzbdttawdekeiutii:99ixigliLLL@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres'
  },
  {
    name: 'Transaction Pooler (US East)',
    url: 'postgresql://postgres.gtllzbdttawdekeiutii:99ixigliLLL@aws-0-us-east-1.pooler.supabase.com:6543/postgres'
  },
  {
    name: 'Transaction Pooler (Europe)',
    url: 'postgresql://postgres.gtllzbdttawdekeiutii:99ixigliLLL@aws-0-eu-west-1.pooler.supabase.com:6543/postgres'
  },
  {
    name: 'Direct Connection (測試用)',
    url: 'postgresql://postgres:99ixigliLLL@db.gtllzbdttawdekeiutii.supabase.co:5432/postgres'
  }
];

async function testConnection(name, connectionString) {
  const client = new Client({
    connectionString,
    ssl: connectionString.includes('pooler') || connectionString.includes('db.') 
      ? { rejectUnauthorized: false } 
      : false,
    connectionTimeoutMillis: 5000
  });

  try {
    console.log(`\n🔍 測試: ${name}`);
    console.log(`   連接字串: ${connectionString.replace(/:[^:@]+@/, ':****@')}`);
    
    await client.connect();
    console.log(`   ✅ 連接成功！`);
    
    // 測試查詢
    const result = await client.query('SELECT version()');
    console.log(`   ✅ PostgreSQL 版本: ${result.rows[0].version.split(' ')[1]}`);
    
    // 檢查資料表
    try {
      const count = await client.query('SELECT COUNT(*) FROM postal_codes');
      console.log(`   ✅ postal_codes 資料筆數: ${count.rows[0].count}`);
    } catch (err) {
      console.log(`   ⚠️  postal_codes 資料表不存在或無法查詢`);
    }
    
    await client.end();
    return true;
  } catch (error) {
    console.log(`   ❌ 連接失敗: ${error.message}`);
    
    // 提供錯誤分析
    if (error.message.includes('Tenant or user not found')) {
      console.log(`   💡 可能原因：`);
      console.log(`      - 專案 ID 錯誤`);
      console.log(`      - 密碼錯誤`);
      console.log(`      - 專案被暫停或不存在`);
      console.log(`      - 區域錯誤`);
    } else if (error.message.includes('password authentication failed')) {
      console.log(`   💡 可能原因：`);
      console.log(`      - 密碼錯誤`);
      console.log(`      - 用戶名格式錯誤`);
    } else if (error.message.includes('ENOTFOUND')) {
      console.log(`   💡 可能原因：`);
      console.log(`      - 主機名稱錯誤`);
      console.log(`      - 區域錯誤`);
    }
    
    await client.end().catch(() => {});
    return false;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('🔍 Supabase 連接測試');
  console.log('='.repeat(60));
  
  let successCount = 0;
  
  for (const { name, url } of connectionStrings) {
    const success = await testConnection(name, url);
    if (success) {
      successCount++;
      console.log(`\n✅ 找到可用的連接方式: ${name}`);
      console.log(`\n📝 請在 Vercel 環境變數中使用以下連接字串：`);
      console.log(`\n${url}\n`);
      break; // 找到一個可用的就停止
    }
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (successCount === 0) {
    console.log('❌ 所有連接方式都失敗了');
    console.log('\n💡 建議檢查：');
    console.log('1. Supabase Dashboard → 確認專案狀態是 Active');
    console.log('2. Supabase Dashboard → Settings → Database → 確認密碼');
    console.log('3. Supabase Dashboard → Settings → General → 確認 Region');
    console.log('4. 嘗試重設資料庫密碼');
    console.log('5. 確認專案 ID 是否正確');
  } else {
    console.log(`✅ 測試完成！找到 ${successCount} 個可用的連接方式`);
  }
  
  console.log('='.repeat(60));
}

main().catch(console.error);

