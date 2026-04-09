#!/usr/bin/env node
/**
 * browser-control.js
 * 浏览器完全控制脚本 - Playwright 驱动
 * 
 * 功能：
 * - 打开/关闭浏览器
 * - 访问 URL
 * - 截图
 * - 填写表单
 * - 点击元素
 * - 执行 JavaScript
 * - 等待元素
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  switch (command) {
    case 'open':
      await page.goto(args[1] || 'https://www.google.com');
      console.log('✅ 浏览器已打开');
      break;

    case 'screenshot':
      const screenshotPath = args[1] || 'screenshot.png';
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`✅ 截图已保存: ${screenshotPath}`);
      break;

    case 'click':
      await page.click(args[1]);
      console.log(`✅ 已点击: ${args[1]}`);
      break;

    case 'fill':
      await page.fill(args[1], args[2]);
      console.log(`✅ 已填写 ${args[1]} = ${args[2]}`);
      break;

    case 'type':
      await page.type(args[1], args[2]);
      console.log(`✅ 已输入 ${args[1]} = ${args[2]}`);
      break;

    case 'goto':
      await page.goto(args[1]);
      console.log(`✅ 已访问: ${args[1]}`);
      break;

    case 'evaluate':
      const result = await page.evaluate(args[1]);
      console.log('✅ 执行结果:', result);
      break;

    case 'wait':
      await page.waitForSelector(args[1], { timeout: 30000 });
      console.log(`✅ 元素出现: ${args[1]}`);
      break;

    case 'html':
      const html = await page.content();
      console.log(html);
      break;

    case 'title':
      const title = await page.title();
      console.log(`标题: ${title}`);
      break;

    case 'url':
      console.log(`URL: ${page.url()}`);
      break;

    case 'back':
      await page.goBack();
      console.log('✅ 返回上一页');
      break;

    case 'forward':
      await page.goForward();
      console.log('✅ 前进一页');
      break;

    case 'refresh':
      await page.reload();
      console.log('✅ 刷新页面');
      break;

    case 'select':
      await page.selectOption(args[1], args[2]);
      console.log(`✅ 已选择 ${args[1]} = ${args[2]}`);
      break;

    case 'check':
      await page.check(args[1]);
      console.log(`✅ 已勾选: ${args[1]}`);
      break;

    case 'uncheck':
      await page.uncheck(args[1]);
      console.log(`✅ 已取消勾选: ${args[1]}`);
      break;

    case 'press':
      await page.press(args[1], args[2]);
      console.log(`✅ 已按键 ${args[1]} ${args[2]}`);
      break;

    case 'hover':
      await page.hover(args[1]);
      console.log(`✅ 已悬停: ${args[1]}`);
      break;

    case 'scroll':
      await page.evaluate(`window.scrollTo(0, ${args[1] || 500})`);
      console.log(`✅ 已滚动到 ${args[1] || 500}px`);
      break;

    default:
      console.log(`
browser-control.js - 浏览器控制脚本

用法：
  node browser-control.js <命令> [参数]

命令：
  open <url>          打开 URL
  screenshot [path]   截图
  click <selector>    点击元素
  fill <selector> <text>   填写表单
  type <selector> <text>    输入文本
  goto <url>          访问 URL
  evaluate <js>       执行 JavaScript
  wait <selector>     等待元素
  html                获取页面 HTML
  title               获取页面标题
  url                 获取当前 URL
  back                返回
  forward             前进
  refresh             刷新
  select <sel> <val>   选择下拉选项
  check <selector>    勾选
  uncheck <selector>  取消勾选
  press <sel> <key>   按键
  hover <selector>    悬停
  scroll [px]        滚动

示例：
  node browser-control.js open https://google.com
  node browser-control.js screenshot
  node browser-control.js click "#submit"
  node browser-control.js fill "input[name=q]" "搜索内容"
  node browser-control.js evaluate "document.title"
      `);
  }

  await browser.close();
}

main().catch(console.error);
