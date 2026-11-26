/* ============================================================================
 * 复古汉化发布台 · 各来源解析器
 * 全部是纯函数（输入 HTML / JSON 字符串或对象，输出条目数组），便于离线自测。
 * 输出字段与 data.js 一致，额外带 confidence 供质量闸门使用。
 * ==========================================================================*/
"use strict";

const L = require("./lib");
const {
  tidy, cleanName, textOf, linesOf, toISODate, detectAI, detectVersion,
  detectPlatform, safeIndexUrl, sanitizeNote, absoluteUrl, scoreItem, validItem
} = L;

const BAD_FORUM_LINE = /发表于|最后由|编辑|版权|登录|注册|回复|引用|举报|积分|威望|沙发|板凳|楼层|禁止|免责|谢谢|感谢以下|提取码|pan\.|http|www\.|Powered|Discuz|Archiver|返回列表|上一页|下一页|只看该作者|复制链接|当前离线|设为首页|快捷导航|汉化游戏更新日志|统计（|建议大家到|本信息根据|完整模拟器汉化游戏信息|APP下载|夸克链接|百度链接|热门游戏|专区|导航|点此|点击|收藏|社区|论坛首页|Processed in|queries|second\(s\)|Gzip|页面执行/;
const LANG_TAG = /^(?:简|繁|英|日|韩|多语|官中|美版|日版|欧版|亚版|简体|繁体|中文语音|国语配音|简&|繁&|[\d.]+)/;

function tsToDate(ts) {
  const n = Number(ts || 0);
  if (!n) return "";
  try { return new Date(n * 1000).toISOString().slice(0, 10); } catch (e) { return ""; }
}

function baseItem(raw, ctx) {
  const it = {
    n: tidy(raw.n), p: String(raw.p || "").toUpperCase(),
    d: toISODate(raw.d || ""), t: raw.t || "",
    g: tidy(raw.g || ""), ai: raw.ai === true ? true : null,
    v: String(raw.v || "").trim().slice(0, 20), k: raw.k === "catalog" ? "catalog" : "release",
    src: raw.src || "", u: safeIndexUrl(raw.u), dl: "",
    note: sanitizeNote(tidy(raw.note || "").slice(0, 220))
  };
  if (it.d && !it.t) it.t = "pub";
  if (!it.d) it.t = "";
  it.confidence = scoreItem(it, ctx || {});
  return validItem(it) ? it : null;
}

/* ------------------------------ B站：作者动态流 ------------------------------ */
/** 从 /x/polymer/web-dynamic/v1/feed/space 里挑出「汉化情报汇总」专栏 */
function parseBiliFeed(json) {
  if (!json || json.code !== 0 || !json.data || !Array.isArray(json.data.items)) return [];
  const out = [];
  json.data.items.forEach(function (it) {
    const mod = it.modules || {};
    const major = (mod.module_dynamic || {}).major || {};
    const opus = major.opus || major.article || null;
    if (!opus || !opus.title) return;
    if (!/汉化情报汇总/.test(opus.title)) return;
    const author = mod.module_author || {};
    const id = it.id_str || (String(opus.jump_url || "").match(/\d{15,}/) || [])[0];
    if (!id) return;
    const title = tidy(opus.title);
    // 汇总标题自带日期（如「2026-11-25 汉化情报汇总」），比动态时间戳更可靠
    const td = (title.match(/(20\d{2}-\d{1,2}-\d{1,2})/) || [])[1];
    out.push({
      id: id,
      rid: (it.basic || {}).rid_str || "",
      title: title,
      date: td ? toISODate(td) : tsToDate(author.pub_ts),
      url: "https://www.bilibili.com/opus/" + id
    });
  });
  const seen = {};
  return out.filter(function (x) { if (seen[x.id]) return false; seen[x.id] = 1; return true; });
}

