#!/usr/bin/env node
/**
 * macos-control.js
 * macOS 系统控制脚本 - AppleScript 驱动
 * 
 * 功能：
 * - 应用控制（打开/关闭/切换）
 * - 窗口管理
 * - 系统设置
 * - 文件操作
 * - 剪贴板
 * - 通知
 */

const { execSync } = require('child_process');

const args = process.argv.slice(2);
const command = args[0];

function runAppleScript(script) {
  try {
    return execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
  } catch (error) {
    return error.stdout || error.message;
  }
}

function runCommand(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8' });
  } catch (error) {
    return error.stdout || error.message;
  }
}

switch (command) {
  case 'open':
    // 打开应用或文件
    runCommand(`open "${args[1]}"`);
    console.log(`✅ 已打开: ${args[1]}`);
    break;

  case 'close':
    // 关闭应用
    runAppleScript(`tell application "${args[1]}" to quit`);
    console.log(`✅ 已关闭: ${args[1]}`);
    break;

  case 'front':
    // 将应用移到前台
    runAppleScript(`tell application "${args[1]}" to activate`);
    console.log(`✅ 已激活: ${args[1]}`);
    break;

  case 'running':
    // 列出运行中的应用
    const apps = runAppleScript(`
      tell application "System Events"
        set appList to name of every process whose background only is false
      end tell
      appList as string
    `);
    console.log('运行中的应用:\n' + apps);
    break;

  case 'windows':
    // 列出窗口
    const windows = runAppleScript(`
      tell application "${args[1]}"
        set windowList to name of every window
      end tell
      if windowList is {} then
        return "无窗口"
      else
        windowList as string
      end if
    `);
    console.log(`${args[1]} 的窗口:\n` + windows);
    break;

  case 'click':
    // 点击屏幕坐标 (需要启用辅助功能权限)
    runCommand(`osascript -e 'tell application "System Events" to click at {${args[1]}, ${args[2]}}'`);
    console.log(`✅ 点击坐标: ${args[1]}, ${args[2]}`);
    break;

  case 'keystroke':
    // 模拟按键
    runAppleScript(`tell application "System Events" to keystroke "${args[1]}"`);
    console.log(`✅ 按键: ${args[1]}`);
    break;

  case 'keycode':
    // 使用 keycode
    runAppleScript(`tell application "System Events" to key code ${args[1]}`);
    console.log(`✅ KeyCode: ${args[1]}`);
    break;

  case 'volume':
    // 音量控制 (0-7)
    const vol = parseInt(args[1]) || 5;
    runCommand(`osascript -e 'set volume output volume ${vol * 12.5}'`);
    console.log(`✅ 音量: ${args[1]}/7`);
    break;

  case 'mute':
    runCommand(`osascript -e 'set volume output muted true'`);
    console.log('✅ 已静音');
    break;

  case 'unmute':
    runCommand(`osascript -e 'set volume output muted false'`);
    console.log('✅ 已取消静音');
    break;

  case 'brightness':
    // 屏幕亮度 (0-100)
    runCommand(`osascript -e 'set brightness of display to ${(args[1] || 50) / 100}'`);
    console.log(`✅ 亮度: ${args[1]}%`);
    break;

  case 'screenshot':
    // 截图
    const path = args[1] || `screenshot-${Date.now()}.png`;
    runCommand(`screencapture "${path}"`);
    console.log(`✅ 截图已保存: ${path}`);
    break;

  case 'screencapture':
    // 带选区的截图
    runCommand(`screencapture -i "${args[1] || 'screenshot.png'}"`);
    console.log('✅ 截图完成');
    break;

  case 'clipboard':
    // 剪贴板
    if (args[1]) {
      runCommand(`echo "${args[1]}" | pbcopy`);
      console.log(`✅ 已复制到剪贴板: ${args[1]}`);
    } else {
      const content = runCommand('pbpaste');
      console.log(`剪贴板内容: ${content}`);
    }
    break;

  case 'notify':
    // 发送通知
    runAppleScript(`display notification "${args.slice(1).join(' ') || '通知'}" with title "OpenClaw"`);
    console.log('✅ 通知已发送');
    break;

  case 'dialog':
    // 显示对话框
    const result = runAppleScript(`
      display dialog "${args.slice(1).join(' ') || '对话框'}" buttons {"确定", "取消"} default button 1
    `);
    console.log(`对话框结果: ${result}`);
    break;

  case 'input':
    // 显示输入框
    const input = runAppleScript(`
      text returned of (display dialog "${args.slice(1).join(' ') || '请输入'}" default answer "")
    `);
    console.log(`输入内容: ${input}`);
    break;

  case 'folder':
    // 在 Finder 中打开文件夹
    runCommand(`open "${args[1] || '.'}"`);
    console.log(`✅ 已在 Finder 中打开`);
    break;

  case 'trash':
    // 移到废纸篓
    runCommand(`osascript -e 'tell application "Finder" to delete POSIX file "${args[1]}"'`);
    console.log(`✅ 已移到废纸篓: ${args[1]}`);
    break;

  case 'sleep':
    runCommand(`pmset displaysleepnow`);
    console.log('✅ 屏幕已进入睡眠');
    break;

  case 'lock':
    runCommand(`/System/Library/CoreServices/Menu\\ Extras/User.menu/Contents/Resources/CGSession -suspend`);
    console.log('✅ 已锁定屏幕');
    break;

  case 'restart':
    runCommand(`osascript -e 'tell application "System Events" to restart'`);
    console.log('✅ 正在重启...');
    break;

  case 'shutdown':
    runCommand(`osascript -e 'tell application "System Events" to shut down'`);
    console.log('✅ 正在关机...');
    break;

  case 'finder':
    // Finder 操作
    runAppleScript(`
      tell application "Finder"
        ${args.slice(1).join(' ')}
      end tell
    `);
    console.log('✅ Finder 命令已执行');
    break;

  case 'system':
    // 获取系统信息
    const info = runCommand(`sw_vers && system_profiler SPHardwareDataType | head -20`);
    console.log(info);
    break;

  default:
    console.log(`
macos-control.js - macOS 系统控制

用法：
  node macos-control.js <命令> [参数]

应用控制：
  open <path>          打开应用/文件
  close <app>         关闭应用
  front <app>          激活应用
  running              列出运行中的应用
  windows <app>        列出应用的窗口

界面控制：
  click <x> <y>        点击坐标
  keystroke <key>     模拟按键
  keycode <code>       使用 keycode

系统设置：
  volume [0-7]         设置音量
  mute                 静音
  unmute               取消静音
  brightness [0-100]   设置亮度
  sleep                睡眠
  lock                 锁屏
  restart              重启
  shutdown             关机

文件操作：
  screenshot [path]    截图
  screencapture [path] 选区截图
  folder [path]        在 Finder 中打开
  trash <path>         移到废纸篓

剪贴板：
  clipboard [text]    读取或写入剪贴板

通知：
  notify <message>     发送通知
  dialog <message>    显示对话框
  input <prompt>       显示输入框

系统：
  system              系统信息
  finder <applescript> 执行 Finder 命令
    `);
}
