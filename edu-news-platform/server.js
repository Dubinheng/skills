import express from 'express';
import Parser  from 'rss-parser';
import fetch   from 'node-fetch';
import * as cheerio from 'cheerio';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join }  from 'path';
import crypto from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, 'data');

// ── Persistent store ───────────────────────────────────────────────────────
function readJSON(file) {
  try { return JSON.parse(readFileSync(join(DATA, file), 'utf8')); }
  catch { return null; }
}
function writeJSON(file, data) {
  writeFileSync(join(DATA, file), JSON.stringify(data, null, 2));
}

// ── App setup ──────────────────────────────────────────────────────────────
const app    = express();
const parser = new Parser({ timeout: 20000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    'Accept': 'application/rss+xml,application/xml,text/xml,*/*',
  } });

app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// ── Simple admin auth (session tokens, 持久化到磁盘，重启不失效) ──────────────
function loadSessions() {
  try { return new Set(JSON.parse(readFileSync(join(DATA, 'sessions.json'), 'utf8'))); }
  catch { return new Set(); }
}
function persistSessions() {
  try { writeFileSync(join(DATA, 'sessions.json'), JSON.stringify([...sessions])); } catch {}
}
const sessions = loadSessions();
function authMiddleware(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!token || !sessions.has(token)) return res.status(401).json({ ok:false, error:'未授权' });
  next();
}

// ── Cache ──────────────────────────────────────────────────────────────────
const cache = { news: null, ts: 0 };
function cacheValid() {
  const s = readJSON('settings.json');
  return cache.news && (Date.now() - cache.ts < (s?.cacheTTL ?? 900000));
}

// ══════════════════════════════════════════════════════════════════════════
// Translation
//   主力：Google Translate 非官方接口（免费，无需 Key，无严格限额）
//   备用：MyMemory（免费，邮件注册可提升额度）
// ══════════════════════════════════════════════════════════════════════════

// ① Google Translate 非官方（translate.googleapis.com）
async function translateGoogle(text, from = 'en', to = 'zh-CN') {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text.slice(0, 500))}`;
  const r = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`Google ${r.status}`);
  const j = await r.json();
  // Response format: [ [ ["translated","original",...], ... ], ... ]
  const t = j[0]?.map(chunk => chunk?.[0] ?? '').join('').trim();
  if (!t || t.toLowerCase() === text.toLowerCase()) throw new Error('no translation');
  return t;
}

// ② Lingva Translate（开源镜像，无需 Key）
async function translateLingva(text, from = 'en', to = 'zh') {
  const url = `https://lingva.ml/api/v1/${from}/${to}/${encodeURIComponent(text.slice(0, 500))}`;
  const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`Lingva ${r.status}`);
  const j = await r.json();
  const t = j?.translation?.trim();
  if (!t || t.toLowerCase() === text.toLowerCase()) throw new Error('no translation');
  return t;
}

// ③ MyMemory 备用
async function translateMyMemory(text, from = 'en', to = 'zh') {
  const s     = readJSON('settings.json') ?? {};
  const email = s.translateEmail ? `&de=${encodeURIComponent(s.translateEmail)}` : '';
  const url   = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 500))}&langpair=${from}|${to}${email}`;
  const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
  const j = await r.json();
  const t = j?.responseData?.translatedText ?? '';
  if (!t || t.toLowerCase() === text.toLowerCase()) throw new Error('no translation');
  if (t.toUpperCase().includes('MYMEMORY WARNING') || t.includes('NEXT AVAILABLE IN')) throw new Error('quota exceeded');
  return t;
}

// ④ 有道非官方接口（国内可访问）
async function translateYoudao(text) {
  const url = `https://fanyi.youdao.com/translate?i=${encodeURIComponent(text.slice(0, 500))}&doctype=json&type=EN2ZH_CN&xmlVersion=1.8`;
  const r = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://fanyi.youdao.com/' },
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`Youdao ${r.status}`);
  const j = await r.json();
  const t = j?.translateResult?.[0]?.[0]?.tgt?.trim();
  if (!t) throw new Error('no translation');
  return t;
}

