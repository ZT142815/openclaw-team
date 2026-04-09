#!/usr/bin/env node
/**
 * flutter-web-test.js
 * Flutter Web 测试脚本 - 使用 Patrol + Playwright
 * 
 * 用法：
 *   node flutter-web-test.js --project /path/to/project
 *   node flutter-web-test.js --project /path/to/project --browser chrome
 *   node flutter-web-test.js --project /path/to/project --mode headless
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ============ 配置 ============
const BROWSERS = ['chrome', 'firefox', 'webkit'];
const DEFAULT_BROWSER = 'chrome';

// ============ 工具函数 ============
function runCommand(cmd, cwd) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf-8', stdio: 'pipe' });
  } catch (error) {
    return error.stdout || error.message;
  }
}

function checkFlutterAvailable(cwd) {
  try {
    execSync('flutter --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function checkWebEnabled(cwd) {
  const output = runCommand('flutter devices', cwd);
  return output.includes('web');
}

function checkNodeAvailable() {
  try {
    execSync('node --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function checkPlaywrightInstalled() {
  try {
    execSync('npx playwright --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// ============ Flutter Web 测试 ============
async function testFlutterWeb(projectPath, options = {}) {
  const { browser = DEFAULT_BROWSER, mode = 'headless' } = options;
  
  console.error('🚀 开始 Flutter Web 测试...\n');
  
  // 1. 检查环境
  console.error('📋 检查环境...');
  
  if (!checkFlutterAvailable(projectPath)) {
    throw new Error('Flutter 不可用，请确保已安装 Flutter SDK');
  }
  
  if (!checkWebEnabled(projectPath)) {
    throw new Error('Flutter Web 未启用，请运行 flutter config --enable-web');
  }
  
  const hasNode = checkNodeAvailable();
  const hasPlaywright = checkPlaywrightInstalled();
  
  console.error(`  - Flutter: ✅`);
  console.error(`  - Node.js: ${hasNode ? '✅' : '❌ (建议安装)'}`);
  console.error(`  - Playwright: ${hasPlaywright ? '✅' : '❌ (建议安装)'}`);
  console.error('');
  
  // 2. 获取设备列表
  console.error('📱 可用设备:');
  const devices = runCommand('flutter devices', projectPath);
  const webDevices = devices.split('\n').filter(line => line.includes('web'));
  webDevices.forEach(d => console.error(`  ${d.trim()}`));
  console.error('');
  
  // 3. 运行 Flutter 分析
  console.error('🔍 运行 Flutter analyze...');
  const analyzeResult = runCommand('flutter analyze --no-pub', projectPath);
  const hasErrors = analyzeResult.includes('error');
  const hasWarnings = analyzeResult.includes('warning');
  
  console.error(`  - Errors: ${hasErrors ? '❌ 有' : '✅ 无'}`);
  console.error(`  - Warnings: ${hasWarnings ? '⚠️ 有' : '✅ 无'}`);
  console.error('');
  
  // 4. 构建 Web
  console.error('🏗️ 构建 Web...');
  const buildResult = runCommand('flutter build web', projectPath);
  const buildSuccess = buildResult.includes('Built from');
  
  if (buildSuccess) {
    console.error('  ✅ 构建成功');
    const buildDir = path.join(projectPath, 'build', 'web');
    console.error(`  📁 构建目录: ${buildDir}`);
    
    // 检查关键文件
    const indexPath = path.join(buildDir, 'index.html');
    const mainJsPath = path.join(buildDir, 'main.dart.js');
    
    console.error(`  - index.html: ${fs.existsSync(indexPath) ? '✅' : '❌'}`);
    console.error(`  - main.dart.js: ${fs.existsSync(mainJsPath) ? '✅' : '❌'}`);
  } else {
    console.error('  ❌ 构建失败');
    console.error(buildResult);
  }
  console.error('');
  
  // 5. Playwright 测试（如果可用）
  let playwrightResults = null;
  if (hasPlaywright) {
    console.error('🎭 运行 Playwright 测试...');
    try {
      const testDir = path.join(projectPath, 'test', 'playwright');
      if (fs.existsSync(testDir)) {
        runCommand(`npx playwright test --project=${browser}`, { cwd: testDir });
        console.error('  ✅ Playwright 测试完成');
      } else {
        console.error('  ⚠️ 未找到 Playwright 测试目录 (test/playwright)');
      }
    } catch (error) {
      console.error('  ❌ Playwright 测试失败');
    }
  } else {
    console.error('🎭 Playwright 测试: 跳过 (未安装)');
    console.error('  💡 安装命令: npm install -D @playwright/test && npx playwright install');
  }
  
  // 6. 输出报告
  console.error('\n📊 测试报告:');
  console.error('---');
  console.error(`项目: ${projectPath}`);
  console.error(`Flutter 分析: ${hasErrors ? '❌ 失败' : '✅ 通过'}`);
  console.error(`Web 构建: ${buildSuccess ? '✅ 成功' : '❌ 失败'}`);
  console.error(`Playwright: ${hasPlaywright ? '✅ 已安装' : '⚠️ 未安装'}`);
  
  return {
    project: projectPath,
    flutter_analyze: hasErrors ? 'fail' : 'pass',
    web_build: buildSuccess ? 'success' : 'fail',
    playwright_available: hasPlaywright,
    playwright_tested: hasPlaywright && fs.existsSync(path.join(projectPath, 'test', 'playwright')),
    timestamp: new Date().toISOString()
  };
}

// ============ CLI 入口 ============
const args = process.argv.slice(2);
let projectPath = process.cwd();
let browser = DEFAULT_BROWSER;
let mode = 'headless';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--project' || args[i] === '-p') {
    projectPath = args[++i];
  } else if (args[i] === '--browser' || args[i] === '-b') {
    browser = args[++i];
  } else if (args[i] === '--mode' || args[i] === '-m') {
    mode = args[++i];
  } else if (args[i] === '--help' || args[i] === '-h') {
    console.log(`
flutter-web-test.js - Flutter Web 测试工具

用法：
  node flutter-web-test.js --project /path/to/project [选项]

选项：
  -p, --project <路径>    Flutter 项目路径（默认当前目录）
  -b, --browser <浏览器>  测试浏览器: chrome (默认) | firefox | webkit
  -m, --mode <模式>       运行模式: headless (默认) | headed
  -h, --help             显示帮助

示例：
  node flutter-web-test.js --project ./my_app
  node flutter-web-test.js --project ./my_app --browser chrome --mode headless

前置要求：
  - Flutter SDK
  - Node.js (可选，用于 Playwright 测试)
  - @playwright/test (可选，npm install -D @playwright/test)

注意：
  Flutter Web 测试包括：
  1. flutter analyze - 代码分析
  2. flutter build web - Web 构建
  3. Playwright 测试 (如果已安装)
`);
    process.exit(0);
  }
}

async function main() {
  try {
    const result = await testFlutterWeb(projectPath, { browser, mode });
    console.log(JSON.stringify(result, null, 2));
    
    if (result.flutter_analyze === 'fail' || result.web_build === 'fail') {
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ 错误: ${error.message}`);
    process.exit(1);
  }
}

main();
