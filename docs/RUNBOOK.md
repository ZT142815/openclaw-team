# Operations Runbook

> **版本**: v1.0
> **日期**: 2026-04-10
> **目的**: 记录常见故障的诊断和修复步骤

---

## 快速诊断

```bash
# 1. Cron 健康检查
node /Users/zhoutao/.openclaw/workspace-developer/scripts/cron-health-monitor.js

# 2. Gateway 状态
openclaw gateway status

# 3. 最近日志
tail -100 /tmp/openclaw/openclaw-$(date +%Y-%m-%d).log
```

---

## 故障 1: Cron 任务连续失败

### 症状
```
consecutiveErrors: N (N >= 3)
lastRunStatus: error
lastError: "cron: job execution timed out" 或 "Delivering to Feishu requires target"
```

### 诊断流程

```
Step 1: 获取 cron 状态
  openclaw cron list --json

Step 2: 检查错误类型
  - 如果 lastError 包含 "timeout" → 见 1a
  - 如果 lastError 包含 "Delivering" → 见 1b
  - 如果 lastError 包含 "400" 或 "Feishu" → 见 1c

Step 3: 查看详细日志
  openclaw cron runs <job-id>
```

### 1a: Timeout 错误 (isolated session)

**根因**: isolated session 有 ~120s 系统级超时限制，60s 用户 timeout 不够

**修复**:
```bash
# 方案A: 改用 main session + systemEvent
openclaw cron update <job-id> \
  --session-target main \
  --payload-kind systemEvent \
  --payload-text "__openclaw_entropy_check__"

# 方案B: 增加 timeout (如果任务本身不复杂)
openclaw cron update <job-id> --timeout 300
```

### 1b: Feishu Delivery 配置错误

**根因**: delivery.channel 或 delivery.to 格式错误

**正确配置**:
```json
{
  "delivery": {
    "mode": "announce",
    "channel": "feishu",
    "to": "ou_774e4d57cac1746e60706c887b2d7cc7"
  }
}
```

**常见错误**:
| 字段 | ❌ 错误 | ✅ 正确 |
|------|--------|--------|
| channel | `webchat` | `feishu` |
| to | `user:openId:ou_xxx` | `ou_xxx` (纯openId) |
| to | 空 | 必须是有效 openId |

**openId 获取**:
```bash
cat ~/.openclaw/credentials/feishu-default-allowFrom.json
```

### 1c: Feishu API 400 错误

**症状**:
```
error: AxiosError: Request failed with status code 400
url: https://open.feishu.cn/open-apis/bot/v3/info
error_code: 99991672
```

**根因**: Bot token 过期或权限不足

**影响**: 仅影响 cron delivery 推送，不阻断任务执行

**诊断**:
```bash
# 测试 Feishu API
curl -H "Authorization: Bearer <token>" \
  https://open.feishu.cn/open-apis/bot/v3/info
```

**注意**: 这是非阻断性问题，cron delivery 可能失败但任务本身正常执行

---

## 故障 2: Context 超过 80%

### 症状
- 回复变慢
- 出现 "context reset" 提示
- 丢失部分对话历史

### 修复流程

```
Step 1: 检查 context 使用率
  /status

Step 2: 如果 > 60%，执行压缩
  调用 context-compaction skill

Step 3: 如果 > 80%，Reset Context
  /reset-context
```

### 预防措施

- 对话轮次 >= 20 时自动触发 compaction
- 定期归档 memory/*.md 文件

---

## 故障 3: CI Workflow 失败

### 症状
```
Flutter Analyze: Expected to find project root in current working directory
Flutter Test: No tests ran
```

### 根因
仓库无 Flutter 项目代码（仅有 CI 配置）

### 修复
需要实际 Flutter 项目后 CI 才能正常运行。这是**非阻断性**问题。

---

## 故障 4: Handoff 验证失败

### 症状
```
ValidationError: missing required field 'project_name'
```

### 根因
Handoff Artifact 缺少必填字段

### 修复
使用 handoff-validator skill 校验:
```bash
node /Users/zhoutao/.openclaw/workspace-developer/scripts/handoff-validator.js <artifact-file>
```

---

## 故障 5: Subagent 无响应

### 症状
- sessions_spawn 后无结果返回
- 子任务卡住

### 修复流程

```
Step 1: 检查 subagent 列表
  openclaw subagents list

Step 2: Kill 无响应的 subagent
  openclaw subagents kill <subagent-id>

Step 3: 重试任务
```

---

## 监控工具

### Health Monitor
```bash
node /Users/zhoutao/.openclaw/workspace-developer/scripts/cron-health-monitor.js
```

### Auto Recovery (dry-run)
```bash
node /Users/zhoutao/.openclaw/workspace-developer/scripts/cron-auto-recovery.js --dry-run
```

### Auto Recovery (confirm)
```bash
node /Users/zhoutao/.openclaw/workspace-developer/scripts/cron-auto-recovery.js --confirm
```

---

## 关键文件路径

| 文件 | 路径 |
|------|------|
| Gateway 日志 | `/tmp/openclaw/openclaw-YYYY-MM-DD.log` |
| Cron 健康报告 | `~/.openclaw/workspace-developer/monitoring/cron-health.json` |
| Feishu 凭证 | `~/.openclaw/credentials/feishu-default-allowFrom.json` |
| 失败案例 | `~/.openclaw/workspace-developer/FAILURES.md` |
| 轨迹模式 | `~/.openclaw/trajectories/patterns/patterns.json` |
| Capability 追踪 | `~/.openclaw/workspace/CAPABILITY_LOOP.md` |

---

**最后更新**: 2026-04-10 13:32
