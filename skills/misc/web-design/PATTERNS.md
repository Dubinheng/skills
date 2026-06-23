# Design Patterns Catalog

从顶级设计网站提炼的高频模式，按场景索引。

---

## Layout Patterns

### `minimal-saas`
极简 SaaS 落地页（Landbook 最高频）
- 导航: logo 左 + 链接右 + CTA 按钮，透明背景，滚动后加毛玻璃
- Hero: 居中文案，标题 64–80px，副标题 18–20px，单 CTA
- 背景: 纯白 / 极浅灰（#F8F9FA），偶有轻渐变噪点
- 内容区: 最大宽度 1200px，左右各 48px padding
- 特征区: 3列图标+文字，或全宽截图

```css
:root {
  --max-w: 1200px;
  --px: clamp(24px, 5vw, 80px);
  --hero-h: calc(100vh - 72px);
}
```

---

### `motion-hero`
全屏动效英雄区（MotionSites 主流）
- 全屏 100vh，深色背景（#0A0A0A 或深蓝 #0D0F1A）
- 标题逐字/逐行入场，`translate(0, 40px)` → `translate(0,0)` + `opacity 0→1`
- 滚动时文字固定(sticky)，背景图视差
- 入场时序: 标题(0s) → 副标题(0.3s) → CTA(0.5s) → 图片(0.7s)

```css
.reveal {
  opacity: 0;
  transform: translateY(32px);
  transition: opacity 0.7s ease, transform 0.7s ease;
}
.reveal.visible { opacity: 1; transform: none; }
```

```js
const io = new IntersectionObserver(
  entries => entries.forEach(e => e.isIntersecting && e.target.classList.add('visible')),
  { threshold: 0.15 }
);
document.querySelectorAll('.reveal').forEach(el => io.observe(el));
```

---

### `card-grid`
产品/特性卡片网格（通用）
- 3列（桌面）/ 2列（平板）/ 1列（手机）
- 卡片: 圆角 16–24px，1px 边框（rgba white/black 10%），hover 上浮+阴影
- 图片区 16:9 或正方形，内容区 padding 24px
- hover 微动: `transform: translateY(-4px)` + `box-shadow` 增强

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}
.card {
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,.08);
  transition: transform .25s ease, box-shadow .25s ease;
}
.card:hover {
  transform: translateY(-6px);
  box-shadow: 0 24px 48px rgba(0,0,0,.2);
}
```

---

### `shader-bg`
WebGL Shader 背景（Shaders.com 风格）
- Canvas 固定全屏，z-index -1，内容叠在上方
- 常用效果: 流体噪声（Perlin/Simplex）、粒子群、光晕扩散
- 颜色通常限 2–3 色，用 uniform 控制鼠标交互

```glsl
/* fragment shader 流体噪声模版 */
precision mediump float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

float noise(vec2 p) { /* ... */ }

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float n = noise(uv * 3.0 + u_time * 0.4);
  vec3 col = mix(vec3(0.05,0.02,0.15), vec3(0.1,0.4,0.8), n);
  gl_FragColor = vec4(col, 1.0);
}
```

---

## Color Systems

### Dark Premium（深色奢华）
来源: Landbook 获奖深色页 + SeeSaw

```css
:root {
  --bg: #080808;
  --surface: #111111;
  --border: rgba(255,255,255,.08);
  --text-primary: #F0F0F0;
  --text-secondary: #888;
  --accent: #6C47FF;          /* 紫 */
  --accent-warm: #FF6B35;     /* 橙 */
  --gradient: linear-gradient(135deg, #6C47FF 0%, #FF6B35 100%);
}
```

### Soft Light（柔和浅色）
来源: Landbook 极简 SaaS

```css
:root {
  --bg: #FAFAFA;
  --surface: #FFFFFF;
  --border: rgba(0,0,0,.06);
  --text-primary: #111;
  --text-secondary: #6B7280;
  --accent: #2563EB;
  --accent-alt: #7C3AED;
}
```

### Neon Cyber（霓虹赛博）
来源: MotionSites 科技类

```css
:root {
  --bg: #000510;
  --surface: #050D1A;
  --text-primary: #E8F4FF;
  --neon-blue: #00D4FF;
  --neon-green: #00FF88;
  --neon-pink: #FF0080;
  --glow: 0 0 20px currentColor;
}
```

---

## Motion Patterns

### Stagger Entrance（错位入场）
```js
// GSAP（如果可用）
gsap.from('.item', {
  opacity: 0,
  y: 30,
  stagger: 0.08,
  duration: 0.6,
  ease: 'power2.out',
  scrollTrigger: { trigger: '.section', start: 'top 80%' }
});

// 纯 CSS 版
.item:nth-child(1) { animation-delay: 0s; }
.item:nth-child(2) { animation-delay: .08s; }
.item:nth-child(3) { animation-delay: .16s; }
```

### Text Split（文字逐字揭示）
```js
// 将文字拆成 span，逐个 animate
el.innerHTML = el.textContent
  .split('')
  .map((c, i) => `<span style="animation-delay:${i*30}ms">${c}</span>`)
  .join('');
```

### Magnetic Button（磁力按钮）
来源: SeeSaw 常见鼠标交互
```js
btn.addEventListener('mousemove', e => {
  const r = btn.getBoundingClientRect();
  const x = e.clientX - r.left - r.width / 2;
  const y = e.clientY - r.top - r.height / 2;
  btn.style.transform = `translate(${x * .25}px, ${y * .25}px)`;
});
btn.addEventListener('mouseleave', () => btn.style.transform = '');
```

### Scroll Progress Bar
```css
#progress { position: fixed; top: 0; left: 0; height: 3px;
            background: var(--accent); z-index: 999; }
```
```js
window.addEventListener('scroll', () => {
  const p = window.scrollY / (document.body.scrollHeight - window.innerHeight);
  document.getElementById('progress').style.width = `${p * 100}%`;
});
```

---

## Typography

### Scale System（Landbook 常用比例）
```css
:root {
  --text-xs:   0.75rem;   /* 12px - 标签/caption */
  --text-sm:   0.875rem;  /* 14px - 辅助文字 */
  --text-base: 1rem;      /* 16px - 正文 */
  --text-lg:   1.125rem;  /* 18px - 大正文 */
  --text-xl:   1.25rem;   /* 20px - 小标题 */
  --text-2xl:  1.5rem;    /* 24px */
  --text-3xl:  clamp(1.875rem, 4vw, 3rem);   /* H3 */
  --text-4xl:  clamp(2.25rem,  5vw, 3.75rem);/* H2 */
  --text-hero: clamp(3rem, 8vw, 6rem);        /* Hero 标题 */
}

body { font-family: 'Inter', 'SF Pro Display', system-ui, sans-serif; }
h1 { font-size: var(--text-hero); font-weight: 700; line-height: 1.1; letter-spacing: -0.03em; }
p  { font-size: var(--text-lg);   line-height: 1.7; color: var(--text-secondary); }
```
