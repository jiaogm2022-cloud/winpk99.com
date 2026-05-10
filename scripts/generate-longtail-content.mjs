import { mkdir, readFile, writeFile } from "node:fs/promises";

const origin = "https://www.winpk99.com";
const today = "2026-05-10";

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

const coreLinks = [
  ["德州扑克规则", "../beginner-rules-flow.html"],
  ["德州扑克位置", "../beginner-position-basic.html"],
  ["德州扑克底池赔率", "../beginner-pot-odds-basic.html"],
  ["德州扑克为什么总输", "../why-always-lose.html"],
  ["德州扑克资金管理", "../bankroll-management.html"],
  ["线上德州扑克安全", "../online-poker-safety.html"],
  ["德州扑克 GTO", "../glossary/gto.html"],
  ["德州扑克 all in", "../glossary/all-in.html"],
];

const faqTopics = [
  ["straight-rank", "德州扑克顺子大小", "顺子比较先看最高张，A2345 是最小顺，TJQKA 是最大顺。"],
  ["all-in-rule", "德州扑克 all in 规则", "全下后只参与自己能覆盖的底池，其他玩家可能继续形成边池。"],
  ["position-chart", "德州扑克位置图", "位置从小盲、大盲、枪口、中位、劫位、关煞到按钮依次变化。"],
  ["pot-odds", "德州扑克底池赔率怎么算", "用跟注金额除以跟注后总底池，得到需要的最低胜率。"],
  ["always-lose", "德州扑克为什么总输", "常见原因是起手牌过宽、追损、位置感弱、资金管理差和不复盘。"],
  ["bankroll", "德州扑克资金管理", "资金管理要把娱乐预算、单次买入、止损线和降级规则分开。"],
  ["online-safety", "线上德州扑克安全吗", "安全性取决于规则透明、资金记录、账号保护和异常协作处理。"],
  ["gto-meaning", "德州扑克 GTO 是什么意思", "GTO 是接近平衡的理论策略，用来减少被针对性利用。"],
  ["starting-hand", "德州扑克起手牌怎么选", "越靠前位置越紧，越靠后位置越能利用信息优势。"],
  ["hand-rank", "德州扑克牌型大小怎么排", "从高牌、一对、两对、三条、顺子、同花到葫芦、四条、同花顺。"],
  ["button", "德州扑克按钮位怎么玩", "按钮位翻后最后行动，适合扩大开池范围但仍要看盲位反击。"],
  ["big-blind", "德州扑克大盲位怎么防守", "大盲有底池赔率优势，但位置不利，不能所有牌都跟。"],
  ["small-blind", "德州扑克小盲位为什么难打", "小盲位翻后通常先行动，边缘牌容易长期漏钱。"],
  ["cbet", "德州扑克持续下注怎么打", "持续下注要看牌面是否支持翻前进攻者的范围。"],
  ["three-bet", "德州扑克 3bet 是什么意思", "3bet 是面对开池加注后的再加注，用于价值或施压。"],
  ["four-bet", "德州扑克 4bet 范围怎么理解", "4bet 通常代表强价值范围，也可以搭配阻断牌半诈唬。"],
  ["bluff", "德州扑克诈唬什么时候合适", "诈唬需要可信行动线、阻断牌和对手足够弃牌率。"],
  ["value-bet", "德州扑克价值下注怎么判断", "当更差的牌会跟注时，下注才是价值下注。"],
  ["flush-draw", "德州扑克同花听牌怎么算", "同花听牌通常有 9 张补牌，但还要考虑反向隐含赔率。"],
  ["straight-draw", "德州扑克顺子听牌怎么算", "双头顺一般 8 张补牌，卡顺通常 4 张补牌。"],
  ["kicker", "德州扑克踢脚牌是什么", "同牌型比较时，未成对的高牌决定胜负。"],
  ["rake", "德州扑克抽水怎么看", "抽水比例和封顶规则会直接影响长期期望。"],
  ["tilt", "德州扑克上头怎么办", "上头时要靠止损线、时间止损和暂停复盘切断追损。"],
  ["review", "德州扑克手牌怎么复盘", "复盘要记录位置、筹码、行动线、下注尺度、对手类型和情绪。"],
  ["range", "德州扑克范围是什么意思", "范围是一组可能手牌，不是只猜对手某一张牌。"],
  ["ev", "德州扑克 EV 怎么理解", "EV 是长期重复后的平均期望，短期结果不能证明决策好坏。"],
  ["icm", "德州扑克 ICM 是什么意思", "ICM 用于锦标赛奖金权益，不同于现金桌筹码价值。"],
  ["private-club", "德州扑克私人俱乐部靠谱吗", "要看抽水、出金、代理关系、争议处理和离场规则。"],
  ["withdrawal", "德州扑克出金不到账怎么办", "先保存记录、降低投入、整理时间线，再判断是否继续。"],
  ["cheating", "德州扑克怎么防作弊", "重点看规则透明、异常协作、结算记录和是否能安全离场。"],
];

