/* ══════════════════════════════════════════════════════════════════════
   New Century EduNews — 极简编辑风 + 滚动动效
   ══════════════════════════════════════════════════════════════════════ */

// ── State ──────────────────────────────────────────────────────────────
const state = {
  allNews:        {},
  activeCategory: 'english_learning',
  activePeriod:   'today',
  translated:     false,
  hotPeriod:      'today',
  searchQuery:    '',
};

const CAT_LABELS = {
  english_learning: '英语学习',
  youth_achievement: '少年成就',
  academic_family:  '学术&家庭',
  hot:              '🔥 热榜',
};

// ── DOM refs ───────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const newsGrid      = $('news-grid');
const hotList       = $('hot-list');
const chatMessages  = $('chat-messages');
const chatInput     = $('chat-input');
const readerOverlay = $('reader-overlay');
const readerTitle   = $('reader-title');
const readerMeta    = $('reader-meta');
const readerBody    = $('reader-body');
const readerOrig    = $('reader-orig');
const rightPanel    = $('right-panel');
const panelBackdrop = $('panel-backdrop');
const periodTabsBar = $('period-tabs-bar');
const lastUpdate    = $('last-update');
const sectionTitle  = $('section-title');
const nav           = $('nav');

// ── Helpers ────────────────────────────────────────────────────────────
function fmtDate(raw) {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d)) return '';
  const diff = Date.now() - d.getTime();
  if (diff < 3600000) return `${Math.floor(diff/60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff/3600000)}小时前`;
  return d.toLocaleDateString('zh-CN', { month:'short', day:'numeric' });
}
function sourceColor(cat) {
  return ({ english_learning:'cat-english_learning', youth_achievement:'cat-youth_achievement', academic_family:'cat-academic_family' })[cat] ?? '';
}
function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast'; el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2800);
}

// ── Reveal-on-scroll（MotionSites 风格）────────────────────────────────
const revealIO = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); } });
}, { threshold: .12, rootMargin: '0px 0px -8% 0px' });
function observeReveals() {
  document.querySelectorAll('.reveal:not(.in), .news-card:not(.in)').forEach(el => revealIO.observe(el));
}

// ── Skeleton ───────────────────────────────────────────────────────────
function showSkeleton() {
  newsGrid.innerHTML = Array.from({ length: 5 }).map(() => `
    <div class="skeleton-card">
      <div class="skel-line" style="width:35%;height:12px"></div>
      <div class="skel-line" style="width:80%;height:22px;margin-top:14px"></div>
      <div class="skel-line" style="width:60%;height:14px"></div>
    </div>`).join('');
}

