# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- CODEOWNERS - 自动分配 PR 审查任务
- CONTRIBUTING.md - 贡献指南

---

## [2026-04-11] - 运营体系完善日

### Added
- `docs/INCIDENT_RESPONSE.md` - 事件响应手册（S0-S3分级、升级路径、复盘模板）
- `docs/ONCALL.md` - On-Call 值班表
- `docs/SLO.md` - 服务等级目标文档
- `scripts/dependency-vuln-check.js` - 依赖漏洞扫描器
- `scripts/release-notes-generator.js` - 发布说明生成器
- Bugtracker 系统完善（dashboard.js, README.md, TEMPLATE.md）

### Fixed
- Git Repo 大清理：workspace-developer 不再包含 CEO workspace 文件
- Memory Symlinks 修复：today/yesterday.md 日期更新

---

## [2026-04-10] - Cron 稳定性修复日

### Added
- `scripts/cron-health-monitor.js` - Cron 健康监控
- `scripts/cron-auto-recovery.js` - Cron 自动恢复
- `scripts/feishu-token-fixer.js` - Feishu Token 诊断工具
- `scripts/entropy-check.js` - 轻量熵检查脚本
- `docs/RUNBOOK.md` - 运维手册

### Fixed
- auto-capability-improve cron: delivery.channel 修正 (webchat → feishu)
- entropy-management cron: delivery 配置多次修复，最终使用 sessionTarget=current + mode=none
- Memory Symlinks 过期问题

### Changed
- entropy-management 从 isolated agentTurn 改为 current agentTurn
- drift-monitor.js 支持环境变量配置，无项目时优雅退出

---

## [2026-04-09] - 多 Agent 架构日

### Added
- 多 Agent 团队架构（CEO + Product + Developer + Tester）
- Agent 工作区隔离（独立 workspace）
- SESSION-PROTOCOL.md 交接协议
- Fitness Functions 架构标准
- Pre-commit hooks
- 自定义 lint 规则
- 安全扫描 CI
- Flutter CI/CD

### Changed
- 从单 Agent 架构迁移到多 Agent 团队架构

---

## [2026-04-01] - 项目初始化

### Added
- openclaw-team 仓库初始化
- 基础 CI/CD 配置
- 初始 Agent 配置

---

[Unreleased]: https://github.com/ZT142815/openclaw-team/compare