const faqAngles = [
  ["规则解释", "这类问题先看定义，再看例外情况，最后放进实际牌局里判断。"],
  ["新手入门", "新手不要急着背复杂打法，先把这个概念变成可执行清单。"],
  ["实战判断", "实战里要同时考虑位置、筹码深度、对手类型和下注尺度。"],
  ["常见误区", "最常见的错误是只记结论，不记录这个结论成立的前提。"],
  ["计算方法", "涉及计算时，先写出成本、底池和最低需要胜率，不要凭感觉。"],
  ["线下场景", "线下局还要额外看抽水、结算、离场和熟人关系压力。"],
  ["线上场景", "线上场景要把账号、资金记录、平台规则和异常协作一起评估。"],
  ["复盘清单", "复盘时把当时能看到的信息列出来，不要用结果倒推过程。"],
  ["风险提醒", "如果规则不透明或情绪失控，停止扩大投入比继续争一手牌更重要。"],
  ["学习路径", "建议先看基础规则，再看位置和赔率，最后进入范围和 GTO。"],
];

const termConcepts = [
  ["gto", "GTO", "博弈论最优", "接近平衡的理论策略，目标是减少被对手针对性利用。"],
  ["ev", "EV", "期望值", "一个决策长期重复后的平均收益或损失。"],
  ["pot-odds", "Pot Odds", "底池赔率", "跟注成本与跟注后总底池之间的比例。"],
  ["all-in", "All-in", "全下", "投入全部有效筹码，并可能形成主池和边池。"],
  ["position", "Position", "位置", "行动顺序带来的信息优势。"],
  ["button", "Button", "按钮位", "翻后最后行动的位置，信息优势最大。"],
  ["small-blind", "Small Blind", "小盲位", "强制投入小盲且翻后通常位置不利。"],
  ["big-blind", "Big Blind", "大盲位", "已投入大盲，需要结合赔率防守。"],
  ["range", "Range", "手牌范围", "某条行动线中可能持有的一组手牌。"],
  ["blocker", "Blocker", "阻断牌", "自己手牌减少对手持有某些组合的概率。"],
  ["cbet", "C-Bet", "持续下注", "翻前进攻者在翻牌圈继续下注。"],
  ["three-bet", "3-Bet", "再加注", "面对开池加注后的再次加注。"],
  ["four-bet", "4-Bet", "四次下注", "面对 3bet 后继续加注。"],
  ["value-bet", "Value Bet", "价值下注", "希望更差的牌跟注而下注。"],
  ["bluff", "Bluff", "诈唬", "用较弱牌代表强牌，让对手弃掉更好牌。"],
  ["semi-bluff", "Semi-Bluff", "半诈唬", "暂时落后但有补牌潜力的下注。"],
  ["fold-equity", "Fold Equity", "弃牌权益", "下注让对手弃牌带来的收益。"],
  ["equity", "Equity", "胜率权益", "手牌或范围在底池中的理论份额。"],
  ["implied-odds", "Implied Odds", "隐含赔率", "未来可能额外赢到的筹码。"],
  ["reverse-implied-odds", "Reverse Implied Odds", "反向隐含赔率", "后续可能在落后时输更多的风险。"],
  ["spr", "SPR", "筹码底池比", "有效后手与底池大小的比例。"],
  ["rake", "Rake", "抽水", "平台或局方收取的费用。"],
  ["bankroll", "Bankroll", "资金池", "专门用于牌局学习或娱乐的独立预算。"],
  ["stop-loss", "Stop Loss", "止损线", "预先设定的离场条件。"],
  ["tilt", "Tilt", "情绪失衡", "情绪影响判断质量的状态。"],
  ["variance", "Variance", "波动", "短期结果偏离长期期望的幅度。"],
  ["kicker", "Kicker", "踢脚牌", "同牌型比较时决定胜负的高牌。"],
  ["nuts", "Nuts", "坚果牌", "当前牌面下理论最强牌。"],
  ["set", "Set", "暗三条", "手中对子在公共牌击中第三张。"],
  ["trips", "Trips", "明三条", "公共牌成对后手中一张组成三条。"],
  ["flush-draw", "Flush Draw", "同花听牌", "缺一张同花即可成牌。"],
  ["straight-draw", "Straight Draw", "顺子听牌", "缺一张关键牌形成顺子。"],
  ["gutshot", "Gutshot", "卡顺", "需要中间一张牌补齐顺子。"],
  ["oesd", "OESD", "双头顺听牌", "两端任意一端补牌即可成顺。"],
  ["overpair", "Overpair", "超对", "手中对子高于公共牌所有点数。"],
  ["top-pair", "Top Pair", "顶对", "手牌与公共牌最大点数成对。"],
  ["multiway-pot", "Multiway Pot", "多人底池", "三人或更多玩家进入翻后。"],
  ["heads-up", "Heads-Up", "单挑", "只剩两名玩家的对抗。"],
  ["mtt", "MTT", "多人锦标赛", "多人参赛、名次决定奖金的比赛。"],
  ["cash-game", "Cash Game", "现金桌", "筹码直接对应买入单位的牌局。"],
  ["icm", "ICM", "筹码价值模型", "锦标赛中筹码与奖金权益的换算模型。"],
  ["bubble", "Bubble", "泡沫期", "临近奖励圈时的压力阶段。"],
  ["solver", "Solver", "求解器", "分析理论策略和频率的软件工具。"],
  ["hud", "HUD", "数据面板", "显示对手历史数据的工具。"],
  ["rta", "RTA", "实时辅助", "牌局中使用外部工具辅助决策的违规风险。"],
  ["bot", "Bot", "自动化账号", "用程序自动决策的账号风险。"],
  ["collusion", "Collusion", "协作异常", "多个玩家非独立行动的风险。"],
  ["table-selection", "Table Selection", "选桌", "选择适合自己能力和风险边界的桌况。"],
  ["hand-reading", "Hand Reading", "读牌", "根据行动线逐步缩小对手范围。"],
  ["check-raise", "Check-Raise", "过牌加注", "先过牌再面对下注加注。"],
  ["donk-bet", "Donk Bet", "领先下注", "非翻前进攻者率先下注。"],
  ["overbet", "Overbet", "超池下注", "下注额超过当前底池。"],
  ["underbet", "Underbet", "小额下注", "使用较小尺度下注。"],
  ["probe-bet", "Probe Bet", "试探下注", "翻前进攻者放弃后防守方主动下注。"],
  ["barrel", "Barrel", "连续开火", "多条街持续下注施压。"],
  ["thin-value", "Thin Value", "薄价值", "优势很小但仍可能被更差牌支付的下注。"],
  ["table-image", "Table Image", "桌面形象", "对手对你风格的主观印象。"],
  ["live-tell", "Live Tell", "线下身体信号", "线下动作、语言和节奏可能透露的信息。"],
  ["online-tell", "Online Tell", "线上行为信号", "下注时间和尺度模式形成的线索。"],
  ["review", "Review", "手牌复盘", "记录并回看关键决策。"],
];

