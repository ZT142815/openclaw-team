# AI设计工作流

> **版本**: v1.0
> **日期**: 2026-04-09
> **目的**: 弥补没有专业设计师的问题

---

## 一、设计方案

### 方案：用AI生成设计稿

当没有专业设计师时，使用AI图像生成来创建UI设计稿。

| 工具 | 用途 |
|------|------|
| image_generate | 生成UI设计稿 |
| 我分析设计 | 提取设计元素 |
| 生成代码 | 转换为Flutter代码 |

---

## 二、设计流程

```
产品经理描述需求
        ↓
AI生成设计稿
        ↓
我分析设计元素
├── 颜色
├── 布局
├── 组件
└── 交互
        ↓
生成Flutter代码
        ↓
开发者实现
```

---

## 三、AI设计提示词模板

### 3.1 App设计提示词

```markdown
A clean mobile app UI design for [app name]. Shows:
- Top header with [header content]
- Main content area showing [main content]
- [specific features]
- Bottom navigation bar with icons: Home, Stats, Profile
- Color scheme: [colors]
- Typography: [font style]
- iPhone [model] screen frame
Style: iOS Human Interface Guidelines, modern, minimalist
```

### 3.2 Web设计提示词

```markdown
A clean web app UI design for [app name]. Shows:
- Navigation bar with [content]
- Main content area [description]
- [specific features]
- Footer with [content]
- Color scheme: [colors]
- Responsive design for desktop
Style: modern web design, professional
```

### 3.3 组件设计提示词

```markdown
A UI component design for [component name]:
- Size: [dimensions]
- States: default, hover, active, disabled
- Color: [colors]
- Icon: [if needed]
Style: consistent with [design system]
```

---

## 四、生成的设计稿

### 4.1 App设计

| 日期 | 设计稿 | 说明 |
|------|--------|------|
| 2026-04-09 | habit-app-wireframe.png | 习惯追踪App |
| - | - | - |

### 4.2 Web设计

| 日期 | 设计稿 | 说明 |
|------|--------|------|
| 2026-04-09 | quote-web-wireframe.png | 名言Web App |
| - | - | - |

---

## 五、设计元素提取

### 5.1 从设计稿提取元素

当我分析设计稿时，提取：

| 元素 | 提取内容 |
|------|---------|
| 颜色 | 主色、辅色、背景色、文字色 |
| 布局 | 间距、内边距、外边距 |
| 组件 | 按钮样式、卡片样式、输入框样式 |
| 字体 | 字号、字重、行高 |

### 5.2 设计转代码

```
颜色 → Flutter Color
布局 → Flutter Padding/Margin
组件 → Flutter Widget
字体 → Flutter TextStyle
```

---

## 六、设计规范

### 6.1 颜色规范

| 用途 | 色值 | Flutter |
|------|------|--------|
| 主色 | #007AFF | Colors.blue |
| 成功 | #34C759 | Colors.green |
| 危险 | #FF3B30 | Colors.red |
| 警告 | #FF9500 | Colors.orange |
| 背景 | #FFFFFF | Colors.white |
| 文字 | #1C1C1E | Color(0xFF1C1C1E) |

### 6.2 间距规范

| 用途 | 间距 |
|------|------|
| 页面内边距 | 16px |
| 卡片间距 | 12px |
| 元素间距 | 8px |
| 小间距 | 4px |

### 6.3 字体规范

| 用途 | 字号 | 字重 |
|------|------|------|
| 大标题 | 28px | Bold |
| 标题 | 22px | SemiBold |
| 正文 | 17px | Regular |
| 副标题 | 15px | Regular |
| 注释 | 13px | Regular |

---

## 七、设计稿存放位置

```
workspace-developer/
├── design-assets/
│   ├── ui-mockups/
│   │   ├── habit-app-wireframe.png
│   │   └── quote-web-wireframe.png
│   ├── components/
│   │   └── [组件设计图]
│   └── icons/
│       └── [图标设计]
└── DESIGN_WORKFLOW.md
```

---

## 八、流程示例

### 产品经理需求

```
App名称: 习惯追踪
功能:
- 显示习惯列表
- 勾选完成
- 添加新习惯
- 显示连续天数
平台: iOS App
```

### AI生成设计

```bash
# 我执行
image_generate(
  prompt="A clean iOS habit tracking app called Budolist..."
)
```

### 我分析设计

```
分析结果:
- 颜色: 主色#007AFF, 成功#34C759
- 布局: 列表布局, 卡片样式
- 组件: Checkbox, FAB, ListTile
- 字体: SF Pro (系统字体)
```

### 生成代码

```dart
// 我输出
class HabitListItem extends StatelessWidget {
  // 根据设计实现
}
```

---

**最后更新**: 2026-04-09
