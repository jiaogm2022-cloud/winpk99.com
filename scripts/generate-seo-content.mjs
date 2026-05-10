import { mkdir, writeFile } from "node:fs/promises";

const siteName = "winpk99";
const today = new Date().toISOString().slice(0, 10);

const nav = [
  ["首页", "../index.html"],
  ["专题导航", "../guides.html"],
  ["每日更新", "../updates.html"],
  ["新手入门", "../beginner-guide.html"],
  ["实战策略", "../strategy.html"],
  ["资金管理", "../bankroll-management.html"],
  ["避坑指南", "../offline-game-risk.html"],
  ["线上安全", "../online-poker-safety.html"],
  ["会员资料库", "../member-library.html"],
  ["会员方案", "../membership.html"],
];

const terms = [
  ["gto", "GTO", "博弈论最优", "用接近平衡的范围和频率做决策，降低被针对性利用的空间。"],
  ["ev", "EV", "期望值", "把一次决策在长期重复后的平均结果量化，重点看过程质量而不是单次结果。"],
  ["equity", "Equity", "胜率权益", "当前手牌或范围在摊牌前相对底池拥有的理论份额。"],
  ["pot-odds", "Pot Odds", "底池赔率", "用跟注成本和底池规模比较，判断继续投入是否合理。"],
  ["implied-odds", "Implied Odds", "隐含赔率", "考虑未来街可能赢到的额外筹码，而不是只看当前底池。"],
  ["reverse-implied-odds", "Reverse Implied Odds", "反向隐含赔率", "看似便宜跟注，但后续可能在落后时损失更多。"],
  ["three-bet", "3-Bet", "再加注", "面对开池加注后的第二次主动加注，常用于价值压榨或范围施压。"],
  ["four-bet", "4-Bet", "四次下注", "面对 3-Bet 后继续加注，通常代表更强范围或明确的阻断牌计划。"],
  ["c-bet", "C-Bet", "持续下注", "翻前进攻者在翻牌圈继续下注，用范围优势或牌面优势施压。"],
  ["check-raise", "Check-Raise", "过牌加注", "先过牌诱导对手下注，再加注改变底池压力。"],
  ["donk-bet", "Donk Bet", "领先下注", "非翻前进攻者在下一街率先下注，常用于特定牌面或对手倾向。"],
  ["value-bet", "Value Bet", "价值下注", "认为会被较差牌支付时下注，核心是找准对手可跟注范围。"],
  ["bluff", "Bluff", "诈唬", "用较弱牌代表强范围，目标是让对手弃掉更好牌。"],
  ["semi-bluff", "Semi-Bluff", "半诈唬", "下注时暂时不领先，但拥有后续改良成强牌的可能。"],
  ["range", "Range", "手牌范围", "对手或自己在某个行动线中可能持有的一组手牌。"],
  ["polarized-range", "Polarized Range", "两极化范围", "主要由强价值牌和诈唬牌组成，中等强度牌较少。"],
  ["linear-range", "Linear Range", "线性范围", "从最强牌开始向下连续选择的一组手牌。"],
  ["blocker", "Blocker", "阻断牌", "自己持有的牌减少对手持有某些强牌组合的可能。"],
  ["nut-advantage", "Nut Advantage", "坚果优势", "某一方在最强牌组合数量上更占优。"],
  ["range-advantage", "Range Advantage", "范围优势", "整体范围在某个牌面上的平均强度更高。"],
  ["spr", "SPR", "筹码底池比", "有效后手与底池的比例，用来判断承诺程度和下注空间。"],
  ["stack-depth", "Stack Depth", "筹码深度", "以大盲为单位衡量后手深浅，直接影响起手牌和翻后计划。"],
  ["effective-stack", "Effective Stack", "有效筹码", "一手牌中双方真正能投入的最大筹码量。"],
  ["position", "Position", "位置", "行动顺序带来的信息优势，后位通常更容易控制底池。"],
  ["button", "Button", "庄位", "翻后最后行动的位置，天然拥有最高信息优势。"],
  ["small-blind", "Small Blind", "小盲位", "强制投入半个盲注且翻后通常位置不利。"],
  ["big-blind", "Big Blind", "大盲位", "已投入完整盲注，防守频率需要结合底池赔率和对手范围。"],
  ["under-the-gun", "UTG", "枪口位", "翻前最早行动的位置，通常需要更紧的开池范围。"],
  ["cutoff", "Cutoff", "关煞位", "按钮右侧位置，适合用较宽范围争夺位置和盲注。"],
  ["hijack", "Hijack", "劫位", "中后位过渡位置，范围宽度通常介于中位和关煞位之间。"],
  ["limp", "Limp", "平跟入池", "只跟大盲进入底池，容易暴露范围并给后手加注空间。"],
  ["isolation-raise", "Isolation Raise", "隔离加注", "面对平跟者加注，争取单挑并获得主动权。"],
  ["squeeze", "Squeeze", "挤压加注", "有人加注且有人跟注后再加注，利用夹心压力制造弃牌率。"],
  ["cold-call", "Cold Call", "冷跟注", "尚未投入筹码时直接跟注他人的加注。"],
  ["open-raise", "Open Raise", "率先加注", "无人入池时主动加注进入底池。"],
  ["flat-call", "Flat Call", "平跟", "面对加注选择跟注而不是再加注。"],
  ["all-in", "All-in", "全下", "投入全部有效筹码，决策需要结合范围、权益和风险边界。"],
  ["fold-equity", "Fold Equity", "弃牌权益", "下注让对手弃牌所带来的额外收益。"],
  ["showdown-value", "Showdown Value", "摊牌价值", "手牌不一定强到下注，但有机会在摊牌时胜出。"],
  ["variance", "Variance", "波动", "短期结果偏离长期期望的幅度，需要用资金管理承接。"],
  ["bankroll", "Bankroll", "资金池", "专门用于牌局学习或娱乐预算的独立资金边界。"],
  ["stop-loss", "Stop Loss", "止损线", "预先设定的离场条件，避免情绪推动风险扩大。"],
  ["tilt", "Tilt", "情绪失衡", "因输赢、压力或疲劳导致判断质量下降。"],
  ["table-selection", "Table Selection", "选桌", "选择更适合自己能力和风险承受力的桌况。"],
  ["rake", "Rake", "抽水", "平台或局方从底池中收取的费用，会明显影响长期期望。"],
  ["icm", "ICM", "筹码价值模型", "锦标赛中筹码与奖金权益并非线性对应的模型。"],
  ["bubble", "Bubble", "泡沫期", "临近奖励圈时，筹码压力和弃牌权益显著变化。"],
  ["final-table", "Final Table", "决赛桌", "锦标赛最后阶段，ICM、位置和筹码分布更加关键。"],
  ["mtt", "MTT", "多人锦标赛", "多人同时参赛、名次决定奖金结构的比赛形式。"],
  ["cash-game", "Cash Game", "现金桌", "筹码直接对应买入单位，离场和补码规则与锦标赛不同。"],
  ["sit-and-go", "Sit and Go", "单桌锦标赛", "人数坐满即开赛的小型锦标赛结构。"],
  ["heads-up", "Heads-Up", "单挑", "只剩两名玩家时的对抗，范围和频率都明显变宽。"],
  ["multiway-pot", "Multiway Pot", "多人底池", "三人或更多人进入翻后，单人权益和诈唬成功率下降。"],
  ["dry-board", "Dry Board", "干燥牌面", "听牌较少、连接性弱的公共牌结构。"],
  ["wet-board", "Wet Board", "湿润牌面", "连接和同花可能较多，权益变化更快。"],
  ["paired-board", "Paired Board", "对子牌面", "公共牌出现对子，葫芦和 trips 组合需要重新评估。"],
  ["monotone-board", "Monotone Board", "单花牌面", "翻牌三张同花，阻断牌和同花结构非常重要。"],
  ["rainbow-board", "Rainbow Board", "彩虹牌面", "翻牌三种花色，直接同花听牌不存在。"],
  ["backdoor-draw", "Backdoor Draw", "后门听牌", "需要连续两街补到特定牌才能成牌的潜力。"],
  ["flush-draw", "Flush Draw", "同花听牌", "缺一张同花即可成同花的牌型潜力。"],
  ["straight-draw", "Straight Draw", "顺子听牌", "缺一张关键牌即可形成顺子的潜力。"],
  ["gutshot", "Gutshot", "卡顺听牌", "需要中间某张牌补齐顺子，outs 通常较少。"],
  ["open-ended-straight-draw", "OESD", "双头顺听牌", "两端任意一端补牌都能成顺。"],
  ["top-pair", "Top Pair", "顶对", "手牌与公共牌最大点数成对。"],
  ["overpair", "Overpair", "超对", "手中对子高于公共牌所有点数。"],
  ["two-pair", "Two Pair", "两对", "由手牌和公共牌组成两个对子。"],
  ["set", "Set", "暗三条", "手中对子在公共牌中击中第三张。"],
  ["trips", "Trips", "明三条", "公共牌成对后，手中一张牌组成三条。"],
  ["full-house", "Full House", "葫芦", "三条加一对的强牌结构。"],
  ["kicker", "Kicker", "边牌", "同牌型比较时用于决定胜负的高牌。"],
  ["nuts", "Nuts", "坚果牌", "当前牌面下理论最强的牌。"],
  ["air", "Air", "空气牌", "几乎没有摊牌价值和成牌潜力的弱牌。"],
  ["slow-play", "Slow Play", "慢打", "强牌选择弱化行动，诱导对手继续投入。"],
  ["protection-bet", "Protection Bet", "保护下注", "用下注降低对手免费实现权益的机会。"],
  ["thin-value", "Thin Value", "薄价值", "优势较小但仍可能被更差牌支付的下注。"],
  ["overbet", "Overbet", "超池下注", "下注额超过当前底池，常用于极化范围。"],
  ["underbet", "Underbet", "小额下注", "使用较小尺度完成保护、诱导或范围下注。"],
  ["probe-bet", "Probe Bet", "试探下注", "翻前进攻者放弃持续下注后，防守方在下一街主动下注。"],
  ["delayed-c-bet", "Delayed C-Bet", "延迟持续下注", "翻牌过牌后，在转牌继续代表范围优势。"],
  ["float", "Float", "漂浮跟注", "用较弱牌跟注一街，计划后续利用对手放弃时拿下底池。"],
  ["barrel", "Barrel", "连续开火", "在多条街持续下注施压。"],
  ["triple-barrel", "Triple Barrel", "三枪下注", "翻牌、转牌、河牌连续下注，通常代表强极化计划。"],
  ["check-call", "Check-Call", "过牌跟注", "先过牌后跟注，常用于控制底池或保留对手诈唬。"],
  ["check-fold", "Check-Fold", "过牌弃牌", "面对下注放弃手牌。"],
  ["check-back", "Check Back", "后位过牌", "后位选择不下注，保留摊牌价值或控制底池。"],
  ["lead", "Lead", "主动领先下注", "在某条街率先下注，打破原有进攻顺序。"],
  ["capped-range", "Capped Range", "封顶范围", "由于之前行动，某方很少拥有最强牌组合。"],
  ["uncapped-range", "Uncapped Range", "未封顶范围", "行动线中仍保留最强牌组合的可能。"],
  ["mdf", "MDF", "最低防守频率", "理论上面对下注需要防守的最低比例，避免被任意下注利用。"],
  ["exploitative-play", "Exploitative Play", "剥削打法", "根据对手漏洞调整策略，主动偏离平衡频率。"],
  ["solver", "Solver", "求解器", "用于分析理论策略、频率和下注尺度的软件工具。"],
  ["node-locking", "Node Locking", "节点锁定", "在求解器中固定某些对手行为，观察剥削调整。"],
  ["hand-reading", "Hand Reading", "读牌", "根据行动线、位置和牌面逐步缩小对手范围。"],
  ["leveling", "Leveling", "层级博弈", "围绕“我知道你知道”的心理推演。"],
  ["table-image", "Table Image", "桌面形象", "对手对你风格的主观判断，会影响他们的跟注和加注频率。"],
  ["live-tell", "Live Tell", "线下身体信号", "线下牌局中下注节奏、动作和语言可能透露的信息。"],
  ["online-tell", "Online Tell", "线上行为信号", "下注时间、尺度模式和频率变化形成的线上线索。"],
  ["collusion", "Collusion", "协作异常", "多个账号或玩家非独立行动，破坏公平性的风险。"],
  ["bot", "Bot", "自动化账号", "使用程序自动决策的账号风险。"],
  ["rta", "RTA", "实时辅助", "牌局进行中使用外部工具辅助决策的违规风险。"],
  ["hud", "HUD", "数据面板", "显示对手历史数据的辅助工具，需要遵守平台规则。"],
  ["vpip", "VPIP", "主动入池率", "玩家自愿投入筹码进入底池的比例。"],
  ["pfr", "PFR", "翻前加注率", "玩家翻前主动加注的比例。"],
  ["af", "AF", "攻击系数", "衡量下注和加注相对跟注的激进程度。"],
  ["wtsd", "WTSD", "摊牌率", "进入翻后后走到摊牌的比例。"],
  ["wwsf", "WWSF", "翻后赢池率", "看翻牌后最终赢得底池的比例。"],
  ["leak", "Leak", "策略漏洞", "长期重复出现、会损害期望值的习惯性问题。"],
  ["review", "Review", "手牌复盘", "记录行动线并回看关键决策，寻找可重复改进点。"],
];