/** 解析每日专栏正文：<h3>【平台】游戏名（作者）</h3> + 字段块 + 原始视频地址 */
function parseBiliOpus(html, meta) {
  meta = meta || {};
  let body = String(html || "");
  const start = body.indexOf("<h3");
  if (start < 0) return [];
  body = body.slice(start);
  // 正文之后的初始状态 JSON / 评论区会重复出现标题，先截断
  ["__INITIAL_STATE__", "<script", "opus-detail-footer", "comment-module"].forEach(function (mark) {
    const i = body.indexOf(mark);
    if (i > 0) body = body.slice(0, i);
  });
  const heads = Array.from(body.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/g));
  const out = [];
  heads.forEach(function (hm, i) {
    const end = i + 1 < heads.length ? heads[i + 1].index : body.length;
    const section = body.slice(hm.index + hm[0].length, end).split("<script")[0];
    const heading = tidy(textOf(hm[1]));
    const secText = textOf(section);
    if (!heading || heading.length > 120) return;

    const explicit = /[【\[][^】\]]{1,14}[】\]]/.test(heading);
    const p = detectPlatform(heading, meta.platform || "其他");

    let h = heading.replace(/[【\[][^】\]]{1,14}[】\]]/g, " ");
    let parenAuthor = "";
    const pm = h.match(/[（(]([^）)]{1,36})[）)]\s*$/);
    if (pm) { parenAuthor = tidy(pm[1]); h = h.slice(0, pm.index); }
    const n = cleanName(h);
    if (!n) return;

    const am = secText.match(/汉化发布者[：:]\s*([^\n]{1,40})/);
    const g = tidy(am ? am[1] : parenAuthor).replace(/^汉化组[：:]\s*/, "");

    const dm = secText.match(/发布日期[：:]\s*(20\d{2}-\d{1,2}-\d{1,2})/);
    const date = dm ? toISODate(dm[1]) : "";

    const vm = section.match(/https?:\/\/(?:www\.|m\.)?bilibili\.com\/video\/(BV[0-9A-Za-z]+)/i);
    const u = vm ? "https://www.bilibili.com/video/" + vm[1] : safeIndexUrl(meta.url);

    // 视频简介：跳过字段行，取前若干句作为备注
    const lines = secText.split("\n").map(function (x) { return tidy(x); }).filter(Boolean);
    const bodyLines = lines.filter(function (x) {
      return !/^(英文名|英文名[：:]|开发商|发行商|汉化发布者|消息提供|发布日期|原始地址|【视频简介】|https?:)/.test(x) &&
        !/^\d+\s*[.、]$/.test(x) && x.length > 2;
    });
    let note = sanitizeNote(bodyLines.slice(0, 8).join(" ")).slice(0, 200).replace(/［[^\]]*$/, "");
    if (note) note = "视频简介：" + note;
    if (!note && parenAuthor) note = "每日汉化情报汇总收录条目，原始地址见发布页。";

    const ai = detectAI(secText);
    const item = baseItem({
      n: n, p: p, d: date || meta.date || "", t: date ? "pub" : "list",
      g: g, ai: ai, v: detectVersion(heading + " " + secText.slice(0, 600)),
      k: "release", src: meta.src, u: u, note: note
    }, { permalink: !!vm, explicitPlatform: explicit });
    if (item) out.push(item);
  });
  return out;
}

/**
 * 备用的专栏列表接口 /x/space/article：比动态流稳定，直接给出 cv 号与标题。
 * 动态流被 -352 风控时靠它继续发现每日汇总。
 */
function parseBiliArticles(json) {
  if (!json || json.code !== 0 || !json.data || !Array.isArray(json.data.articles)) return [];
  const out = [];
  json.data.articles.forEach(function (a) {
    const title = tidy(a.title || "");
    if (!/汉化情报汇总/.test(title) || !a.id) return;
    const td = (title.match(/(20\d{2}-\d{1,2}-\d{1,2})/) || [])[1];
    out.push({
      id: String(a.id), rid: String(a.id), title: title,
      date: td ? toISODate(td) : tsToDate(a.publish_time),
      url: "https://www.bilibili.com/read/cv" + a.id
    });
  });
  const seen = {};
  return out.filter(function (x) { if (seen[x.id]) return false; seen[x.id] = 1; return true; });
}

