import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";

const SITE_ORIGIN = "https://www.winpk99.com";
const MAX_ITEMS = Number(process.env.MAX_DAILY_ITEMS || 6);
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
  赛事新闻: "updates.html",
  社区讨论: "updates.html",
  新闻动态: "updates.html",
};

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
  return {
    id,
    title: item.title,
    source: item.source,
    url,
    category,
    summary_zh: summarize(item.title, item.description, category),
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
  const clipped = sentence.length > 120 ? `${sentence.slice(0, 118)}...` : sentence;
  const prefix = {
    风险提醒: "这条内容适合当作风险检查提醒：",
    资金管理: "这条内容和资金边界、波动控制有关：",
    策略笔记: "这条内容可以转成一条策略复盘笔记：",
    赛事新闻: "这条内容属于赛事和行业动态：",
    社区讨论: "这条内容来自社区讨论，适合观察玩家关注点：",
    新闻动态: "这条内容属于扑克行业动态：",
  }[category];
  return `${prefix}${clipped}`;
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
      (item) => `<article>
        <span class="pill">${escapeHtml(item.category)}</span>
        <h2>${escapeHtml(item.title)}</h2>
        <p>${escapeHtml(item.summary_zh)}</p>
        <p>${escapeHtml(item.why_it_matters)}</p>
        <p class="source-line">来源：<a class="text-link" href="${escapeHtml(item.url)}" rel="nofollow noopener" target="_blank">${escapeHtml(item.source)}</a></p>
        <a class="text-link" href="${escapeHtml(item.related_page)}">站内延伸</a>
      </article>`,
    )
    .join("")}</div>`;
}

function renderUpdateStrip(items) {
  return `<div class="update-strip">${items
    .slice(0, 3)
    .map(
      (item) => `<article><span>${escapeHtml(item.category)}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.summary_zh)}</p></article>`,
    )
    .join("")}</div><p class="center"><a class="text-link" href="updates.html">进入每日更新</a></p>`;
}

function replaceFirst(input, pattern, replacement, label) {
  if (!pattern.test(input)) throw new Error(`Cannot find ${label}`);
  return input.replace(pattern, replacement);
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
    .replace(/<h2>今日内容<\/h2>/, `<h2>${date} 每日内容</h2>`)
    .replace(/<p class="lead">[\s\S]*?<\/p>/, `<p class="lead">这里每天自动汇总公开来源的德州扑克新闻、策略笔记、风险提醒和社区讨论，并引导到站内专题继续阅读。</p>`);

  const updatedIndex = replaceFirst(
    indexHtml,
    /<div class="update-strip">[\s\S]*?<p class="center"><a class="text-link" href="updates\.html">进入每日更新<\/a><\/p>/,
    renderUpdateStrip(items),
    "index update strip",
  );

  await writeFile("updates.html", updatedUpdates);
  await writeFile("index.html", updatedIndex);
}

async function main() {
  const date = process.env.UPDATE_DATE || todayInSingapore();
  const sources = JSON.parse(await readFile(SOURCE_FILE, "utf8"));
  const settled = await Promise.allSettled(sources.map(fetchFeed));
  const errors = settled
    .filter((result) => result.status === "rejected")
    .map((result) => result.reason.message);
  const items = dedupe(settled.flatMap((result) => (result.status === "fulfilled" ? result.value : [])))
    .map((item) => ({ ...item, score: scoreItem(item) }))
    .filter((item) => item.score >= 3)
    .sort((a, b) => b.score - a.score || new Date(b.published_at) - new Date(a.published_at))
    .slice(0, MAX_ITEMS);

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