const riskPages = [
  ["withdrawal-safety", "德州扑克出金风险与资金边界检查", "出金延迟、流水要求、账号风控和资金边界的检查清单。", "出金不是单纯到账问题，而是规则透明度、记录完整性和风险承受力的综合判断。"],
  ["private-club-safety", "私人俱乐部靠谱吗：加入前的安全检查", "围绕私人俱乐部准入、抽水、群内承诺、代理关系和离场规则做风险识别。", "越是熟人推荐，越需要把规则写清楚；越是承诺稳定结果，越要降低信任权重。"],
  ["collusion-signals", "德扑协作异常怎么识别：多人配合的常见信号", "从异常挤压、让牌节奏、摊牌结构和同桌关系识别协作风险。", "协作异常通常不是单手牌能证明，而是多个样本中出现不自然的一致性。"],
  ["offline-game-cheating-signals", "线下局作弊手段与风险提示", "线下局暗号、换牌、欠条局、抽水不透明和离场压力的避坑指南。", "线下安全的核心不是猜对每个细节，而是避免进入规则不可验证的环境。"],
  ["platform-reliability-checklist", "德州扑克平台靠谱吗：不要只看宣传语", "从规则公示、客服响应、历史记录、争议处理和工具限制评估平台可靠性。", "可靠平台必须允许用户理解规则、保留记录并在争议中获得清晰解释。"],
  ["account-security", "线上德州扑克账号安全与设备边界", "账号密码、二次验证、设备登录、聊天链接和资料权限的安全清单。", "账号安全不是技术细节，而是避免资金、身份和社交关系被同时暴露。"],
  ["private-game-red-flags", "陌生人约局与熟人局的高风险信号", "识别陌生人约局、熟人担保、欠条、催促入局和情绪施压。", "真正安全的局不会害怕你提前问清规则，也不会催你在不了解风险时入场。"],
  ["rake-and-fee-risk", "抽水规则怎么看：长期期望的隐形成本", "解释抽水比例、封顶规则、服务费和隐性费用如何影响长期复盘。", "即使技术判断正确，过高抽水也会压缩长期期望，必须在入局前确认。"],
];

