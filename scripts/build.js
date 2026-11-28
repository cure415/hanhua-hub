/* ============================================================================
 * 把源码版打包成可离线双击 / 直接转发的单文件版 index-standalone.html
 * 每次抓取后都要跑一次，让单文件版也带上最新的自动条目。
 * ==========================================================================*/
"use strict";

const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

function read(file) { return fs.readFileSync(path.join(ROOT, file), "utf8"); }
function inlineScript(code) { return "<script>\n" + String(code).replace(/<\/script/gi, "<\\/script") + "\n</script>"; }

let html = read("index.html");
const replacements = [
  ['<link rel="stylesheet" href="styles.css">', "<style>\n" + read("styles.css") + "\n</style>"],
  ['<script src="fingerprint.js"></script>', inlineScript(read("fingerprint.js"))],
  ['<script src="data.js"></script>', inlineScript(read("data.js"))],
  ['<script src="auto-data.js"></script>', inlineScript(read("auto-data.js"))],
  ['<script src="overrides.js"></script>', inlineScript(read("overrides.js"))],
  ['<script src="app.js"></script>', inlineScript(read("app.js"))]
];
replacements.forEach(function (pair) {
  if (html.indexOf(pair[0]) < 0) throw new Error("index.html 里找不到引用：" + pair[0]);
  html = html.replace(pair[0], pair[1]);
});
if (/<script src=|<link[^>]+href="styles\.css"/.test(html)) throw new Error("仍有未内联的外部资源");

fs.writeFileSync(path.join(ROOT, "index-standalone.html"), html, "utf8");
console.log("已生成 index-standalone.html（" + Buffer.byteLength(html) + " 字节）");
