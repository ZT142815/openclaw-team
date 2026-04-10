#!/usr/bin/env node
/**
 * UI Test Skill for OpenClaw
 * 委托到 scripts/flutter-web-test.js, scripts/mobile-ui-test.js
 */
const { spawn } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const scriptsDir = path.join(__dirname, '..', 'scripts');

// 解析参数
const web = args.includes('--web');
const mobile = args.includes('--mobile');
const full = !web && !mobile;
const help = args.includes('--help');

if (help) {
  console.log(`
🖥️ UI Test Skill

用法:
  node index.js --web     Web UI 测试
  node index.js --mobile  移动端 UI 测试
  node index.js           完整 UI 测试（默认）
  node index.js --help    显示帮助
`);
  process.exit(0);
}

async function runScript(scriptName, scriptArgs) {
  return new Promise((resolve) => {
    const scriptPath = path.join(scriptsDir, scriptName);
    const child = spawn('node', [scriptPath, ...scriptArgs], {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
    child.on('exit', (code) => resolve(code || 0));
  });
}

(async () => {
  let exitCode = 0;
  console.log('🖥️ 开始 UI 测试...\n');

  if (web || full) {
    console.log('📋 Web UI 测试...');
    const code = await runScript('flutter-web-test.js', args.filter(a => !a.startsWith('--')));
    if (code) exitCode = code;
  }
  if (mobile || full) {
    console.log('📋 移动端 UI 测试...');
    const code = await runScript('mobile-ui-test.js', args.filter(a => !a.startsWith('--')));
    if (code) exitCode = code;
  }

  console.log('\n✅ UI 测试完成');
  process.exit(exitCode);
})();
