/* ============================================================================
 * 复古汉化发布台 · 抓取公共库（Node 18+，零第三方依赖）
 * 只做索引：不下载 ROM / ISO / 镜像，不采集网盘直链。
 * ==========================================================================*/
"use strict";

const crypto = require("crypto");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

/** 带超时 / 重试 / 统一 UA 的文本请求 */
async function getText(url, opts) {
  opts = opts || {};
  const headers = Object.assign({
    "User-Agent": UA,
    "Accept": "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.6"
  }, opts.headers || {});
  if (!headers.Referer) {
    try { headers.Referer = new URL(url).origin + "/"; } catch (e) { /* noop */ }
  }
  const retries = opts.retries == null ? 1 : opts.retries;
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    const ctl = new AbortController();
    const timer = setTimeout(function () { ctl.abort(); }, opts.timeout || 15000);
    try {
      const res = await fetch(url, { headers: headers, signal: ctl.signal, redirect: "follow" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const text = await res.text();
      return { text: text, status: res.status, url: res.url || url };
    } catch (e) {
      lastErr = e;
      if (i < retries) await sleep(700 * (i + 1));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr || new Error("请求失败");
}

async function getJson(url, opts) {
  const o = Object.assign({}, opts || {});
  o.headers = Object.assign({ Accept: "application/json, text/plain, */*" }, (opts || {}).headers || {});
  const r = await getText(url, o);
  try { return JSON.parse(r.text); } catch (e) { throw new Error("返回内容不是 JSON：" + r.text.slice(0, 80)); }
}

/* ------------------------------ HTML / 文本 ------------------------------ */
const ENTITIES = {
  "&nbsp;": " ", "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"',
  "&apos;": "'", "&#39;": "'", "&rsaquo;": "›", "&laquo;": "«", "&raquo;": "»",
  "&hellip;": "…", "&mdash;": "—", "&ndash;": "–", "&middot;": "·", "&times;": "×"
};
function decode(s) {
  return String(s == null ? "" : s)
    .replace(/&#(\d+);/g, function (_, n) { return String.fromCharCode(Number(n)); })
    .replace(/&(?:nbsp|amp|lt|gt|quot|apos|#39|rsaquo|laquo|raquo|hellip|mdash|ndash|middot|times);/g, function (m) { return ENTITIES[m] || m; });
}

/** 保留块级换行、去掉行内标签，得到近似渲染后的纯文本 */
function textOf(html) {
  return decode(String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/?(?:br|p|div|li|h[1-6]|tr|td|th|blockquote|section|article|ul|ol|table)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/[\u200b\u200c\u200d\ufeff]/g, "")
    .replace(/[ \t\u00a0]+/g, " "))
    .replace(/\n{3,}/g, "\n\n");
}
function linesOf(html) {
  return textOf(html).split("\n").map(function (x) { return x.trim(); }).filter(Boolean);
}
function firstLine(html) {
  const a = linesOf(html);
  return a.length ? a[0] : "";
}

/* ------------------------------ 平台识别 ------------------------------ */
const PLATFORM_TOKENS = [
  ["PLAYSTATION 2", "PS2"], ["PS2", "PS2"], ["PS 2", "PS2"],
  ["PLAYSTATION 1", "PS1"], ["PS1", "PS1"], ["PSX", "PS1"],
  ["PSP", "PSP"], ["PS3", "PS3"], ["PSVITA", "PSV"], ["PSV", "PSV"],
  ["SUPER FAMICOM", "SFC"], ["SNES", "SFC"], ["SFC", "SFC"], ["超任", "SFC"],
  ["FAMICOM", "FC"], ["NES", "FC"], ["FC", "FC"], ["红白机", "FC"],
  ["MD32X", "MD32X"], ["32X", "MD32X"],
  ["MEGA DRIVE", "MD"], ["GENESIS", "MD"], ["世嘉五代", "MD"], ["世嘉MD", "MD"], ["MD", "MD"],
  ["SEGA SATURN", "SS"], ["SATURN", "SS"], ["土星", "SS"], ["世嘉SS", "SS"], ["SS", "SS"],
  ["GAME BOY ADVANCE", "GBA"], ["GBA", "GBA"],
  ["GAME BOY COLOR", "GBC"], ["GBC", "GBC"], ["GAME BOY", "GB"], ["GB", "GB"],
  ["NINTENDO DS", "NDS"], ["NDS", "NDS"], ["3DS", "3DS"],
  ["NINTENDO 64", "N64"], ["N64", "N64"],
  ["GAMECUBE", "NGC"], ["NGC", "NGC"], ["GCN", "NGC"], ["NGC", "NGC"],
  ["DREAMCAST", "DC"], ["世嘉DC", "DC"], ["DC", "DC"],
  ["PC ENGINE CD", "PCE"], ["PC ENGINE", "PCE"], ["PCE CD", "PCE"], ["PCE", "PCE"],
  ["PC98", "PC98"], ["PC88", "PC88"], ["日电PC98", "PC98"], ["日电PC88", "PC88"],
  ["WONDER SWAN COLOR", "WSC"], ["万代WSC", "WSC"], ["WSC", "WSC"],
  ["WONDER SWAN", "WS"], ["万代WS", "WS"], ["WS", "WS"],
  ["NEOGEO CD", "NGCD"], ["NEO GEO CD", "NGCD"], ["NEOGEO", "NGCD"],
  ["MASTER SYSTEM", "MS"], ["MS", "MS"],
  ["NINTENDO SWITCH", "Switch"], ["SWITCH", "Switch"], ["NS", "Switch"],
  ["WIIU", "WiiU"], ["WII U", "WiiU"], ["WII", "Wii"],
  ["XBOX", "Xbox"], ["微软XBOX", "Xbox"],
  ["PS", "PS1"], ["PC", "PC"], ["ANDROID", "Android"], ["安卓", "Android"]
];
function normalizePlatform(token) {
  const t = String(token || "").trim().toUpperCase().replace(/[\s_]+/g, " ").replace(/[【】\[\]（）()]/g, "");
  if (!t) return "";
  for (const pair of PLATFORM_TOKENS) {
    if (t === pair[0]) return pair[1];
  }
  return "";
}
/** 从标题/正文推断平台，优先级：显式方括号 > 开头机型前缀 > 全文关键词 > 兜底 */
function detectPlatform(text, fallback) {
  const s = String(text || "");
  const bracket = s.match(/[【\[（(]\s*([A-Za-z0-9 \+\.／/]{2,14})\s*[】\]）)]/);
  if (bracket && normalizePlatform(bracket[1])) return normalizePlatform(bracket[1]);
  const head = s.match(/^\s*(?:机种\d+[：:]\s*)?([A-Za-z0-9 \+\.]{2,12})/);
  if (head && normalizePlatform(head[1])) return normalizePlatform(head[1]);
  const upper = s.toUpperCase();
  for (const pair of PLATFORM_TOKENS) {
    const re = new RegExp("(^|[^A-Z0-9])" + pair[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([^A-Z0-9]|$)");
    if (re.test(upper)) return pair[1];
  }
  return fallback || "其他";
}

/* ------------------------------ 字段识别 ------------------------------ */
const AI_RE = /(?:^|[^A-Za-z])(?:AI|ＡＩ)\s*(?:汉化|翻译|辅助|润色|机翻|工作流|配音|本地化)|\bGPT-?[\d.]*|\bClaude\b|\bGemini\b|\bDeep\s*[Ss]eek\b|大模型|\bLLM\b|WorkBuddy|混元|机器翻译/i;
const AI_BOILERPLATE = /每日全自动化生成|本信息根据汉化群友消息/i;
function detectAI(text) {
  const s = String(text || "").replace(AI_BOILERPLATE, " ");
  return AI_RE.test(s) ? true : null;
}

function detectVersion(text) {
  const s = String(text || "");
  let m = s.match(/\bv\d+(?:\.\d+){0,3}[a-zA-Z]?\b/i) ||
          s.match(/[（(\[]\s*v?\d+\.\d+(?:\.\d+)?[^\]）)]{0,8}[）)\]]/) ||
          s.match(/(\d+\.\d+(?:\.\d+)?)\s*汉化/);
  if (m) return String(m[0]).replace(/^[（(\[]|[）)\]]$/g, "").trim().slice(0, 20);
  if (/测试版|公测版|体验版|预览版/.test(s)) return "测试版";
  return "";
}

/** 只接受规范日期，避免把「原作发售日 1992年10月30日」误当汉化发布日 */
function toISODate(text) {
  const s = String(text || "");
  let m = s.match(/(20\d{2})[-/.年](\d{1,2})[-/.月](\d{1,2})/);
  if (!m) {
    m = s.match(/(20\d{2})(\d{2})(\d{2})(?:\D|$)/);
    if (m) return [m[1], m[2], m[3]].join("-");
    return "";
  }
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
  const now = new Date();
  if (y < 2000 || y > now.getUTCFullYear() + 1 || mo < 1 || mo > 12 || d < 1 || d > 31) return "";
  return m[1] + "-" + String(mo).padStart(2, "0") + "-" + String(d).padStart(2, "0");
}

function tidy(s) {
  return decode(String(s == null ? "" : s))
    .replace(/[\u200b\u200c\u200d\ufeff]/g, "")
    .replace(/\s+/g, " ")
    .replace(/^[0-9]{1,3}[\.、\)]\s*/, "")
    .replace(/^[\s\-–—:：·|｜]+/, "")
    .replace(/[\s\-–—:：·|｜,，。;；]+$/, "")
    .trim();
}
function cleanName(s) {
  return tidy(String(s || "")
    .replace(/[《》]/g, "")
    .replace(/[【\[（(][^】\]）)]{0,18}[】\]）)]/g, " ")
    .replace(/\s+(?:汉化|简体中文|中文版|简中|繁中|补丁|发布|汉化版|汉化发布|测试版)\s*$/i, ""))
    .slice(0, 60);
}

/** 合规：只允许指向发布者页面 / 开源仓库，绝不收录网盘或镜像直链 */
const BLOCKED_URL = /pan\.(baidu|quark|xunlei)|lanzou|123pan|aliyundrive|\.iso($|\?)|\.rom($|\?)|magnet:|thunder:|ed2k:/i;
function safeIndexUrl(u) {
  const s = String(u || "").trim();
  if (!/^https?:\/\//i.test(s) || BLOCKED_URL.test(s)) return "";
  return s.replace(/[\u200b\u200c\u200d\ufeff]/g, "");
}
function absoluteUrl(href, base) {
  try { return new URL(String(href).replace(/&amp;/g, "&"), base).toString(); } catch (e) { return ""; }
}

/** 备注里也不保留网盘直链 / 提取码 / 镜像地址，只提示回到原发布页 */
function sanitizeNote(text) {
  return String(text || "")
    .replace(/https?:\/\/[^\s<>"'）)]*(?:pan\.baidu|pan\.quark|quark\.cn|lanzou|123pan|aliyundrive|pan\.xunlei)[^\s<>"'）)]*/gi, "［网盘链接已省略，见原发布页］")
    .replace(/(?:https?:\/\/)?[^\s<>"']{0,30}(?:baidu\.com|quark\.cn|lanzou|123pan|aliyundrive)[^\s<>"']*/gi, "［网盘链接已省略］")
    .replace(/(?:链接?|链|度盘|把盘)\s*[:：]?\s*\/?s\/[A-Za-z0-9_\-\u4e00-\u9fff?=&%]*/gi, "［网盘路径已省略］")
    .replace(/\/s\/[A-Za-z0-9_\-\u4e00-\u9fff?=&%]{4,}/gi, "［网盘路径已省略］")
    .replace(/(?:提取码|密码|pwd)\s*[:：=]?\s*[A-Za-z0-9]{4,8}/gi, "［提取码已省略］")
    .replace(/https?:\/\/[^\s<>"']+\.(?:iso|rom|bin|cue|chd)(?:\?[^\s<>"']*)?/gi, "［镜像地址已省略］")
    .replace(/[A-Za-z0-9_\-(). ]{0,60}\.(?:iso|rom|bin|cue|chd)\b/gi, "［镜像文件名已省略］")
    .replace(/\s+/g, " ")
    .trim();
}

function sha1(s) { return crypto.createHash("sha1").update(String(s)).digest("hex").slice(0, 16); }
function nameKey(n) {
  return String(n || "").toLowerCase().replace(/[^a-z0-9\u3400-\u9fff]/g, "").slice(0, 40);
}
/** 主去重键：清单型条目按「平台 + 游戏名」去重；发布动态按 URL 区分不同版本 */
function itemKey(it) {
  const base = namePlatKey(it);
  if (it.k === "catalog") return base;
  // 同一游戏同一天在多个汇总里重复出现时只留一条；无日期的才按 URL 区分
  return base + "|" + (it.d || sha1(safeIndexUrl(it.u) || ""));
}
function namePlatKey(it) { return nameKey(it.n) + "|" + String(it.p || "").toUpperCase(); }

const BAD_NAME = /^(?:未命名|无|暂无|游戏|更新|说明|备注|其它|其他|目录|索引|链接|地址|下载|附件|图片|视频|合集|汇总|日志|统计)$/;
function validItem(it) {
  return !!(it && it.n && it.n.length >= 2 && it.n.length <= 60 && !BAD_NAME.test(it.n) &&
    it.u && !BLOCKED_URL.test(it.u) && it.p);
}

/** 置信度：低于阈值的条目进待审队列，不直接污染公开索引 */
function scoreItem(it, ctx) {
  let s = 0.5;
  if (it.d) s += 0.2;
  if (ctx && ctx.permalink) s += 0.15;
  if (it.g) s += 0.08;
  if (ctx && ctx.explicitPlatform) s += 0.07;
  return Math.round(Math.min(1, s) * 100) / 100;
}

module.exports = {
  UA, sleep, getText, getJson, decode, textOf, linesOf, firstLine,
  normalizePlatform, detectPlatform, detectAI, detectVersion, toISODate,
  tidy, cleanName, safeIndexUrl, sanitizeNote, absoluteUrl, sha1, nameKey, itemKey, namePlatKey,
  validItem, scoreItem, BLOCKED_URL
};
