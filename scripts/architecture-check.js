#!/usr/bin/env node
/**
 * Architecture Check Script
 * 
 * 检测 Flutter 项目架构层级违规：
 * 1. UI → Service → Repo 单向依赖
 * 2. 循环依赖检测
 * 3. 分层职责检测
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  // 层级定义
  layers: {
    ui: ['screens', 'widgets', 'pages', 'views', 'ui'],
    service: ['services', 'managers', 'blocs', 'providers', 'store'],
    repo: ['repositories', 'models', 'apis', 'data', 'dal'],
  },
  // 允许的依赖关系（from → to）
  allowedDeps: [
    ['ui', 'service'],
    ['service', 'repo'],
    ['service', 'service'], // service 之间可以互相调用
    ['repo', 'repo'],       // repo 之间可以互相调用
  ],
  // 禁止的依赖关系
  forbiddenDeps: [
    ['ui', 'repo'],         // UI 禁止直接调用 Repo
    ['ui', 'ui'],           // UI 禁止直接调用 UI（应该通过 Service）
    ['repo', 'service'],    // Repo 禁止调用 Service
    ['repo', 'ui'],         // Repo 禁止调用 UI
  ],
};

// 获取文件所在的层级
function getLayer(filePath, basePath) {
  const relativePath = path.relative(basePath, filePath);
  const parts = relativePath.split(path.sep);
  
  for (const [layerName, dirNames] of Object.entries(CONFIG.layers)) {
    if (parts.some(part => dirNames.includes(part))) {
      return layerName;
    }
  }
  return null;
}

// 提取文件的 import 语句
function extractImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const importRegex = /import\s+['"]([^'"]+)['"]/g;
  const imports = [];
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  return imports;
}

// 解析 import 路径为绝对路径
function resolveImport(importPath, currentFile, basePath) {
  // 处理 package: 前缀
  if (importPath.startsWith('package:')) {
    const packagePath = importPath.replace('package:', '');
    return path.join(basePath, packagePath);
  }
  
  // 处理相对路径
  if (importPath.startsWith('.')) {
    return path.resolve(path.dirname(currentFile), importPath);
  }
  
  return null;
}

// 主检测函数
function checkArchitecture(projectPath) {
  const errors = [];
  const dependencyGraph = new Map(); // 文件 → 依赖的文件
  const allFiles = [];
  
  // 收集所有 Dart 文件
  function collectFiles(dir) {
    if (!fs.existsSync(dir)) return;
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // 跳过某些目录
        if (['test', 'build', '.dart_tool', 'generated'].includes(entry.name)) {
          continue;
        }
        collectFiles(fullPath);
      } else if (entry.name.endsWith('.dart')) {
        allFiles.push(fullPath);
      }
    }
  }
  
  const libPath = path.join(projectPath, 'lib');
  collectFiles(libPath);
  
  // 分析每个文件的依赖
  for (const file of allFiles) {
    const imports = extractImports(file);
    const dependencies = [];
    
    for (const importPath of imports) {
      const resolved = resolveImport(importPath, file, libPath);
      if (resolved && fs.existsSync(resolved)) {
        dependencies.push(resolved);
      }
    }
    
    dependencyGraph.set(file, dependencies);
  }
  
  // 检测违规
  for (const [file, deps] of dependencyGraph) {
    const fromLayer = getLayer(file, libPath);
    if (!fromLayer) continue; // 跳过不属于任何层级的文件
    
    for (const dep of deps) {
      const toLayer = getLayer(dep, libPath);
      if (!toLayer) continue; // 跳过外部依赖
      
      // 检查是否是禁止的依赖
      const isForbidden = CONFIG.forbiddenDeps.some(
        ([from, to]) => from === fromLayer && to === toLayer
      );
      
      if (isForbidden) {
        errors.push({
          type: 'invalid_dependency',
          from: path.relative(libPath, file),
          to: path.relative(libPath, dep),
          fromLayer,
          toLayer,
          message: `${fromLayer.toUpperCase()} should not directly call ${toLayer.toUpperCase()}`,
        });
      }
    }
  }
  
  // 检测循环依赖（使用 DFS）
  const visited = new Set();
  const recursionStack = new Set();
  const circularDeps = [];
  
  function dfs(file, path = []) {
    if (recursionStack.has(file)) {
      circularDeps.push({
        type: 'circular_dependency',
        path: [...path, file],
        message: `Circular dependency detected: ${path.slice(path.indexOf(file)).map(f => path.relative(libPath, f)).join(' → ')}`,
      });
      return;
    }
    
    if (visited.has(file)) return;
    
    visited.add(file);
    recursionStack.add(file);
    
    const deps = dependencyGraph.get(file) || [];
    for (const dep of deps) {
      if (dependencyGraph.has(dep)) {
        dfs(dep, [...path, file]);
      }
    }
    
    recursionStack.delete(file);
  }
  
  for (const file of allFiles) {
    if (!visited.has(file)) {
      dfs(file);
    }
  }
  
  // 汇总
  return {
    status: errors.length === 0 && circularDeps.length === 0 ? 'pass' : 'fail',
    errors: [...errors, ...circularDeps],
    summary: {
      totalFiles: allFiles.length,
      violations: errors.length + circularDeps.length,
      byType: {
        invalid_dependency: errors.filter(e => e.type === 'invalid_dependency').length,
        circular_dependency: circularDeps.length,
      },
    },
  };
}

// CLI 入口
function main() {
  const args = process.argv.slice(2);
  let projectPath = process.cwd();
  
  // 解析参数
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--path' && args[i + 1]) {
      projectPath = args[i + 1];
    }
  }
  
  // 替换 ~ 为用户目录
  projectPath = projectPath.replace(/^~/, require('os').homedir());
  
  console.log(`🔍 Checking architecture: ${projectPath}\n`);
  
  try {
    const result = checkArchitecture(projectPath);
    
    if (result.status === 'pass') {
      console.log('✅ Architecture check PASSED');
      console.log(`   Total files: ${result.summary.totalFiles}`);
    } else {
      console.log('❌ Architecture check FAILED\n');
      console.log(`Errors: ${result.summary.violations}\n`);
      
      // 按类型分组输出
      const invalidDeps = result.errors.filter(e => e.type === 'invalid_dependency');
      const circularDeps = result.errors.filter(e => e.type === 'circular_dependency');
      
      if (invalidDeps.length > 0) {
        console.log('📋 Invalid Dependencies:');
        invalidDeps.forEach(e => {
          console.log(`   ❌ ${e.from}`);
          console.log(`      → ${e.to}`);
          console.log(`      ${e.message}\n`);
        });
      }
      
      if (circularDeps.length > 0) {
        console.log('🔄 Circular Dependencies:');
        circularDeps.forEach(e => {
          const pathStr = e.path.map(f => path.relative(projectPath, f)).join(' → ');
          console.log(`   ❌ ${pathStr}\n`);
        });
      }
      
      console.log('\n📊 Summary:');
      console.log(`   Total files: ${result.summary.totalFiles}`);
      console.log(`   Invalid dependencies: ${result.summary.byType.invalid_dependency}`);
      console.log(`   Circular dependencies: ${result.summary.byType.circular_dependency}`);
    }
    
    // 输出 JSON 格式（可用于 CI）
    if (process.env.JSON_OUTPUT) {
      console.log('\n--- JSON OUTPUT ---');
      console.log(JSON.stringify(result, null, 2));
    }
    
    process.exit(result.status === 'pass' ? 0 : 1);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
