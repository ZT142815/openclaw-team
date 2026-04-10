#!/usr/bin/env node
/**
 * metrics-aggregator.js
 * 聚合所有监控数据到一个统一视图
 * 
 * 读取来源:
 * - monitoring/cron-health.json
 * - monitoring/dependency-vuln-report.json
 * - bugtracker/bugs.json
 * 
 * 输出: monitoring/metrics-dashboard.json
 */

const fs = require('fs');
const path = require('path');

const MONITORING_DIR = path.join(__dirname, '..', 'monitoring');
const BUGTRACKER_DIR = path.join(__dirname, '..', 'bugtracker');

function loadJSON(filepath, fallback = null) {
  try {
    if (fs.existsSync(filepath)) {
      return JSON.parse(fs.readFileSync(filepath, 'utf8'));
    }
  } catch (e) {
    // ignore
  }
  return fallback;
}

function calculateHealthScore(jobs) {
  if (!jobs || jobs.length === 0) return 100;
  const healthy = jobs.filter(j => j.status === 'healthy').length;
  const warning = jobs.filter(j => j.status === 'warning').length;
  const critical = jobs.filter(j => j.status === 'critical').length;
  const total = jobs.length;
  return Math.round(((healthy * 100) + (warning * 50) + (critical * 0)) / total);
}

function getVulnSummary(report) {
  if (!report) return { total: 0, critical: 0, high: 0, medium: 0, low: 0, status: 'unknown' };
  const { vulnerabilities = {}, scannedAt = 'unknown' } = report;
  const critical = vulnerabilities.critical?.length || 0;
  const high = vulnerabilities.high?.length || 0;
  const medium = vulnerabilities.medium?.length || 0;
  const low = vulnerabilities.low?.length || 0;
  const total = critical + high + medium + low;
  let status = 'healthy';
  if (total > 0) status = critical > 0 ? 'critical' : high > 0 ? 'warning' : 'healthy';
  return { total, critical, high, medium, low, status, scannedAt };
}

function getBugSummary() {
  const bugs = loadJSON(path.join(BUGTRACKER_DIR, 'bugs.json'), { bugs: [] });
  const open = bugs.bugs?.filter(b => b.status?.toLowerCase() !== 'closed').length || 0;
  const closed = bugs.bugs?.filter(b => b.status === 'closed').length || 0;
  return { open, closed, total: bugs.bugs?.length || 0 };
}

function aggregate() {
  const cronHealth = loadJSON(path.join(MONITORING_DIR, 'cron-health.json'), { jobs: [], timestamp: null });
  const vulnReport = loadJSON(path.join(MONITORING_DIR, 'dependency-vuln-report.json'), null);
  const bugSummary = getBugSummary();
  const vulnSummary = getVulnSummary(vulnReport);

  const healthScore = calculateHealthScore(cronHealth.jobs);
  const healthyJobs = cronHealth.jobs?.filter(j => j.status === 'healthy').length || 0;
  const totalJobs = cronHealth.jobs?.length || 0;

  // Calculate overall status
  let overallStatus = 'healthy';
  if (vulnSummary.status === 'critical' || healthScore < 50) overallStatus = 'critical';
  else if (vulnSummary.status === 'warning' || healthScore < 80 || bugSummary.open > 0) overallStatus = 'warning';

  const dashboard = {
    timestamp: new Date().toISOString(),
    overall: {
      status: overallStatus,
      healthScore,
      components: {
        cronJobs: { healthy: healthyJobs, total: totalJobs, status: healthyJobs === totalJobs ? 'healthy' : 'warning' },
        vulnerabilities: vulnSummary,
        bugs: bugSummary
      }
    },
    cronJobs: cronHealth.jobs.map(j => ({
      name: j.name,
      status: j.status,
      lastRun: j.lastRun,
      lastDuration: j.lastDuration,
      consecutiveErrors: j.consecutiveErrors,
      deliveryStatus: j.deliveryStatus,
      nextRun: j.nextRun
    })),
    vulnerabilities: vulnSummary,
    bugs: bugSummary,
    recommendations: []
  };

  // Add recommendations
  if (vulnSummary.critical > 0) {
    dashboard.recommendations.push(`🚨 ${vulnSummary.critical} critical vulnerabilities need immediate attention`);
  }
  if (vulnSummary.high > 0) {
    dashboard.recommendations.push(`⚠️ ${vulnSummary.high} high severity vulnerabilities should be fixed`);
  }
  if (bugSummary.open > 0) {
    dashboard.recommendations.push(`🐛 ${bugSummary.open} open bugs need resolution`);
  }
  if (healthyJobs < totalJobs) {
    dashboard.recommendations.push(`⏰ ${totalJobs - healthyJobs} cron job(s) are unhealthy`);
  }
  if (dashboard.recommendations.length === 0) {
    dashboard.recommendations.push('✅ All systems healthy');
  }

  // Write dashboard
  const dashboardPath = path.join(MONITORING_DIR, 'metrics-dashboard.json');
  fs.writeFileSync(dashboardPath, JSON.stringify(dashboard, null, 2));

  // Print summary
  console.log('📊 Metrics Dashboard Aggregated');
  console.log('─'.repeat(40));
  console.log(`Overall Status: ${overallStatus.toUpperCase()}`);
  console.log(`Health Score: ${healthScore}/100`);
  console.log(`Cron Jobs: ${healthyJobs}/${totalJobs} healthy`);
  console.log(`Vulnerabilities: ${vulnSummary.total} total (${vulnSummary.critical} critical, ${vulnSummary.high} high)`);
  console.log(`Bugs: ${bugSummary.open} open, ${bugSummary.closed} closed`);
  console.log('─'.repeat(40));
  dashboard.recommendations.forEach(r => console.log(r));
  console.log(`\nDashboard saved to: ${dashboardPath}`);

  return dashboard;
}

aggregate();
