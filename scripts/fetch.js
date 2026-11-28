/* ============================================================================
 * 复古汉化发布台 · 定时抓取入口
 *
 *   node scripts/fetch.js                 正常抓取并写回数据
 *   node scripts/fetch.js --dry-run       只抓取、不写文件（打印统计）
 *   node scripts/fetch.js --only=bili-daily,youxi360-auto
 *   node scripts/fetch.js --max-opus=5    本次多抓几篇 B站汇总
 *   node scripts/fetch.js --no-cache      忽略缓存，强制重抓
 *
 * 产物：
 *   data/auto.json      机器可读的自动条目（可被别的工具直接消费）
 *   auto-data.js        同内容的 <script> 版（兼容 file:// 离线打开）
 *   data/report.json    本次各源状态
 *   data/pending.json   置信度不足、等待人工复核的候选
 *   data/cache.json     已解析页面缓存，避免反复请求源站
 * ==========================================================================*/
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const L = require("./lib");
const P = require("./parsers");
const { SOURCES, sourceDescriptor } = require("./sources");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const MIN_CONFIDENCE = 0.55;
const MAX_AUTO_ITEMS = 1500;
const MAX_AGE_DAYS = 400;
// 已下线的来源：下一轮抓取时把历史自动条目统一清掉，避免云端旧快照把内容带回来
const RETIRED_SOURCES = ["wlgooo-auto", "yxhjgs-auto"];

/* ------------------------------ CLI ------------------------------ */
const argv = process.argv.slice(2);
function flag(name, def) {
  const hit = argv.find(function (a) { return a.indexOf("--" + name + "=") === 0; });
  return hit ? hit.split("=").slice(1).join("=") : def;
}
const OPT = {
  dryRun: argv.includes("--dry-run"),
  noCache: argv.includes("--no-cache"),
  verbose: argv.includes("--verbose"),
  only: flag("only", "") ? flag("only", "").split(",").map(function (x) { return x.trim(); }) : null,
  maxOpus: Number(flag("max-opus", 0)) || null
};

/* ------------------------------ 读写 ------------------------------ */
function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { return fallback; }
}
function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n", "utf8");
}
function loadBaseline() {
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, "data.js"), "utf8"), ctx);
  return ctx.window.HANHUA || { items: [] };
}
function todayISO() { return new Date().toISOString().slice(0, 10); }
function log() { if (OPT.verbose || OPT.dryRun) console.log.apply(console, arguments); }

/* ------------------------------ 缓存 ------------------------------ */
const cache = readJson(path.join(DATA_DIR, "cache.json"), {});
function seenRecently(url, ttlDays) {
  if (OPT.noCache) return false;
  const e = cache[url];
  return !!(e && e.at && Date.now() - e.at < ttlDays * 86400000);
}
function markSeen(url, info) {
  cache[url] = Object.assign({ at: Date.now(), date: todayISO() }, info || {});
}

