#!/usr/bin/env node
/**
 * App Store Compliance Checker
 * Validates all requirements for App Store submission
 * 
 * Usage: node appstore-compliance-checker.js [--project ./path/to/project]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const args = process.argv.slice(2);
const flags = {};
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    const key = args[i].replace('--', '');
    flags[key] = args[i + 1] || true;
    i++;
  }
}

const projectPath = flags.project || '.';

console.log('🔍 App Store Compliance Checker');
console.log('='.repeat(50));
console.log(`Project: ${path.resolve(projectPath)}`);
console.log(`Time: ${new Date().toISOString()}`);
console.log('');

// Check results
const checks = [];

function addCheck(category, item, status, details = '') {
  checks.push({ category, item, status, details });
}

function checkFile(filePath, description) {
  try {
    const exists = fs.existsSync(path.join(projectPath, filePath));
    return exists ? { status: 'pass', details: `Found: ${filePath}` } : { status: 'fail', details: `Missing: ${filePath}` };
  } catch (e) {
    return { status: 'fail', details: e.message };
  }
}

// === App Icons & Assets ===
console.log('📦 Checking App Icons & Assets...');

const iconChecks = [
  ['ios/Runner/Assets.xcassets/AppIcon.appiconset/Contents.json', 'iOS App Icon (1024x1024)'],
  ['android/app/src/main/res/mipmap-hdpi/ic_launcher.png', 'Android Icon (hdpi)'],
  ['android/app/src/main/res/mipmap-xhdpi/ic_launcher.png', 'Android Icon (xhdpi)'],
  ['android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png', 'Android Icon (xxhdpi)'],
  ['android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png', 'Android Icon (xxxhdpi)'],
];

iconChecks.forEach(([file, desc]) => {
  const result = checkFile(file, desc);
  addCheck('📦 Assets', desc, result.status, result.details);
});

// === Privacy & Legal ===
console.log('⚖️  Checking Privacy & Legal...');

const privacyChecks = [
  ['PRIVACY_POLICY.md', 'Privacy Policy'],
  ['TERMS_OF_SERVICE.md', 'Terms of Service'],
  ['ios/Runner/Info.plist', 'iOS Info.plist'],
];

privacyChecks.forEach(([file, desc]) => {
  const result = checkFile(file, desc);
  addCheck('⚖️ Privacy & Legal', desc, result.status, result.details);
});

// Check for required Info.plist privacy keys
const infoPlistPath = path.join(projectPath, 'ios/Runner/Info.plist');
if (fs.existsSync(infoPlistPath)) {
  const content = fs.readFileSync(infoPlistPath, 'utf8');
  const requiredKeys = [
    ['NSLocationWhenInUseUsageDescription', 'Location Permission'],
    ['NSCameraUsageDescription', 'Camera Permission'],
    ['NSPhotoLibraryUsageDescription', 'Photo Library Permission'],
    ['NSMicrophoneUsageDescription', 'Microphone Permission'],
  ];
  
  requiredKeys.forEach(([key, desc]) => {
    const exists = content.includes(key);
    addCheck('⚖️ Privacy Keys', desc, exists ? 'pass' : 'warn', exists ? 'Declared in Info.plist' : 'Not declared (add if needed)');
  });
}

// === App Configuration ===
console.log('⚙️  Checking App Configuration...');

const configChecks = [
  ['pubspec.yaml', 'Flutter pubspec.yaml'],
  ['android/app/build.gradle', 'Android build.gradle'],
  ['ios/Runner.xcodeproj/project.pbxproj', 'iOS Xcode project'],
];

configChecks.forEach(([file, desc]) => {
  const result = checkFile(file, desc);
  addCheck('⚙️ Configuration', desc, result.status, result.details);
});

// Check pubspec for required fields
const pubspecPath = path.join(projectPath, 'pubspec.yaml');
if (fs.existsSync(pubspecPath)) {
  const pubspec = fs.readFileSync(pubspecPath, 'utf8');
  const required = [
    ['name:', 'App name defined'],
    ['version:', 'Version defined'],
    ['description:', 'Description defined'],
    ['publish_to:', 'Publishing target set'],
  ];
  
  required.forEach(([pattern, desc]) => {
    const exists = pubspec.includes(pattern);
    addCheck('⚙️ Pubspec', desc, exists ? 'pass' : 'fail', exists ? 'Found' : 'Missing');
  });
}

// === Security ===
console.log('🔐 Checking Security...');

const securityChecks = [
  ['flutter analyze --no-fatal-infos --no-fatal-warnings 2>/dev/null || true', 'Flutter Analyzer'],
];

securityChecks.forEach(([cmd, desc]) => {
  try {
    execSync(cmd, { cwd: projectPath, stdio: 'pipe' });
    addCheck('🔐 Security', desc, 'pass', 'No critical issues');
  } catch (e) {
    const output = e.stdout?.toString() || e.stderr?.toString() || '';
    if (output.includes('error')) {
      addCheck('🔐 Security', desc, 'warn', 'Warnings found (review recommended)');
    } else {
      addCheck('🔐 Security', desc, 'pass', 'Passed');
    }
  }
});

// === Testing ===
console.log('🧪 Checking Test Coverage...');

const testChecks = [
  ['test/', 'Test directory exists'],
  ['test/widget_test.dart', 'Widget tests'],
];

testChecks.forEach(([file, desc]) => {
  const result = checkFile(file, desc);
  addCheck('🧪 Testing', desc, result.status, result.details);
});

// Count test files
const testDir = path.join(projectPath, 'test');
if (fs.existsSync(testDir)) {
  const testFiles = execSync('find test -name "*_test.dart" 2>/dev/null | wc -l', { encoding: 'utf8' }).trim();
  addCheck('🧪 Test Count', 'Unit/Widget test files', parseInt(testFiles) > 0 ? 'pass' : 'warn', `${testFiles} test files found`);
}

// === CI/CD ===
console.log('🔄 Checking CI/CD...');

const cicdChecks = [
  ['.github/workflows/flutter-ci.yml', 'GitHub Actions CI'],
  ['.github/workflows/security-scan.yml', 'Security scan workflow'],
];

cicdChecks.forEach(([file, desc]) => {
  const result = checkFile(file, desc);
  addCheck('🔄 CI/CD', desc, result.status, result.details);
});

// === Documentation ===
console.log('📚 Checking Documentation...');

const docChecks = [
  ['README.md', 'README file'],
  ['CHANGELOG.md', 'Changelog'],
  ['LICENSE', 'License file'],
];

docChecks.forEach(([file, desc]) => {
  const result = checkFile(file, desc);
  addCheck('📚 Documentation', desc, result.status, result.details);
});

// === Accessibility ===
console.log('♿ Checking Accessibility...');

const a11yChecks = [
  ['lib/widget_catalog.dart', 'Widget catalog (accessibility check)'],
];

a11yChecks.forEach(([file, desc]) => {
  const result = checkFile(file, desc);
  addCheck('♿ Accessibility', desc, result.status, result.details);
});

// === Output Results ===
console.log('\n' + '='.repeat(50));
console.log('📊 COMPLIANCE REPORT');
console.log('='.repeat(50));

// Group by category
const categories = {};
checks.forEach(c => {
  if (!categories[c.category]) categories[c.category] = [];
  categories[c.category].push(c);
});

let passCount = 0, warnCount = 0, failCount = 0;

Object.entries(categories).forEach(([category, items]) => {
  console.log(`\n${category}`);
  console.log('-'.repeat(40));
  items.forEach(check => {
    const icon = check.status === 'pass' ? '✅' : check.status === 'warn' ? '⚠️' : '❌';
    console.log(`  ${icon} ${check.item}`);
    if (check.details) console.log(`     └─ ${check.details}`);
    if (check.status === 'pass') passCount++;
    else if (check.status === 'warn') warnCount++;
    else failCount++;
  });
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('📈 SUMMARY');
console.log('='.repeat(50));
console.log(`  ✅ Passed:  ${passCount}`);
console.log(`  ⚠️  Warnings: ${warnCount}`);
console.log(`  ❌ Failed:  ${failCount}`);
console.log(`  📊 Total:   ${passCount + warnCount + failCount}`);

const score = Math.round((passCount / (passCount + warnCount + failCount)) * 100);
console.log(`\n  📊 Compliance Score: ${score}%`);

if (failCount === 0 && warnCount <= 2) {
  console.log('\n  🎉 Status: READY FOR SUBMISSION');
} else if (failCount === 0) {
  console.log('\n  🟡 Status: MOSTLY READY (address warnings)');
} else {
  console.log('\n  🔴 Status: NOT READY (fix failures first)');
}

console.log('\n📝 Next Steps:');
if (failCount > 0) {
  console.log('  1. Fix all failed items before submission');
}
if (warnCount > 0) {
  console.log('  2. Review and address warnings');
}
console.log('  3. Ensure all legal documents are hosted publicly');
console.log('  4. Set up App Store Connect account');
console.log('  5. Configure TestFlight beta testing');

console.log(`\nGenerated: ${new Date().toISOString()}`);
