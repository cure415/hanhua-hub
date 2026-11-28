/* ============================================================================
 * 条目稳定指纹 · 浏览器与 Node 共用（UMD）
 * ----------------------------------------------------------------------------
 * 修正层不能按数组下标定位条目：自动快照每轮抓取都会重排、增删。
 * 这里用「层 + 游戏名 + 平台 + 原始发布页」算一个 16 位指纹，
 * 只要原始快照没变，指纹就稳定；用户改了名字也不影响定位（指纹按修正前的值算）。
 * ==========================================================================*/
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.HANHUA_FP = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  function hash(s) {
    var a = 0x811c9dc5, b = 0x01000193;
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      a = Math.imul(a ^ c, 16777619) >>> 0;
      b = (Math.imul(b, 31) + c) >>> 0;
    }
    return ("00000000" + a.toString(16)).slice(-8) + ("00000000" + b.toString(16)).slice(-8);
  }
  function fp(it, layer) {
    it = it || {};
    var raw = String(layer) + "|" + String(it.n || "") + "|" +
      String(it.p || "").toUpperCase() + "|" + String(it.u || "");
    return String(layer) + ":" + hash(raw);
  }
  return { hash: hash, fp: fp };
});