const reviews = [
  ["2026-05-10", "按钮位", "AJs", "面对大盲强力反弹如何控制底池"],
  ["2026-05-09", "关煞位", "99", "翻牌低面遇到过牌加注的范围推演"],
  ["2026-05-08", "大盲位", "KQo", "防守后在湿润牌面如何处理持续下注"],
  ["2026-05-07", "枪口位", "AQs", "深筹码下被 3-Bet 后的计划选择"],
  ["2026-05-06", "小盲位", "TT", "多人底池中超对的保护与放弃边界"],
  ["2026-05-05", "按钮位", "76s", "半诈唬转牌继续开火是否合理"],
  ["2026-05-04", "中位", "KJs", "顶对中踢脚面对河牌大注的复盘"],
  ["2026-05-03", "大盲位", "A5s", "阻断牌在河牌诈唬中的实际作用"],
  ["2026-05-02", "关煞位", "QQ", "单花翻牌面对领先下注的行动线"],
  ["2026-05-01", "按钮位", "54s", "后门权益转化为转牌下注计划"],
  ["2026-04-30", "劫位", "AKo", "翻前 4-Bet 后 SPR 降低的承诺判断"],
  ["2026-04-29", "大盲位", "JTs", "多人底池听牌的底池赔率与隐含赔率"],
];

