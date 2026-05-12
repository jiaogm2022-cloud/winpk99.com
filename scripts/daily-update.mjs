import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";

const SITE_ORIGIN = "https://www.winpk99.com";
const MAX_ITEMS = Number(process.env.MAX_DAILY_ITEMS || 6);
const MAX_ITEMS_PER_SOURCE = Number(process.env.MAX_ITEMS_PER_SOURCE || 25);
const SOURCE_FILE = "data/sources.json";
const ARCHIVE_DIR = "data/updates";
const UA = "winpk99-daily-updater/1.0 (+https://www.winpk99.com/)";

const categoryRules = [
  ["风险提醒", /security|safe|scam|fraud|cheat|bot|collusion|ban|illegal|regulation|law|arrest|crime|risk|warning|安全|风险|诈骗|合规/i],
  ["资金管理", /bankroll|variance|downswing|loss|stake|buy-in|stop loss|资金|止损|波动/i],
  ["策略笔记", /strategy|gto|range|preflop|flop|turn|river|solver|cash game|mtt|tournament|hand analysis|tips|策略|打法|复盘/i],
  ["赛事新闻", /wsop|wpt|ept|triton|bracelet|champion|event|series|main event|final table|赛事|冠军/i],
  ["社区讨论", /reddit|forum|discussion|thread|community|社区|讨论/i],
];

const relatedByCategory = {
  风险提醒: "offline-game-risk.html",
  资金管理: "bankroll-management.html",
  策略笔记: "strategy.html",
  赛事新闻: "strategy.html",
  社区讨论: "strategy.html",
  新闻动态: "guides.html",
};

const pageUpdateTargets = [
  {
    file: "guides.html",
    title: "全站今日中文编辑精选",
    subtitle: "英文来源翻译、整理、二创后同步到专题导航",
    categories: ["策略笔记", "赛事新闻", "风险提醒", "资金管理", "社区讨论", "新闻动态"],
    limit: 8,
  },
  {
    file: "strategy.html",
    title: "今日策略与赛事复盘",
    subtitle: "从英文策略、赛事和社区讨论里提炼中文复盘问题",
    categories: ["策略笔记", "赛事新闻", "社区讨论"],
    limit: 6,
  },
  {
    file: "bankroll-management.html",
    title: "今日资金管理提醒",
    subtitle: "把英文动态转成买入、止损、降级和波动控制清单",
    categories: ["资金管理", "风险提醒"],
    limit: 5,
  },
  {
    file: "offline-game-risk.html",
    title: "今日线下局风险观察",
    subtitle: "把安全、合规、争议和玩家讨论整理成中文避坑提醒",
    categories: ["风险提醒", "社区讨论", "新闻动态"],
    limit: 5,
  },
  {
    file: "online-poker-safety.html",
    title: "今日线上安全观察",
    subtitle: "围绕平台、账号、工具边界、异常协作和出金风险做中文整理",
    categories: ["风险提醒", "社区讨论", "新闻动态"],
    limit: 5,
  },
  {
    file: "beginner-guide.html",
    title: "今日新手学习入口",
    subtitle: "把英文内容转成新手能执行的中文学习问题",
    categories: ["策略笔记", "资金管理", "风险提醒"],
    limit: 5,
  },
];

