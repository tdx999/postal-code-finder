/**
 * 從 Supabase API URL 解析專案資訊
 * 使用方法：node get-supabase-info.js "你的Supabase API URL"
 */

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('📋 如何找到你的 Supabase Project URL：');
  console.log('');
  console.log('1. 前往 https://supabase.com/dashboard');
  console.log('2. 點擊你的專案');
  console.log('3. Settings → API');
  console.log('4. 複製 "Project URL"（格式：https://gtllzbdttawdekeiutii.supabase.co）');
  console.log('');
  console.log('使用方法：');
  console.log('node get-supabase-info.js "https://gtllzbdttawdekeiutii.supabase.co"');
  console.log('');
  process.exit(0);
}

const apiUrl = args[0];

console.log('🔍 分析 Supabase 專案資訊...\n');

try {
  // 解析 URL
  const url = new URL(apiUrl);
  const hostname = url.hostname;
  
  // 提取專案 ID
  // 格式: xxxxx.supabase.co
  const parts = hostname.split('.');
  if (parts.length >= 3 && parts[1] === 'supabase') {
    const projectId = parts[0];
    
    console.log('✅ 專案 ID:', projectId);
    console.log('');
    console.log('📝 你的 Transaction Pooler 連接字串應該是：');
    console.log('');
    console.log('Singapore (最常見):');
    console.log(`postgresql://postgres.${projectId}:99ixigliLLL@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`);
    console.log('');
    console.log('美東:');
    console.log(`postgresql://postgres.${projectId}:99ixigliLLL@aws-0-us-east-1.pooler.supabase.com:6543/postgres`);
    console.log('');
    console.log('歐洲:');
    console.log(`postgresql://postgres.${projectId}:99ixigliLLL@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`);
    console.log('');
    console.log('⚠️  將 [YOUR_PASSWORD] 替換為你的資料庫密碼');
    console.log('');
    console.log('🧪 測試連接字串（記得替換密碼）：');
    console.log(`node test-connection-quick.js "postgresql://postgres.${projectId}:99ixigliLLL@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"`);
    console.log('');
  } else {
    console.error('❌ 無法解析專案 ID');
    console.log('請確認 URL 格式：https://xxxxx.supabase.co');
  }
  
} catch (error) {
  console.error('❌ URL 格式錯誤:', error.message);
  console.log('');
  console.log('正確格式: https://xxxxx.supabase.co');
}