const termAngles = [
  ["是什么意思", "先理解定义，再看它在翻前、翻后和复盘里的用途。"],
  ["怎么用", "不要把术语当口号，要转成可执行的判断步骤。"],
  ["新手误区", "新手常常只记英文缩写，却忽略位置、筹码和对手范围。"],
  ["实战例子", "用一手常见牌局解释这个概念如何影响下注和跟注。"],
  ["和其他概念的区别", "把相近概念拆开，避免在复盘里混用。"],
];

const questionScenarios = [
  ["straight-size", "德州扑克顺子大小怎么比", "先看顺子的最高张，A2345 只算 5 高顺。"],
  ["all-in-side-pot", "德州扑克 all in 后边池怎么算", "全下玩家只参与自己覆盖的主池，其余筹码形成边池。"],
  ["position-chart-read", "德州扑克位置图怎么看", "从按钮逆时针看小盲、大盲、枪口、中位、劫位、关煞和按钮。"],
  ["pot-odds-call", "德州扑克底池赔率够不够跟注", "把跟注成本换成最低需要胜率，再和手牌权益比较。"],
  ["always-lose-fix", "德州扑克一直输怎么改", "先收紧起手牌、降低桌级、停止追损并开始复盘。"],
  ["bankroll-plan", "德州扑克资金管理怎么做", "设定资金池、单次买入、止损线、时间止损和降级规则。"],
  ["online-safe-check", "线上德州扑克怎么判断安全", "看平台规则、出金记录、账号保护和异常协作处理。"],
  ["gto-learn", "德州扑克 GTO 新手要不要学", "可以学框架，但不要跳过位置、赔率和资金管理。"],
  ["beginner-range", "德州扑克新手怎么理解范围", "范围是一组牌，不是猜对手单一手牌。"],
  ["bad-beat", "德州扑克 bad beat 后怎么办", "先暂停情绪，再复盘决策是否正确。"],
  ["small-blind-leak", "德州扑克小盲位总输钱怎么办", "减少冷跟，更多使用明确的加注或弃牌计划。"],
  ["big-blind-defense", "德州扑克大盲防守太宽怎么办", "用赔率、位置劣势和后续实现权益过滤弱牌。"],
  ["cbet-fail", "德州扑克 cbet 总被跟怎么办", "检查牌面、对手类型和下注尺度是否太机械。"],
  ["bluff-caught", "德州扑克诈唬总被抓怎么办", "减少无阻断牌诈唬，选择更能代表强牌的行动线。"],
  ["value-missed", "德州扑克价值下注不敢打怎么办", "列出会支付的更差牌，再选择合适尺度。"],
  ["river-big-bet", "德州扑克河牌面对大注怎么判断", "看对手价值组合、错过听牌和自己的阻断牌。"],
  ["tilt-control", "德州扑克上头追损怎么停", "用预设止损和离桌动作切断继续投入。"],
  ["rake-high", "德州扑克抽水太高还能打吗", "抽水过高会压缩长期期望，边缘局应直接放弃。"],
  ["private-club-risk", "德州扑克私人俱乐部风险有哪些", "重点看代理、抽水、结算、出金和争议处理。"],
  ["withdraw-delay", "德州扑克出金慢是不是有问题", "出金慢本身不是唯一证据，但必须停止扩大投入并保留记录。"],
  ["collusion-detect", "德州扑克多人配合怎么识别", "看固定组合、异常让牌、同步节奏和多手样本。"],
  ["bot-detect", "线上德州扑克 bot 怎么看", "关注异常稳定的节奏和频率，但不要单手定论。"],
  ["rta-detect", "线上德州扑克 RTA 是什么风险", "实时辅助会破坏公平性，应确认平台工具规则。"],
  ["first-session", "第一次打德州扑克要注意什么", "先确认规则、买入、离场、抽水和复盘记录。"],
  ["hand-rank-confuse", "德州扑克牌型老记混怎么办", "先背顺序，再用常见摊牌例子训练比较。"],
  ["kicker-lost", "德州扑克顶对输给踢脚怎么办", "顶对不是绝对强牌，踢脚和对手范围很关键。"],
  ["flush-draw-price", "德州扑克同花听牌该不该追", "追听牌要看赔率、隐含赔率和是否可能被更大同花压制。"],
  ["straight-draw-price", "德州扑克卡顺要不要跟", "卡顺补牌少，没隐含赔率时不宜硬追。"],
  ["three-bet-facing", "德州扑克面对 3bet 怎么办", "看位置、对手频率、有效筹码和自己的范围位置。"],
  ["four-bet-facing", "德州扑克面对 4bet 怎么办", "先确认对手是否有足够诈唬组合，再决定继续。"],
  ["multiway-strategy", "德州扑克多人底池怎么打", "多人底池诈唬率下降，强牌和坚果听牌更重要。"],
  ["short-stack", "德州扑克短筹码怎么打", "短筹码需要减少投机牌，重视翻前范围和全下边界。"],
  ["deep-stack", "德州扑克深筹码怎么打", "深筹码扩大隐含赔率，也放大反向隐含风险。"],
  ["mtt-icm", "德州扑克锦标赛 ICM 怎么影响决策", "奖励圈和决赛桌阶段筹码价值不再线性。"],
  ["cash-vs-mtt", "德州扑克现金桌和锦标赛区别", "现金桌重视筹码 EV，锦标赛还要看名次权益。"],
  ["solver-use", "德州扑克 solver 怎么学习", "先用它验证范围和尺度，不要直接背答案。"],
  ["hud-stats", "德州扑克 HUD 数据怎么看", "VPIP、PFR、AF 等数据需要样本量支持。"],
  ["table-selection", "德州扑克怎么选桌", "选择规则透明、抽水合理、对手结构适合自己的桌。"],
  ["session-review", "德州扑克一场结束后怎么复盘", "先看是否执行规则，再看关键手牌和情绪波动。"],
  ["long-term-profit", "德州扑克长期盈利靠什么", "靠纪律、选局、资金管理、风险识别和持续复盘。"],
];

