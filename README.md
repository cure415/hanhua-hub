# 复古汉化发布台 · 使用与维护说明

> 把散落在 B站、论坛、资讯站与 GitHub 的旧主机游戏中文汉化发布，收进同一张可筛选、可检索、可导出的可视化索引。
> 纯静态、零后端、零第三方依赖。**只索引发布者的原始页面，不存储或分发 ROM / ISO / 网盘补丁。**

文档对应版本：2026-11-28 同步版（合并云端 4 次定时抓取，并上线本地两版迭代）。当前索引 **857 条**（人工整理 122 + 自动抓取 735）、**31 个平台**、**8 个自动数据源**、**11 个 GitHub 监控仓库**、**22 个人工登记来源**。

> 本版已同步到 GitHub 并部署 Pages。新增「网盘渠道情报」——从来源页文本里识别百度网盘 / 夸克网盘渠道并支持筛选，只记录渠道名，不采集链接、提取码、文件名或文件列表；以及「数据修正台」——用独立覆盖层做体检、纠错、批量修正与备份回滚，见方式 F。

---

## 一、为什么会有这个项目

调研过 GitHub 与中文社区后，结论是：**没有**一个「覆盖多平台、持续跟踪最新中文汉化发布、带可视化界面 + 下载链接」的现成聚合项目。最接近的各有缺口：

| 现成项目 / 站点 | 做到哪一步 | 缺什么 |
| --- | --- | --- |
| `nanL/RetroGamesZH` | 目前最全的中文复古汉化总表，一张巨型 Markdown 表（SYS / CRC / NAME / LANG / MAKE / NOTE） | 无网页界面、无下载链接、无「最新发布」时间视图 |
| `freefrank/CN_Patches` + `cn.dotslash.pro` | README 表格列游戏 / 平台 / Release / 说明页，补丁在 Releases | 单作者补丁库，不是社区聚合 |
| `mariovirgili/WonderSwanColor-AI_Translation` | 每日自动镜像 + 浏览器里按 CRC32 匹配补丁，可视化做得最好 | 仅 WSC 一个平台，且是英译不是中文汉化 |
| `RetroAchievements/RAPatches` | 按机种目录存放补丁 | 英译为主，近年基本停更 |
| `dat.emugif.com` 模拟游戏中文数据站 | 有机种浏览、搜索、排序、DAT 下载 | 偏 ROM 目录管理，不是「最新发布流」 |

中文汉化的一手发布绝大多数在 B站每日「汉化情报汇总」、全游网「汉化情报」栏目、A9VG / Stage1st / 游戏年代 GO / 全机种社区的论坛长帖与网盘里，GitHub 上多是「一个游戏一个仓库」。**缺的不是数据，是把多源发布动态结构化再统一可视化的那一层** —— 本项目补的就是这一层。

---

## 二、快速开始

### 打开就能用

| 方式 | 文件 | 适用 |
| --- | --- | --- |
| 离线 / 转发 | `index-standalone.html` | 样式、脚本、数据全部内联，双击即开，不依赖同目录其他文件 |
| 源码版 | `index.html` | 需与 `styles.css`、`data.js`、`auto-data.js`、`app.js` 放在一起；便于改代码 |
| 在线 | GitHub Pages | 部署后 Actions 每天两次自动更新数据并重新发布 |

浏览页面**不需要任何运行时或联网**（只有「同步 Release」按钮会联网请求 GitHub 公开 API）。抓取与构建脚本需要 **Node.js ≥ 18**，且无 `npm install` 步骤（`dependencies` 为空）。

### 命令速查

```bash
npm test          # 离线自测（81 项，纯本地样本，无需联网）
npm run check     # 检查全部 JS 文件语法
npm run fetch     # 抓取并写回数据
npm run build     # 重新打包 index-standalone.html
npm run update    # 自测 → 抓取 → 打包，一条命令完成本地更新

npm run editor    # 启动数据修正台 → http://127.0.0.1:8787/editor.html
npm run apply-fixes -- <补丁.json>   # 离线应用修正台导出的补丁
npm run apply-fixes -- --list        # 列出可回滚备份
npm run apply-fixes -- --reset       # 清空全部修正，回到原始快照
```

---

## 三、主要功能

