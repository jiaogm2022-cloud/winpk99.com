import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";

const SITE_ORIGIN = "https://www.winpk99.com";
const MAX_ITEMS = Number(process.env.MAX_DAILY_ITEMS || 30);
const MAX_ITEMS_PER_SOURCE = Number(process.env.MAX_ITEMS_PER_SOURCE || 8);
const LONG_FORM_ITEMS = Number(process.env.LONG_FORM_ITEMS || 10);
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

function topicAngle(title = "", description = "", category = "新闻动态") {
  const text = `${title} ${description}`.toLowerCase();
  if (/first[- ]?timer|first time|casino/.test(text)) {
    return {
      scene: "第一次进入赌场或陌生牌局时，玩家最容易被环境节奏带走：筹码、座位、规则、服务人员提示和其他玩家动作同时出现，如果没有提前准备，很容易把注意力放在输赢上，而忽略真正该确认的边界。",
      action: "更稳妥的做法，是先把买入、离场时间、是否接受重买、桌上礼仪和结算方式写清楚。新手可以少打几手，多观察按钮位移动、盲注变化、摊牌顺序和发牌员处理争议的方式。",
      pitfall: "最常见的错误，是把“不好意思问”当成礼貌。德州扑克里，规则不清、筹码不清、口头承诺不清，后面都会变成成本。",
    };
  }
  if (/chip distribution|blind structure|home poker|hosting/.test(text)) {
    return {
      scene: "家庭局或小型锦标赛看似轻松，真正影响体验的往往不是牌技，而是筹码分配、盲注结构、重买规则、休息时间和结算口径是否提前统一。",
      action: "开局前应该先公布起始筹码、盲注级别、升盲时间、是否允许 add-on、何时停止重买，以及剩余玩家如何分钱。规则越简单，执行越稳定。",
      pitfall: "很多争议不是有人故意占便宜，而是主办者一开始没有把规则写成所有人都能确认的版本。",
    };
  }
  if (/tell|tells|live tell|body language/.test(text)) {
    return {
      scene: "现场读牌不是看一个动作就下结论，而是把下注线、牌面结构、玩家习惯和身体信号放在一起验证。动作只是一条辅助信息，不能替代范围判断。",
      action: "记录 tells 时要写具体场景：他在什么位置、面对什么下注、停顿多久、最后摊牌是什么。只有反复出现的模式，才值得放进决策。",
      pitfall: "新手最容易把“看起来紧张”解读成弱，把“说话很自然”解读成强。单次表情没有稳定价值，样本才有。",
    };
  }
  if (/commentator|voice of|podcast|interview/.test(text)) {
    return {
      scene: "解说、采访和节目变化本身不是策略手牌，但它们能反映扑克内容生态的变化：观众关注什么、赛事如何包装、职业牌手怎样被公众理解。",
      action: "读这类内容时，可以把重点放在传播角度：哪些概念被反复解释，哪些赛事节点最能吸引普通玩家，哪些错误理解需要站内内容补足。",
      pitfall: "如果只把它当名人动态，很快就看完了；如果拆成内容选题，它能反过来帮助网站完善新手解释和赛事导读。",
    };
  }
  if (/main event|final table|champion|wins|crowned|bracelet|wsop|ept|wpt|triton|high roller|series/.test(text)) {
    return {
      scene: "大型赛事新闻的价值，不只是知道谁夺冠或谁进了决赛桌，而是观察筹码压力、奖金阶梯、桌上形象和阶段目标如何改变一手牌的真实价值。",
      action: "中文玩家读赛事动态时，可以把它拆成三层：赛制和奖金结构、关键玩家的筹码位置、决赛阶段可能出现的压力点。这样读，新闻才会变成复盘材料。",
      pitfall: "不要只模仿冠军的激进动作。职业牌手的动作背后通常有筹码、对手、赛事阶段和长期经验支撑，普通局面照搬反而会扩大波动。",
    };
  }
  if (/ultimate bet|scandal|god mode|cheat|collusion|bot|rta|security|fraud|scam|withdraw|ban/.test(text)) {
    return {
      scene: "风险新闻最值得看的部分，是它暴露了哪些信任环节：平台权限、账号安全、资金托管、异常协作、出金流程和事后追责。",
      action: "把这类内容转成检查清单：平台是否公开规则，资金是否可追溯，争议是否有处理流程，账号工具边界是否明确，异常局面是否能及时离开。",
      pitfall: "风险内容不是为了制造恐慌，而是提醒玩家不要把信任建立在口头承诺上。越是熟人介绍，越要把边界写明白。",
    };
  }
  if (/bankroll|variance|downswing|high-stakes|stake|buy-in|stop loss/.test(text)) {
    return {
      scene: "资金管理类内容提醒我们，同样一手牌在不同资金状态下会产生完全不同的心理压力。桌级过高时，技术动作会被金额本身扭曲。",
      action: "读完后应该落到表格：单次买入占总资金比例、当天最大亏损、最长游戏时间、是否允许升降级、何时必须离场。",
      pitfall: "最大的资金管理错误，不是某一手牌打错，而是在状态下降后继续扩大底池，用下一手牌修复上一手牌的情绪。",
    };
  }
  if (/mindset|tilt|balance|life|grind/.test(text)) {
    return {
      scene: "心态内容看似软，实际上直接影响执行质量。疲劳、追损、过度自信和连续挫败都会改变玩家对风险的感知。",
      action: "可以把心态管理写成牌局前、中、后的流程：开局确认状态，中途检查情绪和桌况，结束后复盘决策而不是只复盘输赢。",
      pitfall: "很多人以为自己缺的是高级策略，实际缺的是停止按钮。没有停止规则，再好的策略也会在情绪里变形。",
    };
  }
  return {
    scene: `${category}类内容适合当成每日复盘入口，而不是简单扫一眼标题。它可以帮助读者把外部信息转成自己的学习问题、风险问题和站内阅读路径。`,
    action: "阅读时先抓主题，再问它和自己的牌局有什么关系：是规则问题、范围问题、资金问题，还是平台和环境问题。能落到清单里的内容，才值得收藏。",
    pitfall: "不要为了追热点而追热点。真正有长期价值的每日更新，应该能让读者明天回到牌桌或复盘表时少犯一个具体错误。",
  };
}

