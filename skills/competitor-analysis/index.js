#!/usr/bin/env node
/**
 * Competitor Analysis Skill for OpenClaw
 * 委托到 scripts/competitor-analysis.js
 */
const { spawn } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const scriptPath = path.join(__dirname, '..', 'scripts', 'competitor-analysis.js');

const child = spawn('node', [scriptPath, ...args], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit'
});

child.on('exit', (code) => process.exit(code || 0));
