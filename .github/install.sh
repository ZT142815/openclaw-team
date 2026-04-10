#!/bin/bash
# GitHub Actions 安装脚本
# 在CI workflow中运行，安装项目依赖

set -e

echo "========================================="
echo "  项目初始化安装"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================="

# 检查Flutter
if ! command -v flutter &> /dev/null; then
    echo "❌ Flutter 未安装"
    exit 1
fi

echo "✅ Flutter 版本: $(flutter --version | head -1)"

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"

# 安装Flutter依赖
echo ""
echo "📦 安装Flutter依赖..."
flutter pub get

# 安装Node依赖（如果package.json存在）
if [ -f "package.json" ]; then
    echo ""
    echo "📦 安装Node依赖..."
    npm install
fi

# 安装Git钩子
echo ""
echo "🔧 安装Git钩子..."
if command -v husky &> /dev/null; then
    husky install || echo "⚠️ Husky安装跳过"
else
    echo "⚠️ Husky未安装，跳过钩子安装"
fi

echo ""
echo "========================================="
echo "  ✅ 安装完成"
echo "========================================="
