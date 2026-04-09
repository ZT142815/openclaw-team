# evaluator Skill

> **作用**：独立评估 Agent 输出质量，提供第二视角验证
> **参考**：Anthropic GAN 架构中的 Evaluator Agent 设计
> **版本**：v1.0

---

## 一、核心概念

**问题**：同一个 Agent 既生成代码又审查代码 = 同一双眼睛检查自己的作业

**解决**：引入独立的 Evaluator Agent，作为第三双眼睛

```
┌─────────────┐     生成      ┌─────────────┐
│   Planner    │ ───────────► │  Generator  │
│  (规划者)    │              │  (执行者)   │
└─────────────┘              └─────────────┘
       │                           │
       │ 计划                       │ 输出
       ▼                           ▼
┌─────────────┐              ┌─────────────┐
│  Evaluator  │ ◄─────────── │   验收      │
│  (评估者)    │    验证      │  标准       │
└─────────────┘              └─────────────┘
```

---

## 二、评估维度

### 2.1 功能性评估

| 维度 | 检查项 | 权重 |
|------|--------|------|
| **正确性** | 输出符合需求规格 | 30% |
| **完整性** | 所有功能点都已实现 | 20% |
| **可运行性** | 代码可编译/可执行 | 20% |

### 2.2 代码质量评估

| 维度 | 检查项 | 权重 |
|------|--------|------|
| **架构合规** | 符合分层架构（UI→Service→Repo） | 15% |
| **可维护性** | 代码清晰，无明显坏味道 | 10% |
| **测试覆盖** | 核心功能有测试 | 5% |

### 2.3 安全评估 ⭐ NEW

| 维度 | 检查项 | 权重 |
|------|--------|------|
| **敏感信息** | 无硬编码 API Key/密码/Token | 🔴 P0 |
| **网络安全** | 全 HTTPS，禁止 http:// | 🔴 P0 |
| **输入验证** | 所有用户输入有验证 | 🟡 P2 |
| **权限合规** | iOS/Android 权限有说明 | 🟡 P2 |
| **Supabase RLS** | 所有表启用 RLS | 🔴 P0 |

### 2.4 输出质量评估

| 维度 | 检查项 | 权重 |
|------|--------|------|
| **格式规范** | 输出格式符合规范 | 加分项 |
| **文档完整** | 必要文档已更新 | 加分项 |

---

## 三、评估流程

```
╔═══════════════════════════════════════════════════╗
║  EVALUATOR WORKFLOW                               ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║  1. 接收 Generator 产出                           ║
║     └── handoff_code artifact                     ║
║                                                   ║
║  2. 读取验收标准                                  ║
║     └── PRD + feature_list.json                   ║
║                                                   ║
║  3. 执行评估                                      ║
║     ├── 功能正确性检查                            ║
║     ├── 代码质量检查                              ║
║     ├── 架构合规检查                              ║
║     └── 实际运行验证（如适用）                    ║
║                                                   ║
║  4. 生成评估报告                                  ║
║     └── 通过 / 需要修复 / 拒绝                    ║
║                                                   ║
║  5. 返回结果                                      ║
║     └── handoff_feedback 或 handoff_test_report   ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
```

---

## 四、评估报告格式

```json
{
  "artifact_type": "evaluation_report",
  "version": "1.0",
  "timestamp": "2026-04-09T15:00:00+08:00",
  "evaluator": "evaluator",
  "generator": "developer",
  "target": {
    "feature_id": "F001",
    "feature_name": "用户注册",
    "commit": "abc1234"
  },
  "evaluation": {
    "overall": "passed",
    "scores": {
      "correctness": 90,
      "completeness": 85,
      "runnability": 100,
      "architecture": 80,
      "maintainability": 75
    },
    "total_score": 86
  },
  "findings": [
    {
      "severity": "minor",
      "category": "maintainability",
      "description": "注册函数过长，建议拆分",
      "location": "lib/services/auth_service.dart:45-67",
      "suggestion": "拆分为 validateInput + createUser + sendWelcomeEmail"
    }
  ],
  "recommendations": [
    "修复 minor 问题后可以合并",
    "建议添加单元测试覆盖注册逻辑"
  ],
  "next_action": "修复 minor 问题后重新提交评估"
}
```

---

## 五、评估等级

| 等级 | 总分 | 含义 | 动作 |
|------|------|------|------|
| **A** | 90-100 | 优秀，可直接合并 | ✅ 允许合并 |
| **B** | 75-89 | 良好，有小问题 | ⚠️ 修复 minor 后合并 |
| **C** | 60-74 | 一般，有大问题 | ❌ 修复 major 后重新评估 |
| **D** | <60 | 不合格 | ❌ 拒绝，需重写 |

---

## 六、与 Tester 的区别

