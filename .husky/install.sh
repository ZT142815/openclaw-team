#!/bin/sh
# Install Pre-commit Hook & Harness Scripts
#
# 将 pre-commit hook 和 Harness 工具安装到 Flutter 项目
#
# 使用方式:
#   ./install.sh [项目路径]
#
# 示例:
#   ./install.sh ~/budolist
#   ./install.sh .  # 当前目录

set -e

PROJECT_PATH="${1:-.}"

# 替换 ~ 为用户目录
PROJECT_PATH="$(echo "$PROJECT_PATH" | sed "s|^~|$HOME|")"

# OpenClaw Developer 工作区路径
OCW_PATH="$HOME/.openclaw/workspace-developer"

echo "=========================================="
echo "  OpenClaw Harness 安装程序"
echo "=========================================="
echo ""
echo "目标项目: $PROJECT_PATH"
echo ""

# 检查是否是 git 仓库
if [ ! -d "$PROJECT_PATH/.git" ]; then
    echo "❌ 不是 Git 仓库: $PROJECT_PATH"
    echo "   Hint: 先运行 git init"
    exit 1
fi

# 检查是否是 Flutter 项目
if [ ! -f "$PROJECT_PATH/pubspec.yaml" ]; then
    echo "❌ 不是 Flutter 项目（找不到 pubspec.yaml）"
    exit 1
fi

# ============================================
# Step 1: 安装 Pre-commit Hook
# ============================================
echo "📋 Step 1: 安装 Pre-commit Hook..."
mkdir -p "$PROJECT_PATH/.git/hooks"
cp "$OCW_PATH/.husky/pre-commit" "$PROJECT_PATH/.git/hooks/pre-commit"
chmod +x "$PROJECT_PATH/.git/hooks/pre-commit"
echo "✅ Pre-commit Hook 已安装"

# ============================================
# Step 2: 创建 .openclaw 目录结构
# ============================================
echo ""
echo "📋 Step 2: 创建 Agent 工作目录..."
mkdir -p "$PROJECT_PATH/.openclaw/workspace-developer/scripts"
echo "✅ 目录结构已创建"

# ============================================
# Step 3: 安装 Scripts
# ============================================
echo ""
echo "📋 Step 3: 安装 Harness Scripts..."

# 核心脚本（符号链接）
SCRIPTS="
init.sh
architecture-check.js
feature-list.js
custom-lint-rules.js
drift-check.js
security-scan.js
logger-template.dart
metrics-template.js
"

for script in $SCRIPTS; do
    SRC="$OCW_PATH/scripts/$script"
    DEST="$PROJECT_PATH/.openclaw/workspace-developer/scripts/$script"

    if [ -f "$SRC" ]; then
        # 创建符号链接指向原始文件
        ln -sf "$SRC" "$DEST"
        echo "   ✅ $script"
    else
        echo "   ⚠️  $script 不存在（跳过）"
    fi
done

# ============================================
# Step 4: 安装 Templates
# ============================================
echo ""
echo "📋 Step 4: 安装 Templates..."

if [ -d "$OCW_PATH/templates" ]; then
    mkdir -p "$PROJECT_PATH/.openclaw/workspace-developer/templates"

    for template in "$OCW_PATH/templates"/*; do
        if [ -f "$template" ]; then
            BASENAME=$(basename "$template")
            ln -sf "$template" "$PROJECT_PATH/.openclaw/workspace-developer/templates/$BASENAME"
            echo "   ✅ $BASENAME"
        fi
    done

    # 安装 analysis_options.yaml（Lint 配置）
    if [ -f "$OCW_PATH/templates/analysis-options-template.yaml" ]; then
        if [ ! -f "$PROJECT_PATH/analysis_options.yaml" ]; then
            ln -sf "$OCW_PATH/templates/analysis-options-template.yaml" "$PROJECT_PATH/analysis_options.yaml"
            echo "   ✅ analysis_options.yaml"
        fi
    fi
fi

# ============================================
# Step 5: 安装 Session Protocol
# ============================================
echo ""
echo "📋 Step 5: 安装 Session Protocol..."
if [ -f "$OCW_PATH/templates/SESSION-PROTOCOL.md" ]; then
    ln -sf "$OCW_PATH/templates/SESSION-PROTOCOL.md" "$PROJECT_PATH/SESSION-PROTOCOL.md"
    echo "✅ SESSION-PROTOCOL.md"
fi

# ============================================
# Step 6: 创建项目级 AGENTS.md
# ============================================
echo ""
echo "📋 Step 6: 创建项目级 AGENTS.md..."
if [ ! -f "$PROJECT_PATH/AGENTS.md" ]; then
    cat > "$PROJECT_PATH/AGENTS.md" << 'EOF'
# AGENTS.md - 项目级 Agent 规范

> 本文件由 OpenClaw 自动生成
> 版本: v1.0

---

## 项目信息

| 字段 | 内容 |
|------|------|
| **项目路径** | （动态） |
| **Harness 状态** | 已安装 |

---

## Harness 工具

| 工具 | 路径 |
|------|------|
| init.sh | `.openclaw/workspace-developer/scripts/init.sh` |
| feature-list.js | `.openclaw/workspace-developer/scripts/feature-list.js` |
| architecture-check.js | `.openclaw/workspace-developer/scripts/architecture-check.js` |
| SESSION-PROTOCOL.md | `SESSION-PROTOCOL.md` |

---

## 快速命令

```bash
# 初始化 Harness（如首次）
bash .openclaw/workspace-developer/scripts/init.sh .

# 管理功能清单
node .openclaw/workspace-developer/scripts/feature-list.js --action summary
node .openclaw/workspace-developer/scripts/feature-list.js --action validate

# 运行架构检查
node .openclaw/workspace-developer/scripts/architecture-check.js --path lib
```

---

## Session 协议

详见 `SESSION-PROTOCOL.md`

**启动时：**
1. 读取 progress.txt
2. 读取 feature_list.json
3. 检查 git log
4. 验证环境（flutter analyze）

**结束时：**
1. 更新 progress.txt
2. 更新 feature_list.json
3. 运行 flutter analyze + flutter test
4. git commit
EOF
    echo "✅ AGENTS.md 已创建"
else
    echo "⚠️  AGENTS.md 已存在，跳过"
fi

# ============================================
# 完成
# ============================================
echo ""
echo "=========================================="
echo "  ✅ 安装完成！"
echo "=========================================="
echo ""
echo "📁 安装内容："
echo "   • Pre-commit Hook"
echo "   • Harness Scripts (5个)"
echo "   • Templates"
echo "   • SESSION-PROTOCOL.md"
echo "   • AGENTS.md"
echo ""
echo "📋 下一步："
echo "   1. cd $PROJECT_PATH"
echo "   2. git commit -m 'chore: 添加 OpenClaw Harness'"
echo "   3. bash .openclaw/workspace-developer/scripts/init.sh . --with-git"
echo ""
echo "🔍 验证安装："
echo "   git commit -m 'test' --allow-empty"
echo "   # 应该看到 pre-commit 检查运行"
echo ""