const coreLinks = [
  ["新手入门", "../beginner-guide.html"],
  ["实战策略", "../strategy.html"],
  ["资金管理", "../bankroll-management.html"],
  ["避坑指南", "../offline-game-risk.html"],
  ["线上安全", "../online-poker-safety.html"],
];

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pageShell({ title, description, body, active = "", root = "../" }) {
  const css = `${root}assets/css/site.css`;
  const js = `${root}assets/js/site.js`;
  const navHtml = nav
    .map(([label, href]) => `<a href="${href}"${active === label ? ' class="active"' : ""}>${label}</a>`)
    .join("");
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
  <meta name="theme-color" content="#101513">
  <link rel="stylesheet" href="${css}">
</head>
<body>
  <header class="site-header">
    <a class="brand" href="${root}index.html" aria-label="winpk99 首页">
      <span class="brand-mark">W</span>
      <span><strong>winpk99</strong><small>中文德州扑克资料库</small></span>
    </a>
    <button class="nav-toggle" type="button" aria-label="展开导航" data-nav-toggle>菜单</button>
    <nav class="site-nav" aria-label="主导航" data-nav>${navHtml}</nav>
  </header>
${body}
  <footer class="site-footer">
    <p>本站定位为德州扑克学习、风险识别与理性复盘资料库，不提供牌局组织、资金撮合、代付代管或代打服务。咨询 QQ：993833。</p>
    <p><a href="${root}guides.html">专题导航</a><a href="${root}glossary/index.html">德扑百科</a><a href="${root}reviews/index.html">免费复盘</a><a href="${root}downloads/2026-live-poker-safety-guide.html">安全手册</a></p>
  </footer>
  <script src="${js}"></script>
</body>
</html>
`;
}

function hero(kicker, h1, lead, action = "") {
  return `<section class="hero compact-hero">
  <div class="hero-copy">
    <p class="eyebrow">${esc(kicker)}</p>
    <h1>${esc(h1)}</h1>
    <p class="lead">${esc(lead)}</p>
    ${action}
  </div>
  <aside class="hero-panel">
    <p class="panel-kicker">收录逻辑</p>
    <ol>
      <li>中文解释概念，降低新手理解门槛。</li>
      <li>每页保留相关内链，方便爬虫继续发现页面。</li>
      <li>避免夸张承诺，重点放在逻辑推演和风险控制。</li>
    </ol>
  </aside>
</section>`;
}

function relatedTerms(index) {
  return [1, 7, 13, 21]
    .map((offset) => terms[(index + offset) % terms.length])
    .map(([slug, en, cn]) => `<a class="text-link" href="${slug}.html">${esc(cn)}（${esc(en)}）</a>`)
    .join("");
}

function termArticle(term, index) {
  const [slug, en, cn, summary] = term;
  const title = `${cn}（${en}）是什么意思｜德州扑克中文百科`;
  const description = `解释德州扑克术语 ${cn}（${en}）的含义、实战例子、常见误区和相关学习入口。`;
  const body = `${hero("德州扑克中文百科", `${cn}（${en}）`, description)}
<main class="container">
  <article class="prose">
    <section>
      <h2>${esc(cn)}的核心含义</h2>
      <p>${esc(summary)}在复盘中，这个概念不应该被当成口号，而要放回位置、筹码深度、公共牌结构和对手范围里判断。新手常见问题是只记住英文缩写，却没有把它变成可执行的行动流程。</p>
      <p>更稳妥的学习方式是先问三个问题：当前底池和有效筹码是多少；我的范围在这张牌面上是否有优势；如果对手继续施压，我准备在哪些转牌或河牌继续防守。这样可以把 ${esc(cn)} 从单个术语变成复盘框架。</p>
    </section>
    <section>
      <h2>简单实战例子</h2>
      <p>假设你在后位进入底池，翻牌后面对一次下注。不要只看自己手牌强弱，而要同时估算对手的价值牌、听牌和可能放弃的空气牌。如果 ${esc(cn)} 与底池赔率、范围优势或阻断牌有关，就需要把这些因素写进复盘表，而不是凭感觉跟注或加注。</p>
      <p>例如在干燥 A 高牌面，翻前进攻者通常拥有更多强 A 组合；在低张连接牌面，大盲防守范围可能有更多两对、暗三条和顺子听牌。相同的 ${esc(en)} 概念，在不同牌面下会给出完全不同的行动建议。</p>
    </section>
    <section>
      <h2>常见误区</h2>
      <p>第一，不要把单手牌结果当作概念是否正确的证明。第二，不要在缺少样本时过度解读对手。第三，不要忽略抽水、疲劳和资金边界。德州扑克学习的目标是提升决策质量，而不是追逐短期波动。</p>
      <div class="related-links"><strong>继续学习：</strong>${relatedTerms(index)}${coreLinks.map(([label, href]) => `<a class="text-link" href="${href}">${label}</a>`).join("")}</div>
    </section>
  </article>
</main>`;
  return {
    file: `glossary/${slug}.html`,
    path: `/glossary/${slug}.html`,
    title,
    name: `${cn}（${en}）`,
    description,
    keywords: `德州扑克${cn},${en},德扑术语,德州扑克百科,德州扑克中文解释,${cn}是什么意思`,
    type: "Article",
    priority: "0.72",
    changefreq: "monthly",
    html: pageShell({ title, description, body, active: "专题导航" }),
  };
}

function riskArticle(page) {
  const [slug, title, description, thesis] = page;
  const body = `${hero("避坑长尾专题", title, description)}
<main class="container">
  <article class="prose">
    <section>
      <h2>先看规则透明度</h2>
      <p>${esc(thesis)}所有涉及资金、账号和线下见面的场景，都应该先确认规则是否可复述、可截图、可追溯。只靠口头承诺、群内暗示或熟人担保，风险权重都要上调。</p>
      <p>建议记录三件事：入局规则、费用结构、争议处理方式。任何一项不能说清楚，都不适合继续扩大投入。</p>
    </section>
    <section>
      <h2>高风险信号</h2>
      <ul>
        <li>催促立即决定，不给你核对规则和退出条件的时间。</li>
        <li>把风险说成“大家都这样”，却无法提供明确的书面说明。</li>
        <li>出现金钱借贷、欠条、代付、代管账号或要求共享登录信息。</li>
        <li>牌局节奏、下注尺度和多人行动长期呈现不自然一致性。</li>
      </ul>
    </section>
    <section>
      <h2>更稳妥的处理方式</h2>
      <p>把预算独立出来，设置单日止损和时间止损；保留聊天记录、规则截图和资金记录；发现异常时先降低参与度，不要用加大投入的方式验证判断。理性复盘比情绪追赶更重要。</p>
      <div class="related-links"><strong>相关页面：</strong><a class="text-link" href="../online-poker-safety.html">线上安全</a><a class="text-link" href="../offline-game-risk.html">避坑指南</a><a class="text-link" href="../bankroll-management.html">资金管理</a><a class="text-link" href="../downloads/2026-live-poker-safety-guide.html">安全手册下载</a></div>
    </section>
  </article>
</main>`;
  return {
    file: `risk/${slug}.html`,
    path: `/risk/${slug}.html`,
    title: `${title}｜winpk99 风险识别`,
    name: title,
    description,
    keywords: `${title},德州扑克避坑,德州扑克风险,德州扑克出金,德州扑克防骗,线上德州扑克安全`,
    type: "Article",
    priority: "0.78",
    changefreq: "monthly",
    html: pageShell({ title, description, body, active: "避坑指南" }),
  };
}

function reviewArticle(review) {
  const [date, position, hand, theme] = review;
  const slug = `${date}-${position}-${hand}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const title = `${date} 实战复盘：在${position}拿到${hand}如何应对强力反弹？`;
  const description = `免费德州扑克手牌复盘笔记：${position} ${hand}，围绕位置、范围、底池赔率和风险边界做逻辑推演。`;
  const body = `${hero("免费复盘笔记", title, description)}
<main class="container">
  <article class="prose">
    <section>
      <h2>牌局信息</h2>
      <div class="table-wrap"><table>
        <thead><tr><th>项目</th><th>记录</th><th>复盘重点</th></tr></thead>
        <tbody>
          <tr><td>位置</td><td>${esc(position)}</td><td>行动顺序与信息优势</td></tr>
          <tr><td>手牌</td><td>${esc(hand)}</td><td>范围强度与阻断牌</td></tr>
          <tr><td>主题</td><td>${esc(theme)}</td><td>下注计划和放弃边界</td></tr>
          <tr><td>建议记录</td><td>盲注、有效筹码、底池大小</td><td>避免只凭结果评价决策</td></tr>
        </tbody>
      </table></div>
    </section>
    <section>
      <h2>行动线推演</h2>
      <p>翻前先确认开池范围是否过宽，面对反弹时再比较位置、有效筹码和对手倾向。如果后续 SPR 偏低，很多中等强度牌不适合进入含糊的跟注线；如果 SPR 仍深，则需要提前规划哪些牌面继续防守，哪些牌面主动放弃。</p>
      <p>翻后重点不是寻找“标准答案”，而是记录自己当时的理由：下注是为了价值、保护、弃牌权益，还是为了控制底池。理由越清楚，复盘越容易发现长期漏洞。</p>
    </section>
    <section>
      <h2>复盘结论</h2>
      <p>这手牌更适合用范围和底池赔率复盘，而不是用输赢评价。若对手强力反弹来自紧范围，继续扩大底池需要更强权益；若对手反弹频率偏高，可以保留部分阻断牌组合进入后续计划。</p>
      <div class="related-links"><strong>延伸阅读：</strong><a class="text-link" href="../glossary/range.html">手牌范围</a><a class="text-link" href="../glossary/pot-odds.html">底池赔率</a><a class="text-link" href="../glossary/spr.html">SPR</a><a class="text-link" href="../strategy.html">实战策略</a></div>
    </section>
  </article>
</main>`;
  return {
    file: `reviews/${slug}.html`,
    path: `/reviews/${slug}.html`,
    title: `${title}｜德州扑克免费复盘`,
    name: title,
    description,
    keywords: `德州扑克复盘,${position}${hand},德州扑克手牌分析,德州扑克实战复盘,德州扑克策略`,
    type: "Article",
    priority: "0.76",
    changefreq: "monthly",
    html: pageShell({ title, description, body, active: "每日更新" }),
  };
}