/* ------------------------------ 资讯站：围炉Go ------------------------------ */
function parseWlList(html, meta) {
  meta = meta || {};
  const blocks = String(html || "").match(/<article[\s\S]*?<\/article>/g) || [];
  const out = [];
  blocks.forEach(function (b) {
    const hm = b.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/);
    const title = tidy(textOf(hm ? hm[1] : ""));
    if (!title || !/汉化/.test(title)) return;
    let url = "";
    const links = Array.from(b.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g));
    for (const l of links) {
      const abs = absoluteUrl(l[1], meta.url);
      if (/\/\d+\.html$/.test(abs)) { url = abs; break; }
    }
    if (url && !out.some(function (x) { return x.url === url; })) out.push({ title: title, url: url });
  });
  return out;
}
function parseWlPost(html) {
  const s = String(html || "");
  const dm = s.match(/"datePublished"\s*:\s*"(20\d{2}-\d{2}-\d{2})/);
  let body = s;
  const a = s.indexOf("<article");
  if (a > 0) {
    const b = s.indexOf("</article>", a);
    body = b > a ? s.slice(a, b) : s.slice(a, a + 40000);
  }
  const text = linesOf(body).filter(function (x) {
    return x.length > 14 && !/^(?:og:|https?:|<|文章导航|上一篇|下一篇)/.test(x);
  }).slice(0, 12).join(" ").slice(0, 500);
  return { date: dm ? toISODate(dm[1]) : "", text: text };
}
/** 标题形如「GBA火焰纹章：魂缚之森[汉化] - 附攻略，…」 */
function parseWlTitle(title, meta) {
  meta = meta || {};
  let t = tidy(title).replace(/\s*-\s*[^-]{0,40}(?:围炉Go|游戏年代).*$/i, "");
  const explicit = /[【\[][^】\]]{1,14}[】\]]|^(?:PS2|PS1|PSP|PS3|PSV|SFC|FC|MD|SS|GBA|GBC|GB|NDS|3DS|N64|NGC|DC|PCE|WSC|WS|NS|Switch|PS)/i.test(t);
  const p = detectPlatform(t, "其他");
  const vm = t.match(/\[(\d+(?:\.\d+)+)汉化\]/i);
  const version = vm ? vm[1] : detectVersion(t);
  // 去掉首个 " - " 之后的副标题、去掉 [汉化]/[1.01汉化] 标记
  let n = t.split(/\s+-\s+/)[0].replace(/\[[^\]]{0,20}(?:汉化|中文)[^\]]{0,20}\]/gi, " ").replace(/[【\[][^】\]]{1,14}[】\]]/g, " ");
  n = cleanName(n);
  const headTok = (n.match(/^([A-Za-z0-9]{2,8})/) || [])[1];
  if (headTok && L.normalizePlatform(headTok) === p) n = cleanName(n.slice(headTok.length));
  if (!n || n.length < 2) return null;
  return baseItem({
    n: n, p: p, d: meta.date || "", t: meta.date ? "list" : "",
    g: "", ai: meta.ai || null, v: version, k: "release", src: meta.src,
    u: meta.url, note: meta.note || ("栏目条目：" + tidy(title).slice(0, 120))
  }, { permalink: true, explicitPlatform: explicit });
}

/* ------------------------------ 论坛：新版列表 ------------------------------ */
function parseForumIndex(html, cfg) {
  const base = cfg.url;
  const links = Array.from(String(html || "").matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g));
  const out = [];
  links.forEach(function (l) {
    const title = tidy(textOf(l[2]));
    if (title.length < 5 || title.length > 90) return;
    if (!cfg.titleInclude.test(title)) return;
    if (cfg.titleExclude && cfg.titleExclude.test(title)) return;
    const abs = absoluteUrl(l[1], base);
    if (!abs || !cfg.threadUrl.test(abs)) return;
    if (out.some(function (x) { return x.url === abs; })) return;
    out.push({ title: title, url: abs });
  });
  return out.slice(0, cfg.maxThreads || 8);
}

