# context-monitor Skill

> **作用**：监控 Context 使用率，在 40% 阈值时告警，防止 Agent 质量下降
> **触发**：Context 使用率 >= 40%
> **版本**：v1.0
> **参考**：Anthropic "上下文焦虑"研究 - Dex Horthy Smart Zone / Dumb Zone

---

## 一、核心发现

| Context 区间 | Agent 表现 |
|--------------|-----------|
| 0% - 40% | ✅ Smart Zone：推理聚焦、工具调用准确、代码质量高 |
| > 40% | ❌ Dumb Zone：幻觉增多、兜圈子、格式混乱、低质量代码 |

**工程意义**：监控 40% 阈值，提前干预，而非等到 Agent 已经变蠢

---

## 二、监控触发条件

```markdown
触发 Context 告警 当满足：

1. Context 使用率 >= 40%（tokens_used / context_window >= 0.4）
2. 单次 Session 运行时间 >= 30 分钟
3. 连续错误回复 >= 3 次
```

---

## 三、告警级别

### Level 1 - 黄色警告（40% - 60%）

```
⚠️ [CONTEXT WARNING] Context 使用率接近阈值

当前使用率：45%
建议动作：
- 检查是否有可能压缩历史对话
- 考虑触发 Context Compaction
- 避免启动新的长任务
```

### Level 2 - 橙色警告（60% - 80%）

```
🔶 [CONTEXT ALERT] Context 使用率过高

当前使用率：65%
建议动作：
- 立即执行 Context Compaction
- 准备 Context Reset（重启干净 Agent）
- 暂停非关键任务
```

### Level 3 - 红色告警（> 80%）

```
🔴 [CONTEXT CRITICAL] Context 即将溢出

当前使用率：85%
必须动作：
- 执行 Context Reset（立即）
- 保存当前状态到 progress.txt
- 启动新 Agent 接手任务
```

---

## 四、Context Reset 流程

当 Context 使用率 > 80% 或 Agent 质量明显下降时：

```
╔═══════════════════════════════════════════════════╗
║  CONTEXT RESET - 必须执行                        ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║  1. 保存当前状态                                 ║
║     ├── 更新 progress.txt                        ║
║     ├── 更新 feature_list.json                   ║
║     └── 写入当前 Session 摘要到 memory/          ║
║                                                   ║
║  2. 生成交接文档                                 ║
║     ├── 当前完成的工作                           ║
║     ├── 进行中的工作及状态                       ║
║     ├── 待解决的问题                             ║
║     └── 下一步建议                               ║
║                                                   ║
║  3. 结束当前 Agent Session                      ║
║                                                   ║
║  4. 启动新的干净 Agent Session                   ║
║     ├── 新 Agent 读取交接文档                    ║
║     ├── 恢复上下文                               ║
║     └── 继续执行                                 ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
```

---

## 五、交接文档格式

```markdown
# Context Reset Handoff

## 基本信息
- 重置时间：[ISO 时间]
- 重置原因：[Context 溢出 / 质量下降 / 其他]
- 重置前 Agent：[Agent ID]

## 完成的工作
- [已完成功能列表]

## 进行中的工作
- [功能 ID] - [描述] - [中断时的状态]

## 待解决问题
1. [问题1]
2. [问题2]

## 建议的下一步
1. [建议1]
2. [建议2]

## Context 使用记录
- 重置前使用率：[X%]
- Session 运行时间：[X 分钟]
- Token 消耗：[X]
```

---

## 六、与 SOUL.md 的集成

在 SOUL.md 的"启动流程"中添加：

```markdown
### 第七步：检查 Context 使用率

每次回复用户前检查：
if context_usage_rate >= 0.4:
    if context_usage_rate >= 0.6:
        执行 Context Compaction
    if context_usage_rate >= 0.8:
        触发 Context Reset
        通知用户

提示：Context 使用率超过 40% 后，Agent 质量开始下降
```

---

## 七、技术实现

### Token 计算

```javascript
// Context 使用率估算
const context_usage_rate = tokens_used / context_window_size

// context_window_size = 模型 context window（如 200K）
// tokens_used = 当前 session 已消耗的 token 总数
```

### 监控频率

```
- 每次工具调用后检查
- 每次 Agent 响应后检查
- Heartbeat 时检查
```

---

## 八、最佳实践

1. **预防为主**：不要等到 80% 才 reset，40% 开始告警
2. **渐进式压缩**：40-60% 先尝试 compaction
3. **完整交接**：reset 前必须生成交接文档
4. **保留轨迹**：交接文档存入 memory/ 供后续分析

---

## 九、版本历史

- v1.0（2026-04-09）：初始版本，集成 Anthropic 上下文焦虑研究
