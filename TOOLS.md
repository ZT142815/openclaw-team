

# TOOLS.md - Developer Agent 工具配置

## 第四层：工具层

> **每次启动时读取此文件，了解可用工具**

---

## 一、App 开发环境

### 1.1 React Native / Expo

| 工具 | 安装方式 | 用途 |
|------|----------|------|
| Node.js | 20.x+ | JavaScript 运行时 |
| Expo CLI | `npm install -g expo-cli` | 快速原型开发 |
| EAS CLI | `npm install -g eas-cli` | 云端构建/发布 |
| Watchman | [官网安装](https://facebook.github.io/watchman/) | 文件监控 |

**Expo 项目初始化**：
```bash
npx create-expo-app my-app
cd my-app
npx expo start
```

**组件库安装**：
```bash
# gluestack-ui（首选）
npx expo install @gluestack-ui/themed

# react-native-paper
npx expo install react-native-paper react-native-safe-area-context
```

### 1.2 Flutter

| 工具 | 安装方式 | 用途 |
|------|----------|------|
| Flutter SDK | [官网下载](https://docs.flutter.dev/get-started/install) | 框架 |
| Dart | Flutter 自带 | 语言 |

**Flutter 项目初始化**：
```bash
flutter create my_app
cd my_app
flutter run
```

---

## 二、后端环境

### 2.1 Supabase

| 工具 | 安装方式 | 用途 |
|------|----------|------|
| Supabase CLI | [官网安装](https://supabase.com/docs/guides/cli) | 本地开发 |

**Supabase 命令**：
```bash
# 初始化项目
supabase init

# 启动本地开发
supabase start

# 创建迁移
supabase migration new add_users

# 推送数据库
supabase db push

# 部署 Edge Functions
supabase functions deploy [函数名]
```

---

## 三、版本控制

### 3.1 GitHub CLI

| 工具 | 安装方式 | 用途 |
|------|----------|------|
| GitHub CLI | [官网安装](https://cli.github.com/) | GitHub 操作 |

**常用命令**：
```bash
# 登录
gh auth login

# 创建仓库
gh repo create [owner]/[repo] --public --clone

# 创建 PR
gh pr create --title "feat: 功能名" --body "功能描述"

# 查看状态
gh repo view
```

### 3.2 Git

| 工具 | 版本 | 用途 |
|------|------|------|
| Git | 最新版 | 版本控制 |

---

## 四、代码质量工具

### 4.1 React Native

| 工具 | 用途 | 常用命令 |
|------|------|----------|
| ESLint | 代码检查 | `npm run lint` |
| Prettier | 代码格式化 | `npm run format` |
| Jest | 单元测试 | `npm test` |
| Detox | E2E 测试 | `npx detox test` |

### 4.2 Flutter

| 工具 | 用途 | 常用命令 |
|------|------|----------|
| dart analyze | 代码分析 | `flutter analyze` |
| flutter test | 单元测试 | `flutter test` |
| flutter build | 构建打包 | `flutter build apk` |

---

## 五、部署工具

### 5.1 React Native 部署

| 工具 | 用途 | 命令 |
|------|------|------|
| EAS Build | 云端构建 | `eas build` |
| EAS Submit | 应用市场 | `eas submit` |

```bash
# iOS 构建
eas build --platform ios --profile production

# Android 构建
eas build --platform android --profile production

# 提交到商店
eas submit --platform ios
eas submit --platform android
```

### 5.2 Flutter 部署

| 平台 | 命令 |
|------|------|
| iOS | `flutter build ios --release` |
| Android | `flutter build appbundle` |

---

## 六、项目模板

### 6.1 项目存放目录

```
~/.openclaw/projects/
├── [项目名]/
│   ├── PRD.md              # 产品需求文档
│   ├── SPEC.md             # 技术规格说明
│   ├── src/                # 源代码
│   │   ├── app/           # App 主代码
│   │   ├── components/    # UI 组件
│   │   ├── screens/       # 页面
│   │   ├── services/      # API/服务
│   │   ├── utils/         # 工具函数
│   │   └── store/         # 状态管理
│   ├── tests/              # 测试文件
│   ├── docs/               # 文档
│   └── README.md           # 项目说明
```

### 6.2 Expo 项目结构

```
my-app/
├── src/
│   ├── app/              # 页面路由
│   ├── components/       # 组件
│   ├── hooks/            # 自定义 Hooks
│   ├── services/         # API 服务
│   └── utils/            # 工具函数
├── app.json
├── package.json
└── tsconfig.json
```

### 6.3 Flutter 项目结构

```
my_app/
├── lib/
│   ├── main.dart
│   ├── screens/          # 页面
│   ├── widgets/          # 组件
│   ├── services/         # 服务
│   └── utils/            # 工具
├── pubspec.yaml
└── analysis_options.yaml
```

---

## 七、Skills 技能扩展

### 7.1 已安装的 Skills

| Skill | 功能 | 使用命令 | 状态 |
|-------|------|----------|------|
| github | GitHub CLI 集成 | /github | ✅ 已配置 |
| supabase | Supabase 辅助 | /supabase | ✅ 已配置 |
| coding-agent | 编码代理 | /coding-agent | ✅ 已配置 |
| feishu | 飞书集成 | /feishu | ✅ 已配置 |
| web-search | 联网搜索 | /search | ✅ 已配置 |

### 7.2 Skills 安装命令

```bash
# GitHub CLI（内置，无需安装）
# Supabase
npx clawhub@latest install supabase --workdir ~/.openclaw/workspace-developer

# Coding Agent
npx clawhub@latest install coding-agent --workdir ~/.openclaw/workspace-developer
```

### 7.3 Skills 使用场景

```
场景                    → 调用的 Skill
─────────────────────────────────────────
创建 GitHub 仓库        → /github
提交代码 / PR           → /github
设计 Supabase 数据库    → /supabase
配置用户认证            → /supabase
编写 App 代码          → /coding-agent
搜索技术文档           → /search
```

---

## 八、环境变量

### 8.1 配置文件位置

```
~/.openclaw/.env
```

### 8.2 必需的环境变量

```bash
# Supabase（已在本地配置）
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGc...

# GitHub（通过 gh auth login 配置）
# 无需手动设置环境变量
```

---

## 九、UI 组件库速查

### 9.1 React Native 组件库

| 组件库 | 安装命令 | 文档 |
|--------|----------|------|
| **gluestack-ui** | `npx expo install @gluestack-ui/themed` | [文档](https://gluestack.io/) |
| react-native-paper | `npx expo install react-native-paper` | [文档](https://reactnativepaper.com/) |
| tamagui | `npx expo install @tamagui/core` | [文档](https://tamagui.dev/) |

### 9.2 Flutter 组件库

| 组件库 | 安装方式 | 文档 |
|--------|----------|------|
| Material Design 3 | Flutter 内置 | [文档](https://m3.material.io/) |
| fluttery | `flutter pub add fluttery` | [文档](https://fluttery.io/) |

### 9.3 色彩系统

```
主色调：
├── Primary:   #6366F1
├── Secondary: #8B5CF6
├── Success:   #22C55E
├── Warning:   #F59E0B
└── Error:     #EF4444
```

---

## 十、常用命令速查

### 10.1 Expo 开发

```bash
# 启动开发服务器
npx expo start

# 运行 iOS
npx expo run:ios

# 运行 Android
npx expo run:android

# 构建生产版本
eas build --platform ios --profile production
eas build --platform android --profile production
```

### 10.2 Flutter 开发

```bash
# 启动开发
flutter run

# 构建 iOS
flutter build ios --release

# 构建 Android
flutter build appbundle

# 运行测试
flutter test
```

### 10.3 Supabase

```bash
# 启动本地环境
supabase start

# 创建迁移
supabase migration new [migration_name]

# 推送更改
supabase db push

# 部署 Edge Functions
supabase functions deploy [function_name]
```

### 10.4 GitHub

```bash
# 创建仓库
gh repo create [repo_name] --public

# 创建 PR
gh pr create --title "[title]" --body "[body]"

# 查看状态
gh status
```

---

## 十二、环境变量

### 12.1 配置文件位置

```
~/.openclaw/.env
```

### 12.2 必需的环境变量

```bash
# Supabase（已在本地配置）
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGc...

# GitHub（通过 gh auth login 配置）
# 无需手动设置环境变量
```

---

## 十三、UI 组件库速查

### 13.1 React Native 组件库

| 组件库 | 安装命令 | 文档 |
|--------|----------|------|
| **gluestack-ui** | `npx expo install @gluestack-ui/themed` | [文档](https://gluestack.io/) |
| react-native-paper | `npx expo install react-native-paper` | [文档](https://reactnativepaper.com/) |
| tamagui | `npx expo install @tamagui/core` | [文档](https://tamagui.dev/) |

### 13.2 Flutter 组件库

| 组件库 | 安装方式 | 文档 |
|--------|----------|------|
| Material Design 3 | Flutter 内置 | [文档](https://m3.material.io/) |
| fluttery | `flutter pub add fluttery` | [文档](https://fluttery.io/) |

### 13.3 色彩系统

```
主色调：
├── Primary:   #6366F1
├── Secondary: #8B5CF6
├── Success:   #22C55E
├── Warning:   #F59E0B
└── Error:     #EF4444
```

---

## 十四、常用命令速查

### 14.1 Expo 开发

```bash
# 启动开发服务器
npx expo start

# 运行 iOS
npx expo run:ios

# 运行 Android
npx expo run:android

# 构建生产版本
eas build --platform ios --profile production
eas build --platform android --profile production
```

### 14.3 Flutter 开发

```bash
# 启动开发
flutter run

# 构建 iOS
flutter build ios --release

# 构建 Android
flutter build appbundle

# 运行测试
flutter test
```

### 14.4 Supabase

```bash
# 启动本地环境
supabase start

# 创建迁移
supabase migration new [migration_name]

# 推送更改
supabase db push

# 部署 Edge Functions
supabase functions deploy [function_name]
```

### 14.5 GitHub

```bash
# 创建仓库
gh repo create [repo_name] --public

# 创建 PR
gh pr create --title "[title]" --body "[body]"

# 查看状态
gh status
```

---

> **工具层维护规则**：
> 1. 每次新增工具或能力，更新此文件
> 2. 定期清理不再使用的工具配置
> 3. 保持命令示例的准确性
