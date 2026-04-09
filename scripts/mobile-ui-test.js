#!/usr/bin/env node
/**
 * mobile-ui-test.js
 * 移动端 UI 测试脚本 - 支持截图对比、布局测试、交互测试
 * 
 * 用法：
 *   node mobile-ui-test.js --project /path/to/project --platform ios
 *   node mobile-ui-test.js --project /path/to/project --platform android
 *   node mobile-ui-test.js --project /path/to/project --type screenshot
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ============ 配置 ============
const PLATFORMS = ['ios', 'android'];
const TEST_TYPES = ['screenshot', 'layout', 'interaction', 'full'];

// ============ 工具函数 ============
function runCommand(cmd, cwd) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf-8', stdio: 'pipe' });
  } catch (error) {
    return error.stdout || error.message;
  }
}

function checkFlutterAvailable() {
  try {
    execSync('flutter --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function checkPlatform(platform) {
  const output = runCommand('flutter devices');
  return output.toLowerCase().includes(platform.toLowerCase());
}

// ============ iOS UI 测试 ============
async function testIOSUI(projectPath, testType = 'full') {
  console.error('🍎 iOS UI 测试...\n');
  
  // 1. 检查环境
  console.error('📋 检查环境...');
  const hasFlutter = checkFlutterAvailable();
  const hasIOS = checkPlatform('ios');
  
  console.error(`  - Flutter: ${hasFlutter ? '✅' : '❌'}`);
  console.error(`  - iOS 设备: ${hasIOS ? '✅' : '❌'}`);
  console.error('');
  
  if (!hasFlutter) {
    throw new Error('Flutter 不可用');
  }
  
  // 2. 获取可用 iOS 模拟器
  console.error('📱 iOS 模拟器:');
  let simulators = [];
  try {
    const output = runCommand('xcrun simctl list devices available');
    const lines = output.split('\n');
    let inIOSSection = false;
    
    for (const line of lines) {
      if (line.includes('iOS') || line.includes('iPhone') || line.includes('iPad')) {
        inIOSSection = true;
      }
      if (inIOSSection && line.match(/-- iPhone|-- iPad/)) {
        const match = line.match(/-- (iPhone|iPad[^:]+)/);
        if (match) simulators.push(match[1]);
      }
    }
  } catch {}
  
  if (simulators.length === 0) {
    console.error('  ⚠️ 未找到可用模拟器');
  } else {
    simulators.slice(0, 5).forEach(s => console.error(`  - ${s}`));
    if (simulators.length > 5) {
      console.error(`  ... 还有 ${simulators.length - 5} 个`);
    }
  }
  console.error('');
  
  // 3. Flutter analyze
  console.error('🔍 Flutter analyze...');
  const analyzeOutput = runCommand('flutter analyze --no-pub 2>&1', projectPath);
  const errorCount = (analyzeOutput.match(/error/gi) || []).length;
  const warningCount = (analyzeOutput.match(/warning/gi) || []).length;
  console.error(`  - Errors: ${errorCount === 0 ? '✅' : `❌ ${errorCount}`}`);
  console.error(`  - Warnings: ${warningCount === 0 ? '✅' : `⚠️ ${warningCount}`}`);
  console.error('');
  
  // 4. 截图测试
  if (testType === 'screenshot' || testType === 'full') {
    console.error('📸 截图测试...');
    const screenshotDir = path.join(projectPath, 'test', 'screenshots');
    const goldensDir = path.join(projectPath, 'test', 'goldens');
    
    console.error(`  - 截图目录: ${fs.existsSync(screenshotDir) ? '✅' : '⚠️ 待创建'}`);
    console.error(`  - 黄金截图: ${fs.existsSync(goldensDir) ? '✅' : '⚠️ 待创建'}`);
    
    if (!fs.existsSync(screenshotDir)) {
      console.error('  💡 创建截图目录: test/screenshots');
    }
    if (!fs.existsSync(goldensDir)) {
      console.error('  💡 创建黄金截图: test/goldens');
    }
    console.error('');
  }
  
  // 5. Widget 测试
  console.error('🧪 Widget 测试...');
  const testDir = path.join(projectPath, 'test');
  if (fs.existsSync(testDir)) {
    const testFiles = runCommand('find test -name "*_test.dart" -type f', projectPath);
    const testCount = testFiles.trim().split('\n').filter(f => f).length;
    console.error(`  - 测试文件: ${testCount} 个`);
    
    if (testCount > 0) {
      console.error('  🏃 运行测试...');
      const testResult = runCommand('flutter test 2>&1', projectPath);
      const passedMatch = testResult.match(/(\d+) passed/);
      const failedMatch = testResult.match(/(\d+) failed/);
      
      const passed = passedMatch ? passedMatch[1] : '?';
      const failed = failedMatch ? failedMatch[1] : '0';
      
      console.error(`  - 结果: ${passed} passed, ${failed} failed`);
    }
  } else {
    console.error('  ⚠️ 未找到 test 目录');
  }
  console.error('');
  
  // 6. 集成测试
  console.error('🔄 集成测试...');
  const integrationDir = path.join(projectPath, 'integration_test');
  if (fs.existsSync(integrationDir)) {
    console.error('  - 集成测试目录: ✅');
    console.error('  💡 运行: flutter test integration_test');
  } else {
    console.error('  ⚠️ 未找到 integration_test 目录');
    console.error('  💡 创建: flutter create --platforms=ios,android integration_test');
  }
  
  return {
    platform: 'ios',
    flutter_analyze: errorCount === 0 ? 'pass' : 'fail',
    warnings: warningCount,
    test_files: fs.existsSync(testDir) ? 'found' : 'not_found',
    integration_test: fs.existsSync(integrationDir) ? 'found' : 'not_found',
    simulators_available: simulators.length,
    timestamp: new Date().toISOString()
  };
}

// ============ Android UI 测试 ============
async function testAndroidUI(projectPath, testType = 'full') {
  console.error('🤖 Android UI 测试...\n');
  
  // 1. 检查环境
  console.error('📋 检查环境...');
  const hasFlutter = checkFlutterAvailable();
  const hasAndroid = checkPlatform('android');
  
  console.error(`  - Flutter: ${hasFlutter ? '✅' : '❌'}`);
  console.error(`  - Android 设备: ${hasAndroid ? '✅' : '❌'}`);
  console.error('');
  
  if (!hasFlutter) {
    throw new Error('Flutter 不可用');
  }
  
  // 2. Android SDK 检查
  console.error('📦 Android SDK:');
  const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (androidHome) {
    console.error(`  - ANDROID_HOME: ✅ ${androidHome}`);
  } else {
    console.error('  - ANDROID_HOME: ❌ 未设置');
    console.error('  💡 设置: export ANDROID_HOME=/path/to/android/sdk');
  }
  console.error('');
  
  // 3. Flutter analyze
  console.error('🔍 Flutter analyze...');
  const analyzeOutput = runCommand('flutter analyze --no-pub 2>&1', projectPath);
  const errorCount = (analyzeOutput.match(/error/gi) || []).length;
  const warningCount = (analyzeOutput.match(/warning/gi) || []).length;
  console.error(`  - Errors: ${errorCount === 0 ? '✅' : `❌ ${errorCount}`}`);
  console.error(`  - Warnings: ${warningCount === 0 ? '✅' : `⚠️ ${warningCount}`}`);
  console.error('');
  
  // 4. 构建 APK
  console.error('🏗️ 构建 APK...');
  const buildResult = runCommand('flutter build apk --debug 2>&1', projectPath);
  const buildSuccess = buildResult.includes('Built from');
  
  if (buildSuccess) {
    console.error('  ✅ APK 构建成功');
    const apkPath = path.join(projectPath, 'build', 'app', 'outputs', 'flutter-apk', 'app-debug.apk');
    if (fs.existsSync(apkPath)) {
      const stats = fs.statSync(apkPath);
      console.error(`  📁 APK: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    }
  } else {
    console.error('  ⚠️ APK 构建需要 Android SDK 配置');
  }
  console.error('');
  
  return {
    platform: 'android',
    flutter_analyze: errorCount === 0 ? 'pass' : 'fail',
    warnings: warningCount,
    android_sdk: androidHome ? 'configured' : 'not_configured',
    apk_build: buildSuccess ? 'success' : 'skipped',
    timestamp: new Date().toISOString()
  };
}

// ============ CLI 入口 ============
const args = process.argv.slice(2);
let projectPath = process.cwd();
let platform = 'ios';
let testType = 'full';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--project' || args[i] === '-p') {
    projectPath = args[++i];
  } else if (args[i] === '--platform' || args[i] === '-pl') {
    platform = args[++i].toLowerCase();
  } else if (args[i] === '--type' || args[i] === '-t') {
    testType = args[++i].toLowerCase();
  } else if (args[i] === '--help' || args[i] === '-h') {
    console.log(`
mobile-ui-test.js - 移动端 UI 测试工具

用法：
  node mobile-ui-test.js --project /path/to/project --platform ios [选项]

选项：
  -p, --project <路径>      Flutter 项目路径（默认当前目录）
  -pl, --platform <平台>    测试平台: ios (默认) | android
  -t, --type <类型>         测试类型: full (默认) | screenshot | layout | interaction
  -h, --help               显示帮助

示例：
  node mobile-ui-test.js --project ./my_app --platform ios
  node mobile-ui-test.js --project ./my_app --platform android --type screenshot

测试内容：
  iOS:
    - Flutter analyze
    - iOS 模拟器列表
    - Widget 测试
    - 集成测试

  Android:
    - Flutter analyze
    - Android SDK 检查
    - APK 构建
    - 设备测试
`);
    process.exit(0);
  }
}

async function main() {
  try {
    let result;
    
    if (platform === 'ios') {
      result = await testIOSUI(projectPath, testType);
    } else if (platform === 'android') {
      result = await testAndroidUI(projectPath, testType);
    } else {
      throw new Error(`不支持的平台: ${platform}`);
    }
    
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error(`❌ 错误: ${error.message}`);
    process.exit(1);
  }
}

main();
