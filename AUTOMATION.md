# winpk99 每日采集自动更新

这个仓库使用 GitHub Actions 作为定时后台，不需要单独购买服务器。

## 运行时间

- 自动运行：每天新加坡时间 08:00
- 手动运行：GitHub 仓库里的 Actions -> Daily content update -> Run workflow

## 工作流程

1. 读取 `data/sources.json` 里的 RSS 来源。
2. 抓取公开内容的标题、链接、发布时间和摘要。
3. 自动去重、分类、打分。
4. 生成中文导读和站内延伸链接。
5. 更新 `updates.html` 和首页的“今日值得看”。
6. 保存当天归档到 `data/updates/YYYY-MM-DD.json`。
7. 自动提交到 `main`，GitHub Pages 随后发布。

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
```

可选参数：

```bash
MAX_DAILY_ITEMS=8 node scripts/daily-update.mjs
UPDATE_DATE=2026-05-10 node scripts/daily-update.mjs
```

## 注意

当前版本只抓取公开 RSS 摘要和链接，不复制全文。每日更新页展示的是中文导读、来源链接和站内延伸，适合 SEO 和回访，不建议改成全文搬运。
