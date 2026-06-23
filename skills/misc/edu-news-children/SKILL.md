---
name: edu-news-children
description: "聚合0-16岁儿童教育相关新闻、政策、学术资讯（中国+全球）。包括：各国教育政策法规、儿童学习与发展研究、EdTech产品动态、励志故事（如少年竞赛获奖者）、家庭教育方法论。触发词：儿童教育新闻、教育政策、育儿资讯、少年成就、K-12动态、幼教研究。"
---

# 儿童教育新闻聚合 Skill
## 定位：0-16岁儿童教育领域的新闻与学术资讯聚合

---

## 一、数据源全景图

### 🇨🇳 中国数据源

#### 官方政策（免费，直接抓取）
| 来源 | URL / RSS | 内容 | 获取方式 |
|------|-----------|------|----------|
| 教育部官网 | `http://www.moe.gov.cn/` | 政策法规、通知公告 | 网页抓取（无 RSS，需爬虫或定期轮询） |
| 中国教育报 | `http://www.jyb.cn/` | 日报新闻，教育部主管 | 网页抓取 |
| 中国教育新闻网 | `http://www.chinaedu.edu.cn/` | 综合教育新闻 | 网页抓取 |
| 新华社教育频道 | `https://www.xinhuanet.com/edu/` | 权威时政+教育新闻 | 网页抓取 |
| 人民网教育 | `http://edu.people.com.cn/` | 综合教育资讯 | 网页抓取 |
| 光明网教育 | `https://edu.gmw.cn/` | 教育政策深度报道 | 网页抓取 |

#### 学术/研究（免费）
| 来源 | URL | 内容 |
|------|-----|------|
| 中国知网 CNKI | `https://www.cnki.net/` | 学术论文（需账号，部分免费） |
| 中国教育学会 | `http://www.cse.edu.cn/` | 研究报告、学术会议 |
| 国家教育发展研究中心 | `http://www.ncedr.edu.cn/` | 政策研究、白皮书 |

#### 垂直媒体（免费订阅）
| 来源 | URL | 特色 |
|------|-----|------|
| 芥末堆 | `https://www.jiemodui.com/` | 教育创业&EdTech，有RSS |
| 多知网 | `https://www.duozhishi.com/` | K12教育产业新闻 |
| 21世纪教育研究院 | `http://www.21cedu.org/` | 独立教育研究 |
| 教育时报 | `https://www.jyb.cn/` | 教师/学校视角 |

---

### 🌍 国际数据源

#### 免费 RSS Feeds（可直接订阅）
| 来源 | RSS URL | 语言 | 特色 |
|------|---------|------|------|
| EdSurge | `https://www.edsurge.com/news.rss` | EN | EdTech&教育创新 |
| Chalkbeat | `https://chalkbeat.org/arc/outboundfeeds/rss/` | EN | K-12政策，非营利 |
| Education Week | `https://www.edweek.org/feeds/rss` | EN | 美国教育政策权威 |
| eSchool News | `https://www.eschoolnews.com/feed/` | EN | K-12科技教育 |
| TES (UK) | `https://www.tes.com/magazine/rss` | EN | 英国教育 |
| Education Next | `https://educationnext.org/feed/` | EN | 教育政策研究 |
| UNESCO Education | `https://www.unesco.org/en/education/rss` | EN/多语 | 全球教育政策 |

#### 国际组织报告（免费下载）
| 来源 | URL | 内容 |
|------|-----|------|
| UNESCO | `https://www.unesco.org/en/education` | 全球教育监测报告 |
| UNICEF Education | `https://www.unicef.org/education` | 儿童权利+教育数据 |
| OECD Education | `https://www.oecd.org/education/` | PISA报告、政策分析 |
| World Bank Education | `https://www.worldbank.org/en/topic/education` | 发展中国家教育数据 |

#### 免费 News API（需注册获取 key）
| API | 免费额度 | 适用场景 | 注册地址 |
|-----|----------|----------|---------|
| **GNews API** | 每天100次请求 | 关键词搜索国际新闻 | `https://gnews.io` |
| **Currents API** | 每天600次请求 | 最慷慨的免费层 | `https://currentsapi.services` |
| **NewsData.io** | 每天200积分 | 支持中文，覆盖89种语言 | `https://newsdata.io` |
| **GDELT Project** | 完全免费，无限制 | 全球事件数据库，学术级 | `https://www.gdeltproject.org` |
| **Google News RSS** | 完全免费，无限制 | 直接用 URL 参数过滤 | 见下方示例 |

#### Google News RSS 免费用法（零成本，强烈推荐）
```
# 中文教育新闻
https://news.google.com/rss/search?q=儿童教育+政策&hl=zh-CN&gl=CN&ceid=CN:zh-Hans

# 英文儿童教育新闻
https://news.google.com/rss/search?q=children+education+policy&hl=en-US&gl=US&ceid=US:en

# 少年成就励志故事
https://news.google.com/rss/search?q=young+student+award+prodigy+education&hl=en&gl=US&ceid=US:en

# 日本儿童教育
https://news.google.com/rss/search?q=子供+教育+政策&hl=ja&gl=JP&ceid=JP:ja
```

---

## 二、内容分类体系

### 5大内容板块

```
1. 📋 政策法规
   ├── 中国（教育部、地方政策、双减、新课标…）
   └── 全球（各国K-12改革、儿童权利公约进展）

2. 🔬 学术研究
   ├── 儿童认知发展、神经科学
   ├── 教学法研究（PBL、蒙台梭利、芬兰教育…）
   └── 学习障碍、特殊教育

3. 💡 EdTech 动态
   ├── AI教育工具
   ├── 编程教育、STEM
   └── 创新学校模式

4. 🏆 少年成就故事
   ├── 竞赛获奖（黑客松、数学奥赛、编程比赛…）
   ├── 少年创业/发明
   └── 家庭教育方法论（父母如何引导）

5. 🌱 家庭教育
   ├── 亲子关系研究
   ├── 课外活动指导
   └── 心理健康&情绪教育
```

