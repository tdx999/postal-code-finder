// 快速測試 Supabase 連接
// 使用方法：node test-connection-quick.js "你的連接字串"

const { Client } = require('pg');

// 從命令列參數取得連接字串
const connectionString = process.argv[2];

if (!connectionString) {
  console.error('❌ 請提供連接字串！');
  console.log('\n使用方法：');
  console.log('node test-connection-quick.js "postgresql://postgres.xxx:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"');
  console.log('');
  process.exit(1);
}

console.log('🔍 測試連接字串...\n');

// 解析並顯示連接資訊（隱藏密碼）
try {
  const url = new URL(connectionString.replace('postgresql://', 'http://'));
  console.log('📊 連接資訊：');
  console.log(`   主機: ${url.hostname}`);
  console.log(`   端口: ${url.port}`);
  console.log(`   用戶: ${url.username}`);
  console.log(`   密碼: ${'*'.repeat(8)}`);
  console.log(`   資料庫: ${url.pathname.substring(1)}`);
  console.log('');
  
  // 檢查是否使用 pooler
  if (url.hostname.includes('pooler.supabase.com')) {
    console.log('✅ 使用 Connection Pooler');
  } else if (url.hostname.includes('db.') && url.hostname.includes('.supabase.co')) {
    console.log('⚠️  使用 Direct Connection（不適合 Vercel）');
    console.log('   建議改用 pooler.supabase.com');
  }
  
  // 檢查端口
  if (url.port === '6543') {
    console.log('✅ 端口正確 (6543 - Transaction Pooler)');
  } else if (url.port === '5432') {
    console.log('⚠️  端口 5432 (Direct Connection) - 不適合 Vercel');
    console.log('   建議改用 6543');
  }
  console.log('');
} catch (error) {
  console.error('❌ 連接字串格式錯誤:', error.message);
  process.exit(1);
}

// 測試連接
const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function test() {
  try {
    console.log('🔌 正在連接到 Supabase...');
    await client.connect();
    console.log('✅ 連接成功！\n');
    
    // 測試基本查詢
    console.log('🔍 執行測試查詢...');
    const versionResult = await client.query('SELECT version()');
    const version = versionResult.rows[0].version.split(' ')[1];
    console.log(`✅ PostgreSQL 版本: ${version}\n`);
    
    // 檢查資料表
    console.log('📊 檢查資料表...');
    const tables = ['postal_codes', 'roads'];
    let foundData = false;
    
    for (const table of tables) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = countResult.rows[0].count;
        console.log(`✅ ${table}: ${count} 筆資料`);
        foundData = true;
      } catch (err) {
        // 資料表不存在
      }
    }
    
    if (!foundData) {
      console.log('⚠️  找不到 postal_codes 或 roads 資料表');
      console.log('   請確認資料已匯入');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 測試完成！連接字串可以使用。');
    console.log('='.repeat(50));
    console.log('\n下一步：');
    console.log('1. 複製這個連接字串');
    console.log('2. 前往 Vercel Dashboard');
    console.log('3. Settings → Environment Variables');
    console.log('4. 更新 DATABASE_URL');
    console.log('5. Deployments → Redeploy');
    console.log('');
    
    await client.end();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ 連接失敗！\n');
    console.error('錯誤訊息:', error.message);
    console.error('');
    
    // 提供解決建議
    if (error.message.includes('password authentication failed')) {
      console.log('💡 可能的原因：');
      console.log('   1. 密碼錯誤');
      console.log('   2. 密碼包含特殊字元未編碼');
      console.log('   3. 用戶名錯誤');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.log('💡 可能的原因：');
      console.log('   1. 主機名稱錯誤');
      console.log('   2. 網路連接問題');
      console.log('   3. 區域設定錯誤');
    } else if (error.message.includes('timeout')) {
      console.log('💡 可能的原因：');
      console.log('   1. 防火牆阻擋');
      console.log('   2. 端口設定錯誤');
      console.log('   3. Supabase 專案暫停');
    }
    console.log('');
    
    await client.end().catch(() => {});
    process.exit(1);
  }
}

test();

