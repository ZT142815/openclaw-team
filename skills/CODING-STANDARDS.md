# 💻 代码规范和最佳实践 - Developer Agent 工作指南

> **版本**: v1.0
> **用途**: 供 Developer Agent 使用
> **目标**: 确保代码质量、可维护性和团队协作

---

## 🎯 核心原则

```
✨ 可读性 优于 聪明的代码
✨ 明确 优于 隐式
✨ 简单 优于 复杂
✨ 可维护 优于 过度设计
✨ 文档 优于 猜测
```

---

## 1️⃣ 项目结构规范

### 后端项目结构

```
project-root/
├─ code/backend/
│  ├─ src/
│  │  ├─ api/              # API 路由
│  │  │  ├─ auth.py
│  │  │  ├─ user.py
│  │  │  └─ health.py
│  │  ├─ models/           # 数据库模型
│  │  │  ├─ user.py
│  │  │  ├─ session.py
│  │  │  └─ oauth.py
│  │  ├─ services/         # 业务逻辑
│  │  │  ├─ auth_service.py
│  │  │  ├─ email_service.py
│  │  │  └─ oauth_service.py
│  │  ├─ middleware/       # 中间件
│  │  │  ├─ auth.py
│  │  │  └─ error_handler.py
│  │  ├─ utils/            # 工具函数
│  │  │  ├─ validators.py
│  │  │  ├─ jwt_utils.py
│  │  │  └─ helpers.py
│  │  ├─ config/           # 配置文件
│  │  │  ├─ settings.py
│  │  │  └─ constants.py
│  │  ├─ migrations/       # 数据库迁移
│  │  └─ main.py           # 应用入口
│  ├─ tests/               # 测试
│  │  ├─ unit/
│  │  ├─ integration/
│  │  └─ fixtures/
│  ├─ requirements.txt     # 依赖列表
│  ├─ .env.example         # 环境变量模板
│  ├─ README.md           # 项目说明
│  └─ setup.py            # 项目配置
│
└─ docs/                   # 文档
   ├─ API.md              # API 文档
   ├─ DEPLOYMENT.md       # 部署指南
   └─ TROUBLESHOOTING.md  # 故障排查
```

### 前端项目结构

```
project-root/
├─ code/frontend/
│  ├─ src/
│  │  ├─ pages/           # 页面组件
│  │  │  ├─ LoginPage.tsx
│  │  │  ├─ RegisterPage.tsx
│  │  │  └─ ProfilePage.tsx
│  │  ├─ components/      # 可复用组件
│  │  │  ├─ LoginForm.tsx
│  │  │  ├─ Header.tsx
│  │  │  └─ Modal.tsx
│  │  ├─ hooks/           # 自定义 hooks
│  │  │  ├─ useAuth.ts
│  │  │  ├─ useForm.ts
│  │  │  └─ useFetch.ts
│  │  ├─ services/        # API 调用
│  │  │  ├─ api.ts
│  │  │  └─ auth-service.ts
│  │  ├─ store/           # 状态管理
│  │  │  ├─ authStore.ts
│  │  │  └─ userStore.ts
│  │  ├─ styles/          # 样式
│  │  │  ├─ globals.css
│  │  │  └─ variables.css
│  │  ├─ utils/           # 工具函数
│  │  │  ├─ validators.ts
│  │  │  └─ helpers.ts
│  │  ├─ types/           # TypeScript 类型
│  │  │  ├─ auth.ts
│  │  │  └─ api.ts
│  │  ├─ App.tsx          # 主应用
│  │  └─ main.tsx         # 应用入口
│  ├─ tests/              # 测试
│  │  ├─ unit/
│  │  └─ integration/
│  ├─ public/             # 静态资源
│  ├─ package.json
│  ├─ .env.example
│  ├─ tsconfig.json
│  └─ README.md
│
└─ docs/                  # 文档
   ├─ SETUP.md           # 本地开发设置
   └─ ARCHITECTURE.md    # 架构说明
```

---

## 2️⃣ 命名规范

### 文件和目录命名

```
✅ 正确
- user_service.py          (snake_case for Python files)
- LoginForm.tsx            (PascalCase for React components)
- auth-service.ts          (kebab-case for utility files in TypeScript)
- user_model.py            (descriptive, lowercase)

❌ 错误
- UserService.py           (Python 应该用 snake_case)
- loginform.tsx            (组件应该用 PascalCase)
- authservice.ts           (过长，难以阅读)
- a.py                     (无意义)
```

### 变量和函数命名