// ⑤ DeepSeek 翻译（国内可访问，最稳，作为首选）
async function translateDeepSeek(text) {
  const s = readJSON('settings.json') ?? {};
  if (!s.deepseekApiKey) throw new Error('NO_KEY');
  const r = await aiChat([
    { role:'system', content:'你是专业翻译引擎。把用户输入的英文翻译成简体中文，只输出译文本身，不要加引号、解释或额外内容。' },
    { role:'user', content: text.slice(0, 500) },
  ], false, 400);
  const j = await r.json();
  const t = j.choices?.[0]?.message?.content?.trim();
  if (!t) throw new Error('no translation');
  return t;
}

// 主入口：DeepSeek（国内可用）→ Google → Lingva → MyMemory → 有道，逐级兜底
async function translateText(text, from = 'en', to = 'zh') {
  if (!text?.trim()) return null;
  const fns = [
    () => translateDeepSeek(text),
    () => translateGoogle(text, from, to === 'zh' ? 'zh-CN' : to),
    () => translateLingva(text, from, to),
    () => translateMyMemory(text, from, to),
    () => translateYoudao(text),
  ];
  for (const fn of fns) {
    try { return await fn(); } catch {}
  }
  return null;
}

// Bulk translate with concurrency limit
async function bulkTranslate(items, concurrency = 3) {
  const enItems = items.filter(i => i.lang === 'en');
  for (let i = 0; i < enItems.length; i += concurrency) {
    await Promise.all(enItems.slice(i, i + concurrency).map(async item => {
      item.titleZh   = await translateText(item.title);
      item.snippetZh = item.snippet ? await translateText(item.snippet) : null;
    }));
  }
}

