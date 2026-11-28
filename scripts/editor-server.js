/* ============================================================================
 * 数据修正台 · 本地服务（零依赖，仅监听 127.0.0.1）
 * ----------------------------------------------------------------------------
 *   npm run editor                 默认 8787，端口占用自动顺延
 *   npm run editor -- --port=9000  指定端口
 *
 * 只提供静态页面与 4 个写盘接口；不监听外网、不上传任何数据。
 * 每次保存由 scripts/apply-edits.js 负责校验、备份、重建单文件版。
 * ==========================================================================*/
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const E = require("./apply-edits");

const ROOT = E.ROOT;
const argv = process.argv.slice(2);
const portArg = argv.find(function (a) { return a.indexOf("--port=") === 0; });
const START_PORT = Number(portArg ? portArg.slice(7) : (process.env.PORT || 8787)) || 8787;
const MAX_PORT_TRIES = portArg ? 1 : 10;
const MAX_BODY = 5 * 1024 * 1024;

const STATIC = {
  "/": ["editor.html", "text/html; charset=utf-8"],
  "/editor.html": ["editor.html", "text/html; charset=utf-8"],
  "/fingerprint.js": ["fingerprint.js", "application/javascript; charset=utf-8"],
  "/data.js": ["data.js", "application/javascript; charset=utf-8"],
  "/auto-data.js": ["auto-data.js", "application/javascript; charset=utf-8"],
  "/overrides.js": ["overrides.js", "application/javascript; charset=utf-8"],
  "/index.html": ["index.html", "text/html; charset=utf-8"],
  "/index-standalone.html": ["index-standalone.html", "text/html; charset=utf-8"],
  "/styles.css": ["styles.css", "text/css; charset=utf-8"],
  "/app.js": ["app.js", "application/javascript; charset=utf-8"]
};

function send(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store"
  });
  res.end(body);
}
function readBody(req) {
  return new Promise(function (resolve, reject) {
    let size = 0;
    const chunks = [];
    req.on("data", function (c) {
      size += c.length;
      if (size > MAX_BODY) { reject(new Error("请求体超过 5 MB 上限")); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", function () {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}")); }
      catch (e) { reject(new Error("请求体不是合法 JSON")); }
    });
    req.on("error", reject);
  });
}
function serveStatic(res, rel, type) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) { send(res, 404, { ok: false, errors: ["文件不存在：" + rel] }); return; }
  const buf = fs.readFileSync(file);
  res.writeHead(200, {
    "Content-Type": type,
    "Content-Length": buf.length,
    "Cache-Control": "no-store"
  });
  res.end(buf);
}

async function handleApi(req, res, url) {
  const p = url.pathname;
  if (p === "/api/ping" && req.method === "GET") {
    return send(res, 200, { ok: true, service: "hanhua-editor", time: new Date().toISOString() });
  }
  if (p === "/api/state" && req.method === "GET") {
    const ov = E.readOverrides();
    return send(res, 200, { ok: true, overrides: ov, stats: E.statsOf(ov), backups: E.listBackups() });
  }
  if (p === "/api/backups" && req.method === "GET") {
    return send(res, 200, { ok: true, backups: E.listBackups() });
  }
  if (p === "/api/save" && req.method === "POST") {
    const patch = await readBody(req);
    const out = E.applyPatch(patch, { allowBulkDelete: patch.allowBulkDelete === true });
    return send(res, out.ok ? 200 : 400, out);
  }
  if (p === "/api/restore" && req.method === "POST") {
    const body = await readBody(req);
    const out = E.restoreBackup(body.name, {});
    return send(res, out.ok ? 200 : 400, out);
  }
  if (p === "/api/rebuild" && req.method === "POST") {
    try { E.rebuild(); return send(res, 200, { ok: true, message: "单文件版已重建" }); }
    catch (e) { return send(res, 500, { ok: false, errors: ["重建失败：" + e.message] }); }
  }
  return send(res, 404, { ok: false, errors: ["未知接口：" + p] });
}

const server = http.createServer(async function (req, res) {
  const host = String(req.headers.host || "");
  if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/i.test(host)) {
    return send(res, 403, { ok: false, errors: ["仅允许本机访问"] });
  }
  let url;
  try { url = new URL(req.url, "http://127.0.0.1"); }
  catch (e) { return send(res, 400, { ok: false, errors: ["请求地址无效"] }); }
  try {
    if (url.pathname.indexOf("/api/") === 0) return await handleApi(req, res, url);
    const hit = STATIC[url.pathname];
    if (hit && req.method === "GET") return serveStatic(res, hit[0], hit[1]);
    return send(res, 404, { ok: false, errors: ["未找到：" + url.pathname] });
  } catch (e) {
    return send(res, 500, { ok: false, errors: [e.message || String(e)] });
  }
});

function listen(port, triesLeft) {
  server.once("error", function (err) {
    if (err.code === "EADDRINUSE" && triesLeft > 1) {
      console.log("端口 " + port + " 被占用，尝试 " + (port + 1) + " …");
      listen(port + 1, triesLeft - 1);
    } else {
      console.error("启动失败：" + err.message);
      process.exit(1);
    }
  });
  server.listen(port, "127.0.0.1", function () {
    const addr = "http://127.0.0.1:" + port + "/editor.html";
    console.log("");
    console.log("  数据修正台已启动：" + addr);
    console.log("  仅本机可访问 · 每次保存自动备份到 data/backups/ · Ctrl+C 退出");
    console.log("  离线也可直接双击 editor.html（编辑后导出补丁，用 npm run apply-fixes 应用）");
    console.log("");
  });
}
listen(START_PORT, MAX_PORT_TRIES);
