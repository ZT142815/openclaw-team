# OUTPUT-STANDARD.md - 项目输出规范

> **版本**: v1.0
> **作用**: 定义所有项目的标准输出目录和文件规范
> **强制级别**: 必须遵循

---

## 一、项目目录结构

```
projects/[项目名]/
├── SPEC.md                    # 项目规范（CEO 创建）
├── PRD.md                     # 产品需求文档（Product 输出）
├── DESIGN.md                  # 技术设计文档（Developer 输出）
├── TEST_REPORT.md             # 测试报告（Tester 输出）
├── README.md                  # 项目说明
│
├── src/                       # 源代码（Developer 输出）
│   ├── main.dart
│   ├── providers/
│   ├── screens/
│   ├── widgets/
│   └── models/
│
├── test/                      # 测试代码
│   ├── unit/
│   ├── widget/
│   └── integration/
│
├── config/                    # 配置文件
│   ├── analysis_options.yaml
│   └── pubspec.yaml
│
├── build/                     # 构建产物（自动生成）
│
├── docs/                      # 文档
│
└── logs/                     # 日志
    └── [日期].log
```

---

## 二、每个 Agent 的输出规范

### CEO Agent

| 文件 | 必须包含 | 验证 |
|------|---------|------|
| SPEC.md | 项目概述、目标、技术栈 | 必须存在 |

### Product Agent

| 文件 | 必须包含 | 验证 |
|------|---------|------|
| PRD.md | 用户故事、功能列表、验收标准 | 必须存在且非空 |
| PRD.md | P0/P1/P2 分级清晰 | 格式校验 |
| PRD.md | 验收标准可测试 | 内容校验 |

### Developer Agent

| 文件 | 必须包含 | 验证 |
|------|---------|------|
| DESIGN.md | 架构设计、模块划分、API设计 | 必须存在 |
| src/ | 源代码文件 | 必须存在 |
| src/main.dart | 主入口 | 必须存在 |
| test/ | 测试文件 | 必须存在 |

### Tester Agent

| 文件 | 必须包含 | 验证 |
|------|---------|------|
| TEST_REPORT.md | 测试结果、Bug列表 | 必须存在 |
| TEST_REPORT.md | AC-xxx 全部通过 | 结果校验 |

---

## 三、验证门禁（Quality Gates）

### Gate 1: Product 输出校验

```
Product 输出 PRD.md
    ↓
验证：
├── 文件存在？ ✅/❌
├── 非空（>100行）？ ✅/❌
├── 包含 user_stories？ ✅/❌
├── 包含 acceptance_criteria？ ✅/❌
├── P0 功能 >= 1？ ✅/❌
    ↓
通过 → Developer
失败 → 打回 Product
```

### Gate 2: Developer 输出校验

```
Developer 输出代码
    ↓
验证：
├── 代码存在？ ✅/❌
├── flutter analyze 0 errors？ ✅/❌
├── flutter test 通过？ ✅/❌
├── 所有 P0 功能代码存在？ ✅/❌
├── DESIGN.md 存在？ ✅/❌
    ↓
通过 → Tester
失败 → 打回 Developer
```

### Gate 3: Tester 输出校验

```
Tester 输出 TEST_REPORT.md
    ↓
验证：
├── 文件存在？ ✅/❌
├── 所有 AC-xxx 通过？ ✅/❌
├── 无 P0 Bug？ ✅/❌
├── App 能启动？ ✅/❌ ← 新增
├── UI 能显示？ ✅/❌ ← 新增
    ↓
通过 → CEO 交付
失败 → 打回 Developer
```

---

## 四、启动验证流程（新增）

### 4.1 iOS 启动验证

```bash
# 1. 检查模拟器
xcrun simctl list devices available | grep iPhone

# 2. 启动模拟器
xcrun simctl boot "iPhone 14 Pro"
open -a Simulator

# 3. 安装 App
cd projects/[项目名]
flutter build ios --simulator
flutter run -d "iPhone 14 Pro"

# 4. 截图验证
# - 截图 App 启动画面
# - 截图主界面

# 5. 功能验证
# - 点击 +1，验证计数 +1
# - 点击 -1，验证计数 -1
# - 点击 Reset，验证计数归零
```

### 4.2 Android 启动验证

```bash
# 1. 检查设备
flutter devices

# 2. 构建 APK
flutter build apk --debug

# 3. 安装并运行
flutter run -d [设备ID]

# 4. 验证同上
```

---

## 五、输出校验脚本

### check-output.js

```javascript
/**
 * 项目输出校验脚本
 * 用法: node check-output.js --project /path/to/project --gate 1|2|3
 */

const fs = require('fs');
const path = require('path');

function checkGate1(projectPath) {
  const prd = path.join(projectPath, 'PRD.md');
  if (!fs.existsSync(prd)) {
    return { pass: false, error: 'PRD.md 不存在' };
  }
  const content = fs.readFileSync(prd, 'utf-8');
  if (content.length < 100) {
    return { pass: false, error: 'PRD.md 内容过少' };
  }
  if (!content.includes('user_stories')) {
    return { pass: false, error: 'PRD.md 缺少 user_stories' };
  }
  if (!content.includes('acceptance_criteria')) {
    return { pass: false, error: 'PRD.md 缺少 acceptance_criteria' };
  }
  return { pass: true };
}

function checkGate2(projectPath) {
  const srcDir = path.join(projectPath, 'src');
  const main = path.join(projectPath, 'src/main.dart');
  const design = path.join(projectPath, 'DESIGN.md');
  
  if (!fs.existsSync(main)) {
    return { pass: false, error: 'src/main.dart 不存在' };
  }
  if (!fs.existsSync(design)) {
    return { pass: false, error: 'DESIGN.md 不存在' };
  }
  return { pass: true };
}

function checkGate3(projectPath) {
  const report = path.join(projectPath, 'TEST_REPORT.md');
  if (!fs.existsSync(report)) {
    return { pass: false, error: 'TEST_REPORT.md 不存在' };
  }
  const content = fs.readFileSync(report, 'utf-8');
  // 检查所有 AC 通过
  const acMatches = content.match(/AC-\d+/g) || [];
  const failedMatches = content.match(/AC-\d+.*failed/gi) || [];
  
  if (failedMatches.length > 0) {
    return { pass: false, error: `存在失败的用例: ${failedMatches.join(', ')}` };
  }
  return { pass: true, acCount: acMatches.length };
}

module.exports = { checkGate1, checkGate2, checkGate3 };
```

---

## 六、违规处理

| 违规类型 | 处理 |
|---------|------|
| 输出目录不规范 | 打回重做 |
| Gate 1 失败 | 打回 Product |
| Gate 2 失败 | 打回 Developer |
| Gate 3 失败 | 打回 Developer 修复 |

---

**最后更新**: 2026-04-09