// ══════════════════════════════════════════════════════════════════════════
// AI  (DeepSeek，OpenAI 兼容格式)
// ══════════════════════════════════════════════════════════════════════════
async function aiChat(messages, stream = false, maxTokens = 512) {
  const s = readJSON('settings.json') ?? {};
  if (!s.deepseekApiKey) throw new Error('NO_KEY');
  const r = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${s.deepseekApiKey}` },
    body: JSON.stringify({
      model: s.deepseekModel || 'deepseek-chat',
      messages,
      stream,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(30000),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e?.error?.message || `DeepSeek ${r.status}`);
  }
  return r;
}

// ══════════════════════════════════════════════════════════════════════════
// Article Store  (7天持久化，防止源失效时内容清空)
// ══════════════════════════════════════════════════════════════════════════
const STORE_TTL = 7 * 24 * 60 * 60 * 1000; // 7天

function loadStore() {
  return readJSON('article-store.json') ?? {};
}
function saveStore(store) {
  writeJSON('article-store.json', store);
}

// 合并新文章与历史存储，去重 + 删7天前的
function mergeWithStore(category, freshItems) {
  const store = loadStore();
  const now   = Date.now();

  // 清除7天前的旧文章
  const stored = (store[category] ?? []).filter(i =>
    now - new Date(i.storedAt ?? 0).getTime() < STORE_TTL
  );

  // 新文章中排除已存储的（按标题前60字去重）
  const storedKeys = new Set(stored.map(i => i.title?.toLowerCase().slice(0, 60)));
  const toAdd = freshItems.filter(i => !storedKeys.has(i.title?.toLowerCase().slice(0, 60)));
  toAdd.forEach(i => { i.storedAt = new Date().toISOString(); });

  // 合并：新文章在前，历史在后，最多保留300条
  store[category] = [...toAdd, ...stored].slice(0, 300);
  saveStore(store);

  return store[category];
}

// ══════════════════════════════════════════════════════════════════════════
// Category keyword filters — 文章必须含至少一个词才保留
// ══════════════════════════════════════════════════════════════════════════
const CATEGORY_KEYWORDS = {
  // 必须含英语/外语相关词，避免"优秀教师""校园餐"这类宽泛教育新闻漏入
  english_learning: [
    '英语','外语','双语','口语','听力','语法','词汇','四六级','托福','雅思',
    '多邻国','有道','网易有道','词典','背单词','语言学习','英语学习',
    'english','esl','ell','vocabulary','grammar','pronunciation','duolingo','youdao',
    'literacy','phonics','bilingual','language learning','language skills',
    'second language','foreign language','language arts','fluency','reading skills',
  ],
  youth_achievement: [
    '学生','少年','青少年','中学生','小学生','青年','儿童',
    '获奖','竞赛','比赛','冠军','发明','科创','奥赛','奖学金','排名','状元','天才',
    'student','teen','teenager','youth','young','child','kid',
    'award','prize','winner','champion','competition','prodigy','genius',
    'olympiad','inventor','scholarship','hackathon','youngest',
  ],
  academic_family: [
    '家庭','亲子','育儿','父母','家长','幼儿','宝宝','早教','学前','教养',
    '陪伴','成长','儿童心理','亲情','隔代','亲子关系','家庭教育',
    'family','parent','parenting','toddler','infant','baby',
    'child development','child psychology','parenting tips','homeschool',
    'upbringing','family education','childhood','preschool',
  ],
};

function matchesCategory(item, category) {
  const kws = CATEGORY_KEYWORDS[category];
  if (!kws) return true; // 无白名单则全部保留
  const hay = `${item.title ?? ''} ${item.snippet ?? ''}`.toLowerCase();
  return kws.some(kw => {
    const k = kw.toLowerCase();
    // 英文(ASCII)关键词用单词边界，避免 'ell' 命中 'tessella' 这类误匹配；中文用子串
    if (/^[\x00-\x7f]+$/.test(k)) {
      const esc = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`\\b${esc}\\b`).test(hay);
    }
    return hay.includes(k);
  });
}

// ══════════════════════════════════════════════════════════════════════════
// RSS fetch + build
// ══════════════════════════════════════════════════════════════════════════
async function fetchFeed(src) {
  try {
    const feed = await parser.parseURL(src.url);
    const s    = readJSON('settings.json') ?? {};
    return feed.items.slice(0, s.itemsPerFeed ?? 10).map(item => ({
      id:        crypto.randomUUID(),
      title:     item.title?.trim() ?? '',
      link:      item.link ?? '',
      source:    src.name,
      category:  src.category,
      lang:      src.lang,
      date:      item.pubDate ?? item.isoDate ?? '',
      snippet:   (item.contentSnippet ?? item.summary ?? '').slice(0, 250),
      titleZh:   null,
      snippetZh: null,
      aiSummary: null,
      keywordFilter: src.keywordFilter !== false, // false=精选源不过滤；默认按关键词过滤
    }));
  } catch { return []; }
}

async function buildNews() {
  const sources = (readJSON('sources.json') ?? []).filter(s => s.active);
  const s       = readJSON('settings.json') ?? {};

  // 按分类分组
  const byCategory = {};
  for (const src of sources) {
    (byCategory[src.category] ??= []).push(src);
  }

  const result = {};
  const globalSeen = new Set(); // 跨分类去重

  for (const [cat, feeds] of Object.entries(byCategory)) {
    // 1. 抓取新文章，并用关键词白名单过滤不相关内容
    const settled = await Promise.allSettled(feeds.map(fetchFeed));
    const fresh   = settled
      .flatMap(r => r.status === 'fulfilled' ? r.value : [])
      .filter(i => i.keywordFilter === false || matchesCategory(i, cat));

    // 2. 合并进7天存储
    const merged = mergeWithStore(cat, fresh);

    // 3. 分类内去重（标题）+ 同时过滤存储中的旧杂闻
    const seen = new Set();
    const uniq = merged.filter(i => {
      const k = i.title?.toLowerCase().slice(0, 60);
      if (!k || seen.has(k)) return false;
      if (i.keywordFilter !== false && !matchesCategory(i, cat)) return false; // 过滤旧存储中的杂闻（精选源除外）
      seen.add(k); return true;
    });

    // 4. 只保留今天的文章（按服务器本地时间）
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayItems = uniq.filter(i => {
      const d = new Date(i.date);
      return !isNaN(d) && d >= todayStart;
    });
    // 若今天文章不足3条，回退显示最近48小时（避免全空）
    const displayItems = todayItems.length >= 3
      ? todayItems
      : uniq.filter(i => { const d = new Date(i.date); return !isNaN(d) && (Date.now() - d.getTime()) < 172800000; });

    // 5. 跨分类去重（同一篇文章不出现在两个分类里）
    const crossDeduped = displayItems.filter(i => {
      const k = i.link || i.title?.toLowerCase().slice(0, 60);
      if (!k || globalSeen.has(k)) return false;
      globalSeen.add(k); return true;
    });

    // 6. 时间倒序
    crossDeduped.sort((a, b) => new Date(b.date) - new Date(a.date));
    result[cat] = crossDeduped.slice(0, s.maxPerCategory ?? 40);

    // 5. 翻译未翻译的英文文章
    if (s.translateEnabled !== false) await bulkTranslate(result[cat]);
  }
  return result;
}

// ══════════════════════════════════════════════════════════════════════════
// Routes — News
// ══════════════════════════════════════════════════════════════════════════
app.get('/api/news', async (req, res) => {
  if (cacheValid()) return res.json({ ok:true, cached:true, data:cache.news });
  try {
    const data = await buildNews();
    cache.news = data; cache.ts = Date.now();
    res.json({ ok:true, cached:false, data });
  } catch(e) { res.status(500).json({ ok:false, error:e.message }); }
});

app.post('/api/refresh', (req, res) => {
  cache.news = null; cache.ts = 0;
  res.json({ ok:true });
});

// 状态监控
app.get('/api/admin/status', authMiddleware, (req, res) => {
  const store   = loadStore();
  const s       = readJSON('settings.json') ?? {};
  const sources = readJSON('sources.json') ?? [];
  const now     = Date.now();

  const cats = ['english_learning','youth_achievement','academic_family'];
  const storeStats = {};
  for (const cat of cats) {
    const items = (store[cat] ?? []).filter(i => now - new Date(i.storedAt ?? 0).getTime() < STORE_TTL);
    storeStats[cat] = { total: items.length, today: items.filter(i => now - new Date(i.date).getTime() < 86400000).length };
  }

  res.json({
    ok: true,
    data: {
      cacheValid:    cacheValid(),
      cacheAge:      cache.ts ? Math.round((now - cache.ts) / 60000) : null,
      cacheTTL:      Math.round((s.cacheTTL ?? 900000) / 60000),
      sourcesTotal:  sources.length,
      sourcesActive: sources.filter(s => s.active).length,
      store:         storeStats,
      newsLoaded:    cache.news ? Object.fromEntries(cats.map(c => [c, (cache.news[c] ?? []).length])) : null,
      translateApis: ['DeepSeek（国内可用·首选）', 'Google', 'Lingva', 'MyMemory', '有道'],
      aiEnabled:     !!s.deepseekApiKey,
      serverTime:    new Date().toISOString(),
    },
  });
});

// 存储统计（管理后台用）
app.get('/api/store/stats', authMiddleware, (req, res) => {
  const store = loadStore();
  const now   = Date.now();
  const stats = {};
  for (const [cat, items] of Object.entries(store)) {
    const valid = items.filter(i => now - new Date(i.storedAt ?? 0).getTime() < STORE_TTL);
    stats[cat] = { total: valid.length, oldest: valid.at(-1)?.storedAt ?? null };
  }
  res.json({ ok:true, data: stats });
});

// Hot list  (top N by recency across all categories, filtered by period)
app.get('/api/hot', (req, res) => {
  if (!cache.news) return res.json({ ok:true, data:[] });
  const period = req.query.period ?? 'today';
  const now    = Date.now();
  const cutoff = { today: 86400000, week: 604800000, month: 2592000000 }[period] ?? 86400000;

  // 合并所有分类，按链接去重（同一文章可能出现在多个分类）
  const seen = new Set();
  const all = Object.values(cache.news).flat().filter(i => {
    const key = i.link || i.title?.slice(0, 60);
    if (!key || seen.has(key)) return false;
    seen.add(key); return true;
  });

  const filtered = all
    .filter(i => {
      const d = new Date(i.date);
      return !isNaN(d) && (now - d.getTime()) < cutoff;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 20);

  // 今天条数不足时回退到全量
  const list = filtered.length >= 3
    ? filtered
    : all.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20);

  res.json({ ok:true, data: list });
});

// ══════════════════════════════════════════════════════════════════════════
// Routes — Translate (on-demand for single text)
// ══════════════════════════════════════════════════════════════════════════
app.post('/api/translate', async (req, res) => {
  const { texts = [], from = 'en', to = 'zh' } = req.body;
  try {
    const results = [];
    for (const t of texts.slice(0, 10)) {
      results.push(await translateText(t, from, to));
    }
    res.json({ ok:true, translations: results });
  } catch(e) { res.status(500).json({ ok:false, error:e.message }); }
});

// ══════════════════════════════════════════════════════════════════════════
// Routes — AI Summary
// ══════════════════════════════════════════════════════════════════════════
app.post('/api/ai/summary', async (req, res) => {
  const { title, snippet } = req.body;
  try {
    const r = await aiChat([{
      role: 'user',
      content: `用中文2句话总结这条教育新闻（面向家长）：${title}。${snippet ?? ''}`,
    }], false, 150);
    const j = await r.json();
    res.json({ ok:true, summary: j.choices?.[0]?.message?.content ?? '' });
  } catch(e) {
    if (e.message === 'NO_KEY') return res.json({ ok:false, error:'请在管理后台配置 DeepSeek API Key' });
    res.status(500).json({ ok:false, error: e.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// Routes — AI Chat (SSE stream)
// ══════════════════════════════════════════════════════════════════════════
const SYSTEM_PROMPT = '你是儿童教育助手，专注0-16岁英语学习与家庭教育。用中文简洁回答。';

app.post('/api/ai/chat', async (req, res) => {
  const { messages = [] } = req.body;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const r = await aiChat([
      { role:'system', content: SYSTEM_PROMPT },
      ...messages.slice(-5),          // 只保留最近5条，节省 token
    ], true, 800);

    for await (const chunk of r.body) {
      const lines = chunk.toString().split('\n').filter(l => l.startsWith('data:'));
      for (const line of lines) {
        const data = line.slice(5).trim();
        if (data === '[DONE]') { res.write('data: [DONE]\n\n'); continue; }
        try {
          const j = JSON.parse(data);
          const delta = j.choices?.[0]?.delta?.content;
          if (delta) res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
        } catch {}
      }
    }
    res.end();
  } catch(e) {
    const msg = e.message === 'NO_KEY' ? '请在管理后台配置 DeepSeek API Key' : e.message;
    res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
    res.end();
  }
});

// ══════════════════════════════════════════════════════════════════════════
// Routes — Article Reader
// ══════════════════════════════════════════════════════════════════════════
app.get('/api/reader', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ ok:false, error:'Missing url' });
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent':'Mozilla/5.0', 'Accept-Language':'zh-CN,zh;q=0.9,en;q=0.8' },
      signal: AbortSignal.timeout(10000),
    });
    const html = await r.text();
    const $    = cheerio.load(html);

    // Remove noise
    $('script,style,nav,header,footer,aside,[class*="ad"],[class*="sidebar"],[class*="menu"],[id*="ad"],[id*="sidebar"]').remove();

    // Extract title
    const title = $('h1').first().text().trim()
      || $('meta[property="og:title"]').attr('content')
      || $('title').text().trim();

    // Extract main content
    const selectors = ['article','[class*="article"]','[class*="content"]','[class*="post"]','main','.entry-content','#content'];
    let contentEl = null;
    for (const sel of selectors) {
      if ($(sel).length) { contentEl = $(sel).first(); break; }
    }
    const contentHtml = contentEl
      ? contentEl.find('p').map((_, el) => `<p>${$(el).text().trim()}</p>`).get().join('')
      : $('p').map((_, el) => `<p>${$(el).text().trim()}</p>`).get().slice(0, 30).join('');

    res.json({ ok:true, title, content: contentHtml, url });
  } catch(e) { res.status(500).json({ ok:false, error:e.message }); }
});

// ══════════════════════════════════════════════════════════════════════════
// Routes — Admin
// ══════════════════════════════════════════════════════════════════════════
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const s = readJSON('settings.json') ?? {};
  if (password !== s.adminPassword) return res.status(401).json({ ok:false, error:'密码错误' });
  const token = crypto.randomBytes(24).toString('hex');
  sessions.add(token);
  persistSessions();
  res.json({ ok:true, token });
});

app.get('/api/admin/sources', authMiddleware, (req, res) => {
  res.json({ ok:true, data: readJSON('sources.json') ?? [] });
});
app.post('/api/admin/sources', authMiddleware, (req, res) => {
  const sources = readJSON('sources.json') ?? [];
  const src = { ...req.body, id: Date.now().toString(), active: true };
  sources.push(src);
  writeJSON('sources.json', sources);
  cache.news = null; cache.ts = 0;
  res.json({ ok:true, data: src });
});
app.put('/api/admin/sources/:id', authMiddleware, (req, res) => {
  const sources = (readJSON('sources.json') ?? []).map(s =>
    s.id === req.params.id ? { ...s, ...req.body, id: s.id } : s);
  writeJSON('sources.json', sources);
  cache.news = null; cache.ts = 0;
  res.json({ ok:true });
});
app.delete('/api/admin/sources/:id', authMiddleware, (req, res) => {
  const sources = (readJSON('sources.json') ?? []).filter(s => s.id !== req.params.id);
  writeJSON('sources.json', sources);
  cache.news = null; cache.ts = 0;
  res.json({ ok:true });
});

app.get('/api/admin/settings', authMiddleware, (req, res) => {
  const s = readJSON('settings.json') ?? {};
  // mask password
  res.json({ ok:true, data: { ...s, adminPassword: '••••••' } });
});
app.put('/api/admin/settings', authMiddleware, (req, res) => {
  const cur = readJSON('settings.json') ?? {};
  const upd = { ...cur, ...req.body };
  if (req.body.adminPassword === '••••••') upd.adminPassword = cur.adminPassword;
  writeJSON('settings.json', upd);
  res.json({ ok:true });
});

// ══════════════════════════════════════════════════════════════════════════
// Routes — Theme
// ══════════════════════════════════════════════════════════════════════════
app.get('/api/theme', (req, res) => {
  res.json({ ok:true, data: readJSON('theme.json') ?? {} });
});

app.put('/api/theme', authMiddleware, (req, res) => {
  const cur = readJSON('theme.json') ?? {};
  writeJSON('theme.json', { ...cur, ...req.body });
  res.json({ ok:true });
});

// Serve theme as CSS variables (loaded by index.html)
app.get('/theme.css', (req, res) => {
  const t = readJSON('theme.json') ?? {};
  const css = `:root {
  --primary:     ${t.primaryColor   ?? '#FF6BAC'};
  --primary-h:   ${t.primaryColor   ?? '#FF6BAC'}cc;
  --primary-bg:  ${t.primaryColor   ?? '#FF6BAC'}18;
  --mint:        ${t.mintColor      ?? '#5CC8A0'};
  --mint-soft:   ${t.mintColor      ?? '#5CC8A0'}40;
  --mint-bg:     ${t.mintColor      ?? '#5CC8A0'}12;
  --sky:         ${t.skyColor       ?? '#52B8E8'};
  --sky-soft:    ${t.skyColor       ?? '#52B8E8'}40;
  --sky-bg:      ${t.skyColor       ?? '#52B8E8'}12;
  --lemon:       ${t.lemonColor     ?? '#F5C842'};
  --lemon-soft:  ${t.lemonColor     ?? '#F5C842'}40;
  --lemon-bg:    ${t.lemonColor     ?? '#F5C842'}12;
  --lavender:    ${t.lavenderColor  ?? '#9B7FD4'};
  --lavender-soft:${t.lavenderColor ?? '#9B7FD4'}40;
  --lavender-bg: ${t.lavenderColor  ?? '#9B7FD4'}12;
  --peach:       ${t.peachColor     ?? '#FF8C5A'};
  --peach-soft:  ${t.peachColor     ?? '#FF8C5A'}40;
  --peach-bg:    ${t.peachColor     ?? '#FF8C5A'}12;
  --bg:          ${t.bgColor        ?? '#FFF8FC'};
  --text:        ${t.textColor      ?? '#2D1A2E'};
  --radius:      ${t.cardRadius     ?? 14}px;
  --sidebar-w:   ${t.sidebarWidth   ?? 220}px;
  --topbar-h:    ${t.topbarHeight   ?? 56}px;
  --shadow:      0 2px ${t.shadowStrength ?? 16}px rgba(255,107,172,.${Math.round((t.shadowStrength ?? 10)/100*100)});
}
.news-card { border-radius: ${t.cardRadius ?? 14}px; }
.news-grid  { gap: ${t.cardGap ?? 16}px; }
.card-title-zh { font-size: ${t.cardTitleSize ?? 15}px; }
body { font-size: ${t.bodyFontSize ?? 14}px; }
`;
  res.setHeader('Content-Type', 'text/css');
  res.send(css);
});

// ── Start ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT ?? 3456;
app.listen(PORT, () => console.log(`✨ New Century EduNews → http://localhost:${PORT}`));
