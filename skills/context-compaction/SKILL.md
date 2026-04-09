# context-compaction Skill

> **作用**：自动压缩长对话上下文，保持性能
> **触发**：context 使用超过 70% 或对话超过 20 轮
> **版本**：v1.0

---

## 一、压缩触发条件

```markdown
触发 Compaction 当满足任一条件：

1. 对话轮次 >= 20 轮
2. Context 使用率 >= 70%
3. Token 消耗 >= 50000
```

---

## 二、压缩策略

### 第一层：历史消息压缩

```
原始对话历史：
├── [用户] 第1轮消息
├── [AI] 第1轮回复
├── [用户] 第2轮消息
├── [AI] 第2轮回复
... (20轮以上)
└── [用户] 第N轮消息

压缩后：
├── [摘要] 前10轮关键信息
├── [保留] 第11-N轮完整内容
└── [元数据] 压缩时间、原因
```

### 第二层：Artifacts 保留

```markdown
始终保留（不压缩）：
├── handoff_demand（需求 artifact）
├── handoff_prd（PRD artifact）
├── handoff_tech_design（技术设计 artifact）
├── handoff_code（代码 artifact）
└── handoff_test_report（测试报告 artifact）

这些是结构化数据，必须完整保留
```

### 第三层：决策和结论保留

```markdown
保留：
├── 重要决策（用户确认的）
├── 关键结论（分析结果）
├── 任务状态（当前进行到哪）
└── 待办事项（未完成的）

可丢弃：
├── 闲聊内容
├── 重复确认
└── 调试信息
```

---

## 三、压缩执行流程

```markdown
## Compaction 流程

1. 检测触发条件
   ├── 检查对话轮次
   ├── 检查 context 使用率
   └── 检查 token 消耗

2. 生成摘要
   ├── 读取对话历史
   ├── 提取关键信息
   ├── 生成压缩摘要
   └── 保留核心 artifacts

3. 执行压缩
   ├── 写入压缩摘要到 memory/
   ├── 记录压缩元数据
   └── 清理历史消息

4. 输出报告
   "📦 Context 压缩完成
   - 原始轮次：25 轮
   - 压缩后：15 轮（保留11-25）
   - 保留 artifacts：5 个
   - Token 节省：约 40%"
```

---

## 四、压缩摘要格式

```markdown
# Context Compression Summary

## 元数据
- 压缩时间：2026-04-08 17:47
- 原始轮次：25
- 保留轮次：11-25
- 保留 artifacts：5

## 关键信息（10轮以前）

### 用户需求
[用户原始需求的摘要]

### 重要决策
- [决策1]
- [决策2]

### 当前状态
- 阶段：[PRD/开发/测试/交付]
- 进行到：[具体内容]

## 保留的 Artifacts
1. handoff_prd - PRD v1.0
2. handoff_tech_design - 技术设计 v1.0

## 待办事项
- [ ] [待办1]
- [ ] [待办2]
```

---

## 五、与 SOUL.md 的集成

在 SOUL.md 的"启动流程"中添加：

```markdown
### 第六步：检查是否需要 Compaction

```
if 对话轮次 >= 20 or context使用率 >= 70%:
    执行 context-compaction skill
    输出压缩报告
```

---

## 六、技术实现

### 触发检测

```python
def should_compact(session_info):
    """判断是否需要压缩"""
   轮次 = session_info.get("turn_count", 0)
    context_rate = session_info.get("context_usage_rate", 0)
    tokens = session_info.get("tokens_used", 0)
    
    return (轮次 >= 20 or 
            context_rate >= 0.7 or 
            tokens >= 50000)
```

### 摘要生成

```python
def generate_summary(conversation_history):
    """生成压缩摘要"""
    # 提取关键信息
    需求 = extract_user_demands(conversation_history)
    决策 = extract_decisions(conversation_history)
    状态 = extract_current_state(conversation_history)
    artifacts = extract_artifacts(conversation_history)
    
    return {
        "key_info": {"demands": 需求, "decisions": 决策},
        "current_state": 状态,
        "artifacts": artifacts,
        "truncated_turns": f"1-{len(conversation_history)-10}"
    }
```

---

## 七、注意事项

```
1. 不压缩 artifacts（JSON 结构化数据）
2. 保留用户原始需求
3. 记录所有重要决策
4. 明确当前进行到哪一步
5. 压缩后立即通知用户
```

---

## 八、版本历史

- v1.0（2026-04-08）：初始版本