| 区块 | 功能 |
| --- | --- |
| **总览** | 4 个 KPI（收录条目 / 平台数 / 有确切发布日 / AI 辅助标注）、两张纯 CSS/JS 图表（月度发布趋势、平台分布），图表跟随当前筛选结果实时变化 |
| **发布索引** | 平台多选、关键词搜索（支持空格分词 + 别名，例如「机战」命中「超级机器人大战」）、AI 参与筛选、时间范围（7/30/90 天）、数据范围（全部 / 近期动态 / 存量清单 / **仅自动抓取新增**）、来源点选、4 种排序 |
| **三种视图** | 卡片（默认，带平台徽章、日期性质、AI / 版本 / AUTO 标签）、时间线（按日期分组）、表格（紧凑字段对照）；点任一条目打开详情抽屉，展示完整字段与来源说明 |
| **自动抓取** | 显示上次抓取时间、自动条目数、上次新增、待复核数、正常源数量，以及每个数据源的状态 / 耗时 / 新增条数 / 说明 |
| **GitHub 实时动态** | 点「同步 Release」直接读取 11 个监控仓库的最新 Release（含附件数），结果在浏览器缓存 30 分钟；与定时抓取互为补充 |
| **数据源面板** | 列出人工登记来源与自动源，点卡片即可按来源筛选；底部附调研结论 |
| **录入 / 导入 / 导出** | 「录入新发布」表单、导入 JSON、导出全部条目为 `hanhua-index-YYYY-MM-DD.json`；自定义条目只存在当前浏览器 `localStorage`，不上传 |
| **外观** | 深浅主题切换（记忆在浏览器），响应式布局 |

**日期是刻意分开标注的**：`发布` = 作者明确给出的发布日期，`汇总` = 盘点帖 / 报道的发表或检索日，`版本` = 清单里的制作日期码。论坛盘点日、清单版本码绝不冒充发布日；无日期的存量条目不进「最新优先」的最前面。

---

## 四、运作原理

### 4.1 数据合成（四层 + 修正覆盖层）

页面本身不含数据库，所有数据在浏览器里合并成一张表：

```
data.js              人工快照 122 条   ─┐
                     （手维护，静态）   │
auto-data.js         自动快照 735 条   ─┤
  ← data/auto.json   （fetch.js 生成）  │   app.js normalize()
                                        │        ↓
overrides.js         修正覆盖层 ────────┤→ items[] → 筛选 → 卡片/时间线/表格 + 图表
  ← data/overrides.json                │        ↑
localStorage         本机录入 / 导入    │        │
  hanhua.custom.v1   （只在本机）      ─┘        │
                                                  │
GitHub Releases API  运行时实时请求 ────────→ 「GitHub 动态」独立区块
  hanhua.live.v1 缓存 30 分钟              （不并入索引表，避免混淆口径）
```

- `window.HANHUA`（`data.js`）与 `window.HANHUA_AUTO`（`auto-data.js`）都是**普通 `<script>` 挂到 window 的对象**，不是 `fetch()` JSON —— 这样 `file://` 双击打开也不会被 CORS 拦住。
- `auto-data.js` 与 `data/auto.json` 内容同源，前者给网页用，后者给别的工具消费。
- `app.js` 用 `normalize()` 把三层条目统一成同一字段结构，再按来源 id 合并来源说明，最后交给 `filtered()` → `render()`。
- **修正覆盖层**：`overrides.js`（由 `data/overrides.json` 生成）在合并**之前**应用「字段修正 / 删除 / 新增」。它独立于人工与自动快照，所以定时抓取重建 `auto-data.js` 不会冲掉人工修正。详见「方式 F」。
- 页面上显示的「截至」日期取**自动抓取日与人工快照日中较新的一个**。

### 4.2 抓取管线（`scripts/fetch.js`）

```
scripts/sources.js   源配置（URL / 类型 / 关键词 / 平台兜底）
        ↓
scripts/lib.js       统一 UA + 超时重试、HTML 转文本、平台/版本/AI 识别、
                     日期归一化、去重键、置信度、合规清洗
        ↓
scripts/parsers.js   按站的解析器（B站 / 资讯站 / 论坛索引 / 长帖 / RSS）
        ↓
  ① 载入 data.js 人工快照，建立「平台 + 游戏名」基线集合
  ② 载入 data/auto.json 历史自动条目（按 firstSeen 清理 > 400 天的）
  ③ 逐源抓取，单源 try/catch 隔离，任一源失败不影响其他源
  ④ 每条算置信度；< 0.55 只进 data/pending.json，不进公开索引
  ⑤ 去重：清单型按「平台 + 游戏名」；发布动态按「平台 + 游戏名 + 日期或 URL」
  ⑥ 写盘前对**所有**条目的备注复洗一遍合规规则（含历史条目）
  ⑦ 写 data/auto.json + auto-data.js + report.json + pending.json + cache.json
        ↓
scripts/build.js     把 4 个外部资源内联进 index-standalone.html
        ↓
GitHub Actions       有变更才 commit / push → Pages 自动部署
```

当前 8 个自动源及其解析方式：