function glossaryIndex(termPages) {
  const cards = termPages
    .map((page) => `<a class="card term-card" href="${page.file.replace("glossary/", "")}"><span class="pill">词条</span><h3>${esc(page.name)}</h3><p>${esc(page.description)}</p></a>`)
    .join("");
  const title = "德州扑克中文百科｜100 个 GTO、EV、底池赔率与实战术语";
  const description = "winpk99 德州扑克中文百科，整理 100 个常用术语词条，覆盖 GTO、EV、范围、位置、资金管理、线上安全和复盘概念。";
  const body = `${hero("Topical Authority", "德州扑克中文百科", description, '<div class="hero-actions"><a class="btn primary" href="../downloads/2026-live-poker-safety-guide.html">下载安全手册</a><a class="btn secondary" href="../reviews/index.html">看免费复盘</a></div>')}
<main class="container">
  <section class="section">
    <div class="section-head"><p class="eyebrow">可收录词条库</p><h2>100 个核心术语</h2></div>
    <div class="card-grid wiki-grid">${cards}</div>
  </section>
</main>`;
  return {
    file: "glossary/index.html",
    path: "/glossary/",
    title,
    name: "德州扑克中文百科",
    description,
    keywords: "德州扑克百科,德扑术语,GTO,EV,底池赔率,德州扑克中文词条,德州扑克教程",
    type: "CollectionPage",
    priority: "0.9",
    changefreq: "weekly",
    html: pageShell({ title, description, body, active: "专题导航" }),
  };
}

