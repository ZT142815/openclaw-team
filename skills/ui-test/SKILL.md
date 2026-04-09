# ui-test Skill

> **作用**：可视化 UI 测试，支持截图对比、布局测试、交互测试
> **版本**：v1.1
> **适用场景**：App UI 验证、布局适配测试、视觉回归测试

---

## 一、核心功能

基于实际脚本实现：
1. **Flutter Web 测试** → `scripts/flutter-web-test.js`
2. **移动端 UI 测试** → `scripts/mobile-ui-test.js`
3. **截图对比** → Widget golden test
4. **布局测试** → 安全区域、屏幕适配

---

## 二、使用方法

### 2.1 Flutter Web UI 测试 ⭐

```bash
cd ~/.openclaw/workspace-developer

# 完整 Web 测试（analyze + build + Playwright）
node scripts/flutter-web-test.js --project /path/to/project

# 指定浏览器
node scripts/flutter-web-test.js --project /path/to/project --browser chrome

# 指定模式
node scripts/flutter-web-test.js --project /path/to/project --mode headless
```

### 2.2 移动端 UI 测试 ⭐

```bash
# iOS UI 测试
node scripts/mobile-ui-test.js --project /path/to/project --platform ios

# Android UI 测试
node scripts/mobile-ui-test.js --project /path/to/project --platform android

# 截图测试
node scripts/mobile-ui-test.js --project /path/to/project --platform ios --type screenshot
```

### 2.3 Flutter 黄金截图测试

```bash
# 运行 Flutter 黄金截图测试
flutter test --update-goldens

# 运行 Widget 测试
flutter test

# 运行集成测试
flutter test integration_test/
```

### 2.4 截图对比（代码方式）

```dart
// 使用 RepaintBoundary 捕获截图
final repaintBoundary = find.byKey(Key('screenshot'));
await tester.ensureVisible(repaintBoundary);
await tester.pumpAndSettle();

// 对比黄金截图
expectLater(
  repaintBoundary,
  matchesGoldenFile('login_page.png'),
);
```

### 2.3 设备适配测试

```bash
# iOS 设备测试
xcrun simctl list devices available
flutter run -d "iPhone 14 Pro"

# Android 设备测试
flutter run -d android
```

---

## 三、Flutter 测试框架

### 3.1 单元测试（Unit Test）

```dart
// 测试业务逻辑
test('用户登录成功', () async {
  final result = await authService.login('13800138000', '123456');
  expect(result.success, true);
});
```

### 3.2 Widget 测试（Widget Test）

```dart
// 测试单个 Widget
testWidgets('登录按钮显示正确', (tester) async {
  await tester.pumpWidget(MyApp());
  expect(find.text('登录'), findsOneWidget);
});
```

### 3.3 集成测试（Integration Test）

```dart
// 测试完整流程
testWidgets('完整登录流程', (tester) async {
  await tester.pumpWidget(MyApp());
  
  // 输入手机号
  await tester.enterText(find.byKey(Key('phone')), '13800138000');
  
  // 输入验证码
  await tester.enterText(find.byKey(Key('code')), '123456');
  
  // 点击登录
  await tester.tap(find.byKey(Key('login')));
  
  // 验证跳转
  await tester.pumpAndSettle();
  expect(find.text('首页'), findsOneWidget);
});
```

### 3.4 黄金截图测试（Golden Test）

```dart
// 捕获当前 UI 状态
testWidgets('登录页面 UI 没有变化', (tester) async {
  await tester.pumpWidget(LoginPage());
  
  // 对比黄金截图
  await expectLater(
    find.byType(LoginPage),
    matchesGoldenFile('login_page.png'),
  );
});
```

---

## 四、布局测试清单

### 4.1 安全区域测试

| 检查项 | iPhone | iPad |
|--------|--------|------|
| 刘海屏 | 顶部内容不遮挡 | N/A |
| Home Indicator | 底部内容不遮挡 | N/A |
| Dynamic Island | 顶部内容不遮挡 | N/A |

### 4.2 屏幕适配测试

| 设备 | 屏幕尺寸 | 测试点 |
|------|---------|--------|
| iPhone SE | 375x667 | 小屏适配 |
| iPhone 14 | 390x844 | 标准 |
| iPhone 14 Pro Max | 430x932 | 大屏 |
| iPad Mini | 744x1133 | 平板适配 |

### 4.3 方向适配测试

- [ ] 竖屏布局正确
- [ ] 横屏布局正确
- [ ] 旋转过渡动画流畅

---

## 五、UI Bug 分级

| 级别 | 说明 | 示例 |
|------|------|------|
| P0 | 功能完全不可用 | 按钮点击无响应 |
| P1 | 功能异常 | 页面无法滚动 |
| P2 | 视觉问题 | 文字重叠 |
| P3 | 轻微问题 | 间距不一致 |

---

## 六、测试报告格式

```json
{
  "test_date": "2026-04-09",
  "app_version": "1.0.0",
  "ui_test_results": {
    "layout": {
      "safe_area": "pass",
      "screen_adapt": "pass",
      "orientation": "pass"
    },
    "screenshot": {
      "total": 10,
      "passed": 9,
      "failed": 1,
      "diff_images": ["login_page_diff.png"]
    },
    "interaction": {
      "button_response": "pass",
      "gesture_recognition": "pass",
      "page_navigation": "pass"
    },
    "animation": {
      "fps": 58,
      "loading_state": "pass"
    }
  },
  "bugs": [
    {
      "id": "UI-001",
      "severity": "P2",
      "type": "visual",
      "description": "登录页面按钮间距不一致",
      "location": "login_page.dart:45",
      "screenshot": "bug_ui001.png"
    }
  ]
}
```

---

## 七、版本历史

- v1.0（2026-04-09）：初始版本
