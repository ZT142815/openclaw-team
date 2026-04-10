#!/usr/bin/env node
/**
 * Steering Loop - 失败驱动的Harness自动改进
 * 
 * 功能:
 * 1. 分析FAILURES.md中的失败案例
 * 2. 识别重复失败模式
 * 3. 自动生成harness改进建议
 * 4. 更新相关配置文件
 */

const fs = require('fs');
const path = require('path');

const FAILURES_FILE = path.join(__dirname, '../FAILURES.md');
const AGENTS_FILE = path.join(__dirname, '../AGENTS.md');
const RULES_FILE = path.join(__dirname, '../RULES.md');

function parseFailures() {
  if (!fs.existsSync(FAILURES_FILE)) {
    console.log('FAILURES.md not found');
    return [];
  }
  
  const content = fs.readFileSync(FAILURES_FILE, 'utf-8');
  const failures = [];
  
  // 解析失败记录
  const regex = /### 失败 #(\d+)\n([\s\S]*?)(?=\n### 失败|$)/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    const id = match[1];
    const body = match[2];
    
    // 提取原因
    const causeMatch = body.match(/\*\*原因\*\*: (.+)/);
    const categoryMatch = body.match(/\*\*类别\*\*: (.+)/);
    
    failures.push({
      id,
      cause: causeMatch ? causeMatch[1] : 'unknown',
      category: categoryMatch ? categoryMatch[1] : 'unknown'
    });
  }
  
  return failures;
}

function analyzePatterns(failures) {
  const patterns = {};
  
  failures.forEach(f => {
    const key = `${f.category}:${f.cause}`;
    if (!patterns[key]) {
      patterns[key] = { count: 0, category: f.category, cause: f.cause };
    }
    patterns[key].count++;
  });
  
  // 返回重复3次以上的模式
  return Object.values(patterns).filter(p => p.count >= 3);
}

function generateImprovement(pattern) {
  const improvements = {
    'context-overflow': {
      file: 'skills/context-compaction/SKILL.md',
      action: '降低context阈值从40%到30%，增加压缩频率'
    },
    'handoff-missing': {
      file: 'templates/SESSION-PROTOCOL.md',
      action: '强化handoff checklist，增加必需字段校验'
    },
    'eval-not-triggered': {
      file: 'AGENTS.md',
      action: '在Developer后强制插入Evaluator步骤'
    },
    'test-flaky': {
      file: 'skills/test-stabilization/SKILL.md',
      action: '添加测试稳定性检查和重试机制'
    }
  };
  
  return improvements[pattern.cause] || {
    file: 'AGENTS.md',
    action: `通用改进: 加强对${pattern.category}的检查`
  };
}

function run() {
  console.log('=== Steering Loop ===');
  console.log('分析失败案例，改进harness...\n');
  
  const failures = parseFailures();
  console.log(`找到 ${failures.length} 个失败案例`);
  
  if (failures.length === 0) {
    console.log('无失败记录，无需改进');
    return;
  }
  
  const patterns = analyzePatterns(failures);
  console.log(`发现 ${patterns.length} 个重复模式 (>=3次)`);
  
  patterns.forEach((p, i) => {
    console.log(`\n模式 ${i + 1}: ${p.category} - ${p.cause} (${p.count}次)`);
    const imp = generateImprovement(p);
    console.log(`  建议: 改进 ${imp.file}`);
    console.log(`  动作: ${imp.action}`);
  });
  
  console.log('\n=== 完成 ===');
  console.log('Steering Loop 建议手动审查后实施');
}

run();
