#!/usr/bin/env node
/**
 * Handoff Validator Skill for OpenClaw
 * 校验 Handoff Artifact 格式，确保交接正确
 */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

const VALID_ARTIFACT_TYPES = [
  'handoff_demand',
  'handoff_prd',
  'handoff_spec',
  'handoff_code',
  'handoff_test',
  'handoff_deploy'
];

const REQUIRED_FIELDS = ['artifact_type', 'version', 'timestamp', 'from_agent', 'to_agent', 'content'];
const REQUIRED_CONTENT_FIELDS = {
  'handoff_demand': ['demand_id', 'original_text', 'demand_type'],
  'handoff_prd': ['project_name', 'features'],
  'handoff_code': ['repo', 'branch', 'files'],
  'handoff_test': ['test_results', 'coverage'],
  'handoff_deploy': ['environment', 'artifacts']
};

function validateArtifact(artifact) {
  const errors = [];
  
  // 检查 artifact_type
  if (!artifact.artifact_type) {
    errors.push('缺少 artifact_type 字段');
  } else if (!VALID_ARTIFACT_TYPES.includes(artifact.artifact_type)) {
    errors.push(`未知的 artifact_type: ${artifact.artifact_type}`);
  }
  
  // 检查必填字段
  for (const field of REQUIRED_FIELDS) {
    if (!artifact[field]) {
      errors.push(`缺少必填字段: ${field}`);
    }
  }
  
  // 检查 content 必填字段
  if (artifact.artifact_type && REQUIRED_CONTENT_FIELDS[artifact.artifact_type]) {
    for (const field of REQUIRED_CONTENT_FIELDS[artifact.artifact_type]) {
      if (!artifact.content || !artifact.content[field]) {
        errors.push(`缺少 content.${field}`);
      }
    }
  }
  
  return errors;
}

function validateFile(filePath) {
  console.log(`\n🔍 校验文件: ${filePath}\n`);
  
  if (!fs.existsSync(filePath)) {
    console.log('❌ 文件不存在');
    return 1;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const artifact = JSON.parse(content);
    
    const errors = validateArtifact(artifact);
    
    if (errors.length === 0) {
      console.log('✅ Artifact 校验通过');
      console.log(`   类型: ${artifact.artifact_type}`);
      console.log(`   版本: ${artifact.version}`);
      console.log(`   发送方: ${artifact.from_agent}`);
      console.log(`   接收方: ${artifact.to_agent}`);
      console.log(`   时间戳: ${artifact.timestamp}`);
      return 0;
    } else {
      console.log('❌ Artifact 校验失败:');
      errors.forEach(e => console.log(`   - ${e}`));
      return 1;
    }
  } catch (e) {
    console.log('❌ JSON 解析失败:', e.message);
    return 1;
  }
}

if (args.includes('--help') || args.length === 0) {
  console.log(`
📋 Handoff Validator Skill

用法:
  node index.js <artifact.json>   校验 Artifact 文件
  node index.js --schema         显示 Schema 定义
  node index.js --help            显示帮助

支持的 Artifact 类型:
  handoff_demand   需求交接
  handoff_prd      PRD 交接
  handoff_spec     规格说明交接
  handoff_code     代码交接
  handoff_test     测试交接
  handoff_deploy   部署交接
`);
  process.exit(0);
}

if (args.includes('--schema')) {
  console.log('\n📋 支持的 Artifact 类型和必填字段：\n');
  VALID_ARTIFACT_TYPES.forEach(type => {
    const fields = REQUIRED_CONTENT_FIELDS[type] || [];
    console.log(`  ${type}:`);
    console.log(`    content: ${fields.length > 0 ? fields.join(', ') : '(无额外必填)'}`);
  });
  console.log();
  process.exit(0);
}

const exitCode = validateFile(args[0]);
process.exit(exitCode);
