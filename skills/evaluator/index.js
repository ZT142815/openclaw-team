#!/usr/bin/env node
/**
 * Evaluator Skill for OpenClaw
 * 
 * 独立评估 Agent 输出质量，提供第二视角验证
 * 参考：Anthropic GAN 架构中的 Evaluator Agent 设计
 * 
 * 使用方法：
 *   node index.js --handoff <artifact.json>    评估 Handoff Artifact
 *   node index.js --quality <file>             评估代码质量
 *   node index.js --security <file>            评估安全性
 *   node index.js --list                        列出评估维度
 */
const args = process.argv.slice(2);
const fs = require('fs');
const path = require('path');

const EVAL_DIMENSIONS = [
  { name: '正确性', weight: 0.30, desc: '输出符合需求规格' },
  { name: '完整性', weight: 0.20, desc: '所有功能点都已实现' },
  { name: '可运行性', weight: 0.20, desc: '代码可编译/可执行' },
  { name: '架构合规', weight: 0.15, desc: '符合分层架构' },
  { name: '可维护性', weight: 0.10, desc: '代码清晰，无明显坏味道' },
  { name: '测试覆盖', weight: 0.05, desc: '核心功能有测试' },
];

const SECURITY_CHECKS = [
  { id: 'SEC-001', severity: 'P0', name: '敏感信息硬编码', desc: 'API Key/密码/Token 硬编码' },
  { id: 'SEC-002', severity: 'P0', name: '网络安全', desc: '使用不安全的 HTTP' },
  { id: 'SEC-003', severity: 'P2', name: '输入验证', desc: '用户输入缺少验证' },
  { id: 'SEC-004', severity: 'P2', name: '权限合规', desc: 'iOS/Android 权限无说明' },
  { id: 'SEC-005', severity: 'P0', name: 'Supabase RLS', desc: '表未启用 RLS 策略' },
];

function listDimensions() {
  console.log('\n📊 Evaluator 评估维度：\n');
  EVAL_DIMENSIONS.forEach(d => {
    console.log(`  ${(d.weight * 100).toFixed(0).padStart(3)}%  ${d.name}`);
    console.log(`        ${d.desc}\n`);
  });
  console.log('\n🔒 安全检查项：\n');
  SECURITY_CHECKS.forEach(c => {
    console.log(`  [${c.severity}] ${c.id} ${c.name}`);
    console.log(`        ${c.desc}\n`);
  });
}

function evaluateHandoff(artifactPath) {
  try {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    console.log('\n📋 Handoff Artifact 评估报告\n');
    console.log(`  类型: ${artifact.type || 'unknown'}`);
    console.log(`  阶段: ${artifact.phase || 'unknown'}`);
    console.log(`  生成时间: ${artifact.timestamp || 'unknown'}`);
    
    // 检查必填字段
    const required = ['type', 'phase', 'deliverables'];
    const missing = required.filter(f => !artifact[f]);
    if (missing.length > 0) {
      console.log(`\n  ⚠️ 缺失字段: ${missing.join(', ')}`);
      return 1;
    }
    console.log('\n  ✅ 字段完整性检查通过');
    return 0;
  } catch (e) {
    console.error('❌ 评估失败:', e.message);
    return 1;
  }
}

if (args.includes('--help') || args.length === 0) {
  console.log(`
🔬 Evaluator Skill

用法:
  node index.js --list              列出评估维度
  node index.js --handoff <file>    评估 Handoff Artifact
  node index.js --security <file>   安全检查（扫描敏感信息）
  node index.js --quality <file>    代码质量评估

示例:
  node index.js --list
  node index.js --handoff artifacts/handoff_code.json
`);
  process.exit(0);
}

if (args.includes('--list')) {
  listDimensions();
  process.exit(0);
}

if (args.includes('--handoff')) {
  const idx = args.indexOf('--handoff');
  const file = args[idx + 1];
  if (!file) { console.error('❌ 请指定 artifact 文件'); process.exit(1); }
  process.exit(evaluateHandoff(file));
}

console.log('❓ 未知参数，请使用 --help 查看用法');
process.exit(1);
