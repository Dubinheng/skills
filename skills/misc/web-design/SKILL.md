---
name: web-design
description: Research top-rated web designs from Landbook, MotionSites, SeeSaw, Bolt.new, and Shaders.com, then build production-quality HTML/CSS/JS pages. Learns from real high-ranking templates for layout, color, typography, and motion. Use when user wants to design a landing page, web app UI, or any visual webpage; says "design this", "make it beautiful", "add animations", or asks to match a specific visual style.
---

# Web Design

研究顶级设计网站的高赞模版，提炼规律，然后构建网页。

## Workflow

### Phase 1 — Research（研究灵感）

根据设计目标选择对应的灵感来源（见 [SOURCES.md](SOURCES.md)）：

| 目标 | 优先看 |
|------|--------|
| 营销/落地页 | Landbook → SeeSaw |
| 滚动动效 | MotionSites → Shaders |
| WebApp UI | Bolt.new → Landbook |
| 视觉特效/3D | Shaders → MotionSites |
| 创意实验 | SeeSaw → MotionSites |

用 WebFetch 或 WebSearch 抓取对应网站，找排名/点赞最高的 3–5 个案例，提取 [PATTERNS.md](PATTERNS.md) 中定义的维度。

### Phase 2 — Extract（提炼规律）

在设计前总结：
- **Layout**: 几列？英雄区高度？留白量级？
- **Color**: 主色调 + 辅色 hex；深/浅背景？
- **Motion**: 入场方式、滚动触发、微交互
- **Typography**: 标题字号层级、正文行高
- **Vibe**: 极简 / 奢华 / 科技感 / 手工感

### Phase 3 — Build（构建网页）

一个文件输出原则：单 HTML 文件，内联 CSS + JS，除非项目有既有框架。

构建顺序：
1. HTML 骨架 + 语义标签
2. CSS 变量定义颜色/间距系统
3. 核心布局（Grid / Flex）
4. 字体 + 排版层级
5. 动效（Intersection Observer / CSS 动画 / GSAP / WebGL）
6. 响应式断点（mobile-first）

### Phase 4 — Verify（验证）

启动预览服务器，检查：
- [ ] 首屏视觉冲击力
- [ ] 滚动动效流畅不卡顿
- [ ] 移动端不错位
- [ ] 颜色对比度 ≥ 4.5:1（正文）

## Quick Templates

快速生成时可直接套用对应参考：
- **极简 SaaS 落地页** → 参考 [PATTERNS.md#minimal-saas](PATTERNS.md)
- **全屏动效大图** → 参考 [PATTERNS.md#motion-hero](PATTERNS.md)
- **WebGL/Shader 背景** → 参考 [PATTERNS.md#shader-bg](PATTERNS.md)
- **卡片产品展示** → 参考 [PATTERNS.md#card-grid](PATTERNS.md)