| 源 id | 类型 | 抓什么 |
| --- | --- | --- |
| `bili-daily` | `bili` | B站作者「紫琥珀姐姐」每日《汉化情报汇总》专栏，正文是规整的 `<h3>【平台】游戏名（汉化者）</h3>` + 发布日期 + 原始视频地址 |
| `youxi360-auto` | `youxi360` | 全游网「汉化情报」栏目 34-1 / 34-2 两页 → 取列表自带发布时间与摘要，剥「中文{机型}游戏 …中文版 发布」标题、抽汉化者与 AI 线索；不抓站内 ROM / 下载资源 |
| `a9vg-index-auto` | `forumIndex` | A9VG PS2 版 Archiver 索引筛「汉化发布 / 中文补丁」主题帖 → 逐帖解析标题、发帖日、AI 说明 |
| `stage1st-index-auto` | `forumIndex` | Stage1st 游戏论坛同类主题（发布频率低，抓不到新帖属正常） |
| `gmerago-sfc-auto`、`gmerago-ps2-auto`、`cheatmaker-auto` | `summaryThread` | 汇总结帖按「《游戏名》（汉化组：X）——说明」逐行解析；CheatMaker 会依据帖内小标题自动切换 MD / SS / MS |
| `quanjizhong-auto` | `logThread` | 全机种社区《汉化游戏更新日志》，按「机种N：平台（增加X款）」分段，只收带版本 / 语言 / 汉化者标记的行 |

旧版资讯站来源及其镜像域名已在第二版整体移除；`fetch.js` 里保留 `RETIRED_SOURCES` 名单，下一轮抓取会自动清掉云端旧快照里的残留条目，不需要手工删数据。

### 4.3 B站的多级兜底（为什么要做这么复杂）

B站匿名接口有 `-352` 风控：**HTTP 200 但只返回客户端壳页**，所以不能只看状态码，要以「正文里有没有 `<h3>`」判断是否真的读到内容。管线做了三层冗余：

1. **发现最新专栏**：优先 `/x/space/article` 专栏列表接口（不受动态流风控影响，直接给 cv 号 + 标题）；失败才回退 `/x/polymer/web-dynamic/v1/feed/space` 动态流的 3 组参数变体。动态流即使被风控也会尽力取一次，用来把 cv 号映射成可读的 opus 号。
2. **取正文**：依次尝试 `read/mobile?id=<cv>` → 列表给的 `f.url` → `www.bilibili.com/opus/<opusId>` → `m.bilibili.com/opus/<opusId>` → `m.bilibili.com/read/cv<cv>`，每个地址最多重试 2 次，读到含 `<h3>` 的 HTML 即停。
3. **先取 `buvid3/buvid4`**（`/x/frontend/finger/spi`）作为匿名 Cookie，降低风控概率；请求间有 250–900 ms 间隔。

汇总日期取**标题里的日期**而不是 `publish_time` 时间戳，避免 UTC+8 跨日错一天。

### 4.4 质量护栏

| 机制 | 做法 |
| --- | --- |
| 日期不臆造 | 只接受 2000 年后的规范日期；识别不出就留空 `d` / `t`，不塞「今天」 |
| 置信度 | 基础 0.5，有日期 +0.2、是可回溯永久链接 +0.15、有汉化者 +0.08、平台显式 +0.07；低于 0.55 进待审队列 |
| AI 标注保守 | `AI / GPT / Claude / Gemini / DeepSeek / 大模型 / LLM` 等用**词边界匹配**（避免 `killllme` 里的 `llm` 误判），命中才 `true`，否则 `null`（未标注），绝不猜测 |
| 平台归一 | `PLATFORM_TOKENS` 把「世嘉五代 / Genesis」→ `MD`、`超任 / SNES` → `SFC`、`NS` → `Switch` 等 |
| 去重 | 清单型按平台 + 规范化游戏名；发布动态按平台 + 游戏名 + 日期（无日期才用 URL），并与人工快照基线比对 |
| 合规清洗 | `BLOCKED_URL` 拒绝网盘 / `.iso` / `.rom` / 磁力链；`sanitizeNote()` 抹掉备注里的网盘链接、提取码、镜像文件名，包括 UP 主用汉字混淆的 `htt删ps://pa掉n.baidu.com/s/...`，统一替换成「见原发布页」。写盘前对历史条目也复洗一遍 |
| 缓存 | B站专栏 2 天、论坛主题 7 天；全游网栏目页每轮抓 2 页、不缓存；`--no-cache` 可强制重抓 |
| 容量 | 自动条目上限 1500 条（超出按 `firstSeen` 保留最新），超过 400 天的历史自动条目自动淘汰 |

---

## 五、数据模型

每条记录字段（`data.js` / `data/auto.json` / 导入 JSON 通用）：

| 字段 | 含义 |
| --- | --- |
| `n` | 游戏名（必填，2–60 字） |
| `p` | 平台，页面会统一大写（必填） |
| `d` | 日期 `YYYY-MM-DD`，可空 |
| `t` | 日期性质：`pub` 确切发布日 / `list` 汇总检索日 / `ver` 版本日期码 / `""` 未标注 |
| `g` | 汉化者 / 汉化组 |
| `ai` | `true` AI 辅助 / `false` 明确人工 / `null` 未标注 |
| `v` | 版本号，如 `v0.1.0` |
| `k` | `release` 近期发布动态 / `catalog` 存量清单 |
| `src` | 来源 id，须在 `data.js` 的 `sources` 或自动 `sources` 里能查到 |
| `u` | **原始发布页**（必填，`http(s)://`，不能是网盘或镜像） |
| `dl` | 补丁 / Release 页，可空 |
| `note` | 备注 |
| `pan` | 网盘渠道名数组，取值仅限 `百度网盘` / `夸克网盘` / `网盘（未注明）`；**不含链接** |
| `panCode` | 布尔，仅表示发布页是否标注了提取码，不保存取值 |

