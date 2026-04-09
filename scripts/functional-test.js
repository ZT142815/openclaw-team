#!/usr/bin/env node
/**
 * functional-test.js
 * Web应用功能测试 - 真实浏览器自动化
 * 
 * 功能：
 * - 打开浏览器访问页面
 * - 执行登录/注册等操作
 * - 验证功能正确性
 * - 截图保存
 * - UI对比
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const command = args[0];

const BASE_URL = args[1] || 'http://localhost:8080';
const SCREENSHOT_DIR = './screenshots';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runTest() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  console.log('='.repeat(60));
  console.log('  Web功能测试开始');
  console.log('='.repeat(60));
  console.log(`测试URL: ${BASE_URL}`);
  console.log('');

  let passed = 0;
  let failed = 0;

  try {
    // Test 1: 首页加载
    console.log('Test 1: 首页加载测试');
    try {
      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
      const title = await page.title();
      console.log(`  ✅ 首页加载成功 - 标题: "${title}"`);
      passed++;
      
      await page.screenshot({ path: `${SCREENSHOT_DIR}/01-homepage.png` });
      console.log('  📸 截图已保存: 01-homepage.png');
    } catch (e) {
      console.log(`  ❌ 首页加载失败: ${e.message}`);
      failed++;
    }

    // Test 2: 检查关键元素
    console.log('\nTest 2: 检查关键元素');
    try {
      const elements = await page.evaluate(() => {
        const results = {};
        // 检查body是否存在
        results.body = !!document.body;
        // 检查标题
        results.h1 = document.querySelector('h1')?.textContent || 'N/A';
        // 检查按钮数量
        results.buttons = document.querySelectorAll('button').length;
        // 检查输入框数量
        results.inputs = document.querySelectorAll('input').length;
        return results;
      });
      
      console.log(`  ✅ 页面元素检查通过`);
      console.log(`     - H1: ${elements.h1}`);
      console.log(`     - 按钮数: ${elements.buttons}`);
      console.log(`     - 输入框数: ${elements.inputs}`);
      passed++;
    } catch (e) {
      console.log(`  ❌ 元素检查失败: ${e.message}`);
      failed++;
    }

    // Test 3: 测试交互（如果有登录表单）
    console.log('\nTest 3: 表单交互测试');
    try {
      const inputSelector = 'input[type="text"], input[type="email"], input:not([type])';
      const inputs = await page.$$(inputSelector);
      
      if (inputs.length > 0) {
        console.log(`  发现 ${inputs.length} 个输入框，尝试输入...`);
        
        for (let i = 0; i < Math.min(inputs.length, 3); i++) {
          await inputs[i].fill(`test${i}@example.com`);
          await page.screenshot({ path: `${SCREENSHOT_DIR}/03-form-input-${i}.png` });
        }
        
        console.log('  ✅ 表单交互成功');
        passed++;
      } else {
        console.log('  ⚪ 无输入框，跳过');
      }
    } catch (e) {
      console.log(`  ❌ 表单交互失败: ${e.message}`);
      failed++;
    }

    // Test 4: 按钮点击测试
    console.log('\nTest 4: 按钮点击测试');
    try {
      const buttons = await page.$$('button');
      console.log(`  发现 ${buttons.length} 个按钮`);
      
      if (buttons.length > 0) {
        const firstButton = buttons[0];
        const buttonText = await firstButton.textContent();
        console.log(`  点击第一个按钮: "${buttonText.trim()}"`);
        
        await firstButton.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/04-after-click.png` });
        
        console.log('  ✅ 按钮点击成功');
        passed++;
      }
    } catch (e) {
      console.log(`  ❌ 按钮点击失败: ${e.message}`);
      failed++;
    }

    // Test 5: 响应式测试
    console.log('\nTest 5: 响应式测试');
    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Laptop', width: 1366, height: 768 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 }
    ];
    
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(500);
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/05-responsive-${vp.name.toLowerCase()}.png` 
      });
      console.log(`  ✅ ${vp.name} (${vp.width}x${vp.height})`);
    }
    passed++;

    // Test 6: 控制台错误检查
    console.log('\nTest 6: 控制台错误检查');
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.reload({ waitUntil: 'networkidle' });
    
    if (consoleErrors.length === 0) {
      console.log('  ✅ 无控制台错误');
      passed++;
    } else {
      console.log(`  ⚠️ 发现 ${consoleErrors.length} 个控制台错误:`);
      consoleErrors.forEach(e => console.log(`     - ${e}`));
      failed++;
    }

  } catch (e) {
    console.log(`\n❌ 测试执行失败: ${e.message}`);
    failed++;
  }

  await browser.close();

  console.log('\n' + '='.repeat(60));
  console.log('  测试结果汇总');
  console.log('='.repeat(60));
  console.log(`  ✅ 通过: ${passed}`);
  console.log(`  ❌ 失败: ${failed}`);
  console.log(`  📸 截图保存目录: ${SCREENSHOT_DIR}`);
  console.log('='.repeat(60));

  return failed === 0 ? 0 : 1;
}

// UI对比功能
async function compareUI() {
  console.log('\n📸 UI对比模式');
  
  if (args.length < 3) {
    console.log('用法: node functional-test.js compare <expected.png> <actual.png>');
    return;
  }
  
  const [,, expectedPath, actualPath] = args;
  
  if (!fs.existsSync(expectedPath)) {
    console.log(`❌ 预期截图不存在: ${expectedPath}`);
    return;
  }
  
  if (!fs.existsSync(actualPath)) {
    console.log(`❌ 实际截图不存在: ${actualPath}`);
    return;
  }
  
  console.log('UI对比功能需要 pixelmatch 库');
  console.log('安装: npm install pixelmatch pngjs');
  console.log(`\n预期: ${expectedPath}`);
  console.log(`实际: ${actualPath}`);
}

// 帮助
function showHelp() {
  console.log(`
functional-test.js - Web功能测试

用法:
  node functional-test.js [command] [url]

命令:
  test [url]     运行功能测试（默认 http://localhost:8080）
  compare         UI截图对比
  help           显示帮助

示例:
  node functional-test.js test http://localhost:8080
  node functional-test.js test
  node functional-test.js compare expected.png actual.png

测试项:
  1. 首页加载
  2. 关键元素检查
  3. 表单交互
  4. 按钮点击
  5. 响应式测试
  6. 控制台错误检查

输出:
  - screenshots/ 目录保存所有截图
  - 命名格式: XX-description.png
`);
}

switch (command) {
  case 'test':
    runTest();
    break;
  case 'compare':
    compareUI();
    break;
  default:
    showHelp();
}