const questionModifiers = [
  ["新手版", "先用保守策略降低错误频率，再逐步学习更复杂的范围判断。"],
  ["实战版", "把问题放回位置、筹码深度和对手类型中，不要只看牌面结果。"],
  ["线下局版", "线下还要确认抽水、结算、离场规则和熟人关系压力。"],
  ["线上局版", "线上还要检查账号安全、平台规则、出金记录和异常协作。"],
  ["资金管理版", "任何继续投入的决定，都要先看是否触发止损或降级规则。"],
  ["复盘版", "记录当时信息，再判断选择是否合理，不要用结果倒推。"],
  ["常见误区版", "最大误区是把一次输赢当成长期策略的证明。"],
  ["计算版", "能量化的地方先算成本、底池、权益和最低胜率。"],
  ["风险版", "当环境不透明或情绪失控时，最好的选择往往是停止扩大投入。"],
  ["学习路径版", "先学规则和位置，再学赔率、范围、下注尺度和 GTO。"],
];

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function pageShell({ title, description, body }) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
  <meta name="author" content="winpk99">
  <meta name="language" content="zh-CN">
  <meta name="theme-color" content="#101513">
  <link rel="stylesheet" href="../assets/css/site.css">
</head>
<body>
  <header class="site-header">
    <a class="brand" href="../index.html" aria-label="winpk99 首页">
      <span class="brand-mark">W</span>
      <span><strong>winpk99</strong><small>中文德州扑克资料库</small></span>
    </a>
    <button class="nav-toggle" type="button" aria-label="展开导航" data-nav-toggle>菜单</button>
    <nav class="site-nav" aria-label="主导航" data-nav>${nav.map(([label, href]) => `<a href="${href}">${label}</a>`).join("")}</nav>
  </header>