| 维度 | Tester | Evaluator |
|------|--------|-----------|
| **关注点** | 功能是否工作 | 输出是否合格 |
| **视角** | 用户视角 | 质量视角 |
| **检查方式** | 黑盒测试 | 白盒审查 |
| **产出** | BUG 列表 | 评估报告 |
| **时机** | 开发完成后 | 代码合并前 |

## 六.2 详细审查清单 ⭐ NEW

> 参考：OpenClaw 多 Agent 文章的 Code Reviewer 审查清单

### 审查清单（按类别）

#### 1. 安全性检查 🔴

| 检查项 | 说明 | 严重度 |
|--------|------|--------|
| SQL 注入 | 参数化查询，避免字符串拼接 | 🔴 P0 |
| XSS 攻击 | 输入输出转义 | 🔴 P0 |
| 敏感信息 | 无硬编码密码/密钥/API Key | 🔴 P0 |
| 权限控制 | 是否有越权漏洞 | 🔴 P1 |
| 输入验证 | 参数边界检查 | 🟡 P2 |

#### 2. 代码质量检查 🟡

| 检查项 | 说明 | 严重度 |
|--------|------|--------|
| 命名规范 | 变量/函数命名有意义 | 🟡 P2 |
| 函数长度 | 单函数不超过 50 行 | 🟡 P2 |
| 注释完整 | 公共函数有注释 | 🟢 P3 |
| 错误处理 | 有 try-catch，有日志 | 🟡 P2 |
| 代码重复 | 重复代码应抽取 | 🟢 P3 |

#### 3. 性能检查 🟡

| 检查项 | 说明 | 严重度 |
|--------|------|--------|
| N+1 查询 | 循环内避免数据库查询 | 🟡 P2 |
| 索引使用 | 查询字段有索引 | 🟡 P2 |
| 缓存 | 重复查询使用缓存 | 🟢 P3 |
| 异步 | IO 操作使用异步 | 🟢 P3 |

#### 4. 可测试性 🟢

| 检查项 | 说明 | 严重度 |
|--------|------|--------|
| 单元测试 | 核心函数有测试 | 🟡 P2 |
| 测试覆盖 | 覆盖率 >= 80% | 🟢 P3 |
| Mock 使用 | 外部依赖已 Mock | 🟢 P3 |

### 评估报告中的审查结果格式

```json
{
  "review_checklist": {
    "security": {
      "sql_injection": "pass",
      "xss": "pass",
      "sensitive_info": "fail",
      "permission": "pass",
      "input_validation": "pass"
    },
    "code_quality": {
      "naming": "pass",
      "function_length": "warn",
      "comments": "pass",
      "error_handling": "pass",
      "code_duplication": "pass"
    },
    "performance": {
      "n_plus_1": "pass",
      "index_usage": "pass",
      "caching": "pass",
      "async": "pass"
    },
    "testability": {
      "unit_tests": "pass",
      "coverage": "85%",
      "mock_usage": "pass"
    }
  }
}
```

### 严重度说明

| 等级 | 响应 |
|------|------|
| 🔴 P0 | 阻塞问题，必须修复才能通过 |
| 🟡 P2 | 建议修复，可选择性接受 |
| 🟢 P3 | 轻微问题，可忽略 |

---

## 六.3 测试用例校验 ⭐ NEW

> **问题**：测试用例本身可能与需求矛盾（如：需求规定输出<=maxLength，但测试期望输出>maxLength）

**校验流程：**
```
读取 PRD 需求定义
    ↓
读取测试用例（test/*.dart）
    ↓
对照需求逐条验证：
├── 测试断言是否符合需求约束？
├── 边界值测试是否存在？
├── 异常情况测试是否存在？
    ↓
发现问题 → 报告测试用例 Bug（TEST_BUG_XXX）
```

**测试用例 Bug 示例：**
```json
{
  "severity": "TEST_BUG",
  "category": "assertion_contradicts_requirement",
  "description": "测试期望 truncate('HelloWorld', 3) 返回 'Hel...' (6字符)，但需求规定输出必须 <= maxLength (3字符)",
  "location": "test/string_utils_test.dart:5",
  "requirement": "输出长度 <= maxLength",
  "test_assertion": "truncate('HelloWorld', 3) == 'Hel...'",
  "conflict": true
}
```

**注意**：发现 TEST_BUG 时，视为 P0 问题，需在评估报告中单独标注。

---

## 七、在工作流中的位置

```
Developer 开发
    ↓
Developer 自测（flutter analyze + test）
    ↓
Evaluator 独立评估 ⭐ NEW
    ↓
通过 → Tester 测试
    ↓
通过 → CEO 交付
```

---

## 八、版本历史

- v1.0（2026-04-09）：初始版本，基于 Anthropic GAN 架构