function reviewIndex(reviewPages) {
  const cards = reviewPages
    .map((page) => `<a class="card" href="${page.file.replace("reviews/", "")}"><span class="pill">复盘</span><h3>${esc(page.name)}</h3><p>${esc(page.description)}</p></a>`)
    .join("");
  const title = "德州扑克免费复盘笔记｜每日手牌逻辑推演";
  const description = "按日期整理免费德州扑克手牌复盘，使用位置、手牌、底池、行动线和风险边界做中文策略笔记。";
  const body = `${hero("持续抓取栏目", "德州扑克免费复盘笔记", description)}
<main class="container">
  <section class="section">
    <div class="section-head"><p class="eyebrow">手牌复盘</p><h2>近期公开复盘</h2></div>
    <div class="article-list">${cards}</div>
  </section>
</main>`;
  return {
    file: "reviews/index.html",
    path: "/reviews/",
    title,
    name: "德州扑克免费复盘笔记",
    description,
    keywords: "德州扑克复盘,德州扑克手牌分析,德州扑克每日复盘,德州扑克策略笔记",
    type: "CollectionPage",
    priority: "0.86",
    changefreq: "daily",
    html: pageShell({ title, description, body, active: "每日更新" }),
  };
}

function riskIndex(riskArticlePages) {
  const cards = riskArticlePages
    .map((page) => `<a class="card" href="${page.file.replace("risk/", "")}"><span class="pill">避坑</span><h3>${esc(page.name)}</h3><p>${esc(page.description)}</p></a>`)
    .join("");
  const title = "德州扑克避坑长尾专题｜出金、平台、线下局与账号安全";
  const description = "面向中文搜索的德州扑克风险识别专题，覆盖出金、私人俱乐部、协作异常、线下局、抽水和账号安全。";
  const body = `${hero("风险识别中心", "德州扑克避坑长尾专题", description)}
<main class="container">
  <section class="section">
    <div class="section-head"><p class="eyebrow">高信任内容</p><h2>风险专题</h2></div>
    <div class="card-grid">${cards}</div>
  </section>
</main>`;
  return {
    file: "risk/index.html",
    path: "/risk/",
    title,
    name: "德州扑克避坑长尾专题",
    description,
    keywords: "德州扑克避坑,德州扑克出金,德州扑克平台靠谱吗,私人俱乐部风险,德州扑克作弊手段",
    type: "CollectionPage",
    priority: "0.88",
    changefreq: "weekly",
    html: pageShell({ title, description, body, active: "避坑指南" }),
  };
}

