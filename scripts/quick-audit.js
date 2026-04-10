#!/usr/bin/env node
/**
 * quick-audit.js
 * 快速审计工具 - 检查项目健康状态
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_DIR = process.argv[2] || '.';

const RESULTS = {
  passed: [],
  warnings: [],
  errors: [],
  info: []
};

function check(name, condition, message, severity = 'passed') {
  if (condition) {
    RESULTS.passed.push({ name, message });
    console.log(`  ✅ ${name}`);
  } else {
    if (severity === 'error') {
      RESULTS.errors.push({ name, message });
      console.log(`  ❌ ${name}: ${message}`);
    } else {
      RESULTS.warnings.push({ name, message });
      console.log(`  ⚠️  ${name}: ${message}`);
    }
  }
}

function runCommand(cmd) {
  try {
    return execSync(cmd, { cwd: PROJECT_DIR, encoding: 'utf-8', timeout: 30000 }).trim();
  } catch (e) {
    return null;
  }
}

function analyze() {
  console.log('\n🔍 项目健康检查\n');
  console.log(`📁 项目目录: ${PROJECT_DIR}`);
  console.log('');
  
  // 1. 检查pubspec.yaml
  console.log('【1】Flutter配置');
  const pubspecExists = fs.existsSync(path.join(PROJECT_DIR, 'pubspec.yaml'));
  check('pubspec.yaml存在', pubspecExists, 'Flutter配置文件');
  
  if (pubspecExists) {
    const pubspec = fs.readFileSync(path.join(PROJECT_DIR, 'pubspec.yaml'), 'utf-8');
    check('flutter版本声明', pubspec.includes('flutter:'), 'Flutter SDK配置');
    check('dependencies声明', pubspec.includes('dependencies:'), '依赖配置');
  }
  
  // 2. 检查.gitignore
  console.log('\n【2】Git配置');
  const gitignoreExists = fs.existsSync(path.join(PROJECT_DIR, '.gitignore'));
  check('.gitignore存在', gitignoreExists, 'Git忽略配置');
  
  if (gitignoreExists) {
    const gitignore = fs.readFileSync(path.join(PROJECT_DIR, '.gitignore'), 'utf-8');
    check('忽略build目录', gitignore.includes('build/'), 'build产物');
    check('忽略.dart_tool', gitignore.includes('.dart_tool/'), 'Dart工具缓存');
    check('忽略.idea', gitignore.includes('.idea/'), 'IDE配置');
  }
  
  // 3. 检查测试
  console.log('\n【3】测试配置');
  const testDir = path.join(PROJECT_DIR, 'test');
  const hasTestDir = fs.existsSync(testDir);
  check('测试目录存在', hasTestDir, '测试目录');
  
  if (hasTestDir) {
    const testFiles = execSync(`find "${testDir}" -name "*_test.dart" 2>/dev/null | wc -l`, { encoding: 'utf-8' });
    const testCount = parseInt(testFiles.trim());
    check('单元测试文件', testCount > 0, `找到${testCount}个测试文件`);
  }
  
  // 4. 检查CI/CD
  console.log('\n【4】CI/CD配置');
  const githubWorkflows = path.join(PROJECT_DIR, '.github/workflows');
  const hasCI = fs.existsSync(githubWorkflows);
  check('GitHub Actions配置', hasCI, 'CI/CD配置');
  
  // 5. 检查README
  console.log('\n【5】文档配置');
  const readmeExists = fs.existsSync(path.join(PROJECT_DIR, 'README.md'));
  check('README.md存在', readmeExists, '项目文档');
  
  // 6. 检查许可证
  console.log('\n【6】合规配置');
  const licenseExists = fs.existsSync(path.join(PROJECT_DIR, 'LICENSE'));
  check('LICENSE文件', licenseExists, '开源许可证');
  
  // 7. 检查代码规范
  console.log('\n【7】代码规范');
  const analysisOptions = path.join(PROJECT_DIR, 'analysis_options.yaml');
  const hasLint = fs.existsSync(analysisOptions);
  check('analysis_options.yaml', hasLint, '代码分析配置');
  
  // 8. 检查安全
  console.log('\n【8】安全配置');
  const secrets = ['API_KEY', 'SECRET_KEY', 'PASSWORD', 'TOKEN'];
  let hasHardcodedSecrets = false;
  
  if (pubspecExists) {
    const content = fs.readFileSync(path.join(PROJECT_DIR, 'pubspec.yaml'), 'utf-8');
    hasHardcodedSecrets = secrets.some(s => content.includes(s) && content.match(new RegExp(`${s}\\s*[=:]`, 'i')));
  }
  
  check('无硬编码密钥', !hasHardcodedSecrets, '敏感信息安全');
}

function printReport() {
  console.log('\n');
  console.log('═'.repeat(50));
  console.log('                 检查报告');
  console.log('═'.repeat(50));
  
  console.log(`\n📊 统计`);
  console.log(`   ✅ 通过: ${RESULTS.passed.length}`);
  console.log(`   ⚠️  警告: ${RESULTS.warnings.length}`);
  console.log(`   ❌ 错误: ${RESULTS.errors.length}`);
  
  if (RESULTS.errors.length > 0) {
    console.log(`\n🔴 需要修复`);
    RESULTS.errors.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.name}: ${e.message}`);
    });
  }
  
  if (RESULTS.warnings.length > 0) {
    console.log(`\n🟡 建议改进`);
    RESULTS.warnings.forEach((w, i) => {
      console.log(`   ${i + 1}. ${w.name}: ${w.message}`);
    });
  }
  
  if (RESULTS.errors.length === 0 && RESULTS.warnings.length === 0) {
    console.log(`\n🎉 项目健康状态良好！`);
  }
  
  console.log('\n' + '═'.repeat(50));
  
  return RESULTS.errors.length === 0;
}

function main() {
  console.log('\n🔬 Quick Audit - 项目健康检查工具 v1.0\n');
  
  analyze();
  const success = printReport();
  
  process.exit(success ? 0 : 1);
}

main();
