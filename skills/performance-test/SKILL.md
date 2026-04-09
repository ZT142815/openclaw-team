# performance-test Skill

> **作用**：性能测试，支持复杂 App 和重构项目的性能验证
> **版本**：v1.1
> **适用场景**：App Store 上架前、重构后、大型功能完成后

---

## 一、核心功能

基于 `scripts/performance-test.js` 实现：
1. **启动时间测试** → 冷启动时间估算
2. **内存使用测试** → 内存峰值估算
3. **渲染性能测试** → FPS 估算
4. **网络性能测试** → API 响应时间估算

---

## 二、性能基准标准

### Flutter App

| 指标 | 目标值 | 警告值 | 严重 |
|------|--------|--------|------|
| 冷启动时间 | < 2s | 2-4s | > 4s |
| 热启动时间 | < 500ms | 500ms-1s | > 1s |
| 内存峰值 | < 200MB | 200-300MB | > 300MB |
| FPS（滑动） | >= 60 | 45-60 | < 45 |
| API 响应 | < 200ms | 200-500ms | > 500ms |

### iOS App

| 指标 | 目标值 | 警告值 | 严重 |
|------|--------|--------|------|
| 包体积 | < 100MB | 100-200MB | > 200MB |
| 安装后体积 | < 200MB | 200-300MB | > 300MB |
| 电池消耗 | < 5%/小时 | 5-10%/小时 | > 10%/小时 |

---

## 三、使用方法

### 3.1 完整性能测试

```bash
cd ~/.openclaw/workspace-developer

# 完整测试（冷启动 + 内存 + FPS + API）
node scripts/performance-test.js --project /path/to/project
```

### 3.2 分类测试

```bash
# 仅测试冷启动
node scripts/performance-test.js --project /path/to/project --type cold-start

# 仅测试内存
node scripts/performance-test.js --project /path/to/project --type memory

# 仅测试 FPS
node scripts/performance-test.js --project /path/to/project --type fps

# 仅测试 API 响应
node scripts/performance-test.js --project /path/to/project --type api
```

### 3.3 帮助

```bash
node scripts/performance-test.js --help
```

---

## 四、输出报告格式

```json
{
  "test_date": "2026-04-09",
  "project": "/path/to/project",
  "results": [
    {
      "type": "cold_start",
      "value_ms": 1850,
      "threshold_ms": 2000,
      "warning_ms": 4000,
      "status": "pass"
    },
    {
      "type": "memory",
      "value_mb": 180,
      "threshold_mb": 200,
      "warning_mb": 300,
      "status": "pass"
    },
    {
      "type": "fps",
      "value": 58,
      "threshold": 60,
      "warning": 45,
      "status": "warn",
      "issues": ["可能触发不必要的 rebuild"]
    },
    {
      "type": "api_response",
      "value_ms": 150,
      "threshold_ms": 200,
      "warning_ms": 500,
      "status": "pass"
    }
  ],
  "summary": {
    "overall": "warn",
    "warnings": 1,
    "errors": 0
  }
}
```

### 状态说明

| 状态 | 含义 | 动作 |
|------|------|------|
| pass | 达标 | ✅ 继续 |
| warn | 警告 | ⚠️ 建议优化 |
| fail | 不达标 | ❌ 必须修复 |

---

## 五、性能优化清单

### 5.1 启动优化

- [ ] 减少首屏加载的 import
- [ ] 使用 `FutureBuilder` 延迟加载
- [ ] 图片资源预加载
- [ ] 代码分割（code splitting）

### 5.2 内存优化

- [ ] 使用 `const` 构造函数
- [ ] 及时释放资源（dispose）
- [ ] 图片缓存策略
- [ ] 避免内存泄漏（streams, controllers）

### 5.3 渲染优化

- [ ] 使用 `ListView.builder` 而非 `ListView`
- [ ] 合理使用 `RepaintBoundary`
- [ ] 避免在 `build()` 中执行耗时操作
- [ ] 使用 `const` Widget 减少重建

### 5.4 网络优化

- [ ] 请求合并
- [ ] 缓存策略（cache-control）
- [ ] 预取（prefetch）
- [ ] 压缩（gzip）

---

## 六、集成到 CI

```yaml
# .github/workflows/performance.yml
- name: Performance Test
  run: |
    node scripts/performance-test.js --project . --type full
```

---

## 七、版本历史

- v1.1（2026-04-09）：引用实际脚本 `scripts/performance-test.js`
- v1.0（2026-04-09）：初始版本