function downloadPage() {
  const title = "2026 德州扑克线下安全避坑手册下载｜PDF";
  const description = "免费下载 winpk99 2026 德州扑克线下安全避坑手册，覆盖约局、抽水、出金、账号、协作异常和离场边界。";
  const body = `${hero("PDF 下载落地页", "2026 德州扑克线下安全避坑手册", description, '<div class="hero-actions"><a class="btn primary" href="2026-live-poker-safety-guide.pdf">下载 PDF</a><a class="btn secondary" href="../risk/">查看避坑专题</a></div>')}
<main class="container">
  <article class="prose">
    <section class="download-panel">
      <h2>手册包含什么</h2>
      <ul>
        <li>线下约局前的规则确认清单。</li>
        <li>抽水、欠条、代管账号和陌生人邀约的风险边界。</li>
        <li>线上账号、设备、聊天链接和出金记录的安全习惯。</li>
        <li>异常协作、暗号、节奏一致性和离场压力的识别方法。</li>
      </ul>
      <p>这份资料定位为安全教育与风险识别，不提供牌局组织、资金交易或任何导流服务。</p>
    </section>
    <section>
      <h2>相关免费内容</h2>
      <div class="related-links"><a class="text-link" href="../risk/withdrawal-safety.html">出金风险</a><a class="text-link" href="../risk/offline-game-cheating-signals.html">线下局作弊风险</a><a class="text-link" href="../risk/private-club-safety.html">私人俱乐部检查</a><a class="text-link" href="../bankroll-management.html">资金管理</a></div>
    </section>
  </article>
</main>`;
  return {
    file: "downloads/2026-live-poker-safety-guide.html",
    path: "/downloads/2026-live-poker-safety-guide.html",
    title,
    name: "2026 德州扑克线下安全避坑手册",
    description,
    keywords: "德州扑克安全手册,德州扑克避坑PDF,德州扑克线下局风险,德州扑克防骗,德州扑克出金风险",
    type: "Article",
    priority: "0.82",
    changefreq: "monthly",
    html: pageShell({ title, description, body, active: "避坑指南" }),
  };
}

