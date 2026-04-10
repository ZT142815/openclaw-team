# Contributing to openclaw-team

> **项目状态**: 自动化能力改进系统
> **维护者**: 周涛 (@ZT142815)

---

## 一、概述

这是一个基于 OpenClaw 的多 Agent 自动化团队项目，用于探索和实践 AI 原生软件开发流程。

## 二、团队架构

```
┌─────────────────────────────────────────┐
│           CEO Agent (周小墨)              │
│  - 任务调度、进度跟踪、结果汇报            │
└──────────┬──────────────────────────────┘
           │
    ┌──────┴──────┬───────────────┐
    ▼              ▼               ▼
 Product      Developer       Tester
  Agent        Agent          Agent
```

## 三、工作流程

### 3.1 需求处理流程

```
用户需求 → CEO分析 → Quality Gate #1（用户确认）
    ↓
并行：Product(PRD) + Developer(架构)
    ↓
Developer 实现 → 自测 → Evaluator 评估 → Tester 测试
    ↓
Quality Gate #2（测试报告） → CEO交付
```

### 3.2 Feedforward 检查（提交前）

| 检查项 | 命令 |
|--------|------|
| Flutter 分析 | `flutter analyze` |
| Dart 分析 | `dart analyze` |
| 预提交检查 | `.husky/pre-commit` |

### 3.3 Feedback 检查（持续监控）

| 检查项 | 脚本 |
|--------|------|
| 架构检查 | `architecture-check.js` |
| 安全扫描 | `security-scan.js` |
| 漂移检测 | `drift-check.js` |
| 熵管理 | `entropy-check.js` |

## 四、文件结构

```
openclaw-team/
├── .github/
│   ├── workflows/     # CI/CD pipelines
│   ├── install.sh     # 环境初始化
│   └── CODEOWNERS     # PR 审查分配
├── docs/              # 运营文档
│   ├── INCIDENT_RESPONSE.md  # 事件响应
│   ├── ONCALL.md      # 值班表
│   ├── RUNBOOK.md     # 运维手册
│   └── SLO.md         # 服务等级目标
├── scripts/           # 自动化脚本
│   ├── architecture-check.js
│   ├── security-scan.js
│   ├── drift-monitor.js
│   └── ...
├── bugtracker/         # 缺陷跟踪
├── memory/            # 每日记忆
├── patterns/          # 成功模式库
├── skills/            # Agent Skills
└── templates/         # 文档模板
```

## 五、提交规范

### 5.1 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type 类型**:
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试
- `chore`: 构建/工具

### 5.2 提交前检查

```bash
# 本地检查
npm run pre-commit   # 或 .husky/pre-commit

# 推送前检查
npm run verify
```

## 六、自动化 Cron 任务

| 任务 | 频率 | 说明 |
|------|------|------|
| auto-capability-improve | 每2小时 | 自动化能力改进 |
| entropy-management | 每天21:00 | 系统熵管理 |
| Memory Dreaming | 每天22:00 | 记忆整合 |

## 七、快速命令

```bash
# 查看 Cron 健康状态
node scripts/cron-health-monitor.js

# 运行熵检查
node scripts/entropy-check.js

# 运行安全扫描
node scripts/security-scan.js

# 运行漂移检测
node scripts/drift-monitor.js

# 运行架构检查
node scripts/architecture-check.js
```

## 八、问题反馈

| 渠道 | 说明 |
|------|------|
| GitHub Issues | 使用 `bug` 或 `enhancement` 标签 |
| Bugtracker | 本地 `bugtracker/bugs.json` |

## 九、License

Private - All rights reserved
