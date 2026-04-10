#!/usr/bin/env node
/**
 * Smart Memory Skill for OpenClaw
 * 智能记忆系统 - 管理 Agent 的记忆读取、写入和整理
 */
const fs = require('fs');
const path = require('path');

const WORKSPACE = path.join(__dirname, '..', '..');
const MEMORY_DIR = path.join(WORKSPACE, 'memory');
const today = new Date().toISOString().split('T')[0];
const todayFile = path.join(MEMORY_DIR, `${today}.md`);

const args = process.argv.slice(2);

function showMemory() {
  console.log('\n🧠 智能记忆系统\n');
  
  // 检查关键记忆文件
  const keyFiles = [
    'IDENTITY.md',
    'USER.md',
    'MEMORY.md',
    'AGENTS.md'
  ];
  
  keyFiles.forEach(file => {
    const filePath = path.join(WORKSPACE, file);
    if (fs.existsSync(filePath)) {
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ❌ ${file} (缺失)`);
    }
  });
  
  // 今日记忆
  if (fs.existsSync(todayFile)) {
    const lines = fs.readFileSync(todayFile, 'utf8').split('\n').filter(l => l.trim());
    console.log(`\n📅 今日记忆: ${lines.length} 条`);
  } else {
    console.log('\n📅 今日记忆: (空)');
  }
  console.log();
}

function searchMemory(query) {
  console.log(`\n🔍 搜索记忆: "${query}"\n`);
  
  // 简单关键词搜索
  const allFiles = [];
  if (fs.existsSync(MEMORY_DIR)) {
    fs.readdirSync(MEMORY_DIR).forEach(f => {
      if (f.endsWith('.md')) {
        allFiles.push(path.join(MEMORY_DIR, f));
      }
    });
  }
  
  const results = [];
  allFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.toLowerCase().includes(query.toLowerCase())) {
        results.push({ file: path.basename(file), line: idx + 1, content: line.trim() });
      }
    });
  });
  
  if (results.length === 0) {
    console.log('  未找到相关记忆');
  } else {
    results.slice(0, 10).forEach(r => {
      console.log(`  📄 ${r.file}:${r.line}`);
      console.log(`     ${r.content.substring(0, 80)}${r.content.length > 80 ? '...' : ''}`);
    });
  }
  console.log();
}

if (args.includes('--help') || args.length === 0) {
  console.log(`
🧠 Smart Memory Skill

用法:
  node index.js status              显示记忆状态
  node index.js search <query>     搜索记忆
  node index.js --help             显示帮助
`);
  process.exit(0);
}

if (args.includes('status')) {
  showMemory();
} else if (args.includes('search')) {
  const idx = args.indexOf('search');
  const query = args.slice(idx + 1).join(' ');
  if (query) {
    searchMemory(query);
  } else {
    console.error('❌ 请提供搜索关键词');
    process.exit(1);
  }
} else {
  console.log('未知参数，请使用 --help');
  process.exit(1);
}
