


# RULES.md - Developer Agent 规范

> 开发者规范入口

---

## 一、代码规范

### 1.1 命名规范

> ⚠️ **2026-03-29 更新：统一为 Flutter/Dart 社区规范**

| 类型 | 规范 | 示例 |
|------|------|------|
| 变量 | camelCase | userName, orderList |
| 常量 | camelCase 或 UPPER_SNAKE | maxRetries 或 MAX_RETRIES |
| 函数 | camelCase | getUser(), fetchOrderList() |
| 类名 | PascalCase | UserService, OrderController |
| 枚举 | PascalCase | HttpStatus, UserRole |
| 文件名 | snake_case | user_service.dart, order_controller.dart |
| 资源文件 | snake_case | app_colors.dart, app_theme.dart |

> **Flutter 社区标准**：Dart/Flutter 项目统一使用 camelCase（变量/函数）、PascalCase（类）、snake_case（文件）。
> 参考：https://dart.dev/guides/language/effective-dart/style

### 1.2 代码注释
```typescript
// 描述：功能说明
// 参数：参数说明
// 返回：返回值说明
function xxx() { }
```

---

## 二、Git 规范

### 2.1 分支命名
```
feature/[功能名]      # 功能分支
bugfix/[BUG编号]     # BUG修复分支
hotfix/[问题]        # 紧急修复分支
```

### 2.2 提交信息
```
feat: 添加用户登录功能
fix: 修复登录超时问题
docs: 更新README
style: 格式化代码
refactor: 重构用户模块
test: 添加单元测试
```

---

## 三、API 规范

### 3.1 RESTful 设计
| 方法 | 用途 | 示例 |
|------|------|------|
| GET | 查询 | GET /users |
| POST | 创建 | POST /users |
| PUT | 更新 | PUT /users/:id |
| DELETE | 删除 | DELETE /users/:id |

### 3.2 响应格式
```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

---

## 四、测试规范

### 4.1 测试覆盖率
| 优先级 | 覆盖率要求 |
|--------|------------|
| P0 | 100% |
| P1 | ≥ 90% |
| P2 | ≥ 70% |

### 4.2 单元测试
- 每个函数必须有单元测试
- 使用 Jest/Mocha 框架
- 覆盖率 ≥ 80%

---

## 五、代码审查

### 5.1 Review 检查点
- [ ] 代码风格符合规范
- [ ] 有适当的注释
- [ ] 有单元测试
- [ ] 无安全漏洞
- [ ] 性能可接受

### 5.2 审查流程
1. 提交 Pull Request
2. 自动检查通过
3. 至少 1 人 Review
4. 合并到主分支

---

## 六、关联文件

| 文件 | 说明 |
|------|------|
| SOUL.md | 启动流程 |
| IDENTITY.md | 身份定义 |
| MEMORY.md | 长期记忆 |
| TOOLS.md | 工具配置 |
| AGENTS.md | 团队协作 |
| PROJECT.md | 项目管理规范 |

---

## 七、维护记录

| 日期 | 版本 | 变更内容 |
|------|------|----------|
| 2026-03-20 | v1.0 | 初始版本 |
| 2026-03-20 | v1.1 | 添加 Claude Code 集成规范 |
| 2026-03-21 | v1.2 | 移除 Claude Code 强制要求，使用内置模型（MiniMax） |
