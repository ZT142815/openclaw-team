#!/usr/bin/env node
/**
 * Auto-Memory Skill for OpenClaw
 * 自动化记忆管理 - 读取、写入、整合
 */
const fs = require('fs');
const path = require('path');

const WORKSPACE = path.join(__dirname, '..', '..');
const MEMORY_DIR = path.join(WORKSPACE, 'memory');
const today = new Date().toISOString().split('T')[0];
const todayFile = path.join(MEMORY_DIR, `${today}.md`);

const args = process.argv.slice(2);

function showStatus() {
  console.log('\n🧠 Auto-Memory 状态\n');
  
  // 检查记忆目录
  if (!fs.existsSync(MEMORY_DIR)) {
    console.log('❌ memory/ 目录不存在');
    return;
  }
  
  // 读取今日记忆
  if (fs.existsSync(todayFile)) {
    const lines = fs.readFileSync(todayFile, 'utf8').split('\n').filter(l => l.trim());
    console.log(`📅 今日记忆 (${today}): ${lines.length} 条`);
    lines.slice(-5).forEach(l => console.log(`   ${l}`));
  } else {
    console.log(`📅 今日记忆: (空)`);
  }
  
  // 读取快捷方式
  const todayLink = path.join(MEMORY_DIR, 'today.md');
  const yesterdayLink = path.join(MEMORY_DIR, 'yesterday.md');
  
  if (fs.existsSync(todayLink)) {
    console.log(`\n🔗 today.md → ${fs.readlinkSync(todayLink)}`);
  }
  if (fs.existsSync(yesterdayLink)) {
    console.log(`🔗 yesterday.md → ${fs.readlinkSync(yesterdayLink)}`);
  }
  console.log();
}

function writeEntry(text) {
  if (!fs.existsSync(MEMORY_DIR)) {
    fs.mkdirSync(MEMORY_DIR, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
  const entry = `\n### [${timestamp}] 自动记忆\n- ${text}`;
  
  fs.appendFileSync(todayFile, entry, 'utf8');
  console.log(`✅ 已写入记忆: ${text}`);
}

if (args.includes('--help') || args.length === 0) {
  console.log(`
🧠 Auto-Memory Skill

用法:
  node index.js status            显示记忆状态
  node index.js write <text>      写入记忆
  node index.js --help            显示帮助

示例:
  node index.js status
  node index.js write "用户说想要一个待办事项 App"
`);
  process.exit(0);
}

if (args.includes('status')) {
  showStatus();
} else if (args.includes('write')) {
  const idx = args.indexOf('write');
  const text = args.slice(idx + 1).join(' ');
  if (text) {
    writeEntry(text);
  } else {
    console.error('❌ 请提供要写入的内容');
    process.exit(1);
  }
} else {
  console.log('未知参数，请使用 --help 查看用法');
  process.exit(1);
}
