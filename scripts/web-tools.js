#!/usr/bin/env node
/**
 * web-tools.js
 * 网络和 URL 工具
 */

const http = require('http');
const https = require('https');
const { execSync } = require('child_process');

const args = process.argv.slice(2);
const command = args[0];

function fetch(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function main() {
  switch (command) {
    case 'fetch':
    case 'get':
      try {
        const content = await fetch(args[1]);
        console.log(content);
      } catch (e) {
        console.log(`❌ 请求失败: ${e.message}`);
      }
      break;

    case 'curl':
      try {
        const result = execSync(`curl -s "${args[1]}"`, { encoding: 'utf-8' });
        console.log(result);
      } catch (e) {
        console.log(`❌ curl 失败: ${e.message}`);
      }
      break;

    case 'headers':
      try {
        const result = execSync(`curl -I -s "${args[1]}"`, { encoding: 'utf-8' });
        console.log(result);
      } catch (e) {
        console.log(`❌ 请求失败: ${e.message}`);
      }
      break;

    case 'download':
      const filename = args[2] || path.basename(args[1]);
      execSync(`curl -sL "${args[1]}" -o "${filename}"`);
      console.log(`✅ 已下载: ${filename}`);
      break;

    case 'json':
      try {
        const content = await fetch(args[1]);
        const json = JSON.parse(content);
        console.log(JSON.stringify(json, null, 2));
      } catch (e) {
        console.log(`❌ 解析失败: ${e.message}`);
      }
      break;

    case 'clipboard':
      if (args[1]) {
        // 写入剪贴板
        execSync(`echo "${args[1]}" | pbcopy`);
        console.log(`✅ 已复制: ${args[1]}`);
      } else {
        // 读取剪贴板
        const content = execSync('pbpaste', { encoding: 'utf-8' });
        console.log(content);
      }
      break;

    case 'copy':
      execSync(`echo "${args.slice(1).join(' ')}" | pbcopy`);
      console.log('✅ 已复制到剪贴板');
      break;

    case 'paste':
      console.log(execSync('pbpaste', { encoding: 'utf-8' }));
      break;

    case 'urlencode':
      console.log(encodeURIComponent(args.slice(1).join(' ')));
      break;

    case 'urldecode':
      console.log(decodeURIComponent(args[1]));
      break;

    case 'base64encode':
      console.log(Buffer.from(args.slice(1).join(' ')).toString('base64'));
      break;

    case 'base64decode':
      console.log(Buffer.from(args[1], 'base64').toString('utf-8'));
      break;

    case 'md5':
      const md5 = require('crypto').createHash('md5');
      console.log(md5.update(args.slice(1).join(' ')).digest('hex'));
      break;

    case 'sha256':
      const sha256 = require('crypto').createHash('sha256');
      console.log(sha256.update(args.slice(1).join(' ')).digest('hex'));
      break;

    case 'ip':
      try {
        const content = await fetch('https://api.ipify.org');
        console.log(`公网 IP: ${content}`);
      } catch (e) {
        console.log(`获取失败: ${e.message}`);
      }
      break;

    case 'useragent':
      console.log('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      break;

    default:
      console.log(`
web-tools.js - 网络和 URL 工具

用法：
  node web-tools.js <命令> [参数]

网络请求：
  fetch <url>           获取页面内容
  curl <url>           curl 请求
  headers <url>         获取响应头
  download <url> [file] 下载文件
  json <url>           获取并格式化 JSON

剪贴板：
  clipboard [text]     读取或写入剪贴板
  copy <text>          复制到剪贴板
  paste                读取剪贴板

编码转换：
  urlencode <text>     URL 编码
  urldecode <text>    URL 解码
  base64encode <text> Base64 编码
  base64decode <text> Base64 解码

哈希：
  md5 <text>           MD5
  sha256 <text>        SHA256

其他：
  ip                   公网 IP
  useragent            默认 User-Agent
      `);
  }
}

main().catch(console.error);
