#!/usr/bin/env node
/**
 * api-test.js
 * API接口自动化测试
 * 
 * 功能：
 * - 测试REST API
 * - 验证响应状态码
 * - 验证响应数据格式
 * - 性能测试
 */

const http = require('http');
const https = require('https');

const args = process.argv.slice(2);
const command = args[0];

// 默认配置
let config = {
  baseUrl: 'http://localhost:8080',
  token: null,
  timeout: 5000
};

// 测试用例
const testCases = [
  // 首页测试
  {
    name: 'GET / - 首页',
    method: 'GET',
    path: '/',
    expectedStatus: 200,
    validate: (body) => body.includes('html') || body.length > 0
  },
  // 健康检查
  {
    name: 'GET /health - 健康检查',
    method: 'GET',
    path: '/health',
    expectedStatus: 200,
    validate: (body) => true
  },
  // API测试（如果后端存在）
  {
    name: 'GET /api/users - 获取用户列表',
    method: 'GET',
    path: '/api/users',
    expectedStatus: 200,
    auth: true,
    validate: (body) => {
      try {
        const data = JSON.parse(body);
        return Array.isArray(data) || typeof data === 'object';
      } catch {
        return false;
      }
    }
  },
  {
    name: 'POST /api/users - 创建用户',
    method: 'POST',
    path: '/api/users',
    expectedStatus: 201,
    auth: true,
    body: { name: 'Test User', email: 'test@example.com' },
    validate: (body) => {
      try {
        const data = JSON.parse(body);
        return data.id || data.name === 'Test User';
      } catch {
        return false;
      }
    }
  }
];

// HTTP请求
function request(method, url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      }
    };
    
    const req = client.request(reqOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body,
          time: options.startTime ? Date.now() - options.startTime : 0
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(config.timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// 运行单个测试
async function runTest(testCase) {
  const url = config.baseUrl + testCase.path;
  const headers = {};
  
  // 添加认证
  if (testCase.auth && config.token) {
    headers['Authorization'] = `Bearer ${config.token}`;
  }
  
  const startTime = Date.now();
  
  try {
    const response = await request(testCase.method, url, {
      headers,
      body: testCase.body,
      startTime
    });
    
    const passed = 
      response.status === testCase.expectedStatus &&
      testCase.validate(response.body, response);
    
    return {
      name: testCase.name,
      method: testCase.method,
      path: testCase.path,
      status: response.status,
      expectedStatus: testCase.expectedStatus,
      time: response.time,
      passed,
      error: passed ? null : `期望状态 ${testCase.expectedStatus}，实际 ${response.status}`
    };
    
  } catch (error) {
    return {
      name: testCase.name,
      method: testCase.method,
      path: testCase.path,
      status: 0,
      expectedStatus: testCase.expectedStatus,
      time: 0,
      passed: false,
      error: error.message
    };
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('='.repeat(70));
  console.log('  API接口测试');
  console.log('='.repeat(70));
  console.log(`测试URL: ${config.baseUrl}`);
  console.log(`超时: ${config.timeout}ms`);
  console.log('');

  let passed = 0;
  let failed = 0;
  const results = [];

  for (const testCase of testCases) {
    process.stdout.write(`测试: ${testCase.name.padEnd(40)}`);
    
    const result = await runTest(testCase);
    results.push(result);
    
    if (result.passed) {
      console.log(`✅ ${result.status} (${result.time}ms)`);
      passed++;
    } else {
      console.log(`❌ ${result.error || '失败'}`);
      failed++;
    }
  }

  console.log('\n' + '-'.repeat(70));
  console.log('测试结果汇总');
  console.log('-'.repeat(70));
  
  console.log(`\n通过: ${passed}/${passed + failed}`);
  console.log(`失败: ${failed}/${passed + failed}`);
  console.log(`通过率: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n失败详情:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }

  console.log('\n' + '='.repeat(70));

  return failed === 0 ? 0 : 1;
}

// 交互式API测试
async function interactiveTest() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('\n📡 交互式API测试');
  console.log('输入请求信息（直接回车使用默认值）\n');

  const method = await question('请求方法 (GET/POST/PUT/DELETE): ') || 'GET';
  const path = await question('路径 (如 /api/users): ') || '/';
  const body = await question('请求体 (JSON格式，可选): ');
  
  const testCase = {
    name: `${method} ${path}`,
    method: method.toUpperCase(),
    path,
    expectedStatus: 200,
    body: body ? JSON.parse(body) : undefined,
    validate: () => true
  };

  console.log('\n执行测试...\n');
  
  const result = await runTest(testCase);
  
  console.log('\n结果:');
  console.log(`  状态码: ${result.status}`);
  console.log(`  响应时间: ${result.time}ms`);
  console.log(`  测试结果: ${result.passed ? '✅ 通过' : '❌ 失败'}`);
  
  if (result.passed) {
    console.log('\n响应内容:');
    console.log(result.body.substring(0, 500));
  }

  rl.close();
}

function question(prompt) {
  return new Promise((resolve) => {
    const rl = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// 性能测试
async function performanceTest() {
  console.log('\n⚡ 性能测试模式');
  
  const endpoint = args[2] || '/';
  const iterations = parseInt(args[3]) || 10;
  
  console.log(`测试端点: ${endpoint}`);
  console.log(`测试次数: ${iterations}\n`);
  
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    try {
      await request('GET', config.baseUrl + endpoint, { startTime });
      const time = Date.now() - startTime;
      times.push(time);
      process.stdout.write(`\r  ${i + 1}/${iterations}: ${time}ms`);
    } catch (e) {
      console.log(`\n  请求失败: ${e.message}`);
    }
  }
  
  if (times.length > 0) {
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    
    console.log('\n\n性能统计:');
    console.log(`  平均: ${avg.toFixed(2)}ms`);
    console.log(`  最小: ${min}ms`);
    console.log(`  最大: ${max}ms`);
  }
}

// 帮助
function showHelp() {
  console.log(`
api-test.js - API接口测试

用法:
  node api-test.js [command] [options]

命令:
  test              运行预定义测试用例
  interactive       交互式测试
  perf [endpoint] [count]  性能测试
  help              显示帮助

示例:
  node api-test.js test
  node api-test.js test --url https://api.example.com
  node api-test.js interactive
  node api-test.js perf /api/users 50

配置:
  --url <url>      设置测试URL (默认 http://localhost:8080)
  --token <token>  设置认证Token
`);
}

// 解析参数
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--url' && args[i + 1]) {
    config.baseUrl = args[i + 1];
    i++;
  } else if (args[i] === '--token' && args[i + 1]) {
    config.token = args[i + 1];
    i++;
  }
}

switch (command) {
  case 'test':
    runAllTests();
    break;
  case 'interactive':
    interactiveTest();
    break;
  case 'perf':
    performanceTest();
    break;
  default:
    showHelp();
}
