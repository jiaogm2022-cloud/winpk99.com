# winpk99 每日采集自动更新

这个仓库使用 GitHub Actions 作为定时后台，不需要单独购买服务器。

## 运行时间

- 自动运行：每天新加坡时间 08:00
- 手动运行：GitHub 仓库里的 Actions -> Daily content update -> Run workflow

## 工作流程

1. 读取 `data/sources.json` 里的 RSS 来源。
2. 抓取公开内容的标题、链接、发布时间和摘要。
3. 自动去重、分类、打分。
4. 对英文标题和摘要做中文翻译、编辑改写和二创导读，不直接搬运外站全文。
5. 每天抓取 30 条内容，其中前 10 条生成长文形式的站内中文标题、中文导读、英文原题、中文化处理、背景拆解、执行清单、常见误区、复盘问题和风险边界提醒，其余 20 条保留轻量摘要。
6. 更新 `updates.html`、首页的“今日值得看”，并同步更新 `guides.html`、`beginner-guide.html`、`strategy.html`、`bankroll-management.html`、`offline-game-risk.html`、`online-poker-safety.html` 的每日中文编辑模块。
7. 保存当天归档到 `data/updates/YYYY-MM-DD.json`。
8. 刷新 SEO 标题、描述、结构化数据和 `sitemap.xml`。
9. 自动提交到 `main`，GitHub Pages 随后发布。
10. 通过 IndexNow 通知 Bing/IndexNow 支持的搜索引擎页面已更新。

## 调整采集源

编辑 `data/sources.json`，新增来源格式：

```json
{
  "name": "来源名称",
  "url": "https://example.com/feed/",
  "type": "rss",
  "categoryHint": "策略笔记"
}
```

`categoryHint` 可以使用：

- 新闻动态
- 赛事新闻
- 策略笔记
- 风险提醒
- 资金管理
- 社区讨论

## 本地测试

```bash
node scripts/daily-update.mjs
node scripts/seo-optimize.mjs
```

可选参数：

```bash
MAX_DAILY_ITEMS=8 node scripts/daily-update.mjs
MAX_DAILY_ITEMS=30 MAX_ITEMS_PER_SOURCE=8 LONG_FORM_ITEMS=10 node scripts/daily-update.mjs
UPDATE_DATE=2026-05-10 node scripts/daily-update.mjs
```

## 注意

当前版本只抓取公开 RSS 摘要和链接，不复制全文。每日更新页展示的是站内中文长文改写、中文导读和站内延伸，不放外站跳转链接。原始来源 URL 只保存在 `data/updates/*.json` 里，方便后台追溯和人工核查。
