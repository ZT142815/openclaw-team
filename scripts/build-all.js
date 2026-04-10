#!/usr/bin/env node
/**
 * build-all.js - 全平台构建脚本
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const platforms = args.includes('--all') 
  ? ['web', 'ios', 'android', 'macos', 'linux', 'windows']
  : args.filter(p => ['web', 'ios', 'android', 'macos', 'linux', 'windows'].includes(p));

const results = {
  success: [],
  failed: [],
  skipped: []
};

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function exec(command, options = {}) {
  try {
    log(`执行: ${command}`);
    execSync(command, { 
      stdio: 'inherit',
      ...options 
    });
    return true;
  } catch (error) {
    console.error(`命令失败: ${command}`);
    return false;
  }
}

function checkPlatform(platform) {
  log(`\n========================================`);
  log(`检查平台: ${platform}`);
  log(`========================================`);
  
  // 检查环境
  switch (platform) {
    case 'ios':
      if (process.platform !== 'darwin') {
        log('⚠️ iOS 构建只能在 macOS 上进行');
        return 'skipped';
      }
      break;
    case 'macos':
      if (process.platform !== 'darwin') {
        log('⚠️ macOS 构建只能在 macOS 上进行');
        return 'skipped';
      }
      break;
    case 'windows':
      if (process.platform !== 'win32') {
        log('⚠️ Windows 构建只能在 Windows 上进行');
        return 'skipped';
      }
      break;
  }
  
  return 'ready';
}

async function buildPlatform(platform) {
  const status = checkPlatform(platform);
  
  if (status === 'skipped') {
    results.skipped.push(platform);
    return;
  }
  
  // 清理
  log(`🧹 清理 ${platform}...`);
  exec(`flutter clean`, { cwd: process.cwd() });
  
  // 获取依赖
  log(`📦 获取依赖...`);
  if (!exec(`flutter pub get`, { cwd: process.cwd() })) {
    results.failed.push({ platform, error: '依赖获取失败' });
    return;
  }
  
  // 代码分析
  log(`🔍 代码分析...`);
  if (!exec(`flutter analyze --no-fatal-infos --no-fatal-warnings`, { cwd: process.cwd() })) {
    results.failed.push({ platform, error: '代码分析失败' });
    return;
  }
  
  // 构建
  log(`🔨 构建 ${platform}...`);
  const buildCommand = getBuildCommand(platform);
  
  if (!exec(buildCommand, { cwd: process.cwd() })) {
    results.failed.push({ platform, error: '构建失败' });
    return;
  }
  
  // 验证构建产物
  if (verifyBuild(platform)) {
    results.success.push(platform);
    log(`✅ ${platform} 构建成功`);
  } else {
    results.failed.push({ platform, error: '构建产物验证失败' });
  }
}

function getBuildCommand(platform) {
  const commands = {
    web: 'flutter build web --release',
    ios: 'flutter build ios --simulator --no-codesign',
    android: 'flutter build apk --release',
    macos: 'flutter build macos --release',
    linux: 'flutter build linux --release',
    windows: 'flutter build windows --release'
  };
  return commands[platform];
}

function verifyBuild(platform) {
  const buildPaths = {
    web: 'build/web/index.html',
    ios: 'build/ios/iphonesimulator/Runner.app',
    android: 'build/app/outputs/flutter-apk/app-release.apk',
    macos: 'build/macos/Build/Products/Release/Runner.app',
    linux: 'build/linux/bundle/lib/app.so',
    windows: 'build/windows/runner/Release/Runner.exe'
  };
  
  const buildPath = path.join(process.cwd(), buildPaths[platform]);
  return fs.existsSync(buildPath);
}

async function generateReport() {
  console.log('\n');
  console.log('═'.repeat(50));
  console.log('           构建报告');
  console.log('═'.repeat(50));
  
  console.log(`\n📊 统计`);
  console.log(`   ✅ 成功: ${results.success.length}`);
  console.log(`   ❌ 失败: ${results.failed.length}`);
  console.log(`   ⏭️  跳过: ${results.skipped.length}`);
  
  if (results.success.length > 0) {
    console.log(`\n✅ 成功平台:`);
    results.success.forEach(p => console.log(`   - ${p}`));
  }
  
  if (results.failed.length > 0) {
    console.log(`\n❌ 失败平台:`);
    results.failed.forEach(f => console.log(`   - ${f.platform}: ${f.error}`));
  }
  
  if (results.skipped.length > 0) {
    console.log(`\n⏭️ 跳过平台:`);
    results.skipped.forEach(p => console.log(`   - ${p}`));
  }
  
  console.log('\n' + '═'.repeat(50));
  
  return results.failed.length === 0;
}

async function main() {
  log(`🚀 开始全平台构建`);
  log(`平台: ${platforms.join(', ') || 'all'}`);
  
  if (platforms.length === 0) {
    console.log('用法: node build-all.js [platforms...] [--all]');
    console.log('平台: web, ios, android, macos, linux, windows');
    process.exit(1);
  }
  
  for (const platform of platforms) {
    await buildPlatform(platform);
  }
  
  const success = await generateReport();
  process.exit(success ? 0 : 1);
}

main();
