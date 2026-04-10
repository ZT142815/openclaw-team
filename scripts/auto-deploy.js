#!/usr/bin/env node
/**
 * auto-deploy.js
 * 自动化部署脚本 - Flutter iOS/Android + GitHub Pages
 * 
 * 功能：
 * - 构建 iOS TestFlight 包
 * - 构建 Android APK/AAB
 * - 部署到 Firebase App Distribution
 * - 自动化回滚
 * - 部署状态通知
 * 
 * 用法：
 *   node auto-deploy.js --project /path/to/project --platform ios --env staging
 *   node auto-deploy.js --project /path/to/project --platform all --env production
 *   node auto-deploy.js --project /path/to/project --rollback --version 1.2.3
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ============ 配置 ============
const CONFIG = {
  platforms: {
    ios: {
      scheme: 'Runner',
      build_dir: 'build/ios/ipa',
      artifact: 'build/ios/ipa/*.ipa',
    },
    android: {
      build_dir: 'build/app/outputs/flutter-apk',
      artifact: 'build/app/outputs/flutter-apk/*.apk',
      aab_dir: 'build/app/outputs/bundle/release',
      aab: 'build/app/outputs/bundle/release/*.aab',
    },
    web: {
      build_dir: 'build/web',
      artifact: 'build/web/**/*',
    }
  },
  firebase: {
    app_id: process.env.FIREBASE_APP_ID,
    token: process.env.FIREBASE_TOKEN,
  },
  github: {
    token: process.env.GH_TOKEN || process.env.GITHUB_TOKEN,
    owner: null,
    repo: null,
  },
  notify_webhook: process.env.DEPLOY_WEBHOOK_URL,
};

const ENVIRONMENTS = {
  staging: {
    firebase_groups: 'staging-testers',
    app_suffix: '.staging',
    code_sign: 'Staging',
  },
  production: {
    firebase_groups: 'production-testers',
    app_suffix: '',
    code_sign: 'Distribution',
  },
};

