# static-analysis Skill

> **作用**：静态代码分析，支持重构项目的代码质量和安全检查
> **版本**：v1.1
> **适用场景**：老项目重构前分析、重构后验证、代码质量审查

---

## 一、核心功能

基于已有脚本实现：
1. **代码复杂度分析** → `custom-lint-rules.js`
2. **架构合规检查** → `architecture-check.js`
3. **漂移检测** → `drift-check.js`

---

## 二、使用方法

### 2.1 完整静态分析

```bash
cd ~/.openclaw/workspace-developer

# 运行完整分析（调用所有脚本）
./run-static-analysis.sh --project /path/to/project
```

### 2.2 分步执行

```bash
# 1. 代码复杂度 + 坏味道检测
node scripts/custom-lint-rules.js --path /path/to/project/lib

# 2. 架构检查（分层架构违规检测）
node scripts/architecture-check.js --path /path/to/project/lib

# 3. 漂移检测（实现与 SPEC 不一致）
node scripts/drift-check.js --project /path/to/project
```

### 2.3 快速检查

```bash
# 仅检测架构违规
node scripts/architecture-check.js --path /path/to/project/lib --quick

# 仅检测代码复杂度
node scripts/custom-lint-rules.js --path /path/to/project/lib --severity=error
```

---

## 三、输出报告格式

```json
{
  "analysis_date": "2026-04-09",
  "project": "my_app",
  "summary": {
    "total_issues": 25,
    "errors": 3,
    "warnings": 12,
    "infos": 10
  },
  "complexity": {
    "average_cyclomatic": 5.2,
    "max_cyclomatic": 18,
    "functions_over_50_lines": 3,
    "files_over_500_lines": 2
  },
  "code_smells": {
    "duplications": [
      {"file": "lib/auth.dart", "lines": "45-52", "similar": "lib/user.dart:67-74"}
    ],
    "long_functions": [
      {"file": "lib/service.dart", "function": "processUserData", "lines": 78}
    ]
  },
  "architecture_violations": [
    {
      "file": "lib/ui/login.dart",
      "rule": "no_ui_in_service",
      "layer": "service",
      "description": "UI 层代码出现在 Service 层"
    }
  ],
  "drift_detected": [
    {
      "file": "lib/api/user_api.dart",
      "spec": "应返回 User 对象",
      "actual": "返回 Map",
      "severity": "error"
    }
  ],
  "recommendations": [
    "重构 lib/service.dart:processUserData，拆分为多个小函数",
    "修复 3 个架构违规问题"
  ]
}
```

---

## 四、重构分析清单

### 4.1 重构前分析（必做）

```bash
node scripts/architecture-check.js --path /path/to/project/lib
node scripts/custom-lint-rules.js --path /path/to/project/lib
node scripts/drift-check.js --project /path/to/project
```

### 4.2 重构后验证（必做）

```bash
# 1. flutter analyze 必须 0 errors
flutter analyze --fatal-infos --fatal-warnings

# 2. 所有测试通过
flutter test

# 3. 架构检查通过（无新增违规）
node scripts/architecture-check.js --path /path/to/project/lib --strict

# 4. 漂移检测通过
node scripts/drift-check.js --project /path/to/project --verify
```

### 4.3 代码质量指标

| 指标 | 目标值 | 严重度 |
|------|--------|--------|
| 圈复杂度 | < 10 | 🔴 |
| 函数长度 | < 50 行 | 🟡 |
| 文件长度 | < 500 行 | 🟡 |
| 架构违规 | 0 | 🔴 |
| 漂移 | 0 | 🔴 |

---

## 五、集成到 CI

```yaml
# .github/workflows/static-analysis.yml
- name: Static Analysis
  run: |
    node scripts/architecture-check.js --path lib --format json
    node scripts/custom-lint-rules.js --path lib --format json
    node scripts/drift-check.js --project . --format json
```

---

## 六、版本历史

- v1.1（2026-04-09）：引用实际脚本（architecture-check.js / custom-lint-rules.js / drift-check.js）
- v1.0（2026-04-09）：初始版本
