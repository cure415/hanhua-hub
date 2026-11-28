/* ============================================================================
 * 数据修正台 · 写盘核心（浏览器页面与命令行共用）
 * ----------------------------------------------------------------------------
 * 修正不写回 data.js / data/auto.json，而是写进独立的覆盖层：
 *   data/overrides.json   机器可读、可 diff、可版本管理
 *   overrides.js          同内容的 <script> 版（兼容 file:// 离线打开）
 * 每次保存前自动备份到 data/backups/，并重建单文件版。
 * ==========================================================================*/
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const cp = require("child_process");
const L = require("./lib");
const FP = require("../fingerprint");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const OV_JSON = path.join(DATA_DIR, "overrides.json");
const OV_JS = path.join(ROOT, "overrides.js");
const BACKUP_DIR = path.join(DATA_DIR, "backups");
const AUTO_JSON = path.join(DATA_DIR, "auto.json");
const BASELINE_JS = path.join(ROOT, "data.js");

const NOTE = "由数据修正台生成。只记录相对原始快照的差量，不修改 data.js 与 data/auto.json；定时抓取不会覆盖此文件。";
const FIELDS = ["n", "p", "d", "t", "g", "ai", "v", "k", "src", "u", "dl", "note", "pan", "panCode", "confidence"];
const PAN_WHITELIST = ["百度网盘", "夸克网盘", "网盘（未注明）"];
const T_VALUES = ["pub", "list", "ver", ""];
const K_VALUES = ["release", "catalog"];
const MAX_BACKUPS = 20;

function emptyOverrides() {
  return { version: 1, generatedAt: "", note: NOTE, edits: {}, deleted: [], added: [] };
}
function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { return fallback; }
}
function readOverrides() {
  const o = readJson(OV_JSON, null);
  if (!o || o.version !== 1) return emptyOverrides();
  return {
    version: 1,
    generatedAt: String(o.generatedAt || ""),
    note: NOTE,
    edits: (o.edits && typeof o.edits === "object" && !Array.isArray(o.edits)) ? o.edits : {},
    deleted: Array.isArray(o.deleted) ? o.deleted.slice() : [],
    added: Array.isArray(o.added) ? o.added.slice() : []
  };
}
function loadBaseline() {
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(BASELINE_JS, "utf8"), ctx);
  return ctx.window.HANHUA || { asOf: "", sources: [], repos: [], items: [] };
}
function loadAuto() { return readJson(AUTO_JSON, { items: [], sources: [], generatedAt: "" }); }

/** 收集原始快照，附加稳定指纹 */
function collect() {
  const base = loadBaseline();
  const auto = loadAuto();
  const manual = (base.items || []).map(function (it) {
    return Object.assign({}, it, { _key: FP.fp(it, "b"), _layer: "b" });
  });
  const autoItems = (auto.items || []).map(function (it) {
    return Object.assign({}, it, { _key: FP.fp(it, "a"), _layer: "a" });
  });
  const sources = (base.sources || []).concat(
    (auto.sources || []).filter(function (s) {
      return !(base.sources || []).some(function (x) { return x.id === s.id; });
    })
  );
  return { base: base, auto: auto, manual: manual, autoItems: autoItems, sources: sources };
}

/** 把覆盖层应用到原始条目上，得到页面/工具看到的合并视图 */
function applyTo(items, ov) {
  const edits = ov.edits || {}, deleted = ov.deleted || [];
  const out = [];
  items.forEach(function (it) {
    if (deleted.indexOf(it._key) >= 0) return;
    const e = edits[it._key];
    if (e) {
      out.push(Object.assign({}, it, e, { _key: it._key, _layer: it._layer, _edited: Object.keys(e) }));
    } else {
      out.push(Object.assign({}, it));
    }
  });
  (ov.added || []).forEach(function (raw, i) {
    const layer = raw.layer === "a" ? "a" : "b";
    const clean = Object.assign({}, raw);
    out.push(Object.assign({}, clean, {
      _key: "x:" + FP.fp(clean, layer) + ":" + i,
      _layer: layer, _added: true, auto: layer === "a"
    }));
  });
  return out;
}
function view() {
  const c = collect();
  const ov = readOverrides();
  return {
    items: applyTo(c.manual.concat(c.autoItems), ov),
    sources: c.sources,
    overrides: ov,
    asOf: (c.auto.generatedAt || "").slice(0, 10) || c.base.asOf || ""
  };
}

