# Design Inspiration Sources

如何从每个网站高效提取顶级设计模式。

---

## Landbook (`landbook.net`)

**擅长**: 落地页、营销页、SaaS 首页

**怎么找高赞**:
- 首页默认按受欢迎度排列，直接看前 10 个
- 用 WebFetch 抓 `https://landbook.net` 找 `featured` 或 `popular` 标签页面
- 关注标注了"minimal"、"3D"、"dark"等标签的集合

**重点提取维度**:
- Hero 区的文案层级（headline → subline → CTA 的字号比）
- 背景处理方式（渐变 / 纯色 / 图片 / 视频 / Shader）
- 导航栏形态（透明 / 毛玻璃 / 固定 / 滚动消失）
- CTA 按钮设计（大小、颜色对比、hover 效果）

---

## MotionSites.ai (`motionsites.ai`)

**擅长**: 滚动动效、过渡动画、时序编排

**怎么找高赞**:
- 使用 WebFetch 抓 `https://motionsites.ai` 找带 `popular` 或评分高的条目
- 过滤器选 "scroll" 或 "entrance" 类别看最流行的

**重点提取维度**:
- 入场动画触发时机（立即 / 滚动到可见区 / 延迟）
- 元素动画顺序（标题先 → 副标题 → 图片 → CTA，或反之）
- 滚动视差比例（背景速度 vs 前景速度）
- 页面切换过渡（fade / slide / clip-path reveal）
- Stagger 间隔（子元素延迟差，通常 50–150ms）

---

## SeeSaw (`seesaw.website`)

**擅长**: 创意实验设计、获奖作品、前沿视觉

**怎么找高赞**:
- 使用 WebFetch 抓 `https://www.seesaw.website` 找排序靠前的作品
- 关注 Awwwards 获奖标志或编辑推荐标签

**重点提取维度**:
- 非常规布局（倾斜文字 / 重叠层 / 打破网格）
- 光标交互（自定义鼠标 / 磁力效果 / 跟随元素）
- 颜色大胆程度（高饱和撞色 / 单色极简 / 渐变噪点）
- 字体创意（超大标题溢出屏幕 / 混合中英字体）

---

## Bolt.new (`bolt.new`)

**擅长**: Web App UI、功能型界面、仪表板

**怎么找高赞**:
- WebSearch: `site:bolt.new popular templates` 或 `bolt.new showcase`
- 关注社区分享的截图（通常在 X/Twitter 上）

**重点提取维度**:
- 侧边栏 vs 顶栏导航的选择逻辑
- 数据展示方式（表格 / 卡片 / 图表 / 列表）
- 表单 UX（内联验证 / 步骤式 / 单列 vs 多列）
- 空状态设计
- 深色模式配色方案

---

## Shaders.com (`shaders.com`)

**擅长**: WebGL Shader、GLSL 特效、Three.js 场景

**怎么找高赞**:
- WebFetch 抓 `https://www.shaders.com` 找 `popular` 或 `featured` 着色器
- 重点看 `fragment shader` 类别（用于背景特效最多）

**重点提取维度**:
- Shader 类型：噪声 / 流体 / 粒子 / 光线 / 几何
- 颜色控制参数（uniform 变量设计）
- 性能指标（是否有 LOD / 是否限帧）
- 与 DOM 交互方式（鼠标 uniform / 时间 uniform）

**Shader 直接嵌入模版**:
```html
<canvas id="bg"></canvas>
<script>
const vs = `attribute vec2 p; void main(){gl_Position=vec4(p,0,1);}`;
const fs = `/* 粘贴 GLSL 代码 */`;
// WebGL 初始化 + requestAnimationFrame 循环
</script>
```
