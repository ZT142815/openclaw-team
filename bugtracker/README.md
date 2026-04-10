# Bug Tracker System

> **版本**: v1.0
> **日期**: 2026-04-10
> **用途**: 追踪和管理 Budolist 项目的缺陷

---

## 概述

Bug Tracker 是一个轻量级的缺陷跟踪系统，用于记录、分类和跟踪 App 开发过程中的问题。

## 文件结构

```
bugtracker/
├── README.md         # 本文档
├── TEMPLATE.md       # Bug 报告模板
├── bugs.json         # 所有 Bug 的 JSON 数据库
└── scripts/
    ├── bug-report.js # Bug 报告生成工具
    └── dashboard.js  # Bug 状态仪表板
```

## 工作流程

### 1. 发现 Bug

发现问题时，使用 `TEMPLATE.md` 创建 Bug 报告。

### 2. 记录 Bug

```bash
# 生成 Bug ID 并添加到 bugs.json
node scripts/bug-report.js new --title "Bug标题" --severity S2 --description "描述"
```

### 3. 查看 Bug 状态

```bash
# 查看所有 Bug 仪表板
node scripts/dashboard.js

# 查看特定状态的 Bug
node scripts/dashboard.js --filter open
```

### 4. 更新 Bug

编辑 `bugs.json` 中对应 Bug 的状态字段。

---

## 严重级别定义

| 级别 | 名称 | 说明 | 响应时间 |
|------|------|------|----------|
| S0 | 崩溃 | 系统崩溃、数据丢失 | 立即 |
| S1 | 严重 | 核心功能完全失效 | 4小时 |
| S2 | 中等 | 功能异常但可绕过 | 24小时 |
| S3 | 轻微 | 优化建议 | 72小时 |

## 状态定义

| 状态 | 说明 |
|------|------|
| New | 新发现的 Bug |
| Assigned | 已分配给负责人 |
| In Progress | 正在修复 |
| Verified | 已修复，等待验证 |
| Closed | 已关闭 |

---

## 使用示例

### 创建新 Bug

```bash
node scripts/bug-report.js new \
  --title "列表滑动卡顿" \
  --severity S2 \
  --platform iOS \
  --version "1.0.0" \
  --description "在 iPhone 12 上滑动待办列表时出现明显卡顿"
```

### 查看仪表板

```bash
node scripts/dashboard.js
```

输出示例：
```
📊 Bug Dashboard
================
总数: 5 | 开放: 3 | 已关闭: 2

S0 崩溃: 0
S1 严重: 1
S2 中等: 2
S3 轻微: 2

开放 Bug:
- BUG-001: [S1] 列表滑动卡顿 - iOS
- BUG-002: [S2] 复选框样式错位 - Web
...
```

---

## 集成到 CI/CD

Bug Tracker 可与 GitHub Actions 集成：

```yaml
# .github/workflows/bug-triage.yml
name: Bug Triage
on:
  issues:
    types: [opened, labeled]
jobs:
  track-bug:
    runs-on: ubuntu-latest
    steps:
      - name: Track Bug
        run: node scripts/bug-report.js sync --issue ${{ github.event.issue.number }}
```

---

## 维护规则

1. **每日**: 检查新的 S0/S1 Bug
2. **每周**: 回顾所有开放 Bug，更新状态
3. **每月**: 清理已关闭的 Bug，更新统计数据

---

**最后更新**: 2026-04-10