/* ------------------------------ 请求封装 ------------------------------ */
async function get(url, opts) { return L.getText(url, opts); }
async function getJson(url, opts) { return L.getJson(url, opts); }
function threadDate(html) {
  const s = String(html || "");
  const m = s.match(/(?:发表于|發表於|发表于)[^0-9]{0,10}(20\d{2}[-/]\d{1,2}[-/]\d{1,2})/) ||
            s.match(/"datePublished"\s*:\s*"(20\d{2}-\d{2}-\d{2})/);
  if (m) return L.toISODate(m[1]);
  const cands = (s.match(/20\d{2}[-/]\d{1,2}[-/]\d{1,2}/g) || []).filter(function (d) { return Number(d.slice(0, 4)) >= 2025; });
  return cands.length ? L.toISODate(cands[cands.length - 1]) : todayISO();
}

/* ------------------------------ 各源 dispatch ------------------------------ */
/** B站动态流偶发 -352 风控：优先走更稳的 /x/space/article 专栏列表，再回退动态流 */
async function biliFeed(mid, cookie) {
  try {
    const j = await getJson("https://api.bilibili.com/x/space/article?mid=" + mid + "&pn=1&ps=12", {
      headers: { Cookie: cookie, Referer: "https://space.bilibili.com/" + mid + "/article" }, timeout: 15000
    });
    const list = P.parseBiliArticles(j);
    if (list.length) { log("  · 通过专栏列表接口发现 " + list.length + " 篇汇总"); return list; }
  } catch (e) { log("  · 专栏列表接口不可用：" + e.message); }

  const base = "https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space";
  const variants = [
    "?offset=&host_mid=" + mid + "&timezone_offset=-480&features=itemOpusStyle,listOnlyfans",
    "?offset=&host_mid=" + mid + "&timezone_offset=-480&features=itemOpusStyle",
    "?host_mid=" + mid + "&timezone_offset=-480&features=itemOpusStyle,listOnlyfans"
  ];
  let lastErr = new Error("动态流无汇总专栏");
  for (const q of variants) {
    try {
      const j = await getJson(base + q, {
        headers: { Cookie: cookie, Referer: "https://space.bilibili.com/" + mid + "/dynamic" },
        timeout: 15000
      });
      const list = P.parseBiliFeed(j);
      if (list.length) return list;
      lastErr = new Error("动态流返回 code=" + (j && j.code) + " 或无汇总专栏");
    } catch (e) { lastErr = e; }
    await L.sleep(900);
  }
  throw lastErr;
}

async function runBili(s) {
  let cookie = "";
  try {
    const spi = await getJson("https://api.bilibili.com/x/frontend/finger/spi", { headers: { Referer: "https://www.bilibili.com/" }, timeout: 10000 });
    if (spi && spi.code === 0 && spi.data && spi.data.b_3) {
      cookie = "buvid3=" + spi.data.b_3 + "; buvid4=" + (spi.data.b_4 || "");
    }
  } catch (e) { log("  ! 获取 buvid3 失败（继续尝试）：" + e.message); }

  let list = await biliFeed(s.mid, cookie);
  // 动态流即使被风控，也尽力取一次：它的价值是把 cv 号映射成可读的 opus 号
  let opusByRid = {};
  try {
    const dyn = await getJson("https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space" +
      "?offset=&host_mid=" + s.mid + "&timezone_offset=-480&features=itemOpusStyle,listOnlyfans", {
      headers: { Cookie: cookie, Referer: "https://space.bilibili.com/" + s.mid + "/dynamic" }, timeout: 12000
    });
    P.parseBiliFeed(dyn).forEach(function (d) { if (d.rid) opusByRid[d.rid] = d.id; });
    if (Object.keys(opusByRid).length) log("  · 动态流补充 " + Object.keys(opusByRid).length + " 个 opus 映射");
  } catch (e) { log("  · 动态流不可用（不影响主链路）：" + e.message); }

  const maxOpus = OPT.maxOpus || s.maxOpus || 3;
  const minDate = new Date(Date.now() - (s.lookbackDays || 12) * 86400000).toISOString().slice(0, 10);
  list = list.filter(function (x) { return !x.date || x.date >= minDate; }).slice(0, maxOpus);
  if (!list.length) return { items: [], message: "动态流里没有近 " + (s.lookbackDays || 12) + " 天的汇总专栏" };

  let items = [], used = 0;
  for (const f of list) {
    if (seenRecently(f.url, 2)) { log("  · 已缓存：" + f.title); continue; }
    let html = "";
    const opusId = opusByRid[f.rid] || (/\d{15,}/.test(f.id) ? f.id : "");
    const candidates = [];
    // 专栏列表给的是 cv 号：read/mobile 最稳（read/cv 偶发只返回客户端壳页）
    if (f.rid && !opusId) candidates.push("https://www.bilibili.com/read/mobile?id=" + f.rid);
    candidates.push(f.url);
    if (opusId) {
      candidates.push("https://www.bilibili.com/opus/" + opusId);
      candidates.push("https://m.bilibili.com/opus/" + opusId);
    }
    if (f.rid) candidates.push("https://m.bilibili.com/read/cv" + f.rid);
    for (const u of candidates) {
      // -352 风控页是 HTTP 200 但没有正文，需要按「有没有 <h3>」重试
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const t = (await get(u, { timeout: 18000 })).text;
          if (t.indexOf("<h3") >= 0) { html = t; break; }
        } catch (e) { log("  ! " + u + " -> " + e.message); }
        await L.sleep(650);
      }
      if (html.indexOf("<h3") >= 0) break;
    }
    if (!html || html.indexOf("<h3") < 0) { log("  ! 正文不可读：" + f.title); continue; }
    const parsed = P.parseBiliOpus(html, { src: s.id, url: f.url, date: f.date });
    log("  · " + f.title + " → " + parsed.length + " 条");
    items = items.concat(parsed);
    markSeen(f.url, { count: parsed.length, title: f.title });
    used++;
    await L.sleep(350);
  }
  return { items: items, message: "发现 " + list.length + " 篇汇总，本次解析 " + used + " 篇" };
}

