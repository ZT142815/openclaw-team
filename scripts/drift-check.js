#!/usr/bin/env node
/**
 * Drift Detection Script
 *
 * 功能：
 *   检测代码库中的"漂移"问题
 *   包括：死代码、未使用依赖、架构违规积累
 *
 * 使用方式：
 *   node drift-check.js --project [项目路径]
 *   node drift-check.js --project ~/budolist --format json
 *
 * 输出：
 *   死代码文件列表
 *   未使用的 pub 依赖
 *   未使用的 import
 *   架构违规积累
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ============================================================
// 配置
// ============================================================

const CONFIG = {
  // 需要扫描的目录
  scanDirs: ['lib', 'test', 'web'],
  // 跳过扫描的目录
  skipDirs: ['build', '.dart_tool', '.git', 'generated', 'node_modules', 'test/_fixtures'],
  // 需要扫描的文件扩展名
  extensions: ['.dart'],
  // 检测未使用 pub 包时的白名单（常见内置包）
  builtinPackages: ['flutter', 'dart:async', 'dart:collection', 'dart:convert', 'dart:core', 'dart:developer', 'dart:html', 'dart:io', 'dart:isolate', 'dart:math', 'dart:typed_data', 'dart:ui']
};

// ============================================================
// 工具函数
// ============================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    projectPath: process.cwd(),
    format: 'text',  // text 或 json
    categories: ['all'],  // dead-code, unused-deps, unused-imports, arch-violations
    fix: false  // 是否自动修复
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--project':
        options.projectPath = args[++i].replace(/^~/, require('os').homedir());
        break;
      case '--format':
        options.format = args[++i];
        break;
      case '--categories':
        options.categories = args[++i].split(',');
        break;
      case '--fix':
        options.fix = true;
        break;
      case '--help':
        printHelp();
        process.exit(0);
        break;
    }
  }

  return options;
}

function printHelp() {
  console.log(`
📋 Drift Detection Script

功能：检测代码库中的漂移问题

用法:
  node drift-check.js [选项]

选项:
  --project [路径]    项目路径 (默认: 当前目录)
  --format [格式]     输出格式: text 或 json (默认: text)
  --categories [类型] 检测类型: dead-code,unused-deps,unused-imports,arch-violations,all (默认: all)
  --fix               自动尝试修复 (实验性)
  --help              显示此帮助

示例:
  node drift-check.js --project ~/budolist
  node drift-check.js --project ~/budolist --format json
  node drift-check.js --project ~/budolist --categories dead-code,unused-deps
`);
}

// 收集所有 Dart 文件
function collectDartFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!CONFIG.skipDirs.includes(entry.name)) {
        collectDartFiles(fullPath, files);
      }
    } else if (CONFIG.extensions.includes(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

// 提取 import 语句
function extractImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const importRegex = /import\s+(?:\s*['"]([^'"]+)['"]|package:\s*([^)\s]+)[^)]*\))/g;
  const imports = [];
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const imp = match[1] || match[2];
    if (imp) imports.push(imp);
  }
  return imports;
}

// 检测未使用的 import
function findUnusedImports(files) {
  const results = [];
  const allImports = new Map(); // package -> [files using it]
  const definedSymbols = new Map(); // file -> Set of defined symbols

  // 第一遍：收集所有 import
  for (const file of files) {
    const imports = extractImports(file);
    for (const imp of imports) {
      if (!allImports.has(imp)) allImports.set(imp, []);
      allImports.get(imp).push(file);
    }
  }

  // 第二遍：收集定义的符号
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    // 匹配 class, enum, mixin, extension, typedef 定义的符号
    const defRegex = /(?:class|enum|mixin|extension|typedef)\s+(\w+)/g;
    let match;
    const defined = new Set();
    while ((match = defRegex.exec(content)) !== null) {
      defined.add(match[1]);
    }
    definedSymbols.set(file, defined);
  }

  // 检测未使用的导入
  for (const [imp, importingFiles] of allImports) {
    for (const file of importingFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      // 检查是否真的使用了这个导入的符号
      const symbol = imp.split('/').pop().replace('.dart', '').replace(/-/g, '_');

      // 简单检查：是否在代码中被引用
      // 这个检测不完美，但对于大多数情况足够
      const regex = new RegExp(`\\b${symbol}\\b`);
      if (!regex.test(content)) {
        // 可能是未使用的
        results.push({
          type: 'unused_import',
          file: path.relative(options.projectPath, file),
          import: imp,
          suggestion: '检查是否真的需要这个 import'
        });
      }
    }
  }

  return results;
}

// 检测死代码（未使用的文件）
function findDeadCode(files, pubspecPath) {
  const results = [];

  // 构建所有导出符号的索引
  const exportedSymbols = new Map(); // symbol -> file

  // lib/ 下的直接入口文件
  const libIndex = new Set();

  // lib/main.dart 总是被认为使用
  const mainFile = path.join(options.projectPath, 'lib', 'main.dart');
  if (fs.existsSync(mainFile)) {
    return results; // main.dart 存在，不做死代码检测
  }

  // 对于其他文件，简单检测：
  // 如果文件不在任何 import 链中，可能是死代码
  const allImportedFiles = new Set();

  for (const file of files) {
    const imports = extractImports(file);
    for (const imp of imports) {
      if (imp.startsWith('package:') || imp.startsWith('.')) {
        allImportedFiles.add(imp);
      }
    }
  }

  // 标记为可能死代码的文件（排除 main.dart 和测试文件）
  for (const file of files) {
    const relative = path.relative(options.projectPath, file);
    if (relative.includes('main.dart')) continue;
    if (relative.includes('test/')) continue;
    if (relative.includes('_test.dart')) continue;

    // 检查是否有任何其他文件导入了这个文件
    const fileName = path.basename(file, '.dart');
    let isImported = false;

    for (const imp of allImportedFiles) {
      if (imp.includes(fileName) || imp.endsWith(fileName + '.dart')) {
        isImported = true;
        break;
      }
    }

    if (!isImported && !relative.includes('lib/')) {
      // 可能没有被引用
      results.push({
        type: 'dead_code',
        file: relative,
        reason: '未在任何 import 语句中被引用',
        suggestion: '确认是否还需要此文件，如不需要则删除'
      });
    }
  }

  return results;
}

// 检测未使用的 pub 依赖
function findUnusedDeps(projectPath) {
  const results = [];
  const pubspecPath = path.join(projectPath, 'pubspec.yaml');

  if (!fs.existsSync(pubspecPath)) {
    return results;
  }

  // 读取 pubspec.yaml
  const pubspec = fs.readFileSync(pubspecPath, 'utf-8');

  // 提取所有依赖
  const deps = [];
  const depRegex = /^  ([a-zA-Z0-9_-]+):/gm;
  let match;
  while ((match = depRegex.exec(pubspec)) !== null) {
    if (match[1] !== 'flutter') {
      deps.push(match[1]);
    }
  }

  // 检查每个依赖是否在代码中使用
  const libPath = path.join(projectPath, 'lib');
  const files = collectDartFiles(libPath);

  for (const dep of deps) {
    let isUsed = false;
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      // 检查 package:dep_name 或 dep_name 在代码中
      if (content.includes(`package:${dep}/`) || content.includes(`import '${dep}'`) || content.includes(`import "${dep}"`)) {
        isUsed = true;
        break;
      }
    }

    if (!isUsed) {
      results.push({
        type: 'unused_dep',
        package: dep,
        reason: '在代码中未找到对此包的引用',
        suggestion: '从 pubspec.yaml 中移除，或确认是否真的需要'
      });
    }
  }

  return results;
}

// 检测架构违规积累
function findArchViolations(projectPath) {
  const results = [];
  const libPath = path.join(projectPath, 'lib');

  const layerMapping = {
    'ui': ['screens', 'widgets', 'pages', 'views', 'ui'],
    'service': ['services', 'managers', 'blocs', 'providers', 'store'],
    'repo': ['repositories', 'models', 'apis', 'data', 'dal']
  };

  const files = collectDartFiles(libPath);

  for (const file of files) {
    const relative = path.relative(libPath, file);
    const parts = relative.split(path.sep);
    const fileDir = parts.length > 1 ? parts[0] : '';

    // 确定文件所在层
    let fileLayer = null;
    for (const [layer, dirs] of Object.entries(layerMapping)) {
      if (dirs.includes(fileDir)) {
        fileLayer = layer;
        break;
      }
    }

    if (!fileLayer) continue;

    // 检查 import
    const imports = extractImports(file);
    for (const imp of imports) {
      // 只检查内部包引用
      if (!imp.startsWith('package:')) continue;

      const targetFile = imp.replace('package:', '').split('/');
      if (targetFile[0] !== path.basename(projectPath)) continue;

      const targetPath = targetFile.slice(1).join('/');
      const targetDir = targetPath.split('/')[0];

      // 确定目标层
      let targetLayer = null;
      for (const [layer, dirs] of Object.entries(layerMapping)) {
        if (dirs.includes(targetDir)) {
          targetLayer = layer;
          break;
        }
      }

      if (!targetLayer) continue;

      // 检查违规
      const forbidden = [
        ['ui', 'repo'],   // UI 不能直接调用 Repo
        ['ui', 'ui'],     // UI 之间不能直接调用
        ['repo', 'service'], // Repo 不能调用 Service
        ['repo', 'ui']    // Repo 不能调用 UI
      ];

      for (const [from, to] of forbidden) {
        if (fileLayer === from && targetLayer === to) {
          results.push({
            type: 'arch_violation',
            file: path.relative(projectPath, file),
            import: imp,
            violation: `${from.toUpperCase()} 不能直接调用 ${to.toUpperCase()}`,
            currentCall: `${fileLayer} → ${targetLayer}`,
            suggestion: `通过 ${fileLayer === 'ui' ? 'Service' : 'Repository'} 间接访问`
          });
        }
      }
    }
  }

  return results;
}

// ============================================================
// 主逻辑
// ============================================================

const options = parseArgs();

function main() {
  const results = {
    summary: {
      timestamp: new Date().toISOString(),
      project: options.projectPath,
      categories: options.categories
    },
    issues: []
  };

  // 确保是 Flutter 项目
  const pubspecPath = path.join(options.projectPath, 'pubspec.yaml');
  if (!fs.existsSync(pubspecPath)) {
    console.error(`❌ 不是 Flutter 项目：找不到 pubspec.yaml`);
    process.exit(1);
  }

  console.error(`🔍 检测 Drift: ${options.projectPath}`);

  // 收集文件
  const files = [];
  for (const dir of CONFIG.scanDirs) {
    const fullPath = path.join(options.projectPath, dir);
    collectDartFiles(fullPath, files);
  }
  console.error(`   扫描 ${files.length} 个文件`);

  // 执行检测
  if (options.categories.includes('all') || options.categories.includes('unused-imports')) {
    console.error('   检测未使用的 import...');
    const unusedImports = findUnusedImports(files);
    results.issues.push(...unusedImports);
  }

  if (options.categories.includes('all') || options.categories.includes('dead-code')) {
    console.error('   检测死代码...');
    const deadCode = findDeadCode(files, pubspecPath);
    results.issues.push(...deadCode);
  }

  if (options.categories.includes('all') || options.categories.includes('unused-deps')) {
    console.error('   检测未使用的依赖...');
    const unusedDeps = findUnusedDeps(options.projectPath);
    results.issues.push(...unusedDeps);
  }

  if (options.categories.includes('all') || options.categories.includes('arch-violations')) {
    console.error('   检测架构违规...');
    const archViolations = findArchViolations(options.projectPath);
    results.issues.push(...archViolations);
  }

  // 按类型分组
  const byType = {};
  for (const issue of results.issues) {
    if (!byType[issue.type]) byType[issue.type] = [];
    byType[issue.type].push(issue);
  }

  results.summary.total = results.issues.length;
  results.summary.byType = Object.fromEntries(
    Object.entries(byType).map(([k, v]) => [k, v.length])
  );

  // 输出
  if (options.format === 'json') {
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log('\n' + '='.repeat(60));
    console.log('  DRIFT 检测报告');
    console.log('='.repeat(60));
    console.log(`\n项目: ${options.projectPath}`);
    console.log(`时间: ${results.summary.timestamp}`);
    console.log(`总问题: ${results.summary.total}`);
    console.log('');

    if (results.issues.length === 0) {
      console.log('✅ 未检测到 Drift 问题');
    } else {
      for (const [type, items] of Object.entries(byType)) {
        console.log(`\n${'─'.repeat(50)}`);
        console.log(`📋 ${type.replace(/_/g, ' ').toUpperCase()} (${items.length})`);
        console.log('─'.repeat(50));

        for (const item of items) {
          console.log(`\n  📄 ${item.file || item.package}`);
          console.log(`     ${item.reason || item.violation}`);
          console.log(`     💡 ${item.suggestion}`);
        }
      }

      console.log(`\n${'='.repeat(60)}`);
      console.log(`  共 ${results.summary.total} 个问题，建议修复后提交`);
      console.log(`${'='.repeat(60)}\n`);
    }
  }

  // 返回非零退出码如果有严重问题
  const errors = results.issues.filter(i => i.type === 'arch_violation' || i.type === 'dead_code');
  process.exit(errors.length > 0 ? 1 : 0);
}

main();