自动条目额外带 `auto: true`、`confidence`（0–1）、`firstSeen`（首次入库日）。`pan` / `panCode` 由 `fetch.js` 写盘前统一计算，页面对人工快照与本机录入条目也会从备注现场推断。

最小示例：

```json
{
  "n": "超级机器人大战Z",
  "p": "PS2",
  "d": "2026-11-20",
  "t": "pub",
  "g": "某汉化组",
  "ai": null,
  "v": "v0.1.0",
  "k": "release",
  "src": "custom",
  "u": "https://example.com/post",
  "dl": "https://github.com/owner/repo/releases",
  "note": "非官方非商业汉化"
}
```

---

## 六、后续如何更新数据

有五条路径，按「要不要动手」排序。

### 方式 A：交给 GitHub Actions（推荐，部署后零操作）

**当前部署状态（2026-11-26 已上线）：**

- 仓库：https://github.com/cure415/hanhua-hub （公开，`main` 分支）
- 线上站点：https://cure415.github.io/hanhua-hub/ （`index.html` 与 `index-standalone.html` 均返回 200）
- 本机已通过 Git Credential Manager 完成授权；首次手动运行 `workflow_dispatch` 全绿（run #2：`update` + `deploy` 两个 job 全部 success）
- 每天北京时间 08:30 / 20:30 自动运行，也可在 Actions 页手动 `Run workflow`

以下是从零复现的步骤（换账号 / 迁移仓库时照做）：

**首次部署一次：**

本地仓库已初始化完成：`main` 分支、首个提交包含全部 31 个文件、工作区干净，`hanhua-hub/` 本身就是仓库根目录（`.github/workflows/update.yml` 已在正确位置）。剩下只需关联远端并推送。

1. 在 GitHub 网页新建一个**空仓库**（不要勾选 README / .gitignore / License，否则首次 push 会冲突），拿到 `https://github.com/<用户名>/<仓库名>.git`。
2. 准备认证：**GitHub 账号密码不能用于 Git 推送**（自 2021-08 起已禁用，会报 `Authentication failed`）。二选一：
   - 推荐 **Git Credential Manager**：本机已安装（v2.9.0）。`git push` 时会弹浏览器让你登录 GitHub 授权，凭据由 Windows 安全存储，不需要创建或粘贴任何令牌。
   - 或 **Personal Access Token**：`Settings → Developer settings → Personal access tokens → Tokens (classic)`，勾选 `repo` + `workflow`；push 时用户名填 GitHub 用户名、**密码栏粘贴 PAT**（不是账号密码）。用完可随时 revoke。
3. 关联远端并推送：

   ```bash
   cd hanhua-hub
   git config credential.helper manager        # 仅本仓库生效，不影响其他项目
   git remote add origin https://github.com/<用户名>/<仓库名>.git
   git push -u origin main
   ```

4. `Settings → Actions → General → Workflow permissions` 选 **Read and write permissions**（工作流要 `git push`）。
5. `Settings → Pages → Build and deployment → Source` 选 **GitHub Actions**。
6. 推送后，`.github/workflows/update.yml` 生效；也可在 Actions 页手动 `Run workflow`。

> 安全提示：不要把账号密码或 PAT 写进命令、URL、脚本或提交内容；`git remote -v` 里若出现 `https://user:token@github.com/...` 说明凭据已明文落地，应立刻 `git remote set-url` 去掉并撤销该令牌。

**日常运行：**

- 定时：UTC `00:30` / `12:30` = **北京时间 08:30 / 20:30**，每天两次。
- 手动触发可填 `max_opus`（本次最多解析几篇 B站汇总，默认 3）与 `dry_run`（只抓不写、不提交）。
- 每轮顺序：解析器自测 → 抓取 → 重新打包单文件版 → 语法检查 → **有变更才提交** → 部署 Pages。
- 作业摘要（Job Summary）里有各源状态表；失败源不会清空已有条目，历史自动条目照常保留。
- 结果写入 `auto-data.js`、`index-standalone.html`、`data/*.json` 并提交，Pages 随后自动部署。打开在线页面即是最新数据。

> 注意：定时任务只在仓库有活动时才保证长期可靠；GitHub 对 60 天无活动的仓库会停用 scheduled workflow，届时手动触发一次即可恢复。

### 方式 B：本机手动更新

```bash
cd hanhua-hub
npm run update          # 推荐：自测 → 抓取 → 打包
```

