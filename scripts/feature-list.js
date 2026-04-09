#!/usr/bin/env node
/**
 * Feature List Manager
 *
 * 功能清单管理脚本
 * 用途：
 *   1. 从 PRD 生成 feature_list.json
 *   2. 更新功能状态（pass/fail/in_progress）
 *   3. 验证功能完整性
 *   4. 统计进度
 *
 * 使用方式：
 *   node feature-list.js --project [项目路径] --action [action] [参数]
 *
 * Actions:
 *   init      - 初始化空的功能清单
 *   add       - 添加功能（需配合 --title --category --priority）
 *   update    - 更新功能状态（需配合 --id --status）
 *   list      - 列出所有功能
 *   summary   - 显示进度摘要
 *   validate  - 验证功能清单完整性
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  template: {
    version: "1.0",
    description: "功能清单 - 跟踪每个功能的实现状态",
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      inProgress: 0,
      notStarted: 0
    }
  },
  validStatuses: ['passed', 'failed', 'in_progress', 'not_started'],
  validCategories: ['functional', 'performance', 'security', 'ux', 'infrastructure'],
  validPriorities: ['P0', 'P1', 'P2', 'P3']
};

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    projectPath: process.cwd(),
    action: null,
    featureId: null,
    status: null,
    title: null,
    category: 'functional',
    priority: 'P1',
    description: null,
    steps: []
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--project':
        options.projectPath = args[++i].replace(/^~/, require('os').homedir());
        break;
      case '--action':
        options.action = args[++i];
        break;
      case '--id':
        options.featureId = args[++i];
        break;
      case '--status':
        options.status = args[++i];
        break;
      case '--title':
        options.title = args[++i];
        break;
      case '--category':
        options.category = args[++i];
        break;
      case '--priority':
        options.priority = args[++i];
        break;
      case '--desc':
        options.description = args[++i];
        break;
      case '--steps':
        // 逗号分隔的步骤列表
        options.steps = args[++i].split(',').map(s => s.trim());
        break;
    }
  }

  return options;
}

// 加载功能清单
function loadFeatureList(projectPath) {
  const filePath = path.join(projectPath, 'feature_list.json');
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

// 保存功能清单
function saveFeatureList(projectPath, data) {
  const filePath = path.join(projectPath, 'feature_list.json');
  data.lastModified = new Date().toISOString();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// 重新计算摘要
function recalculateSummary(data) {
  const summary = {
    total: data.features.length,
    passed: 0,
    failed: 0,
    inProgress: 0,
    notStarted: 0
  };

  for (const feature of data.features) {
    switch (feature.status) {
      case 'passed': summary.passed++; break;
      case 'failed': summary.failed++; break;
      case 'in_progress': summary.inProgress++; break;
      case 'not_started': summary.notStarted++; break;
    }
  }

  data.summary = summary;
}

// 生成下一个功能 ID
function generateFeatureId(data) {
  if (data.features.length === 0) return 'F001';
  const maxId = data.features
    .map(f => parseInt(f.id.replace('F', '')))
    .reduce((a, b) => Math.max(a, b), 0);
  return `F${String(maxId + 1).padStart(3, '0')}`;
}

// Action: init - 初始化功能清单
function actionInit(projectPath, options) {
  const filePath = path.join(projectPath, 'feature_list.json');
  if (fs.existsSync(filePath)) {
    console.log('⚠️  feature_list.json 已存在');
    return;
  }

  const pubspecPath = path.join(projectPath, 'pubspec.yaml');
  let projectName = 'unknown';
  if (fs.existsSync(pubspecPath)) {
    const content = fs.readFileSync(pubspecPath, 'utf-8');
    const match = content.match(/^name:\s*(.+)$/m);
    if (match) projectName = match[1].trim();
  }

  const data = {
    ...CONFIG.template,
    project: projectName,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString()
  };

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`✅ 功能清单已创建: ${filePath}`);
}

// Action: add - 添加功能
function actionAdd(projectPath, options) {
  if (!options.title) {
    console.error('❌ 缺少 --title 参数');
    process.exit(1);
  }

  const data = loadFeatureList(projectPath);
  if (!data) {
    console.error('❌ feature_list.json 不存在，请先运行 init');
    process.exit(1);
  }

  const newFeature = {
    id: generateFeatureId(data),
    title: options.title,
    category: options.category,
    priority: options.priority,
    description: options.description || options.title,
    steps: options.steps.length > 0 ? options.steps : [],
    status: 'not_started',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    testEvidence: null
  };

  data.features.push(newFeature);
  recalculateSummary(data);
  saveFeatureList(projectPath, data);

  console.log(`✅ 功能已添加: ${newFeature.id} - ${newFeature.title}`);
  console.log(`   状态: ${newFeature.status}`);
  console.log(`   优先级: ${newFeature.priority}`);
}

// Action: update - 更新功能状态
function actionUpdate(projectPath, options) {
  if (!options.featureId || !options.status) {
    console.error('❌ 缺少 --id 或 --status 参数');
    process.exit(1);
  }

  if (!CONFIG.validStatuses.includes(options.status)) {
    console.error(`❌ 无效的状态: ${options.status}`);
    console.error(`   有效值: ${CONFIG.validStatuses.join(', ')}`);
    process.exit(1);
  }

  const data = loadFeatureList(projectPath);
  if (!data) {
    console.error('❌ feature_list.json 不存在');
    process.exit(1);
  }

  const feature = data.features.find(f => f.id === options.featureId);
  if (!feature) {
    console.error(`❌ 功能不存在: ${options.featureId}`);
    process.exit(1);
  }

  const oldStatus = feature.status;
  feature.status = options.status;
  feature.updatedAt = new Date().toISOString();

  // 如果标记为 passed，记录时间
  if (options.status === 'passed' && !feature.completedAt) {
    feature.completedAt = new Date().toISOString();
  }

  recalculateSummary(data);
  saveFeatureList(projectPath, data);

  console.log(`✅ 功能状态已更新: ${feature.id}`);
  console.log(`   ${oldStatus} → ${feature.status}`);
}

// Action: list - 列出所有功能
function actionList(projectPath) {
  const data = loadFeatureList(projectPath);
  if (!data) {
    console.error('❌ feature_list.json 不存在');
    process.exit(1);
  }

  console.log(`\n📋 ${data.project} - 功能清单`);
  console.log(`   版本: ${data.version}`);
  console.log(`   进度: ${data.summary.passed}/${data.summary.total} 已通过`);
  console.log('');

  const statusIcons = {
    passed: '✅',
    failed: '❌',
    in_progress: '🔄',
    not_started: '⬜'
  };

  for (const feature of data.features) {
    const icon = statusIcons[feature.status] || '?';
    const id = feature.id.padEnd(6);
    const priority = feature.priority.padEnd(3);
    const title = feature.title.substring(0, 40);

    console.log(`  ${icon} [${id}] [${priority}] ${title}`);
  }

  console.log('');
}

// Action: summary - 显示进度摘要
function actionSummary(projectPath) {
  const data = loadFeatureList(projectPath);
  if (!data) {
    console.error('❌ feature_list.json 不存在');
    process.exit(1);
  }

  const percent = data.summary.total > 0
    ? Math.round((data.summary.passed / data.summary.total) * 100)
    : 0;

  const barLength = 20;
  const filled = Math.round(barLength * data.summary.passed / Math.max(data.summary.total, 1));
  const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);

  console.log(`\n📊 ${data.project} - 进度摘要`);
  console.log('');
  console.log(`  [${bar}] ${percent}%`);
  console.log('');
  console.log(`  ✅ 通过: ${data.summary.passed}`);
  console.log(`  🔄 进行中: ${data.summary.inProgress}`);
  console.log(`  ❌ 失败: ${data.summary.failed}`);
  console.log(`  ⬜ 未开始: ${data.summary.notStarted}`);
  console.log(`  ──────────────`);
  console.log(`  总计: ${data.summary.total}`);
  console.log('');

  // 显示下一个待办
  const nextFeature = data.features.find(f => f.status !== 'passed');
  if (nextFeature) {
    console.log(`  📌 下一个: ${nextFeature.id} - ${nextFeature.title}`);
    console.log(`     优先级: ${nextFeature.priority}`);
    console.log('');
  }
}

// Action: validate - 验证完整性
function actionValidate(projectPath) {
  const data = loadFeatureList(projectPath);
  if (!data) {
    console.error('❌ feature_list.json 不存在');
    process.exit(1);
  }

  console.log(`\n🔍 验证功能清单: ${data.project}`);
  console.log('');

  const errors = [];
  const warnings = [];

  // 检查必填字段
  if (!data.project) errors.push('缺少 project 字段');
  if (!data.version) errors.push('缺少 version 字段');
  if (!data.features || data.features.length === 0) {
    warnings.push('功能列表为空');
  }

  // 检查每个功能
  for (const feature of data.features) {
    if (!feature.id) errors.push('存在缺少 id 的功能');
    if (!feature.title) errors.push(`功能缺少 title: ${feature.id}`);
    if (!CONFIG.validStatuses.includes(feature.status)) {
      errors.push(`功能状态无效: ${feature.id}`);
    }
    if (!CONFIG.validCategories.includes(feature.category)) {
      warnings.push(`功能分类未识别: ${feature.id} - ${feature.category}`);
    }
  }

  // 检查进度一致性
  const calculated = { ...data.summary };
  recalculateSummary(data);
  if (JSON.stringify(calculated) !== JSON.stringify(data.summary)) {
    warnings.push('摘要统计数据不一致（已自动修正）');
  }

  if (errors.length > 0) {
    console.log('  ❌ 错误:');
    for (const e of errors) console.log(`     - ${e}`);
    console.log('');
  }

  if (warnings.length > 0) {
    console.log('  ⚠️  警告:');
    for (const w of warnings) console.log(`     - ${w}`);
    console.log('');
  }

  if (errors.length === 0) {
    console.log('  ✅ 验证通过');
    if (warnings.length === 0) {
      console.log('  ✅ 无警告');
    }
  }

  console.log('');
  process.exit(errors.length > 0 ? 1 : 0);
}

// 主入口
function main() {
  const options = parseArgs();

  if (!options.action) {
    console.log(`
📋 Feature List Manager - 功能清单管理

用法:
  node feature-list.js --action [action] [选项]

Actions:
  init      - 初始化功能清单
  add       - 添加功能
  update    - 更新功能状态
  list      - 列出所有功能
  summary   - 显示进度摘要
  validate  - 验证功能清单完整性

示例:
  node feature-list.js --action init
  node feature-list.js --action add --title "用户注册" --priority P0 --category functional
  node feature-list.js --action update --id F001 --status passed
  node feature-list.js --action summary
  node feature-list.js --action validate
`);
    process.exit(1);
  }

  // 确保路径是绝对路径
  options.projectPath = path.resolve(options.projectPath.replace(/^~/, require('os').homedir()));

  switch (options.action) {
    case 'init':
      actionInit(options.projectPath, options);
      break;
    case 'add':
      actionAdd(options.projectPath, options);
      break;
    case 'update':
      actionUpdate(options.projectPath, options);
      break;
    case 'list':
      actionList(options.projectPath);
      break;
    case 'summary':
      actionSummary(options.projectPath);
      break;
    case 'validate':
      actionValidate(options.projectPath);
      break;
    default:
      console.error(`❌ 未知 action: ${options.action}`);
      process.exit(1);
  }
}

main();