function makeLongFormSections(title, description, category, subject, lead, editorialIntro, reviewPrompt, complianceNote) {
  const angle = topicAngle(title, description, category);
  const commonClosing = [
    "站内使用方式：如果你是新手，先把这篇当成问题清单；如果你已经有固定牌局，就把它和自己的最近 3 手关键牌对照；如果你负责内容选题，则可以把它拆成后续专题、术语页和会员资料库模板。",
    "本站边界：所有内容只用于规则学习、策略复盘、风险识别和理性娱乐资料整理；不组织牌局，不提供充值、提现、代打、带局或任何赌博导流服务。",
  ];
  const maps = {
    策略笔记: [
      editorialIntro,
      `背景拆解：${angle.scene}`,
      `中文玩家真正要看的，不是原文里某个漂亮结论，而是它能不能帮助自己把一手牌拆成位置、有效筹码、对手范围、牌面结构和下注目的。${subject}如果只停留在“学到了一个说法”，价值很有限；如果能变成复盘表里的固定字段，才会持续产生作用。`,
      `策略重点一：先还原场景。你在前位还是后位，底池是单加注还是 3-Bet，当前 SPR 是否已经让一对牌接近承诺，这些信息比“我拿了什么牌”更先决定行动范围。`,
      "策略重点二：下注必须有目标。价值下注要知道哪些更差牌会跟，诈唬下注要知道哪些更好牌会弃，保护下注要知道免费牌会给对手多少权益。说不出目标的下注，通常只是情绪动作。",
      `执行建议：${angle.action}`,
      `常见误区：${angle.pitfall}`,
      "复盘模板：记录翻前位置、有效筹码、公共牌结构、每街下注尺度、对手类型、自己的即时理由，以及事后是否仍认可当时的理由。不要只写结果，因为结果会让人高估赢牌、低估好弃牌。",
      reviewPrompt,
      "延伸阅读建议：先进入实战策略栏目，把同类场景放到位置、范围、下注尺度和河牌决策专题里一起看。",
      ...commonClosing,
    ],
    赛事新闻: [
      editorialIntro,
      `赛事背景：${angle.scene}`,
      `这类新闻表面上是结果更新，深一层看是决策压力的样本库。${subject}涉及的不是单纯谁赢谁输，而是玩家在不同筹码深度、不同奖金压力、不同桌上形象下如何选择保守、施压或等待。`,
      "第一层看赛制：主赛事、边赛、高额赛和线上系列赛的风险结构不同。买入、盲注速度、参赛人数和奖金分布，会影响玩家愿意承担多大波动。",
      "第二层看筹码：大筹码可以施压，但也要避免无意义地翻倍短码；短筹码要寻找 fold equity，但不能把每一次行动都变成赌命。中筹码最容易尴尬，需要更重视位置和对手。",
      "第三层看阶段：接近钱圈、决赛桌、冠军争夺和普通中期完全不是同一种游戏。赛事新闻真正值得收藏的部分，是它提醒你阶段目标会改变牌力价值。",
      `中文读法：${angle.action}`,
      `不要照搬：${angle.pitfall}`,
      "复盘落点：挑一条赛事动态，写下你会如何处理同样阶段的三种牌：强价值牌、中等摊牌价值、带阻断的诈唬候选。只看冠军动作，不做这个拆解，读完很快就忘。",
      reviewPrompt,
      "延伸阅读建议：结合实战策略、资金管理和长期盈利思维一起看，尤其关注决赛桌压力和筹码深度变化。",
      ...commonClosing,
    ],
    资金管理: [
      editorialIntro,
      `资金背景：${angle.scene}`,
      `资金管理不是保守玩家的借口，而是让策略能长期执行的基础设施。${subject}提醒我们，技术判断和资金压力总是绑在一起：当金额超过承受区间，正确弃牌会变难，正确跟注也会变形。`,
      "先定总边界：把扑克预算和生活资金分开，单次买入占比要低到足够承受波动。只要需要靠下一局翻本来修复现金流，就已经不是健康的学习状态。",
      "再定单日边界：最大亏损、最长时长、最多重买次数和强制离场条件都应提前写好。临场再决定，往往会被输赢和面子牵着走。",
      "还要定降级规则：连续亏损、状态下降、桌况变差或金额开始影响判断时，降级不是认输，而是保留学习和复盘的资格。",
      `执行建议：${angle.action}`,
      `常见误区：${angle.pitfall}`,
      "复盘字段：日期、桌级、总买入、最大回撤、最大领先、是否追损、是否疲劳、是否按计划离场、最大一手牌是否符合资金规则。连续记录两周，漏洞会比凭感觉清楚得多。",
      "给普通玩家的提醒：真正的长期盈利不是每次都赢，而是在下风期仍然能按计划行动，在上风期也不盲目升级。",
      "延伸阅读建议：查看资金管理栏目，把止损线、降级规则和复盘字段固定下来。",
      ...commonClosing,
    ],
    风险提醒: [
      editorialIntro,
      `风险背景：${angle.scene}`,
      `风险提醒类内容的价值，是把模糊的不安变成可以提前确认的问题。${subject}如果只被当成故事，很快就过去；如果被写成入场前检查清单，就能减少很多后续争议。`,
      "第一项看规则：盲注、抽水、重买、离场、结算、争议处理是否提前说明。凡是需要事后解释的规则，都有变成纠纷的可能。",
      "第二项看资金：资金交给谁、何时结算、是否允许欠账、是否有第三方担保、是否能留下记录。越是口头承诺，越要谨慎。",
      "第三项看环境：是否有人施压加码、是否有人替别人做决定、是否存在异常默契、是否拒绝公开规则。任何一个信号出现，都应该降低投入或直接离开。",
      `执行建议：${angle.action}`,
      `常见误区：${angle.pitfall}`,
      complianceNote,
      "实用清单：进场前问规则，坐下前定买入，游戏中记录异常，结算时核对明细，离场后保留沟通记录。不要等问题发生后才开始补证据。",
      "延伸阅读建议：查看避坑指南和线上安全栏目，把风险识别拆成线下局、线上平台、私人俱乐部、账号工具和资金结算几个专题。",
      ...commonClosing,
    ],
    社区讨论: [
      editorialIntro,
      `讨论背景：${angle.scene}`,
      `社区内容的优点是接近真实玩家困惑，缺点是答案质量参差不齐。${subject}适合作为选题入口，但不能直接当成标准答案。`,
      "阅读时先分三类：情绪表达、个人经验、可验证原则。情绪表达可以理解玩家痛点，个人经验可以提供案例，可验证原则才适合写进站内教程。",
      "如果讨论涉及策略，要回到位置、范围、筹码和牌面；如果涉及风险，要回到规则、资金、平台和证据；如果涉及心态，要回到停止条件和复盘流程。",
      `执行建议：${angle.action}`,
      `常见误区：${angle.pitfall}`,
      "编辑处理方式：把一个社区问题改写成中文长文时，应保留问题本身，删掉无效争吵，补上场景拆解、判断流程、行动清单和站内延伸。",
      reviewPrompt,
      "延伸阅读建议：把相关问题放入每日更新和会员资料库的后续专题，尤其适合沉淀成 FAQ 和复盘模板。",
      ...commonClosing,
    ],
    新闻动态: [
      editorialIntro,
      `行业背景：${angle.scene}`,
      `行业动态不应该只是快讯。${subject}需要被拆成背景、影响、玩家该看什么、网站可以延伸什么四个部分。`,
      "先看影响对象：它影响赛事玩家、线上玩家、新手玩家，还是内容学习者。不同对象关心的不是同一件事。",
      "再看风险和机会：有些动态适合补充术语解释，有些适合做风险提醒，有些适合引导到资金管理或策略栏目。",
      `执行建议：${angle.action}`,
      `常见误区：${angle.pitfall}`,
      "中文二创角度：不要把英文标题硬翻译完就结束，而要给中文读者一个明确入口，让他知道这条动态为什么值得看、看完应该做什么。",
      "延伸阅读建议：根据主题进入专题导航继续阅读，并把相关概念补充到术语页和 FAQ。",
      ...commonClosing,
    ],
  };
  return maps[category] || maps["新闻动态"];
}

