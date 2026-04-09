# security-scan Skill

> **作用**：安全扫描，检测敏感信息、隐私合规、网络安全漏洞
> **版本**：v1.1
> **适用场景**：所有项目必备（开发/迭代/重构）

---

## 一、核心功能

基于 `scripts/security-scan.js` 实现：
1. **敏感信息检测** → API Key、密码、Token 硬编码
2. **隐私合规检查** → 权限申请、敏感数据收集
3. **网络安全检测** → 不安全 HTTP 请求
4. **Supabase 安全** → RLS 策略、API 权限

---

## 二、安全检查标准

### Flutter App 安全要求

| 检查项 | 要求 | 严重度 |
|--------|------|--------|
| API Key 硬编码 | 禁止，敏感信息放 .env | 🔴 P0 |
| 密码/Token 硬编码 | 禁止，必须从安全存储获取 | 🔴 P0 |
| 权限申请 | 只申请必要的权限 | 🟡 P2 |
| 网络安全 | 必须 HTTPS，禁止 http:// | 🔴 P0 |
| 输入验证 | 所有用户输入必须验证 | 🟡 P2 |
| 日志输出 | release 版本禁止敏感信息日志 | 🟡 P2 |

### iOS App 额外检查

| 检查项 | 要求 | 严重度 |
|--------|------|--------|
| Keychain 使用 | 敏感信息存 Keychain，不存 UserDefaults | 🔴 P0 |
| 权限说明 | Info.plist 必须有用途说明 | 🟡 P2 |
| ATS 配置 | 必须启用 App Transport Security | 🟡 P2 |

### Supabase 安全检查

| 检查项 | 要求 | 严重度 |
|--------|------|--------|
| RLS 策略 | 所有表必须有 RLS 策略 | 🔴 P0 |
| API 权限 | Service Key 禁止暴露 | 🔴 P0 |
| 匿名访问 | 匿名访问必须有限制 | 🟡 P2 |

---

## 三、使用方法

### 3.1 完整安全扫描

```bash
cd ~/.openclaw/workspace-developer

# 运行完整安全扫描
node scripts/security-scan.js --project /path/to/project --format json
```

### 3.2 分类扫描

```bash
# 仅检测硬编码敏感信息
node scripts/security-scan.js --project /path/to/project --category=secrets

# 仅检测网络安全
node scripts/security-scan.js --project /path/to/project --category=network

# 仅检测 Supabase 安全
node scripts/security-scan.js --project /path/to/project --category=supabase
```

### 3.3 快速检查（pre-commit）

```bash
# 快速扫描（仅检测 P0 严重问题）
node scripts/security-scan.js --project /path/to/project --quick --severity=P0
```

---

## 四、输出报告格式

```json
{
  "scan_date": "2026-04-09",
  "project": "my_app",
  "summary": {
    "total_issues": 5,
    "critical": 1,
    "high": 2,
    "medium": 1,
    "low": 1
  },
  "issues": [
    {
      "id": "SEC-001",
      "severity": "critical",
      "category": "hardcoded_secret",
      "file": "lib/config.dart",
      "line": 15,
      "description": "API Key 硬编码在代码中",
      "content": "static const apiKey = 'sk_live_xxx'",
      "fix": "移动到 .env 文件，使用 dotenv 加载"
    },
    {
      "id": "SEC-002",
      "severity": "critical",
      "category": "insecure_network",
      "file": "lib/api/client.dart",
      "line": 23,
      "description": "使用不安全的 HTTP 连接",
      "content": "http://api.example.com",
      "fix": "改为 HTTPS：https://api.example.com"
    }
  ],
  "compliance": {
    "ios_ats": "pass",
    "rls_policy": "fail",
    "sensitive_storage": "pass"
  },
  "recommendations": [
    "立即修复 2 个 critical 问题",
    "启用 Supabase RLS 策略",
    "添加安全扫描到 CI"
  ]
}
```

---

## 五、安全扫描清单

### 5.1 新 App 开发必检

```bash
node scripts/security-scan.js --project . --category=all
```

检查项：
- [ ] API Key/Token 不硬编码
- [ ] 网络请求全 HTTPS
- [ ] 用户输入有验证
- [ ] 敏感信息存 Keychain/安全存储
- [ ] 权限申请有说明
- [ ] Supabase RLS 启用

### 5.2 老项目迭代必检

```bash
# 增量扫描（仅新增/修改文件）
node scripts/security-scan.js --project . --diff
```

### 5.3 老项目重构必检

```bash
# 重构后全面扫描
node scripts/security-scan.js --project . --strict
```

---

## 六、集成到 CI

```yaml
# .github/workflows/security.yml
- name: Security Scan
  run: |
    node scripts/security-scan.js --project . --format json --exit-code
```

---

## 七、紧急漏洞响应

发现 🔴 P0 紧急漏洞时：

```
立即修复，不等待
    ↓
1. CEO 收到漏洞警报
2. 立即派发 Developer 修复
3. 不经过常规测试流程
4. 修复后直接上线
5. 事后补充安全扫描到 CI
```

---

## 八、版本历史

- v1.1（2026-04-09）：引用实际脚本 `scripts/security-scan.js`
- v1.0（2026-04-09）：初始版本
