import { readFile, writeFile } from "node:fs/promises";

const origin = "https://www.winpk99.com";
const today = new Date().toISOString().slice(0, 10);

const pages = [
  {
    file: "index.html",
    path: "/",
    title: "德州扑克教学与策略资料库｜新手入门、实战技巧、资金管理与避坑指南",
    name: "德州扑克教学与策略资料库",
    description:
      "winpk99 是面向中文玩家的德州扑克教学与策略资料库，覆盖新手入门、实战技巧、资金管理、避坑指南、线上安全、每日更新和会员资料。",
    keywords:
      "德州扑克,德州扑克教学,德州扑克技巧,德州扑克策略,德州扑克入门,德州扑克规则,德州扑克资料库,德扑教学,德扑攻略,Texas Holdem",
    type: "WebSite",
    priority: "1.0",
    changefreq: "daily",
  },
  {
    file: "guides.html",
    path: "/guides.html",
    title: "德州扑克专题导航｜入门教程、策略技巧、资金管理、避坑与线上安全",
    name: "德州扑克专题导航",
    description:
      "集中整理德州扑克学习路径和专题入口，包含新手入门、实战策略、资金管理、线下局避坑、线上安全、会员资料库和每日更新。",
    keywords:
      "德州扑克专题,德州扑克学习路径,德州扑克教程,德扑资料,德州扑克攻略,德州扑克系统学习,德州扑克中文资料",
    type: "CollectionPage",
    priority: "0.9",
    changefreq: "weekly",
  },
  {
    file: "updates.html",
    path: "/updates.html",
    title: "德州扑克每日更新｜扑克新闻、策略笔记、赛事动态与风险提醒",
    name: "德州扑克每日更新",
    description:
      "每日自动更新德州扑克新闻摘要、扑克赛事动态、策略笔记、风险提醒和社区讨论，提供中文导读、来源链接和站内延伸阅读。",
    keywords:
      "德州扑克新闻,扑克新闻,德州扑克每日更新,扑克赛事,德州扑克策略笔记,德州扑克风险提醒,扑克社区讨论",
    type: "CollectionPage",
    priority: "0.9",
    changefreq: "daily",
  },
  {
    file: "beginner-guide.html",
    path: "/beginner-guide.html",
    title: "德州扑克新手入门教程｜规则、位置、起手牌、下注顺序与复盘",
    name: "德州扑克新手入门教程",
    description:
      "适合新手的德州扑克入门教程，系统讲解规则、牌型、位置、起手牌、下注顺序、常见误区和第一套复盘习惯。",
    keywords:
      "德州扑克新手入门,德州扑克规则,德州扑克牌型,德州扑克起手牌,德州扑克位置,德州扑克下注顺序,德扑新手教程",
    type: "Article",
    priority: "0.85",
    changefreq: "monthly",
  },
  {
    file: "strategy.html",
    path: "/strategy.html",
    title: "德州扑克实战策略｜位置、范围、下注尺度、底池赔率与手牌复盘",
    name: "德州扑克实战策略",
    description:
      "德州扑克实战策略栏目，覆盖位置优势、起手牌范围、下注尺度、底池赔率、对手类型、翻后计划和手牌复盘框架。",
    keywords:
      "德州扑克策略,德州扑克技巧,德州扑克实战,德州扑克手牌复盘,德州扑克下注尺度,德州扑克底池赔率,GTO基础",
    type: "Article",
    priority: "0.9",
    changefreq: "weekly",
  },
  {
    file: "bankroll-management.html",
    path: "/bankroll-management.html",
    title: "德州扑克资金管理｜买入规则、止损线、降级策略与长期盈利思维",
    name: "德州扑克资金管理",
    description:
      "德州扑克资金管理指南，围绕买入比例、止损线、时间止损、降级规则、复盘记录和长期盈利思维展开。",
    keywords:
      "德州扑克资金管理,德州扑克止损,德州扑克买入规则,德州扑克长期盈利,德州扑克减少亏损,德扑资金管理",
    type: "Article",
    priority: "0.9",
    changefreq: "monthly",
  },
  {
    file: "offline-game-risk.html",
    path: "/offline-game-risk.html",
    title: "德州扑克避坑指南｜线下局风险、陌生人约局、熟人局与欠条局",
    name: "德州扑克避坑指南",
    description:
      "德州扑克避坑指南，帮助识别线下局、陌生人约局、熟人局、欠条局、团队配合、抽水规则和离场风险。",
    keywords:
      "德州扑克避坑,德州扑克防骗,德州扑克线下局风险,德州扑克陌生人约局,德州扑克熟人局,德州扑克欠条局",
    type: "Article",
    priority: "0.9",
    changefreq: "monthly",
  },
  {
    file: "online-poker-safety.html",
    path: "/online-poker-safety.html",
    title: "线上德州扑克安全指南｜私人俱乐部、账号安全、出金与异常协作",
    name: "线上德州扑克安全指南",
    description:
      "线上德州扑克安全指南，围绕私人俱乐部、账号安全、资金边界、出金记录、异常协作、平台规则和风险识别展开。",
    keywords:
      "线上德州扑克安全,德州扑克平台风险,德州扑克出金,德州扑克账号安全,私人俱乐部风险,WPK安全,PokerBros风险",
    type: "Article",
    priority: "0.85",
    changefreq: "monthly",
  },
  {
    file: "member-library.html",
    path: "/member-library.html",
    title: "德州扑克会员资料库｜VIP图表、复盘模板、策略资料与SVIP专题",
    name: "德州扑克会员资料库",
    description:
      "winpk99 会员资料库展示 VIP 与 SVIP 可解锁内容，包括德州扑克系统文章、图表资料、复盘模板、避坑清单和高阶专题。",
    keywords:
      "德州扑克会员资料,德州扑克VIP,德州扑克图表,德州扑克复盘模板,德州扑克策略资料,德扑会员资料库",
    type: "CollectionPage",
    priority: "0.8",
    changefreq: "weekly",
  },
  {
    file: "membership.html",
    path: "/membership.html",
    title: "winpk99会员方案｜德州扑克VIP与SVIP资料库开通方式",
    name: "winpk99会员方案",
    description:
      "winpk99 会员方案说明免费、VIP、SVIP 的权益差异、适合人群、资料范围和开通方式，可通过 QQ 993833 咨询。",
    keywords:
      "winpk99会员,德州扑克VIP,德州扑克SVIP,德州扑克付费资料,德州扑克会员开通,德扑资料会员",
    type: "WebPage",
    priority: "0.75",
    changefreq: "monthly",
  },
  {
    file: "vip.html",
    path: "/vip.html",
    title: "德州扑克VIP专区｜系统文章、资金管理模板、避坑清单与复盘框架",
    name: "德州扑克VIP专区",
    description:
      "VIP 专区展示德州扑克基础与进阶会员内容，包括系统文章、图表资料、资金管理模板、避坑清单和复盘框架。",
    keywords:
      "德州扑克VIP专区,德州扑克会员文章,德州扑克资金管理模板,德州扑克避坑清单,德州扑克复盘框架",
    type: "CollectionPage",
    priority: "0.75",
    changefreq: "weekly",
  },
  {
    file: "svip.html",
    path: "/svip.html",
    title: "德州扑克SVIP专区｜线上安全、合规风险、高阶案例复盘专题",
    name: "德州扑克SVIP专区",
    description:
      "SVIP 专区展示高阶会员内容，包括线上德州扑克安全、平台风险、合规边界、深度案例复盘和持续更新专题。",
    keywords:
      "德州扑克SVIP,德州扑克高阶资料,线上德州扑克安全,德州扑克合规风险,德州扑克案例复盘",
    type: "CollectionPage",
    priority: "0.7",
    changefreq: "weekly",
  },
  {
    file: "how-to-improve-win-rate.html",
    path: "/how-to-improve-win-rate.html",
    title: "德州扑克怎么提高胜率｜位置意识、选局、下注计划与复盘方法",
    name: "德州扑克怎么提高胜率",
    description:
      "拆解德州扑克提高胜率的方法，围绕位置意识、起手牌选择、选局能力、下注计划、资金管理和手牌复盘展开。",
    keywords:
      "德州扑克怎么提高胜率,德州扑克胜率提升,德州扑克选局,德州扑克复盘,德州扑克下注计划,德扑提高胜率",
    type: "Article",
    priority: "0.85",
    changefreq: "monthly",
  },
  {
    file: "why-always-lose.html",
    path: "/why-always-lose.html",
    title: "德州扑克为什么总输｜起手牌过宽、追损、桌况风险与复盘缺失",
    name: "德州扑克为什么总输",
    description:
      "分析德州扑克总输的常见原因，包括起手牌过宽、位置感弱、追损、桌况风险、资金管理不足和复盘缺失。",
    keywords:
      "德州扑克为什么总输,德州扑克总是输,德州扑克亏损原因,德州扑克追损,德州扑克减少亏损,德扑输钱原因",
    type: "Article",
    priority: "0.85",
    changefreq: "monthly",
  },
  {
    file: "long-term-profit.html",
    path: "/long-term-profit.html",
    title: "德州扑克长期盈利靠什么｜纪律、选局、资金管理与情绪控制",
    name: "德州扑克长期盈利靠什么",
    description:
      "从纪律、选局、资金管理、复盘习惯、情绪控制和风险识别六个方向拆解德州扑克长期盈利思维。",
    keywords:
      "德州扑克长期盈利,德州扑克盈利思维,德州扑克纪律,德州扑克选局,德州扑克情绪控制,德扑长期盈利",
    type: "Article",
    priority: "0.85",
    changefreq: "monthly",
  },
  {
    file: "double-squid-strategy.html",
    path: "/double-squid-strategy.html",
    title: "德州扑克翻倍鱿鱼打法攻略｜规则、EV、翻前调整与资金管理",
    name: "德州扑克翻倍鱿鱼打法攻略",
    description:
      "解析德州扑克翻倍鱿鱼模式的规则、波动、EV 门槛、翻前调整、翻后策略、心理博弈和资金管理。",
    keywords:
      "翻倍鱿鱼打法,德州扑克翻倍鱿鱼,德州扑克特殊玩法,德州扑克EV,德州扑克翻前策略,德州扑克高波动模式",
    type: "Article",
    priority: "0.8",
    changefreq: "monthly",
  },
];

