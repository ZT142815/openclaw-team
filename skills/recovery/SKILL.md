# recovery Skill

> **作用**：Context Reset 和故障恢复机制
> **参考**：Anthropic "Context Resets" 策略 + Mitchell Hashimoto "工程化 Harness"
> **版本**：v1.0

---

## 一、核心概念

**Context Reset** = 当 Context 接近饱和时，不压缩而是重启一个干净的 Agent，从结构化交接文档恢复状态

**类比**：程序碰到内存泄漏 → 不是手动释放每个内存块，而是直接重启进程

```
传统做法（不够好）：
Context 80% → 压缩历史 → 继续 → 质量仍然下降

Context Reset（正确做法）：
Context 80% → 保存状态到文件 → 重启干净 Agent → 从文件恢复 → 继续
```

---

## 二、触发条件

### 2.1 必须触发 Reset

```
1. Context 使用率 > 80%
2. Agent 连续 3 次产出质量不合格
3. Agent 无法完成基本任务（超过 10 次尝试）
4. Session 运行超过 2 小时
```

### 2.2 建议触发 Reset

```
1. Context 使用率 > 60% 且任务复杂
2. Agent 频繁"忘记"初始目标
3. 输出开始出现重复内容
```

---

## 三、Reset 流程

### 3.1 第一阶段：状态保存

```
╔═══════════════════════════════════════════════════╗
║  PHASE 1: 状态保存                               ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║  1. 更新 progress.txt                            ║
║     - 当前进行到哪一步                            ║
║     - 完成了什么                                  ║
║     - 遇到了什么问题                              ║
║                                                   ║
║  2. 生成交接文档                                  ║
║     - 当前状态快照                                ║
║     - 待办事项                                    ║
║     - 已验证的方案                                ║
║     - 失败尝试记录                                ║
║                                                   ║
║  3. 保存到 memory/                               ║
║     - memory/YYYY-MM-DD-reset-[N].md            ║
║                                                   ║
║  4. Git commit（如有必要）                       ║
║     - 提交当前代码状态                            ║
║     - 标注 "WIP: reset checkpoint"              ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
```

### 3.2 第二阶段：Agent 重启

```
╔═══════════════════════════════════════════════════╗
║  PHASE 2: Agent 重启                             ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║  1. 结束当前 Agent Session                       ║
║                                                   ║
║  2. 启动新的干净 Agent Session                   ║
║     - 新的 Context Window                        ║
║     - 只加载交接文档                              ║
║                                                   ║
║  3. 新 Agent 执行 Session Start 协议             ║
║     - 读取 progress.txt                          ║
║     - 读取交接文档                                ║
║     - 验证代码状态                                ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
```

### 3.3 第三阶段：状态恢复

```
╔═══════════════════════════════════════════════════╗
║  PHASE 3: 状态恢复                               ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║  1. 新 Agent 读取交接文档                        ║
║     - 理解之前完成了什么                          ║
║     - 理解当前任务状态                            ║
║     - 理解待解决的问题                            ║
║                                                   ║
║  2. 验证代码完整性                               ║
║     - flutter analyze                            ║
║     - git status                                 ║
║     - 确保没有代码丢失                            ║
║                                                   ║
║  3. 继续执行                                     ║
║     - 从中断点继续                                ║
║     - 优先解决已知问题                            ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
```

---

## 四、交接文档模板

```markdown
# Context Reset Handoff
生成时间：{timestamp}
Reset 原因：{reason}

## 基本信息
- 项目：{project}
- Agent：{agent_name}
- Session ID：{session_id}

## 完成的工作
{completed_work}

## 进行中的工作
{ongoing_work}
- 任务：{task_description}
- 状态：{interruption_point}
- 下一步：{next_steps}

## 待解决问题
{open_issues}

## 失败尝试记录
{failed_attempts}
- 尝试1：{what_was_tried} → {why_it_failed}
- 尝试2：...

## 上下文状态
- Reset 前 Context 使用率：{context_percent}%
- Session 运行时间：{duration_minutes} 分钟
- Token 消耗：{token_count}

## 建议
{recommendations}
```

---

## 五、与 Context Monitor 的集成

```
Context Monitor 检测到 > 80%
         ↓
Recovery Skill 触发 Reset
         ↓
完整执行三个阶段
         ↓
新 Agent 继续工作
         ↓
记录到 TRAJECTORIES.md
```

---

## 六、故障恢复类型

### 6.1 Context 溢出恢复

```
触发：Context > 80%
流程：Reset → 状态保存 → 重启 → 恢复
```

### 6.2 任务失败恢复

```
触发：连续 3 次尝试失败
流程：
1. 记录失败原因
2. 咨询 CEO
3. 调整方案或降级目标
4. 重新执行
```

### 6.3 代码损坏恢复

```
触发：flutter analyze 失败且无法快速修复
流程：
1. git stash 或新 branch
2. 回滚到上一个稳定 commit
3. 重新实现
```

---

## 七、版本历史

- v1.0（2026-04-09）：初始版本
