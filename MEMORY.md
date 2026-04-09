# MEMORY.md - Developer Agent 长期记忆

> **版本**：v2.0（2026-04-01 精简）
> **只保留当前项目相关记忆**

---

## 一、团队架构

| Agent | ID | 名字 | 核心职责 |
|-------|-----|------|-----------|
| CEO | main | 周小墨 | 任务调度、协调、汇报 |
| Product | product | 周小产 | 需求分析、PRD编写 |
| Developer | developer | 周小码 | 代码开发、技术实现 |
| Tester | tester | 周小测 | 测试执行、BUG跟踪 |

---

## 二、技术栈

### App 框架
- **主要**：Flutter（iOS/Android）
- **备选**：Expo + React Native（快速原型）

### 后端
- **默认**：Supabase（BaaS）
  - PostgreSQL / Auth / Realtime / Storage / Edge Functions

---

## 三、设计规范

> 遵循 templates/design/ 下的规范

| 文件 | 用途 |
|------|------|
| `templates/design/DESIGN-SYSTEM.md` | 基础设计规范 |
| `templates/design/FLUTTER-DESIGN-GENERAL.md` | Flutter 实现指南 |

**核心规范**：
- 主色：#007AFF（Apple 蓝）
- 间距：8px 网格
- 圆角：按钮 12px / 卡片 16px
- 字体：系统字体

---

## 四、代码规范

- **命名**：camelCase（变量/函数）、PascalCase（类）
- **测试**：flutter analyze 0 errors
- **自测**：截图 SHA1 验证

---

## 五、Skills 索引

| 文件 | 用途 |
|------|------|
| `skills/CODING-STANDARDS.md` | 代码规范 |
| `skills/SUPABASE.md` | Supabase 开发指南 |

---

## 六、当前项目

### 说不（Budolist）

| 属性 | 内容 |
|------|------|
| **版本** | v2.2.1 |
| **状态** | ⏳ 待验收 |
| **位置** | `~/.openclaw/projects/budolist/` |

---

**最后更新**：2026-04-01