const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "winpk99",
  url: origin,
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    availableLanguage: ["zh-CN"],
    description: "QQ 993833",
  },
};

function urlFor(page) {
  return `${origin}${page.path === "/" ? "/" : page.path}`;
}

function escapeAttr(value) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function breadcrumb(page) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "首页",
        item: `${origin}/`,
      },
      ...(page.path === "/"
        ? []
        : [
            {
              "@type": "ListItem",
              position: 2,
              name: page.name,
              item: urlFor(page),
            },
          ]),
    ],
  };
}

function pageSchema(page) {
  const base = {
    "@context": "https://schema.org",
    "@type": page.type,
    name: page.name,
    headline: page.name,
    url: urlFor(page),
    description: page.description,
    inLanguage: "zh-CN",
    isPartOf: {
      "@type": "WebSite",
      name: "winpk99",
      url: origin,
    },
    publisher: {
      "@type": "Organization",
      name: "winpk99",
      url: origin,
    },
  };

  return base;
}

function replaceTag(html, pattern, replacement, fallbackAnchor = "</head>") {
  if (pattern.test(html)) return html.replace(pattern, replacement);
  return html.replace(fallbackAnchor, `  ${replacement}\n${fallbackAnchor}`);
}

function upsertHead(html, page) {
  const title = `<title>${escapeAttr(page.title)}</title>`;
  const desc = `<meta name="description" content="${escapeAttr(page.description)}">`;
  const keywords = `<meta name="keywords" content="${escapeAttr(page.keywords)}">`;
  const canonical = `<link rel="canonical" href="${urlFor(page)}">`;
  const ogType = `<meta property="og:type" content="${page.type === "Article" ? "article" : "website"}">`;
  const ogTitle = `<meta property="og:title" content="${escapeAttr(page.title)}">`;
  const ogDesc = `<meta property="og:description" content="${escapeAttr(page.description)}">`;
  const ogUrl = `<meta property="og:url" content="${urlFor(page)}">`;
  const twitterTitle = `<meta name="twitter:title" content="${escapeAttr(page.title)}">`;
  const twitterDesc = `<meta name="twitter:description" content="${escapeAttr(page.description)}">`;
  const json = `<script type="application/ld+json">${JSON.stringify([organization, pageSchema(page), breadcrumb(page)])}</script>`;
  const feed = `<link rel="alternate" type="application/rss+xml" title="winpk99 德州扑克每日更新" href="${origin}/feed.xml">`;

  let out = html;
  out = replaceTag(out, /<title>[\s\S]*?<\/title>/, title);
  out = replaceTag(out, /<meta name="description" content="[^"]*">/, desc);
  out = replaceTag(out, /<meta name="keywords" content="[^"]*">/, keywords);
  if (!/<meta name="keywords"/.test(out)) {
    out = out.replace(desc, `${desc}\n  ${keywords}`);
  }
  out = replaceTag(out, /<link rel="canonical" href="[^"]*">/, canonical);
  if (!/<link rel="alternate" type="application\/rss\+xml"/.test(out)) {
    out = out.replace(canonical, `${canonical}\n  ${feed}`);
  }
  out = replaceTag(out, /<meta property="og:type" content="[^"]*">/, ogType);
  out = replaceTag(out, /<meta property="og:title" content="[^"]*">/, ogTitle);
  out = replaceTag(out, /<meta property="og:description" content="[^"]*">/, ogDesc);
  out = replaceTag(out, /<meta property="og:url" content="[^"]*">/, ogUrl);
  out = replaceTag(out, /<meta name="twitter:title" content="[^"]*">/, twitterTitle);
  out = replaceTag(out, /<meta name="twitter:description" content="[^"]*">/, twitterDesc);
  if (!/<meta name="author"/.test(out)) {
    out = out.replace('<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">', '<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">\n  <meta name="author" content="winpk99">\n  <meta name="language" content="zh-CN">');
  }
  out = out.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, json);
  return out;
}

function sitemap() {
  const rows = pages
    .map((page) => `  <url>
    <loc>${urlFor(page)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}\n</urlset>\n`;
}

function robots() {
  return `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\nHost: www.winpk99.com\n`;
}

for (const page of pages) {
  const html = await readFile(page.file, "utf8");
  await writeFile(page.file, `${upsertHead(html, page).trimEnd()}\n`);
}

await writeFile("sitemap.xml", sitemap());
await writeFile("robots.txt", robots());

console.log(`Optimized SEO metadata for ${pages.length} pages.`);