${body}
  <footer class="site-footer">
    <p>本站定位为德州扑克学习、风险识别与理性复盘资料库，不提供牌局组织、资金撮合、代付代管或代打服务。咨询 QQ：993833。</p>
    <p><a href="../guides.html">专题导航</a><a href="../faq/index.html">FAQ</a><a href="../terms/index.html">长尾词条</a><a href="../questions/index.html">长尾问题</a></p>
  </footer>
  <script src="../assets/js/site.js"></script>
</body>
</html>
`;
}

function hero(kicker, h1, lead) {
  return `<section class="hero compact-hero">
  <div class="hero-copy">
    <p class="eyebrow">${esc(kicker)}</p>
    <h1>${esc(h1)}</h1>
    <p class="lead">${esc(lead)}</p>
    <div class="hero-actions"><a class="btn primary" href="../guides.html">专题导航</a><a class="btn secondary" href="../member-library.html">会员资料</a></div>
  </div>
  <aside class="hero-panel">
    <p class="panel-kicker">长尾收录</p>
    <ol>
      <li>直接回答一个具体搜索问题。</li>
      <li>补充例子、误区和复盘清单。</li>
      <li>用站内链接连接到核心专题。</li>
    </ol>
  </aside>
</section>`;
}

function relatedLinks(seed) {
  return coreLinks
    .map(([label, href], index) => `<a class="text-link" href="${href}">${esc(label)}</a>`)
    .join("");
}

function articleBody({ kicker, title, description, answer, angle, type }) {
  const faq = type === "faq" ? `<section><h2>简短答案</h2><p>${esc(answer)}${esc(angle)}</p></section>` : "";
  return `${hero(kicker, title, description)}
