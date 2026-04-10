#!/usr/bin/env node
/**
 * release-notes-generator.js
 * 自动化发布说明生成器
 * 
 * 功能:
 * - 从 Git commits 生成 changelog
 * - 按类型分组 (新功能、修复、改进、破坏性变更)
 * - 支持 Angular Commit Convention
 * - 生成多格式输出 (Markdown, JSON, HTML)
 * 
 * 用法:
 *   node release-notes-generator.js --from v1.0.0 --to v1.1.0
 *   node release-notes-generator.js --latest  # 生成自上次发布的 changelog
 *   node release-notes-generator.js --template markdown
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ============ CLI 解析 ============
const args = process.argv.slice(2);
let fromTag = null;
let toTag = null;
let latest = false;
let template = 'markdown';
let outputFile = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--from' && args[i + 1]) fromTag = args[++i];
  else if (args[i] === '--to' && args[i + 1]) toTag = args[++i];
  else if (args[i] === '--latest') latest = true;
  else if (args[i] === '--template' && args[i + 1]) template = args[++i];
  else if (args[i] === '--output' && args[i + 1]) outputFile = args[++i];
}

// ============ Commit 类型定义 ============
const COMMIT_TYPES = {
  feat: { name: '新功能', emoji: '✨', section: 'features', breaking: false },
  fix: { name: '问题修复', emoji: '🐛', section: 'bugfixes', breaking: false },
  docs: { name: '文档更新', emoji: '📝', section: 'documentation', breaking: false },
  style: { name: '代码格式', emoji: '💄', section: 'styles', breaking: false },
  refactor: { name: '代码重构', emoji: '♻️', section: 'refactors', breaking: false },
  perf: { name: '性能优化', emoji: '⚡', section: 'performance', breaking: false },
  test: { name: '测试相关', emoji: '🧪', section: 'tests', breaking: false },
  build: { name: '构建系统', emoji: '📦', section: 'builds', breaking: false },
  ci: { name: 'CI/CD', emoji: '🔧', section: 'ci', breaking: false },
  chore: { name: '杂项', emoji: '🔧', section: 'chores', breaking: false },
  revert: { name: '回滚', emoji: '⏪', section: 'reverts', breaking: false },
  BREAKING: { name: '破坏性变更', emoji: '💥', section: 'breaking', breaking: true },
};

// ============ 解析 Commit ============
function parseCommit(commitLine) {
  // 支持格式: <type>(<scope>): <subject> 或 <type>: <subject>
  const match = commitLine.match(/^(\w+)(\([^)]+\))?!?: (.+)$/);
  if (!match) return null;
  
  const [, type, scope, subject] = match;
  const breaking = commitLine.includes('!') || commitLine.includes('BREAKING CHANGE');
  
  return {
    type,
    scope: scope?.replace(/[()]/g, ''),
    subject,
    breaking,
  };
}

function getCommitDetails(hash) {
  try {
    const output = execSync(`git log -1 --format="%H|%s|%b" ${hash}`, { encoding: 'utf8' });
    const [fullHash, subject, body] = output.trim().split('|');
    return { fullHash, subject, body: body || '' };
  } catch (e) {
    return { fullHash: hash, subject: '', body: '' };
  }
}

// ============ 获取 Commits ============
function getCommits(from, to) {
  try {
    const range = from ? `${from}..${to}` : to;
    const output = execSync(`git log ${range} --format="%s" --reverse`, { encoding: 'utf8' });
    const lines = output.trim().split('\n').filter(Boolean);
    
    const commits = [];
    for (const line of lines) {
      const parsed = parseCommit(line);
      if (parsed) {
        commits.push(parsed);
      }
    }
    
    return commits;
  } catch (e) {
    console.error('⚠️  无法获取 Git commits:', e.message);
    return [];
  }
}

// ============ 生成器 ============
function generateMarkdown(data, version, date) {
  const { commits, fromTag, toTag } = data;
  
  let md = `# Release Notes - ${version}\n`;
  md += `**发布日期**: ${date}\n`;
  md += fromTag && toTag ? `**版本范围**: ${fromTag} → ${toTag}\n` : '';
  md += '\n';
  
  // 破坏性变更 (最优先)
  const breaking = commits.filter(c => c.breaking);
  if (breaking.length > 0) {
    md += '## 💥 破坏性变更\n\n';
    for (const c of breaking) {
      const scope = c.scope ? `**${c.scope}**: ` : '';
      md += `- ${scope}${c.subject}\n`;
    }
    md += '\n';
  }
  
  // 按类型分组
  const grouped = {};
  for (const commit of commits) {
    if (commit.breaking) continue;
    const section = COMMIT_TYPES[commit.type]?.section || 'other';
    if (!grouped[section]) grouped[section] = [];
    grouped[section].push(commit);
  }
  
  // 输出顺序
  const sectionOrder = ['features', 'bugfixes', 'performance', 'refactors', 'documentation', 'ci', 'builds', 'styles', 'tests', 'chores', 'reverts', 'other'];
  
  for (const section of sectionOrder) {
    const items = grouped[section];
    if (!items || items.length === 0) continue;
    
    const typeInfo = Object.values(COMMIT_TYPES).find(t => t.section === section);
    const emoji = typeInfo?.emoji || '📋';
    const name = typeInfo?.name || section;
    
    md += `## ${emoji} ${name}\n\n`;
    
    for (const c of items) {
      const scope = c.scope ? `**${c.scope}**: ` : '';
      md += `- ${scope}${c.subject}\n`;
    }
    md += '\n';
  }
  
  // 统计
  md += '---\n\n';
  md += `📊 **统计**: ${commits.length} 个变更`;
  if (grouped.features?.length) md += `, ${grouped.features.length} 个新功能`;
  if (grouped.bugfixes?.length) md += `, ${grouped.bugfixes.length} 个问题修复`;
  if (breaking.length) md += `, ${breaking.length} 个破坏性变更`;
  md += '\n';
  
  return md;
}

function generateJSON(data, version, date) {
  const { commits, fromTag, toTag } = data;
  
  const grouped = {};
  for (const commit of commits) {
    const section = commit.breaking ? 'breaking' : (COMMIT_TYPES[commit.type]?.section || 'other');
    if (!grouped[section]) grouped[section] = [];
    grouped[section].push({
      type: commit.type,
      scope: commit.scope,
      subject: commit.subject,
      breaking: commit.breaking,
    });
  }
  
  return JSON.stringify({
    version,
    releaseDate: date,
    range: fromTag && toTag ? { from: fromTag, to: toTag } : null,
    changes: grouped,
    stats: {
      total: commits.length,
      features: grouped.features?.length || 0,
      bugfixes: grouped.bugfixes?.length || 0,
      breaking: grouped.breaking?.length || 0,
    },
  }, null, 2);
}

function generateHTML(data, version, date) {
  const md = generateMarkdown(data, version, date);
  
  // 简单 Markdown → HTML 转换
  let html = md
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>\n');
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Release Notes - ${version}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; border-bottom: 2px solid #0066cc; padding-bottom: 10px; }
    h2 { color: #555; margin-top: 30px; }
    li { margin: 8px 0; }
    hr { margin: 30px 0; border: none; border-top: 1px solid #eee; }
  </style>
</head>
<body>
${html}
</body>
</html>`;
}

// ============ 主逻辑 ============
function main() {
  console.log('📝 Release Notes Generator');
  console.log('==========================\n');
  
  // 确定版本范围
  let from = fromTag;
  let to = toTag;
  
  if (latest || (!from && !to)) {
    // 获取最新 tag
    try {
      const tags = execSync('git tag --sort=-version:refname | head -5', { encoding: 'utf8' }).trim().split('\n');
      if (tags.length > 0 && tags[0]) {
        from = tags[0]; // 最新 tag 作为起点
        to = 'HEAD';
        console.log(`📌 检测到版本范围: ${from} → ${to}`);
      } else {
        // 无 tag，从第一个 commit 开始
        from = null;
        to = 'HEAD';
        console.log('📌 无 Git tags，从初始 commit 生成 changelog');
      }
    } catch (e) {
      from = null;
      to = 'HEAD';
    }
  } else if (from && !to) {
    to = 'HEAD';
  }
  
  // 获取 commits
  const commits = getCommits(from, to);
  
  if (commits.length === 0) {
    console.log('⚠️  未找到任何有效的 commits');
    console.log('\n提示: 使用 Angular Commit Convention 格式:');
    console.log('  feat(scope): add new feature');
    console.log('  fix: fix bug');
    console.log('  docs: update documentation');
    console.log('  style: code formatting');
    console.log('  refactor: code refactoring');
    console.log('  perf: performance improvement');
    console.log('  test: add tests');
    console.log('  build: build system changes');
    console.log('  ci: CI/CD changes');
    console.log('  chore: maintenance tasks');
    process.exit(0);
  }
  
  console.log(`📊 解析到 ${commits.length} 个 commits`);
  
  // 版本号
  const version = toTag || 'Unreleased';
  const date = new Date().toISOString().split('T')[0];
  
  const data = { commits, fromTag: from, toTag: to };
  
  // 生成输出
  let output;
  switch (template) {
    case 'json':
      output = generateJSON(data, version, date);
      break;
    case 'html':
      output = generateHTML(data, version, date);
      break;
    default:
      output = generateMarkdown(data, version, date);
  }
  
  // 输出
  if (outputFile) {
    fs.writeFileSync(outputFile, output);
    console.log(`\n✅ 已保存到: ${outputFile}`);
  } else {
    console.log('\n' + output);
  }
  
  // 同时保存到 CHANGELOG.md
  const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
  const header = `---
layout: page
title: Changelog
permalink: /changelog/
---
`;
  
  let existingContent = '';
  if (fs.existsSync(changelogPath)) {
    // 保留现有内容，但移除开头的 header
    existingContent = fs.readFileSync(changelogPath, 'utf8');
    existingContent = existingContent.replace(/^---\n.*?\n---\n/, '');
    
    // 检查是否已有相同版本
    if (existingContent.includes(`# Release Notes - ${version}\n`)) {
      console.log(`\n⚠️  CHANGELOG.md 已包含 ${version}，跳过更新`);
    } else {
      fs.writeFileSync(changelogPath, header + output + '\n\n' + existingContent);
      console.log(`\n✅ 已更新: ${changelogPath}`);
    }
  } else {
    fs.writeFileSync(changelogPath, header + output);
    console.log(`\n✅ 已创建: ${changelogPath}`);
  }
}

main();
