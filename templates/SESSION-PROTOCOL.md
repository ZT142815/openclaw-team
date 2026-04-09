# SESSION-PROTOCOL.md - Agent Session 启动/结束协议

> **版本**：v2.0
> **作用**：定义每个 Agent Session 开始和结束时的标准行为
> **适用范围**：Product / Developer / Tester 所有 Agent
> **核心目的**：解决"Context Window 边界"问题，实现真正的断点续传

---

## 背景问题

AI Agent 每次新 Session 开始时是"空白状态"：
- 不记得上次做到哪了
- 可能重复做或漏做
- 过早宣告完成
- 把代码留在不可合并的半成品状态

**解决方案**：外部记忆 + 标准协议

---

## Session 生命周期

```
┌─────────────────────────────────────────────────────────────┐
│                     Session 生命周期                          │
│                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌────────┐ │
│  │  START   │───►│  DO WORK │───►│  END    │───►│RESUME │ │
│  │ (启动)   │    │ (执行)   │    │ (收尾)   │    │(续传) │ │
│  └──────────┘    └──────────┘    └──────────┘    └────────┘ │
│       │                                            │       │
│       │                                            │       │
│       ◄────────────────────────────────────────────┘       │
│                   读取 progress.txt                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 一、通用 Session 启动协议（所有 Agent）

**每次新 Session 开始时，必须按顺序执行以下步骤：**

```
╔═══════════════════════════════════════════════╗
║  SESSION START - 所有 Agent 必须执行          ║
╠═══════════════════════════════════════════════╣
║  1. pwd                      # 确认目录       ║
║  2. cat progress.txt         # 读取进度       ║
║  3. cat feature_list.json    # 读取功能清单   ║
║  4. git log --oneline -5     # 检查历史       ║
║  5. [Agent特定检查]          # 见各Agent节    ║
║  6. 继续上次工作或开始新任务  ║
╚═══════════════════════════════════════════════╝
```

---

## 二、通用 Session 结束协议（所有 Agent）

**每次 Session 结束时，必须执行以下收尾工作：**

```
╔═══════════════════════════════════════════════╗
║  SESSION END - 所有 Agent 必须执行            ║
╠═══════════════════════════════════════════════╣
║  1. 更新 progress.txt                        ║
║  2. 更新 feature_list.json（如适用）         ║
║  3. [Agent特定收尾]         # 见各Agent节    ║
║  4. git add + git commit（如果有必要改动）  ║
║  5. 验证状态完整性                         ║
╚═══════════════════════════════════════════════╝
```

---

## 三、Agent 特定规则

### 3.1 Developer Agent（💻）

**启动时额外检查：**
```
╔═══════════════════════════════════════════════╗
║  Developer 额外检查                          ║
╠═══════════════════════════════════════════════╣
║  6. flutter analyze        # 确保代码可编译  ║
║  7. 选择 passes=false 的最高优先级功能      ║
╚═══════════════════════════════════════════════╝
```

**结束时代码状态验证：**
```
✅ flutter analyze: 0 errors
✅ flutter test: 通过
✅ 架构检查: 通过
✅ feature_list.json: 已更新
✅ progress.txt: 已更新
```

### 3.2 Product Agent（📋）

**启动时额外检查：**
```
╔═══════════════════════════════════════════════╗
║  Product 额外检查                            ║
╠═══════════════════════════════════════════════╣
║  6. 查看 PRD 状态         # 是否在撰写中     ║
║  7. 查看竞品分析进度                         ║
╚═══════════════════════════════════════════════╝
```

**结束时代码状态验证：**
```
✅ PRD.md: 已保存最新
✅ feature_list.json: 已生成/更新（如有）
✅ progress.txt: 已更新
```

### 3.3 Tester Agent（🔍）

**启动时额外检查：**
```
╔═══════════════════════════════════════════════╗
║  Tester 额外检查                            ║
╠═══════════════════════════════════════════════╣
║  6. cat tests/BUG_TRACKER.md # 读取Bug列表  ║
║  7. 选择待测试的功能                        ║
╚═══════════════════════════════════════════════╝
```

**结束时代码状态验证：**
```
✅ feature_list.json: 测试状态已更新
✅ tests/BUG_TRACKER.md: Bug状态已更新
✅ flutter test: 通过
✅ progress.txt: 已更新
```

---

## 四、文件规范

### 4.1 progress.txt 格式

```
PROJECT: project-name
INITIALIZED: 2026-04-09T00:00:00Z
STATUS: in_progress
PHASE: feature_development

## 当前阶段
phase: feature_development

## Agent 进度
developer:
  current_feature: F002
  completed_features: [F001]
  status: developing

product:
  current_task: 竞品分析
  completed_tasks: [市场调研]
  status: working

tester:
  current_feature: F001
  completed_features: []
  status: testing

