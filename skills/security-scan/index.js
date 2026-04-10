#!/usr/bin/env node
/**
 * Security Scan Skill for OpenClaw
 * 委托到 scripts/security-scan.js
 */
const { spawn } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const scriptPath = path.join(__dirname, '..', 'scripts', 'security-scan.js');

const child = spawn('node', [scriptPath, ...args], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit'
});

child.on('exit', (code) => process.exit(code || 0));
