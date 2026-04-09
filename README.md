# Developer Agent 工作区

> **Developer Agent（周小码）的专属工作目录**

---

## 目录结构

```
workspace-developer/
├── README.md              # 本文件
├── SOUL.md               # Developer 灵魂定义
├── AGENTS.md             # Developer 工作规范
├── scripts/              # 工具脚本
│   └── architecture-check.js  # 架构检查脚本
├── .husky/               # Git hooks
│   ├── pre-commit        # Pre-commit hook
│   └── install.sh        # Hook 安装脚本
└── .github/workflows/    # CI 配置
    └── ci.yml            # GitHub Actions CI
```

---

## 核心脚本

### 1. 架构检查

```bash
node scripts/architecture-check.js --path ~/budolist/lib
```

**功能**：
- 检测 UI → Service → Repo 单向依赖
- 检测循环依赖
- 输出结构化报告

### 2. Pre-commit Hook

```bash
# 安装到项目
./.husky/install.sh ~/budolist

# 安装后，每次 git commit 会自动运行：
# 1. flutter analyze
# 2. architecture check
# 3. format check
```

---

## Clean State 标准

所有代码必须满足以下条件才能合并：

| 检查项 | 标准 |
|--------|------|
| Flutter Analyze | 0 errors, 0 warnings |
| 架构检测 | 通过 |
| 单元测试 | 核心逻辑必须通过 |
| 循环依赖 | 禁止 |

---

## 架构规则

```
┌─────────────────────────────────────┐
│              UI Layer               │
│   (screens/, widgets/, pages/)     │
└──────────────────┬──────────────────┘
                   │ 调用
                   ▼
┌─────────────────────────────────────┐
│           Service Layer             │
│   (services/, managers/, blocs/)   │
└──────────────────┬──────────────────┘
                   │ 调用
                   ▼
┌─────────────────────────────────────┐
│            Repo Layer               │
│   (repositories/, models/, apis/)  │
└─────────────────────────────────────┘
```

---

## 工作流程

```
1. 接收需求（CEO handoff）
2. 技术设计 → 输出 SPEC.md
3. 代码开发 → 满足 Clean State
4. 自测报告 → 输出到 docs/TEST-REPORT.md
5. 提交给 Tester
```

---

**最后更新**：2026-04-09
