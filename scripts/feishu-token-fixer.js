#!/usr/bin/env node
/**
 * feishu-token-fixer.js
 * 
 * Feishu Bot Token 诊断和修复工具
 * 
 * 问题症状：
 * - Cron delivery 失败: "Request failed with status code 400"
 * - API 错误码: 99991661 (Missing access token)
 * - delivery-queue 中的失败条目显示 "to: heartbeat" (异常)
 * 
 * 根因：Feishu bot token 缺失或过期
 * 
 * 修复方法：
 * 1. 手动重新配置 Feishu 集成（需要用户操作）
 * 2. 或使用 openclaw CLI 重新认证
 * 
 * 使用方法：
 *   node feishu-token-fixer.js --check    # 检查当前状态
 *   node feishu-token-fixer.js --info    # 显示修复指南
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_DIR = '/Users/zhoutao/.openclaw/credentials';
const OPENCLAW_CONFIG = '/Users/zhoutao/.openclaw/openclaw.json';
const DELIVERY_QUEUE_DIR = '/Users/zhoutao/.openclaw/delivery-queue';

function checkCurrentStatus() {
  console.log('🔍 Feishu Token 状态检查\n');
  console.log('='.repeat(50));
  
  // 1. 检查 credentials 目录
  console.log('\n📁 Credentials 目录:');
  try {
    const files = fs.readdirSync(CREDENTIALS_DIR);
    files.forEach(f => {
      const content = fs.readFileSync(path.join(CREDENTIALS_DIR, f), 'utf8');
      console.log(`  - ${f}: ${content.substring(0, 100)}...`);
    });
  } catch (e) {
    console.log(`  ❌ 无法读取: ${e.message}`);
  }
  
  // 2. 检查 openclaw.json 中的 Feishu 配置
  console.log('\n⚙️ OpenClaw 配置 (feishu 相关):');
  try {
    const config = JSON.parse(fs.readFileSync(OPENCLAW_CONFIG, 'utf8'));
    const feishuKeys = Object.keys(config).filter(k => k.toLowerCase().includes('feishu'));
    if (feishuKeys.length === 0) {
      console.log('  ⚠️ 未找到 Feishu 配置项');
    } else {
      feishuKeys.forEach(k => {
        console.log(`  - ${k}: ${JSON.stringify(config[k]).substring(0, 100)}`);
      });
    }
  } catch (e) {
    console.log(`  ❌ 读取配置失败: ${e.message}`);
  }
  
  // 3. 检查 delivery-queue 失败条目
  console.log('\n📬 Delivery Queue 失败条目:');
  const failedDir = path.join(DELIVERY_QUEUE_DIR, 'failed');
  try {
    if (fs.existsSync(failedDir)) {
      const files = fs.readdirSync(failedDir);
      console.log(`  发现 ${files.length} 个失败条目`);
      files.slice(0, 3).forEach(f => {
        const content = fs.readFileSync(path.join(failedDir, f), 'utf8');
        const data = JSON.parse(content);
        console.log(`  - ${f}:`);
        console.log(`    channel: ${data.channel}`);
        console.log(`    to: ${data.to}`);
        console.log(`    lastError: ${data.lastError}`);
      });
    }
  } catch (e) {
    console.log(`  检查失败: ${e.message}`);
  }
  
  // 4. 测试 API 连接
  console.log('\n🌐 Feishu API 连接测试:');
  try {
    const result = execSync(
      'curl -s -X GET "https://open.feishu.cn/open-apis/bot/v3/info" 2>&1',
      { encoding: 'utf8' }
    );
    const data = JSON.parse(result);
    if (data.code === 0) {
      console.log('  ✅ API 连接正常');
      console.log(`  Bot名称: ${data.data?.name || '未知'}`);
    } else {
      console.log(`  ❌ API 错误: ${data.code} - ${data.msg}`);
    }
  } catch (e) {
    console.log(`  ❌ 连接失败: ${e.message}`);
  }
}

function showFixGuide() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           Feishu Bot Token 修复指南                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                                ║
║  问题根因：                                                    ║
║    Feishu bot token 缺失或过期，导致所有向飞书的                 ║
║    delivery 请求都返回 400 错误                                ║
║                                                                ║
║  修复步骤：                                                    ║
║                                                                ║
║  方法1: 重新配置 Feishu 集成（推荐）                            ║
║    1. 访问 https://open.feishu.cn/app-console                  ║
║    2. 找到你的应用，获取 App ID 和 App Secret                   ║
║    3. 运行: openclaw config set extensions.feishu.appId <ID>  ║
║    4. 运行: openclaw config set extensions.feishu.appSecret <SECRET> ║
║    5. 重启 Gateway: openclaw gateway restart                   ║
║                                                                ║
║  方法2: 如果使用飞书机器人的 webhook（简化版）                  ║
║    1. 在飞书群中添加"自定义机器人"                             ║
║    2. 获取 Webhook URL                                         ║
║    3. 配置到 openclaw 的飞书集成中                             ║
║                                                                ║
║  临时解决方案（已应用）：                                        ║
║    - entropy-management: 已禁用 Feishu delivery               ║
║    - 脚本仍正常运行，只是结果不会推送到飞书                       ║
║                                                                ║
║  验证修复：                                                    ║
║    node feishu-token-fixer.js --check                         ║
║                                                                ║
╚══════════════════════════════════════════════════════════════╝
`);
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--check')) {
    checkCurrentStatus();
  } else if (args.includes('--info')) {
    showFixGuide();
  } else {
    console.log('用法:');
    console.log('  node feishu-token-fixer.js --check  # 检查当前状态');
    console.log('  node feishu-token-fixer.js --info   # 显示修复指南');
  }
}

main();
