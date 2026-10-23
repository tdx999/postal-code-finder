/**
 * 檢查環境變數來源
 * 用途：確認程式碼讀取的是哪個環境變數
 */

console.log('🔍 環境變數檢查\n');
console.log('='.repeat(50));

// 檢查 NODE_ENV
console.log('NODE_ENV:', process.env.NODE_ENV || '(未設定)');
console.log('');

// 檢查 DATABASE_URL
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.log('❌ DATABASE_URL: 未設定');
  console.log('');
  console.log('💡 解決方法：');
  console.log('1. 在 Vercel Dashboard 設定環境變數');
  console.log('2. 或建立 .env.local 檔案（本地開發）');
  process.exit(1);
}

console.log('✅ DATABASE_URL: 已設定');
console.log('');

// 解析連接字串（隱藏密碼）
try {
  const url = new URL(dbUrl.replace('postgresql://', 'http://'));
  console.log('📊 連接資訊：');
  console.log(`   主機: ${url.hostname}`);
  console.log(`   端口: ${url.port}`);
  console.log(`   用戶: ${url.username}`);
  console.log(`   資料庫: ${url.pathname.substring(1)}`);
  console.log('');
  
  // 判斷環境
  const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
  const isSupabase = dbUrl.includes('supabase.com');
  const isPooler = dbUrl.includes('pooler.supabase.com');
  
  console.log('🔍 環境判斷：');
  if (isLocal) {
    console.log('   ⚠️  本地資料庫（localhost）');
    console.log('   💡 這是本地開發環境的設定');
  } else if (isSupabase) {
    if (isPooler) {
      console.log('   ✅ Supabase Pooler（正確）');
      console.log('   💡 適合 Vercel serverless 環境');
    } else {
      console.log('   ⚠️  Supabase Direct Connection');
      console.log('   ❌ 不適合 Vercel，應該使用 Pooler');
    }
  } else {
    console.log('   ℹ️  其他資料庫');
  }
  console.log('');
  
  // 檢查是否為生產環境
  if (process.env.NODE_ENV === 'production') {
    if (isLocal) {
      console.log('❌ 問題：生產環境使用了本地資料庫連接！');
      console.log('');
      console.log('💡 解決方法：');
      console.log('1. 前往 Vercel Dashboard');
      console.log('2. Settings → Environment Variables');
      console.log('3. 新增 DATABASE_URL（Supabase Pooler 連接字串）');
      console.log('4. 確認勾選 Production 環境');
      console.log('5. 重新部署');
    } else {
      console.log('✅ 生產環境使用正確的資料庫連接');
    }
  } else {
    console.log('ℹ️  非生產環境（開發模式）');
  }
  
} catch (error) {
  console.error('❌ 連接字串格式錯誤:', error.message);
}

console.log('');
console.log('='.repeat(50));