## Session 历史
[SESSION] 2026-04-09T10:30:00Z - Developer - 完成 F001 用户注册
[SESSION] 2026-04-09T11:00:00Z - Product - 完成竞品分析
[SESSION] 2026-04-09T11:30:00Z - Tester - 开始测试 F001
```

### 4.2 feature_list.json 格式

```json
{
  "version": "1.0",
  "project": "project-name",
  "summary": {
    "total": 10,
    "passed": 1,
    "failed": 0,
    "inProgress": 0,
    "notStarted": 9
  },
  "features": [
    {
      "id": "F001",
      "title": "用户注册",
      "category": "functional",
      "priority": "P0",
      "status": "tested",
      "testStatus": "passed",
      "createdAt": "2026-04-09T00:00:00Z",
      "updatedAt": "2026-04-09T10:30:00Z",
      "completedAt": "2026-04-09T10:30:00Z"
    }
  ]
}
```

---

## 五、Agent 间交接时的 Harness 检查

当一个 Agent 把任务交给另一个 Agent 时，handoff 必须包含：

```json
{
  "artifact_type": "handoff_code",
  "harness_status": {
    "progress_updated": true,
    "feature_list_updated": true,
    "last_commit": "abc1234",
    "clean_state": true,
    "environment_check": "flutter analyze: 0 errors"
  }
}
```

接收方 Agent 必须验证这些状态。

---

## 六、错误恢复

### 6.1 Session 开始时发现代码不可用

```
问题：flutter analyze 失败
解决：
1. 不立即开始新功能
2. 报告 CEO（handoff_feedback）
3. 说明阻塞原因
4. 等待修复指令
```

### 6.2 Session 结束时代码不可提交

```
问题：测试失败或有 lint 错误
解决：
1. 记录问题到 progress.txt
2. 标记受影响的 feature 为 failed
3. 报告 CEO
4. 下次 Session 从修复开始
```

---

## 七、示例流程

```
Day 1 - Session 1 (Product)
─────────────────────────────────
启动 → 读取 progress.txt → 无历史 → 开始市场调研
    → 完成调研 → 更新 progress.txt → commit → 结束

Day 1 - Session 2 (Product)
─────────────────────────────────
启动 → 读取 progress.txt → 发现调研完成
    → 开始竞品分析 → 完成 → 生成 PRD + feature_list.json
    → commit → 结束

Day 1 - Session 3 (Developer)
─────────────────────────────────
启动 → 读取 progress.txt → 发现 feature_list.json 已生成
    → 选择 F001（最高优先级）→ 开发 → 完成
    → 更新 feature_list.json（F001=implemented）
    → commit → 结束

Day 2 - Session 4 (Tester)
─────────────────────────────────
启动 → 读取 progress.txt → 发现 F001 已实现
    → 测试 F001 → 发现 1 个 P2 Bug
    → 更新 BUG_TRACKER.md → 更新 feature_list.json（F001=tested, bug=P2）
    → commit → 结束

Day 2 - Session 5 (Developer)
─────────────────────────────────
启动 → 读取 progress.txt → 发现 F001 有 Bug
    → 修复 Bug → 更新 feature_list.json（F001=fixed）
    → commit → 结束
```

---

## 八、汇报格式标准 ⭐ NEW

> 参考：OpenClaw 多 Agent 文章的汇报模板

### 8.1 任务完成汇报格式

所有 Agent 任务完成后，使用以下固定格式汇报：

```
✅ 任务完成

📋 [角色] 任务：
- [具体产出1]
- [具体产出2]

⏱️ 耗时：[X] 分钟
```

**示例**：
```
✅ 任务完成

📋 Product 需求分析：
- PRD 文档：已生成
- API 设计：已完成（3 个接口）

⏱️ 耗时：5 分钟
```

### 8.2 代码开发汇报格式

```
✅ 开发完成

📁 代码交付：
- 文件数：X 个
- 代码行数：XXX 行
- 测试用例：X 个

💻 质量检查：
- [flutter analyze / dart analyze]：0 errors
- [测试]：X passed, Y failed

⏱️ 耗时：XX 分钟
```

### 8.3 测试汇报格式

```
✅ 测试完成

🧪 测试结果：
- 用例数：X 个
- 通过：X 个
- 失败：X 个
- 通过率：XX%

🐛 Bug 清单：
- [BUG-001] [严重度] [描述]
- [BUG-002] [严重度] [描述]

⏱️ 耗时：XX 分钟
```

### 8.4 最终交付汇报格式

```
✅ 交付完成

📋 需求：
- PRD：已完成
- 功能数：X 个

💻 代码：
- 文件数：X 个
- 代码行数：XXX 行

🧪 测试：
- 用例数：X 个
- 通过率：XX%
- Bug：X 个（P0: X, P1: X, P2: X）

⏱️ 总耗时：XX 分钟
```

---

**最后更新**：2026-04-09