/** 单个「汉化发布」主题帖 → 一条索引 */
function parseReleaseThread(html, meta) {
  const cfg = meta.cfg || {};
  const s = String(html || "");
  const tm = s.match(/<title>([\s\S]*?)<\/title>/i);
  const rawTitle = tidy(meta.title || (tm ? textOf(tm[1]) : ""));
  const title = tidy(rawTitle.replace(/\s*[-–—|]\s*[^|]*?(?:论坛|社区|A9VG|Stage1st|Powered|电玩部落).*$/i, ""));
  if (!title) return [];

  const explicit = /[【\[][^】\]]{1,14}[】\]]/.test(title) || detectPlatform(title, "") !== "其他";
  const p = detectPlatform(title, cfg.platform || "其他");
  const book = title.match(/《([^》]{1,50})》/);
  let n;
  if (book) n = cleanName(book[1]);
  else {
    n = cleanName(title
      .replace(/[【\[][^】\]]{0,16}[】\]]/g, " ")
      .replace(/(?:PS2|PS1|PSP|PS3|PSV|SFC|FC|MD|SS|GBA|GBC|NDS|3DS|N64|NGC|DC|NS|Switch)\s*游戏/gi, " ")
      .replace(/(?:简体中文|繁体中文|简中|繁中|汉化|中文)?\s*(?:补丁|版)?\s*(?:发布|测试版|公测版|正式版)?\s*(?:v?\d+(?:\.\d+)+)?\s*$/i, " "));
  }
  if (!n || n.length < 2) return [];

  const txt = textOf(s);
  let date = "";
  const dm = txt.match(/发表于[^0-9]{0,8}(20\d{2}[-/]\d{1,2}[-/]\d{1,2})/) ||
             s.match(/"datePublished"\s*:\s*"(20\d{2}-\d{2}-\d{2})/) ||
             s.match(/authorposton[^>]*>\s*发表于[^0-9]{0,8}(20\d{2}[-/]\d{1,2}[-/]\d{1,2})/);
  if (dm) date = toISODate(dm[1]);
  const ai = detectAI(txt.slice(0, 16000));
  const all = linesOf(s);
  const marker = all.findIndex(function (x) { return /发表于\s*20\d{2}[-/]|發表於\s*20\d{2}[-/]/.test(x); });
  const pool = marker >= 0 ? all.slice(marker + 1, marker + 14) : all;
  const bodyLines = pool.filter(function (x) {
    return x.length > 8 && x.length < 200 && !BAD_FORUM_LINE.test(x) &&
      x !== title && x !== rawTitle && !rawTitle.includes(x) &&
      !/[›»]/.test(x) && !/^<|iframe|^https?:|论坛首页|返回列表|快捷导航|当前离线|只看该作者/.test(x);
  });
  let note = (bodyLines.find(function (x) { return /GPT|汉化|测试|发布|补丁|中文|字库|文本/.test(x); }) || bodyLines[0] || "").slice(0, 170);
  if (date) note = "论坛发布帖（发帖日 " + date + "）：" + (note || tidy(title));
  const isRelease = /发布|补丁|汉化/.test(title);
  const item = baseItem({
    n: n, p: p, d: date, t: date ? (isRelease ? "pub" : "list") : "",
    g: tidy(cfg.author || ""), ai: ai,
    v: detectVersion(title), k: "release", src: meta.src, u: meta.url,
    note: note || tidy(title)
  }, { permalink: true, explicitPlatform: explicit });
  return item ? [item] : [];
}

/* ------------------------------ 论坛：汇总长帖（逐行） ------------------------------ */
function parseSummaryThread(html, cfg) {
  const lines = linesOf(html);
  let plat = cfg.platform || "其他";
  const out = [];
  function push(name, author, desc) {
    const n = cleanName(name);
    if (!n || n.length < 2) return;
    const line = name + " " + author + " " + desc;
    const item = baseItem({
      n: n, p: plat, d: "", t: "",
      g: tidy(String(author).replace(/^汉化组[：:]\s*/, "")),
      ai: detectAI(line), v: detectVersion(line), k: "catalog", src: cfg.id,
      u: cfg.url, note: tidy(desc).slice(0, 170)
    }, { permalink: false, explicitPlatform: !!cfg.platform });
    if (item) out.push(item);
  }
  lines.forEach(function (raw) {
    const line = tidy(raw);
    if (line.length < 6 || line.length > 120) return;
    if (/汉化游戏汇总|新汉化游戏汇总|^平台[：:]|^机种\d+/.test(line) && !line.includes("《")) {
      const p = detectPlatform(line, "");
      if (p && p !== "其他") plat = p;
      return;
    }
    if (BAD_FORUM_LINE.test(line)) return;
    let m = line.match(/^《([^》]{1,50})》\s*[（(]?\s*汉化组[：:]\s*([^）)]{1,40})[）)]?\s*[——\-–]{1,}\s*(.*)$/);
    if (m) { push(m[1], m[2], m[3]); return; }
    m = line.match(/^(.{2,45}?)\s+——\s+(.{2,45}?)\s+——\s*(.*)$/);
    if (m) { push(m[1], m[2], m[3]); return; }
    m = line.match(/^《([^》]{1,50})》\s*[——\-–]{1,}\s*(.*)$/);
    if (m) { push(m[1], "", m[2]); return; }
  });
  return out;
}

