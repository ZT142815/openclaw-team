# competitor-analysis Skill

> **作用**：竞品分析，支持新 App 开发阶段的市场调研
> **版本**：v1.1
> **适用场景**：新 App 开发前的竞品调研

---

## 一、核心功能

基于 `scripts/competitor-analysis.js` 实现：
1. **竞品信息抓取** → 搜索竞品功能、评分、定价
2. **功能对比分析** → 对比竞品功能清单
3. **用户评价分析** → 分析用户痛点
4. **市场定位建议** → 给出差异化建议

---

## 二、使用方法

### 2.1 基本竞品分析

```bash
cd ~/.openclaw/workspace-developer

# 分析单个竞品
node scripts/competitor-analysis.js --competitor "Notion"

# 分析多个竞品
node scripts/competitor-analysis.js --competitor "Notion,Monday,Asana"
```

### 2.2 输出格式

```bash
# JSON 格式（默认）
node scripts/competitor-analysis.js --competitor "Notion"

# Markdown 格式
node scripts/competitor-analysis.js --competitor "Notion" --output markdown
```

### 2.3 帮助

```bash
node scripts/competitor-analysis.js --help
```

---

## 三、输出报告格式

### JSON 格式

```json
[
  {
    "competitor": "Notion",
    "analysis_date": "2026-04-09",
    "rating": "4.6",
    "total_reviews": "10000+",
    "features": {
      "core": ["笔记", "文档", "协作"],
      "differentiator": ["AI 助手", "模板市场"]
    },
    "pricing": {
      "free_tier": true,
      "starting_price": "$10/mo"
    },
    "user_sentiment": {
      "positive": ["功能强大", "界面简洁"],
      "negative": ["加载慢", "移动端体验差"]
    },
    "market_position": "All-in-one 工作空间",
    "opportunity": "专注移动端体验和加载速度"
  }
]
```

### Markdown 格式

```markdown
# 竞品分析报告

## Notion

- 评分: 4.6
- 评论数: 10000+
- 免费版: 是
- 起步价: $10/mo
- 市场定位: All-in-one 工作空间
- 差异化机会: 专注移动端体验
```

---

## 四、分析报告模板

### 4.1 核心竞品清单

| 竞品 | 平台 | 评分 | 核心功能 | 差异化 |
|------|------|------|---------|--------|
| | | | | |

### 4.2 功能对比矩阵

| 功能 | 竞品A | 竞品B | 竞品C | 我们 |
|------|-------|-------|-------|------|
| 功能1 | ✅ | ✅ | ❌ | ? |
| 功能2 | ✅ | ❌ | ✅ | ? |

### 4.3 用户痛点分析

| 痛点 | 被提及次数 | 竞品 | 机会 |
|------|-----------|------|------|
| 加载慢 | 50+ | Notion | ✅ 机会 |
| 移动端差 | 30+ | Notion | ✅ 机会 |

### 4.4 市场机会

1. **差异化机会**：...
2. **定价空间**：...
3. **用户群体**：...

---

## 五、输出标准

- 至少分析 3 个竞品
- 每个竞品包含：功能清单、评分、定价、用户评价
- 给出明确的差异化建议
- 输出格式支持 JSON 和 Markdown

---

## 六、版本历史

- v1.1（2026-04-09）：引用实际脚本 `scripts/competitor-analysis.js`
- v1.0（2026-04-09）：初始版本