等价分步（改了 CSS / HTML / JS 后**必须**重跑 `build`，否则单文件版还是旧数据）：

```bash
npm test
node scripts/fetch.js
node scripts/build.js
```

`fetch.js` 可用参数：

| 参数 | 作用 |
| --- | --- |
| `--dry-run` | 只抓取并打印统计，**不写任何文件**，适合先验证源站是否改版 |
| `--only=bili-daily,youxi360-auto` | 只跑指定源 id（逗号分隔） |
| `--max-opus=5` | 本次多解析几篇 B站每日汇总（默认 3，`lookbackDays` 12 天内） |
| `--no-cache` | 忽略 `data/cache.json`，强制重抓全部页面 |
| `--verbose` | 打印每篇汇总 / 每个候选地址的详细日志 |

改完记得把改动一起提交；若只在本机看，`index.html` 会直接读到新的 `auto-data.js`。

### 方式 C：页面手工录入 → 合并回数据文件

1. 页面右上角「**＋ 录入新发布**」填写并保存，条目进当前浏览器 `localStorage`（键 `hanhua.custom.v1`），立刻参与筛选与图表。
2. 「**↥ 导出**」下载 `hanhua-index-YYYY-MM-DD.json`（含全部三层条目）。
3. 想把自定义条目固化进仓库：把导出的 `items` 里 `src: "custom"` 的记录追加到 `data.js` 的 `window.HANHUA.items` 数组末尾，字段与第五节一致，再跑一次 `npm run build`。
4. 换浏览器 / 清缓存会丢自定义条目，**养成导出备份的习惯**。

### 方式 D：导入 JSON

点「**↧ 导入**」，文件可以是：

- 页面导出的完整对象 `{ "asOf": "...", "items": [...] }`；
- 或纯数组 `[ {...}, {...} ]`。

导入时按 `游戏名 + 平台 + 日期 + 原始链接` 去重，已存在的不重复添加。导入的条目同样只存本机。注意导入不会做合规过滤，请自己确认链接不是 ROM / 网盘直链。

### 方式 E：新增或修改数据源

1. 编辑 `scripts/sources.js`，往 `SOURCES` 加一项：

| 字段 | 说明 |
| --- | --- |
| `id` / `name` / `type` / `url` / `desc` | 会直接显示在页面「数据源」面板与自动抓取状态卡 |
| `kind` | 决定走哪个 dispatch：`bili` / `youxi360` / `forumIndex` / `summaryThread` / `logThread` |
| `enabled` | 设 `false` 可临时停用（如镜像站、被风控的源） |
| `platform` | 该源解析不出机型时的兜底 |
| `titleInclude` / `titleExclude` / `threadUrl` / `maxThreads` | 论坛索引的标题过滤与主题上限 |
| `fallbackUrl` | 主 URL 读不到时的备用地址 |

2. 若源站 HTML 结构变了，改 `scripts/parsers.js` 里对应的 `parse*` 函数（`lib.js` 放通用规则，别把站点特例塞进去）。
3. 从真实页面裁一小段存进 `tests/fixtures/`，在 `scripts/selftest.js` 补断言，跑 `npm test` —— Actions 每轮抓取前都会先跑这个，防止把垃圾写进索引。
4. 常用阈值在 `scripts/fetch.js` 顶部：`MIN_CONFIDENCE`（0.55）、`MAX_AUTO_ITEMS`（1500）、`MAX_AGE_DAYS`（400）。
5. 跑 `node scripts/fetch.js --only=<新源id> --verbose` 单源验证，确认无误再 `npm run update`。

### 方式 F：数据修正台（纠错 / 批量修正，推荐）

前面几种方式改的是「原始数据」，而日常更多是修已有条目的错字、平台、日期性质、误收条目。这类修正请用数据修正台，它**不会改动** `data.js` 与 `data/auto.json`：

```bash
npm run editor
# 浏览器打开终端给出的地址，默认 http://127.0.0.1:8787/editor.html（端口占用会自动顺延）
```

**为什么用覆盖层**：修正写进 `data/overrides.json` + `overrides.js`，页面合并时按「层 + 游戏名 + 平台 + 发布页」算出的稳定指纹（`fingerprint.js`）定位条目再应用。自动快照每轮重排也不会错位；抓取管线完全不碰这个文件，所以定时更新不会把人工修正冲掉。

| 能力 | 说明 |
| --- | --- |
| 数据体检 | 自动列出名称可疑、日期/性质不匹配、平台可疑、发布页异常、备注含清洗占位、同名同平台重复、低置信度、来源未登记、网盘渠道异常，点问题数直接筛出条目 |
| 行内编辑 | 点「编辑」打开侧栏改全部字段并显示原值对比；改回原值自动撤销该条修正 |
| 批量操作 | 多选后统一赋值某字段；正则替换（支持 `/正则/g`）可先预览再应用；批量删除 |
| 新增 / 删除 | 新增条目进覆盖层；删除只做标记，原始快照不变，随时可回滚 |
| 撤销 | Ctrl+Z 或「撤销」按钮，保留最近 60 步 |
| 保存 | 保存前显示完整 diff；服务端校验通过后写覆盖层、自动备份，并重建 `overrides.js` 与单文件版 |
| 回滚 | 「备份 / 回滚」列出最近 20 份自动备份，一键恢复 |

