#!/usr/bin/env node
/**
 * flutter-performance-monitor.js
 * Flutter 性能监控脚本 - DevOps 监控集成
 * 
 * 功能：
 * - CPU 使用率监控
 * - 内存使用监控
 * - FPS 帧率监控
 * - 网络请求追踪
 * - DevTools 集成
 * 
 * 用法：
 *   node flutter-performance-monitor.js --project /path/to/project --mode monitor
 *   node flutter-performance-monitor.js --project /path/to/project --mode analyze
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ============ 配置 ============
const CONFIG = {
  cpu_threshold: 80,        // CPU 告警阈值 (%)
  memory_threshold: 300,     // 内存告警阈值 (MB)
  fps_warning: 50,          // FPS 警告阈值
  fps_critical: 30,         // FPS 严重阈值
  interval: 5000,           // 采样间隔 (ms)
};

// ============ 工具函数 ============
function runCommand(cmd, cwd, timeout = 10000) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf-8', timeout, stdio: 'pipe' });
  } catch (error) {
    return error.stdout || error.message;
  }
}

function getFlutterProcessInfo() {
  try {
    const output = execSync('ps aux | grep flutter | grep -v grep', { encoding: 'utf-8' });
    const lines = output.trim().split('\n').filter(l => l);
    return lines.map(line => {
      const parts = line.trim().split(/\s+/);
      return {
        pid: parts[1],
        cpu: parseFloat(parts[2]),
        mem: parseFloat(parts[3]),
        command: parts.slice(10).join(' ')
      };
    });
  } catch {
    return [];
  }
}

function getDarwinPerformance() {
  // macOS 性能数据采集
  try {
    const topOutput = execSync('top -l 1 -n 5', { encoding: 'utf-8', timeout: 5000 });
    const lines = topOutput.split('\n');
    
    // 解析 CPU 和内存
    let cpuIdle = 0;
    let memUsed = 0;
    let memFree = 0;
    
    for (const line of lines) {
      if (line.includes('CPU usage')) {
        const idleMatch = line.match(/(\d+)% idle/);
        if (idleMatch) cpuIdle = parseInt(idleMatch[1]);
      }
      if (line.includes('PhysMem')) {
        const usedMatch = line.match(/(\d+)M used/);
        const freeMatch = line.match(/(\d+)M unused/);
        if (usedMatch) memUsed = parseInt(usedMatch[1]);
        if (freeMatch) memFree = parseInt(freeMatch[1]);
      }
    }
    
    return {
      cpuUsage: Math.round((100 - cpuIdle) * 100) / 100,
      memUsedMB: memUsed,
      memFreeMB: memFree,
      timestamp: new Date().toISOString()
    };
  } catch {
    return null;
  }
}

// ============ Flutter 性能分析 ============
async function analyzeFlutterPerformance(projectPath) {
  console.error('📊 分析 Flutter 性能...\n');
  
  const issues = [];
  const metrics = {};
  
  // 1. 代码静态分析
  console.error('🔍 静态代码分析...');
  try {
    const output = runCommand('flutter analyze --no-pub 2>&1', projectPath, 60000);
    const lines = output.split('\n');
    
    let errors = 0, warnings = 0, infos = 0;
    for (const line of lines) {
      if (line.includes('error') && line.includes('•')) errors++;
      else if (line.includes('warning') && line.includes('•')) warnings++;
      else if (line.includes('info') && line.includes('•')) infos++;
    }
    
    metrics.analyze = { errors, warnings, infos };
    
    // 检查性能相关警告
    const perfPatterns = [
      { pattern: /avoid_build_when/i, issue: '不必要的 build 触发' },
      { pattern: /implicit_calls/i, issue: '隐式调用可能影响性能' },
      { pattern: /const_constructor/i, issue: '缺少 const 构造器' },
      { pattern: /list_view/i, issue: 'ListView 缺少缓存策略' },
      { pattern: /image.*cache/i, issue: '图片缓存配置检查' },
    ];
    
    for (const { pattern, issue } of perfPatterns) {
      if (output.match(pattern)) {
        issues.push({ severity: 'warning', issue, category: 'performance' });
      }
    }
  } catch (e) {
    issues.push({ severity: 'error', issue: `Flutter analyze 失败: ${e.message}`, category: 'tool' });
  }
  
  // 2. Widget 过度构建检查
  console.error('🧩 检查 Widget 构建...');
  try {
    const libDir = path.join(projectPath, 'lib');
    if (fs.existsSync(libDir)) {
      const statelessCount = execSync(`grep -r "extends StatelessWidget" ${libDir} --include="*.dart" | wc -l`, { encoding: 'utf-8' }).trim();
      const statefulCount = execSync(`grep -r "extends State" ${libDir} --include="*.dart" | wc -l`, { encoding: 'utf-8' }).trim();
      
      metrics.widgets = {
        stateless: parseInt(statelessCount) || 0,
        stateful: parseInt(statefulCount) || 0,
      };
      
      // StatefulWidget 过多可能导致性能问题
      if (parseInt(statefulCount) > 50) {
        issues.push({ severity: 'warning', issue: `StatefulWidget 数量过多 (${statefulCount})，考虑优化状态管理`, category: 'performance' });
      }
    }
  } catch {}
  
  // 3. 依赖分析
  console.error('📦 依赖分析...');
  try {
    const pubspec = path.join(projectPath, 'pubspec.yaml');
    if (fs.existsSync(pubspec)) {
      const content = fs.readFileSync(pubspec, 'utf-8');
      const deps = content.match(/^\s{2}[^#].+:/gm) || [];
      metrics.dependencies = deps.length;
      
      // 检查可能有性能问题的依赖
      const heavyDeps = ['firebase_analytics', 'firebase_performance', 'sentry'];
      for (const dep of heavyDeps) {
        if (content.includes(dep)) {
          issues.push({ severity: 'info', issue: `检测到性能相关依赖: ${dep}`, category: 'dependency' });
        }
      }
    }
  } catch {}
  
  // 4. APK 性能指标估算
  console.error('📱 APK 性能评估...');
  try {
    const buildOutput = runCommand('flutter build apk --debug 2>&1 | tail -20', projectPath, 300000);
    const lines = buildOutput.split('\n');
    
    let apkSize = 0;
    for (const line of lines) {
      const sizeMatch = line.match(/(\d+\.?\d*)MB/);
      if (sizeMatch) apkSize = parseFloat(sizeMatch[1]);
    }
    
    metrics.apkSizeMB = apkSize || null;
  } catch {
    metrics.apkSizeMB = null;
  }
  
  return { metrics, issues };
}

// ============ 实时监控模式 ============
async function startMonitoring(projectPath, duration = 60000) {
  console.error(`📊 开始实时监控 (持续 ${duration / 1000} 秒)...\n`);
  
  const samples = [];
  const startTime = Date.now();
  
  while (Date.now() - startTime < duration) {
    const sample = {
      timestamp: new Date().toISOString(),
      system: getDarwinPerformance(),
      flutter: getFlutterProcessInfo(),
    };
    samples.push(sample);
    
    // 告警检测
    if (sample.system) {
      if (sample.system.cpuUsage > CONFIG.cpu_threshold) {
        console.error(`⚠️  CPU 告警: ${sample.system.cpuUsage}% (阈值: ${CONFIG.cpu_threshold}%)`);
      }
      if (sample.system.memUsedMB > CONFIG.memory_threshold) {
        console.error(`⚠️  内存告警: ${sample.system.memUsedMB}MB (阈值: ${CONFIG.memory_threshold}MB)`);
      }
    }
    
    await new Promise(r => setTimeout(r, CONFIG.interval));
  }
  
  // 汇总报告
  const avgCpu = samples.reduce((s, x) => s + (x.system?.cpuUsage || 0), 0) / samples.length;
  const maxCpu = Math.max(...samples.map(s => s.system?.cpuUsage || 0));
  const avgMem = samples.reduce((s, x) => s + (x.system?.memUsedMB || 0), 0) / samples.length;
  
  return {
    duration_ms: duration,
    samples: samples.length,
    summary: {
      avgCpu: Math.round(avgCpu * 100) / 100,
      maxCpu: Math.round(maxCpu * 100) / 100,
      avgMemMB: Math.round(avgMem),
      alerts: samples.filter(s => s.system?.cpuUsage > CONFIG.cpu_threshold || s.system?.memUsedMB > CONFIG.memory_threshold).length
    },
    samples // 完整采样数据（可裁剪）
  };
}

// ============ DevTools 集成 ============
async function openDevTools(projectPath) {
  console.error('🔧 打开 Flutter DevTools...');
  
  // 启动 Observatory
  try {
    execSync(`flutter attach --debugger-uri`, { cwd: projectPath, stdio: 'inherit' });
  } catch {
    console.error('请手动运行: flutter attach');
  }
}

// ============ CLI 入口 ============
const args = process.argv.slice(2);
let projectPath = process.cwd();
let mode = 'analyze';
let duration = 60000;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--project' || args[i] === '-p') projectPath = args[++i];
  else if (args[i] === '--mode' || args[i] === '-m') mode = args[++i];
  else if (args[i] === '--duration' || args[i] === '-d') duration = parseInt(args[i]) * 1000;
  else if (args[i] === '--help' || args[i] === '-h') {
    console.log(`
 flutter-performance-monitor.js - Flutter 性能监控

 用法：
   node flutter-performance-monitor.js --project /path/to/project [选项]

 选项：
   -p, --project <路径>      Flutter 项目路径
   -m, --mode <模式>          analyze(默认) | monitor | devtools
   -d, --duration <秒>        监控时长（monitor 模式）
   -h, --help                 显示帮助
`);
    process.exit(0);
  }
}

async function main() {
  try {
    if (mode === 'analyze') {
      const result = await analyzeFlutterPerformance(projectPath);
      console.log(JSON.stringify(result, null, 2));
    } else if (mode === 'monitor') {
      const result = await startMonitoring(projectPath, duration);
      console.log(JSON.stringify(result, null, 2));
    } else if (mode === 'devtools') {
      await openDevTools(projectPath);
    }
  } catch (error) {
    console.error(`❌ 错误: ${error.message}`);
    process.exit(1);
  }
}

main();
