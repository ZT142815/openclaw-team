#!/bin/bash
# init.sh - 项目初始化脚本
#
# 功能：
# 1. 检查 Flutter 环境
# 2. 安装依赖（flutter pub get）
# 3. 初始化 feature_list.json
# 4. 创建 progress.txt
# 5. 首次 git commit（可选）
#
# 使用方式：
#   bash init.sh [项目路径] [--with-git]
#
# 示例：
#   bash init.sh ~/budolist
#   bash init.sh ~/budolist --with-git

set -e

PROJECT_PATH="${1:-.}"
WITH_GIT=false

# 解析参数
for arg in "$@"; do
  case $arg in
    --with-git)
      WITH_GIT=true
      shift
      ;;
  esac
done

# 替换 ~ 为用户目录
PROJECT_PATH="$(echo "$PROJECT_PATH" | sed "s|^~|$HOME|")"

echo "=========================================="
echo "  Flutter 项目初始化"
echo "=========================================="
echo ""
echo "项目路径: $PROJECT_PATH"
echo ""

# 检查项目路径是否存在
if [ ! -d "$PROJECT_PATH" ]; then
  echo "❌ 目录不存在: $PROJECT_PATH"
  exit 1
fi

# 检查是否是 Flutter 项目
if [ ! -f "$PROJECT_PATH/pubspec.yaml" ]; then
  echo "❌ 不是 Flutter 项目（找不到 pubspec.yaml）"
  exit 1
fi

cd "$PROJECT_PATH"

# ============================================
# Step 1: 检查 Flutter 环境
# ============================================
echo "📋 Step 1: 检查 Flutter 环境..."
if ! command -v flutter &> /dev/null; then
  echo "❌ Flutter 未安装或不在 PATH 中"
  exit 1
fi
FLUTTER_VERSION=$(flutter --version | head -n 1)
echo "✅ Flutter: $FLUTTER_VERSION"

# ============================================
# Step 2: 安装依赖
# ============================================
echo ""
echo "📋 Step 2: 安装依赖..."
flutter pub get
echo "✅ 依赖安装完成"

# ============================================
# Step 3: 初始化 feature_list.json
# ============================================
echo ""
echo "📋 Step 3: 初始化功能清单..."

FEATURE_LIST_PATH="$PROJECT_PATH/feature_list.json"
if [ -f "$FEATURE_LIST_PATH" ]; then
  echo "⚠️  feature_list.json 已存在，跳过初始化"
else
  # 获取项目名
  PROJECT_NAME=$(grep -E "^name:" pubspec.yaml | cut -d' ' -f2 | tr -d ' ')

  cat > "$FEATURE_LIST_PATH" << 'EOF'
{
  "version": "1.0",
  "project": "",
  "createdAt": "",
  "lastModified": "",
  "summary": {
    "total": 0,
    "passed": 0,
    "failed": 0,
    "inProgress": 0
  },
  "features": []
}
EOF

  # 填充项目名和创建时间
  sed -i.bak "s/\"project\": \"\"/\"project\": \"$PROJECT_NAME\"/" "$FEATURE_LIST_PATH"
  sed -i.bak "s/\"createdAt\": \"\"/\"createdAt\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"/" "$FEATURE_LIST_PATH"
  sed -i.bak "s/\"lastModified\": \"\"/\"lastModified\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"/" "$FEATURE_LIST_PATH"
  rm -f "$FEATURE_LIST_PATH.bak"

  echo "✅ feature_list.json 已创建: $FEATURE_LIST_PATH"
fi

# ============================================
# Step 4: 初始化 progress.txt
# ============================================
echo ""
echo "📋 Step 4: 初始化进度文件..."

PROGRESS_PATH="$PROJECT_PATH/progress.txt"
if [ -f "$PROGRESS_PATH" ]; then
  echo "⚠️  progress.txt 已存在，跳过初始化"
else
  PROJECT_NAME=$(grep -E "^name:" pubspec.yaml | cut -d' ' -f2 | tr -d ' ')

  cat > "$PROGRESS_PATH" << EOF
# ============================================
# 项目进度追踪文件
# ============================================
#
# 此文件记录项目的实时进度，供 Agent 断点续传使用
# 每次 session 结束时必须更新此文件
#
# 格式说明：
#   [SESSION] 时间戳 - Agent名称 - 做了什么事
#   [PROGRESS] 功能ID 功能名称 - 状态
#
# ============================================

PROJECT: $PROJECT_NAME
INITIALIZED: $(date -u +%Y-%m-%dT%H:%M:%SZ)
STATUS: initialized

## 当前阶段
phase: initialization

## 下一功能
next_feature: none

## 功能进度
features_completed: 0
features_total: 0

## Session 历史
[SESSION] $(date -u +%Y-%m-%dT%H:%M:%SZ) - system - 项目初始化完成

## 最近活动
$(date -u +%Y-%m-%dT%H:%M:%SZ) - 项目初始化完成，等待开始开发
EOF

  echo "✅ progress.txt 已创建: $PROGRESS_PATH"
fi

# ============================================
# Step 5: 创建 .claude 目录（Claude Code 兼容）
# ============================================
echo ""
echo "📋 Step 5: 创建 Agent 工作目录..."
mkdir -p "$PROJECT_PATH/.claude"
echo "✅ .claude 目录已创建"

# ============================================
# Step 6: 首次 Git Commit（可选）
# ============================================
if [ "$WITH_GIT" = true ]; then
  echo ""
  echo "📋 Step 6: 初始化 Git 仓库..."

  if [ ! -d "$PROJECT_PATH/.git" ]; then
    git init
    git add -A
    git commit -m "feat: 初始化项目结构

- 初始化 Flutter 项目
- 添加 feature_list.json 功能清单
- 添加 progress.txt 进度追踪文件
- 配置 Agent 工作目录"
    echo "✅ 首次 commit 完成"
  else
    echo "⚠️  已是 Git 仓库，跳过"
  fi
fi

# ============================================
# 完成
# ============================================
echo ""
echo "=========================================="
echo "  ✅ 初始化完成！"
echo "=========================================="
echo ""
echo "📁 项目结构："
echo "   $PROJECT_PATH/"
echo "   ├── feature_list.json   # 功能清单（需填充）"
echo "   ├── progress.txt        # 进度追踪"
echo "   └── .claude/            # Agent 工作目录"
echo ""
echo "📋 下一步："
echo "   1. 填充 feature_list.json（从 PRD 生成功能项）"
echo "   2. 运行 flutter analyze 确保环境正常"
echo "   3. 开始第一个功能的开发"
echo ""
