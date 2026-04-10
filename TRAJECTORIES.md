# TRAJECTORIES.md - 经验轨迹库

> **版本**: v1.0
> **日期**: 2026-04-10
> **维护**: 自动由 Steering Loop 更新

---

## 概述

TRAJECTORIES.md 记录 Developer Agent 的关键任务执行轨迹，包括成功经验、失败教训和可复用的模式。

**实际存储位置**: `~/.openclaw/trajectories/` (统一轨迹存储)
- `index.json` - 轨迹索引
- `patterns/patterns.json` - 模式库
- `YYYY-MM/` - 按月归档

---

## 轨迹索引 (index.json)

```json
{
  "last_updated": "2026-04-09T17:02:00+08:00",
  "total_trajectories": 1,
  "by_project": {
    "test-run-v2": 1
  },
  "by_outcome": {
    "success": 1,
    "partial_success": 0,
    "failed": 0
  },
  "by_task_type": {
    "feature_development": 1,
    "bug_fix": 0,
    "prd_research": 0,
    "architecture_design": 0
  }
}
```

---

## 模式库 (patterns/patterns.json)

> 由 Steering Loop 自动分析生成

---

## 经验总结

### 架构设计

| 模式 | 说明 | 适用场景 |
|------|------|---------|
| 多Agent协作 | CEO→Product→Developer→Tester 流水线 | 新App开发 |
| Feedforward优先 | pre-commit + lint 在前，快速失败 | 所有代码变更 |
| Feedback监控 | drift-monitor + evaluator 在后，持续质量 | 长期项目 |

### 交接协议

| 模式 | 说明 | 验收标准 |
|------|------|---------|
| Handoff Artifact | JSON格式结构化交接 | validated: true |
| 阶段交付物 | 每个阶段明确的产出 | 文件路径 + 状态 |

### 质量保障

| 模式 | 说明 | 触发条件 |
|------|------|---------|
| context 40%压缩 | Smart Zone 管理 | context >= 40% |
| 安全扫描 | security-scan.js | 每次代码变更 |
| 性能基准 | performance-test.js | 复杂App/重构后 |

---

## 失败模式 (来自 FAILURES.md)

### #1: Context Overflow
- **时间**: 2026-04-09
- **原因**: 长时间对话导致context超过80%阈值
- **改进**: 降低context阈值到40%，增加压缩频率

### #2: Handoff Missing
- **时间**: 2026-04-09
- **原因**: Product Agent和Developer Agent交接时缺少关键信息
- **改进**: 强化handoff checklist，必填字段校验

### #3: Context Overflow (批量操作)
- **时间**: 2026-04-09
- **原因**: 批量创建文档时context快速增长
- **改进**: 增加context-compaction skill触发频率

---

## Steering Loop 分析

> 由 `steering-loop.js` 自动生成

---

**最后更新**: 2026-04-10
