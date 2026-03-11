/**
 * DayStream API 测试脚本
 *
 * 用法：先启动服务器 npm run dev，再跑 npm run test:api
 */

const BASE = process.env.API_URL || 'http://localhost:3100';

async function main() {
  console.log(`\n🧪 测试 DayStream API (${BASE})\n`);

  // 1. 健康检查
  console.log('── GET /api/health ──');
  try {
    const res = await fetch(`${BASE}/api/health`);
    const data = await res.json();
    console.log(data);
  } catch (err: any) {
    console.error('❌ 无法连接服务器，请先运行 npm run dev');
    process.exit(1);
  }

  // 2. 从 screenpipe 同步
  console.log('\n── POST /api/sync/screenpipe ──');
  try {
    const res = await fetch(`${BASE}/api/sync/screenpipe`, { method: 'POST' });
    const data = await res.json();
    console.log(`导入了 ${data.imported} 条记录`);
  } catch (err: any) {
    console.error('⚠️ screenpipe 同步失败:', err.message);
  }

  // 3. 最近 5 条记录
  console.log('\n── GET /api/records?limit=5 ──');
  try {
    const res = await fetch(`${BASE}/api/records?limit=5`);
    const data = await res.json();
    console.log(`共 ${data.count} 条记录：`);
    for (const r of data.data) {
      const time = r.timestamp?.slice(0, 19) || '?';
      const preview = r.content?.slice(0, 60) || '';
      console.log(`  [${time}] (${r.source_type}) ${preview}`);
    }
  } catch (err: any) {
    console.error('⚠️ 查询失败:', err.message);
  }

  // 4. 本月有数据的日期
  console.log('\n── GET /api/calendar/2026-03 ──');
  try {
    const res = await fetch(`${BASE}/api/calendar/2026-03`);
    const data = await res.json();
    console.log(`有数据的日期: ${data.dates.length ? data.dates.join(', ') : '(无)'}`);
  } catch (err: any) {
    console.error('⚠️ 查询失败:', err.message);
  }

  console.log('\n✅ 测试完成\n');
}

main();