<main class="container">
  <article class="prose">
    ${faq}
    <section>
      <h2>核心解释</h2>
      <p>${esc(description)}在实际牌局中，不能只背一句结论，而要同时看位置、有效筹码、底池大小、对手类型和当前情绪。这样做能把一个搜索问题变成真正可执行的判断流程。</p>
      <p>${esc(answer)}如果涉及规则或计算，建议先写出前提条件；如果涉及安全或资金，建议先确认边界，再决定是否继续投入。</p>
    </section>
    <section>
      <h2>实战例子</h2>
      <p>假设你在一次牌局中遇到这个问题，第一步不是马上跟注、加注或全下，而是问自己：我在什么位置；对手之前的行动代表什么范围；如果我继续投入，后面还有没有清晰计划。这个顺序能减少临场情绪对判断的影响。</p>
      <p>如果是线上环境，还要保留截图、聊天记录和出入金记录；如果是线下环境，还要提前确认抽水、离场和结算规则。策略问题和风险问题经常交织在一起，分开记录会更容易复盘。</p>
    </section>
    <section>
      <h2>常见误区</h2>
      <p>第一，把短期结果当成正确答案。第二，只记术语，不看牌面和范围。第三，在疲劳或追损时继续扩大投入。第四，忽略抽水、平台规则和资金边界。长期学习的重点是减少可重复错误，而不是追求每一手牌都赢。</p>
    </section>
    <section>
      <h2>继续学习</h2>
      <div class="related-links">${relatedLinks(title)}</div>
    </section>
  </article>
</main>`;
}

function meta(file, title, description, keywords, type = "Article") {
  return {
    file,
    path: `/${file}`,
    title: `${title}｜winpk99`,
    name: title,
    description,
    keywords,
    type,
    priority: type === "CollectionPage" ? "0.82" : "0.62",
    changefreq: type === "CollectionPage" ? "weekly" : "monthly",
    generatedAt: today,
    generatedBy: "longtail-v1",
  };
}

function indexPage({ dir, title, description, pages }) {
  const cards = pages
    .slice(0, 240)
    .map((page) => `<a class="card" href="${page.file.split("/").pop()}"><span class="pill">长尾</span><h3>${esc(page.name)}</h3><p>${esc(page.description)}</p></a>`)
    .join("");
  return pageShell({
    title,
    description,
    body: `${hero("长尾内容库", title, description)}
<main class="container">
  <section class="section">
    <div class="section-head"><p class="eyebrow">可收录入口</p><h2>${esc(title)}</h2></div>
    <div class="card-grid">${cards}</div>
  </section>
