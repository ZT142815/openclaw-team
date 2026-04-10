#!/usr/bin/env node
/**
 * Pre-commit Feedforward Check
 * 
 * 在git commit前自动运行计算规则检查
 * 确保只有符合标准的代码才能提交
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BUDOLIST_DIR = process.env.BUDOLIST_DIR || 
  path.join(__dirname, '../../budolist');

const ESCAPE = '\x1b[0m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';

function log(msg, color = ESCAPE) {
  console.log(`${color}${msg}${ESCAPE}`);
}

function runCommand(cmd, cwd = BUDOLIST_DIR) {
  try {
    execSync(cmd, { cwd, encoding: 'utf-8', stdio: 'pipe', timeout: 120000 });
    return { success: true };
  } catch (e) {
    return { success: false, output: e.stdout || e.message };
  }
}

function checkFlutterAnalyze() {
  log('🔍 运行 flutter analyze...', YELLOW);
  const result = runCommand('flutter analyze');
  if (result.success) {
    log('✅ flutter analyze 通过', GREEN);
  } else {
    log('❌ flutter analyze 失败:', RED);
    console.log(result.output);
  }
  return result.success;
}

function checkFormat() {
  log('🔍 检查代码格式...', YELLOW);
  const result = runCommand('dart format --set-exit-if-changed lib');
  if (result.success) {
    log('✅ 格式检查通过', GREEN);
  } else {
    log('❌ 格式问题，请先运行 dart format lib', RED);
  }
  return result.success;
}

function checkTests() {
  log('🔍 运行测试...', YELLOW);
  const result = runCommand('flutter test --pass');
  if (result.success) {
    log('✅ 测试通过', GREEN);
  } else {
    log('❌ 测试失败:', RED);
    console.log(result.output);
  }
  return result.success;
}

function checkSecurity() {
  log('🔍 安全扫描...', YELLOW);
  const result = runCommand('node scripts/security-scan.js');
  if (result.success) {
    log('✅ 安全扫描通过', GREEN);
  } else {
    log('⚠️ 安全扫描有问题', YELLOW);
  }
  return result.success;
}

function main() {
  log('=== Pre-commit Feedforward Check ===\n', YELLOW);
  
  const checks = [
    { name: 'Flutter Analyze', fn: checkFlutterAnalyze },
    { name: 'Format Check', fn: checkFormat },
    { name: 'Security Scan', fn: checkSecurity },
    { name: 'Tests', fn: checkTests },
  ];
  
  let allPassed = true;
  
  checks.forEach(({ name, fn }) => {
    if (!fn()) {
      allPassed = false;
    }
    console.log('');
  });
  
  if (allPassed) {
    log('=== ✅ 所有检查通过，可以提交 ===', GREEN);
    process.exit(0);
  } else {
    log('=== ❌ 检查失败，请修复后重试 ===', RED);
    process.exit(1);
  }
}

main();
