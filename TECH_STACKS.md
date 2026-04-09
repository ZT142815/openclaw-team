# 技术栈清单

> **版本**: v1.0
> **更新**: 2026-04-09
> **原则**: 按需选择，不拘泥于单一技术

---

## 一、Web 开发技术栈

### 1.1 主流框架

| 框架 | 语言 | 特点 | 适用场景 |
|------|------|------|---------|
| **React** | JavaScript/TypeScript | 生态最广、社区活跃 | 企业级 Web、高交互应用 |
| **Vue** | JavaScript/TypeScript | 上手简单、文档友好 | 快速开发、中小型项目 |
| **Next.js** | React + TypeScript | SSR/SSG、首屏快 | SEO 优先、内容型网站 |
| **Svelte** | JavaScript | 编译时优化、无虚拟 DOM | 轻量级、高性能 |
| **Flutter Web** | Dart | 跨平台一致、组件库 | 跨平台 UI 统一 |

### 1.2 选择决策树

```
Web 技术选型
├── 需要 SEO → Next.js
├── 需要快速开发 → Vue
├── 需要最多生态 → React
├── 需要高性能 → Svelte
└── 需要跨平台一致 → Flutter Web
```

---

## 二、App 开发技术栈

### 2.1 跨平台框架

| 框架 | 语言 | 特点 | 适用场景 |
|------|------|------|---------|
| **Flutter** | Dart | 性能最佳、一致性强 | 高质量跨平台 App |
| **React Native** | JavaScript/TypeScript | 生态丰富、原生体验 | 已有 React 团队 |
| **Tauri** | Rust + Web | 包小、安全 | 桌面应用 |

### 2.2 原生开发

| 平台 | 框架 | 语言 | 适用场景 |
|------|------|------|---------|
| iOS | SwiftUI | Swift | 纯 iOS 高质量应用 |
| iOS | UIKit | Objective-C/Swift | 传统 iOS 开发 |
| Android | Jetpack Compose | Kotlin | 纯 Android 现代 UI |
| Android | XML Views | Java/Kotlin | 传统 Android 开发 |

### 2.3 选择决策树

```
App 技术选型
├── 跨平台 + 高质量 → Flutter
├── 跨平台 + 已有 React 团队 → React Native
├── 纯 iOS 最高质量 → SwiftUI
└── 轻量桌面应用 → Tauri
```

---

## 三、后端技术栈

### 3.1 BaaS 选项

| 服务 | 特点 | 适用场景 |
|------|------|---------|
| **Supabase** | PostgreSQL + Auth + Storage | 快速原型、中小型应用 |
| **Firebase** | 全家桶、GCP 集成 | Google 生态 |
| **Appwrite** | 开源自部署 | 需要数据控制 |

### 3.2 框架选项

| 框架 | 语言 | 特点 |
|------|------|------|
| FastAPI | Python | 高性能、自动文档 |
| Express | Node.js | 简单灵活 |
| NestJS | TypeScript | 企业级、模块化 |

---

## 四、测试矩阵

### 4.1 每个项目可选技术栈

| 项目类型 | 推荐技术栈 | 测试验证 |
|---------|-----------|---------|
| 简单 Web | Vue / React | ✅ |
| 复杂 Web | Next.js / React | ⏳ |
| 简单 App | Flutter / RN | ⏳ |
| 高性能 App | Flutter | ⏳ |
| 原生 iOS | SwiftUI | ⏳ |
| 原生 Android | Kotlin Compose | ⏳ |

---

## 五、工作流程

### 5.1 技术选型流程

```
需求 → Product Agent 分析
    ↓
技术选型建议（考虑因素）
├── 团队熟悉度
├── 项目复杂度
├── 性能要求
├── 生态需求
└── 长期维护成本
    ↓
CEO + 用户 确认技术栈
    ↓
Developer 按选定技术栈开发
```

---

**最后更新**: 2026-04-09 19:47
