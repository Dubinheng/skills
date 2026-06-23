// ── EduNews 后端配置 ───────────────────────────────────────────────────────
export const CONFIG = {

  // 服务器
  port: process.env.PORT ?? 3456,

  // 缓存 (毫秒)
  cacheTTL: 15 * 60 * 1000,        // 15 分钟

  // 每个 Feed 最多抓取多少条
  itemsPerFeed: 10,

  // 每个板块最终保留多少条（去重后）
  maxPerCategory: 30,

  // 翻译：是否开启自动中文翻译
  translateEnabled: true,

  // 翻译并发数（MyMemory 免费接口限速，建议 ≤3）
  translateConcurrency: 3,

  // MyMemory 免费翻译 API（无需 key，1000 词/天；
  // 注册免费账号后填入 email 可提升到 10000 词/天）
  translateApiEmail: process.env.TRANSLATE_EMAIL ?? '',

  // ── Feed 数据源 ─────────────────────────────────────────────────────────
  feeds: {

    english_learning: [
      {
        name: 'Google News – 少儿英语学习',
        url: 'https://news.google.com/rss/search?q=少儿英语+学习方法&hl=zh-CN&gl=CN&ceid=CN:zh-Hans',
        lang: 'zh',
      },
      {
        name: 'Google News – Children English Learning',
        url: 'https://news.google.com/rss/search?q=children+english+learning+education&hl=en-US&gl=US&ceid=US:en',
        lang: 'en',
      },
      {
        name: 'Google News – Kids Language Skills',
        url: 'https://news.google.com/rss/search?q=kids+english+language+skills+school&hl=en-US&gl=US&ceid=US:en',
        lang: 'en',
      },
      {
        name: 'eSchool News',
        url: 'https://www.eschoolnews.com/feed/',
        lang: 'en',
      },
    ],

    youth_achievement: [
      {
        name: 'Google News – 少年获奖',
        url: 'https://news.google.com/rss/search?q=少年+获奖+编程+发明+最小年龄&hl=zh-CN&gl=CN&ceid=CN:zh-Hans',
        lang: 'zh',
      },
      {
        name: 'Google News – Teen Award Prodigy',
        url: 'https://news.google.com/rss/search?q=teen+student+award+winner+youngest+prodigy&hl=en-US&gl=US&ceid=US:en',
        lang: 'en',
      },
      {
        name: 'Google News – Child Inventor Hackathon',
        url: 'https://news.google.com/rss/search?q=child+genius+hackathon+olympiad+inventor+education&hl=en-US&gl=US&ceid=US:en',
        lang: 'en',
      },
      {
        name: 'Chalkbeat',
        url: 'https://chalkbeat.org/arc/outboundfeeds/rss/',
        lang: 'en',
      },
    ],

    academic_family: [
      {
        name: 'Google News – 家庭教育研究',
        url: 'https://news.google.com/rss/search?q=家庭教育+亲子+研究+方法论&hl=zh-CN&gl=CN&ceid=CN:zh-Hans',
        lang: 'zh',
      },
      {
        name: 'Google News – Child Development',
        url: 'https://news.google.com/rss/search?q=child+development+research+parenting+education&hl=en-US&gl=US&ceid=US:en',
        lang: 'en',
      },
      {
        name: 'Education Next',
        url: 'https://educationnext.org/feed/',
        lang: 'en',
      },
      {
        name: 'EdSurge',
        url: 'https://www.edsurge.com/news.rss',
        lang: 'en',
      },
    ],
  },
};
