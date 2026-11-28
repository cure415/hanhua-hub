/* 复古汉化发布台 · 交互层（原生 JS，无依赖、无后端） */
(function () {
  "use strict";

  var DATA = window.HANHUA || { asOf: "", sources: [], repos: [], items: [] };
  var AUTO = window.HANHUA_AUTO || { generatedAt: "", items: [], sources: [], report: [], stats: {} };
  var AUTO_ITEMS = Array.isArray(AUTO.items) ? AUTO.items : [];
  // 修正覆盖层：独立于 data.js / auto-data.js，定时抓取重建自动快照也不会冲掉人工修正
  var FP = window.HANHUA_FP || null;
  var EMPTY_OV = { edits: {}, deleted: [], added: [] };
  var OV = (FP && window.HANHUA_OVERRIDES) ? window.HANHUA_OVERRIDES : EMPTY_OV;
  // 有自动数据时以抓取日期为「今天」，否则退回人工快照日期
  var AS_OF = (AUTO.generatedAt && AUTO.generatedAt.slice(0, 10) > (DATA.asOf || "")) ? AUTO.generatedAt.slice(0, 10) : (DATA.asOf || "2026-11-26");
  var LS_CUSTOM = "hanhua.custom.v1";
  var LS_LIVE = "hanhua.live.v1";
  var LS_THEME = "hanhua.theme.v1";

  var SOURCES = DATA.sources.slice();
  (Array.isArray(AUTO.sources) ? AUTO.sources : []).forEach(function (s) {
    if (!SOURCES.some(function (x) { return x.id === s.id; })) SOURCES.push(s);
  });
  SOURCES.push({ id: "custom", name: "本机录入 / 导入", type: "本地", url: "", updated: "—", desc: "由你在页面里录入或导入 JSON 的条目，只保存在当前浏览器的 localStorage。" });
  var SRC_MAP = {};
  SOURCES.forEach(function (s) { SRC_MAP[s.id] = s; });

  var PLAT_COLORS = {
    PS2: "#2f6ea8", PS1: "#4a7fb5", PSP: "#2b8b80", PS3: "#5b6fb0",
    SFC: "#b5522e", FC: "#c2703a", MD: "#2b7a78", SS: "#7a5aa6",
    GBA: "#3f7d5a", GBC: "#5b8f3e", GB: "#6b8f2e", NDS: "#b03a55",
    "3DS": "#c2523a", N64: "#b78317", WSC: "#8a5fb0", PCE: "#b06a2e",
    DC: "#2f7fa8", NGC: "#4a8f5a", Android: "#4e9a4e", PC: "#5a6b7a",
    Switch: "#c13b3b", Xbox: "#3f8f4f", WiiU: "#3f8fb0",
    Wii: "#4a86a8", PSV: "#4a7fb5", WS: "#8a5fb0", NGCD: "#a45b3a",
    MS: "#2b7a78", PC88: "#5a6b7a", PC98: "#5a6b7a"
  };
  // normalize() 会把平台统一成大写，这里做大小写无关的颜色查找
  var PLAT_COLOR_CI = {};
  Object.keys(PLAT_COLORS).forEach(function (k) { PLAT_COLOR_CI[k.toUpperCase()] = PLAT_COLORS[k]; });

  var state = {
    q: "", kind: "all", ai: "all", range: "all", sort: "date-desc", pan: "all",
    platforms: new Set(), source: "", view: "cards"
  };

  var items = [];
  var $ = function (id) { return document.getElementById(id); };

  /* ------------------------------ 工具 ------------------------------ */
  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function safeUrl(u) {
    return /^https?:\/\//i.test(String(u || "")) ? String(u) : "#";
  }
  function hex2rgb(h) {
    h = h.replace("#", "");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function lighten(hex, ratio) {
    var c = hex2rgb(hex);
    return "#" + c.map(function (v) {
      return Math.round(v + (255 - v) * ratio).toString(16).padStart(2, "0");
    }).join("");
  }
  function platColor(p) {
    var base = PLAT_COLOR_CI[String(p || "").toUpperCase()] || "#6b7280";
    return document.documentElement.dataset.theme === "dark" ? lighten(base, 0.38) : base;
  }
  function badge(p) {
    var c = platColor(p);
    return '<span class="badge" style="color:' + c + ';background:' + c + '1f;border-color:' + c + '55">' + esc(p || "?") + "</span>";
  }
  function typeLabel(t) {
    return { pub: "发布", list: "汇总", ver: "版本" }[t] || "未标注";
  }
  function dateLabel(it) {
    if (!it.d) return "日期未标注";
    var parts = it.d.split("-");
    var short = parts.length >= 3 ? parts[1] + "-" + parts[2] : (parts.length === 2 ? parts[1] + "月" : it.d);
    return typeLabel(it.t) + " " + short;
  }
  function srcName(id) { return (SRC_MAP[id] && SRC_MAP[id].name) || "未标注来源"; }
  function aiLabel(ai) { return ai === true ? "AI 辅助" : ai === false ? "明确人工" : "未标注"; }
  var PAN_WHITELIST = ["百度网盘", "夸克网盘", "网盘（未注明）"];
  function inferPan(note) {
    var s = String(note || ""), out = [];
    if (/百度网盘|百度盘|百度云盘|百度云|度盘|pan\.baidu\.com|yun\.baidu\.com/i.test(s)) out.push("百度网盘");
    if (/夸克网盘|夸克云|夸克盘|夸克分享|夸克|pan\.quark\.cn|quark\.cn\/s\//i.test(s)) out.push("夸克网盘");
    if (!out.length && /通过网盘分享|网盘(?:链接|地址|下载|分享)|网盘发布/i.test(s)) out.push("网盘（未注明）");
    return out;
  }
  function panBadge(it) {
    if (!it.pan || !it.pan.length) return "";
    return '<span class="tag tag-pan" title="只标注发布渠道；链接与提取码请以原发布页为准">' +
      esc(it.pan.join(" · ")) + (it.panCode ? " · 需提取码" : "") + "</span>";
  }
  function panText(it) {
    if (!it.pan || !it.pan.length) return "未标注网盘渠道";
    return it.pan.join(" + ") + (it.panCode ? "（发布页标注需提取码）" : "") + "；链接与提取码请以原发布页为准";
  }
  function daysBetween(a, b) { return Math.round((new Date(b + "T00:00:00Z") - new Date(a + "T00:00:00Z")) / 86400000); }
  function toast(msg) {
    var el = $("toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(el._timer);
    el._timer = setTimeout(function () { el.hidden = true; }, 2600);
  }

  /* ------------------------------ 数据 ------------------------------ */
  function normalize(raw, prefix, idx) {
    var panRaw = Array.isArray(raw.pan) && raw.pan.length ? raw.pan : inferPan(raw.note);
    return {
      _id: prefix + idx,
      n: String(raw.n || "未命名条目"),
      p: String(raw.p || "其他").toUpperCase(),
      d: /^\d{4}-\d{2}-\d{2}$/.test(raw.d || "") ? raw.d : "",
      t: ["pub", "list", "ver"].indexOf(raw.t) >= 0 ? raw.t : "",
      g: String(raw.g || ""),
      ai: raw.ai === true ? true : (raw.ai === false ? false : null),
      v: String(raw.v || ""),
      k: raw.k === "catalog" ? "catalog" : "release",
      src: String(raw.src || "custom"),
      u: String(raw.u || ""),
      dl: String(raw.dl || ""),
      note: String(raw.note || ""),
      auto: raw.auto === true,
      confidence: typeof raw.confidence === "number" ? raw.confidence : null,
      firstSeen: String(raw.firstSeen || ""),
      pan: panRaw.filter(function (v) { return PAN_WHITELIST.indexOf(v) >= 0; }),
      panCode: raw.panCode === true || /提取码|访问码|取货码|密码|pwd/i.test(String(raw.note || ""))
    };
  }
  function loadCustom() {
    try { return JSON.parse(localStorage.getItem(LS_CUSTOM) || "[]"); } catch (e) { return []; }
  }
  function saveCustom(list) {
    try { localStorage.setItem(LS_CUSTOM, JSON.stringify(list)); } catch (e) { toast("浏览器存储不可用，条目仅在本次会话有效"); }
  }
  function applyOverrides(list, prefix) {
    if (!FP || !OV) return list;
    var edits = OV.edits || {}, deleted = OV.deleted || [];
    var out = [];
    list.forEach(function (raw) {
      var key = FP.fp(raw, prefix);
      if (deleted.indexOf(key) >= 0) return;
      out.push(edits[key] ? Object.assign({}, raw, edits[key]) : raw);
    });
    return out;
  }
  function rebuild() {
    var built = applyOverrides(DATA.items, "b").map(function (it, i) { return normalize(it, "b", i); });
    var offset = built.length;
    var auto = applyOverrides(AUTO_ITEMS, "a").map(function (it, i) {
      var o = normalize(it, "a", i);
      o._id = "a" + (offset + i);
      o.auto = true;
      return o;
    });
    var added = (OV.added || []).map(function (it, i) {
      var o = normalize(it, "x", i);
      o._id = "x" + i;
      o.auto = it.layer === "a";
      return o;
    });
    var custom = loadCustom().map(function (it, i) { return normalize(it, "u", i); });
    items = built.concat(auto, added, custom);
  }

  /* ------------------------------ 筛选 ------------------------------ */
  var ALIASES = {
    "机战": "超级机器人大战", "dq": "勇者斗恶龙", "ff": "最终幻想",
    "kh": "王国之心", "srpg": "战棋", "火纹": "火炎之纹章"
  };
  function filtered() {
    var q = state.q.trim().toLowerCase();
    var groups = q ? q.split(/\s+/).filter(Boolean).map(function (t) {
      return ALIASES[t] ? [t, ALIASES[t]] : [t];
    }) : [];
    var out = items.filter(function (it) {
      if (groups.length) {
        var hay = [it.n, it.g, it.v, it.note, it.p, srcName(it.src)].join(" ").toLowerCase();
        var matched = groups.every(function (g) {
          return g.some(function (t) { return hay.indexOf(t) >= 0; });
        });
        if (!matched) return false;
      }
      if (state.kind === "auto") { if (!it.auto) return false; }
      else if (state.kind !== "all" && it.k !== state.kind) return false;
      if (state.ai === "yes" && it.ai !== true) return false;
      if (state.ai === "no" && it.ai !== false) return false;
      if (state.ai === "unknown" && it.ai != null) return false;
      if (state.platforms.size && !state.platforms.has(it.p)) return false;
      if (state.source && it.src !== state.source) return false;
      if (state.pan !== "all") {
        var hb = it.pan.indexOf("百度网盘") >= 0, hq = it.pan.indexOf("夸克网盘") >= 0;
        var panPass = {
          any: it.pan.length > 0, baidu: hb, quark: hq,
          both: hb && hq, none: it.pan.length === 0
        }[state.pan];
        if (!panPass) return false;
      }
      if (state.range !== "all") {
        if (it.t !== "pub" || !it.d) return false;
        var delta = daysBetween(it.d, AS_OF);
        if (delta < 0 || delta > Number(state.range)) return false;
      }
      return true;
    });
    out.sort(function (a, b) {
      switch (state.sort) {
        case "date-asc": return (a.d || "9999").localeCompare(b.d || "9999");
        case "platform": return a.p.localeCompare(b.p) || (b.d || "").localeCompare(a.d || "");
        case "name": return a.n.localeCompare(b.n, "zh-Hans-CN");
        default: return (b.d || "").localeCompare(a.d || "");
      }
    });
    return out;
  }

  /* ------------------------------ 渲染：KPI ------------------------------ */
  function renderKpis() {
    var platforms = {};
    var aiCount = 0, recent = 0, panCount = 0;
    items.forEach(function (it) {
      platforms[it.p] = 1;
      if (it.ai === true) aiCount++;
      if (it.pan && it.pan.length) panCount++;
      if (it.t === "pub" && it.d && daysBetween(it.d, AS_OF) >= 0 && daysBetween(it.d, AS_OF) <= 30) recent++;
    });
    var cards = [
      { n: items.length, label: "收录条目", sub: DATA.sources.length + " 个公开来源 · 自动抓取 " + AUTO_ITEMS.length + " 条 · 网盘渠道标注 " + panCount + " 条" },
      { n: Object.keys(platforms).length, label: "覆盖平台", sub: "从 FC / MD 到 PS3 / 3DS" },
      { n: recent, label: "近 30 天明确发布", sub: "仅统计确切发布日" },
      { n: aiCount, label: "标注 AI 辅助", sub: "其余未臆测标注" }
    ];
    $("kpis").innerHTML = cards.map(function (c) {
      return '<div class="kpi"><b>' + c.n + "</b><span>" + c.label + "</span><small>" + esc(c.sub) + "</small></div>";
    }).join("");
  }

  /* ------------------------------ 渲染：筛选器 ------------------------------ */
  function renderPlatformChips() {
    var counts = {};
    items.forEach(function (it) { counts[it.p] = (counts[it.p] || 0) + 1; });
    var keys = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a] || a.localeCompare(b); });
    var html = '<button class="chip' + (state.platforms.size ? "" : " active") + '" data-plat="__all" type="button">全部 <span class="cnt">' + items.length + "</span></button>";
    html += keys.map(function (k) {
      return '<button class="chip' + (state.platforms.has(k) ? " active" : "") + '" data-plat="' + esc(k) + '" type="button">' + esc(k) + ' <span class="cnt">' + counts[k] + "</span></button>";
    }).join("");
    $("platform-chips").innerHTML = html;
    $("platform-list").innerHTML = keys.map(function (k) { return '<option value="' + esc(k) + '">'; }).join("");
  }
  function renderSourceFilter() {
    var row = $("source-filter-row");
    if (!state.source) { row.hidden = true; return; }
    row.hidden = false;
    $("source-chip").textContent = srcName(state.source);
  }

  /* ------------------------------ 渲染：图表 ------------------------------ */
  function renderCharts(list) {
    var months = {};
    list.forEach(function (it) {
      if (it.t === "pub" && it.d) {
        var m = it.d.slice(0, 7);
        months[m] = (months[m] || 0) + 1;
      }
    });
    var keys = Object.keys(months).sort();
    var span = [];
    if (keys.length) {
      var cur = keys[0], end = keys[keys.length - 1], guard = 0;
      while (cur <= end && guard++ < 24) {
        span.push(cur);
        var y = Number(cur.slice(0, 4)), m = Number(cur.slice(5, 7)) + 1;
        if (m > 12) { m = 1; y++; }
        cur = y + "-" + String(m).padStart(2, "0");
      }
    }
    var max = Math.max.apply(null, span.map(function (k) { return months[k] || 0; }).concat([1]));
    $("trend-total").textContent = Object.values(months).reduce(function (a, b) { return a + b; }, 0) + " 条确切发布";
    $("trend-chart").innerHTML = span.length ? span.map(function (k) {
      var v = months[k] || 0;
      var h = Math.max(3, Math.round((v / max) * 112));
      return '<div class="trend-col"><div class="trend-bar" style="height:' + h + 'px" title="' + k + "：" + v + ' 条"><span>' + (v || "") + "</span></div><label>" + esc(k.slice(2)) + "</label></div>";
    }).join("") : '<div style="color:var(--ink-3);font-size:12px;align-self:center">当前筛选下没有带确切发布日的记录</div>';

    var pc = {};
    list.forEach(function (it) { pc[it.p] = (pc[it.p] || 0) + 1; });
    var pkeys = Object.keys(pc).sort(function (a, b) { return pc[b] - pc[a] || a.localeCompare(b); });
    var pmax = pkeys.length ? pc[pkeys[0]] : 1;
    $("plat-total").textContent = pkeys.length + " 个平台";
    $("plat-chart").innerHTML = pkeys.length ? pkeys.map(function (k) {
      var c = PLAT_COLORS[k] || "#6b7280";
      return '<div class="plat-row"><b>' + esc(k) + '</b><div class="plat-track"><div class="plat-fill" style="width:' + Math.max(3, Math.round(pc[k] / pmax * 100)) + "%;background:" + c + '"></div></div><em>' + pc[k] + "</em></div>";
    }).join("") : '<div style="color:var(--ink-3);font-size:12px">暂无数据</div>';
  }

  /* ------------------------------ 渲染：三种视图 ------------------------------ */
  function cardHtml(it) {
    var s = SRC_MAP[it.src] || SRC_MAP.custom;
    var tags = badge(it.p);
    if (it.auto) tags += '<span class="tag tag-auto">AUTO</span>';
    if (it.ai === true) tags += '<span class="tag tag-ai">AI 辅助</span>';
    if (it.v) tags += '<span class="tag tag-ver">' + esc(it.v) + "</span>";
    tags += panBadge(it);
    var second = it.dl
      ? '<a href="' + safeUrl(it.dl) + '" target="_blank" rel="noopener noreferrer">补丁 ↗</a>'
      : '<a href="' + safeUrl(s.url) + '" target="_blank" rel="noopener noreferrer">来源 ↗</a>';
    return '<article class="card" data-detail="' + it._id + '">' +
      '<div class="card-top">' + tags + '<span class="date-tag">' + esc(dateLabel(it)) + "</span></div>" +
      "<h3>" + esc(it.n) + "</h3>" +
      '<div class="meta"><span>' + esc(it.g || "汉化者未标注") + '</span><span class="sep">/</span><span>' + esc(s.name) + "</span></div>" +
      '<div class="note">' + esc(it.note || "暂无补充说明，点详情查看来源与链接。") + "</div>" +
      '<div class="card-actions">' +
        '<a class="primary" href="' + safeUrl(it.u) + '" target="_blank" rel="noopener noreferrer">发布页 ↗</a>' + second +
        '<button type="button" data-detail="' + it._id + '">详情 ›</button>' +
      "</div></article>";
  }
  function renderCards(list) {
    $("view-cards").innerHTML = list.map(cardHtml).join("");
  }
  function renderTimeline(list) {
    var groups = {};
    list.forEach(function (it) {
      var key = it.d ? it.d.slice(0, 7) : "日期未标注";
      (groups[key] = groups[key] || []).push(it);
    });
    var keys = Object.keys(groups).sort(function (a, b) { return b.localeCompare(a); });
    $("view-timeline").innerHTML = keys.map(function (k) {
      var label = k === "日期未标注" ? "日期未标注" : k.slice(0, 4) + " 年 " + Number(k.slice(5, 7)) + " 月";
      var rows = groups[k].map(function (it) {
        return '<div class="tl-item" data-detail="' + it._id + '">' +
          '<span class="tl-date">' + esc(dateLabel(it)) + "</span>" + badge(it.p) +
          '<span class="tl-name">' + esc(it.n) + '<span class="tl-sub">' + esc(it.g || "汉化者未标注") + (it.v ? " · " + esc(it.v) : "") + (it.ai === true ? " · AI 辅助" : "") + "</span></span>" +
          '<span class="tl-link">' + esc(srcName(it.src)) + " ↗</span></div>";
      }).join("");
      return '<div class="tl-month"><b>' + esc(label) + "</b><span>" + groups[k].length + " 条</span></div>" + rows;
    }).join("");
  }
  function renderTable(list) {
    var rows = list.map(function (it) {
      return '<tr data-detail="' + it._id + '">' +
        '<td class="mono">' + esc(dateLabel(it)) + "</td><td>" + badge(it.p) + "</td>" +
        '<td class="name">' + esc(it.n) + (it.auto ? ' <span class="tag tag-auto">AUTO</span>' : "") + "</td><td>" + esc(it.g || "—") + "</td>" +
        '<td class="mono">' + esc(it.v || "—") + "</td>" +
        "<td>" + (it.ai === true ? '<span class="tag tag-ai">AI</span>' : it.ai === false ? '<span class="tag">人工</span>' : '<span class="tag">未标注</span>') + "</td>" +
        '<td class="mono">' + esc(srcName(it.src)) + "</td>" +
        '<td><a href="' + safeUrl(it.u) + '" target="_blank" rel="noopener noreferrer">发布页 ↗</a></td></tr>';
    }).join("");
    $("view-table").innerHTML = '<table><thead><tr><th>日期</th><th>平台</th><th>游戏</th><th>汉化者</th><th>版本</th><th>AI</th><th>来源</th><th>链接</th></tr></thead><tbody>' + rows + "</tbody></table>";
  }
  function renderViews(list) {
    ["cards", "timeline", "table"].forEach(function (v) { $( "view-" + v ).hidden = v !== state.view; });
    if (state.view === "cards") renderCards(list);
    else if (state.view === "timeline") renderTimeline(list);
    else renderTable(list);
    $("empty").hidden = list.length > 0;
  }

  /* ------------------------------ 渲染：详情抽屉 ------------------------------ */
  function openDetail(id) {
    var it = items.find(function (x) { return x._id === id; });
    if (!it) return;
    var s = SRC_MAP[it.src] || SRC_MAP.custom;
    var dText = it.d ? it.d + "（" + ({ pub: "发布者/汇总给出的确切发布日期", list: "盘点帖或报道的发布/检索日期，非该游戏确切发布日", ver: "清单里的版本制作日期码，非发布日" }[it.t] || "日期性质未标注") + "）" : "未标注";
    $("drawer-body").innerHTML =
      '<div class="d-eyebrow">条目详情 · ' + esc(it._id) + "</div>" +
      "<h2>" + esc(it.n) + "</h2>" +
      '<div class="d-badges">' + badge(it.p) + (it.auto ? '<span class="tag tag-auto">AUTO 自动抓取</span>' : "") + (it.ai === true ? '<span class="tag tag-ai">AI 辅助</span>' : "") + (it.v ? '<span class="tag tag-ver">' + esc(it.v) + "</span>" : "") + panBadge(it) + '<span class="tag">' + esc(it.k === "catalog" ? "存量清单" : "近期动态") + "</span></div>" +
      '<dl class="d-grid">' +
        "<dt>日期</dt><dd>" + esc(dText) + "</dd>" +
        "<dt>平台</dt><dd>" + esc(it.p) + "</dd>" +
        "<dt>汉化者</dt><dd>" + esc(it.g || "未标注") + "</dd>" +
        "<dt>版本</dt><dd>" + esc(it.v || "未标注") + "</dd>" +
        "<dt>AI 参与</dt><dd>" + esc(aiLabel(it.ai)) + "</dd>" +
        "<dt>网盘渠道</dt><dd>" + esc(panText(it)) + "</dd>" +
        "<dt>采集方式</dt><dd>" + (it.auto ? "定时自动抓取" + (it.firstSeen ? "（首次收录 " + esc(it.firstSeen) + "）" : "") + (it.confidence != null ? " · 置信度 " + it.confidence : "") : "人工整理快照 / 本机录入") + "</dd>" +
        "<dt>数据来源</dt><dd>" + esc(s.name) + '（' + esc(s.type) + "）</dd>" +
      "</dl>" +
      '<div class="d-section"><h4>发布说明 / 备注</h4><p>' + esc(it.note || "暂无补充说明。") + "</p></div>" +
      '<div class="d-section"><h4>来源说明</h4><p>' + esc(s.desc || "—") + "</p></div>" +
      '<div class="d-links">' +
        '<a class="main" href="' + safeUrl(it.u) + '" target="_blank" rel="noopener noreferrer">打开原始发布页 ↗</a>' +
        (it.dl ? '<a href="' + safeUrl(it.dl) + '" target="_blank" rel="noopener noreferrer">补丁 / Release ↗</a>' : "") +
        (s.url ? '<a href="' + safeUrl(s.url) + '" target="_blank" rel="noopener noreferrer">来源首页 ↗</a>' : "") +
      "</div>" +
      '<div class="d-warn">这里只记录「发布页标注了哪个网盘渠道」这一情报，不收录网盘链接、提取码、文件名或文件列表。补丁与下载地址请以发布者原始页面为准；本站不托管 ROM / ISO，也不对第三方下载内容的安全性作保证，请合法持有原版游戏并遵守作者声明。</div>';
    $("drawer").hidden = false;
    $("overlay").hidden = false;
  }
  function closeDrawer() { $("drawer").hidden = true; $("overlay").hidden = true; }

  /* ------------------------------ 渲染：数据源 ------------------------------ */
  function renderSources() {
    $("source-list").innerHTML = SOURCES.map(function (s) {
      var count = items.filter(function (it) { return it.src === s.id; }).length;
      return '<div class="source-card" data-source="' + esc(s.id) + '">' +
        '<div class="sc-head"><b>' + esc(s.name) + '</b><span class="sc-type">' + esc(s.type) + "</span></div>" +
        "<p>" + esc(s.desc) + "</p>" +
        '<div class="sc-foot"><span>更新 ' + esc(s.updated) + "</span><span>收录 " + count + " 条 · 点此筛选 ↗</span></div></div>";
    }).join("");
  }

  /* ------------------------------ 渲染：自动抓取状态 ------------------------------ */
  function renderAutoPanel() {
    var st = AUTO.stats || {};
    var report = Array.isArray(AUTO.report) ? AUTO.report : [];
    var at = AUTO.generatedAt ? new Date(AUTO.generatedAt).toLocaleString("zh-CN", { hour12: false }) : "";
    $("auto-badge").textContent = at ? "上次抓取 " + at : "等待首次抓取";
    $("footer-auto").textContent = at ? "自动抓取 " + at : "自动抓取待运行";

    if (!at) {
      $("auto-summary").innerHTML =
        '<div class="au-head">运行说明</div>' +
        '<p class="au-foot">尚未运行定时抓取。把本目录作为 GitHub 仓库根目录推送后，' +
        '<code>.github/workflows/update.yml</code> 会每天两次自动更新；也可以在本机执行 ' +
        '<code>node scripts/fetch.js &amp;&amp; node scripts/build.js</code>。</p>';
      $("auto-report").innerHTML = '<div class="au-row"><div class="ar-top">等待第一次运行<span class="au-status warn">未抓取</span></div><div class="ar-msg">人工整理的 ' + DATA.items.length + ' 条快照仍可正常浏览、筛选与导出。</div></div>';
      return;
    }
    var kpis = [
      { n: st.totalAutoItems == null ? AUTO_ITEMS.length : st.totalAutoItems, label: "自动索引条目" },
      { n: st.newThisRun == null ? 0 : st.newThisRun, label: "上次新增" },
      { n: st.pendingReview == null ? 0 : st.pendingReview, label: "待人工复核" },
      { n: (st.sourcesOk == null ? report.filter(function (r) { return r.status === "ok"; }).length : st.sourcesOk) + " / " + report.length, label: "正常数据源" }
    ];
    $("auto-summary").innerHTML =
      '<div class="au-head">上次运行 · ' + esc(at) + "</div>" +
      kpis.map(function (k) { return '<div class="au-kpi"><span>' + k.label + "</span><b>" + esc(k.n) + "</b></div>"; }).join("") +
      '<div class="au-foot">B站每日汇总 / 论坛新版帖 / 长帖增量 / 资讯站 → 结构化 → 去重 → 写回 ' +
      '<code>auto-data.js</code>。低置信度条目只进待审队列，不直接公开。</div>';

    var icon = { ok: "✅ 正常", warn: "⚠️ 部分", error: "❌ 失败" };
    $("auto-report").innerHTML = report.length ? report.map(function (r) {
      var cls = r.status === "ok" ? "ok" : r.status === "warn" ? "warn" : "error";
      return '<div class="au-row"><div class="ar-top"><span>' + esc(r.name || r.id) + '</span><span class="au-status ' + cls + '">' + (icon[r.status] || r.status) + "</span></div>" +
        '<div class="ar-meta">新增 ' + esc(r.count == null ? 0 : r.count) + " 条 · " + esc(r.ms == null ? 0 : r.ms) + " ms</div>" +
        '<div class="ar-msg">' + esc(r.message || "—") + "</div></div>";
    }).join("") : '<div class="au-row"><div class="ar-msg">本次没有启用任何数据源。</div></div>';
  }

  /* ------------------------------ GitHub 实时动态 ------------------------------ */
  function renderLive(list, at) {
    $("live-list").innerHTML = list.map(function (r) {
      var body, foot;
      if (r.error) {
        body = '<p style="color:var(--accent-ink)">读取失败：' + esc(r.error) + "</p>";
        foot = '<span>可手动打开仓库查看</span>';
      } else if (r.rel) {
        var rel = r.rel;
        var date = (rel.published_at || rel.created_at || "").slice(0, 10);
        var assets = (rel.assets || []).length;
        body = '<div class="lc-rel">' + esc(rel.name || rel.tag_name || "最新 Release") + "</div>" +
          '<p>' + esc(date) + " · " + esc(rel.tag_name || "") + (assets ? " · " + assets + " 个附件" : " · 无附件") + "</p>";
        foot = '<span>' + (assets ? "补丁通常在附件中" : "说明型发布") + '</span><a href="' + safeUrl(rel.html_url) + '" target="_blank" rel="noopener noreferrer">打开 Release ↗</a>';
      } else {
        body = "<p>暂无 Release（这类仓库多用 commit / 目录组织补丁）</p>";
        foot = '<span>看提交记录更准</span>';
      }
      return '<div class="live-card' + (r.error ? " error" : "") + '">' +
        '<div class="lc-top"><b>' + esc(r.repo) + '</b><span class="lc-tag">' + esc(r.tag) + "</span></div>" +
        body + '<div class="lc-foot">' + foot + '<a href="https://github.com/' + esc(r.repo) + '" target="_blank" rel="noopener noreferrer">仓库 ↗</a></div></div>';
    }).join("");
    $("live-status").textContent = "上次同步：" + at + " · " + list.length + " 个仓库 · 数据来自 GitHub 公开 API（匿名限额 60 次/小时）。";
  }
  async function syncGitHub(force) {
    if (!force) {
      try {
        var c = JSON.parse(localStorage.getItem(LS_LIVE) || "null");
        if (c && c.ts && Date.now() - c.ts < 30 * 60 * 1000) { renderLive(c.data, c.at); return; }
      } catch (e) { /* ignore */ }
    }
    var btn = $("btn-sync");
    btn.disabled = true;
    btn.textContent = "⟳ 同步中…";
    $("live-status").textContent = "正在请求 GitHub API…";
    var tasks = DATA.repos.map(async function (r) {
      try {
        var res = await fetch("https://api.github.com/repos/" + r.repo + "/releases?per_page=1", { headers: { Accept: "application/vnd.github+json" } });
        if (!res.ok) throw new Error(res.status === 403 ? "API 限流（403）" : "HTTP " + res.status);
        var arr = await res.json();
        return { repo: r.repo, tag: r.tag, rel: Array.isArray(arr) && arr[0] ? arr[0] : null };
      } catch (e) {
        return { repo: r.repo, tag: r.tag, error: e && e.message ? e.message : "网络不可用" };
      }
    });
    var results = await Promise.all(tasks);
    var at = new Date().toLocaleString("zh-CN", { hour12: false });
    renderLive(results, at);
    var fails = results.filter(function (r) { return r.error; }).length;
    if (fails) $("live-status").textContent += " 其中 " + fails + " 个读取失败（多为匿名限流或网络限制），稍后再试即可。";
    try { localStorage.setItem(LS_LIVE, JSON.stringify({ ts: Date.now(), at: at, data: results })); } catch (e) { /* ignore */ }
    btn.disabled = false;
    btn.textContent = "⟳ 同步 Release";
  }

  /* ------------------------------ 总渲染 ------------------------------ */
  function render() {
    var list = filtered();
    renderCharts(list);
    renderViews(list);
    $("result-count").textContent = "共 " + list.length + " / " + items.length + " 条";
    renderSourceFilter();
  }
  function resetAll() {
    state.q = ""; state.kind = "all"; state.ai = "all"; state.range = "all"; state.pan = "all";
    state.sort = "date-desc"; state.platforms.clear(); state.source = "";
    $("q").value = ""; $("q-clear").hidden = true;
    $("sel-kind").value = "all"; $("sel-ai").value = "all"; $("sel-range").value = "all"; $("sel-sort").value = "date-desc"; $("sel-pan").value = "all";
    renderPlatformChips(); render();
  }

  /* ------------------------------ 导入 / 导出 ------------------------------ */
  function exportJson() {
    var payload = {
      asOf: AS_OF,
      exportedAt: new Date().toISOString(),
      note: "复古汉化发布台导出。items 中仅含索引字段与发布页链接，不含 ROM / 镜像。",
      items: items.map(function (it) {
        var o = { n: it.n, p: it.p, d: it.d, t: it.t, g: it.g, ai: it.ai, v: it.v, k: it.k, src: it.src, u: it.u, dl: it.dl, note: it.note, pan: it.pan, panCode: it.panCode };
        if (it.auto) { o.auto = true; o.confidence = it.confidence; o.firstSeen = it.firstSeen; }
        return o;
      })
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "hanhua-index-" + AS_OF + ".json";
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    toast("已导出 " + payload.items.length + " 条索引");
  }
  function importJson(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(String(reader.result));
        var incoming = Array.isArray(parsed) ? parsed : (parsed.items || []);
        if (!Array.isArray(incoming) || !incoming.length) throw new Error("文件里没有 items 数组");
        var current = loadCustom();
        var seen = {};
        current.forEach(function (x) { seen[(x.n || "") + "|" + (x.p || "") + "|" + (x.d || "") + "|" + (x.u || "")] = 1; });
        var added = 0;
        incoming.forEach(function (raw) {
          var obj = normalize(raw, "u", 0);
          var key = obj.n + "|" + obj.p + "|" + obj.d + "|" + obj.u;
          if (seen[key]) return;
          seen[key] = 1;
          current.push({ n: obj.n, p: obj.p, d: obj.d, t: obj.t, g: obj.g, ai: obj.ai, v: obj.v, k: obj.k, src: obj.src, u: obj.u, dl: obj.dl, note: obj.note, pan: obj.pan, panCode: obj.panCode });
          added++;
        });
        saveCustom(current);
        rebuild(); renderPlatformChips(); renderSources(); render();
        toast("导入完成，新增 " + added + " 条（重复项已跳过）");
      } catch (e) { toast("导入失败：" + (e.message || "JSON 格式不对")); }
    };
    reader.readAsText(file, "utf-8");
  }

  /* ------------------------------ 事件绑定 ------------------------------ */
  function bind() {
    $("q").addEventListener("input", function (e) {
      state.q = e.target.value;
      $("q-clear").hidden = !state.q;
      render();
    });
    $("q-clear").addEventListener("click", function () { $("q").value = ""; state.q = ""; this.hidden = true; render(); });
    [["sel-kind", "kind"], ["sel-ai", "ai"], ["sel-range", "range"], ["sel-sort", "sort"], ["sel-pan", "pan"]].forEach(function (pair) {
      $(pair[0]).addEventListener("change", function (e) { state[pair[1]] = e.target.value; render(); });
    });
    $("platform-chips").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-plat]");
      if (!btn) return;
      var p = btn.dataset.plat;
      if (p === "__all") state.platforms.clear();
      else if (state.platforms.has(p)) state.platforms.delete(p);
      else state.platforms.add(p);
      renderPlatformChips(); render();
    });
    $("view-switch").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-view]");
      if (!btn) return;
      state.view = btn.dataset.view;
      Array.prototype.forEach.call(this.querySelectorAll("button"), function (b) { b.classList.toggle("active", b === btn); });
      renderViews(filtered());
    });
    $("btn-reset").addEventListener("click", resetAll);
    $("clear-source").addEventListener("click", function () { state.source = ""; render(); });

    function delegate(containerId) {
      $(containerId).addEventListener("click", function (e) {
        if (e.target.closest("a")) return;
        var el = e.target.closest("[data-detail]");
        if (el) openDetail(el.dataset.detail);
      });
    }
    delegate("view-cards"); delegate("view-timeline"); delegate("view-table");

    $("source-list").addEventListener("click", function (e) {
      var card = e.target.closest("[data-source]");
      if (!card) return;
      state.source = card.dataset.source;
      render();
      $("index").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    $("drawer-close").addEventListener("click", closeDrawer);
    $("overlay").addEventListener("click", closeDrawer);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { closeDrawer(); $("modal").hidden = true; }
    });

    $("btn-add").addEventListener("click", function () { $("modal").hidden = false; });
    $("modal-close").addEventListener("click", function () { $("modal").hidden = true; });
    $("modal-cancel").addEventListener("click", function () { $("modal").hidden = true; });
    $("add-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var f = new FormData(this);
      var raw = {
        n: f.get("n"), p: f.get("p"), d: f.get("d"), t: f.get("t"),
        g: f.get("g"), v: f.get("v"), ai: f.get("ai") === "yes" ? true : (f.get("ai") === "no" ? false : null),
        k: f.get("k"), src: "custom", u: f.get("u"), dl: f.get("dl"), note: f.get("note")
      };
      if (!raw.t && raw.d) raw.t = "pub";
      var custom = loadCustom();
      custom.push(raw);
      saveCustom(custom);
      rebuild(); renderPlatformChips(); renderSources(); render();
      this.reset();
      $("modal").hidden = true;
      toast("已录入，条目保存在本机浏览器");
    });

    $("btn-export").addEventListener("click", exportJson);
    $("btn-import").addEventListener("click", function () { $("file-input").click(); });
    $("file-input").addEventListener("change", function (e) {
      if (e.target.files && e.target.files[0]) importJson(e.target.files[0]);
      e.target.value = "";
    });
    $("btn-sync").addEventListener("click", function () { syncGitHub(true); });
    $("btn-theme").addEventListener("click", function () {
      var next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      localStorage.setItem(LS_THEME, next);
      renderViews(filtered());
      renderCharts(filtered());
    });
  }

  /* ------------------------------ 启动 ------------------------------ */
  function init() {
    try {
      var t = localStorage.getItem(LS_THEME);
      if (t === "dark" || t === "light") document.documentElement.dataset.theme = t;
    } catch (e) { /* ignore */ }
    rebuild();
    document.getElementById("asof").textContent = "截至 " + AS_OF + (AUTO_ITEMS.length ? " · 含自动抓取 " + AUTO_ITEMS.length + " 条" : "");
    Array.prototype.forEach.call(document.querySelectorAll(".asof-inline"), function (el) { el.textContent = DATA.asOf || AS_OF; });
    $("repo-count").textContent = DATA.repos.length;
    renderKpis(); renderPlatformChips(); renderSources(); renderAutoPanel(); render();
    bind();
    syncGitHub(false);
  }
  init();
})();