/* ------------------------------ 字段校验 ------------------------------ */
function checkField(f, v, errors, tag) {
  switch (f) {
    case "n": {
      const s = String(v == null ? "" : v).trim();
      if (s.length < 2 || s.length > 60) errors.push(tag + " 游戏名长度须为 2–60");
      if (/https?:\/\/|<|>/.test(s)) errors.push(tag + " 游戏名不能含链接或标签");
      return s;
    }
    case "p": {
      const s = String(v == null ? "" : v).trim().toUpperCase();
      if (!s || s.length > 12) errors.push(tag + " 平台不合法");
      return s;
    }
    case "d": {
      const s = String(v == null ? "" : v).trim();
      if (s && !/^\d{4}-\d{2}-\d{2}$/.test(s)) errors.push(tag + " 日期须为 YYYY-MM-DD 或留空");
      return s;
    }
    case "t": {
      const s = String(v == null ? "" : v).trim();
      if (T_VALUES.indexOf(s) < 0) errors.push(tag + " 日期性质不合法");
      return s;
    }
    case "k": {
      const s = String(v == null ? "" : v).trim();
      if (K_VALUES.indexOf(s) < 0) errors.push(tag + " 数据范围不合法");
      return s;
    }
    case "ai":
      if (v !== true && v !== false && v !== null) errors.push(tag + " AI 标注只能是 true / false / null");
      return v;
    case "panCode":
      if (typeof v !== "boolean") errors.push(tag + " panCode 只能是布尔值");
      return !!v;
    case "pan": {
      if (!Array.isArray(v)) { errors.push(tag + " 网盘渠道须为数组"); return []; }
      const out = [];
      v.forEach(function (x) {
        if (PAN_WHITELIST.indexOf(x) < 0) errors.push(tag + " 网盘渠道取值不合法：" + x);
        else if (out.indexOf(x) < 0) out.push(x);
      });
      return out;
    }
    case "u": {
      const s = L.safeIndexUrl(String(v == null ? "" : v).trim());
      if (!s) errors.push(tag + " 原始发布页必须是普通 http(s) 链接，不能是网盘 / 镜像 / 磁力链");
      return s;
    }
    case "dl": {
      const raw = String(v == null ? "" : v).trim();
      if (!raw) return "";
      const s = L.safeIndexUrl(raw);
      if (!s) errors.push(tag + " 补丁链接不能是网盘 / 镜像 / 磁力链");
      return s;
    }
    case "note":
      return L.sanitizeNote(String(v == null ? "" : v)).slice(0, 600);
    case "confidence": {
      const n = Number(v);
      if (v === null || v === "") return null;
      if (!isFinite(n) || n < 0 || n > 1) errors.push(tag + " 置信度须为 0–1 或留空");
      return Math.round(n * 100) / 100;
    }
    case "src": {
      const s = String(v == null ? "" : v).trim().slice(0, 40);
      if (!s) errors.push(tag + " 来源 id 不能为空");
      return s;
    }
    case "layer":
      return v === "a" ? "a" : "b";
    default: {
      const s = String(v == null ? "" : v).trim();
      return f === "g" ? s.slice(0, 30) : s.slice(0, 60);
    }
  }
}

/** 校验并规范化一份完整覆盖层；返回 { ok, errors, value } */
function validate(patch, opts) {
  opts = opts || {};
  const errors = [];
  if (!patch || typeof patch !== "object" || patch.version !== 1) {
    return { ok: false, errors: ["覆盖层版本字段无效（应为 version: 1）"] };
  }
  const edits = patch.edits, deleted = patch.deleted, added = patch.added;
  if (!edits || typeof edits !== "object" || Array.isArray(edits)) errors.push("edits 必须是对象");
  if (!Array.isArray(deleted)) errors.push("deleted 必须是数组");
  if (!Array.isArray(added)) errors.push("added 必须是数组");
  if (errors.length) return { ok: false, errors: errors };

  const c = collect();
  const known = {};
  c.manual.concat(c.autoItems).forEach(function (it) { known[it._key] = it; });
  const sourceIds = {};
  c.sources.forEach(function (s) { sourceIds[s.id] = 1; });
  sourceIds.custom = 1;

  const cleanEdits = {};
  Object.keys(edits).forEach(function (key) {
    if (!known[key]) { errors.push("修正键已不在当前快照中（快照可能已更新）：" + key); return; }
    const raw = edits[key];
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) { errors.push("修正内容必须是对象：" + key); return; }
    const clean = {};
    Object.keys(raw).forEach(function (f) {
      if (FIELDS.indexOf(f) < 0) { errors.push("不允许修改字段 " + f); return; }
      clean[f] = checkField(f, raw[f], errors, key + " 的 " + f);
    });
    const merged = Object.assign({}, known[key], clean);
    if (!L.validItem(merged)) errors.push(key + " 修正后条目不满足最低校验（名称 / 平台 / 发布页）");
    if (!sourceIds[merged.src]) errors.push(key + " 的来源 id 未登记：" + merged.src);
    cleanEdits[key] = clean;
  });
  deleted.forEach(function (key) {
    if (!known[key]) errors.push("待删除键已不在当前快照中：" + key);
  });
  const cleanAdded = added.map(function (raw, i) {
    const clean = {};
    const tag = "新增条目 #" + (i + 1);
    Object.keys(raw || {}).forEach(function (f) {
      if (FIELDS.concat(["layer"]).indexOf(f) < 0) { errors.push(tag + " 含不允许字段 " + f); return; }
      clean[f] = checkField(f, raw[f], errors, tag + " 的 " + f);
    });
    ["n", "p", "u", "src"].forEach(function (f) {
      if (!clean[f]) errors.push(tag + " 缺少必填字段 " + f);
    });
    if (!L.validItem(clean)) errors.push(tag + " 不满足最低校验（名称 / 平台 / 发布页）");
    if (clean.src && !sourceIds[clean.src]) errors.push(tag + " 的来源 id 未登记：" + clean.src);
    clean.layer = clean.layer || "b";
    return clean;
  });
  if (deleted.length > 50 && !opts.allowBulkDelete) {
    errors.push("单次删除 " + deleted.length + " 条超过 50 条上限；请分批操作或显式开启批量删除");
  }
  const value = {
    version: 1, generatedAt: "", note: NOTE,
    edits: cleanEdits, deleted: deleted.slice(), added: cleanAdded
  };
  return { ok: errors.length === 0, errors: errors, value: value };
}

