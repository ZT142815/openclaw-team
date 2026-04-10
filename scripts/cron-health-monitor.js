#!/usr/bin/env node
/**
 * Cron Health Monitor v2
 * 
 * 功能：
 *   监控所有 cron 任务的健康状态
 *   检测连续错误、API 故障、delivery 问题
 *   输出结构化的健康报告
 * 
 * 使用方式：
 *   node cron-health-monitor.js
 *   node cron-health-monitor.js --json
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ============================================================
// 配置
// ============================================================

const CONFIG = {
  ERROR_THRESHOLD: 3,
  WARNING_THRESHOLD: 1,
  REPORT_PATH: path.join(process.env.HOME, '.openclaw/workspace-developer/monitoring/cron-health.json')
};

// ============================================================
// 主函数
// ============================================================

function main() {
  const args = process.argv.slice(2);
  const outputFormat = args.includes('--json') ? 'json' : 'text';
  
  console.log('🔍 Cron Health Monitor v2');
  console.log('========================\n');
  
  // 获取 cron 列表 (JSON)
  const cronData = getCronListJSON();
  
  // 分析每个任务的状态
  const healthReport = analyzeCronHealth(cronData);
  
  // 生成建议
  const recommendations = generateRecommendations(healthReport);
  
  // 输出报告
  if (outputFormat === 'json') {
    console.log(JSON.stringify(healthReport, null, 2));
  } else {
    printTextReport(healthReport, recommendations);
  }
  
  // 保存报告
  saveReport(healthReport);
  
  // 返回退出码
  const hasCritical = healthReport.criticalJobs > 0;
  process.exit(hasCritical ? 1 : 0);
}

// ============================================================
// 获取 Cron 列表 (JSON)
// ============================================================

function getCronListJSON() {
  try {
    const output = execSync('openclaw cron list --json 2>/dev/null', {
      encoding: 'utf8',
      timeout: 10000
    });
    return JSON.parse(output);
  } catch (error) {
    console.error('❌ 无法获取 cron 列表:', error.message);
    return { jobs: [], total: 0 };
  }
}

// ============================================================
// 分析 Cron 健康状态
// ============================================================

function analyzeCronHealth(cronData) {
  const jobs = cronData.jobs || [];
  const analysis = {
    timestamp: new Date().toISOString(),
    totalJobs: jobs.length,
    healthyJobs: 0,
    warningJobs: 0,
    criticalJobs: 0,
    jobs: []
  };
  
  for (const job of jobs) {
    const state = job.state || {};
    const status = state.lastRunStatus || state.lastStatus || 'unknown';
    const consecutiveErrors = state.consecutiveErrors || 0;
    const lastError = state.lastError || '';
    const lastDuration = state.lastDurationMs || 0;
    const deliveryStatus = state.lastDeliveryStatus || 'unknown';
    const nextRun = state.nextRunAtMs ? new Date(state.nextRunAtMs).toISOString() : null;
    const lastRun = state.lastRunAtMs ? new Date(state.lastRunAtMs).toISOString() : null;
    
    let jobStatus = 'healthy';
    let severity = 'none';
    
    // 判断状态
    if (status === 'error' || status === 'failed') {
      if (consecutiveErrors >= CONFIG.ERROR_THRESHOLD) {
        jobStatus = 'critical';
        severity = 'high';
        analysis.criticalJobs++;
      } else if (consecutiveErrors >= CONFIG.WARNING_THRESHOLD) {
        jobStatus = 'warning';
        severity = 'medium';
        analysis.warningJobs++;
      } else {
        jobStatus = 'warning';
        severity = 'low';
        analysis.warningJobs++;
      }
    } else if (status === 'running') {
      jobStatus = 'warning';
      severity = 'low';
      analysis.warningJobs++;
    } else if (status === 'ok') {
      analysis.healthyJobs++;
    }
    
    // 错误类型检测
    let errorType = null;
    let recoverySuggestion = null;
    
    if (jobStatus !== 'healthy') {
      if (lastError.includes('timeout')) {
        errorType = 'timeout';
        if (job.sessionTarget === 'isolated') {
          recoverySuggestion = 'isolated session 超时，考虑改用 main session 或增加 timeout';
        } else {
          recoverySuggestion = '任务超时，考虑简化任务或增加 timeoutSeconds';
        }
      } else if (lastError.includes('deliver') || deliveryStatus === 'failed') {
        errorType = 'delivery-failed';
        recoverySuggestion = 'Feishu delivery 失败，检查 channel/to 配置';
      } else if (lastError.includes('Feishu') || lastError.includes('400')) {
        errorType = 'feishu-api-error';
        recoverySuggestion = 'Feishu API 错误，检查 bot token 和权限';
      } else {
        errorType = 'unknown';
        recoverySuggestion = '检查 cron 任务配置和日志';
      }
    }
    
    // 检查 delivery 问题（即使状态是 ok）
    if (deliveryStatus === 'failed' || deliveryStatus === 'error') {
      errorType = 'delivery-failed';
      recoverySuggestion = recoverySuggestion || 'Feishu delivery 失败';
      if (jobStatus === 'healthy') {
        jobStatus = 'warning';
        severity = 'low';
        analysis.warningJobs++;
        analysis.healthyJobs--;
      }
    }
    
    // 解析 schedule
    let scheduleStr = '';
    if (job.schedule) {
      if (job.schedule.kind === 'cron') {
        scheduleStr = `cron ${job.schedule.expr}`;
        if (job.schedule.tz) scheduleStr += ` @ ${job.schedule.tz}`;
      } else if (job.schedule.kind === 'every') {
        const mins = Math.round((job.schedule.everyMs || 0) / 60000);
        scheduleStr = `every ${mins}m`;
      } else if (job.schedule.kind === 'at') {
        scheduleStr = `at ${job.schedule.at}`;
      }
    }
    
    analysis.jobs.push({
      id: job.id,
      name: job.name || job.description || 'unnamed',
      status: jobStatus,
      severity: severity,
      rawStatus: status,
      consecutiveErrors: consecutiveErrors,
      lastRunStatus: status,
      lastError: lastError,
      lastDuration: lastDuration,
      errorType: errorType,
      recoverySuggestion: recoverySuggestion,
      nextRun: nextRun,
      lastRun: lastRun,
      schedule: scheduleStr,
      deliveryStatus: deliveryStatus,
      sessionTarget: job.sessionTarget
    });
  }
  
  return analysis;
}

// ============================================================
// 生成建议
// ============================================================

function generateRecommendations(report) {
  const recommendations = [];
  
  for (const job of report.jobs) {
    if (job.status === 'critical' || job.status === 'warning') {
      recommendations.push({
        jobId: job.id,
        jobName: job.name,
        issue: `${job.consecutiveErrors} 次连续错误`,
        errorType: job.errorType,
        lastError: job.lastError.substring(0, 100),
        suggestion: job.recoverySuggestion,
        priority: job.status === 'critical' ? 'P0' : 'P1'
      });
    }
  }
  
  // 按优先级排序
  recommendations.sort((a, b) => {
    if (a.priority === 'P0' && b.priority !== 'P0') return -1;
    if (b.priority === 'P0' && a.priority !== 'P0') return 1;
    return b.consecutiveErrors - a.consecutiveErrors;
  });
  
  return recommendations;
}

// ============================================================
// 打印文本报告
// ============================================================

function printTextReport(report, recommendations) {
  console.log(`📊 总任务数: ${report.totalJobs}`);
  console.log(`✅ 健康: ${report.healthyJobs}`);
  console.log(`⚠️  警告: ${report.warningJobs}`);
  console.log(`❌ 严重: ${report.criticalJobs}`);
  console.log('');
  
  if (report.jobs.length > 0) {
    console.log('📋 任务详情:');
    for (const job of report.jobs) {
      const statusIcon = job.status === 'healthy' ? '✅' : job.status === 'warning' ? '⚠️' : '❌';
      console.log(`  ${statusIcon} ${job.name}`);
      console.log(`     状态: ${job.rawStatus} | 连续错误: ${job.consecutiveErrors} | Session: ${job.sessionTarget}`);
      if (job.lastError) {
        console.log(`     最后错误: ${job.lastError.substring(0, 80)}`);
      }
      if (job.lastDuration > 0) {
        console.log(`     最后耗时: ${Math.round(job.lastDuration/1000)}s`);
      }
      if (job.recoverySuggestion) {
        console.log(`     建议: ${job.recoverySuggestion}`);
      }
    }
  }
  
  if (recommendations.length > 0) {
    console.log('\n🔧 修复建议:');
    for (const rec of recommendations) {
      console.log(`  [${rec.priority}] ${rec.jobName}`);
      console.log(`     问题: ${rec.issue}`);
      if (rec.lastError) console.log(`     错误: ${rec.lastError}`);
      console.log(`     建议: ${rec.suggestion}`);
    }
  } else {
    console.log('\n✅ 所有 cron 任务运行正常');
  }
}

// ============================================================
// 保存报告
// ============================================================

function saveReport(report) {
  try {
    const monitoringDir = path.dirname(CONFIG.REPORT_PATH);
    if (!fs.existsSync(monitoringDir)) {
      fs.mkdirSync(monitoringDir, { recursive: true });
    }
    fs.writeFileSync(CONFIG.REPORT_PATH, JSON.stringify(report, null, 2));
  } catch (error) {
    console.error('❌ 保存报告失败:', error.message);
  }
}

// ============================================================
// 入口
// ============================================================

main();