**离线用法**：直接双击 `editor.html` 也能读数据、体检、编辑（右上角显示「离线 · 仅导出补丁」）。点「导出补丁」得到 `hanhua-fixes-*.json`，再执行：

```bash
npm run apply-fixes -- hanhua-fixes-2026-11-26.json
npm run apply-fixes -- --list                  # 看备份
npm run apply-fixes -- --restore=<备份文件名>  # 回滚
npm run apply-fixes -- --reset                # 清空全部修正
```

**写盘护栏**：服务只监听 `127.0.0.1` 且校验 Host；字段白名单、URL 必须可回溯（网盘 / 镜像 / 磁力链一律拒绝）、备注自动走 `sanitizeNote()`、日期与枚举校验、单次删除超过 50 条拦截、定位键必须存在于当前快照。备份在 `data/backups/`（已加入 `.gitignore`）。

> 修正已随本版同步到 GitHub：`overrides.js` 与 `data/overrides.json` 均已提交，工作流 `git add` 也已包含 `overrides.js`，云端重建单文件版会带上修正。以后在本机改了修正层，把这两个文件一起 `git push` 即可。

### 待审队列怎么用

`data/pending.json` 里是置信度不足的候选，字段含 `confidence` 与 `reason`。它们**只在本次运行生成、不会自动升级进索引**。处理方式：

- 看是解析器没提取到日期 / 汉化者 / 平台（改解析器 + 补自测），还是本身就是噪声标题（加 `titleExclude`）；
- 确实有效但源站信息不全的，用方式 C 手工录入，或适度调低 `MIN_CONFIDENCE`（会放宽整体口径，谨慎）。

### 更新节奏小结

| 数据 | 谁更新 | 频率 |
| --- | --- | --- |
| B站每日汇总、论坛新版帖 | Actions | 每天 2 次，专栏缓存 2 天 |
| 全游网「汉化情报」栏目 | Actions | 每轮抓分类页前 2 页（约 20 条），只收近 7 天 |
| 论坛汇总长帖 / 机种日志 | Actions | 每轮全量重解析，靠去重只收新增行 |
| GitHub Releases | 访客浏览器点「同步」 | 实时，缓存 30 分钟 |
| 人工快照 `data.js` | 你自己 | 按需 |
| 本机录入条目 | 你自己 | 按需，仅本机 |

---

## 七、目录结构

```
hanhua-hub/
├─ index.html                 源码版页面（结构 / 文案）
├─ index-standalone.html      ★ 自包含单文件版（build.js 生成，勿手改）
├─ styles.css                 样式与深浅主题变量
├─ app.js                     交互层：合并数据、筛选、渲染、导入导出、GitHub 同步
├─ data.js                    ★ 人工整理快照（手维护）
├─ auto-data.js               ★ 自动抓取产物（fetch.js 生成，勿手改）
├─ editor.html                ★ 数据修正台页面（也可双击离线使用）
├─ fingerprint.js             条目稳定指纹（浏览器 / Node 共用）
├─ overrides.js               修正覆盖层（修正台生成，勿手改）
├─ data/
│  ├─ auto.json               自动条目机器可读版 + stats / report / sources
│  ├─ overrides.json          ★ 修正覆盖层机器可读版
│  ├─ report.json             上次各源状态
│  ├─ pending.json            待人工复核候选
│  ├─ cache.json              已解析页面缓存
│  └─ backups/                修正自动备份（.gitignore 排除，不入库）
├─ scripts/
│  ├─ lib.js                  请求、文本、平台 / AI / 版本 / 日期、去重、置信度、合规
│  ├─ parsers.js              各站解析器
│  ├─ sources.js              ★ 数据源配置（新增源改这里）
│  ├─ fetch.js                ★ 抓取主流程与 CLI
│  ├─ apply-edits.js          ★ 修正写盘核心：校验 / 备份 / 重建
│  ├─ editor-server.js        本地修正台服务（仅监听 127.0.0.1）
│  ├─ apply-fixes.js          离线补丁应用 CLI
│  ├─ selftest.js             离线自测
│  └─ build.js                单文件版打包
├─ tests/fixtures/            从真实页面裁下的测试样本
├─ .github/workflows/update.yml   定时抓取 + Pages 部署
├─ package.json               命令入口
└─ README.md                  本文档
```

---

## 八、常见问题

