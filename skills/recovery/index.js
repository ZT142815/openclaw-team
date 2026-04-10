#!/usr/bin/env node
/**
 * Recovery Skill for OpenClaw
 * Context Reset 和故障恢复机制
 */
const args = process.argv.slice(2);

if (args.includes('--help') || args.length === 0) {
  console.log(`
🔄 Recovery Skill

Context Reset = 当 Context 接近饱和时，不压缩而是重启一个干净的 Agent，从结构化交接文档恢复状态

触发条件:
  Context 使用率 > 80%

执行流程:
  1. 保存当前状态到交接文件
  2. 触发 Context Reset
  3. 新 Agent 从交接文件恢复状态
  4. 继续执行任务

类比:
  程序碰到内存泄漏 → 不是手动释放每个内存块，而是直接重启进程

使用方式:
  此 Skill 由系统自动触发，不需要手动调用
`);
  process.exit(0);
}

console.log('Recovery 由系统自动触发');
console.log('触发条件: context > 80%');
