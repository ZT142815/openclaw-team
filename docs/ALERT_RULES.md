# ALERT_RULES.md - 告警规则配置

> **版本**: v1.0
> **日期**: 2026-04-11
> **用途**: 定义何时触发告警以及如何响应

---

## 一、告警分级

| 级别 | 名称 | 描述 | 响应时间 | 通知方式 |
|------|------|------|---------|---------|
| **P0** | 紧急 | 系统完全不可用 | 立即 | 飞书+电话 |
| **P1** | 严重 | 核心功能受损 | 15分钟内 | 飞书+短信 |
| **P2** | 中等 | 非核心功能异常 | 1小时内 | 飞书 |
| **P3** | 轻微 | 轻微问题 | 4小时内 | 邮件 |

---

## 二、Cron 任务告警规则

### 2.1 auto-capability-improve

| 条件 | 级别 | 说明 |
|------|------|------|
| `consecutiveErrors >= 1` | P3 | 连续错误，立即检查 |
| `consecutiveErrors >= 3` | P1 | 连续3次失败，核心自动化中断 |
| `deliveryStatus !== "delivered"` 持续 2 次 | P2 | 推送失败，可能 Feishu 问题 |
| `lastDuration > 600000` (10分钟) | P3 | 运行时间异常长 |

### 2.2 entropy-management

| 条件 | 级别 | 说明 |
|------|------|------|
| `consecutiveErrors >= 1` | P2 | 熵管理失败 |
| `consecutiveErrors >= 3` | P1 | 连续失败需立即处理 |
| `deliveryStatus !== "delivered"` 持续 3 次 | P2 | Feishu delivery 问题 |

### 2.3 Memory Dreaming Promotion

| 条件 | 级别 | 说明 |
|------|------|------|
| `consecutiveErrors >= 1` | P2 | 记忆系统异常 |
| `lastDuration > 300000` (5分钟) | P3 | 运行时间过长 |

---

## 三、安全告警规则

### 3.1 漏洞扫描

| 条件 | 级别 | 说明 |
|------|------|------|
| `vulnerabilities.critical.length > 0` | P0 | 严重漏洞需立即修复 |
| `vulnerabilities.high.length > 0` | P1 | 高危漏洞 24 小时内修复 |
| `vulnerabilities.medium.length > 3` | P2 | 中危漏洞需关注 |

### 3.2 依赖扫描频率

| 触发条件 | 说明 |
|---------|------|
| 每周一 09:00 | 定期依赖漏洞扫描 |
| `package-lock.json` 或 `pubspec.lock` 变更后 | 新增依赖时自动扫描 |
| GitHub Security Advisory 发布严重公告 | 紧急扫描 |

---

## 四、GitHub 告警规则

### 4.1 CI/CD 失败

| 条件 | 级别 | 说明 |
|------|------|------|
| `workflow_run.conclusion === "failure"` | P2 | CI 失败需检查 |
| `workflow_run.conclusion === "failure"` 持续 2 次 | P1 | 持续失败影响部署 |
| `workflow_run.conclusion === "cancelled"` | P3 | 手动取消可忽略 |

### 4.2 PR 和 Issue

| 条件 | 级别 | 说明 |
|------|------|------|
| 新 Issue 标签为 `bug` | P2 | Bug 需确认 |
| 新 Issue 标签为 `critical` | P0 | 紧急问题 |
| PR 静默超过 3 天 | P3 | 代码审查延迟 |

---

## 五、内存和存储告警

| 条件 | 级别 | 说明 |
|------|------|------|
| memory/ 目录超过 100MB | P3 | 内存文件过大需清理 |
| memory/ 单个文件超过 7 天未清理 | P3 | 熵积累 |
| patterns.json 超过 20 个 patterns | P2 | patterns 需整理 |
| 日志文件总大小超过 500MB | P2 | 日志需轮转 |

---

## 六、Feishu 告警规则

### 6.1 Delivery 失败

| 条件 | 级别 | 说明 |
|------|------|------|
| `deliveryStatus === "failed"` | P2 | 推送失败 |
| Feishu API 400 错误 | P1 | Token 或权限问题 |
| Feishu API 429 限流 | P2 | 发送频率超限 |

### 6.2 Bot Token 问题

| 错误码 | 说明 | 级别 |
|--------|------|------|
| 99991661 | Missing access token | P0 |
| 99991672 | Access to app not allowed | P0 |

---

## 七、告警响应流程

```
检测到告警
    ↓
判断级别 P0/P1/P2/P3
    ↓
P0: 立即通知 → 电话 + 飞书 → 开始处理
P1: 15分钟内响应 → 飞书 + 短信 → 开始处理
P2: 1小时内响应 → 飞书 → 计划处理
P3: 4小时内响应 → 邮件 → 日常处理
    ↓
处理完成后更新 Bugtracker
    ↓
复盘（仅 P0/P1）
```

---

## 八、自动告警配置

### 8.1 Cron Health Monitor (自动检测)

```javascript
// cron-health-monitor.js 检测到问题时自动记录
if (job.consecutiveErrors >= 3) {
  console.log(`🚨 ALERT P1: ${job.name} 连续3次失败`);
}
```

### 8.2 Alert Thresholds

| 组件 | 阈值 | 告警级别 |
|------|------|---------|
| Cron consecutiveErrors | >= 3 | P1 |
| Vulnerability critical | > 0 | P0 |
| Vulnerability high | > 0 | P1 |
| Feishu 400 error | 任意 | P1 |
| Memory size | > 100MB | P3 |

---

## 九、升级路径

```
Level 1: 自动告警 (cron-health-monitor.js)
    ↓
Level 2: CEO Agent 收到飞书推送
    ↓
Level 3: CEO Agent 尝试自动恢复 (cron-auto-recovery.js)
    ↓
Level 4: 人工干预 - 值班人 (ONCALL.md)
    ↓
Level 5: 人工干预 - 周涛 (用户)
```

---

**最后更新**: 2026-04-11 03:32
