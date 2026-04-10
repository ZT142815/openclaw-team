# SLO.md - Service Level Objectives

> **版本**: v1.0
> **日期**: 2026-04-11
> **目的**: 定义服务等级目标，用于监控、告警和可靠性承诺

---

## 一、SLO 概述

### 什么是 SLO?

SLO (Service Level Objective) 是我们对用户承诺的服务可靠性目标。
它定义了系统应该达到的可用性水平，是 Error Budget 策略的基础。

### 为什么重要?

1. **量化可靠性** - 将"系统很稳定"变成"99.5% 可用"
2. **Error Budget** - 超出 SLO 消耗 Error Budget，影响发布节奏
3. **告警阈值** - SLO 燃尽到一定程度触发告警
4. **用户信任** - 向用户展示我们的可靠性承诺

---

## 二、产品 SLOs

### 2.1 Budolist App (说不)

| 服务 | SLO | 测量窗口 | 错误预算/月 |
|------|-----|---------|------------|
| **App 可用性** | 99.5% | 滚动 30 天 | 3.6 小时 |
| **核心功能 (添加/删除待办)** | 99.9% | 滚动 30 天 | 43 分钟 |
| **App 启动时间 P99** | < 3 秒 | 滚动 7 天 | - |
| **API 响应时间 P99** | < 500ms | 滚动 7 天 | - |
| **Crash Rate** | < 0.5% | 滚动 7 天 | - |

### 2.2 Agent Team Platform (OpenClaw)

| 服务 | SLO | 测量窗口 | 错误预算/月 |
|------|-----|---------|------------|
| **Cron 任务成功率** | 99.0% | 滚动 7 天 | 5 小时 |
| **Agent 响应时间** | < 60 秒 | 滚动 7 天 | - |
| **Context 保持率** | 99.5% | 滚动 7 天 | - |
| **Memory 持久化成功率** | 99.9% | 滚动 30 天 | 43 分钟 |

---

## 三、Error Budget

### 3.1 什么是 Error Budget?

Error Budget = 1 - SLO

它是允许发生的错误量。一旦 Error Budget 耗尽，暂停新功能发布，聚焦可靠性。

### 3.2 Error Budget 策略

| Error Budget 状态 | 行动 |
|------------------|------|
| > 50% 剩余 | 正常发布新功能 |
| 25-50% 剩余 | 减少发布，优先处理可靠性问题 |
| 10-25% 剩余 | 暂停非紧急功能发布，聚焦可靠性 |
| < 10% 剩余 | 暂停所有新功能发布，直到恢复 |
| = 0% | 启动 S0 事件，公开声明 |

### 3.3 Error Budget 计算

```
月 Error Budget 计算示例:

App 可用性 SLO = 99.5%
每月分钟数 = 30 天 × 24 小时 × 60 分钟 = 43,200 分钟
Error Budget = 43,200 × (1 - 0.995) = 216 分钟 = 3.6 小时

即: 每月最多允许 3.6 小时 downtime
```

---

## 四、监控指标

### 4.1 核心指标 (Golden Signals)

| 指标 | 定义 | SLO 阈值 | 告警阈值 |
|------|------|---------|---------|
| **Latency** | P99 响应时间 | < 500ms | > 800ms |
| **Traffic** | QPS/DAU | 基线 ± 20% | ± 50% |
| **Errors** | 5xx 错误率 | < 0.1% | > 1% |
| **Saturation** | CPU/内存使用 | < 80% | > 90% |

### 4.2 App 关键指标

| 指标 | 目标 | 严重阈值 |
|------|------|---------|
| DAU | 基线待定 | < 基线 -30% |
| 打开率 | 基线待定 | < 基线 -20% |
| 核心操作完成率 | > 95% | < 90% |
| 负面评价率 | < 2% | > 5% |

### 4.3 Agent Team 指标

| 指标 | 目标 | 严重阈值 |
|------|------|---------|
| Cron 成功率 | > 99% | < 95% |
| 平均任务完成时间 | < 5 分钟 | > 10 分钟 |
| Context 压缩频率 | < 3 次/天 | > 10 次/天 |
| Memory 命中率 | > 80% | < 60% |

---

## 五、Alerting 规则

### 5.1 告警级别

| 级别 | 名称 | 响应时间 | 通知方式 |
|------|------|---------|---------|
| **P1** | 严重 | 15 min | 飞书 + 电话 |
| **P2** | 高 | 30 min | 飞书 |
| **P3** | 中 | 2 h | 飞书 |
| **P4** | 低 | 24 h | 邮件 |