| 现象 | 原因 / 处理 |
| --- | --- |
| B站源报 `-352` 或「正文不可读」 | 匿名风控。管线已自动切专栏列表 + `read/mobile` + `opus` 兜底；仍失败时等下一轮，或用 `--no-cache` 重跑。不要短时间高频手动重试 |
| 某个源 ❌ 失败，但页面数据没丢 | 设计如此：单源隔离，历史自动条目先保留再合并。`data/report.json` 看具体报错 |
| 「同步 Release」显示 403 / 读取失败 | GitHub 匿名 API 限额约 60 次/小时，页面缓存 30 分钟以免反复占用。稍后再试 |
| 改了 `data.js` / CSS / app.js，单文件版却没变 | 没跑 `node scripts/build.js`。`index-standalone.html` 是生成物 |
| `npm test` 失败 | 多半是源站改版导致样本解析结果变化。对照失败断言改 `parsers.js`，必要时更新 `tests/fixtures/` 样本 |
| 修正台显示「离线 · 仅导出补丁」 | 直接双击了 `editor.html`。在线写盘要跑 `npm run editor`，用终端给出的地址打开；或导出补丁后执行 `npm run apply-fixes -- <文件>` |
| 定时抓取后人工修正消失了 | 正常不会：修正存在独立的 `overrides.json` / `overrides.js`，抓取脚本不碰它。若部署到云端，确认这两个文件已提交，且工作流 `git add` 包含 `overrides.js` |
| 修正台保存被拒绝 | 弹窗会列出具体原因，常见是发布页填了网盘 / 镜像链接、枚举字段不合法、或定位键因原始快照更新而失效 |
| Actions 跑了但没新提交 | 本轮与人工快照 / 历史自动条目完全去重后没有新增，工作流会跳过 commit，属正常 |
| `deploy` 步骤报 "Multiple artifacts named github-pages" | 不要点 **Re-run failed jobs**：它会在同一个 run 里累积 2 个同名产物，部署动作会拒绝。直接重新 **Run workflow** 触发一次全新运行 |
| `deploy` 步骤报 "No artifacts named github-pages" | 多为 GitHub 产物元数据瞬时故障，重新 Run workflow 一次即可；仍失败再查 githubstatus.com |
| Pages 打开 404 | 检查 `Settings → Pages → Source` 是否为 **GitHub Actions**，以及工作流 `deploy` job 是否成功 |
| 时间显示和本地差 8 小时 | `data/auto.json` 的 `generatedAt` 是 UTC（ISO 8601），页面用 `toLocaleString("zh-CN")` 转本地时间显示 |
| 想要清掉所有自动条目重来 | 删 `data/auto.json`、`auto-data.js`、`data/cache.json`，再跑 `npm run update`（会全量重抓，注意别触发风控） |

---

## 九、合规边界与已知局限

- **只做索引**：`u` / `dl` 指向发布者原帖、专栏、视频、开源仓库 Release；不托管 ROM、ISO、完整镜像，不直链网盘，备注里的网盘地址与提取码一律清洗。请自行合法持有原版游戏，遵守各汉化作者的使用声明。
- **网盘只记渠道，不记内容**：百度网盘 / 夸克网盘的分享页需要登录、提取码与 JS 渲染，且强风控，本项目不抓取、不索引、不转发其链接、提取码、文件名或文件列表；只把「发布页标注了哪个渠道」结构化成 `pan` 字段，用于筛选与统计。清洗规则的替换文案会保留渠道名，保证清洗后仍可识别；下载请一律回到原发布页。
- **快照 ≠ 实时全库**：长帖 / 清单类条目没有逐条发布日期，只能标「未标注」或「汇总日」；趋势图只统计有明确发布日期的记录。
- **依赖源站结构**：论坛与资讯站改版会让解析器失效，靠 `selftest.js` + Job Summary 发现问题；B站风控是常态，已做多级兜底但不保证 100% 成功。
- **自动抽取会有误差**：置信度与待审队列是护栏，不是保证。重要信息请点「发布页 ↗」回原帖核对。
- **本机录入不跨设备**：自定义条目存 `localStorage`，换浏览器需导出 / 导入。
- GitHub 匿名 API 限流 60 次/小时；网盘链接随时可能失效，以发布页说明为准。

---

## 十、验证记录（2026-11-26）

> 前半段为第一版上线时的验证记录，其中条目数是当时快照；当前数字以文首「文档对应版本」为准。

