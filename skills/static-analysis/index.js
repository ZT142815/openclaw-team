#!/usr/bin/env node
/**
 * Static Analysis Skill for OpenClaw
 * 委托到 scripts/custom-lint-rules.js, scripts/architecture-check.js, scripts/drift-check.js
 */
const { spawn } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const scriptsDir = path.join(__dirname, '..', 'scripts');

// 解析参数
const full = args.includes('--full') || args.includes('--all') || args.length === 0;
const lint = args.includes('--lint') || full;
const arch = args.includes('--arch') || full;
const drift = args.includes('--drift') || full;
const help = args.includes('--help');

if (help) {
  console.log(`
🔬 Static Analysis Skill

用法:
  node index.js --full      完整分析（默认）
  node index.js --lint      仅代码质量检查
  node index.js --arch      仅架构合规检查
  node index.js --drift     仅漂移检测
  node index.js --help      显示帮助
`);
  process.exit(0);
}

async function runScript(scriptName, args) {
  return new Promise((resolve) => {
    const scriptPath = path.join(scriptsDir, scriptName);
    const child = spawn('node', [scriptPath, ...args], {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
    child.on('exit', (code) => resolve(code || 0));
  });
}

(async () => {
  let exitCode = 0;
  console.log('🔬 开始静态分析...\n');

  if (lint) {
    console.log('📋 1/3 代码质量检查...');
    exitCode = await runScript('custom-lint-rules.js', args.filter(a => !a.startsWith('--')));
  }
  if (arch) {
    console.log('📋 2/3 架构合规检查...');
    const code = await runScript('architecture-check.js', args.filter(a => !a.startsWith('--')));
    if (code) exitCode = code;
  }
  if (drift) {
    console.log('📋 3/3 漂移检测...');
    const code = await runScript('drift-check.js', args.filter(a => !a.startsWith('--')));
    if (code) exitCode = code;
  }

  console.log('\n✅ 静态分析完成');
  process.exit(exitCode);
})();