### 5.2 告警规则

```yaml
# Prometheus alerting rules (示例)
groups:
  - name: app_alerts
    rules:
      - alert: AppDown
        expr: up{job="budolist"} == 0
        for: 1m
        labels:
          severity: P1
        annotations:
          summary: "App is down"
          description: "App has been down for more than 1 minute"

      - alert: HighErrorRate
        expr: error_rate > 0.01
        for: 5m
        labels:
          severity: P2
        annotations:
          summary: "High error rate"
          description: "Error rate is {{ $value }}%"

      - alert: ErrorBudgetExhausted
        expr: error_budget_remaining < 0.1
        for: 0m
        labels:
          severity: P1
        annotations:
          summary: "Error budget exhausted"
          description: "Less than 10% error budget remaining"
```

---

## 六、SLO 报告

### 6.1 每周 SLO 报告

```markdown
# SLO 报告 - 2026-W15

## App 可用性
- SLO: 99.5%
- 实际: 99.8% ✅
- Error Budget: 57% 剩余

## 核心功能可用性
- SLO: 99.9%
- 实际: 99.95% ✅
- Error Budget: 72% 剩余

## Crash Rate
- SLO: < 0.5%
- 实际: 0.12% ✅

## Cron 任务成功率
- SLO: 99.0%
- 实际: 98.5% ⚠️
- Error Budget: 43% 剩余

## Action Items
1. 调查 Cron 失败原因 (entropy-management delivery)
2. 优化 auto-capability-improve 执行时间
```

### 6.2 月度 SLO 回顾

```markdown
# 月度 SLO 回顾 - 2026年4月

## 整体健康度
| SLO | 目标 | 实际 | 状态 |
|-----|------|------|------|
| App 可用性 | 99.5% | XX% | ✅/⚠️/❌ |
| 核心功能 | 99.9% | XX% | ✅/⚠️/❌ |
| Crash Rate | < 0.5% | XX% | ✅/⚠️/❌ |
| Cron 成功率 | 99.0% | XX% | ✅/⚠️/❌ |

## Error Budget 消耗
- App 可用性: XX% 消耗 (安全/警告/危险)
- Cron 任务: XX% 消耗 (安全/警告/危险)

## 发布节奏决策
基于 Error Budget 状态:
- [ ] 正常发布
- [ ] 减少发布
- [ ] 暂停发布

## 改进项
1.
2.
```

---

## 七、SLO 配置检查

### 7.1 快速检查命令

```bash
# 检查 App Crash 率
echo "检查 Crashlytics Dashboard: Firebase Console"

# 检查 Cron 成功率
node ~/.openclaw/workspace-developer/scripts/cron-health-monitor.js

# 检查 Error Budget
cat ~/.openclaw/workspace-developer/monitoring/cron-health.json | jq '.[] | select(.id=="auto-capability-improve")'

# 检查 Feishu Token 状态
node ~/.openclaw/workspace-developer/scripts/feishu-token-fixer.js --check
```

### 7.2 SLO 仪表板

监控以下仪表板 (按优先级):

1. **Firebase Crashlytics** - Crash Rate, Trends
2. **GitHub Actions** - CI/CD Pipeline Status
3. **OpenClaw Logs** - Agent Execution Health
4. **Cron Health** - Task Success Rate

---

## 八、当前状态 (2026-04-11)

| SLO | 目标 | 当前 | 状态 |
|-----|------|------|------|
| App 可用性 | 99.5% | N/A (无项目) | ⏸️ 待项目启动 |
| Cron 成功率 | 99.0% | 98.5% | ⚠️ 需改进 |
| Crash Rate | < 0.5% | N/A | ⏸️ 待项目启动 |
| Agent 响应时间 | < 60s | ~40s | ✅ |

### 改进目标

| 指标 | 当前 | 目标 | 截止 |
|------|------|------|------|
| Cron 成功率 | 98.5% | > 99% | 2026-04-18 |
| Error Budget 剩余 | ~50% | > 70% | 2026-04-18 |

---

## 九、维护

| 项目 | 说明 |
|------|------|
| 审查频率 | 每月审查一次 |
| 更新条件 | 产品重大变更后 |
| 批准人 | CEO (周小墨) |
| 版本历史 | 见文件头部 |

---

**最后更新**: 2026-04-11
**下次审查**: 2026-05-11
**维护人**: CEO (周小墨)
