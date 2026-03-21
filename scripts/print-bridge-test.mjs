/**
 * 电脑端打印桥测试脚本
 * 用法：在项目根目录执行（先设置环境变量）：
 *   set PRINTBRIDGE_EMAIL=printer用户邮箱
 *   set PRINTBRIDGE_PASSWORD=printer密码
 *   node scripts/print-bridge-test.mjs
 * 或在 PowerShell：
 *   $env:PRINTBRIDGE_EMAIL="..."; $env:PRINTBRIDGE_PASSWORD="..."; node scripts/print-bridge-test.mjs
 *
 * 环境变量（可从 .env 或系统读取，这里优先用 VITE_ 前缀与前端一致）：
 *   VITE_SUPABASE_URL 或 SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY 或 SUPABASE_ANON_KEY
 *   PRINTBRIDGE_EMAIL
 *   PRINTBRIDGE_PASSWORD
 *   PRINTER_IP（可选，填了会向 9100 端口发测试小票）
 */

import { createClient } from '@supabase/supabase-js';
import net from 'net';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const EMAIL = process.env.PRINTBRIDGE_EMAIL;
const PASSWORD = process.env.PRINTBRIDGE_PASSWORD;
const PRINTER_IP = process.env.PRINTER_IP;

function env(name, value) {
  if (value) return value;
  console.error(`缺少环境变量: ${name}`);
  process.exit(1);
}

// ESC/POS 测试小票（与 Android EscPos 一致：ESC @, 文本, 换行, GS V 0）
function buildTestReceipt() {
  const ESC = Buffer.from([0x1b, 0x40]);
  const GS = Buffer.from([0x1d, 0x56, 0x00]);
  const LF = Buffer.from([0x0a]);
  const line = (s) => Buffer.from(s + '\n', 'utf8');
  const center = (s) => {
    const w = 24;
    const pad = Math.max(0, Math.floor((w - s.length) / 2));
    return line(' '.repeat(pad) + s);
  };
  const parts = [
    ESC,
    line(''),
    center('PrintBridge'),
    line('Test Receipt'),
    line(''),
    line('Printer OK (PC test)'),
    line(''),
    LF,
    GS,
  ];
  return Buffer.concat(parts);
}

function sendToPrinter(host, port = 9100) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(port, host, () => {
      const data = buildTestReceipt();
      socket.write(data, () => {
        socket.end();
        resolve();
      });
    });
    socket.setTimeout(15000);
    socket.on('error', reject);
    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error('Printer timeout'));
    });
  });
}

async function main() {
  const url = env('VITE_SUPABASE_URL 或 SUPABASE_URL', SUPABASE_URL);
  const key = env('VITE_SUPABASE_ANON_KEY 或 SUPABASE_ANON_KEY', SUPABASE_ANON_KEY);
  const email = env('PRINTBRIDGE_EMAIL', EMAIL);
  const password = env('PRINTBRIDGE_PASSWORD', PASSWORD);

  console.log('1. 创建 Supabase 客户端并登录 printer 用户...');
  const supabase = createClient(url, key);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (authError) {
    console.error('登录失败:', authError.message);
    process.exit(1);
  }
  console.log('   登录成功');

  console.log('2. 读取 shop_config (busy_mode)...');
  const { data: busyRow, error: busyErr } = await supabase
    .from('shop_config')
    .select('value')
    .eq('key', 'busy_mode')
    .maybeSingle();
  if (busyErr) {
    console.error('   shop_config 查询失败:', busyErr.message);
  } else {
    const busy = busyRow?.value === true || busyRow?.value === 'true';
    const mins = busy ? 55 : 25;
    console.log('   busy_mode =', busy, '-> collectionMinutes =', mins);
  }

  console.log('3. 查询未打印订单（printed_at 为空，24 小时内）...');
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: orders, error: ordersErr } = await supabase
    .from('orders')
    .select('id, total, created_at')
    .is('printed_at', null)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(10);
  if (ordersErr) {
    console.error('   查询失败:', ordersErr.message);
  } else {
    console.log('   未打印订单数:', orders?.length ?? 0);
    if (orders?.length) {
      orders.forEach((o, i) =>
        console.log(`   [${i + 1}] ${o.id.slice(0, 8)} £${Number(o.total).toFixed(2)} ${o.created_at}`)
      );
    }
  }

  if (PRINTER_IP) {
    console.log('4. 向打印机', PRINTER_IP + ':9100', '发送测试小票...');
    try {
      await sendToPrinter(PRINTER_IP);
      console.log('   已发送，请检查打印机是否出纸');
    } catch (e) {
      console.error('   发送失败:', e.message);
    }
  } else {
    console.log('4. 未设置 PRINTER_IP，跳过打印机测试（可选：set PRINTER_IP=192.168.x.x 再运行）');
  }

  console.log('\n电脑端测试完成。');
}

main();
