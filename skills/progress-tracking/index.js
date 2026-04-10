#!/usr/bin/env node
/**
 * Progress Tracking Skill for OpenClaw
 * 项目进度跟踪和状态管理
 */
const fs = require('fs');
const path = require('path');

const WORKSPACE = path.join(__dirname, '..', '..');
const PROGRESS_FILE = path.join(WORKSPACE, 'progress.txt');
const args = process.argv.slice(2);

function showProgress() {
  console.log('\n📊 项目进度\n');
  
  if (!fs.existsSync(PROGRESS_FILE)) {
    console.log('  （无进度记录）');
    return;
  }
  
  const lines = fs.readFileSync(PROGRESS_FILE, 'utf8').split('\n').filter(l => l.trim());
  lines.forEach(l => console.log(`  ${l}`));
  console.log();
}

function updateProgress(text) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
  const entry = `[${timestamp}] ${text}`;
  
  fs.appendFileSync(PROGRESS_FILE, entry + '\n', 'utf8');
  console.log(`✅ 进度已更新: ${text}`);
}

if (args.includes('--help') || args.length === 0) {
  console.log(`
📊 Progress Tracking Skill

用法:
  node index.js status              显示进度
  node index.js update <text>       更新进度
  node index.js --help              显示帮助

示例:
  node index.js status
  node index.js update "完成登录功能开发"
`);
  process.exit(0);
}

if (args.includes('status')) {
  showProgress();
} else if (args.includes('update')) {
  const idx = args.indexOf('update');
  const text = args.slice(idx + 1).join(' ');
  if (text) {
    updateProgress(text);
  } else {
    console.error('❌ 请提供进度描述');
    process.exit(1);
  }
} else {
  console.log('未知参数，请使用 --help');
  process.exit(1);
}
