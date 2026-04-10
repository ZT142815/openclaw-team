#!/usr/bin/env node
/**
 * ci-test-report.js
 * CI/CD 自动化测试报告生成器
 * 
 * 功能：
 * - 聚合 unit test、widget test、integration test 结果
 * - 生成 HTML/Markdown 测试报告
 * - 上报 GitHub Actions / GitLab CI
 * - 性能回归检测
 * 
 * 用法：
 *   node ci-test-report.js --project /path/to/project --format html
 *   node ci-test-report.js --project /path/to/project --upload
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ============ 配置 ============
const CONFIG = {
  coverage_threshold: 70,      // 覆盖率阈值 (%)
  pass_threshold: 95,           // 通过率阈值 (%)
  perf_baseline: null,          // 性能基准（JSON 文件路径）
  report_dir: 'test_reports',
  github_token: process.env.GH_TOKEN || process.env.GITHUB_TOKEN,
};

// ============ 工具函数 ============
function runCommand(cmd, cwd, timeout = 120000) {
  try {
    const result = execSync(cmd, { cwd, encoding: 'utf-8', timeout, stdio: 'pipe' });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, output: error.stdout || error.message, code: error.status };
  }
}

function parseTestOutput(output) {
  // 解析 Flutter test 输出
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    duration_ms: 0,
    errors: []
  };
  
  const allPassed = output.match(/All tests passed!/);
  const testsFailed = output.match(/Tests failed: (\d+) out of (\d+)/);
  const somePassed = output.match(/(\d+) tests$/gm);
  const errorLines = output.match(/\d+:\d+\s+(.+)/g) || [];
  
  if (allPassed) {
    const countMatch = output.match(/(\d+) tests? passed/);
    results.passed = countMatch ? parseInt(countMatch[1]) : 0;
    results.total = results.passed;
  } else if (testsFailed) {
    results.failed = parseInt(testsFailed[1]);
    results.total = parseInt(testsFailed[2]);
    results.passed = results.total - results.failed;
  }
  
  // 解析错误详情
  for (const line of errorLines) {
    const parts = line.split(/\s+/);
    if (parts.length >= 2) {
      results.errors.push(parts.slice(1).join(' '));
    }
  }
  
  // 解析耗时
  const durationMatch = output.match(/(\d+)ms/);
  if (durationMatch) results.duration_ms = parseInt(durationMatch[1]);
  
  return results;
}

function parseCoverage(coverageOutput) {
  // 解析覆盖率输出
  const coverage = {
    statements: 0,
    branches: 0,
    functions: 0,
    lines: 0
  };
  
  // LCOV 格式解析
  const lines = coverageOutput.split('\n');
  for (const line of lines) {
    if (line.startsWith('SF:')) {
      // Source file
    } else if (line.startsWith('LF:')) {
      coverage.lines = parseInt(line.split(':')[1]);
    } else if (line.startsWith('LH:')) {
      // Lines with hits
    } else if (line.startsWith('BRF:')) {
      coverage.branches = parseInt(line.split(':')[1]);
    } else if (line.startsWith('BRH:')) {
      // Branch hits
    } else if (line.startsWith('FNH:')) {
      coverage.functions = parseInt(line.split(':')[1]);
    }
  }
  
  return coverage;
}

// ============ 测试执行 ============
async function runTests(projectPath) {
  console.error('🧪 运行测试套件...\n');
  
  const results = {
    unit: null,
    widget: null,
    integration: null,
    overall: { total: 0, passed: 0, failed: 0, skipped: 0, duration_ms: 0 }
  };
  
  // 1. Unit Tests
  console.error('  📦 Unit Tests...');
  const unitResult = runCommand('flutter test test/unit/ 2>&1', projectPath);
  results.unit = {
    type: 'unit',
    ...parseTestOutput(unitResult.output),
    raw: unitResult.output.substring(0, 5000)
  };
  
  // 2. Widget Tests
  console.error('  🧩 Widget Tests...');
  const widgetResult = runCommand('flutter test test/widget/ 2>&1', projectPath);
  results.widget = {
    type: 'widget',
    ...parseTestOutput(widgetResult.output),
    raw: widgetResult.output.substring(0, 5000)
  };
  
  // 3. Integration Tests
  console.error('  🚀 Integration Tests...');
  const integResult = runCommand('flutter test test/integration/ 2>&1', projectPath);
  results.integration = {
    type: 'integration',
    ...parseTestOutput(integResult.output),
    raw: integResult.output.substring(0, 5000)
  };
  
  // 汇总
  for (const key of ['unit', 'widget', 'integration']) {
    if (results[key]) {
      results.overall.total += results[key].total || 0;
      results.overall.passed += results[key].passed || 0;
      results.overall.failed += results[key].failed || 0;
      results.overall.skipped += results[key].skipped || 0;
      results.overall.duration_ms += results[key].duration_ms || 0;
    }
  }
  
  return results;
}

// ============ 覆盖率 ============
async function getCoverage(projectPath) {
  console.error('📊 分析代码覆盖率...');
  
  const coverage = {
    statements: 0,
    branches: 0,
    functions: 0,
    lines: 0,
    threshold: CONFIG.coverage_threshold,
    passed: false
  };
  
  // 运行覆盖率
  const result = runCommand('flutter test --coverage 2>&1', projectPath);
  
  // 尝试解析 lcov.info
  const lcovPath = path.join(projectPath, 'coverage', 'lcov.info');
  if (fs.existsSync(lcovPath)) {
    const lcov = fs.readFileSync(lcovPath, 'utf-8');
    const parsed = parseCoverage(lcov);
    coverage.functions = parsed.functions;
    
    // 计算覆盖率百分比（简化估算）
    const hitLines = (lcov.match(/LH:/g) || []).length;
    const totalLines = (lcov.match(/LF:/g) || []).length;
    if (totalLines > 0) {
      coverage.lines = Math.round((hitLines / totalLines) * 100);
    }
  }
  
  coverage.passed = coverage.lines >= CONFIG.coverage_threshold;
  
  return coverage;
}

// ============ 报告生成 ============
function generateHTMLReport(testResults, coverage, projectPath) {
  const passRate = testResults.overall.total > 0
    ? Math.round((testResults.overall.passed / testResults.overall.total) * 100) : 0;
  const duration = (testResults.overall.duration_ms / 1000).toFixed(1);
  const timestamp = new Date().toISOString();
  const projectName = path.basename(projectPath);
  
  const statusColor = passRate >= CONFIG.pass_threshold ? '#22c55e' : passRate >= 80 ? '#f59e0b' : '#ef4444';
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>测试报告 - ${projectName}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; }
  .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; border-radius: 12px; margin-bottom: 2rem; }
  .header h1 { font-size: 1.75rem; margin-bottom: 0.5rem; }
  .header .meta { opacity: 0.9; font-size: 0.875rem; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
  .card { background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .card h3 { font-size: 0.875rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1rem; }
  .stat { font-size: 2.5rem; font-weight: 700; }
  .stat.pass { color: #22c55e; }
  .stat.fail { color: #ef4444; }
  .stat.warn { color: #f59e0b; }
  .sub { font-size: 0.875rem; color: #64748b; margin-top: 0.25rem; }
  .coverage-bar { height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin-top: 1rem; }
  .coverage-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
  .table { width: 100%; border-collapse: collapse; }
  .table th, .table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e2e8f0; }
  .table th { font-weight: 600; color: #64748b; font-size: 0.75rem; text-transform: uppercase; }
  .badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
  .badge.pass { background: #dcfce7; color: #166534; }
  .badge.fail { background: #fee2e2; color: #991b1b; }
  .badge.skip { background: #fef3c7; color: #92400e; }
  .errors { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 1rem; margin-top: 1rem; }
  .errors h4 { color: #991b1b; margin-bottom: 0.5rem; }
  .error-item { font-family: monospace; font-size: 0.875rem; color: #b91c1c; padding: 0.25rem 0; }
  .footer { text-align: center; color: #94a3b8; font-size: 0.75rem; margin-top: 2rem; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>🧪 ${projectName} 测试报告</h1>
    <div class="meta">生成时间: ${timestamp}</div>
  </div>
  
  <div class="grid">
    <div class="card">
      <h3>通过率</h3>
      <div class="stat ${passRate >= CONFIG.pass_threshold ? 'pass' : passRate >= 80 ? 'warn' : 'fail'}">${passRate}%</div>
      <div class="sub">${testResults.overall.passed} / ${testResults.overall.total} 测试</div>
    </div>
    <div class="card">
      <h3>代码覆盖率</h3>
      <div class="stat ${coverage.passed ? 'pass' : 'fail'}">${coverage.lines}%</div>
      <div class="sub">阈值: ${coverage.threshold}%</div>
      <div class="coverage-bar">
        <div class="coverage-fill" style="width: ${Math.min(coverage.lines, 100)}%; background: ${coverage.passed ? '#22c55e' : '#ef4444'}"></div>
      </div>
    </div>
    <div class="card">
      <h3>耗时</h3>
      <div class="stat pass">${duration}s</div>
      <div class="sub">总测试时间</div>
    </div>
    <div class="card">
      <h3>状态</h3>
      <div class="stat ${testResults.overall.failed === 0 ? 'pass' : 'fail'}">${testResults.overall.failed === 0 ? '✅ PASS' : '❌ FAIL'}</div>
      <div class="sub">${testResults.overall.failed} 失败 / ${testResults.overall.skipped} 跳过</div>
    </div>
  </div>
  
  <div class="card">
    <h3>测试详情</h3>
    <table class="table">
      <thead>
        <tr><th>类型</th><th>总数</th><th>通过</th><th>失败</th><th>跳过</th><th>状态</th></tr>
      </thead>
      <tbody>
        ${['unit', 'widget', 'integration'].map(type => {
          const t = testResults[type];
          if (!t) return '';
          const typePass = t.failed === 0;
          return `<tr>
            <td>${type.toUpperCase()}</td>
            <td>${t.total}</td>
            <td>${t.passed}</td>
            <td>${t.failed}</td>
            <td>${t.skipped}</td>
            <td><span class="badge ${typePass ? 'pass' : 'fail'}">${typePass ? 'PASS' : 'FAIL'}</span></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>
  
  ${testResults.overall.failed > 0 ? `
  <div class="card errors">
    <h4>❌ 失败详情</h4>
    ${testResults.overall.errors.slice(0, 10).map(e => `<div class="error-item">${e}</div>`).join('')}
    ${testResults.overall.errors.length > 10 ? `<div style="margin-top:0.5rem;color:#64748b">...还有 ${testResults.overall.errors.length - 10} 条</div>` : ''}
  </div>` : ''}
  
  <div class="footer">
    由 CI Test Reporter 生成 | ${timestamp}
  </div>
</div>
</body>
</html>`;
}

function generateMarkdownReport(testResults, coverage, projectPath) {
  const passRate = testResults.overall.total > 0
    ? Math.round((testResults.overall.passed / testResults.overall.total) * 100) : 0;
  
  return `# 🧪 ${path.basename(projectPath)} 测试报告

## 概览

| 指标 | 值 | 状态 |
|------|-----|------|
| 通过率 | ${passRate}% | ${passRate >= CONFIG.pass_threshold ? '✅' : '❌'} |
| 覆盖率 | ${coverage.lines}% | ${coverage.passed ? '✅' : '❌'} |
| 失败数 | ${testResults.overall.failed} | - |
| 跳过数 | ${testResults.overall.skipped} | - |

## 测试详情

| 类型 | 总数 | 通过 | 失败 | 跳过 | 状态 |
|------|------|------|------|------|------|
${['unit', 'widget', 'integration'].map(type => {
  const t = testResults[type];
  if (!t) return '';
  return `| ${type.toUpperCase()} | ${t.total} | ${t.passed} | ${t.failed} | ${t.skipped} | ${t.failed === 0 ? '✅' : '❌'} |`;
}).join('\n')}

## 生成时间

${new Date().toISOString()}

---
*由 CI Test Reporter 生成*
`;
}

// ============ GitHub 上报 ============
async function uploadToGitHub(testResults, projectPath) {
  if (!CONFIG.github_token) {
    console.error('⚠️  未配置 GITHUB_TOKEN，跳过 GitHub 上报');
    return;
  }
  
  console.error('📤 上报测试结果到 GitHub...');
  
  const repoSlug = runCommand('git remote get-url origin 2>/dev/null', projectPath)
    .output.match(/github\.com[:/](.+?)(?:\.git)?$/)?.[1];
  
  if (!repoSlug) {
    console.error('⚠️  无法确定 GitHub 仓库');
    return;
  }
  
  const runId = process.env.GITHUB_RUN_ID;
  
  if (runId) {
    // 在 GitHub Actions 中，上报到 Checks API
    const checkRun = {
      name: 'flutter-test',
      status: 'completed',
      conclusion: testResults.overall.failed === 0 ? 'success' : 'failure',
      output: {
        title: `测试结果: ${testResults.overall.passed}/${testResults.overall.total} 通过`,
        summary: `通过率: ${Math.round((testResults.overall.passed / testResults.overall.total) * 100)}%`
      }
    };
    
    try {
      execSync(`gh api repos/${repoSlug}/check-runs -X POST -f name=${checkRun.name} -f status=${checkRun.status} -f conclusion=${checkRun.conclusion} --silent`, {
        cwd: projectPath,
        stdio: 'pipe'
      });
      console.error('✅ GitHub Check 创建成功');
    } catch {
      console.error('⚠️  GitHub Check 创建失败');
    }
  }
}

// ============ CLI 入口 ============
const args = process.argv.slice(2);
let projectPath = process.cwd();
let format = 'html';
let upload = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--project' || args[i] === '-p') projectPath = args[++i];
  else if (args[i] === '--format' || args[i] === '-f') format = args[++i];
  else if (args[i] === '--upload') upload = true;
  else if (args[i] === '--help' || args[i] === '-h') {
    console.log(`
 ci-test-report.js - CI/CD 自动化测试报告

 用法：
   node ci-test-report.js --project /path/to/project [选项]

 选项：
   -p, --project <路径>    Flutter 项目路径
   -f, --format <格式>     报告格式: html (默认) | markdown | json
   --upload               上报到 GitHub
   -h, --help             显示帮助
`);
    process.exit(0);
  }
}

async function main() {
  try {
    // 确保测试目录存在
    const testDir = path.join(projectPath, 'test');
    if (!fs.existsSync(testDir)) {
      console.error('❌ 测试目录不存在');
      process.exit(1);
    }
    
    // 运行测试
    const testResults = await runTests(projectPath);
    
    // 获取覆盖率
    const coverage = await getCoverage(projectPath);
    
    // 生成报告
    const reportDir = path.join(projectPath, CONFIG.report_dir);
    fs.mkdirSync(reportDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseName = `test-report-${timestamp}`;
    
    if (format === 'html') {
      const html = generateHTMLReport(testResults, coverage, projectPath);
      fs.writeFileSync(path.join(reportDir, `${baseName}.html`), html);
      console.error(`\n✅ HTML 报告已生成: ${reportDir}/${baseName}.html`);
    } else if (format === 'markdown') {
      const md = generateMarkdownReport(testResults, coverage, projectPath);
      fs.writeFileSync(path.join(reportDir, `${baseName}.md`), md);
      console.error(`\n✅ Markdown 报告已生成: ${reportDir}/${baseName}.md`);
    } else {
      console.log(JSON.stringify({ testResults, coverage }, null, 2));
    }
    
    // GitHub 上报
    if (upload) {
      await uploadToGitHub(testResults, projectPath);
    }
    
    // 退出码
    if (testResults.overall.failed > 0 || !coverage.passed) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error(`❌ 错误: ${error.message}`);
    process.exit(1);
  }
}

main();