- `npm test`：55 项解析器自测全部通过，覆盖平台识别、AI 边界、日期、B站 / 资讯站 / 论坛各解析器、合规总检。
- `npm run check`：6 个 JS 文件语法检查通过；`.github/workflows/update.yml` YAML 解析通过。
- 真实全量抓取：8 个源全部 `ok`，重建出 619 条自动条目，失败源 0，待审 0，耗时约 18 秒；无网盘 / 镜像链接泄漏，无非法 URL。
- 手动演练（等价 `workflow_dispatch`）：6 步全绿、8 源全 `ok`。期间发现 Discuz 页脚性能行 `, Processed in 0.09 second(s), 21 queries` 因带 `(s)` 括号骗过了「必须有括号标记」的过滤，被误收为游戏；已在 `BAD_FORUM_LINE` 加过滤并补自测断言（自测升至 50 项），同时清掉历史快照里 1 条同类脏条目。本地演练结束时自动索引 618 条、页面合计 755 条。
- 无头浏览器渲染：卡片、KPI、平台筛选、来源面板、自动抓取状态卡、AUTO 徽章全部输出；模拟点击验证「仅自动抓取」筛选、平台筛选、搜索、三视图切换、详情抽屉、表格、主题切换、来源筛选均正常；深浅主题截图对比度无问题。
- `index-standalone.html` 已重新打包并验证：外部 `<script src>` / `styles.css` 引用数为 0，离线可独立运行。
- 云端首次真实运行：run #1 的 `deploy` 因 GitHub 产物元数据瞬时故障失败；清理重复产物后重新触发的 **run #2 全绿**（`update` 9 步 + `deploy` 5 步全部 success），自动提交 `70c5dd8` / `15eceda`，Pages 部署成功、线上页面 HTTP 200。云端比本地快照多抓到 1 条合法新增（幻想水浒传3 PS2，置信度 0.92），现为自动 619 条 / 页面合计 756 条；无页脚脏数据、无网盘泄漏。
- **第二版（2026-11-26 晚）**：按使用偏好整体移除旧资讯站来源（人工条目、自动条目、解析器、离线样本与缓存一并清掉），接入全游网「汉化情报」栏目；新增 `MD32X` 机型识别、署名连写清洗与「已下线来源」历史条目回收。本地重跑：8 源全部 `ok`、失败源 0、待审 0、自测 55 项通过、合规泄漏 0、页脚脏数据 0、单文件版外部引用 0；自动索引 637 条 / 页面合计 759 条。
- **本地迭代版（2026-11-26 夜，未推送）**：新增 `pan` / `panCode` 字段与「网盘渠道」筛选下拉、卡片 / 详情徽章、KPI 与作业摘要统计；`sanitizeNote()` 的替换文案保留渠道名，`fetch.js` 写盘前对全部条目（含历史）统一识别并持久化标注。本地重跑：8 源全 `ok`、新增 0 条、失败源 0、待审 0；自测由 55 项增至 **66 项全通过**；渠道标注自动条目 22 条（百度 3 / 夸克 4 / 泛称 15），页面口径含人工快照共 23 条；合规泄漏 0、`pan` 字段异常值 0、单文件版外部引用 0。无头浏览器模拟筛选：全部 759 / 含渠道 23 / 百度 3 / 夸克 4 / 无标注 736，徽章 23 个，重置正常，无 JS 错误。**当时改动暂时留在本地工作区，已于 2026-11-28 同步上线。**
- **数据修正台（2026-11-26 夜，本地迭代，未推送）**：新增覆盖层机制（`fingerprint.js` / `data/overrides.json` / `overrides.js`）、本地服务 `editor-server.js`、写盘核心 `apply-edits.js`、离线补丁 CLI 与 `editor.html` 页面；`app.js` / `index.html` / `build.js` / 工作流同步接入。端到端验证：服务仅 127.0.0.1 可访问、非本机 Host 返回 403；保存「2 修正 + 1 删除 + 1 新增」正确落盘并生成备份、单文件版重建、主页面确认改名/删除/新增全部生效；网盘直链写入被 400 拒绝且不污染覆盖层；`/api/restore` 回滚到空覆盖层、CLI `--reset` 幂等；修正台页面在线模式、50 行表格、体检 chips 与筛选计数正常，无 JS 错误。自测 66 → **81 项全通过**，`npm run check` 覆盖 14 个 JS 文件。测试产物与备份已清理，覆盖层回到空状态。
- **双向同步与上线（2026-11-28）**：把本地两版迭代（网盘渠道情报 + 数据修正台）与云端 4 次定时抓取合并。生成物冲突采用「取云端最新快照 + 本地新代码重跑 `fetch.js` / `build.js`」解决，云端两天新增的条目一条未丢，`pan` / `panCode` 由写盘前统一复洗补齐。本地提交 `b59e3c9` 推送；清理旧 `github-pages` 产物后触发全新 run `46152908958`，`update` 12 步 + `deploy` 7 步全绿，云端自动提交 `05cfac8`；本地 `git pull --ff-only` 后与远端 main 对齐、工作区干净。最终 **857 条**（人工 122 + 自动 735）、31 平台、8 源全 `ok`、失败源 0、待审 0、自测 81 项全通过、合规泄漏 0、旧来源字样 0；渠道标注 49 条（百度 8 / 夸克 13 / 泛称 28）、含提取码 1 条。`youxi360-auto` 从一次 `error` 恢复并新增 10 条。线上首页 / `index.html` / 单文件版 / `editor.html` / `overrides.js` / `auto-data.js` 全部 HTTP 200，新功能标记齐全。