function pdfEscape(value) {
  return value.replace(/[()\\]/g, "\\$&");
}

async function writePdf() {
  const lines = [
    "WINPK99 2026 POKER SAFETY GUIDE",
    "Chinese landing page: https://www.winpk99.com/downloads/2026-live-poker-safety-guide.html",
    "",
    "Checklist:",
    "1. Confirm rules, rake, exit conditions and dispute process before joining.",
    "2. Keep bankroll separate and set daily stop-loss and time limits.",
    "3. Avoid debt notes, shared accounts, proxy payments and unclear custody.",
    "4. Watch for repeated collusion signals across multiple hands, not one result.",
    "5. Save records, screenshots and hand histories for later review.",
    "",
    "This material is for education, risk control and logical review only.",
  ];
  const stream = `BT /F1 13 Tf 50 780 Td 16 TL ${lines.map((line) => `(${pdfEscape(line)}) Tj T*`).join(" ")} ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];
  let body = "%PDF-1.4\n";
  const offsets = [0];
  for (let i = 0; i < objects.length; i += 1) {
    offsets.push(Buffer.byteLength(body));
    body += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(body);
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  body += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  body += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  await writeFile("downloads/2026-live-poker-safety-guide.pdf", body);
}

await Promise.all(["glossary", "risk", "reviews", "downloads", "data"].map((dir) => mkdir(dir, { recursive: true })));

const termPages = terms.map(termArticle);
const riskArticlePages = riskPages.map(riskArticle);
const reviewPages = reviews.map(reviewArticle);
const pages = [
  glossaryIndex(termPages),
  ...termPages,
  riskIndex(riskArticlePages),
  ...riskArticlePages,
  reviewIndex(reviewPages),
  ...reviewPages,
  downloadPage(),
];

for (const page of pages) {
  await writeFile(page.file, page.html);
}

await writePdf();
await writeFile(
  "data/generated-pages.json",
  `${JSON.stringify(
    pages.map(({ html, ...page }) => ({ ...page, generatedAt: today })),
    null,
    2,
  )}\n`,
);

console.log(`Generated ${pages.length} SEO pages from ${terms.length} glossary terms, ${riskPages.length} risk topics and ${reviews.length} reviews.`);