const phraseDictionary = [
  [/texas hold'?em/gi, "德州扑克"],
  [/no[- ]limit hold'?em/gi, "无限注德州扑克"],
  [/\bNLHE\b/g, "无限注德州扑克"],
  [/\bWSOP\b/g, "WSOP 世界扑克大赛"],
  [/\bWPT\b/g, "WPT 世界扑克巡回赛"],
  [/\bEPT\b/g, "EPT 欧洲扑克巡回赛"],
  [/\bTriton\b/g, "Triton 高额赛"],
  [/\bPokerStars\b/g, "PokerStars"],
  [/\bGTO Wizard\b/g, "GTO Wizard"],
  [/main event/gi, "主赛事"],
  [/final table/gi, "决赛桌"],
  [/high roller/gi, "高额赛"],
  [/cash game/gi, "现金局"],
  [/tournament/gi, "锦标赛"],
  [/strategy/gi, "策略"],
  [/preflop/gi, "翻前"],
  [/\bflop\b/gi, "翻牌圈"],
  [/\bturn\b/gi, "转牌圈"],
  [/\briver\b/gi, "河牌圈"],
  [/\brange\b/gi, "范围"],
  [/\bsolver\b/gi, "求解器"],
  [/\bGTO\b/g, "GTO"],
  [/\bEV\b/g, "EV"],
  [/bankroll/gi, "资金管理"],
  [/variance/gi, "波动"],
  [/downswing/gi, "下风期"],
  [/buy[- ]in/gi, "买入"],
  [/stop loss/gi, "止损"],
  [/security/gi, "安全"],
  [/scam/gi, "诈骗"],
  [/fraud/gi, "欺诈"],
  [/cheat(?:ing)?/gi, "作弊"],
  [/bot(?:s)?/gi, "机器人账号"],
  [/collusion/gi, "异常协作"],
  [/regulation/gi, "监管"],
  [/community/gi, "玩家社区"],
  [/discussion/gi, "讨论"],
];

function todayInSingapore() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function decodeEntities(value = "") {
  return value
    .replaceAll("<![CDATA[", "")
    .replaceAll("]]>", "")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .trim();
}

function stripHtml(value = "") {
  return decodeEntities(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeEntities(match[1]) : "";
}

function extractAtomLink(block) {
  const href = block.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i)?.[1];
  return decodeEntities(href || "");
}

function parseFeed(xml, source) {
  const blocks = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((match) => match[0]);
  const atomBlocks = blocks.length ? [] : [...xml.matchAll(/<entry\b[\s\S]*?<\/entry>/gi)].map((match) => match[0]);
  return (blocks.length ? blocks : atomBlocks)
    .map((block) => {
      const title = stripHtml(extractTag(block, "title"));
      const link = stripHtml(extractTag(block, "link")) || extractAtomLink(block);
      const description = stripHtml(extractTag(block, "description") || extractTag(block, "summary") || extractTag(block, "content:encoded"));
      const publishedAt = stripHtml(extractTag(block, "pubDate") || extractTag(block, "updated") || extractTag(block, "published"));
      return normalizeItem({ source: source.name, categoryHint: source.categoryHint, title, link, description, publishedAt });
    })
    .filter((item) => item.title && item.url);
}

function normalizeItem(item) {
  const url = normalizeUrl(item.link);
  const id = createHash("sha1").update(url || `${item.source}:${item.title}`).digest("hex").slice(0, 16);
  const category = classify(`${item.title} ${item.description}`, item.categoryHint);
  const translatedTitle = makeTranslatedHeadline(item.title, category);
  return {
    id,
    title: item.title,
    original_title: item.title,
    translated_title_zh: translatedTitle,
    title_zh: makeChineseTitle(item.title, category),
    source: item.source,
    url,
    category,
    summary_zh: summarize(item.title, item.description, category),
    body_zh: makeChineseBody(item.title, item.description, category),
    why_it_matters: whyItMatters(category),
    related_page: relatedByCategory[category] || "updates.html",
    published_at: normalizeDate(item.publishedAt),
    collected_at: new Date().toISOString(),
  };
}

function normalizeUrl(url = "") {
  try {
    const parsed = new URL(stripHtml(url));
    parsed.hash = "";
    for (const key of [...parsed.searchParams.keys()]) {
      if (/^utm_|fbclid|gclid/i.test(key)) parsed.searchParams.delete(key);
    }
    return parsed.toString();
  } catch {
    return stripHtml(url);
  }
}

function normalizeDate(value = "") {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.valueOf()) ? new Date().toISOString() : date.toISOString();
}

function classify(text, fallback = "新闻动态") {
  for (const [category, pattern] of categoryRules) {
    if (pattern.test(text)) return category;
  }
  return fallback || "新闻动态";
}

function summarize(title, description, category) {
  const clean = description || title;
  const sentence = clean.split(/(?<=[.!?。！？])\s+/)[0] || clean;
  const clipped = toChineseDigest(sentence, category);
  const prefix = {
    风险提醒: "今日风险提醒：",
    资金管理: "今日资金管理笔记：",
    策略笔记: "今日策略笔记：",
    赛事新闻: "今日赛事动态：",
    社区讨论: "今日社区观察：",
    新闻动态: "今日行业动态：",
  }[category];
  return `${prefix}${clipped}`;
}

function pickTerms(title = "") {
  const known = [
    "PokerStars",
    "EPT",
    "Monte-Carlo",
    "WSOP",
    "WPT",
    "Triton",
    "APAT",
    "Sky Poker",
    "888poker",
    "GTO Wizard",
    "Timothy Adams",
    "Las Vegas",
    "Main Event",
    "High Roller",
  ];
  return known.filter((term) => title.toLowerCase().includes(term.toLowerCase()));
}

function translateSourceText(value = "") {
  let output = stripHtml(value);
  for (const [pattern, replacement] of phraseDictionary) {
    output = output.replace(pattern, replacement);
  }
  return output.replace(/\s+/g, " ").trim();
}

function trimSentenceEnd(value = "") {
  return value.replace(/[。.!！?？]+$/g, "").trim();
}

function sourceContext(title = "", description = "", category = "新闻动态") {
  const translatedTitle = makeTranslatedHeadline(title, category);
  const translatedDescription = trimSentenceEnd(toChineseDigest(description || title, category));
  if (translatedDescription && translatedDescription !== translatedTitle) {
    return `${translatedTitle}。${translatedDescription}`;
  }
  return translatedTitle;
}

function makeChineseTitle(title, category) {
  const terms = pickTerms(title);
  const subject = terms.slice(0, 3).join(" / ");
  if (category === "策略笔记") {
    if (/deep stack/i.test(title)) return `${subject || "深筹码"}锦标赛策略观察`;
    if (/preflop|range/i.test(title)) return `${subject || "翻前范围"}策略复盘`;
    if (/cash game/i.test(title)) return `${subject || "现金局"}实战策略笔记`;
    return `${subject || "德州扑克"}策略复盘笔记`;
  }
  if (category === "资金管理") return `${subject || "德州扑克"}资金管理与波动控制提醒`;
  if (category === "风险提醒") return `${subject || "德州扑克"}风险识别提醒`;
  if (category === "社区讨论") return `${subject || "扑克社区"}玩家讨论观察`;
  if (category === "赛事新闻") {
    if (/main event/i.test(title)) return `${subject || "扑克"}主赛事最新动态`;
    if (/final table/i.test(title)) return `${subject || "扑克"}决赛桌动态`;
    if (/high roller/i.test(title)) return `${subject || "扑克"}高额赛动态`;
    return subject ? `${subject}赛事动态` : "扑克赛事动态";
  }
  return `${subject || "德州扑克"}行业动态`;
}

function makeTranslatedHeadline(title, category) {
  const clean = stripHtml(title);
  const terms = pickTerms(clean);
  const subject = terms.slice(0, 3).join(" / ");
  if (/ultimate bet scandal/i.test(clean)) return "Ultimate Bet 丑闻回顾：上帝模式、作弊争议与线上扑克信任危机";
  if (/beyond the poker table/i.test(clean)) return "牌桌之外：扑克玩家进入受监管线上娱乐场的合规与风险观察";
  if (/poker mindset/i.test(clean)) return "扑克心态专题：线上牌手如何平衡生活、训练与长期 grind";
  if (/angle shot|misunderstanding|mistaken bet/i.test(clean)) return "争议下注还是误会：一次错误下注引发的实战规则讨论";
  if (/moneymaker.*high-stakes|high-stakes.*moneymaker/i.test(clean)) return "Chris Moneymaker 连续两天高额直播局表现强势，值得复盘波动与选局";
  if (/deeb|hellmuth|bracelet/i.test(clean)) return "WSOP 手链纪录话题升温：Deeb 与 Hellmuth 的竞争继续发酵";
  if (/wins|crowned|captures?|champion|reigns/i.test(clean)) {
    if (/main event/i.test(clean)) return `${subject || "扑克主赛事"}冠军动态：从决赛桌压力看职业牌手决策`;
    if (/high roller|shr/i.test(clean)) return `${subject || "高额赛"}冠军动态：高波动桌况下的筹码与风险管理`;
    return `${subject || "扑克赛事"}冠军动态：中文玩家可关注决赛阶段策略`;
  }
  if (/online casino|regulated/i.test(clean)) return "受监管线上娱乐场趋势：扑克玩家需要关注合规、资金和平台边界";
  if (/bankroll|variance|downswing|buy-in|stop loss/i.test(clean)) return `${subject || "德州扑克"}资金管理观察：买入、止损和波动控制`;
  if (/security|scam|fraud|cheat|bot|collusion|risk/i.test(clean)) return `${subject || "线上扑克"}安全观察：作弊、账号和异常协作风险`;
  if (/strategy|gto|range|preflop|flop|turn|river|solver/i.test(clean)) return `${subject || "德州扑克"}策略翻译整理：范围、位置和下注计划`;
  if (category === "赛事新闻") return `${subject || "扑克赛事"}英文资讯中文整理`;
  if (category === "策略笔记") return `${subject || "德州扑克"}英文策略中文改写`;
  if (category === "风险提醒") return `${subject || "扑克风险"}英文风险内容中文整理`;
  return `${subject || "德州扑克"}英文来源中文编辑整理`;
}

function toChineseDigest(text, category) {
  const clean = stripHtml(text).replace(/\s+/g, " ").trim();
  const terms = pickTerms(clean);
  const subject = terms.slice(0, 3).join("、");
  if (category === "策略笔记") {
    return `${subject || "这篇策略内容"}适合作为复盘材料，重点关注位置、筹码深度、范围选择和下注计划，而不是只看单手牌结果。`;
  }
  if (category === "赛事新闻") {
    return `${subject || "近期扑克赛事"}出现新的赛况变化，适合用来保持行业关注，也可以观察职业牌手在高压阶段的决策方式。`;
  }
  if (category === "资金管理") {
    return `${subject || "这条内容"}提醒玩家把买入、止损和桌级选择写成规则，避免用情绪处理波动。`;
  }
  if (category === "风险提醒") {
    return `${subject || "这条内容"}适合转成风险清单，重点看规则透明度、资金边界和异常行为。`;
  }
  if (category === "社区讨论") {
    return `${subject || "社区讨论"}反映了玩家近期关注的问题，可以作为后续选题和复盘入口。`;
  }
  return `${subject || "扑克行业"}出现值得关注的新动态，适合整理成中文简报并关联站内专题。`;
}

function makeChineseBody(title, description, category) {
  const terms = pickTerms(`${title} ${description}`);
  const subject = terms.slice(0, 3).join("、") || (category === "赛事新闻" ? "相关赛事" : "这条扑克内容");
  const lead = summarize(title, description, category);
  const translated = sourceContext(title, description, category);
  const editorialIntro = `英文来源整理：${translated || subject}。这里不是搬运全文，而是把英文标题和摘要转成适合中文玩家阅读的站内编辑稿，保留主题，重新组织成学习、复盘和风险判断。`;
  const reviewPrompt = `今日复盘问题：如果把这条内容放进自己的牌局记录里，至少要写下三个点：它对应什么场景、我过去有没有类似错误、下一次应该提前设置什么停止条件。`;
  const complianceNote = "边界提醒：本站只做规则学习、策略复盘、风险识别和理性娱乐资料，不组织牌局，不做赌博导流，也不处理充值、提现或代打。";
  const map = {
    策略笔记: [
      `${lead}`,
      editorialIntro,
      `站内解读：${subject}的重点不在于照抄某个结论，而在于把它拆成可复盘的问题：当时的位置如何、有效筹码多深、对手范围怎样变化、下注尺度服务于什么目的。`,
      "对普通玩家来说，更有价值的做法是把类似场景记录下来，复盘自己是否因为牌面刺激、短期输赢或对手形象而偏离原计划。",
      reviewPrompt,
      "延伸阅读建议：先看实战策略栏目，再把相关场景整理进自己的手牌复盘表。",
    ],
    赛事新闻: [
      `${lead}`,
      editorialIntro,
      `站内解读：${subject}这类赛事动态适合观察职业牌手在深筹码、决赛桌或高压奖金结构下的行动倾向。普通玩家不必模仿每个激进动作，但可以学习他们如何控制风险和选择入池时机。`,
      "赛事新闻对学习的价值，不是知道谁赢了，而是借真实赛况提醒自己：位置、筹码量、对手压力和阶段目标，会同时影响一手牌的价值。",
      reviewPrompt,
      "延伸阅读建议：结合实战策略、资金管理和长期盈利思维一起看。",
    ],
    资金管理: [
      `${lead}`,
      editorialIntro,
      `站内解读：${subject}可以提醒我们，德州扑克的长期结果不只由技术决定，也由买入比例、止损纪律和桌级选择共同决定。`,
      "很多亏损不是输在某一手牌，而是输在连续加码、疲劳作战和不愿降级。把规则提前写下来，比临场靠意志力更可靠。",
      "中文编辑建议：把今天看到的内容落到一张表里，记录单次买入、最大亏损、离场时间、是否追损、是否因为桌况不好仍然继续。",
      "延伸阅读建议：查看资金管理栏目，把止损线和复盘字段固定下来。",
    ],
    风险提醒: [
      `${lead}`,
      editorialIntro,
      `站内解读：${subject}适合放进风险识别清单。凡是规则不透明、结算不清楚、资金流向模糊或离场被施压的环境，都应该先暂停。`,
      "风险内容的意义不是制造恐慌，而是提醒玩家把边界问清楚。越是熟人局、娱乐局、私人局，越不能省略规则确认。",
      complianceNote,
      "延伸阅读建议：查看避坑指南和线上安全栏目。",
    ],
    社区讨论: [
      `${lead}`,
      editorialIntro,
      `站内解读：${subject}说明玩家正在关注类似问题。社区内容不一定代表正确答案，但很适合作为复盘素材和选题来源。`,
      "阅读社区讨论时，要区分情绪表达、个案经验和可验证的策略原则。真正有用的是能沉淀成清单、模板和复盘问题的部分。",
      reviewPrompt,
      "延伸阅读建议：把相关问题放入每日更新和会员资料库的后续专题。",
    ],
    新闻动态: [
      `${lead}`,
      editorialIntro,
      `站内解读：${subject}属于行业信息，适合帮助中文玩家快速了解外部动态。`,
      "这类内容不建议只停留在资讯层面，更适合继续追问：它会影响哪些玩家、哪些玩法、哪些风险或哪些学习主题。",
      "中文二创角度：把新闻拆成背景、影响、玩家该看什么、站内该延伸到哪个专题四部分，比单纯追热点更利于长期收录。",
      "延伸阅读建议：根据主题进入专题导航继续阅读。",
    ],
  };
  return map[category] || map["新闻动态"];
}

function whyItMatters(category) {
  return {
    风险提醒: "帮助读者先识别局面和资金风险，再决定是否继续投入时间或资金。",
    资金管理: "适合引导到资金管理和止损模板，强化长期复盘习惯。",
    策略笔记: "可以作为公开导读，引导读者进入实战策略和会员资料库。",
    赛事新闻: "保持网站每日活跃，也能承接德州扑克赛事搜索流量。",
    社区讨论: "能反映玩家正在讨论的问题，适合沉淀成后续选题。",
    新闻动态: "补充行业信息，让每日更新不只停留在站内长文。",
  }[category] || "适合作为今日更新的公开摘要。";
}

async function fetchFeed(source) {
  const response = await fetch(source.url, {
    headers: {
      "user-agent": UA,
      accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
    },
  });
  if (!response.ok) throw new Error(`${source.name}: HTTP ${response.status}`);
  const text = await response.text();
  return parseFeed(text, source);
}

function scoreItem(item) {
  let score = 0;
  const text = `${item.title} ${item.summary_zh}`;
  if (/poker|hold.?em|texas|德州扑克|扑克/i.test(text)) score += 4;
  if (/strategy|gto|range|bankroll|security|risk|wsop|wpt|triton|策略|资金|风险|赛事/i.test(text)) score += 3;
  if (item.category !== "新闻动态") score += 2;
  const ageHours = (Date.now() - new Date(item.published_at).getTime()) / 36e5;
  if (ageHours < 72) score += 2;
  if (ageHours > 24 * 45) score -= 5;
  return score;
}

function dedupe(items) {
  const seen = new Set();
  const titleSeen = new Set();
  const result = [];
  for (const item of items) {
    const titleKey = item.title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, " ").trim();
    if (seen.has(item.url) || titleSeen.has(titleKey)) continue;
    seen.add(item.url);
    titleSeen.add(titleKey);
    result.push(item);
  }
  return result;
}