async function runYouxi360(s) {
  const pages = s.maxPages || 2;
  const list = [];
  let okPages = 0;
  for (let i = 1; i <= pages; i++) {
    const url = String(s.url).replace(/-\d+\.html$/, "-" + i + ".html");
    try {
      const html = (await get(url, { timeout: 18000 })).text;
      P.parseYx360List(html, { url: url }).forEach(function (x) {
        if (!list.some(function (y) { return y.url === x.url; })) list.push(x);
      });
      okPages++;
    } catch (e) {
      log("  ! 栏目第 " + i + " 页不可读：" + e.message);
      if (i === 1) throw e; // 首页都拿不到才算整个源失败
    }
    await L.sleep(300);
  }
  const minDate = new Date(Date.now() - (s.lookbackDays || 7) * 86400000).toISOString().slice(0, 10);
  const fresh = list.filter(function (x) { return !x.date || x.date >= minDate; }).slice(0, s.maxPosts || 24);
  const items = [];
  fresh.forEach(function (x) {
    const item = P.parseYx360Title(x.title, {
      src: s.id, url: x.url, date: x.date, excerpt: x.excerpt
    });
    if (item) items.push(item);
  });
  return { items: items, message: "汉化情报栏目 " + okPages + " 页 / " + list.length + " 条，收录近期 " + items.length + " 条" };
}

async function runForumIndex(s) {
  const html = (await get(s.url, { timeout: 18000 })).text;
  const threads = P.parseForumIndex(html, s);
  const items = [];
  let fetched = 0;
  for (const t of threads) {
    if (seenRecently(t.url, 7)) { log("  · 已缓存主题：" + t.title); continue; }
    let body = "";
    try { body = (await get(t.url, { timeout: 15000 })).text; fetched++; } catch (e) { log("  ! 主题不可读：" + e.message); continue; }
    const parsed = P.parseReleaseThread(body, {
      src: s.id, url: t.url, title: t.title,
      cfg: Object.assign({}, s, { date: threadDate(body) })
    });
    parsed.forEach(function (x) { items.push(x); });
    markSeen(t.url, { count: parsed.length, title: t.title });
    await L.sleep(300);
  }
  return { items: items, message: "版块命中 " + threads.length + " 个主题，新解析 " + fetched + " 个" };
}

async function runSummaryThread(s) {
  let html = "";
  try { html = (await get(s.url, { timeout: 18000 })).text; } catch (e) {
    if (s.fallbackUrl) html = (await get(s.fallbackUrl, { timeout: 18000 })).text;
    else throw e;
  }
  const cfg = Object.assign({}, s, { date: threadDate(html) });
  const items = P.parseSummaryThread(html, cfg);
  return { items: items, message: "长帖解析出 " + items.length + " 行候选（去重后才会入库）" };
}

async function runLogThread(s) {
  const html = (await get(s.url, { timeout: 18000 })).text;
  const cfg = Object.assign({}, s, { date: threadDate(html) });
  const items = P.parseLogThread(html, cfg);
  return { items: items, message: "机种日志解析出 " + items.length + " 行候选" };
}

const DISPATCH = {
  bili: runBili, youxi360: runYouxi360, forumIndex: runForumIndex,
  summaryThread: runSummaryThread, logThread: runLogThread
};

