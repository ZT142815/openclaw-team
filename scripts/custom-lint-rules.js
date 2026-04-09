#!/usr/bin/env node
/**
 * Custom Lint Rules Generator
 *
 * 功能：
 *   为 Flutter/Dart 项目生成 LLM 可读的 Lint 规则
 *   这些规则包含 AI Agent 可以直接执行的纠正指令
 *
 * 使用方式：
 *   node custom-lint-rules.js --project [项目路径] --format [json|markdown]
 *
 *   # 生成所有规则的 LLM 纠正指南
 *   node custom-lint-rules.js --project ~/budolist --format markdown > LINT_GUIDE.md
 *
 *   # 生成 JSON 格式规则（供程序使用）
 *   node custom-lint-rules.js --project ~/budolist --format json
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// Lint 规则定义
// 每个规则包含：
//   - id: 规则 ID
//   - name: 规则名称
//   - severity: 严重程度 (error/warning/hint)
//   - pattern: 检测模式（正则或描述）
//   - why: 为什么这条规则重要
//   - fix: 如何修复（LLM 可读）
//   - example_wrong: 错误示例
//   - example_correct: 正确示例
// ============================================================

const RULES = [
  // ========== 架构相关 ==========
  {
    id: 'UI-DIRECT-REPO',
    name: 'UI Layer Direct Repository Access',
    severity: 'error',
    category: 'architecture',
    description: 'UI 层禁止直接调用 Repository',
    pattern: 'UI 文件（如 screens/, widgets/, pages/）直接 import 了 repositories/',
    why: 'UI 层应通过 Service 层间接访问数据，直接调用破坏分层架构',
    fix: '1. 在 UI 文件中注入相应的 Service\n2. 将 Repository 调用替换为 Service 调用\n3. 确保 Service 在 widget tree 上通过 Provider/Injectable 等方式可访问',
    example_wrong: `// screens/home_screen.dart
import 'package:app/repositories/user_repository.dart';  // ❌ 错误

class HomeScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final repo = UserRepository();  // ❌ 禁止
    final users = repo.getUsers();
  }
}`,
    example_correct: `// screens/home_screen.dart
import 'package:app/services/user_service.dart';  // ✅ 正确

class HomeScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final userService = context.read<UserService>();  // ✅ 通过 Provider
    final users = userService.getUsers();
  }
}`,
    agentNote: '这是架构违规。UI 必须通过 Service 访问数据，不能直接用 Repository。'
  },

  {
    id: 'MISSING-ERROR-HANDLING',
    name: 'Missing Error Handling',
    severity: 'warning',
    category: 'reliability',
    description: '异步操作缺少错误处理',
    pattern: 'async 函数中没有 try-catch 或 .catchError()',
    why: '没有错误处理的 async 代码会让异常静默失败，用户体验差且难以调试',
    fix: '1. 添加 try-catch 块\n2. 在 catch 中设置错误状态\n3. 显示用户友好的错误提示\n4. 考虑使用 Either/Result 类型',
    example_wrong: `Future<void> fetchUser() async {
  final user = await api.getUser();  // ❌ 无错误处理
}`,
    example_correct: `Future<void> fetchUser() async {
  try {
    final user = await api.getUser();
    state = UserState.loaded(user);
  } catch (e) {
    state = UserState.error(e.message);
    logger.e('Failed to fetch user', e);
  }
}`,
    agentNote: '所有异步操作必须有错误处理。异步 = 可能的失败。'
  },

  {
    id: 'DEBUG-PRINT',
    name: 'Debug Print Remaining',
    severity: 'warning',
    category: 'code-quality',
    description: '代码中仍有 print() 或 debugPrint() 调试语句',
    pattern: 'print( 或 debugPrint( 在非 test 文件中',
    why: '生产代码不应有调试输出，会污染日志',
    fix: '1. 删除所有 print() 和 debugPrint()\n2. 如需临时调试，使用 logger.d()\n3. 最终提交前确保无任何调试输出',
    example_wrong: `print('user: $user');  // ❌ 调试代码
debugPrint('result: $result');  // ❌ 调试代码`,
    example_correct: `logger.d('user fetched', {'userId': user.id});  // ✅ 使用 logger`,
    agentNote: '生产代码禁止 print/debugPrint。改用 logger.d() 或直接删除。'
  },

  {
    id: 'TODO-FIXME',
    name: 'TODO/FIXME Without Owner',
    severity: 'warning',
    category: 'code-quality',
    description: 'TODO 或 FIXME 缺少负责人和日期',
    pattern: 'TODO 或 FIXME 注释没有 (owner) 或 (date)',
    why: '无跟踪的 TODO 会变成技术债务，最终没人管',
    fix: '1. 为每个 TODO 添加格式：// TODO(your_name@email.com): [描述] - [日期]\n2. 或创建对应的 Issue/Bug\n3. 提交前优先完成或删除短期的 TODO',
    example_wrong: `// TODO: 优化这个算法  // ❌ 无跟踪
// FIXME: 可能有 bug  // ❌ 无跟踪`,
    example_correct: `// TODO(john@email.com): 优化算法性能 - 2026-04-15
// tracked in: https://github.com/org/repo/issues/123`,
    agentNote: 'TODO 必须有负责人和日期，或转成 Issue。无主的 TODO 会变成债务。'
  },

  {
    id: 'MISSING-TEST',
    name: 'Core Logic Without Test',
    severity: 'warning',
    category: 'testing',
    description: '核心业务逻辑文件缺少对应的测试文件',
    pattern: 'services/ 或 repositories/ 下有 .dart 文件但 test/ 下无对应 _test.dart',
    why: '核心逻辑没有测试保护，容易在重构或修改时引入 bug',
    fix: '1. 为每个核心 Service 创建对应的测试文件\n2. 测试应覆盖：正常路径、边界条件、错误处理\n3. 使用 mock 隔离外部依赖\n4. 运行 flutter test 确保测试通过',
    example_wrong: `// lib/services/user_service.dart 存在
// test/services/user_service_test.dart 不存在  // ❌ 缺少测试`,
    example_correct: `// lib/services/user_service.dart 存在
// test/services/user_service_test.dart 也存在  // ✅ 有测试`,
    agentNote: '核心 Service/Repository 必须有对应的单元测试文件。'
  },

  {
    id: 'SIDE-EFFECT',
    name: 'Impure Function with Side Effects',
    severity: 'warning',
    category: 'code-quality',
    description: '函数有副作用但没有明确说明',
    pattern: '返回 Future 或 void 的函数修改了外部状态但函数名不包含 Action/Do/Set 等动词',
    why: '副作用不明显的函数容易被误用，导致难以追踪的 bug',
    fix: '1. 函数名使用明确的动作动词：createUser(), deleteOrder(), updateProfile()\n2. 避免在 getter 类方法中做副作用\n3. 如果必须有副作用，在文档中说明',
    example_wrong: `class UserRepository {
  User getUser(int id) {
    _cache = fetchFromDb(id);  // ❌ 副作用不明显
    return _cache;
  }
}`,
    example_correct: `class UserRepository {
  Future<User> fetchUser(int id) async {  // ✅ 动词明确
    _cache = await _db.fetch(id);
    return _cache;
  }
}`,
    agentNote: '有副作用的函数命名要明确用动词，让调用者知道这不只是"读取"。'
  },

  {
    id: 'NULLABLE-WITHOUT-NULL-CHECK',
    name: 'Nullable Parameter Without Null Check',
    severity: 'error',
    category: 'reliability',
    description: '可空参数在使用前未检查 null',
    pattern: '函数参数是 T? 但在 body 中直接使用而没有 if-null 检查',
    why: '空指针异常是运行时最常见的崩溃原因之一',
    fix: '1. 在使用可空参数前添加 null 检查\n2. 或使用 ?. 安全调用操作符\n3. 或在函数入口添加断言 require(param != null)\n4. 考虑使用 required 修饰符使参数必填',
    example_wrong: `void processUser(User? user) {
  print(user.name);  // ❌ user 可能为 null
}`,
    example_correct: `void processUser(User? user) {
  if (user == null) return;  // ✅ 空检查
  print(user.name);
}

// 或
void processUser(@required User user) {  // ✅ 必填参数
  print(user.name);
}`,
    agentNote: '可空参数必须做 null 检查，或使用 required 强制必填。'
  },

  {
    id: 'HARDCODED-VALUE',
    name: 'Hardcoded Configuration Value',
    severity: 'hint',
    category: 'maintainability',
    description: '配置值硬编码在代码中',
    pattern: 'URL、API key、超时时间等值直接写在代码里而非配置文件',
    why: '硬编码值难以在不同环境间切换，修改需要改代码',
    fix: '1. 将配置值提取到 .env 或配置文件\n2. 通过环境变量或配置类访问\n3. 使用 flutter_config 或 dart define\n4. 敏感信息（API key）绝对不能硬编码',
    example_wrong: `final api = ApiClient('https://api.example.com');  // ❌ 硬编码
const timeout = 5000;  // ❌ 硬编码`,
    example_correct: `final api = ApiClient(Config.apiBaseUrl);  // ✅ 从配置读取
const timeout = Config.requestTimeout;  // ✅ 从配置读取`,
    agentNote: '配置值要从配置文件读取，不要硬编码。不同环境（dev/staging/prod）用不同配置。'
  },

  {
    id: 'BIG-FUNCTION',
    name: 'Function Too Long',
    severity: 'warning',
    category: 'maintainability',
    description: '函数超过 50 行',
    pattern: '函数 body 超过 50 行',
    why: '长函数难以理解、测试和维护',
    fix: '1. 将函数拆分为更小的子函数\n2. 每个子函数负责一个明确的任务\n3. 提取重复代码为共享函数\n4. 考虑使用策略模式处理分支逻辑',
    example_wrong: `Future<void> handleOrder(Order order) async {
  // 100+ 行代码  // ❌ 过长
}`,
    example_correct: `Future<void> handleOrder(Order order) async {
  await _validateOrder(order);
  await _processPayment(order);
  await _fulfillOrder(order);
  await _notifyCustomer(order);
}`,
    agentNote: '函数要短小（<50行），每个函数只做一件事。超过 50 行就拆分。'
  },

  {
    id: 'CIRCULAR-DEPENDENCY',
    name: 'Circular Dependency Detected',
    severity: 'error',
    category: 'architecture',
    description: '模块间存在循环依赖',
    pattern: 'A imports B 且 B imports A',
    why: '循环依赖导致代码耦合，难以单独测试和维护',
    fix: '1. 找出循环依赖的路径\n2. 将共享部分提取到第三个模块 C\n3. A 和 B 都依赖 C，而不是互相依赖\n4. 使用依赖注入解耦',
    example_wrong: `// user_service.dart
import 'order_service.dart';  // order_service 也 import 了 user_service  // ❌ 循环`,
    example_correct: `// user_service.dart
import 'repositories/user_repository.dart';  // ✅ 单向依赖

// order_service.dart
import 'repositories/user_repository.dart';  // ✅ 共享底层，不循环`,
    agentNote: '循环依赖是严重架构问题。确保 layer 之间的依赖是单向的。'
  }
];

// ============================================================
// 工具函数
// ============================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    projectPath: process.cwd(),
    format: 'markdown',  // json 或 markdown
    filter: null         // 按 category 过滤
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--project':
        options.projectPath = args[++i].replace(/^~/, require('os').homedir());
        break;
      case '--format':
        options.format = args[++i];
        break;
      case '--category':
        options.filter = args[++i];
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
📋 Custom Lint Rules Generator

用法:
  node custom-lint-rules.js [选项]

选项:
  --project [路径]    项目路径 (默认: 当前目录)
  --format [格式]     输出格式: markdown 或 json (默认: markdown)
  --category [名称]   按分类过滤: architecture, reliability, code-quality, testing, maintainability
  --help              显示此帮助

示例:
  # 生成 Markdown 格式的 Lint 指南
  node custom-lint-rules.js --project ~/budolist --format markdown > LINT_GUIDE.md

  # 生成 JSON 格式供程序使用
  node custom-lint-rules.js --project ~/budolist --format json

  # 只看架构相关的规则
  node custom-lint-rules.js --format markdown --category architecture
`);
}

// ============================================================
// 格式化输出
// ============================================================

function formatMarkdown(rules, options) {
  let output = `# Lint 规则指南 (AI Agent)

> 此文件为 AI Agent 提供可执行的代码规范纠正指令
> 生成时间: ${new Date().toISOString()}

## 总览

共 ${rules.length} 条规则

| ID | 名称 | 严重程度 | 分类 |
|----|------|---------|------|
${rules.map(r => `| ${r.id} | ${r.name} | ${r.severity} | ${r.category} |`).join('\n')}

---

## 详细规则

${rules.map(rule => `
### ${rule.id}: ${rule.name}

**严重程度**: ${rule.severity.toUpperCase()}
**分类**: ${rule.category}

**问题**: ${rule.description}

**为什么重要**: ${rule.why}

**修复方法**:
${rule.fix.split('\n').map(line => `  ${line}`).join('\n')}

**错误示例**:
\`\`\`dart
${rule.example_wrong}
\`\`\`

**正确示例**:
\`\`\`dart
${rule.example_correct}
\`\`\`

**AI Agent 注意**:
> ${rule.agentNote}

---
`).join('\n')}

## 按分类索引

${['architecture', 'reliability', 'code-quality', 'testing', 'maintainability'].map(cat => {
  const catRules = rules.filter(r => r.category === cat);
  if (catRules.length === 0) return '';
  return `### ${cat}\n${catRules.map(r => `- ${r.id}: ${r.name}`).join('\n')}`;
}).filter(Boolean).join('\n\n')}
`;
  return output;
}

function formatJSON(rules) {
  return JSON.stringify({
    version: '1.0',
    generated: new Date().toISOString(),
    totalRules: rules.length,
    rules: rules
  }, null, 2);
}

// ============================================================
// 主逻辑
// ============================================================

function main() {
  const options = parseArgs();

  // 加载项目自定义规则（如果存在）
  let projectRules = [];
  const projectRulesPath = path.join(options.projectPath, 'lint_rules.json');
  if (fs.existsSync(projectRulesPath)) {
    try {
      projectRules = JSON.parse(fs.readFileSync(projectRulesPath, 'utf-8'));
      console.error(`Loaded ${projectRules.length} custom rules from project`);
    } catch (e) {
      console.error(`Warning: Failed to load project rules: ${e.message}`);
    }
  }

  // 合并规则（项目自定义优先）
  const allRules = [...RULES, ...projectRules];

  // 按分类过滤
  let filtered = allRules;
  if (options.filter) {
    filtered = allRules.filter(r => r.category === options.filter);
  }

  // 输出
  switch (options.format) {
    case 'json':
      console.log(formatJSON(filtered));
      break;
    case 'markdown':
    default:
      console.log(formatMarkdown(filtered, options));
      break;
  }
}

main();