```
【Python 命名】

✅ 变量 (snake_case)
user_id = "123"
is_active = True
total_count = 100

✅ 函数 (snake_case)
def validate_email(email: str) -> bool:
    pass

def get_user_by_id(user_id: str) -> User:
    pass

✅ 常量 (UPPER_SNAKE_CASE)
MAX_LOGIN_ATTEMPTS = 5
DEFAULT_TIMEOUT = 30
ENCRYPTION_ALGORITHM = "bcrypt"

❌ 不要
userName = "john"           (混合驼峰式)
validate_EMAIL(email)       (大小写混乱)
u = "123"                   (单字母变量名，无意义)

【TypeScript 命名】

✅ 变量 (camelCase)
const userId = "123"
const isActive = true
const userList: User[] = []

✅ 函数 (camelCase)
function validateEmail(email: string): boolean {
    return true
}

✅ 类型/接口 (PascalCase)
interface User {
    id: string
    email: string
}

type Status = 'active' | 'inactive'

✅ 常量 (UPPER_SNAKE_CASE)
const MAX_LOGIN_ATTEMPTS = 5
const DEFAULT_TIMEOUT = 30

❌ 不要
const user_id = "123"       (应该用 camelCase)
const USER_LIST = []        (数组/对象不用全大写)
const x: User = {}          (单字母变量名)
```

### 描述性命名

```
✅ 好的命名
user_email = "john@example.com"     (清晰表达含义)
is_email_verified = True             (布尔值用 is_ 或 has_)
total_login_attempts = 5             (完整描述)
get_user_by_email(email)             (函数名清晰表达意图)

❌ 不好的命名
ue = "john@example.com"              (缩写，不清楚)
ev = True                            (单字母)
cnt = 5                              (不必要的缩写)
process(x)                           (无法理解函数作用)
```

---

## 3️⃣ 代码风格规范

### Python 代码风格

遵循 **PEP 8** 标准：

```python
# ✅ 正确

from typing import Optional
from datetime import datetime

class UserService:
    """用户服务类"""

    def __init__(self, db):
        """初始化服务"""
        self.db = db

    def get_user(self, user_id: str) -> Optional[dict]:
        """
        获取用户信息

        Args:
            user_id: 用户 ID

        Returns:
            用户信息字典，如果不存在返回 None
        """
        user = self.db.query("users").where("id", user_id).first()
        return user

    def validate_email(self, email: str) -> bool:
        """验证邮箱格式"""
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))


# ❌ 错误 - 代码风格

def getUserFromDB(userId):  # 应该是 snake_case
    u = db.query("users")  # 变量名太短
    data = u.filter("id" == userId)  # 应该用 .where()
    return data  # 缺少类型提示和文档


class UserService:
    def __init__(self,db):  # 参数间应该有空格
        self.db=db  # 等号周围应该有空格

    def getUser(self, userId):  # 应该是 snake_case
        '''不要用单引号'''
        return self.db.query("users").where("id",userId).first()
```

### TypeScript 代码风格

遵循 **Google TypeScript Style Guide**：

```typescript
// ✅ 正确

import { User } from './types'

class AuthService {
  private readonly db: Database

  constructor(db: Database) {
    this.db = db
  }

  /**
   * 验证邮箱格式
   * @param email - 邮箱地址
   * @returns 邮箱是否有效
   */
  validateEmail(email: string): boolean {
    const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return pattern.test(email)
  }

  async getUser(userId: string): Promise<User | null> {
    const user = await this.db.query('users')
      .where('id', userId)
      .first()
    return user || null
  }
}

// 使用
const service = new AuthService(db)
const isValid = service.validateEmail('user@example.com')


// ❌ 错误 - 代码风格

class authService {  // 类名应该用 PascalCase
  private db: Database

  constructor(db) {  // 参数缺少类型
    this.db = db
  }

  validateEmail = (email) => {  // 应该是普通方法
    let isValid = /^[a-zA-Z0-9]+@[a-zA-Z]+\.[a-zA-Z]+$/.test(email)
    return isValid  // 不必要的变量
  }

  async getUser(userId) {  // 参数缺少类型
    return await this.db.query('users').where('id', userId).first()
  }
}
```

---

## 4️⃣ 代码审查清单

提交代码前，自己检查这些项目：

### 功能性 (Functionality)

```
□ 代码能正确实现需求吗？
□ 有没有逻辑错误？
□ 有没有边界情况处理不周？
□ 是否有内存泄漏或资源泄漏？
□ 错误处理是否完整？
  └─ Try-catch 覆盖所有可能的异常？
  └─ 用户友好的错误信息？
```

### 代码质量 (Code Quality)

