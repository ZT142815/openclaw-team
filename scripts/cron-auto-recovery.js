#!/usr/bin/env node
/**
 * Cron Auto-Recovery Script
 * 
 * 功能：
 *   自动检测并修复常见的 cron 任务错误
 *   支持 Feishu delivery 配置修复
 *   支持 timeout 配置优化
 * 
 * 使用方式：
 *   node cron-auto-recovery.js [--dry-run] [--job-id <id>]
 * 
 * 注意：
 *   默认是 dry-run 模式，不实际执行修复
 *   使用 --confirm 参数确认执行修复
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ============================================================
// 配置
// ============================================================

const FEISHU_OPEN_ID = 'ou_774e4d57cac1746e60706c887b2d7cc7';

const CONFIG = {
  // 飞书 delivery 默认配置
  FEISHU_DELIVERY: {
    mode: 'announce',
    channel: 'feishu',
    to: FEISHU_OPEN_ID
  },
  // timeout 默认值
  DEFAULT_TIMEOUT: 900,
  // 日志目录
  LOG_DIR: path.join(process.env.HOME, '.openclaw/logs'),
  // 备份目录
  BACKUP_DIR: path.join(process.env.HOME, '.openclaw/.backups/cron')
};

// ============================================================
// 主函数
// ============================================================

function main() {
  const args = process.argv.slice(2);
  const isDryRun = !args.includes('--confirm');
  const targetJobId = args.find(arg => arg === '--job-id') ? args[args.indexOf('--job-id') + 1] : null;
  
  console.log('🔧 Cron Auto-Recovery');
  console.log('====================');
  console.log(`模式: ${isDryRun ? '🔍 DRY-RUN (不实际修复)' : '⚠️  CONFIRMED (将执行修复)'}`);
  console.log('');
  
  // 获取 cron 列表
  const cronList = getCronList();
  
  if (!cronList.jobs || cronList.jobs.length === 0) {
    console.log('❌ 无法获取 cron 列表');
    process.exit(1);
  }
  
  // 过滤目标任务
  let jobsToCheck = cronList.jobs;
  if (targetJobId) {
    jobsToCheck = jobsToCheck.filter(j => j.id === targetJobId);
    if (jobsToCheck.length === 0) {
      console.log(`❌ 未找到任务: ${targetJobId}`);
      process.exit(1);
    }
  }
  
  // 分析并修复问题
  const results = [];
  
  for (const job of jobsToCheck) {
    console.log(`\n📋 检查任务: ${job.name} (${job.id})`);
    
    const issues = detectIssues(job);
    
    if (issues.length === 0) {
      console.log(`  ✅ 无问题`);
      continue;
    }
    
    for (const issue of issues) {
      console.log(`  ⚠️  发现问题: ${issue.description}`);
      console.log(`     修复方案: ${issue.fix}`);
      
      if (isDryRun) {
        console.log(`     🔍 [DRY-RUN] 不执行修复`);
        results.push({ job, issue, status: 'skipped' });
      } else {
        const success = applyFix(job, issue);
        results.push({ job, issue, status: success ? 'fixed' : 'failed' });
        console.log(`     ${success ? '✅' : '❌'} ${success ? '修复成功' : '修复失败'}`);
      }
    }
  }
  
  // 输出总结
  console.log('\n====================');
  console.log('📊 修复总结:');
  
  const fixed = results.filter(r => r.status === 'fixed').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  const failed = results.filter(r => r.status === 'failed').length;
  
  console.log(`  ✅ 已修复: ${fixed}`);
  console.log(`  🔍 已跳过: ${skipped}`);
  console.log(`  ❌ 失败: ${failed}`);
  
  if (isDryRun && results.length > 0) {
    console.log('\n💡 使用 --confirm 参数执行实际修复');
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

// ============================================================
// 获取 Cron 列表
// ============================================================

function getCronList() {
  try {
    const output = execSync('openclaw cron list 2>/dev/null', {
      encoding: 'utf8',
      timeout: 10000
    });
    return parseCronTextOutput(output);
  } catch (error) {
    console.error('❌ 无法获取 cron 列表:', error.message);
    return { jobs: [] };
  }
}

// 解析 cron list 文本输出
function parseCronTextOutput(output) {
  const lines = output.trim().split('\n');
  if (lines.length < 2) return { jobs: [] };
  
  const dataLines = lines.slice(1);
  const jobs = [];
  
  for (const line of dataLines) {
    if (!line.trim()) continue;
    
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 6) {
      const id = parts[0];
      const name = parts[1];
      const statusIndex = parts.length - 4;
      const status = parts[statusIndex] || 'unknown';
      const scheduleParts = parts.slice(2, statusIndex - 2);
      const schedule = scheduleParts.join(' ');
      
      jobs.push({
        id,
        name,
        schedule,
        status,
        raw: line
      });
    }
  }
  
  return { jobs };
}

// ============================================================
// 检测问题
// ============================================================

function detectIssues(job) {
  const issues = [];
  const delivery = job.delivery || {};
  const payload = job.payload || {};
  const lastError = job.state?.lastError || '';
  const consecutiveErrors = job.state?.consecutiveErrors || 0;
  
  // 检测 Feishu delivery 问题
  if (lastError.includes('Delivering to Feishu requires target') || 
      lastError.includes('Request failed with status code 400')) {
    
    // 检查 delivery 配置
    if (!delivery.channel || delivery.channel !== 'feishu') {
      issues.push({
        type: 'feishu-channel',
        description: `channel 配置错误: ${delivery.channel || '(空)'}`,
        fix: `设置 channel 为 "feishu"`
      });
    }
    
    if (!delivery.to || delivery.to === '') {
      issues.push({
        type: 'feishu-to-missing',
        description: 'to 配置缺失',
        fix: `设置 to 为 "${FEISHU_OPEN_ID}"`
      });
    } else if (delivery.to.includes('user:openId:')) {
      issues.push({
        type: 'feishu-to-format',
        description: `to 格式错误: 应为纯 openId，不应包含 "user:openId:" 前缀`,
        fix: `设置 to 为 "${FEISHU_OPEN_ID}"`
      });
    }
  }
  
  // 检测 timeout 问题
  if (lastError.includes('timeout') && payload.timeoutSeconds < 600) {
    issues.push({
      type: 'timeout-low',
      description: `timeout 过低: ${payload.timeoutSeconds}s`,
      fix: `增加 timeoutSeconds 到 ${CONFIG.DEFAULT_TIMEOUT}s`
    });
  }
  
  return issues;
}

// ============================================================
// 应用修复
// ============================================================

function applyFix(job, issue) {
  try {
    // 创建备份
    createBackup(job);
    
    // 构建更新补丁
    const patch = buildPatch(job, issue);
    
    // 执行更新
    execSync(`openclaw cron update ${job.id} --json 2>/dev/null`, {
      input: JSON.stringify(patch),
      encoding: 'utf8',
      timeout: 10000
    });
    
    console.log(`     📝 已应用补丁: ${JSON.stringify(patch)}`);
    return true;
  } catch (error) {
    console.error(`     ❌ 修复失败: ${error.message}`);
    return false;
  }
}

// ============================================================
// 构建补丁
// ============================================================

function buildPatch(job, issue) {
  const patch = {};
  
  switch (issue.type) {
    case 'feishu-channel':
      patch.delivery = { ...job.delivery, channel: 'feishu' };
      break;
    case 'feishu-to-missing':
    case 'feishu-to-format':
      patch.delivery = { 
        ...job.delivery, 
        channel: 'feishu',
        to: FEISHU_OPEN_ID 
      };
      break;
    case 'timeout-low':
      patch.payload = { ...job.payload, timeoutSeconds: CONFIG.DEFAULT_TIMEOUT };
      break;
  }
  
  return patch;
}

// ============================================================
// 创建备份
// ============================================================

function createBackup(job) {
  try {
    const backupDir = CONFIG.BACKUP_DIR;
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `${job.name}-${timestamp}.json`);
    
    fs.writeFileSync(backupFile, JSON.stringify(job, null, 2));
    console.log(`     💾 已备份到: ${backupFile}`);
  } catch (error) {
    console.error(`     ⚠️  备份失败: ${error.message}`);
  }
}

// ============================================================
// 入口
// ============================================================

main();
