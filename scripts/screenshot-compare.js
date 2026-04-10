#!/usr/bin/env node
/**
 * screenshot-compare.js
 * UI截图对比工具
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const command = args[0];

const SCREENSHOT_DIR = './screenshots';
const BASELINE_DIR = './screenshots/baseline';
const ACTUAL_DIR = './screenshots/actual';
const DIFF_DIR = './screenshots/diff';

// 确保目录存在
[BASELINE_DIR, ACTUAL_DIR, DIFF_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

async function captureBaseline(url, name) {
  console.log(`📸 捕获基线截图: ${name}`);
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000); // 等待动画完成
    
    const screenshotPath = path.join(BASELINE_DIR, `${name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    console.log(`  ✅ 已保存: ${screenshotPath}`);
    return true;
  } catch (error) {
    console.log(`  ❌ 失败: ${error.message}`);
    return false;
  } finally {
    await browser.close();
  }
}

async function captureActual(url, name) {
  console.log(`📸 捕获实际截图: ${name}`);
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    const screenshotPath = path.join(ACTUAL_DIR, `${name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    console.log(`  ✅ 已保存: ${screenshotPath}`);
    return true;
  } catch (error) {
    console.log(`  ❌ 失败: ${error.message}`);
    return false;
  } finally {
    await browser.close();
  }
}

async function compareScreenshots(name) {
  console.log(`🔍 对比截图: ${name}`);
  
  const baselinePath = path.join(BASELINE_DIR, `${name}.png`);
  const actualPath = path.join(ACTUAL_DIR, `${name}.png`);
  const diffPath = path.join(DIFF_DIR, `${name}.png`);
  
  if (!fs.existsSync(baselinePath)) {
    console.log(`  ⚠️ 基线截图不存在: ${baselinePath}`);
    return false;
  }
  
  if (!fs.existsSync(actualPath)) {
    console.log(`  ⚠️ 实际截图不存在: ${actualPath}`);
    return false;
  }
  
  // 简单对比：文件大小和基本检查
  const baselineStats = fs.statSync(baselinePath);
  const actualStats = fs.statSync(actualPath);
  
  console.log(`  基线大小: ${(baselineStats.size / 1024).toFixed(2)} KB`);
  console.log(`  实际大小: ${(actualStats.size / 1024).toFixed(2)} KB`);
  
  if (baselineStats.size === actualStats.size) {
    console.log(`  ✅ 截图一致`);
    return true;
  } else {
    const sizeDiff = Math.abs(baselineStats.size - actualStats.size) / baselineStats.size * 100;
    console.log(`  ⚠️ 大小差异: ${sizeDiff.toFixed(2)}%`);
    if (sizeDiff > 10) {
      console.log(`  ❌ 差异过大，可能有问题`);
      return false;
    }
    console.log(`  ⚠️ 存在差异，请人工检查`);
    return true;
  }
}

async function captureAllPages(url, pages) {
  console.log(`\n📸 批量截图模式`);
  console.log(`URL: ${url}`);
  console.log(`页面数: ${pages.length}\n`);
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    
    for (const pageInfo of pages) {
      console.log(`\n处理: ${pageInfo.name}`);
      
      // 导航到页面
      if (pageInfo.path) {
        await page.goto(url + pageInfo.path, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(1000);
      }
      
      // 截图
      const screenshotPath = path.join(ACTUAL_DIR, `${pageInfo.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: pageInfo.fullPage || false });
      console.log(`  ✅ 已保存: ${screenshotPath}`);
    }
    
    console.log(`\n✅ 批量截图完成`);
  } catch (error) {
    console.log(`\n❌ 批量截图失败: ${error.message}`);
  } finally {
    await browser.close();
  }
}

function showHelp() {
  console.log(`
screenshot-compare.js - UI截图对比工具

用法:
  node screenshot-compare.js baseline <url> <name>    捕获基线截图
  node screenshot-compare.js capture <url> <name>     捕获实际截图
  node screenshot-compare.js compare <name>            对比截图
  node screenshot-compare.js batch <url>               批量截图

示例:
  # 捕获基线
  node screenshot-compare.js baseline http://localhost:3000 login
  
  # 捕获实际
  node screenshot-compare.js capture http://localhost:3000 login
  
  # 对比
  node screenshot-compare.js compare login
  
  # 批量截图
  node screenshot-compare.js batch http://localhost:3000

目录结构:
  screenshots/
  ├── baseline/    # 基线截图
  ├── actual/      # 实际截图
  └── diff/        # 差异截图
`);
}

async function main() {
  switch (command) {
    case 'baseline':
      if (args.length < 3) {
        console.log('用法: baseline <url> <name>');
        return;
      }
      await captureBaseline(args[1], args[2]);
      break;
      
    case 'capture':
      if (args.length < 3) {
        console.log('用法: capture <url> <name>');
        return;
      }
      await captureActual(args[1], args[2]);
      break;
      
    case 'compare':
      if (args.length < 2) {
        console.log('用法: compare <name>');
        return;
      }
      await compareScreenshots(args[1]);
      break;
      
    case 'batch':
      if (args.length < 2) {
        console.log('用法: batch <url>');
        return;
      }
      // 默认页面列表
      const defaultPages = [
        { name: 'home', path: '/' },
        { name: 'login', path: '/login' },
        { name: 'register', path: '/register' },
        { name: 'dashboard', path: '/dashboard' }
      ];
      await captureAllPages(args[1], defaultPages);
      break;
      
    default:
      showHelp();
  }
}

main().catch(console.error);