```
□ 代码易读易懂吗？
□ 函数/方法是否过长（超过 20 行？）
□ 是否有重复代码需要提取为函数？
□ 循环复杂度是否过高？
□ 是否使用了适当的设计模式？
```

### 命名和结构 (Naming & Structure)

```
□ 变量/函数名清晰吗？
□ 类的职责单一吗？(SRP)
□ 模块组织结构合理吗？
□ 是否有"魔法数字"需要定义为常量？
```

### 测试 (Testing)

```
□ 是否编写了单元测试？
□ 测试覆盖率是否足够？(>80%)
□ 是否测试了异常情况？
□ 是否有集成测试？
□ 所有测试都通过了吗？
```

### 文档和注释 (Documentation)

```
□ 是否有函数/类的文档注释？
□ 是否有复杂逻辑的行内注释？
□ README 是否更新了？
□ API 文档是否更新了？
□ 是否有 CHANGELOG？
```

### 安全性 (Security)

```
□ 是否有 SQL 注入风险？
□ 是否正确处理了敏感数据？
  └─ 密码是否加密？
  └─ Token 是否安全存储？
  └─ 敏感信息是否记录到日志？
□ 是否有认证/授权检查？
□ 输入是否进行了验证？
□ 是否有 CORS 问题？
```

### 性能 (Performance)

```
□ 是否有 N+1 查询问题？
□ 是否有不必要的循环或递归？
□ 是否使用了缓存？
□ 数据库查询是否有索引？
□ 是否有大量内存占用？
```

### Git 和提交 (Git Commit)

```
□ 提交信息是否清晰？
□ 是否只改了必要的文件？
□ 是否有无关的 debug 代码？
□ 是否有 console.log() 需要删除？
□ 是否有格式化或 linting 问题？
```

---

## 5️⃣ Git 工作流规范

### 分支命名规范

```
【功能分支】
feature/<功能名>

示例:
- feature/user-auth
- feature/email-verification
- feature/oauth-google

【修复分支】
fix/<问题描述>

示例:
- fix/login-error
- fix/password-validation
- fix/email-sending-delay

【热修复分支】
hotfix/<问题描述>

示例:
- hotfix/critical-security-issue
- hotfix/production-crash

【文档分支】
docs/<文档名>

示例:
- docs/api-specification
- docs/deployment-guide
```

### 提交信息规范

遵循 **Conventional Commits** 标准：

```
【格式】
<type>(<scope>): <subject>

<body>

<footer>

【示例】

✅ 好的提交

feat(auth): add email verification

Add email verification functionality to user registration.

- Send verification email after signup
- Verify email before account activation
- Create verification token with 24h expiry

Closes #123

✅ 好的修复

fix(auth): handle email sending failures

Previously, email sending failures would crash the API.
Now we retry 3 times with exponential backoff.

✅ 文档更新

docs(api): update authentication endpoints

Updated API documentation with OAuth examples.

【类型 (Type)】
- feat: 新功能
- fix: 修复 bug
- refactor: 代码重构
- test: 添加或修改测试
- docs: 文档更新
- style: 代码风格（不改逻辑）
- perf: 性能优化
- chore: 依赖更新、配置更改
```

### 代码审查流程

```
1. 创建分支
   git checkout -b feature/user-auth

2. 编写代码
   编写功能代码
   编写单元测试
   确保所有测试通过

3. 提交代码
   git add .
   git commit -m "feat(auth): add user authentication"

4. 推送分支
   git push origin feature/user-auth

5. 创建 Pull Request
   在 GitHub/GitLab 创建 PR
   填写描述、关联 issue
   请求 reviewer

6. 代码审查
   maintainers 审查代码
   提出改进意见

7. 修改反馈
   根据反馈修改代码
   再次提交

8. 合并
   所有反馈解决后
   merge 到 main/develop 分支

9. 清理
   删除特性分支
```

---

## 6️⃣ 常见错误和改进

### ❌ 常见 Python 错误

```python
# 错误 1: 异常处理过于宽泛
try:
    user = get_user(user_id)
except:  # ❌ 捕获所有异常
    return None

# 正确
try:
    user = get_user(user_id)
except UserNotFound:
    return None
except DatabaseError as e:
    logger.error(f"Database error: {e}")
    raise


# 错误 2: 可变默认参数
def add_user(user_list=[]):  # ❌ 危险！
    user_list.append("John")
    return user_list

# 正确
def add_user(user_list=None):
    if user_list is None:
        user_list = []
    user_list.append("John")
    return user_list


# 错误 3: 没有验证输入
def validate_email(email):
    return "@" in email  # ❌ 太简单

# 正确
import re
def validate_email(email: str) -> bool:
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email.lower()))


# 错误 4: 密码以明文存储
def save_user(email, password):
    db.save({'email': email, 'password': password})  # ❌

# 正确
from bcrypt import hashpw, gensalt
def save_user(email: str, password: str):
    hashed = hashpw(password.encode(), gensalt())
    db.save({'email': email, 'password': hashed})
```