/* ------------------------------ 论坛：机种更新日志 ------------------------------ */
function parseLogThread(html, cfg) {
  const lines = linesOf(html);
  let plat = cfg.platform || "其他";
  const out = [];
  lines.forEach(function (raw) {
    const line = tidy(raw);
    if (/^机种\d+[：:]/.test(line)) {
      const p = detectPlatform(line, "");
      if (p && p !== "其他") plat = p;
      return;
    }
    if (line.length < 4 || line.length > 100 || BAD_FORUM_LINE.test(line)) return;
    if (/更新日志|^（更新\d+款）$|^\d{4}[.\/年]/.test(line)) return;
    // 没有「机种」小标题统领的行通常是导航或残留文本，直接丢弃
    if (!plat || plat === "其他") return;
    // 日志行必有版本 / 语言 / 汉化者标记，借此过滤导航与小标题
    if (!/[（(\[][^）)\]]{1,30}[）)\]]/.test(line)) return;

    const groups = Array.from(line.matchAll(/[（(\[]([^）)\]]*)[）)\]]/g)).map(function (m) { return tidy(m[1]); });
    let author = "";
    const authorCands = groups.filter(function (g) {
      return g.length >= 2 && !LANG_TAG.test(g) && !/^v?\d+(\.\d+)*$/.test(g) && /[A-Za-z\u3400-\u9fff]/.test(g);
    });
    if (authorCands.length) author = authorCands.sort(function (a, b) { return b.length - a.length; })[0];
    let n = line.replace(/\s*[（(\[][^）)\]]*[）)\]]\s*/g, " ").replace(/_/g, " ")
      .replace(/\s+v?\d+(?:\.\d+)+[a-zA-Z]?\s*$/i, " ")
      .replace(/\s*\.[A-Za-z0-9]{2,5}\s*$/i, " ");
    n = cleanName(n);
    if (!n || n.length < 2) return;
    const item = baseItem({
      n: n, p: plat, d: "", t: "",
      g: author, ai: detectAI(line), v: detectVersion(line), k: "catalog",
      src: cfg.id, u: cfg.url, note: "论坛机种更新日志条目；原帖按月追加，未逐条标注发布日期。"
    }, { permalink: false, explicitPlatform: !!plat && plat !== "其他" });
    if (item) out.push(item);
  });
  return out;
}

/* ------------------------------ 通用 RSS（备选源） ------------------------------ */
function parseRss(xml, cfg) {
  cfg = cfg || {};
  const items = Array.from(String(xml || "").matchAll(/<item[\s\S]*?<\/item>/gi));
  const out = [];
  items.forEach(function (m) {
    const block = m[0].replace(/<!\[CDATA\[|\]\]>/g, "");
    const title = tidy(textOf((block.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || ""));
    const url = tidy((block.match(/<link>([\s\S]*?)<\/link>/i) || [])[1] || "");
    const date = toISODate((block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i) || [])[1] || "");
    if (!title || !url || !/汉化|中文化|补丁/.test(title)) return;
    const item = parseWlTitle(title, {
      src: cfg.id, url: safeIndexUrl(url), date: date, ai: null,
      note: "RSS 条目（" + tidy(title).slice(0, 100) + "）"
    });
    if (item) out.push(item);
  });
  return out;
}

module.exports = {
  parseBiliFeed, parseBiliArticles, parseBiliOpus, parseWlList, parseWlPost, parseWlTitle,
  parseForumIndex, parseReleaseThread, parseSummaryThread, parseLogThread, parseRss,
  tsToDate, baseItem
};
