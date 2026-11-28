/* ============================================================================
 * 数据修正台 · 离线补丁应用（不启服务时使用）
 * ----------------------------------------------------------------------------
 *   npm run apply-fixes -- hanhua-fixes-2026-11-26.json   应用页面导出的补丁
 *   node scripts/apply-fixes.js --show                    查看当前修正统计
 *   node scripts/apply-fixes.js --list                   列出可回滚的备份
 *   node scripts/apply-fixes.js --restore=<备份文件名>    回滚到某次备份
 *   node scripts/apply-fixes.js --reset                  清空全部修正，回到原始快照
 *
 * 补丁即一份完整覆盖层 JSON（version / edits / deleted / added）。
 * 应用时同样走校验、备份、重建单文件版，和在线保存完全一致。
 * ==========================================================================*/
"use strict";

const fs = require("fs");
const path = require("path");
const E = require("./apply-edits");

const argv = process.argv.slice(2);
function opt(name) {
  const hit = argv.find(function (a) { return a.indexOf("--" + name + "=") === 0; });
  return hit ? hit.slice(name.length + 3) : "";
}
function show() {
  const ov = E.readOverrides();
  const s = E.statsOf(ov);
  console.log("当前覆盖层：修正 " + s.edited + " 条 · 删除 " + s.deleted + " 条 · 新增 " + s.added + " 条");
  console.log("生成时间：" + (ov.generatedAt || "—"));
  console.log("文件：" + path.relative(E.ROOT, E.OV_JSON) + " / overrides.js");
}
function done(out) {
  if (!out.ok) {
    console.error("失败：");
    (out.errors || []).forEach(function (e) { console.error("  - " + e); });
    process.exitCode = 1;
    return;
  }
  if (out.noChange) { console.log("内容与当前一致，无需写入。"); return; }
  console.log("已应用：" + JSON.stringify(out.stats));
  if (out.restored) console.log("已从备份恢复：" + out.restored);
  if (out.backup) console.log("本次保存前已备份：" + out.backup);
  console.log("已重建 overrides.js 与 index-standalone.html。");
}

if (argv.includes("--show")) {
  show();
} else if (argv.includes("--list")) {
  const list = E.listBackups();
  console.log("可用备份（" + list.length + " 个，最新在前）：");
  list.forEach(function (f) { console.log("  " + f); });
  if (!list.length) console.log("  （暂无，保存一次修正后会自动生成）");
} else if (argv.includes("--reset")) {
  done(E.applyPatch(E.emptyOverrides()));
} else if (opt("restore")) {
  done(E.restoreBackup(opt("restore")));
} else {
  const input = argv.find(function (a) { return a.indexOf("--") !== 0; });
  if (!input) {
    console.error("用法：npm run apply-fixes -- <补丁文件.json>");
    console.error("      node scripts/apply-fixes.js --show | --list | --reset | --restore=<备份名>");
    process.exitCode = 1;
  } else {
    const file = path.resolve(input);
    if (!fs.existsSync(file)) { console.error("补丁文件不存在：" + file); process.exitCode = 1; }
    else {
      let patch;
      try { patch = JSON.parse(fs.readFileSync(file, "utf8")); }
      catch (e) { console.error("补丁不是合法 JSON：" + e.message); process.exitCode = 1; patch = null; }
      if (patch) done(E.applyPatch(patch));
    }
  }
}
