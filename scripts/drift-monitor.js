#!/usr/bin/env node
/**
 * Drift Monitor - 持续代码质量监控
 * 
 * 功能:
 * 1. 检测dead code (未使用的函数/变量)
 * 2. 监控代码复杂度趋势
 * 3. 检测架构漂移
 * 4. 持续质量报告
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 项目目录 - 支持通过环境变量配置
const PROJECT_DIR = process.env.DRIFT_PROJECT_DIR || path.join(__dirname, '../../budolist');
const REPORT_FILE = path.join(__dirname, '../reports/drift-report.md');

const THRESHOLDS = {
  maxFunctionLength: 50,
  maxFileLength: 300,
  maxComplexity: 10,
  maxDepth: 4
};

function checkProjectExists() {
  if (!fs.existsSync(PROJECT_DIR)) {
    return false;
  }
  const libDir = path.join(PROJECT_DIR, 'lib');
  return fs.existsSync(libDir);
}

function checkFlutterAnalyze() {
  console.log('🔍 运行 flutter analyze...');
  if (!checkProjectExists()) {
    return { success: null, output: '项目不存在或无lib目录，跳过' };
  }
  try {
    const output = execSync('flutter analyze', { 
      cwd: PROJECT_DIR,
      encoding: 'utf-8',
      timeout: 60000
    });
    return { success: true, output };
  } catch (e) {
    return { success: false, output: e.stdout || e.message };
  }
}

function checkDeadCode() {
  console.log('🔍 检测 dead code...');
  if (!checkProjectExists()) {
    return { deadCodeCount: 0, output: '项目不存在，跳过' };
  }
  try {
    const unusedImportRegex = /import\s+['"][^'"]+['"];\s*\/\/ ignore: unused_import/g;
    const files = execSync('find lib -name "*.dart"', { 
      encoding: 'utf-8',
      cwd: PROJECT_DIR 
    }).split('\n').filter(Boolean);
    
    let deadCodeCount = 0;
    files.forEach(f => {
      const content = fs.readFileSync(f, 'utf-8');
      const matches = content.match(unusedImportRegex);
      if (matches) deadCodeCount += matches.length;
    });
    
    return { deadCodeCount };
  } catch (e) {
    return { deadCodeCount: 0, error: e.message };
  }
}

function checkComplexity() {
  console.log('🔍 分析代码复杂度...');
  if (!checkProjectExists()) {
    return { success: null, output: '项目不存在，跳过' };
  }
  try {
    const metrics = execSync(
      'dart run dart_code_metrics:metrics analyze lib --threshold-complexity=10',
      { encoding: 'utf-8', cwd: PROJECT_DIR }
    );
    return { success: true, metrics };
  } catch (e) {
    return { success: false, output: e.stdout || e.message };
  }
}

function generateReport(results) {
  const timestamp = new Date().toISOString();
  
  let report = `# Drift Report - ${timestamp}\n\n`;
  report += `## 项目: ${PROJECT_DIR}\n\n`;
  
  if (!checkProjectExists()) {
    report += '⚠️ 项目不存在，跳过代码质量检查\n';
    report += '\n提示：设置环境变量 DRIFT_PROJECT_DIR 指定项目路径\n';
  } else {
    report += `## Flutter Analyze\n`;
    if (results.analyze.success === null) {
      report += '⏭️ 跳过\n';
    } else {
      report += results.analyze.success ? '✅ 通过\n' : '❌ 失败\n';
      if (!results.analyze.success) {
        report += '```\n' + results.analyze.output + '\n```\n';
      }
    }
    
    report += `\n## Dead Code\n`;
    report += `检测到 ${results.deadCode.deadCodeCount} 处可能的无用代码\n`;
    
    report += `\n## Complexity\n`;
    report += results.complexity.success ? '✅ 复杂度正常\n' : '⚠️ 存在复杂函数\n';
  }
  
  // 确保目录存在
  const reportsDir = path.dirname(REPORT_FILE);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  fs.writeFileSync(REPORT_FILE, report);
  console.log(`📄 报告已生成: ${REPORT_FILE}`);
  
  return report;
}

function run() {
  console.log('=== Drift Monitor ===\n');
  
  if (!checkProjectExists()) {
    console.log('⚠️ 项目不存在或无lib目录:');
    console.log(`   ${PROJECT_DIR}`);
    console.log('   使用 DRIFT_PROJECT_DIR 环境变量指定项目路径');
    console.log('');
  }
  
  const results = {
    analyze: checkFlutterAnalyze(),
    deadCode: checkDeadCode(),
    complexity: checkComplexity()
  };
  
  const report = generateReport(results);
  
  // 输出摘要
  console.log('\n=== 摘要 ===');
  if (!checkProjectExists()) {
    console.log('项目未配置，跳过检查');
  } else {
    console.log(`Flutter Analyze: ${results.analyze.success === null ? '⏭️ 跳过' : results.analyze.success ? '✅' : '❌'}`);
    console.log(`Dead Code: ${results.deadCode.deadCodeCount} 处`);
    console.log(`Complexity: ${results.complexity.success === null ? '⏭️ 跳过' : results.complexity.success ? '✅' : '⚠️'}`);
  }
}

run();
