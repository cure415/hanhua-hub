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
section("网盘渠道情报（只记渠道名）");
ok(L.detectPanChannels("通过网盘分享的文件：XXX https://pan.baidu.com/s/1abc 提取码 abcd").join() === "百度网盘", "百度网盘渠道被识别");
ok(L.detectPanChannels("夸克网盘链接 https://pan.quark.cn/s/def").join() === "夸克网盘", "夸克网盘渠道被识别");
ok(L.detectPanChannels("百度网盘 + 夸克网盘 双版本").length === 2, "双渠道分别标注");
ok(L.detectPanChannels("通过网盘分享的文件：XXX 链接").join() === "网盘（未注明）", "只说网盘没点名时标为未注明");
ok(L.detectPanChannels("纯文本说明，没有下载信息").length === 0, "无关文本不误标");
const panNote = L.sanitizeNote("下载 https://pan.baidu.com/s/1abc?pwd=xyz 与 https://pan.quark.cn/s/def 提取码: abcd 游戏.iso");
ok(!/pan\.baidu|quark\.cn|\.iso|提取码\s*[:：]\s*[A-Za-z0-9]{4,8}/i.test(panNote), "链接 / 提取码取值 / 镜像名仍被清洗", panNote);
ok(L.detectPanChannels(panNote).join("+") === "百度网盘+夸克网盘", "清洗后的占位文案仍保留渠道名", panNote);
ok(L.hasPanCode(panNote) === true, "是否需要提取码只留布尔标记");
ok(L.hasPanCode("只写了发布说明") === false, "无提取码时不误标");
const panRecord = { note: panNote, pan: L.detectPanChannels(panNote), panCode: L.hasPanCode(panNote) };
ok(!/https?:\/\/|\/s\/[A-Za-z0-9]|[A-Za-z0-9]{4}\.iso/i.test(JSON.stringify(panRecord)), "写盘对象里没有任何链接或提取码取值");
ok(panRecord.pan.every(function (v) { return /^(百度网盘|夸克网盘|网盘（未注明）)$/.test(v); }), "渠道字段只含白名单渠道名");

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
section("全游网「汉化情报」栏目");
const yxList = P.parseYx360List(F("youxi360-list.html"), { url: "https://www.youxi360.net/news/emu/34-1.html" });
ok(yxList.length >= 6, "栏目页解析出多篇汉化情报", "实际 " + yxList.length);
ok(yxList.every(function (x) { return x.url.indexOf("https://www.youxi360.net/news/detail/") === 0 && x.url.slice(-5) === ".html" && x.url.length > 45; }), "链接指向具体新闻页");
ok(!has(yxList, function (x) { return /2017|2009/.test(x.url); }), "侧栏「热门资讯」的早年旧新闻不会混进列表");
ok(yxList.every(function (x) { return /^20\d{2}-\d{2}-\d{2}$/.test(x.date); }), "每条都取到列表自带的发布日期");
const yx1 = P.parseYx360Title(yxList[0].title, {
  src: "youxi360-auto", url: yxList[0].url, date: yxList[0].date, excerpt: yxList[0].excerpt
});
ok(yx1 && yx1.n === "三国志4" && yx1.p === "MD32X", "「中文MD32X游戏」机型与游戏名被剥离");
ok(yx1 && yx1.t === "list" && yx1.d === "2026-11-26", "资讯站文章日标为「汇总」，不冒充发布日");
ok(yx1 && yx1.ai === true, "摘要里的 CHATGPT5.6 被识别为 AI 辅助");
ok(yx1 && /Linux_YL/.test(yx1.g), "摘要里的翻译者被提取为汉化者");
ok(yx1 && !/https?:\/\//.test(yx1.note), "备注里不保留任何外链");
const yx2 = P.parseYx360Title(yxList[1].title, {
  src: "youxi360-auto", url: yxList[1].url, date: yxList[1].date, excerpt: yxList[1].excerpt
});
ok(yx2 && yx2.n === "资讯骑士" && yx2.p === "SFC", "普通机型标题解析正确");
const cleanText = function (x) {
  // 合规清洗后的占位文本本身含「提取码 / 镜像」等字样，检查真实泄漏时先剥掉
  return [x.u, x.dl, x.note].join(" ").replace(/［[^］]*］/g, " ");
};
const yxLeak = P.parseYx360Title("中文PS2游戏 测试游戏中文版 发布", {
  src: "youxi360-auto", url: "https://www.youxi360.net/news/detail/20261126/9999.html",
  date: "2026-11-26", excerpt: "下载 https://pan.baidu.com/s/abcd 提取码: abcd 游戏.iso 附攻略"
});
ok(yxLeak && !/pan\.baidu|pan\.quark|lanzou|123pan|\.iso|\.rom|提取码|magnet:/i.test(cleanText(yxLeak)), "网盘 / 镜像 / 提取码不会泄进索引");

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
const all = [].concat(bili, [yx1, yx2, yxLeak], a9, s1, gm, cm, qj).filter(Boolean);
const leaked = all.filter(function (x) {
  return /pan\.baidu|pan\.quark|lanzou|123pan|\.iso|\.rom|提取码|magnet:/i.test(cleanText(x));
});
ok(leaked.length === 0, "所有条目的链接 / 备注都不含 ROM、镜像与网盘直链", "泄漏 " + leaked.length + " 条");
ok(all.every(function (x) { return /^https?:\/\//.test(x.u); }), "每条都有可回溯的发布页 URL");
ok(all.every(function (x) { return ["pub", "list", "ver", ""].indexOf(x.t) >= 0; }), "日期性质字段合法");

/* ------------------------------ 数据修正台覆盖层 ------------------------------ */
section("数据修正台覆盖层");
const E = require("./apply-edits");
const FP = require("../fingerprint");
const fpSample = { n: "测试游戏", p: "PS2", u: "https://example.com/post/1" };
ok(FP.fp(fpSample, "b") === FP.fp(Object.assign({}, fpSample), "b"), "同一条目指纹稳定");
ok(FP.fp(fpSample, "a") !== FP.fp(fpSample, "b"), "人工层与自动层指纹不同");
ok(FP.fp(fpSample, "b") !== FP.fp(Object.assign({}, fpSample, { n: "改名后" }), "b"), "改名会改变指纹，故按修正前的值定位");
ok(FP.fp(fpSample, "b") === FP.fp(Object.assign({}, fpSample, { p: "ps2" }), "b"), "平台大小写不影响指纹");
const ovBase = E.collect();
const keyB = ovBase.manual[0] && ovBase.manual[0]._key;
const keyA = ovBase.autoItems[0] && ovBase.autoItems[0]._key;
ok(!!keyB && !!keyA, "人工 / 自动快照都能生成定位键");
const legal = E.validate({ version: 1, edits: { [keyB]: { note: "修正台自测备注" } }, deleted: [], added: [] });
ok(legal.ok, "合法修正通过校验", (legal.errors || []).join("；"));
const badUrl = E.validate({ version: 1, edits: { [keyB]: { u: "https://pan.baidu.com/s/abcd" } }, deleted: [], added: [] });
ok(!badUrl.ok && badUrl.errors.some(function (x) { return /网盘/.test(x); }), "网盘直链写入被拒绝");
const badField = E.validate({ version: 1, edits: { [keyB]: { notAField: 1 } }, deleted: [], added: [] });
ok(!badField.ok, "未登记字段被拒绝");
const orphan = E.validate({ version: 1, edits: { "b:deadbeefdeadbeef": { n: "幽灵" } }, deleted: [], added: [] });
ok(!orphan.ok, "快照里不存在的定位键被拒绝");
const bulk = { version: 1, edits: {}, deleted: [], added: [] };
for (let bi = 0; bi < 51; bi++) bulk.deleted.push("b:fake" + bi);
const bulkRes = E.validate(bulk);
ok(!bulkRes.ok && bulkRes.errors.some(function (x) { return /50 条上限/.test(x); }), "单次删除超过 50 条被拦截");
const cleanNote = E.validate({ version: 1, edits: { [keyB]: { note: "下载 https://pan.baidu.com/s/abc 提取码: abcd" } }, deleted: [], added: [] });
ok(cleanNote.ok && !/pan\.baidu/.test(JSON.stringify(cleanNote.value)), "修正备注里的网盘链接与提取码先清洗再入库");
const applied = E.applyTo(ovBase.manual.concat(ovBase.autoItems), {
  edits: { [keyB]: { n: "被改名的游戏" } }, deleted: [keyA],
  added: [{ layer: "b", n: "新增测试", p: "SFC", u: "https://example.com/new", src: "bili1015" }]
});
ok(applied.length === ovBase.manual.length + ovBase.autoItems.length, "应用覆盖层后条目数正确");
ok(applied[0].n === "被改名的游戏" && applied[0]._key === keyB, "修正生效且定位键仍是修正前指纹");
ok(!applied.some(function (x) { return x._key === keyA; }), "删除生效");
ok(applied.some(function (x) { return x._added && x.n === "新增测试"; }), "新增生效");

console.log("\n—— 自测结果：" + passed + " 通过 / " + failed + " 失败 ——");
if (failed) process.exit(1);
