#!/usr/bin/env node
/**
 * Observability Skill for OpenClaw
 * 
 * 提供项目进度和 Agent 状态的实时可视化
 * 参考：OpenAI "Chrome DevTools Protocol" 可观测性实践
 * 
 * 可观测性三要素：
 *   1. 度量（Metrics）→ 数值指标：进度%、Token消耗
 *   2. 日志（Logs）→ 操作记录：谁做了什么
 *   3. 追踪（Traces）→ 调用链：任务如何流转
 */
const args = process.argv.slice(2);
const fs = require('fs');
const path = require('path');

const WORKSPACE = path.join(__dirname, '..', '..');
const PROGRESS_FILE = path.join(WORKSPACE, 'progress.txt');

function showDashboard() {
  console.log(`
╔═══════════════════════════════════════════════════╗
║          📊 OpenClaw 可观测性仪表盘               ║
╠═══════════════════════════════════════════════════╣`);

  // 读取进度文件（如存在）
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      const content = fs.readFileSync(PROGRESS_FILE, 'utf8');
      const lines = content.split('\n').filter(l => l.trim());
      console.log('║                                                   ║');
      lines.slice(0, 5).forEach(line => {
        const truncated = line.length > 44 ? line.substring(0, 41) + '...' : line;
        console.log(`║  ${truncated.padEnd(44)}║`);
      });
    } catch (e) {}
  }

  console.log(`╠═══════════════════════════════════════════════════╣`);
  console.log(`║  可观测性三要素:                                  ║`);
  console.log(`║  📈 度量 (Metrics)   - Token/进度/性能           ║`);
  console.log(`║  📝 日志 (Logs)      - 操作记录                  ║`);
  console.log(`║  🔗 追踪 (Traces)    - 任务调用链                ║`);
  console.log(`╚═══════════════════════════════════════════════════╝`);
}

function showMetrics() {
  console.log('\n📈 当前指标：\n');
  console.log('  Context 使用率:  查看 session_status');
  console.log('  Token 消耗:      查看 session_status');
  console.log('  任务进度:        projects/*/progress.md');
  console.log('  Bug 数量:        bugtracker/bugs.json\n');
}

function showLogs() {
  const today = new Date().toISOString().split('T')[0];
  const logFile = path.join(WORKSPACE, 'memory', `${today}.md`);
  
  console.log('\n📝 今日操作日志：\n');
  if (fs.existsSync(logFile)) {
    const lines = fs.readFileSync(logFile, 'utf8').split('\n').filter(l => l.trim()).slice(-10);
    lines.forEach(l => console.log('  ' + l));
  } else {
    console.log('  （无日志记录）');
  }
  console.log();
}

if (args.includes('--help') || args.length === 0) {
  showDashboard();
  console.log(`
用法:
  node index.js dashboard    显示仪表盘
  node index.js metrics      显示指标
  node index.js logs         显示日志
  node index.js --help       显示帮助
`);
  process.exit(0);
}

if (args.includes('dashboard')) {
  showDashboard();
} else if (args.includes('metrics')) {
  showMetrics();
} else if (args.includes('logs')) {
  showLogs();
} else {
  showDashboard();
}