// ============ 工具函数 ============
function runCommand(cmd, cwd, options = {}) {
  const { timeout = 300000, env = {} } = options;
  try {
    const result = execSync(cmd, {
      cwd,
      encoding: 'utf-8',
      timeout,
      stdio: 'pipe',
      env: { ...process.env, ...env }
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, output: error.stdout || error.message, code: error.status };
  }
}

function log(level, msg) {
  const prefix = { info: 'ℹ️', success: '✅', warn: '⚠️', error: '❌', step: '🔄' }[level] || '📝';
  console.error(`${prefix} ${msg}`);
}

function sendWebhook(status, message, details = {}) {
  if (!CONFIG.notify_webhook) return;
  
  const payload = {
    text: `${status === 'success' ? '✅' : '❌'} ${message}`,
    attachments: [{
      color: status === 'success' ? '#22c55e' : '#ef4444',
      fields: Object.entries(details).map(([k, v]) => ({ title: k, value: String(v), short: true }))
    }]
  };
  
  try {
    execSync(`curl -s -X POST '${CONFIG.notify_webhook}' -H 'Content-Type: application/json' -d '${JSON.stringify(payload)}'`, {
      stdio: 'pipe',
      timeout: 10000
    });
  } catch {}
}

// ============ 版本管理 ============
async function getVersion(projectPath) {
  const pubspec = path.join(projectPath, 'pubspec.yaml');
  if (!fs.existsSync(pubspec)) throw new Error('pubspec.yaml not found');
  
  const content = fs.readFileSync(pubspec, 'utf-8');
  const match = content.match(/version:\s*(\S+)/);
  return match ? match[1] : '1.0.0';
}

async function incrementVersion(projectPath, type = 'patch') {
  const current = await getVersion(projectPath);
  const [major, minor, patch] = current.split('.').map(Number);
  
  let newVersion;
  if (type === 'major') newVersion = `${major + 1}.0.0`;
  else if (type === 'minor') newVersion = `${major}.${minor + 1}.0`;
  else newVersion = `${major}.${minor}.${patch + 1}`;
  
  const pubspec = path.join(projectPath, 'pubspec.yaml');
  let content = fs.readFileSync(pubspec, 'utf-8');
  content = content.replace(/version:\s*\S+/, `version: ${newVersion}`);
  fs.writeFileSync(pubspec, content);
  
  log('success', `版本更新: ${current} → ${newVersion}`);
  return newVersion;
}

// ============ 预检 ============
async function preflightChecks(projectPath) {
  log('step', '执行预检...');
  const checks = [];
  
  // Flutter 可用性
  const flutterCheck = runCommand('flutter --version 2>&1', projectPath, { timeout: 30000 });
  checks.push({ name: 'Flutter SDK', passed: flutterCheck.success });
  
  // Git 状态
  const gitCheck = runCommand('git status --porcelain 2>&1', projectPath);
  const hasChanges = gitCheck.output.trim().length > 0;
  checks.push({ name: 'Git Clean', passed: !hasChanges, note: hasChanges ? '有未提交更改' : '' });
  
  // 环境变量
  checks.push({ name: 'Firebase App ID', passed: !!CONFIG.firebase.app_id });
  checks.push({ name: 'Firebase Token', passed: !!CONFIG.firebase.token });
  
  // 显示结果
  for (const check of checks) {
    if (!check.passed) {
      log('warn', `${check.name}: ${check.note || '未通过'}`);
    }
  }
  
  return checks.every(c => c.passed);
}

// ============ 构建 ============
async function buildiOS(projectPath, env) {
  log('step', `构建 iOS (${env})...`);
  
  const envConfig = ENVIRONMENTS[env];
  
  // 清理
  runCommand('flutter clean 2>&1', projectPath, { timeout: 60000 });
  
  // 获取依赖
  runCommand('flutter pub get 2>&1', projectPath, { timeout: 120000 });
  
  // 构建 IPA
  const buildCmd = `flutter build ipa --export-options-plist=ios/ExportOptions.plist --no-codesign 2>&1`;
  const result = runCommand(buildCmd, projectPath, { timeout: 600000 });
  
  if (result.success) {
    log('success', 'iOS 构建成功');
    return { success: true, artifact: CONFIG.platforms.ios.artifact };
  } else {
    log('error', `iOS 构建失败: ${result.output}`);
    return { success: false, error: result.output };
  }
}

async function buildAndroid(projectPath, env) {
  log('step', `构建 Android (${env})...`);
  
  // 清理
  runCommand('flutter clean 2>&1', projectPath, { timeout: 60000 });
  
  // 获取依赖
  runCommand('flutter pub get 2>&1', projectPath, { timeout: 120000 });
  
  // 构建 APK (debug)
  const apkResult = runCommand('flutter build apk --debug 2>&1', projectPath, { timeout: 600000 });
  
  // 构建 AAB (release)
  const aabResult = runCommand('flutter build appbundle --release 2>&1', projectPath, { timeout: 600000 });
  
  if (apkResult.success || aabResult.success) {
    log('success', 'Android 构建成功');
    return {
      success: true,
      apk: CONFIG.platforms.android.artifact,
      aab: CONFIG.platforms.android.aab
    };
  } else {
    log('error', `Android 构建失败`);
    return { success: false, error: apkResult.output || aabResult.output };
  }
}

async function buildWeb(projectPath, env) {
  log('step', `构建 Web (${env})...`);
  
  runCommand('flutter clean 2>&1', projectPath, { timeout: 60000 });
  runCommand('flutter pub get 2>&1', projectPath, { timeout: 120000 });
  
  const result = runCommand('flutter build web --release 2>&1', projectPath, { timeout: 300000 });
  
  if (result.success) {
    log('success', 'Web 构建成功');
    return { success: true, artifact: CONFIG.platforms.web.artifact };
  } else {
    log('error', `Web 构建失败: ${result.output}`);
    return { success: false, error: result.output };
  }
}

// ============ 部署 ============
async function deployToFirebase(projectPath, platform, artifactPath, env) {
  if (!CONFIG.firebase.app_id || !CONFIG.firebase.token) {
    log('warn', 'Firebase 配置不完整，跳过 Firebase 部署');
    return { success: false, reason: 'no_config' };
  }
  
  log('step', `部署到 Firebase App Distribution (${env})...`);
  
  const group = ENVIRONMENTS[env]?.firebase_groups || 'testers';
  
  let cmd;
  if (platform === 'ios') {
    cmd = `firebase appdistribution:distribute "${artifactPath}" --app "${CONFIG.firebase.app_id}" --groups "${group}" --token "${CONFIG.firebase.token}" 2>&1`;
  } else {
    cmd = `firebase appdistribution:distribute "${artifactPath}" --app "${CONFIG.firebase.app_id}" --groups "${group}" --token "${CONFIG.firebase.token}" 2>&1`;
  }
  
  const result = runCommand(cmd, projectPath, { timeout: 300000 });
  
  if (result.success) {
    log('success', 'Firebase 部署成功');
    return { success: true };
  } else {
    log('warn', `Firebase 部署失败: ${result.output}`);
    return { success: false, error: result.output };
  }
}

async function deployToGitHubPages(projectPath) {
  log('step', '部署到 GitHub Pages...');
  
  // 初始化 git remote（如果需要）
  const ghResult = runCommand('git remote -v', projectPath);
  if (!ghResult.output.includes('github.com')) {
    log('warn', '非 GitHub 仓库，跳过 GitHub Pages 部署');
    return { success: false, reason: 'not_github' };
  }
  
  // 使用 gh-pages 包
  const deployCmd = `
    npx gh-pages -d build/web -r $(git remote get-url origin | sed 's/.git$//') 2>&1
  `;
  const result = runCommand(deployCmd, projectPath, { timeout: 120000 });
  
  if (result.success) {
    log('success', 'GitHub Pages 部署成功');
    return { success: true };
  } else {
    log('error', `GitHub Pages 部署失败: ${result.output}`);
    return { success: false, error: result.output };
  }
}

async function createGitHubRelease(projectPath, version, notes = '') {
  if (!CONFIG.github.token) {
    log('warn', '未配置 GitHub Token，跳过 Release 创建');
    return;
  }
  
  log('step', `创建 GitHub Release v${version}...`);
  
  const tag = `v${version}`;
  const releaseNotes = notes || `Release v${version}`;
  
  try {
    execSync(`gh release create ${tag} --title "v${version}" --notes "${releaseNotes}" 2>&1`, {
      cwd: projectPath,
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    log('success', `Release v${version} 创建成功`);
  } catch (error) {
    log('warn', `Release 创建失败: ${error.message}`);
  }
}

// ============ 回滚 ============
async function rollback(projectPath, version) {
  log('step', `回滚到版本 ${version}...`);
  
  // 检查 tag 是否存在
  const tagCheck = runCommand(`git tag -l v${version} 2>&1`, projectPath);
  if (!tagCheck.output.includes(`v${version}`)) {
    log('error', `Tag v${version} 不存在`);
    return { success: false, error: 'tag_not_found' };
  }
  
  // checkout 并构建
  runCommand(`git checkout v${version} 2>&1`, projectPath);
  runCommand('flutter pub get 2>&1', projectPath, { timeout: 120000 });
  
  log('success', `已回滚到 v${version}，请手动重新构建部署`);
  return { success: true, version };
}

// ============ 部署报告 ============
function generateDeployReport(results, platform, env, version) {
  const report = {
    timestamp: new Date().toISOString(),
    version,
    platform,
    env,
    results,
    overall: results.build?.success ? 'success' : 'failed',
  };
  
  return report;
}

// ============ CLI 入口 ============
const args = process.argv.slice(2);
let projectPath = process.cwd();
let platform = null;
let env = 'staging';
let action = 'deploy';
let rollbackVersion = null;
let skipBuild = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--project' || args[i] === '-p') projectPath = args[++i];
  else if (args[i] === '--platform') platform = args[++i];
  else if (args[i] === '--env') env = args[++i];
  else if (args[i] === '--rollback') action = 'rollback';
  else if (args[i] === '--version') rollbackVersion = args[++i];
  else if (args[i] === '--skip-build') skipBuild = true;
  else if (args[i] === '--help' || args[i] === '-h') {
    console.log(`
 auto-deploy.js - Flutter 自动化部署

 用法：
   node auto-deploy.js --project /path/to/project --platform <平台> --env <环境>

 选项：
   -p, --project <路径>       Flutter 项目路径
   --platform <平台>          ios | android | web | all
   --env <环境>               staging (默认) | production
   --rollback --version <版本> 回滚到指定版本
   --skip-build               仅部署已构建的产物
   -h, --help                 显示帮助

 示例：
   node auto-deploy.js -p ./my_app --platform ios --env staging
   node auto-deploy.js -p ./my_app --platform all --env production
   node auto-deploy.js -p ./my_app --rollback --version 1.2.3
`);
    process.exit(0);
  }
}

async function main() {
  try {
    const version = await getVersion(projectPath);
    log('info', `部署版本: ${version} | 平台: ${platform || 'all'} | 环境: ${env}`);
    
    if (action === 'rollback') {
      const result = await rollback(projectPath, rollbackVersion);
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    
    // 预检
    const preflight = await preflightChecks(projectPath);
    if (!preflight) {
      log('warn', '预检未完全通过，继续部署...');
    }
    
    const results = {};
    
    // 确定平台列表
    const platforms = platform === 'all' || !platform
      ? ['ios', 'android', 'web']
      : [platform];
    
    // 构建
    if (!skipBuild) {
      for (const p of platforms) {
        if (p === 'ios') results.build = await buildiOS(projectPath, env);
        else if (p === 'android') results.build = await buildAndroid(projectPath, env);
        else if (p === 'web') results.build = await buildWeb(projectPath, env);
      }
    }
    
    // 部署
    for (const p of platforms) {
      if (p === 'ios' && results.build?.success) {
        results.deploy = await deployToFirebase(projectPath, 'ios', CONFIG.platforms.ios.artifact, env);
      } else if (p === 'android' && results.build?.success) {
        results.deploy = await deployToFirebase(projectPath, 'android', CONFIG.platforms.android.artifact, env);
      } else if (p === 'web') {
        results.deploy = await deployToGitHubPages(projectPath);
      }
    }
    
    // GitHub Release
    if (env === 'production' && results.build?.success) {
      await createGitHubRelease(projectPath, version);
    }
    
    // 发送通知
    const report = generateDeployReport(results, platform, env, version);
    
    sendWebhook(
      results.build?.success ? 'success' : 'failed',
      `Flutter 部署 ${results.build?.success ? '成功' : '失败'}`,
      { 版本: version, 平台: platforms.join(', '), 环境: env }
    );
    
    console.log(JSON.stringify(report, null, 2));
    
  } catch (error) {
    log('error', `部署失败: ${error.message}`);
    sendWebhook('failed', `Flutter 部署失败: ${error.message}`);
    process.exit(1);
  }
}

main();
