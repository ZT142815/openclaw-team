# FAILURES.md - 失败案例记录

> **版本**: v1.0
> **日期**: 2026-04-10
> **目的**: 记录失败案例，供Steering Loop分析并持续改进harness

---

## 记录格式

```markdown
### 失败 #N
- **时间**: YYYY-MM-DD HH:MM
- **类别**: context-overflow | handoff-missing | eval-not-triggered | test-flaky | security-issue
- **原因**: 详细描述
- **影响**: 对系统的影响
- **改进**: 从这次失败中学到的改进点
```

---

## 失败案例

<!-- 新的失败案例添加到下面 -->

### 失败 #1
- **时间**: 2026-04-09
- **类别**: context-overflow
- **原因**: 长时间对话导致context超过80%阈值
- **影响**: 需要手动Reset Context，丢失部分上下文
- **改进**: 降低context阈值到40%，增加压缩频率

### 失败 #2
- **时间**: 2026-04-09
- **类别**: handoff-missing
- **原因**: Product Agent和Developer Agent交接时缺少关键信息
- **影响**: Developer理解偏差，需要返工
- **改进**: 强化handoff checklist，必填字段校验

### 失败 #3
- **时间**: 2026-04-09
- **类别**: context-overflow
- **原因**: 批量创建文档时context快速增长
- **影响**: 被迫中断操作
- **改进**: 增加context-compaction skill触发频率

### 失败 #4
- **时间**: 2026-04-10 12:35
- **类别**: cron_timeout
- **原因**: entropy-management cron使用isolated session，遭遇系统级120s超时限制
- **影响**: 连续3次cron执行超时，无法完成熵管理任务
- **改进**: 简化cron任务消息内容，减少执行时间；考虑使用session=current替代isolated

### 失败 #5
- **时间**: 2026-04-10 09:25
- **类别**: delivery_config
- **原因**: Feishu delivery配置错误：channel用webchat而非feishu，to格式带user:openId前缀
- **影响**: 14次连续错误，cron delivery持续失败
- **改进**: 确认openId来源为~/.openclaw/credentials/feishu-default-allowFrom.json，配置格式为channel=feishu, to=纯openId

---

## 模式分析 (Steering Loop生成)

| 失败模式 | 根因 | 预防措施 |
|---------|------|----------|
| vague_task_dispatch | 任务描述不精确 | 使用精确派发规范（阶段+交付物+验收标准） |
| test_assertion_contradicts_requirement | 测试与需求不一致 | 测试用例校验机制 |
| isolated_session_bootstrap_timeout | isolated session冷启动开销大 | 简化任务消息，使用session=current |
| delivery_config | Feishu channel/to格式错误 | 参考credentials文件确认正确格式 |

| 模式 | 次数 | 建议改进 |
|------|------|---------|
| context-overflow | 2 | 降低阈值，增加压缩 |
| handoff-missing | 1 | 强化handoff checklist |

---

**最后更新**: 2026-04-10

### 失败 #6
- **时间**: 2026-04-10 15:35
- **类别**: isolated_session_infrastructure
- **原因**: isolated session 启动时内部基础设施尝试连接Feishu API，token缺失导致400错误。即使delivery mode=none也无法避免。
- **影响**: entropy-management cron连续5次失败，错误累积
- **改进**: 改用sessionTarget=current替代isolated，绕过isolated session基础设施问题；或修复Feishu token
