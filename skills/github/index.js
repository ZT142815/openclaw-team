#!/usr/bin/env node
/**
 * GitHub Skill for OpenClaw
 * 委托到 gh CLI
 */
const { spawn } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);

if (args.includes('--help') || args.length === 0) {
  console.log(`
🐙 GitHub Skill

用法:
  gh <command> [flags]      执行 gh 命令

示例:
  gh issue list             列出 Issue
  gh pr list                列出 PR
  gh run list               列出 CI 运行
  gh api <endpoint>         执行 API 请求

更多信息:
  gh <command> --help       查看子命令帮助
`);
  process.exit(0);
}

const child = spawn('gh', args, {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit'
});

child.on('exit', (code) => process.exit(code || 0));
child.on('error', (err) => {
  if (err.code === 'ENOENT') {
    console.error('❌ gh CLI 未安装，请访问 https://cli.github.com');
  } else {
    console.error('❌ Error:', err.message);
  }
  process.exit(1);
});