function makeChineseBody(title, description, category) {
  const terms = pickTerms(`${title} ${description}`);
  const subject = terms.slice(0, 3).join("、") || (category === "赛事新闻" ? "相关赛事" : "这条扑克内容");
  const lead = summarize(title, description, category);
  const translated = sourceContext(title, description, category);
  const editorialIntro = `英文来源整理：${translated || subject}。这里不是搬运全文，而是把英文标题和摘要转成适合中文玩家阅读的站内编辑稿，保留主题，重新组织成学习、复盘和风险判断。`;
  const reviewPrompt = `今日复盘问题：如果把这条内容放进自己的牌局记录里，至少要写下三个点：它对应什么场景、我过去有没有类似错误、下一次应该提前设置什么停止条件。`;
  const complianceNote = "边界提醒：本站只做规则学习、策略复盘、风险识别和理性娱乐资料，不组织牌局，不做赌博导流，也不处理充值、提现或代打。";
  return makeLongFormSections(title, description, category, subject, lead, editorialIntro, reviewPrompt, complianceNote);
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
        <span class="pill">${item.content_type === "longform" ? "长文" : "简讯"}</span>
        <h2>${escapeHtml(item.title_zh || item.title)}</h2>
        <p><strong>英文原题：</strong>${escapeHtml(item.original_title || item.title)}</p>
        <p><strong>中文翻译整理：</strong>${escapeHtml(item.translated_title_zh || translateSourceText(item.title))}</p>
        <p>${escapeHtml(item.summary_zh)}</p>
        ${(item.body_zh || []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
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
        <span class="pill">${item.content_type === "longform" ? "长文" : "简讯"}</span>
        <h2>${escapeHtml(item.title_zh || item.title)}</h2>
        <p><strong>英文原题：</strong>${escapeHtml(item.original_title || item.title)}</p>
        <p><strong>中文化处理：</strong>${escapeHtml(item.translated_title_zh || translateSourceText(item.title))}</p>
        <p>${escapeHtml(item.summary_zh)}</p>
        ${(item.body_zh || []).slice(0, 4).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
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
    .replace(/<p class="lead">[\s\S]*?<\/p>/, `<p class="lead">这里每天抓取 30 条公开来源的德州扑克新闻、策略笔记、风险提醒和社区讨论，其中 10 条整理成长文中文导读，其余内容保留轻量摘要，并引导到站内专题继续阅读。</p>`);

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
  const items = selectBalancedItems(publishableItems, MAX_ITEMS).map((item, index) => {
    const isLongForm = index < LONG_FORM_ITEMS;
    return {
      ...item,
      content_type: isLongForm ? "longform" : "brief",
      body_zh: isLongForm ? item.body_zh : (item.body_zh || []).slice(0, 3),
    };
  });

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