/* ------------------------------ 备份 / 写盘 ------------------------------ */
function listBackups() {
  try {
    return fs.readdirSync(BACKUP_DIR).filter(function (f) { return /^overrides-.*\.json$/.test(f); })
      .sort().reverse();
  } catch (e) { return []; }
}
function backup(current) {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const name = "overrides-" + stamp + ".json";
  fs.writeFileSync(path.join(BACKUP_DIR, name), JSON.stringify(current, null, 2) + "\n", "utf8");
  const all = listBackups();
  all.slice(MAX_BACKUPS).forEach(function (f) {
    try { fs.unlinkSync(path.join(BACKUP_DIR, f)); } catch (e) { /* noop */ }
  });
  return name;
}
function writeOverridesJs(ov) {
  fs.writeFileSync(OV_JS,
    "/* 自动生成，请勿手改；由数据修正台写入。 */\n" +
    "window.HANHUA_OVERRIDES = " + JSON.stringify(ov).replace(/<\//g, "<\\/") + ";\n", "utf8");
}
function rebuild() {
  cp.execFileSync(process.execPath, [path.join(__dirname, "build.js")], { cwd: ROOT, stdio: "pipe" });
}
function statsOf(ov) {
  return {
    edited: Object.keys(ov.edits || {}).length,
    deleted: (ov.deleted || []).length,
    added: (ov.added || []).length
  };
}

/** 应用一份完整覆盖层：校验 → 备份 → 写盘 → 重建单文件版 */
function applyPatch(patch, opts) {
  opts = opts || {};
  const res = validate(patch, opts);
  if (!res.ok) return { ok: false, errors: res.errors };
  const current = readOverrides();
  const value = Object.assign({}, res.value, { generatedAt: new Date().toISOString() });
  if (JSON.stringify(Object.assign({}, current, { generatedAt: "" })) ===
      JSON.stringify(Object.assign({}, value, { generatedAt: "" }))) {
    return { ok: true, noChange: true, stats: statsOf(value) };
  }
  const name = backup(current);
  fs.writeFileSync(OV_JSON, JSON.stringify(value, null, 2) + "\n", "utf8");
  writeOverridesJs(value);
  if (!opts.skipBuild) rebuild();
  return { ok: true, backup: name, stats: statsOf(value), generatedAt: value.generatedAt };
}
function restoreBackup(name, opts) {
  opts = opts || {};
  if (!/^overrides-[0-9T\-Z.]+\.json$/.test(String(name || ""))) {
    return { ok: false, errors: ["备份文件名不合法"] };
  }
  const file = path.join(BACKUP_DIR, name);
  if (!fs.existsSync(file)) return { ok: false, errors: ["备份不存在：" + name] };
  const ov = readJson(file, null);
  if (!ov || ov.version !== 1) return { ok: false, errors: ["备份内容无效"] };
  const current = readOverrides();
  const name2 = backup(current);
  const value = Object.assign({}, readOverrides(), {
    edits: ov.edits || {}, deleted: ov.deleted || [], added: ov.added || [],
    generatedAt: new Date().toISOString()
  });
  fs.writeFileSync(OV_JSON, JSON.stringify(value, null, 2) + "\n", "utf8");
  writeOverridesJs(value);
  if (!opts.skipBuild) rebuild();
  return { ok: true, backup: name2, restored: name, stats: statsOf(value) };
}

module.exports = {
  ROOT, OV_JSON, OV_JS, BACKUP_DIR, NOTE, FIELDS, PAN_WHITELIST,
  emptyOverrides, readOverrides, collect, applyTo, view, validate,
  listBackups, backup, writeOverridesJs, rebuild, statsOf,
  applyPatch, restoreBackup
};