</main>`,
  });
}

const outputPages = [];

for (const [topicSlug, topicTitle, answer] of faqTopics) {
  for (const [angleIndex, [angleSlug, angle]] of faqAngles.entries()) {
    const title = `${topicTitle}：${angleSlug}`;
    const cleanSlug = `${topicSlug}-${String(angleIndex + 1).padStart(2, "0")}`;
    const file = `faq/${cleanSlug}.html`;
    const description = `${topicTitle} FAQ，围绕${angleSlug}解释规则、计算、实战判断、常见误区和复盘入口。`;
    outputPages.push({
      ...meta(file, title, description, `${topicTitle},德州扑克FAQ,${angleSlug},德州扑克教程`, "FAQPage"),
      html: pageShell({
        title,
        description,
        body: articleBody({ kicker: "FAQ", title, description, answer, angle, type: "faq" }),
      }),
    });
  }
}

for (const [baseSlug, en, cn, answer] of termConcepts) {
  for (const [angleIndex, [angleSlug, angle]] of termAngles.entries()) {
    const title = `德州扑克${cn}（${en}）${angleSlug}`;
    const file = `terms/${baseSlug}-${String(angleIndex + 1).padStart(2, "0")}.html`;
    const description = `解释德州扑克${cn}（${en}）${angleSlug}，包含中文定义、实战例子、常见误区和相关专题入口。`;
    outputPages.push({
      ...meta(file, title, description, `德州扑克${cn},${en},德扑词条,德州扑克术语,${angleSlug}`),
      html: pageShell({
        title,
        description,
        body: articleBody({ kicker: "词条型页面", title, description, answer, angle, type: "term" }),
      }),
    });
  }
}

for (const [scenarioSlug, scenarioTitle, answer] of questionScenarios) {
  for (const [modifierIndex, [modifierSlug, angle]] of questionModifiers.entries()) {
    const title = `${scenarioTitle}（${modifierSlug}）`;
    const file = `questions/${scenarioSlug}-${String(modifierIndex + 1).padStart(2, "0")}.html`;
    const description = `${scenarioTitle}的${modifierSlug}解答，覆盖规则、策略、资金管理、风险识别和复盘方法。`;
    outputPages.push({
      ...meta(file, title, description, `${scenarioTitle},德州扑克长尾问题,${modifierSlug},德州扑克教程`),
      html: pageShell({
        title,
        description,
        body: articleBody({ kicker: "超长尾问题", title, description, answer, angle, type: "question" }),
      }),
    });
  }
}

const exactThousand = outputPages.slice(0, 1000);

for (const dir of ["faq", "terms", "questions"]) await mkdir(dir, { recursive: true });

for (const page of exactThousand) {
  await writeFile(page.file, page.html);
}

const faqPages = exactThousand.filter((page) => page.file.startsWith("faq/"));
const termPages = exactThousand.filter((page) => page.file.startsWith("terms/"));
const questionPages = exactThousand.filter((page) => page.file.startsWith("questions/"));

await writeFile(
  "faq/index.html",
  indexPage({
    dir: "faq",
    title: "德州扑克 FAQ 问答库",
    description: "整理德州扑克规则、all in、顺子大小、位置图、底池赔率、资金管理和线上安全等 FAQ 长尾问题。",
    pages: faqPages,
  }),
);
await writeFile(
  "terms/index.html",
  indexPage({
    dir: "terms",
    title: "德州扑克长尾词条库",
    description: "整理 GTO、EV、底池赔率、all in、位置、范围、资金管理和线上安全等德州扑克中文词条。",
    pages: termPages,
  }),
);
await writeFile(
  "questions/index.html",
  indexPage({
    dir: "questions",
    title: "德州扑克超长尾问题库",
    description: "围绕新手、实战、线下、线上、资金管理和复盘场景整理德州扑克超长尾搜索问题。",
    pages: questionPages,
  }),
);

const generatedPath = "data/generated-pages.json";
const generated = JSON.parse(await readFile(generatedPath, "utf8"));
const preserved = generated.filter((page) => page.generatedBy !== "longtail-v1");
const indexMeta = [
  meta("faq/index.html", "德州扑克 FAQ 问答库", "整理德州扑克规则、all in、顺子大小、位置图、底池赔率、资金管理和线上安全等 FAQ 长尾问题。", "德州扑克FAQ,德州扑克问答,德州扑克规则,德州扑克教程", "CollectionPage"),
  meta("terms/index.html", "德州扑克长尾词条库", "整理 GTO、EV、底池赔率、all in、位置、范围、资金管理和线上安全等德州扑克中文词条。", "德州扑克词条,德州扑克术语,GTO,EV,底池赔率", "CollectionPage"),
  meta("questions/index.html", "德州扑克超长尾问题库", "围绕新手、实战、线下、线上、资金管理和复盘场景整理德州扑克超长尾搜索问题。", "德州扑克长尾问题,德州扑克怎么打,德州扑克技巧,德州扑克安全", "CollectionPage"),
];
const newMeta = exactThousand.map(({ html, ...page }) => page);
await writeFile(generatedPath, `${JSON.stringify([...preserved, ...indexMeta, ...newMeta], null, 2)}\n`);

const hub = `<section class="section longtail-hub">
  <div class="section-head">
    <p class="eyebrow">长尾搜索入口</p>
    <h2>FAQ、词条和超长尾问题库</h2>
  </div>
  <div class="card-grid">
    <a class="card" href="faq/index.html"><span class="pill">FAQ</span><h3>德州扑克 FAQ 问答库</h3><p>顺子大小、all in 规则、位置图、底池赔率、资金管理和线上安全等问答。</p></a>
    <a class="card" href="terms/index.html"><span class="pill">词条</span><h3>德州扑克长尾词条库</h3><p>GTO、EV、范围、位置、all in、底池赔率、资金管理等中文解释。</p></a>
    <a class="card" href="questions/index.html"><span class="pill">长尾</span><h3>德州扑克超长尾问题库</h3><p>按新手、实战、线下、线上、计算、复盘和风险场景组织搜索问题。</p></a>
  </div>
</section>`;

const guides = await readFile("guides.html", "utf8");
if (!guides.includes("longtail-hub")) {
  await writeFile("guides.html", guides.replace("</main>", `${hub}</main>`));
}

console.log(`Generated ${exactThousand.length} long-tail pages plus 3 index pages.`);