### ❌ 常见 TypeScript/React 错误

```typescript
// 错误 1: 类型太宽泛
function processData(data: any) {  // ❌ any 类型
    return data.user.email
}

// 正确
interface User {
    email: string
}

function processData(data: User): string {
    return data.email
}


// 错误 2: 不处理 null/undefined
function getUserName(user: User) {
    return user.name.toUpperCase()  // ❌ 可能崩溃
}

// 正确
function getUserName(user: User | null): string {
    return user?.name?.toUpperCase() ?? "Unknown"
}


// 错误 3: React 依赖数组不完整
useEffect(() => {
    fetchUser(userId)
}, [])  // ❌ 缺少 userId

// 正确
useEffect(() => {
    fetchUser(userId)
}, [userId])


// 错误 4: 不处理异步错误
async function login(email, password) {
    const response = await api.post('/login', {email, password})
    return response.data  // ❌ 没有 try-catch
}

// 正确
async function login(email: string, password: string) {
    try {
        const response = await api.post('/login', {email, password})
        return response.data
    } catch (error) {
        console.error('Login failed:', error)
        throw new Error('Failed to login')
    }
}
```

---

## 7️⃣ 测试规范

### 单元测试

```python
# ✅ 好的单元测试

import pytest
from auth_service import AuthService, InvalidEmailError

class TestAuthService:
    """认证服务测试"""

    def setup_method(self):
        """每个测试前执行"""
        self.service = AuthService()

    def test_validate_email_valid(self):
        """测试：有效邮箱"""
        assert self.service.validate_email('user@example.com') is True

    def test_validate_email_invalid_format(self):
        """测试：无效格式的邮箱"""
        assert self.service.validate_email('notanemail') is False

    def test_validate_email_empty(self):
        """测试：空邮箱"""
        assert self.service.validate_email('') is False

    def test_validate_password_weak(self):
        """测试：弱密码被拒绝"""
        with pytest.raises(InvalidPasswordError):
            self.service.validate_password('123')  # 太短

    def test_validate_password_strong(self):
        """测试：强密码被接受"""
        assert self.service.validate_password('StrongPass123!') is True
```

### 集成测试

```python
# ✅ 好的集成测试

import pytest
from fastapi.testclient import TestClient
from main import app

@pytest.fixture
def client():
    return TestClient(app)

def test_register_user_flow(client):
    """测试：完整的用户注册流程"""

    # Step 1: 注册
    response = client.post('/api/auth/register', json={
        'email': 'newuser@example.com',
        'password': 'StrongPass123!'
    })
    assert response.status_code == 201
    assert response.json()['email'] == 'newuser@example.com'

    # Step 2: 登录
    response = client.post('/api/auth/login', json={
        'email': 'newuser@example.com',
        'password': 'StrongPass123!'
    })
    assert response.status_code == 200
    token = response.json()['token']

    # Step 3: 访问受保护资源
    response = client.get(
        '/api/user',
        headers={'Authorization': f'Bearer {token}'}
    )
    assert response.status_code == 200
    assert response.json()['email'] == 'newuser@example.com'
```

---

## 📋 提交代码前的最终检查清单

```
□ 功能已实现且正确
□ 所有测试通过 (单元 + 集成)
□ 代码覆盖率 >= 80%
□ 没有 console.log() 或 debug 代码
□ 没有硬编码的密钥或敏感信息
□ 遵循命名规范
□ 遵循代码风格规范
□ 有清晰的注释和文档
□ 处理了异常情况
□ 没有性能问题
□ 没有安全漏洞
□ Git 提交信息清晰
□ 没有不相关的改动
□ .gitignore 中包含了 .env 和 node_modules/
□ README 或 API 文档已更新

准备好提交了！ ✅
```

---

**版本**: 1.0
**最后更新**: 2026-03-27
**维护者**: Developer Agent

相关文档：
- 🔗 [SUPABASE.md](./SUPABASE.md) - 数据库操作
- 🔗 [TEST-PLAN-TEMPLATE.md](../tester/agent/skills/TEST-PLAN-TEMPLATE.md) - 测试方案
- 🔗 [PROJECT-COORDINATION.md](../main/agent/skills/PROJECT-COORDINATION.md) - CEO 指南
