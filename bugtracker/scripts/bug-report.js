#!/usr/bin/env node

/**
 * Bug Report CLI Tool
 * 
 * Usage:
 *   node bug-report.js new --title "标题" --severity S2 --description "描述"
 *   node bug-report.js list [--filter open|closed|all]
 *   node bug-report.js update BUG-001 --status In Progress
 *   node bug-report.js dashboard
 */

const fs = require('fs');
const path = require('path');

const BUGS_FILE = path.join(__dirname, '..', 'bugs.json');

// Load bugs database
function loadBugs() {
  try {
    const data = fs.readFileSync(BUGS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return { bugs: [], last_updated: new Date().toISOString().split('T')[0], stats: { total: 0, s0: 0, s1: 0, s2: 0, s3: 0, open: 0, closed: 0 } };
  }
}

// Save bugs database
function saveBugs(data) {
  // Update stats
  data.stats.total = data.bugs.length;
  data.stats.s0 = data.bugs.filter(b => b.severity === 'S0').length;
  data.stats.s1 = data.bugs.filter(b => b.severity === 'S1').length;
  data.stats.s2 = data.bugs.filter(b => b.severity === 'S2').length;
  data.stats.s3 = data.bugs.filter(b => b.severity === 'S3').length;
  data.stats.open = data.bugs.filter(b => b.status !== 'Closed').length;
  data.stats.closed = data.bugs.filter(b => b.status === 'Closed').length;
  data.last_updated = new Date().toISOString().split('T')[0];
  
  fs.writeFileSync(BUGS_FILE, JSON.stringify(data, null, 2));
  return data;
}

// Generate next bug ID
function generateBugId(data) {
  if (data.bugs.length === 0) return 'BUG-001';
  const maxId = data.bugs.reduce((max, b) => {
    const num = parseInt(b.id.replace('BUG-', ''), 10);
    return num > max ? num : max;
  }, 0);
  return `BUG-${String(maxId + 1).padStart(3, '0')}`;
}

// Parse command line args
const args = process.argv.slice(2);
const command = args[0];

if (command === 'new') {
  const options = {};
  for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].replace('--', '');
      options[key] = args[i + 1] || '';
      i++;
    }
  }
  
  if (!options.title || !options.severity) {
    console.error('Usage: node bug-report.js new --title "标题" --severity S0|S1|S2|S3 [--description "描述"]');
    process.exit(1);
  }
  
  const data = loadBugs();
  const bugId = generateBugId(data);
  
  const bug = {
    id: bugId,
    title: options.title,
    severity: options.severity,
    status: 'New',
    description: options.description || '',
    platform: options.platform || 'N/A',
    version: options.version || 'N/A',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    assignee: options.assignee || '',
    closed: null
  };
  
  data.bugs.push(bug);
  saveBugs(data);
  
  console.log(`✅ Created ${bugId}: ${options.title}`);
  console.log(`   Severity: ${options.severity}`);
  console.log(`   Status: New`);
  
} else if (command === 'list') {
  const filter = args[1] === '--filter' ? args[2] : 'all';
  const data = loadBugs();
  
  let bugs = data.bugs;
  if (filter === 'open') bugs = bugs.filter(b => b.status !== 'Closed');
  else if (filter === 'closed') bugs = bugs.filter(b => b.status === 'Closed');
  
  if (bugs.length === 0) {
    console.log('No bugs found.');
    return;
  }
  
  bugs.forEach(bug => {
    console.log(`${bug.id}: [${bug.severity}] ${bug.title}`);
    console.log(`   Status: ${bug.status} | Platform: ${bug.platform} | Created: ${bug.created.split('T')[0]}`);
    console.log();
  });
  
} else if (command === 'update') {
  const bugId = args[1];
  const statusArg = args.find(a => a.startsWith('--status='));
  
  if (!bugId || !statusArg) {
    console.error('Usage: node bug-report.js update BUG-001 --status="In Progress"');
    process.exit(1);
  }
  
  const newStatus = statusArg.replace('--status=', '');
  const data = loadBugs();
  const bug = data.bugs.find(b => b.id === bugId);
  
  if (!bug) {
    console.error(`Bug ${bugId} not found.`);
    process.exit(1);
  }
  
  bug.status = newStatus;
  bug.updated = new Date().toISOString();
  if (newStatus === 'Closed') bug.closed = new Date().toISOString();
  
  saveBugs(data);
  console.log(`✅ Updated ${bugId}: status → ${newStatus}`);
  
} else if (command === 'dashboard') {
  const data = loadBugs();
  
  console.log('📊 Bug Dashboard');
  console.log('================');
  console.log(`总数: ${data.stats.total} | 开放: ${data.stats.open} | 已关闭: ${data.stats.closed}`);
  console.log();
  console.log(`S0 崩溃: ${data.stats.s0}`);
  console.log(`S1 严重: ${data.stats.s1}`);
  console.log(`S2 中等: ${data.stats.s2}`);
  console.log(`S3 轻微: ${data.stats.s3}`);
  console.log();
  
  const openBugs = data.bugs.filter(b => b.status !== 'Closed');
  if (openBugs.length > 0) {
    console.log('开放 Bug:');
    openBugs.forEach(bug => {
      console.log(`- ${bug.id}: [${bug.severity}] ${bug.title} - ${bug.platform}`);
    });
  }
  
} else {
  console.log('Bug Report CLI');
  console.log('=============');
  console.log('Commands:');
  console.log('  new --title "标题" --severity S0|S1|S2|S3  创建新 Bug');
  console.log('  list [--filter open|closed|all]              列出 Bug');
  console.log('  update BUG-001 --status="In Progress"         更新 Bug 状态');
  console.log('  dashboard                                     显示仪表板');
}
