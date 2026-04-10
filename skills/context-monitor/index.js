#!/usr/bin/env node
/**
 * Context Monitor Skill for OpenClaw
 * 监控 Context 使用率，触发告警和自动处理
 */
const args = process.argv.slice(2);

if (args.includes('--help') || args.length === 0) {
  console.log(`
📊 Context Monitor Skill

触发条件:
  Context 使用率 >= 40%  →  警告
  Context 使用率 >= 60%  →  告警 → 执行 compaction
  Context 使用率 >= 80%  →  紧急 → 触发 Context Reset

Smart Zone 理论 (Dex Horthy):
  < 40%  ✅ 正常 (Smart Zone)
  40-60% ⚠️ 警告 → 准备压缩
  60-80% 🔶 告警 → 执行压缩
  > 80%  🔴 紧急 → Reset

使用方式:
  此 Skill 由系统自动调用，不需要手动执行
`);
  process.exit(0);
}

console.log('Context Monitor 由系统自动触发');
