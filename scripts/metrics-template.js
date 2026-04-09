/**
 * Metrics 收集脚本
 * 
 * 用于 CI/CD 环境中收集代码质量指标
 * 
 * 使用方式：
 * node metrics-collector.js --project ~/budolist --output metrics.json
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONFIG = {
  metrics: {
    codeCoverage: true,
    codeQuality: true,
    buildTime: true,
    testResults: true,
  }
};

function collectMetrics(projectPath, outputPath) {
  const metrics = {
    timestamp: new Date().toISOString(),
    project: projectPath,
    metrics: {},
  };

  // 1. 代码覆盖率
  if (CONFIG.metrics.codeCoverage) {
    try {
      const coverage = execSync(
        `cd ${projectPath} && flutter test --coverage && cat coverage/lcov.info | grep -E "^SF:.*\\.dart$" | wc -l`,
        { encoding: 'utf-8' }
      ).trim();
      metrics.metrics.codeCoverage = {
        filesWithCoverage: parseInt(coverage) || 0,
        status: 'collected',
      };
    } catch (e) {
      metrics.metrics.codeCoverage = { status: 'failed', error: e.message };
    }
  }

  // 2. 代码质量（Flutter Analyze）
  if (CONFIG.metrics.codeQuality) {
    try {
      const analyze = execSync(
        `cd ${projectPath} && flutter analyze --machine`,
        { encoding: 'utf-8' }
      );
      const result = JSON.parse(analyze);
      metrics.metrics.codeQuality = {
        errors: result.errors || 0,
        warnings: result.warnings || 0,
        hints: result.hints || 0,
        status: result.errors > 0 ? 'failed' : 'passed',
      };
    } catch (e) {
      metrics.metrics.codeQuality = { status: 'failed', error: e.message };
    }
  }

  // 3. 测试结果
  if (CONFIG.metrics.testResults) {
    try {
      const test = execSync(
        `cd ${projectPath} && flutter test --machine`,
        { encoding: 'utf-8' }
      );
      const lines = test.split('\n');
      const summary = lines.find(l => l.includes('"testDone"'));
      
      metrics.metrics.testResults = {
        status: 'collected',
        raw: summary || 'No summary',
      };
    } catch (e) {
      metrics.metrics.testResults = { status: 'failed', error: e.message };
    }
  }

  // 4. 构建时间
  if (CONFIG.metrics.buildTime) {
    metrics.metrics.buildTime = {
      note: 'Collected during CI build step',
    };
  }

  // 输出
  fs.writeFileSync(outputPath, JSON.stringify(metrics, null, 2));
  console.log(`📊 Metrics saved to: ${outputPath}`);
  
  return metrics;
}

// CLI
const args = process.argv.slice(2);
let projectPath = process.cwd();
let outputPath = 'metrics.json';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--project' && args[i + 1]) {
    projectPath = args[i + 1].replace(/^~/, require('os').homedir());
  }
  if (args[i] === '--output' && args[i + 1]) {
    outputPath = args[i + 1];
  }
}

projectPath = projectPath.replace(/^~/, require('os').homedir());
console.log(`🔍 Collecting metrics from: ${projectPath}`);

try {
  const result = collectMetrics(projectPath, outputPath);
  console.log('\n📊 Summary:');
  console.log(`   Code Quality: ${result.metrics.codeQuality?.status}`);
  console.log(`   Test Results: ${result.metrics.testResults?.status}`);
} catch (e) {
  console.error(`❌ Error: ${e.message}`);
  process.exit(1);
}
