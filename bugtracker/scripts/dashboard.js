#!/usr/bin/env node

/**
 * Bug Dashboard - Real-time bug statistics and visualization
 */

const fs = require('fs');
const path = require('path');

const BUGS_FILE = path.join(__dirname, '..', 'bugs.json');

function loadBugs() {
  try {
    const data = fs.readFileSync(BUGS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return { 
      bugs: [], 
      last_updated: new Date().toISOString().split('T')[0], 
      stats: { total: 0, s0: 0, s1: 0, s2: 0, s3: 0, open: 0, closed: 0 } 
    };
  }
}

function calculateStats(data) {
  const stats = {
    total: data.bugs.length,
    s0: data.bugs.filter(b => b.severity === 'S0').length,
    s1: data.bugs.filter(b => b.severity === 'S1').length,
    s2: data.bugs.filter(b => b.severity === 'S2').length,
    s3: data.bugs.filter(b => b.severity === 'S3').length,
    open: data.bugs.filter(b => b.status !== 'Closed').length,
    closed: data.bugs.filter(b => b.status === 'Closed').length,
    byStatus: {},
    byPlatform: {},
    recent: []
  };
  
  // Count by status
  data.bugs.forEach(bug => {
    stats.byStatus[bug.status] = (stats.byStatus[bug.status] || 0) + 1;
    stats.byPlatform[bug.platform] = (stats.byPlatform[bug.platform] || 0) + 1;
  });
  
  // Recent bugs (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  stats.recent = data.bugs
    .filter(b => new Date(b.created) > weekAgo)
    .sort((a, b) => new Date(b.created) - new Date(a.created))
    .slice(0, 5);
  
  return stats;
}

function severityColor(severity) {
  switch (severity) {
    case 'S0': return '🔴';
    case 'S1': return '🟠';
    case 'S2': return '🟡';
    case 'S3': return '🟢';
    default: return '⚪';
  }
}

function statusEmoji(status) {
  switch (status) {
    case 'New': return '🆕';
    case 'Assigned': return '👤';
    case 'In Progress': return '🔧';
    case 'Verified': return '✅';
    case 'Closed': return '✔️';
    default: return '⚪';
  }
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return date.toISOString().split('T')[0];
}

// Main
const data = loadBugs();
const stats = calculateStats(data);

// Parse filter arg
const filterArg = process.argv.find(a => a.startsWith('--filter='));
const filter = filterArg ? filterArg.replace('--filter=', '') : null;

let bugsToShow = data.bugs;
if (filter === 'open') bugsToShow = data.bugs.filter(b => b.status !== 'Closed');
else if (filter === 'closed') bugsToShow = data.bugs.filter(b => b.status === 'Closed');
else if (filter === 's0') bugsToShow = data.bugs.filter(b => b.severity === 'S0');
else if (filter === 's1') bugsToShow = data.bugs.filter(b => b.severity === 'S1');

console.log('');
console.log('📊 Bug Dashboard');
console.log('================');
console.log(`最后更新: ${data.last_updated}`);
console.log('');
console.log(`总计: ${stats.total} | 🟢 开放: ${stats.open} | 🔵 已关闭: ${stats.closed}`);
console.log('');

// Severity breakdown with visual bar
console.log('按严重程度:');
const maxSev = Math.max(stats.s0 + stats.s1 + stats.s2 + stats.s3, 1);
const barLen = 20;
const s0Bar = '🔴'.repeat(Math.ceil(stats.s0 / maxSev * barLen));
const s1Bar = '🟠'.repeat(Math.ceil(stats.s1 / maxSev * barLen));
const s2Bar = '🟡'.repeat(Math.ceil(stats.s2 / maxSev * barLen));
const s3Bar = '🟢'.repeat(Math.ceil(stats.s3 / maxSev * barLen));
console.log(`  S0 崩溃 ${stats.s0} ${s0Bar || '─'}`);
console.log(`  S1 严重 ${stats.s1} ${s1Bar || '─'}`);
console.log(`  S2 中等 ${stats.s2} ${s2Bar || '─'}`);
console.log(`  S3 轻微 ${stats.s3} ${s3Bar || '─'}`);
console.log('');

// By platform
if (Object.keys(stats.byPlatform).length > 0) {
  console.log('按平台:');
  Object.entries(stats.byPlatform).forEach(([platform, count]) => {
    console.log(`  ${platform}: ${count}`);
  });
  console.log('');
}

// By status
if (Object.keys(stats.byStatus).length > 0) {
  console.log('按状态:');
  Object.entries(stats.byStatus).forEach(([status, count]) => {
    console.log(`  ${statusEmoji(status)} ${status}: ${count}`);
  });
  console.log('');
}

// Recent bugs
if (stats.recent.length > 0) {
  console.log('最近 7 天新建:');
  stats.recent.forEach(bug => {
    console.log(`  ${severityColor(bug.severity)} ${bug.id}: ${bug.title}`);
    console.log(`     ${statusEmoji(bug.status)} ${bug.status} | ${formatDate(bug.created)}`);
  });
  console.log('');
}

// Show filtered bugs
if (filter) {
  console.log(`筛选 "${filter}" (${bugsToShow.length}):`);
  if (bugsToShow.length === 0) {
    console.log('  无');
  } else {
    bugsToShow.forEach(bug => {
      console.log(`  ${severityColor(bug.severity)} ${bug.id}: ${bug.title}`);
      console.log(`     ${statusEmoji(bug.status)} ${bug.status} | ${bug.platform} | ${formatDate(bug.created)}`);
    });
  }
  console.log('');
}

console.log('----------------');
console.log('用法: node dashboard.js [--filter=open|closed|s0|s1]');
console.log('');

// Export JSON if requested
if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ data, stats }, null, 2));
}
