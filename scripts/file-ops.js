#!/usr/bin/env node
/**
 * file-ops.js
 * 文件操作脚本
 * 
 * 功能：
 * - 读取/写入文件
 * - 复制/移动/删除
 * - 查找文件
 * - 批量操作
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const command = args[0];

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✅ 已写入: ${filePath}`);
}

function copyFile(src, dest) {
  fs.copyFileSync(src, dest);
  console.log(`✅ 已复制: ${src} -> ${dest}`);
}

function moveFile(src, dest) {
  fs.renameSync(src, dest);
  console.log(`✅ 已移动: ${src} -> ${dest}`);
}

function deleteFile(filePath) {
  fs.unlinkSync(filePath);
  console.log(`✅ 已删除: ${filePath}`);
}

function makeDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
  console.log(`✅ 已创建目录: ${dirPath}`);
}

function listDir(dirPath) {
  const files = fs.readdirSync(dirPath);
  files.forEach(f => {
    const fullPath = path.join(dirPath, f);
    const stat = fs.statSync(fullPath);
    const type = stat.isDirectory() ? '📁' : '📄';
    const size = stat.isFile() ? ` (${stat.size} bytes)` : '';
    console.log(`${type} ${f}${size}`);
  });
}

function findFiles(dir, pattern) {
  const results = [];
  function search(currentDir) {
    const files = fs.readdirSync(currentDir);
    files.forEach(f => {
      const fullPath = path.join(currentDir, f);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        search(fullPath);
      } else if (pattern.test(f)) {
        results.push(fullPath);
      }
    });
  }
  search(dir);
  return results;
}

function getFileInfo(filePath) {
  const stat = fs.statSync(filePath);
  console.log(`
文件: ${filePath}
大小: ${stat.size} bytes
创建: ${stat.birthtime}
修改: ${stat.mtime}
类型: ${stat.isDirectory() ? '目录' : '文件'}
  `);
}

switch (command) {
  case 'read':
    console.log(readFile(args[1]));
    break;

  case 'write':
    writeFile(args[1], args[2] || '');
    break;

  case 'append':
    fs.appendFileSync(args[1], args[2] || '\n');
    console.log(`✅ 已追加: ${args[1]}`);
    break;

  case 'copy':
    copyFile(args[1], args[2]);
    break;

  case 'move':
    moveFile(args[1], args[2]);
    break;

  case 'delete':
    deleteFile(args[1]);
    break;

  case 'mkdir':
    makeDir(args[1]);
    break;

  case 'ls':
    listDir(args[1] || '.');
    break;

  case 'find':
    const pattern = new RegExp(args[2] || '.*');
    const found = findFiles(args[1] || '.', pattern);
    console.log(`找到 ${found.length} 个文件:`);
    found.forEach(f => console.log(`  ${f}`));
    break;

  case 'info':
    getFileInfo(args[1]);
    break;

  case 'exists':
    console.log(fs.existsSync(args[1]) ? '存在' : '不存在');
    break;

  case 'mkdirp':
    fs.mkdirSync(args[1], { recursive: true });
    console.log(`✅ 已创建: ${args[1]}`);
    break;

  case 'rmdir':
    fs.rmdirSync(args[1]);
    console.log(`✅ 已删除目录: ${args[1]}`);
    break;

  case 'cat':
    console.log(readFile(args[1]));
    break;

  case 'tree':
    function printTree(dir, prefix = '') {
      const files = fs.readdirSync(dir);
      files.forEach((f, i) => {
        const fullPath = path.join(dir, f);
        const stat = fs.statSync(fullPath);
        const isLast = i === files.length - 1;
        const type = stat.isDirectory() ? '📁' : '📄';
        console.log(`${prefix}${isLast ? '└──' : '├──'} ${type} ${f}`);
        if (stat.isDirectory()) {
          printTree(fullPath, prefix + (isLast ? '    ' : '│   '));
        }
      });
    }
    printTree(args[1] || '.');
    break;

  case 'size':
    function getDirSize(dir) {
      let size = 0;
      const files = fs.readdirSync(dir);
      files.forEach(f => {
        const fullPath = path.join(dir, f);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          size += getDirSize(fullPath);
        } else {
          size += stat.size;
        }
      });
      return size;
    }
    const size = getDirSize(args[1] || '.');
    console.log(`目录大小: ${(size / 1024 / 1024).toFixed(2)} MB`);
    break;

  case 'glob':
    const glob = require('glob');
    const files = glob.sync(args[1] || '*');
    files.forEach(f => console.log(f));
    break;

  default:
    console.log(`
file-ops.js - 文件操作脚本

用法：
  node file-ops.js <命令> [参数]

读取/写入：
  read <file>            读取文件
  write <file> <content> 写入文件
  append <file> <content> 追加到文件

文件操作：
  copy <src> <dest>     复制
  move <src> <dest>     移动
  delete <file>         删除

目录操作：
  ls [dir]               列出目录
  mkdir <dir>           创建目录
  mkdirp <dir>          递归创建目录
  rmdir <dir>           删除空目录

查找：
  find <dir> [pattern]   查找文件
  glob <pattern>        glob 模式匹配

信息：
  info <file>           文件信息
  exists <file>        检查存在
  tree [dir]           目录树
  size [dir]           目录大小
  cat <file>            显示文件内容
    `);
}
