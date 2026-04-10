#!/usr/bin/env node
/**
 * Context Compaction Skill for OpenClaw
 * 自动压缩长对话上下文，保持性能
 */
const args = process.argv.slice(2);

if (args.includes('--help') || args.length === 0) {
  console.log(`
📦 Context Compaction Skill

触发条件:
  - 对话轮次 >= 20 轮
  - Context 使用率 >= 70%

压缩原则:
  保留:
    - 用户原始需求
    - 所有 Handoff Artifacts (JSON)
    - 重要决策
    - 当前状态
  
  丢弃:
    - 闲聊内容
    - 重复确认
    - 调试信息

使用方式:
  此 Skill 由系统自动触发，不需要手动调用
  当 Context 接近饱和时，系统会提示执行 compaction
`);
  process.exit(0);
}

console.log('Context Compaction 由系统自动触发');
console.log('触发条件: context >= 70% 或对话轮次 >= 20');
