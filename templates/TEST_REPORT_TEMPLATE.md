# 测试报告 - {PROJECT_NAME}

> **版本**: v1.0
> **日期**: {DATE}
> **测试人**: Tester Agent
> **项目路径**: {PROJECT_PATH}

---

## 1. 测试概要

| 属性 | 值 |
|------|-----|
| 项目名称 | {PROJECT_NAME} |
| 技术栈 | {TECH_STACK} |
| 测试类型 | {TEST_TYPE} |
| 测试时间 | {TEST_TIME} |
| 测试结果 | {PASS/FAIL} |

### 测试结果汇总

| 指标 | 结果 |
|------|------|
| 测试用例总数 | {TOTAL_CASES} |
| 通过 | {PASSED} |
| 失败 | {FAILED} |
| 通过率 | {PASS_RATE}% |

---

## 2. 验证清单

### 2.1 代码质量

| 检查项 | 命令 | 结果 |
|--------|------|------|
| 静态分析 | `flutter analyze` | {PASS/FAIL} |
| 单元测试 | `flutter test` | {PASS/FAIL} |
| 类型检查 | `dart analyze` | {PASS/FAIL} |

### 2.2 构建验证

| 检查项 | 命令 | 结果 |
|--------|------|------|
| Debug 构建 | `flutter build {PLATFORM}` | {PASS/FAIL} |
| Release 构建 | `flutter build {PLATFORM} --release` | {PASS/FAIL} |
| APK/Bundle | 产物存在 | {PASS/FAIL} |

### 2.3 功能验证

| 功能点 | 预期行为 | 实际结果 | 状态 |
|--------|---------|---------|------|
| {FEATURE_1} | {EXPECTED} | {ACTUAL} | {PASS/FAIL} |
| {FEATURE_2} | {EXPECTED} | {ACTUAL} | {PASS/FAIL} |
| {FEATURE_3} | {EXPECTED} | {ACTUAL} | {PASS/FAIL} |

### 2.4 平台特定验证

| 检查项 | iOS | Android | Web |
|--------|-----|---------|-----|
| 构建成功 | {Y/N} | {Y/N} | {Y/N} |
| 运行成功 | {Y/N} | {Y/N} | {Y/N} |
| 模拟器/真机 | {Y/N} | {Y/N} | - |

---

## 3. 问题记录

### 3.1 严重问题 (P0)

| # | 问题描述 | 发现时间 | 状态 | 修复方案 |
|---|---------|---------|------|---------|
| 1 | | | | |
| 2 | | | | |

### 3.2 中等问题 (P1)

| # | 问题描述 | 发现时间 | 状态 | 修复方案 |
|---|---------|---------|------|---------|
| 1 | | | | |
| 2 | | | | |

### 3.3 轻微问题 (P2)

| # | 问题描述 | 发现时间 | 状态 | 修复方案 |
|---|---------|---------|------|---------|
| 1 | | | | |
| 2 | | | | |

---

## 4. 根因分析

### 问题 1: {PROBLEM_TITLE}

**问题描述**: 
{Description}

**根因分析**: 
```
{Root Cause}
```

**解决方案**: 
1. {SOLUTION_1}
2. {SOLUTION_2}

**预防措施**: 
- {PREVENTION_1}
- {PREVENTION_2}

---

## 5. 测试截图

### 5.1 运行截图
![Run Screenshot](screenshot_run.png)

### 5.2 功能截图
![Feature Screenshot](screenshot_feature.png)

---

## 6. 改进建议

### 6.1 流程改进
- [ ] {IMPROVEMENT_1}
- [ ] {IMPROVEMENT_2}

### 6.2 技术改进
- [ ] {TECH_IMPROVEMENT_1}
- [ ] {TECH_IMPROVEMENT_2}

### 6.3 文档改进
- [ ] {DOC_IMPROVEMENT_1}
- [ ] {DOC_IMPROVEMENT_2}

---

## 7. 结论

### 7.1 测试结论
{CONCLUSION}

### 7.2 是否上线
| 环境 | 结论 | 签字 |
|------|------|------|
| 开发环境 | 可用/不可用 | |
| 测试环境 | 可用/不可用 | |
| 生产环境 | 可上线/不可上线 | |

### 7.3 后续行动
| 行动 | 负责人 | 完成日期 |
|------|--------|---------|
| | | |

---

**签名**: Tester Agent (周小测)  
**日期**: {DATE}
