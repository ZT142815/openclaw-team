#!/usr/bin/env node
/**
 * competitor-analysis.js
 * 竞品分析脚本
 * 
 * 用法：
 *   node competitor-analysis.js --competitor "Notion" --output json
 *   node competitor-analysis.js --competitor "Notion" --search "features pricing"
 *   node competitor-analysis.js --competitor "Notion,Monday,Asana" --output markdown
 */

const https = require('https');
const http = require('http');

// ============ 配置 ============
const APP_STORE_SEARCH_API = 'https://itunes.apple.com/search';
const SEARCH_API = 'https://www.google.com/search';

// ============ 工具函数 ============
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function extractAppStoreInfo(html) {
  // 简单解析 App Store 页面
  const rating = html.match(/"averageUserRating":\s*([0-9.]+)/)?.[1] || 'N/A';
  const reviews = html.match(/"userRatingCount":\s*([0-9]+)/)?.[1] || 'N/A';
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1] || 'Unknown';
  return { rating, reviews, title };
}

function searchCompetitor(name) {
  return httpGet(`${SEARCH_API}?q=${encodeURIComponent(name + ' app features pricing review')}`);
}

// ============ 主分析逻辑 ============
async function analyzeCompetitor(name) {
  console.error(`🔍 分析竞品: ${name}`);
  
  try {
    // 1. 搜索基本信息
    const searchResults = await searchCompetitor(name);
    
    // 2. 提取关键信息（简化版，实际应解析 HTML）
    const result = {
      competitor: name,
      analysis_date: new Date().toISOString().split('T')[0],
      rating: 'N/A',
      total_reviews: 'N/A',
      features: {
        core: [],
        differentiator: []
      },
      pricing: {
        free_tier: false,
        starting_price: 'N/A'
      },
      user_sentiment: {
        positive: [],
        negative: []
      },
      market_position: '待分析',
      opportunity: '待分析'
    };
    
    // 简单解析评分（从搜索结果摘要中提取）
    const ratingMatch = searchResults.match(/Rating:\s*([0-9.]+)/gi);
    if (ratingMatch) {
      result.rating = ratingMatch[0].match(/([0-9.]+)/)[1];
    }
    
    // 解析价格信息
    if (searchResults.includes('free')) {
      result.pricing.free_tier = true;
    }
    const priceMatch = searchResults.match(/\$([0-9]+(?:\.[0-9]+)?)/g);
    if (priceMatch && priceMatch.length > 0) {
      result.pricing.starting_price = `$${priceMatch[0].match(/([0-9]+(?:\.[0-9]+)?)/)[1]}/mo`;
    }
    
    console.error(`✅ ${name} 分析完成`);
    return result;
    
  } catch (error) {
    console.error(`❌ ${name} 分析失败: ${error.message}`);
    return {
      competitor: name,
      error: error.message
    };
  }
}

// ============ CLI 入口 ============
const args = process.argv.slice(2);
let competitor = null;
let output = 'json';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--competitor' || args[i] === '-c') {
    competitor = args[++i];
  } else if (args[i] === '--output' || args[i] === '-o') {
    output = args[++i];
  } else if (args[i] === '--help' || args[i] === '-h') {
    console.log(`
 competitor-analysis.js - 竞品分析工具

 用法：
   node competitor-analysis.js --competitor "Notion" [选项]

 选项：
   -c, --competitor <名称>    竞品名称（必填，支持逗号分隔多个）
   -o, --output <格式>        输出格式: json (默认) | markdown
   -h, --help                 显示帮助

 示例：
   node competitor-analysis.js --competitor "Notion"
   node competitor-analysis.js --competitor "Notion,Monday,Asana" --output markdown
`);
    process.exit(0);
  }
}

if (!competitor) {
  console.error('❌ 错误: 必须指定 --competitor');
  process.exit(1);
}

async function main() {
  const competitors = competitor.split(',').map(c => c.trim());
  const results = [];
  
  for (const name of competitors) {
    const result = await analyzeCompetitor(name);
    results.push(result);
  }
  
  if (output === 'markdown') {
    console.log('# 竞品分析报告\n');
    for (const r of results) {
      console.log(`## ${r.competitor}\n`);
      console.log(`- 评分: ${r.rating}`);
      console.log(`- 评论数: ${r.total_reviews}`);
      console.log(`- 免费版: ${r.pricing.free_tier ? '是' : '否'}`);
      console.log(`- 起步价: ${r.pricing.starting_price}`);
      console.log(`- 市场定位: ${r.market_position}`);
      console.log(`- 差异化机会: ${r.opportunity}`);
      console.log('');
    }
  } else {
    console.log(JSON.stringify(results, null, 2));
  }
}

main().catch(console.error);
