/* ============================================================================
 * 复古汉化发布台 · 解析器离线自测
 * 样本是从真实页面裁下来的小片段（tests/fixtures/），无需联网。
 * GitHub Actions 在抓取前会先跑这个，防止源站改版后把垃圾写进索引。
 * ==========================================================================*/
"use strict";

const fs = require("fs");
const path = require("path");
const L = require("./lib");
const P = require("./parsers");
const { SOURCES } = require("./sources");

const FIX = path.resolve(__dirname, "..", "tests", "fixtures");
const F = function (n) { return fs.readFileSync(path.join(FIX, n), "utf8"); };
let passed = 0, failed = 0;
function ok(cond, label, extra) {
  if (cond) { passed++; console.log("  ✓ " + label); }
  else { failed++; console.log("  ✗ " + label + (extra ? " → " + extra : "")); }
}
function section(name) { console.log("\n[" + name + "]"); }
const has = function (arr, fn) { return arr.some(fn); };

/* ------------------------------ 公共工具 ------------------------------ */
section("公共工具");
ok(L.detectPlatform("1. 【PS2】十二国记 - 红莲之标", "") === "PS2", "显式方括号识别 PS2");
ok(L.detectPlatform("GBA火焰纹章：魂缚之森[汉化]", "") === "GBA", "标题机型前缀识别 GBA");
ok(L.normalizePlatform("NS") === "Switch", "NS 归一为 Switch");
ok(L.toISODate("发布日期：1992年10月30日") === "", "原作发售日不会被误当发布日");
ok(L.toISODate("2026/11/25") === "2026-11-25", "斜杠日期归一化");
ok(L.detectAI("CLARK.H&killllme&阿刃") === null, "AI 关键词不做子串误判");
ok(L.detectAI("全程使用GPT-6.1 SOL进行汉化") === true, "GPT 汉化标注为 AI 辅助");
ok(L.safeIndexUrl("https://pan.baidu.com/s/abcd") === "", "网盘直链被拒绝");
ok(L.sanitizeNote("链接: https://pan.baidu.com/s/1abc?pwd=xyz 提取码: xyz").indexOf("pan.baidu") < 0, "备注里的网盘链接被抹掉");

/* ------------------------------ B站 ------------------------------ */
section("B站每日汇总");
const feed = P.parseBiliFeed(JSON.parse(F("bili-feed.json")));
ok(feed.length >= 3, "动态流识别出多篇汇总专栏", "实际 " + feed.length);
ok(feed.every(function (x) { return /汉化情报汇总/.test(x.title); }), "只保留「汉化情报汇总」专栏");
ok(feed.every(function (x) { return x.date === x.title.slice(0, 10); }), "汇总日期取标题日期，不取可能跨时区的时间戳");
const articles = P.parseBiliArticles(JSON.parse(F("bili-articles.json")));
ok(articles.length >= 8, "专栏列表接口（动态流风控时的备用入口）能发现多篇汇总", "实际 " + articles.length);
ok(articles.every(function (x) { return /read\/cv\d+/.test(x.url) && x.rid; }), "备用入口给出可直接抓取的 cv 地址");
ok(articles.every(function (x) { return x.date === x.title.slice(0, 10); }), "备用入口日期同样取标题日期");
const bili = P.parseBiliOpus(F("bili-opus.html"), {
  src: "bili-daily", url: "https://www.bilibili.com/opus/1274688393042722840", date: "2026-11-25"
});
ok(bili.length >= 3, "专栏正文解析出多条游戏", "实际 " + bili.length);
ok(bili[0].n === "十二国记 - 红莲之标 黄尘之路" && bili[0].p === "PS2", "首条游戏名 / 平台正确");
ok(bili[0].d === "2026-11-25" && bili[0].t === "pub", "发布日期字段被识别为确切发布日");
ok(bili[0].g === "斑鳩さつき", "汉化发布者字段被提取");
ok(/bilibili\.com\/video\/BV/.test(bili[0].u), "原始视频地址作为发布页");
ok(bili.every(function (x) { return x.confidence >= 0.9; }), "带原始地址的条目置信度足够");
ok(!has(bili, function (x) { return /pan\.baidu|提取码/.test(x.note); }), "视频简介里的网盘链接不进索引");

/* ------------------------------ 资讯站 ------------------------------ */
section("围炉Go 栏目");
const wlList = P.parseWlList(F("wlgooo-list.html"), { url: "https://www.wlgooo.com/category/x" });
ok(wlList.length >= 3, "栏目页解析出多篇文章", "实际 " + wlList.length);
ok(wlList.every(function (x) { return /^https:\/\/www\.wlgooo\.com\/\d+\.html$/.test(x.url); }), "文章链接是具体文章页");
const wlPost = P.parseWlPost(F("wlgooo-post.html"));
ok(wlPost.date === "2026-11-24", "从 JSON-LD 取到文章发表日");
const wl1 = P.parseWlTitle(wlList[0].title, { src: "wlgooo-auto", url: wlList[0].url, date: wlPost.date });
ok(wl1 && wl1.n === "火焰纹章：魂缚之森" && wl1.p === "GBA", "机型前缀从游戏名里剥离");
ok(wl1 && wl1.t === "list", "资讯站文章日标为「汇总」，不冒充发布日");
const wl2 = P.parseWlTitle(wlList[1].title, { src: "wlgooo-auto", url: wlList[1].url, date: wlPost.date });
ok(wl2 && wl2.v === "1.01", "[1.01汉化] 里的版本号被提取");

