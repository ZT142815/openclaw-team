# Supabase Skill

> 提供 Supabase 数据库操作能力给 AI Agent

## 功能

### 1. 连接测试
测试 Supabase 连接是否正常

### 2. 数据库操作
- 查询数据
- 插入数据
- 更新数据
- 删除数据

### 3. 表操作
- 列出所有表
- 创建表
- 删除表

### 4. 用户认证
- 注册用户
- 登录验证
- 重置密码

## 配置

### 环境变量

```bash
# 方式1: 项目 URL + ANON KEY
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_ANON_KEY=your-anon-key

# 方式2: 直接用完整 URL
export SUPABASE_PROJECT_URL=https://your-project.supabase.co
export SUPABASE_KEY=your-service-key
```

## 使用方法

### 测试连接
```bash
node index.js --test
```

### 列出表
```bash
node index.js --list-tables
```

## 在 OpenClaw 中使用

Developer Agent 可以直接使用 Supabase 进行：
- 测试数据库连接
- 执行 CRUD 操作
- 管理用户认证

## 依赖

- @supabase/supabase-js

## 示例代码

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// 查询数据
const { data, error } = await supabase
  .from('users')
  .select('*');
```