---

## 三、使用该 Skill 的标准流程

### Step 1 — 明确用户需求
向用户确认：
- 关注哪个地区？（中国 / 全球 / 特定国家）
- 关注哪个年龄段？（0-3 婴幼儿 / 4-6 学前 / 6-12 小学 / 12-16 初中）
- 关注哪个板块？（政策 / 学术 / 故事 / EdTech）
- 需要实时最新 vs 深度分析？

### Step 2 — 数据抓取策略

**零成本方案（推荐起步）**：
```
Google News RSS → 解析 XML → 提取标题+摘要+链接+时间
```

**进阶多源方案**：
```
Google News RSS（免费）
    +
Currents API（每天600次，免费注册）
    +
NewsData.io（支持中文，每天200积分）
    +
指定 RSS feeds（教育专业媒体）
```

**政策监控专项（中国）**：
```
定时轮询教育部网站 → 检测新页面/公告 → 推送摘要
（无需 API，直接 HTTP GET + HTML 解析）
```

### Step 3 — 内容处理

对每条新闻执行：
1. **去重** — 相同事件多源报道合并
2. **分类** — 按5大板块自动打标签
3. **年龄关联** — 标注适用年龄段
4. **重要性评分** — 官方政策 > 学术研究 > 媒体报道

### Step 4 — 呈现格式

```markdown
## 今日儿童教育要闻 [日期]

### 📋 政策
- [标题](链接) — 来源 · 时间
  > 一句话摘要

### 🏆 少年故事
- [标题](链接) — 来源 · 时间
  > 一句话摘要（含：年龄、成就、父母引导方式）
```

---

## 四、少年成就故事的专项采集逻辑

这是最有吸引力的内容类型，专项处理：

### 搜索关键词组合
```
英文：
- "youngest" + (winner/winner/awarded/developer/coder/inventor)
- "teen" + (hackathon/olympiad/patent/startup/AI)
- "prodigy" + education + age
- "child genius" + school

中文：
- 最小年龄 获奖
- 少年 黑客松 编程大赛
- 神童 创新 学习方法
- 小学生 发明 专利
```

### 故事必须包含的要素（采集时核查）
- ✅ 主角年龄（必须 ≤16岁）
- ✅ 具体成就（竞赛名称、级别、成绩）
- ✅ **学习方法**（他/她如何学习这个领域）
- ✅ **家庭引导**（父母/监护人的角色）
- ✅ 可借鉴性（其他孩子/家长能学到什么）

---

## 五、技术实现参考

### 最简单的 RSS 聚合器（Node.js）
```javascript
const Parser = require('rss-parser');
const parser = new Parser();

const FEEDS = [
  // 国际
  'https://news.google.com/rss/search?q=children+education+policy&hl=en',
  'https://chalkbeat.org/arc/outboundfeeds/rss/',
  'https://www.eschoolnews.com/feed/',
  // 中文（Google新闻代理）
  'https://news.google.com/rss/search?q=儿童教育&hl=zh-CN&gl=CN&ceid=CN:zh-Hans',
];

async function aggregateEduNews() {
  const allItems = [];
  for (const url of FEEDS) {
    const feed = await parser.parseURL(url);
    allItems.push(...feed.items.map(item => ({
      title: item.title,
      link: item.link,
      source: feed.title,
      date: item.pubDate,
      snippet: item.contentSnippet
    })));
  }
  // 按时间排序
  return allItems.sort((a, b) => new Date(b.date) - new Date(a.date));
}
```

### Currents API 示例（免费，600次/天）
```javascript
// 注册地址：https://currentsapi.services/en/register
const API_KEY = 'YOUR_KEY';
const url = `https://api.currentsapi.services/v1/search?keywords=children+education&language=en&apiKey=${API_KEY}`;
// 支持 language=zh 查中文结果
```

### NewsData.io 示例（支持中文）
```javascript
// 注册：https://newsdata.io/register
const url = `https://newsdata.io/api/1/news?apikey=YOUR_KEY&q=儿童教育&language=zh&category=education`;
```

---

## 六、需要自己手动获取的数据源（不可爬取）

以下内容需要**人工订阅或协议授权**：

| 来源 | 原因 | 替代方案 |
|------|------|---------|
| 微信公众号（如「少年商学院」「教育圆桌」） | 平台封闭，无公开 RSS | 手动关注，或使用 RSSHub 自建 |
| 中国知网全文 | 付费数据库 | 只抓标题+摘要（免费） |
| 新东方/好未来研究院报告 | 需要注册下载 | 关注其官方微信/网站公告 |
| The Economist Education | 付费订阅 | 只读免费摘要 |

### RSSHub 自建方案（可选进阶）
```bash
# 部署 RSSHub 后可订阅微信公众号等封闭平台
# https://docs.rsshub.app/
docker run -d --name rsshub -p 1200:1200 diygod/rsshub
```

---

## 七、快速 Checklist

使用此 Skill 前确认：
- [ ] 用户需求的地域范围（中国 / 全球 / 双语）
- [ ] 内容板块（政策 / 研究 / 故事 / 全部）
- [ ] 是否需要实时抓取 or 提供数据源指引
- [ ] 是否需要代码实现（聚合器 / API调用）
- [ ] 故事类内容：是否需要「家庭教育方法论」角度的提炼
