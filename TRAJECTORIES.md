# TRAJECTORIES.md - 经验轨迹库

> **版本**：v1.0
> **作用**：结构化记录每次执行的轨迹，积累协调经验
> **参考**：OpenAI "仓库是唯一事实源" + Anthropic 轨迹记录最佳实践
> **位置**：~/.openclaw/trajectories/

---

## 一、核心概念

**轨迹（Trajectory）** = 一次完整的任务执行记录，包含：
- 任务目标
- 执行步骤
- Agent 协作模式
- 成功/失败结果
- 经验教训

**轨迹库价值**：
- 相似任务可直接复用经验
- 失败模式可被识别和避免
- 系统可从历史中学习

---

## 二、轨迹格式

```json
{
  "trajectory_id": "T20260409-001",
  "project": "budolist",
  "task_type": "feature_development",
  "start_time": "2026-04-09T10:00:00+08:00",
  "end_time": "2026-04-09T11:30:00+08:00",
  "duration_minutes": 90,
  "agents": ["developer", "tester"],
  "topology": "sequential",
  "task": {
    "feature_id": "F001",
    "title": "用户注册",
    "description": "实现邮箱注册功能"
  },
  "execution": {
    "steps": [
      {
        "step": 1,
        "agent": "developer",
        "action": "implement",
        "feature": "F001",
        "duration_minutes": 45,
        "artifacts": ["lib/services/auth_service.dart"],
        "commits": ["abc1234"]
      },
      {
        "step": 2,
        "agent": "tester",
        "action": "test",
        "feature": "F001",
        "duration_minutes": 30,
        "bugs_found": 1,
        "bug_severity": "P2"
      }
    ],
    "token_consumption": {
      "developer": 15000,
      "tester": 8000,
      "total": 23000
    }
  },
  "outcome": {
    "status": "success",
    "quality_score": 85,
    "blocks_merged": 1
  },
  "lessons_learned": [
    "注册验证逻辑应拆分为独立函数",
    "测试用例应覆盖边界条件"
  ],
  "patterns": [
    "sequential_topology",
    "single_feature_per_session"
  ]
}
```

---

## 三、轨迹分类

### 3.1 按任务类型

| 类型 | 说明 | 示例 |
|------|------|------|
| `feature_development` | 功能开发 | 开发 F001 用户注册 |
| `bug_fix` | Bug 修复 | 修复 F001 的登录 Bug |
| `prd_research` | PRD 研究 | 市场分析、竞品调研 |
| `architecture_design` | 架构设计 | 技术方案设计 |

### 3.2 按协作模式

| 模式 | 说明 | 适用场景 |
|------|------|---------|
| `sequential` | 顺序执行 | Developer → Tester |
| `parallel` | 并行执行 | Product 市场分析 + Developer 技术设计 |
| `hierarchical` | 分层执行 | CEO → Product/Developer/Tester |

### 3.3 按结果

| 结果 | 说明 |
|------|------|
| `success` | 任务完成，质量合格 |
| `partial_success` | 完成但有问题 |
| `failed` | 任务失败 |

---

## 四、轨迹分析

### 4.1 成功模式识别

```
成功轨迹特征：
- [模式1]：sequential + single_feature → 成功率 95%
- [模式2]：parallel + independent_tasks → 效率提升 40%
- [模式3]：context_usage < 40% → 质量分数高 20%
```

### 4.2 失败模式识别

```
失败轨迹特征：
- [模式1]：parallel + dependent_tasks → 冲突率 60%
- [模式2]：context_usage > 60% → 质量分数低 35%
- [模式3]：无 Evaluator → 问题漏检率 40%
```

---

## 五、轨迹库存储

### 目录结构

```
~/.openclaw/trajectories/
├── YYYY-MM/
│   ├── T20260409-001.json  # 单个轨迹
│   ├── T20260409-002.json
│   └── ...
├── index.json              # 轨迹索引
└── patterns/
    └── patterns.json       # 识别出的模式
```

### 索引格式

```json
{
  "last_updated": "2026-04-09T12:00:00+08:00",
  "total_trajectories": 50,
  "by_project": {
    "budolist": 30,
    "other": 20
  },
  "by_outcome": {
    "success": 40,
    "partial_success": 8,
    "failed": 2
  },
  "by_task_type": {
    "feature_development": 25,
    "bug_fix": 15,
    "prd_research": 7,
    "architecture_design": 3
  }
}
```

---

## 六、轨迹复用

当新任务开始时：

```
1. 检索相似轨迹
   └── task_type = "feature_development"
   └── feature_category = "auth"
   └── outcome = "success"

2. 提取经验
   └── 成功模式：sequential + single_feature
   └── Token 消耗参考：23000
   └── 质量分数参考：85

3. 应用到新任务
   └── 采用相同的协作模式
   └── 预算相似的 Token 消耗
   └── 设置质量期望
```

---

## 七、维护规则

| 动作 | 时机 | 执行者 |
|------|------|--------|
| 记录轨迹 | 每次任务完成 | Agent |
| 更新索引 | 每次新轨迹 | 自动 |
| 分析模式 | 每周 | CEO |
| 归档旧轨迹 | 每月 | CEO |

---

## 八、版本历史

- v1.0（2026-04-09）：初始版本
