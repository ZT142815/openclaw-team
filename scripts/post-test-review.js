#!/usr/bin/env node
/**
 * post-test-review.js
 * 测试后分析脚本 - 自动化问题分析、记录、解决
 * 
 * 流程：
 * 1. 读取测试结果
 * 2. 分析问题
 * 3. 记录到 FAILURES.md
 * 4. 尝试自动修复
 * 5. 生成改进报告
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const projectPath = args[0] || process.cwd();
const projectName = path.basename(projectPath);

console.log(`
========================================
   测试后分析报告 - ${projectName}
========================================
`);

// 1. 读取测试结果
const testReportPath = path.join(projectPath, 'TEST_REPORT.md');
const specPath = path.join(projectPath, 'SPEC.md');
const prdPath = path.join(projectPath, 'PRD.md');

let testResults = null;
let specContent = null;
let prdContent = null;

if (fs.existsSync(testReportPath)) {
  testResults = fs.readFileSync(testReportPath, 'utf-8');
}

if (fs.existsSync(specPath)) {
  specContent = fs.readFileSync(specPath, 'utf-8');
}

if (fs.existsSync(prdPath)) {
  prdContent = fs.readFileSync(prdPath, 'utf-8');
}

// 2. 分析问题
const issues = [];
const successes = [];

// 分析测试报告
if (testResults) {
  // 检查失败的测试
  if (testResults.includes('❌') || testResults.includes('FAIL')) {
    issues.push({
      type: 'test_failure',
      severity: 'high',
      description: '存在失败的测试用例',
      recommendation: '修复失败的测试用例'
    });
  }
  
  // 检查警告
  if (testResults.includes('warning') || testResults.includes('Warning')) {
    issues.push({
      type: 'warning',
      severity: 'medium',
      description: '存在编译警告',
      recommendation: '清理警告信息'
    });
  }
}

// 检查代码问题
const mainDartPath = path.join(projectPath, 'lib/main.dart');
if (fs.existsSync(mainDartPath)) {
  const code = fs.readFileSync(mainDartPath, 'utf-8');
  
  // 检查是否有 TODO
  if (code.includes('TODO')) {
    issues.push({
      type: 'code_quality',
      severity: 'low',
      description: '代码中存在 TODO',
      recommendation: '完成 TODO 或创建 Issue'
    });
  }
  
  // 检查是否有 FIXME
  if (code.includes('FIXME')) {
    issues.push({
      type: 'code_quality',
      severity: 'high',
      description: '代码中存在 FIXME',
      recommendation: '立即修复已知问题'
    });
  }
  
  // 检查是否有 hardcoded
  if (code.includes('hardcoded') || code.includes('hard-coded')) {
    issues.push({
      type: 'code_quality',
      severity: 'medium',
      description: '可能存在硬编码',
      recommendation: '提取到配置常量'
    });
  }
}

// 3. 检查流程完整性
console.log('【流程完整性检查】');

const requiredFiles = [
  { path: 'SPEC.md', name: '技术规格' },
  { path: 'PRD.md', name: '产品需求' },
  { path: 'TEST_REPORT.md', name: '测试报告' }
];

let flowComplete = true;
requiredFiles.forEach(({ path: p, name }) => {
  const exists = fs.existsSync(path.join(projectPath, p));
  console.log(`  ${exists ? '✅' : '❌'} ${name}`);
  if (!exists) {
    flowComplete = false;
    issues.push({
      type: 'process',
      severity: 'high',
      description: `缺少 ${name}`,
      recommendation: `确保 ${name} 已生成`
    });
  }
});

// 4. 输出分析结果
console.log(`
【问题分析】
`);

if (issues.length === 0) {
  console.log('  🎉 没有发现问题！');
  successes.push('所有检查通过');
} else {
  issues.forEach((issue, i) => {
    console.log(`  ${i + 1}. [${issue.severity.toUpperCase()}] ${issue.type}`);
    console.log(`     问题: ${issue.description}`);
    console.log(`     建议: ${issue.recommendation}`);
    console.log();
  });
}

// 5. 生成改进建议
console.log(`
【改进建议】
`);

if (flowComplete) {
  console.log('  ✅ 流程完整');
} else {
  console.log('  ⚠️ 流程有缺失，需要完善');
}

// 6. 记录到 FAILURES.md
const failuresPath = path.join(process.env.HOME, '.openclaw/workspace-developer/FAILURES.md');
const timestamp = new Date().toISOString();

if (issues.length > 0) {
  const failureEntry = `
## ${projectName} - ${timestamp}

### 发现的问题

${issues.map((issue, i) => `
#### 问题 ${i + 1}: ${issue.type}

| 属性 | 值 |
|------|-----|
| 严重性 | ${issue.severity} |
| 类型 | ${issue.type} |
| 描述 | ${issue.description} |
| 建议 | ${issue.recommendation} |

`).join('')}

### 状态
- [ ] 待处理
- [ ] 已解决
- [ ] 已记录

`;
  
  if (fs.existsSync(failuresPath)) {
    const current = fs.readFileSync(failuresPath, 'utf-8');
    fs.writeFileSync(failuresPath, current + failureEntry);
  } else {
    fs.writeFileSync(failuresPath, `# FAILURES.md

${failureEntry}
`);
  }
  
  console.log(`  📝 已记录到 FAILURES.md`);
}

// 7. 生成总结
console.log(`
========================================
   分析完成
========================================

问题数量: ${issues.length}
流程完整: ${flowComplete ? '是' : '否'}
记录状态: ${issues.length > 0 ? '已记录' : '无问题'}

`);
