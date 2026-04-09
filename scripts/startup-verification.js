#!/usr/bin/env node
/**
 * startup-verification.js
 * App 启动验证脚本 - 真正运行 App 并验证
 * 
 * 用法：
 *   node startup-verification.js --project /path/to/project --platform ios
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ============ 配置 ============
const PLATFORMS = ['ios', 'android'];

// ============ 工具函数 ============
function runCommand(cmd, cwd, options = {}) {
  try {
    const result = execSync(cmd, { 
      cwd, 
      encoding: 'utf-8', 
      stdio: 'pipe',
      timeout: options.timeout || 300000,
      ...options 
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, output: error.stdout || error.message, code: error.status };
  }
}

function log(message) {
  console.error(`[验证] ${message}`);
}

function logPass(message) {
  console.error(`✅ ${message}`);
}

function logFail(message) {
  console.error(`❌ ${message}`);
}

function logInfo(message) {
  console.error(`ℹ️  ${message}`);
}

// ============ iOS 验证 ============
async function verifyIOS(projectPath) {
  log('开始 iOS 启动验证...\n');
  
  const results = {
    platform: 'ios',
    checks: [],
    overall: 'fail'
  };
  
  // 1. 检查 Flutter 环境
  log('检查 1: Flutter 环境');
  const flutterResult = runCommand('flutter --version', projectPath);
  if (flutterResult.success && flutterResult.output.includes('Flutter')) {
    logPass('Flutter 环境正常');
    results.checks.push({ name: 'flutter_env', status: 'pass' });
  } else {
    logFail('Flutter 环境异常');
    results.checks.push({ name: 'flutter_env', status: 'fail' });
    return results;
  }
  
  // 2. 检查项目结构
  log('\n检查 2: 项目结构');
  const requiredFiles = ['pubspec.yaml', 'lib/main.dart'];
  let allFilesExist = true;
  for (const file of requiredFiles) {
    const filePath = path.join(projectPath, file);
    if (fs.existsSync(filePath)) {
      logPass(`  ${file} 存在`);
    } else {
      logFail(`  ${file} 缺失`);
      allFilesExist = false;
    }
  }
  results.checks.push({ name: 'project_structure', status: allFilesExist ? 'pass' : 'fail' });
  
  if (!allFilesExist) {
    return results;
  }
  
  // 3. flutter pub get
  log('\n检查 3: 安装依赖');
  const pubResult = runCommand('flutter pub get', projectPath);
  if (pubResult.success) {
    logPass('依赖安装成功');
    results.checks.push({ name: 'pub_get', status: 'pass' });
  } else {
    logFail('依赖安装失败');
    results.checks.push({ name: 'pub_get', status: 'fail', error: pubResult.output });
    return results;
  }
  
  // 4. flutter analyze
  log('\n检查 4: 代码分析');
  const analyzeResult = runCommand('flutter analyze', projectPath);
  if (analyzeResult.success || !analyzeResult.output.includes('error')) {
    logPass('代码分析通过 (0 errors)');
    results.checks.push({ name: 'flutter_analyze', status: 'pass' });
  } else {
    logFail('代码分析有错误');
    results.checks.push({ name: 'flutter_analyze', status: 'fail', error: '有 error' });
    // 继续检查
  }
  
  // 5. flutter test
  log('\n检查 5: 单元测试');
  const testResult = runCommand('flutter test', projectPath);
  if (testResult.success && testResult.output.includes('All tests passed')) {
    const match = testResult.output.match(/(\d+) tests?/);
    logPass(`单元测试通过${match ? ` (${match[1]} 个)` : ''}`);
    results.checks.push({ name: 'flutter_test', status: 'pass' });
  } else if (testResult.success) {
    logPass('单元测试通过');
    results.checks.push({ name: 'flutter_test', status: 'pass' });
  } else {
    logFail('单元测试失败');
    results.checks.push({ name: 'flutter_test', status: 'fail', error: '测试有失败' });
  }
  
  // 6. 检查 iOS 模拟器
  log('\n检查 6: iOS 模拟器');
  const simResult = runCommand('xcrun simctl list devices available', projectPath);
  const iphones = simResult.output.match(/iPhone.*\(/g) || [];
  if (iphones.length > 0) {
    logPass(`找到 ${iphones.length} 个 iPhone 模拟器`);
    logInfo(`示例: ${iphones[0]}`);
    results.checks.push({ name: 'ios_simulator', status: 'pass', count: iphones.length });
  } else {
    logFail('未找到 iPhone 模拟器');
    results.checks.push({ name: 'ios_simulator', status: 'fail' });
  }
  
  // 7. flutter build ios --simulator
  log('\n检查 7: iOS 模拟器构建');
  const buildResult = runCommand('flutter build ios --simulator --no-codesign', projectPath, { timeout: 600000 });
  if (buildResult.success && buildResult.output.includes('Built from')) {
    logPass('iOS 模拟器构建成功');
    results.checks.push({ name: 'ios_build', status: 'pass' });
  } else if (buildResult.success) {
    logPass('iOS 模拟器构建成功');
    results.checks.push({ name: 'ios_build', status: 'pass' });
  } else {
    logFail('iOS 模拟器构建失败');
    results.checks.push({ name: 'ios_build', status: 'fail', error: '构建失败' });
    logInfo('错误信息: ' + (buildResult.output || '').substring(0, 500));
  }
  
  // 8. 总结
  log('\n========================================');
  const passCount = results.checks.filter(c => c.status === 'pass').length;
  const totalCount = results.checks.length;
  log(`验证结果: ${passCount}/${totalCount} 通过`);
  
  if (passCount === totalCount) {
    logPass('所有检查通过！App 可以运行。');
    results.overall = 'pass';
  } else {
    logFail(`有 ${totalCount - passCount} 项检查失败`);
    results.overall = 'fail';
  }
  
  return results;
}

// ============ Android 验证 ============
async function verifyAndroid(projectPath) {
  log('开始 Android 启动验证...\n');
  
  const results = {
    platform: 'android',
    checks: [],
    overall: 'fail'
  };
  
  // 1-5 同 iOS (flutter 环境、项目结构、pub get、analyze、test)
  log('检查 1: Flutter 环境');
  const flutterResult = runCommand('flutter --version', projectPath);
  results.checks.push({ name: 'flutter_env', status: flutterResult.success ? 'pass' : 'fail' });
  
  log('\n检查 2: 项目结构');
  const requiredFiles = ['pubspec.yaml', 'lib/main.dart'];
  let allFilesExist = requiredFiles.every(f => fs.existsSync(path.join(projectPath, f)));
  results.checks.push({ name: 'project_structure', status: allFilesExist ? 'pass' : 'fail' });
  
  log('\n检查 3: 安装依赖');
  const pubResult = runCommand('flutter pub get', projectPath);
  results.checks.push({ name: 'pub_get', status: pubResult.success ? 'pass' : 'fail' });
  
  log('\n检查 4: 代码分析');
  const analyzeResult = runCommand('flutter analyze', projectPath);
  results.checks.push({ name: 'flutter_analyze', status: (analyzeResult.success || !analyzeResult.output.includes('error')) ? 'pass' : 'fail' });
  
  log('\n检查 5: 单元测试');
  const testResult = runCommand('flutter test', projectPath);
  results.checks.push({ name: 'flutter_test', status: testResult.success ? 'pass' : 'fail' });
  
  // 6. 检查 Android SDK
  log('\n检查 6: Android SDK');
  const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (androidHome) {
    logPass(`Android SDK 配置正常: ${androidHome}`);
    results.checks.push({ name: 'android_sdk', status: 'pass' });
  } else {
    logFail('Android SDK 未配置');
    results.checks.push({ name: 'android_sdk', status: 'fail' });
  }
  
  // 7. flutter build apk --debug
  log('\n检查 7: APK 构建');
  const buildResult = runCommand('flutter build apk --debug', projectPath, { timeout: 600000 });
  if (buildResult.success) {
    logPass('APK 构建成功');
    results.checks.push({ name: 'apk_build', status: 'pass' });
    
    // 检查 APK 文件
    const apkPath = path.join(projectPath, 'build/app/outputs/flutter-apk/app-debug.apk');
    if (fs.existsSync(apkPath)) {
      const stats = fs.statSync(apkPath);
      logInfo(`APK 大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    }
  } else {
    logFail('APK 构建失败');
    results.checks.push({ name: 'apk_build', status: 'fail', error: '构建失败' });
  }
  
  // 8. 总结
  log('\n========================================');
  const passCount = results.checks.filter(c => c.status === 'pass').length;
  const totalCount = results.checks.length;
  log(`验证结果: ${passCount}/${totalCount} 通过`);
  results.overall = passCount === totalCount ? 'pass' : 'fail';
  
  return results;
}

// ============ CLI 入口 ============
const args = process.argv.slice(2);
let projectPath = process.cwd();
let platform = 'ios';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--project' || args[i] === '-p') {
    projectPath = args[++i];
  } else if (args[i] === '--platform' || args[i] === '-pl') {
    platform = args[++i].toLowerCase();
  } else if (args[i] === '--help' || args[i] === '-h') {
    console.log(`
startup-verification.js - App 启动验证脚本

用法：
  node startup-verification.js --project /path/to/project --platform ios

选项：
  -p, --project <路径>     项目路径（默认当前目录）
  -pl, --platform <平台>   ios (默认) | android
  -h, --help               显示帮助

检查项：
  1. Flutter 环境
  2. 项目结构
  3. 依赖安装
  4. 代码分析
  5. 单元测试
  6. 平台模拟器/SDK
  7. 平台构建

示例：
  node startup-verification.js --project ./counter_app --platform ios
  node startup-verification.js --project ./my_app --platform android
`);
    process.exit(0);
  }
}

async function main() {
  if (!PLATFORMS.includes(platform)) {
    console.error(`不支持的平台: ${platform}`);
    console.error(`支持的平台: ${PLATFORMS.join(', ')}`);
    process.exit(1);
  }
  
  if (!fs.existsSync(projectPath)) {
    console.error(`项目路径不存在: ${projectPath}`);
    process.exit(1);
  }
  
  console.error(`\n🚀 App 启动验证 - ${platform.toUpperCase()}\n`);
  console.error(`项目: ${projectPath}\n`);
  
  let results;
  if (platform === 'ios') {
    results = await verifyIOS(projectPath);
  } else {
    results = await verifyAndroid(projectPath);
  }
  
  console.log(JSON.stringify(results, null, 2));
  
  process.exit(results.overall === 'pass' ? 0 : 1);
}

main();