/* ------------------------------ 论坛新版索引 ------------------------------ */
section("论坛新版索引与发布帖");
const a9cfg = SOURCES.find(function (s) { return s.id === "a9vg-index-auto"; });
const threads = P.parseForumIndex(F("a9vg-index.html"), a9cfg);
ok(threads.length >= 4, "A9VG 版块索引命中多个汉化发布帖", "实际 " + threads.length);
ok(threads.every(function (t) { return /tid-\d+\.html/.test(t.url) && !/汇总|工具|金手指/.test(t.title); }), "过滤掉汇总帖与工具帖");
const a9 = P.parseReleaseThread(F("a9vg-thread.html"), {
  src: "a9vg-index-auto", url: "https://bbs.a9vg.com/archiver?tid-9074891.html",
  cfg: Object.assign({}, a9cfg, { date: "2026-10-26" })
});
ok(a9.length === 1 && a9[0].n === "犬夜叉 奥义乱舞" && a9[0].p === "PS2", "A9VG 发布帖解析出游戏与机型");
ok(a9[0].d === "2026-10-26" && a9[0].t === "pub", "发帖日期被识别");
ok(a9[0].ai === true, "GPT 全程汉化被标注 AI 辅助");
ok(!/论坛首页|›|pan\.baidu/.test(a9[0].note), "备注不含导航面包屑或网盘链接");
const s1 = P.parseReleaseThread(F("stage1st-thread.html"), {
  src: "stage1st-index-auto", url: "https://stage1st.com/2b/thread-2287382-1-1.html",
  cfg: { platform: "PS2" }
});
ok(s1.length === 1 && s1[0].n === "超级机器人大战Z" && s1[0].v === "v0.1.0", "Stage1st 书名号标题与版本号解析");

/* ------------------------------ 论坛长帖增量 ------------------------------ */
section("论坛长帖逐行解析");
const gm = P.parseSummaryThread(F("gmerago.html"), {
  id: "gmerago-sfc-auto", url: "https://www.gmerago.com/archiver?tid-10404.html",
  platform: "SFC", date: "2026-10-26"
});
ok(gm.length >= 25, "SFC 汇总长帖解析出足够条目", "实际 " + gm.length);
ok(gm[0].n === "勇者斗恶龙5 - 天空的新娘" && gm[0].g === "SPACE0", "《游戏名》（汉化组：X）——说明 格式");
ok(gm.every(function (x) { return x.d === "" && x.t === ""; }), "长帖条目不臆造发布日期（避免挤到最新列表最前）");
const cm = P.parseSummaryThread(F("cheatmaker.html"), {
  id: "cheatmaker-auto", url: "https://www.cheatmaker.org/archiver/showtopic-32981.aspx",
  platform: "MD", date: "2026-11-03"
});
ok(cm.length >= 20, "CheatMaker 长帖解析出足够条目", "实际 " + cm.length);
ok(has(cm, function (x) { return x.p === "MD"; }) && has(cm, function (x) { return x.p === "SS"; }) && has(cm, function (x) { return x.p === "MS"; }), "按帖内小标题自动切换 MD / SS / MS 机型");
const qj = P.parseLogThread(F("quanjizhong.html"), {
  id: "quanjizhong-auto", url: "https://www.quanjizhong.top/thread-675-1-1.html", date: "2026-11-26"
});
ok(qj.length >= 100, "全机种社区机种日志解析出足够条目", "实际 " + qj.length);
ok(qj.every(function (x) { return x.p !== "其他"; }), "每个条目都归属到具体机种");
ok(!has(qj, function (x) { return /APP下载|夸克链接|专区|导航/.test(x.n); }), "导航 / 下载行不会混进索引");
// Discuz 页脚「, Processed in 0.09 second(s), 21 queries」带 (s) 括号，
// 曾骗过「必须有括号标记」这条过滤，需专门守住。
const footerItems = P.parseLogThread(
  "<div>机种1：PSP（增加2款）</div><div>, Processed in 0.092006 second(s), 21 queries , Gzip enabled</div>",
  { id: "quanjizhong-auto", url: "https://www.quanjizhong.top/thread-675-1-1.html", date: "2026-11-26" }
);
ok(footerItems.length === 0, "Discuz 页脚性能统计行不会混进索引");
ok(qj.every(function (x) { return x.d === "" && x.t === ""; }), "机种日志条目不臆造发布日期");
ok(qj.filter(function (x) { return x.ai === true; }).length <= 2, "AI 标注保守，不臆测");
ok(has(qj, function (x) { return x.v === "v2.5"; }), "日志里的 (v2.5) 被提取为版本");

/* ------------------------------ 合规总检 ------------------------------ */
section("合规总检");
const all = [].concat(bili, [wl1, wl2], a9, s1, gm, cm, qj).filter(Boolean);
const leaked = all.filter(function (x) {
  return /pan\.baidu|pan\.quark|lanzou|123pan|\.iso|\.rom|提取码|magnet:/i.test([x.u, x.dl, x.note].join(" "));
});
ok(leaked.length === 0, "所有条目的链接 / 备注都不含 ROM、镜像与网盘直链", "泄漏 " + leaked.length + " 条");
ok(all.every(function (x) { return /^https?:\/\//.test(x.u); }), "每条都有可回溯的发布页 URL");
ok(all.every(function (x) { return ["pub", "list", "ver", ""].indexOf(x.t) >= 0; }), "日期性质字段合法");

console.log("\n—— 自测结果：" + passed + " 通过 / " + failed + " 失败 ——");
if (failed) process.exit(1);