function selectBalancedItems(items, maxItems) {
  const selected = [];
  const perSource = new Map();
  const sorted = [...items].sort((a, b) => b.score - a.score || new Date(b.published_at) - new Date(a.published_at));

  for (const item of sorted) {
    const count = perSource.get(item.source) || 0;
    if (count >= MAX_ITEMS_PER_SOURCE) continue;
    selected.push(item);
    perSource.set(item.source, count + 1);
    if (selected.length >= maxItems) return selected;
  }

  if (selected.length < maxItems) {
    const selectedIds = new Set(selected.map((item) => item.id));
    for (const item of sorted) {
      if (selectedIds.has(item.id)) continue;
      selected.push(item);
      if (selected.length >= maxItems) break;
    }
  }

  return selected;
}

function escapeHtml(value = "") {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderArticleList(items) {
  return `<div class="article-list">${items
    .map(
      (item) => `<article id="${escapeHtml(item.id)}">
        <span class="pill">${escapeHtml(item.category)}</span>
        <h2>${escapeHtml(item.title_zh || item.title)}</h2>
        <p><strong>英文原题：</strong>${escapeHtml(item.original_title || item.title)}</p>
        <p><strong>中文翻译整理：</strong>${escapeHtml(item.translated_title_zh || translateSourceText(item.title))}</p>
        <p>${escapeHtml(item.summary_zh)}</p>
        ${(item.body_zh || []).slice(1, 7).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
        <a class="text-link" href="${escapeHtml(item.related_page)}">站内延伸</a>
      </article>`,
    )
    .join("")}</div>`;
}

function renderUpdateStrip(items) {
  return `<div class="update-strip">${items
    .slice(0, 3)
    .map(
      (item) => `<article><span>${escapeHtml(item.category)}</span><h3>${escapeHtml(item.title_zh || item.title)}</h3><p>${escapeHtml(item.summary_zh)}</p></article>`,
    )
    .join("")}</div><p class="center"><a class="text-link" href="updates.html">进入每日更新</a></p>`;
}

function renderFeed(items, date) {
  const updated = new Date().toUTCString();
  const itemXml = items
    .map(
      (item) => `<item>
      <title>${escapeHtml(item.title_zh || item.title)}</title>
      <link>${SITE_ORIGIN}/updates.html#${escapeHtml(item.id)}</link>
      <guid isPermaLink="false">${escapeHtml(item.id)}</guid>
      <pubDate>${new Date(item.published_at).toUTCString()}</pubDate>
      <category>${escapeHtml(item.category)}</category>
      <description>${escapeHtml(`${item.summary_zh} ${item.why_it_matters}`)}</description>
    </item>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>winpk99 德州扑克每日更新</title>
    <link>${SITE_ORIGIN}/updates.html</link>
    <description>每日自动汇总德州扑克新闻、策略笔记、赛事动态、风险提醒和站内延伸阅读。</description>
    <language>zh-CN</language>
    <lastBuildDate>${updated}</lastBuildDate>
    <pubDate>${updated}</pubDate>
    <ttl>1440</ttl>
    ${itemXml}
  </channel>
</rss>
`;
}

function replaceFirst(input, pattern, replacement, label) {
  if (!pattern.test(input)) throw new Error(`Cannot find ${label}`);
  return input.replace(pattern, replacement);
}

function renderCrossSiteSection(target, items, date) {
  const picked = items
    .filter((item) => target.categories.includes(item.category))
    .slice(0, target.limit);
  const fallback = picked.length ? picked : items.slice(0, Math.min(target.limit, 5));
  return `<!-- daily-cross-site-start -->
<section class="section daily-cross-site">
  <div class="section-head">
    <p class="eyebrow">${escapeHtml(date)} · 每日自动中文编辑</p>
    <h2>${escapeHtml(target.title)}</h2>
  </div>
  <p class="lead">${escapeHtml(target.subtitle)}。内容来自公开英文 RSS 标题和摘要，本站每天翻译、改写、整理成中文学习笔记，并关联到站内专题。</p>
  <div class="article-list">${fallback
    .map(
      (item) => `<article>
        <span class="pill">${escapeHtml(item.category)}</span>
        <h2>${escapeHtml(item.title_zh || item.title)}</h2>
        <p><strong>英文原题：</strong>${escapeHtml(item.original_title || item.title)}</p>
        <p><strong>中文化处理：</strong>${escapeHtml(item.translated_title_zh || translateSourceText(item.title))}</p>
        <p>${escapeHtml(item.summary_zh)}</p>
        ${(item.body_zh || []).slice(1, 4).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
        <a class="text-link" href="updates.html#${escapeHtml(item.id)}">查看完整每日稿</a>
      </article>`,
    )
    .join("")}</div>
</section>
<!-- daily-cross-site-end -->`;
}

async function updateTargetPage(target, items, date) {
  const html = await readFile(target.file, "utf8");
  const block = renderCrossSiteSection(target, items, date);
  const marker = /<!-- daily-cross-site-start -->[\s\S]*?<!-- daily-cross-site-end -->/;
  const updated = marker.test(html)
    ? html.replace(marker, block)
    : html.replace("</main>", `${block}</main>`);
  await writeFile(target.file, updated);
}

async function updatePages(items, date) {
  const updatesHtml = await readFile("updates.html", "utf8");
  const indexHtml = await readFile("index.html", "utf8");
  const updatedUpdates = replaceFirst(
    updatesHtml,
    /<div class="article-list">[\s\S]*?<\/div>\s*(?=<\/section><\/main>)/,
    renderArticleList(items),
    "updates article list",
  )
    .replace(/<h2>(?:今日内容|\d{4}-\d{2}-\d{2}\s+每日内容)<\/h2>/, `<h2>${date} 每日内容</h2>`)
    .replace(/<p class="lead">[\s\S]*?<\/p>/, `<p class="lead">这里每天自动汇总公开来源的德州扑克新闻、策略笔记、风险提醒和社区讨论，并引导到站内专题继续阅读。</p>`);

  const updatedIndex = replaceFirst(
    indexHtml,
    /<div class="update-strip">[\s\S]*?<p class="center"><a class="text-link" href="updates\.html">进入每日更新<\/a><\/p>/,
    renderUpdateStrip(items),
    "index update strip",
  );

  await writeFile("updates.html", updatedUpdates);
  await writeFile("index.html", updatedIndex);
  await writeFile("feed.xml", renderFeed(items, date));
  for (const target of pageUpdateTargets) {
    await updateTargetPage(target, items, date);
  }
}

async function main() {
  const date = process.env.UPDATE_DATE || todayInSingapore();
  console.log(`Daily update target date: ${date}; generated at ${new Date().toISOString()} UTC.`);
  const sources = JSON.parse(await readFile(SOURCE_FILE, "utf8"));
  const settled = await Promise.allSettled(sources.map(fetchFeed));
  const errors = settled
    .filter((result) => result.status === "rejected")
    .map((result) => result.reason.message);
  const publishableItems = dedupe(settled.flatMap((result) => (result.status === "fulfilled" ? result.value : [])))
    .map((item) => ({ ...item, score: scoreItem(item) }))
    .filter((item) => item.score >= 3)
    .sort((a, b) => b.score - a.score || new Date(b.published_at) - new Date(a.published_at));
  const items = selectBalancedItems(publishableItems, MAX_ITEMS);

  if (!items.length) throw new Error(`No publishable items collected. Errors: ${errors.join("; ")}`);

  await mkdir(ARCHIVE_DIR, { recursive: true });
  const payload = {
    date,
    generated_at: new Date().toISOString(),
    sources: sources.map((source) => source.name),
    errors,
    items,
  };
  await writeFile(`${ARCHIVE_DIR}/${date}.json`, `${JSON.stringify(payload, null, 2)}\n`);
  await writeFile(`${ARCHIVE_DIR}/latest.json`, `${JSON.stringify(payload, null, 2)}\n`);
  await updatePages(items, date);
  console.log(`Updated ${items.length} items for ${date}.`);
  if (errors.length) console.log(`Source errors: ${errors.join(" | ")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
