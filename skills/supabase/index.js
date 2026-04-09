#!/usr/bin/env node

/**
 * Supabase Skill for OpenClaw
 * 
 * 提供 Supabase 数据库操作的工具能力
 */

const { createClient } = require('@supabase/supabase-js');

// 从环境变量获取配置
const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

// 如果有配置，创建客户端
let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase 客户端已初始化');
  console.log(`📡 连接到: ${supabaseUrl}`);
} else {
  console.log('⚠️ 请配置环境变量:');
  console.log('   SUPABASE_URL (或 SUPABASE_PROJECT_URL)');
  console.log('   SUPABASE_ANON_KEY (或 SUPABASE_KEY)');
}

// 解析命令行参数
const args = process.argv.slice(2);
const command = args[0];

async function runCommand() {
  if (!supabase) {
    console.error('❌ Supabase 未配置');
    process.exit(1);
  }

  switch (command) {
    case '--test':
    case '--ping':
      // 测试连接
      try {
        const { data, error } = await supabase.from('*').select('count').limit(1);
        if (error) {
          console.log('❌ 连接失败:', error.message);
        } else {
          console.log('✅ Supabase 连接成功!');
        }
      } catch (e) {
        console.log('❌ 连接失败:', e.message);
      }
      break;

    case '--list-tables':
      // 列出所有表
      try {
        const { data, error } = await supabase.rpc('list_tables');
        console.log('📋 表列表:', data || error);
      } catch (e) {
        console.log('❌ 错误:', e.message);
      }
      break;

    default:
      console.log(`
🔧 Supabase Skill 使用方法:

  配置环境变量:
    export SUPABASE_URL=your-project-url
    export SUPABASE_ANON_KEY=your-anon-key

  命令:
    supabase --test        测试连接
    supabase --list-tables 列出所有表

  在 OpenClaw 中使用:
    Developer Agent 可以直接调用 Supabase 进行数据库操作
`);
  }
}

if (command) {
  runCommand();
}