// ── Card rendering（横向列表行）─────────────────────────────────────────
function cardHTML(item, idx = 0) {
  const cc = sourceColor(item.category);
  const primaryTitle   = state.translated ? (item.titleZh || item.title) : item.title;
  const secondaryTitle = state.translated ? (item.titleZh ? item.title : null) : item.titleZh;
  const snippet = state.translated ? (item.snippetZh || item.snippet) : item.snippet;
  const safeLink = (item.link || '#').replace(/"/g, '&quot;');
  const esc = s => (s || '').replace(/'/g, "\\'");

  return `
  <div class="news-card ${cc}" data-id="${item.id}">
    <div class="card-rank">${String(idx + 1).padStart(2,'0')}</div>
    <div class="card-body">
      <a class="card-title-zh" href="${safeLink}" target="_blank" rel="noopener">${primaryTitle}</a>
      ${secondaryTitle ? `<div class="card-title-en">${secondaryTitle}</div>` : ''}
      ${snippet ? `<div class="card-snippet">${snippet}</div>` : ''}
      <div class="ai-summary" id="summary-${item.id}">
        <div class="ai-summary-label">✨ AI 摘要</div>
        <div class="ai-summary-text"></div>
      </div>
      <div class="card-footer">
        <span class="source-pill">${item.source}</span>
        <span class="tag-chip tag-summary" onclick="toggleSummary('${item.id}','${esc(item.title)}','${esc(item.snippet)}')">✨ AI摘要</span>
        <div class="card-footer-right">
          <span class="card-date">${fmtDate(item.date)}</span>
          <span class="card-read-link" onclick="openReader('${safeLink}','${esc(primaryTitle)}','${esc(item.source)}')">阅读原文</span>
        </div>
      </div>
    </div>
  </div>`;
}

// ── Render news ────────────────────────────────────────────────────────
function renderNews() {
  if (state.activeCategory === 'hot') { renderHotInMain(); return; }
  periodTabsBar.style.display = 'none';
  const items = state.allNews[state.activeCategory] ?? [];
  const query = state.searchQuery.toLowerCase();
  const filtered = query
    ? items.filter(i => (i.titleZh||i.title||'').toLowerCase().includes(query) || (i.title||'').toLowerCase().includes(query))
    : items;
  if (!filtered.length) {
    newsGrid.innerHTML = `<div class="empty-state"><div class="icon">📭</div><p>暂无数据，点右上角刷新试试</p></div>`;
    return;
  }
  newsGrid.innerHTML = filtered.map(cardHTML).join('');
  observeReveals();
}

async function renderHotInMain() {
  periodTabsBar.style.display = 'flex';
  newsGrid.innerHTML = `<div class="empty-state"><div class="icon">⏳</div><p>加载中…</p></div>`;
  const res = await fetch(`/api/hot?period=${state.activePeriod}`);
  const json = await res.json();
  const items = json.data ?? [];
  if (!items.length) { newsGrid.innerHTML = `<div class="empty-state"><div class="icon">🔥</div><p>该时段暂无热门</p></div>`; return; }
  newsGrid.innerHTML = items.map(cardHTML).join('');
  observeReveals();
}

// ── Hot list（侧栏）────────────────────────────────────────────────────
async function renderHotList(period = 'today') {
  hotList.innerHTML = `<div style="text-align:center;padding:24px;color:var(--text-muted)">加载中…</div>`;
  const res = await fetch(`/api/hot?period=${period}`);
  const json = await res.json();
  const items = json.data ?? [];
  if (!items.length) { hotList.innerHTML = `<div style="text-align:center;padding:24px;color:var(--text-muted)">暂无数据</div>`; return; }
  hotList.innerHTML = items.slice(0, 15).map((item, i) => `
    <div class="hot-item" onclick="openReader('${(item.link||'#').replace(/'/g,"\\'")}','${(item.titleZh||item.title||'').replace(/'/g,"\\'")}','${item.source}')">
      <div class="hot-rank">${i + 1}</div>
      <div>
        <div class="hot-title">${item.titleZh || item.title}</div>
        <div class="hot-meta">${item.source} · ${fmtDate(item.date)}</div>
      </div>
    </div>`).join('');
}

// ── Counts ─────────────────────────────────────────────────────────────
function updateCounts() {
  $('cnt-english').textContent  = (state.allNews.english_learning  ?? []).length;
  $('cnt-youth').textContent    = (state.allNews.youth_achievement ?? []).length;
  $('cnt-academic').textContent = (state.allNews.academic_family   ?? []).length;
  const total = ['english_learning','youth_achievement','academic_family']
    .reduce((s,k) => s + (state.allNews[k]?.length ?? 0), 0);
  const hc = $('hero-count'); if (hc) hc.textContent = `今日 ${total} 条资讯`;
}

// ── Category switch ────────────────────────────────────────────────────
function setCategory(cat) {
  state.activeCategory = cat;
  document.querySelectorAll('.nav-link[data-cat]').forEach(n => n.classList.toggle('active', n.dataset.cat === cat));
  document.querySelectorAll('.pill[data-cat]').forEach(p => p.classList.toggle('active', p.dataset.cat === cat));
  sectionTitle.textContent = CAT_LABELS[cat] ?? '资讯';
  renderNews();
}

// ── Load data ──────────────────────────────────────────────────────────
async function loadNews(forceRefresh = false) {
  const btn = $('btn-refresh');
  btn.classList.add('spinning'); showSkeleton();
  try {
    if (forceRefresh) await fetch('/api/refresh', { method:'POST' });
    const res = await fetch('/api/news');
    const json = await res.json();
    if (!json.ok) throw new Error(json.error);
    state.allNews = json.data ?? {};
    updateCounts();
    const now = new Date().toLocaleTimeString('zh-CN', { hour:'2-digit', minute:'2-digit' });
    lastUpdate.textContent = `更新于 ${now}`;
    renderNews();
    renderHotList(state.hotPeriod);
  } catch(e) {
    newsGrid.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><p>加载失败：${e.message}</p></div>`;
  } finally { btn.classList.remove('spinning'); }
}

// ── AI Summary ─────────────────────────────────────────────────────────
async function toggleSummary(id, title, snippet) {
  const box = $(`summary-${id}`);
  if (!box) return;
  if (box.classList.contains('visible')) { box.classList.remove('visible'); return; }
  box.classList.add('visible');
  const textEl = box.querySelector('.ai-summary-text');
  if (textEl.textContent) return;
  textEl.textContent = '正在生成摘要…';
  try {
    const r = await fetch('/api/ai/summary', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title, snippet }) });
    const j = await r.json();
    textEl.textContent = j.ok ? j.summary : `⚠️ ${j.error}`;
  } catch(e) { textEl.textContent = `⚠️ ${e.message}`; }
}
window.toggleSummary = toggleSummary;

// ── Reader ─────────────────────────────────────────────────────────────
async function openReader(url, title, source) {
  if (!url || url === '#') { window.open(url, '_blank'); return; }
  readerTitle.textContent = title;
  readerMeta.textContent  = source;
  readerBody.innerHTML    = '<div class="reader-loading">⏳ 正在加载原文…</div>';
  readerOrig.href         = url;
  readerOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  try {
    const r = await fetch(`/api/reader?url=${encodeURIComponent(url)}`);
    const j = await r.json();
    if (j.ok && j.content) {
      readerTitle.textContent = j.title || title;
      readerBody.innerHTML = j.content || '<p>无法提取正文，请访问原文。</p>';
    } else readerBody.innerHTML = '<p>无法提取正文，请访问原文。</p>';
  } catch { readerBody.innerHTML = '<p>加载失败，请直接访问原文链接。</p>'; }
}
window.openReader = openReader;

function closeReader() { readerOverlay.classList.add('hidden'); document.body.style.overflow = ''; }
$('reader-close').addEventListener('click', closeReader);
readerOverlay.addEventListener('click', e => { if (e.target === readerOverlay) closeReader(); });

// ── Translate toggle ───────────────────────────────────────────────────
$('btn-translate').addEventListener('click', () => {
  state.translated = !state.translated;
  $('btn-translate').classList.toggle('active', state.translated);
  toast(state.translated ? '已切换为中文显示' : '已切换为原文显示');
  renderNews();
});

// ── Slide-in panel ─────────────────────────────────────────────────────
function openPanel(tab) {
  showRightTab(tab);
  rightPanel.classList.add('show'); panelBackdrop.classList.add('show');
  if (tab === 'chat') setTimeout(() => chatInput.focus(), 200);
}
function closePanel() { rightPanel.classList.remove('show'); panelBackdrop.classList.remove('show'); }
function showRightTab(tab) {
  document.querySelectorAll('.right-tab').forEach(t => t.classList.toggle('active', t.dataset.rtab === tab));
  document.querySelectorAll('.right-pane').forEach(p => p.classList.toggle('active', p.id === `rpane-${tab}`));
}
$('btn-chat').addEventListener('click', () => openPanel('chat'));
$('panel-close').addEventListener('click', closePanel);
panelBackdrop.addEventListener('click', closePanel);
document.querySelectorAll('.right-tab').forEach(tab => tab.addEventListener('click', () => showRightTab(tab.dataset.rtab)));

// ── Hot period (panel) ─────────────────────────────────────────────────
document.querySelectorAll('.hot-period-btn').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('.hot-period-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active'); state.hotPeriod = btn.dataset.period; renderHotList(state.hotPeriod);
}));

// ── Period tabs (main hot) ─────────────────────────────────────────────
document.querySelectorAll('.period-btn').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active'); state.activePeriod = btn.dataset.period; renderHotInMain();
}));

// ── Category nav + pills ───────────────────────────────────────────────
document.querySelectorAll('.nav-link[data-cat], .pill[data-cat]').forEach(el =>
  el.addEventListener('click', () => {
    setCategory(el.dataset.cat);
    $('content').scrollIntoView({ behavior:'smooth', block:'start' });
  }));

// ── Search ─────────────────────────────────────────────────────────────
let searchTimer;
$('search-input').addEventListener('input', e => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { state.searchQuery = e.target.value.trim(); renderNews(); }, 280);
});

// ── Refresh ────────────────────────────────────────────────────────────
$('btn-refresh').addEventListener('click', () => loadNews(true));

// ── Hero CTA ───────────────────────────────────────────────────────────
$('hero-enter').addEventListener('click', () => $('content').scrollIntoView({ behavior:'smooth', block:'start' }));

// ══ AI Chat ════════════════════════════════════════════════════════════
const chatHistory = [];
function appendBubble(role, text) {
  const div = document.createElement('div');
  div.className = `chat-bubble ${role}`; div.textContent = text;
  chatMessages.appendChild(div); chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}
async function sendChat() {
  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = ''; chatInput.style.height = 'auto';
  appendBubble('user', text); chatHistory.push({ role:'user', content: text });
  const thinkBubble = appendBubble('thinking', '✨ 思考中…');
  try {
    const res = await fetch('/api/ai/chat', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ messages: chatHistory }) });
    thinkBubble.remove();
    const aiBubble = appendBubble('assistant', ''); let full = '';
    const reader = res.body.getReader(); const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value).split('\n').filter(l => l.startsWith('data:'));
      for (const line of lines) {
        const d = line.slice(5).trim();
        if (d === '[DONE]') break;
        try {
          const j = JSON.parse(d);
          if (j.error) {
            if (j.error.includes('NO_KEY') || j.error.includes('API Key')) $('chat-no-key').style.display = 'block';
            aiBubble.className = 'chat-bubble error'; aiBubble.textContent = `⚠️ ${j.error}`; return;
          }
          if (j.content) { full += j.content; aiBubble.textContent = full; chatMessages.scrollTop = chatMessages.scrollHeight; }
        } catch {}
      }
    }
    chatHistory.push({ role:'assistant', content: full });
  } catch(e) { thinkBubble.remove(); appendBubble('error', `⚠️ ${e.message}`); }
}
$('chat-send').addEventListener('click', sendChat);
chatInput.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } });
chatInput.addEventListener('input', function() { this.style.height = 'auto'; this.style.height = Math.min(this.scrollHeight, 100) + 'px'; });

// ══ MOTION ═════════════════════════════════════════════════════════════
// 滚动进度 + 导航毛玻璃
window.addEventListener('scroll', () => {
  const sc = window.scrollY;
  const p = sc / (document.body.scrollHeight - window.innerHeight || 1);
  $('progress').style.width = `${Math.min(p * 100, 100)}%`;
  nav.classList.toggle('scrolled', sc > 40);
}, { passive: true });

// 磁力按钮
document.querySelectorAll('.btn-primary, .nav-btn-accent').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const r = btn.getBoundingClientRect();
    btn.style.transform = `translate(${(e.clientX - r.left - r.width/2) * .2}px, ${(e.clientY - r.top - r.height/2) * .3}px)`;
  });
  btn.addEventListener('mouseleave', () => btn.style.transform = '');
});

// ── Boot ───────────────────────────────────────────────────────────────
requestAnimationFrame(() => document.querySelector('.hero').classList.add('in'));
observeReveals();
loadNews();
