# ONCALL.md - On-Call 值班表与流程

> **版本**: v1.0
> **日期**: 2026-04-11
> **目的**: 定义值班安排、告警升级和应急响应流程

---

## 一、当前团队配置

### 1.1 团队成员

| 角色 | 名称 | 职责 |
|------|------|------|
| Primary On-Call | 周涛 (CEO) | 全权负责，产品决策 + 技术 |
| Secondary On-Call | 周小墨 (Agent) | 技术支持，自动化运维 |

### 1.2 值班周期

由于是 OPC (一人公司)，采用简化值班模式：

| 时段 | 负责人 | 响应SLO |
|------|--------|---------|
| 工作时间 (09:00-21:00) | 周涛 (CEO) | 15min 内响应 |
| 夜间 (21:00-09:00) | 周小墨 (Agent) | 30min 内响应 |

---

## 二、告警通道优先级

### 2.1 告警通知顺序

```
S0 (严重):
  1. 飞书群推送 → @所有人
  2. 电话通知 (如配置)

S1 (高):
  1. 飞书群推送 → @oncall
  2. 飞书私信 → oncall

S2 (中):
  1. 飞书群推送 → #alerts
  2. 等待工作时间内响应

S3 (低):
  1. JIRA/Issue 记录
  2. 下一个工作日处理
```

### 2.2 告警配置

| 告警类型 | 渠道 | 接收人 |
|---------|------|--------|
| Cron 任务失败 | Feishu | oncall |
| Context 超过 80% | 系统通知 | oncall |
| CI/CD 失败 | GitHub Actions | oncall |
| App Crash Rate > 1% | Firebase | oncall |
| 安全扫描发现漏洞 | GitHub | oncall |

---

## 三、On-Call 职责

### 3.1 值班前准备

```
☐ 检查 cron health 状态
node ~/.openclaw/workspace-developer/scripts/cron-health-monitor.js

☐ 检查最近事件和 open issues
cat ~/.openclaw/workspace-developer/bugtracker/issues/*.json

☐ 确认回滚方案可用
  - 最近的 stable build 是什么
  - 如何触发回滚

☐ 确认联系方式
  - 飞书通知正常
  - GitHub 通知正常
```

### 3.2 值班中职责

```
☐ 每 4 小时检查一次 cron health
☐ 确保手机能收到飞书通知
☐ 告警响应时间符合 SLO
☐ 记录所有事件到 incident log
```

### 3.3 值班后交接

```
☐ 发送值班报告到 #team
☐ 交接 open issues 和 pending actions
☐ 更新 ONCALL.md 如有变更
```

---

## 四、升级流程

### 4.1 升级触发条件

| 条件 | 行动 |
|------|------|
| 30min 内无法定位问题 | 升级到 Secondary |
| 问题需要外部资源 | 升级到 Secondary |
| 数据泄露或安全问题 | 立即升级 + 通知 |
| 涉及多人协作 | 升级到团队 |

### 4.2 升级路径

```
发现者 (自动告警)
    │
    ├─ 自动化处理?
    │   ├─ YES: auto-recovery 执行
    │   └─ NO: 值班人响应
    │
    └─ 值班人评估
        │
        ├─自己能解决? → YES: 修复 → 记录
        │
        └─ NO:
            ├─ 咨询 Agent Team (周小墨)
            ├─ 查阅 RUNBOOK.md / INCIDENT_RESPONSE.md
            └─ 联系外部资源 (Flutter 社区, Firebase 支持)
```

---

## 五、快速参考卡片

### 5.1 常用命令

```bash
# Cron 健康检查
node ~/.openclaw/workspace-developer/scripts/cron-health-monitor.js

# Auto Recovery (dry-run)
node ~/.openclaw/workspace-developer/scripts/cron-auto-recovery.js --dry-run

# Entropy Check
node ~/.openclaw/workspace-developer/scripts/entropy-check.js

# 依赖漏洞检查
node ~/.openclaw/workspace-developer/scripts/dependency-vuln-check.js --project /path/to/project

# 查看最近日志
tail -100 /tmp/openclaw/openclaw-$(date +%Y-%m-%d).log

# Gateway 状态
openclaw gateway status

# Cron 列表
openclaw cron list
```

### 5.2 关键文档

| 文档 | 路径 | 用于 |
|------|------|------|
| RUNBOOK.md | workspace-developer/docs/ | 故障诊断 |
| INCIDENT_RESPONSE.md | workspace-developer/docs/ | 事件响应 |
| SLO.md | workspace-developer/docs/ | 可靠性目标 |
| FAILURES.md | workspace-developer/ | 失败案例 |
| CAPABILITY_LOOP.md | workspace/ | 能力改进追踪 |

### 5.3 关键联系人

| 联系人 | 角色 | 用于 |
|--------|------|------|
| 周涛 | CEO / Primary On-Call | S0/S1 升级 |
| 周小墨 | Agent / Secondary | 技术支持 |

---

## 六、值班记录

### 2026-04-11 (当前)

| 日期 | 值班人 | 事件数 | 备注 |
|------|--------|--------|------|
| 2026-04-11 | 周涛 (CEO) | 0 | 初始配置 |

---

## 七、维护

| 项目 | 说明 |
|------|------|
| 审查频率 | 每月审查一次 |
| 重大变更 | 更新版本号 |
| 批准人 | CEO (周小墨) |

---

**最后更新**: 2026-04-11
**下次审查**: 2026-05-11
**维护人**: CEO (周小墨)