/* ------------------------------ 主流程 ------------------------------ */
(async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const baseline = loadBaseline();
  const prev = readJson(path.join(DATA_DIR, "auto.json"), null) || {
    generatedAt: "", sources: [], report: [], items: []
  };

  const baselineNames = {};
  (baseline.items || []).forEach(function (it) { baselineNames[L.namePlatKey(it)] = 1; });
  const seen = {};
  const kept = [];
  // 先保留历史自动条目（有限流 / 过期清理），再合并本次新增
  (prev.items || []).forEach(function (it) {
    if (!L.validItem(it)) return;
    if (RETIRED_SOURCES.indexOf(it.src) >= 0) return;
    if (it.firstSeen && (Date.now() - new Date(it.firstSeen + "T00:00:00Z").getTime()) > MAX_AGE_DAYS * 86400000) return;
    const k = L.itemKey(it);
    if (seen[k]) return;
    seen[k] = 1;
    it.auto = true;
    kept.push(it);
  });

  const report = [];
  const newItems = [];
  const pending = [];
  const enabled = SOURCES.filter(function (s) { return s.enabled !== false && (!OPT.only || OPT.only.indexOf(s.id) >= 0); });
  console.log("开始抓取：" + enabled.length + " 个源 · " + new Date().toISOString());

  for (const s of enabled) {
    const t0 = Date.now();
    let entry = { id: s.id, name: s.name, kind: s.kind, status: "ok", count: 0, message: "", ms: 0 };
    try {
      const res = await DISPATCH[s.kind](s);
      let added = 0, lowConf = 0;
      (res.items || []).forEach(function (it) {
        const k = L.itemKey(it);
        if (seen[k] || baselineNames[L.namePlatKey(it)]) return;
        if (it.confidence < MIN_CONFIDENCE) {
          pending.push(Object.assign({}, it, { srcName: s.name, reason: "置信度 " + it.confidence }));
          lowConf++;
          seen[k] = 1;
          return;
        }
        seen[k] = 1;
        it.auto = true;
        it.firstSeen = todayISO();
        newItems.push(it);
        added++;
      });
      entry.count = added;
      entry.message = res.message + (lowConf ? " · " + lowConf + " 条进入待审" : "");
      if (!added && res.message.indexOf("失败") >= 0) entry.status = "warn";
      console.log("  ✓ " + s.id + "：新增 " + added + " 条 · " + entry.message);
    } catch (e) {
      entry.status = "error";
      entry.message = e && e.message ? e.message : String(e);
      console.log("  ✗ " + s.id + "：" + entry.message);
    }
    entry.ms = Date.now() - t0;
    report.push(entry);
  }

  const all = kept.concat(newItems);
  // 超出上限时优先保留最新的
  let items = all;
  if (items.length > MAX_AUTO_ITEMS) {
    items = items.slice().sort(function (a, b) {
      return (b.firstSeen || b.d || "").localeCompare(a.firstSeen || a.d || "");
    }).slice(0, MAX_AUTO_ITEMS);
  }
  // 写盘前统一复洗：连历史条目的备注也按最新合规规则清理一遍
  // 同时把「通过哪个网盘渠道发布」结构化成 pan 字段；只存渠道名与是否需提取码，
  // 链接 / 提取码 / 文件名一律不落地。
  items = items.map(function (it) {
    // 已下线来源的字样也可能出现在别的源的汉化者署名里（如「飞眼&围炉Go」），写盘前一并清掉
    const g = String(it.g || "")
      .replace(/[&＆]?\s*围炉\s*Go\s*/gi, "")
      .replace(/^[&＆\s、,，]+|[&＆\s、,，]+$/g, "")
      .trim().slice(0, 30);
    const note = L.sanitizeNote(it.note);
    const probe = String(it.note || "") + " " + note;
    const detected = L.detectPanChannels(probe);
    // 历史条目的原始文本在上一轮已被清洗掉，渠道名无法还原；
    // 这时保留上一轮已经识别出的 pan，避免每轮复洗把标注冲掉。
    const prevPan = Array.isArray(it.pan) ? it.pan.filter(function (v) {
      return typeof v === "string" && v.length <= 12 && !/https?:|\/|\d/.test(v);
    }) : [];
    return Object.assign({}, it, {
      g: g,
      note: note,
      pan: detected.length ? detected : prevPan,
      panCode: L.hasPanCode(probe) || it.panCode === true
    });
  }).filter(function (it) { return L.validItem(it); });

  const generatedAt = new Date().toISOString();
  const payload = {
    generatedAt: generatedAt,
    asOf: generatedAt.slice(0, 10),
    minConfidence: MIN_CONFIDENCE,
    note: "由 scripts/fetch.js 自动抓取生成。仅索引发布者原始页面，不含 ROM / ISO / 网盘直链。pan 只记录发布页标注的网盘渠道名，panCode 只标记是否需要提取码，均不含链接、提取码取值或文件名。日期性质：pub=明确发布日，list=汇总/检索日，ver=版本日期码。",
    sources: enabled.map(function (s) { return sourceDescriptor(s, generatedAt); }),
    report: report,
    stats: {
      totalAutoItems: items.length,
      newThisRun: newItems.length,
      pendingReview: pending.length,
      sourcesOk: report.filter(function (r) { return r.status === "ok"; }).length,
      sourcesError: report.filter(function (r) { return r.status === "error"; }).length,
      elapsedMs: report.reduce(function (a, r) { return a + r.ms; }, 0),
      panChannelItems: items.filter(function (it) { return it.pan && it.pan.length; }).length,
      panBaidu: items.filter(function (it) { return (it.pan || []).indexOf("百度网盘") >= 0; }).length,
      panQuark: items.filter(function (it) { return (it.pan || []).indexOf("夸克网盘") >= 0; }).length,
      panWithCode: items.filter(function (it) { return it.panCode === true; }).length
    },
    items: items
  };

  console.log("—— 合计：本次新增 " + newItems.length + " 条，自动索引共 " + items.length + " 条，待审 " + pending.length + " 条，失败源 " + payload.stats.sourcesError + " 个");
  console.log("—— 网盘渠道情报：标注 " + payload.stats.panChannelItems + " 条（百度 " + payload.stats.panBaidu + " / 夸克 " + payload.stats.panQuark + "），含提取码 " + payload.stats.panWithCode + " 条；链接与提取码均未入库");

  if (!OPT.dryRun) {
    writeJson(path.join(DATA_DIR, "auto.json"), payload);
    fs.writeFileSync(path.join(ROOT, "auto-data.js"),
      "/* 自动生成，请勿手改；由 scripts/fetch.js 写入。 */\n" +
      "window.HANHUA_AUTO = " + JSON.stringify(payload).replace(/<\//g, "<\\/") + ";\n", "utf8");
    writeJson(path.join(DATA_DIR, "report.json"), report);
    writeJson(path.join(DATA_DIR, "pending.json"), pending);
    writeJson(path.join(DATA_DIR, "cache.json"), cache);
    console.log("已写入 data/auto.json、auto-data.js、data/report.json、data/pending.json、data/cache.json");
  } else {
    console.log("（--dry-run：未写文件）");
  }

  // GitHub Actions 作业摘要
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile && !OPT.dryRun) {
    const lines = [
      "## 复古汉化发布台 · 定时抓取", "",
      "- 生成时间：" + generatedAt,
      "- 自动索引条目：**" + items.length + "**（本次新增 " + newItems.length + "）",
      "- 待人工复核：" + pending.length + " · 失败源：" + payload.stats.sourcesError,
      "- 网盘渠道情报：标注 **" + payload.stats.panChannelItems + "** 条（百度 " + payload.stats.panBaidu + " / 夸克 " + payload.stats.panQuark + "），含提取码 " + payload.stats.panWithCode + " 条；仅渠道名，不含链接与提取码", "",
      "| 数据源 | 状态 | 新增 | 说明 |", "| --- | --- | ---: | --- |"
    ];
    report.forEach(function (r) {
      lines.push("| " + r.id + " | " + (r.status === "ok" ? "✅" : r.status === "warn" ? "⚠️" : "❌") + " | " + r.count + " | " + String(r.message).replace(/\|/g, "\\|") + " |");
    });
    try { fs.appendFileSync(summaryFile, lines.join("\n") + "\n"); } catch (e) { /* noop */ }
  }

  if (payload.stats.sourcesError === report.length && report.length > 0) process.exitCode = 1;
})().catch(function (e) {
  console.error("抓取管线异常：" + (e && e.stack ? e.stack : e));
  process.exitCode = 1;
});
