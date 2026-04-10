#!/usr/bin/env node
/**
 * Entropy Check Script
 * 
 * 熵管理轻量检查脚本 - 直接执行，无 agent overhead
 * 
 * 功能：
 * 1. 检查 patterns.json 模式数量
 * 2. 检查 memory/ 下的旧文件（> 7天）
 * 3. 检查 workspace 日志大小
 * 
 * 输出：简洁的 JSON 报告或 "熵管理检查完成：无异常"
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const HOME = os.homedir();

function getToday() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getYesterday() {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function fixSymlinks() {
  const workspaces = ['workspace', 'workspace-product', 'workspace-developer', 'workspace-tester'];
  const today = getToday();
  const yesterday = getYesterday();
  const fixed = [];
  
  for (const ws of workspaces) {
    const memDir = path.join(HOME, '.openclaw', ws, 'memory');
    if (!fs.existsSync(memDir)) continue;
    
    const todayFile = `${today}.md`;
    const yesterdayFile = `${yesterday}.md`;
    const todayLink = path.join(memDir, 'today.md');
    const yesterdayLink = path.join(memDir, 'yesterday.md');
    
    // Check today.md
    if (fs.existsSync(todayLink)) {
      const stat = fs.lstatSync(todayLink);
      if (stat.isSymbolicLink()) {
        const target = fs.readlinkSync(todayLink);
        if (target !== todayFile) {
          fs.unlinkSync(todayLink);
          fs.symlinkSync(todayFile, todayLink);
          fixed.push(`${ws}/today.md: ${target} -> ${todayFile}`);
        }
      }
    }
    
    // Check yesterday.md
    if (fs.existsSync(yesterdayLink)) {
      const stat = fs.lstatSync(yesterdayLink);
      if (stat.isSymbolicLink()) {
        const target = fs.readlinkSync(yesterdayLink);
        if (target !== yesterdayFile) {
          fs.unlinkSync(yesterdayLink);
          fs.symlinkSync(yesterdayFile, yesterdayLink);
          fixed.push(`${ws}/yesterday.md: ${target} -> ${yesterdayFile}`);
        }
      }
    }
  }
  return fixed;
}

function main() {
  const findings = [];
  
  // 0. 自动修复 symlinks
  const symlinkFixes = fixSymlinks();
  if (symlinkFixes.length > 0) {
    findings.push({ type: 'symlinks_fixed', count: symlinkFixes.length, files: symlinkFixes, message: `修复了 ${symlinkFixes.length} 个过期 symlinks` });
  }
  
  // 1. 检查 patterns.json 数量
  const patternsPath = path.join(HOME, '.openclaw/trajectories/patterns/patterns.json');
  if (fs.existsSync(patternsPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(patternsPath, 'utf8'));
      const count = (data.patterns?.length || 0) + (data.failure_patterns?.length || 0);
      if (count > 10) {
        findings.push({ type: 'patterns', count, message: `patterns数量${count} > 10，建议清理` });
      }
    } catch (e) {
      findings.push({ type: 'error', message: `patterns.json读取失败: ${e.message}` });
    }
  }
  
  // 2. 检查 memory/ 旧文件
  const memoryDir = path.join(HOME, '.openclaw/workspace/memory');
  if (fs.existsSync(memoryDir)) {
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const files = fs.readdirSync(memoryDir).filter(f => f.match(/^\d{4}-\d{2}-\d{2}/));
    const oldFiles = files.filter(f => {
      const stat = fs.statSync(path.join(memoryDir, f));
      return (now - stat.mtimeMs) > sevenDays;
    });
    if (oldFiles.length > 0) {
      findings.push({ type: 'old_memory_files', count: oldFiles.length, files: oldFiles.slice(0, 5) });
    }
  }
  
  // 3. 检查日志大小
  const logDir = path.join(HOME, '.openclaw/logs');
  if (fs.existsSync(logDir)) {
    let totalSize = 0;
    const logFiles = fs.readdirSync(logDir).filter(f => f.endsWith('.log'));
    logFiles.forEach(f => {
      const stat = fs.statSync(path.join(logDir, f));
      totalSize += stat.size;
    });
    if (totalSize > 100 * 1024 * 1024) { // > 100MB
      findings.push({ type: 'log_size', size_mb: Math.round(totalSize / 1024 / 1024), message: `日志总大小${Math.round(totalSize/1024/1024)}MB > 100MB` });
    }
  }
  
  // 输出结果
  if (findings.length > 0) {
    const output = {
      timestamp: new Date().toISOString(),
      entropy_check: 'findings',
      findings: findings
    };
    console.log(JSON.stringify(output, null, 2));
  } else {
    console.log('熵管理检查完成：无异常');
  }
}

main();
