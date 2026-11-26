/* ============================================================================
 * 复古汉化发布台 · 抓取源配置
 * 新增源只需往 SOURCES 里加一项，并在 fetch.js 的 dispatch 里复用已有 kind。
 * 所有 URL 都是发布者 / 论坛的公开页面；不采集网盘、ROM、ISO 直链。
 * ==========================================================================*/
"use strict";

const SOURCES = [
  {
    id: "bili-daily", kind: "bili", enabled: true,
    name: "B站《汉化情报汇总》每日专栏（自动抓取）", type: "社区汇总 · 自动",
    url: "https://space.bilibili.com/419762769/dynamic",
    desc: "作者「紫琥珀姐姐」每天发布一篇按平台逐条列出的汉化情报汇总。通过作者动态流发现最新专栏，再解析正文里的【平台】游戏名、汉化发布者、发布日期与原始视频地址。",
    mid: 419762769, maxOpus: 3, lookbackDays: 12
  },
  {
    id: "wlgooo-auto", kind: "wlgooo", enabled: true,
    name: "围炉Go · 新汉化栏目（自动抓取）", type: "资讯站 · 自动",
    url: "https://www.wlgooo.com/category/%e6%96%b0%e6%b1%89%e5%8c%96",
    desc: "栏目页按篇列出新汉化图文；逐篇读取 JSON-LD 的 datePublished 取发布日期。标记为「汇总日」，不冒充游戏确切发布日。",
    maxPosts: 8
  },
  {
    id: "yxhjgs-auto", kind: "wlgooo", enabled: false,
    name: "游戏年代 GO · 新汉化（镜像域名）", type: "资讯站 · 自动",
    url: "https://www.yxhjgs.com/category/%e6%96%b0%e6%b1%89%e5%8c%96",
    desc: "yxhjgs.com 与围炉Go为同一站点，默认关闭以免重复收录；需要时把 enabled 改为 true。",
    maxPosts: 8
  },
  {
    id: "a9vg-index-auto", kind: "forumIndex", enabled: true,
    name: "A9VG · PS2综合讨论区汉化发布帖（自动发现）", type: "论坛 · 自动",
    url: "https://bbs.a9vg.com/archiver/?fid-19.html",
    desc: "从 PS2 综合讨论区的 Archiver 版块索引里筛出新的「汉化发布 / 中文补丁」主题帖，逐帖解析标题中的机型与游戏名、发帖日期和 AI 说明。",
    titleInclude: /汉化发布|汉化版发布|简体中文补丁|中文补丁|中文化|汉化测试/,
    titleExclude: /汇总|总结|工具|管理器|金手指|模拟器|存档|FMCB|HDL|LaunchELF|系统|教程|求助|请问|合集|中文版，菜单|黑屏|解决办法|无法运行|怎么|出错|报错|失败|问题|有没有/,
    threadUrl: /tid-\d+\.html/, maxThreads: 8, platform: "PS2",
    postParser: "releaseThread"
  },
  {
    id: "stage1st-index-auto", kind: "forumIndex", enabled: true,
    name: "Stage1st · 游戏论坛汉化补丁帖（自动发现）", type: "论坛 · 自动",
    url: "https://stage1st.com/2b/forum-4-1.html",
    desc: "抓取游戏论坛版块索引里含「汉化 / 简体中文补丁」的新主题，逐帖解析。该版发布频率较低，抓不到新帖属正常。",
    titleInclude: /汉化发布|简体中文补丁|中文补丁|中文化|汉化版|补丁 v\d/,
    titleExclude: /汇总|总结|求助|请问|转载/,
    threadUrl: /thread-\d+/, maxThreads: 5, platform: "PS2",
    postParser: "releaseThread"
  },
  {
    id: "gmerago-sfc-auto", kind: "summaryThread", enabled: true,
    name: "遊戲年代 GO ·《SFC 新汉化汇总》长帖（增量）", type: "论坛清单 · 自动",
    url: "https://www.gmerago.com/archiver?tid-10404.html",
    desc: "按「《游戏名》（汉化组：X）——说明」逐行解析的长帖；每次运行只把新增行（与已有索引去重后）写进结果。",
    platform: "SFC"
  },
  {
    id: "gmerago-ps2-auto", kind: "summaryThread", enabled: true,
    name: "遊戲年代 GO ·《PS2 汉化游戏汇总》长帖（增量）", type: "论坛清单 · 自动",
    url: "https://www.gmerago.com/forum.php?mod=viewthread&tid=10458",
    desc: "PS2 汉化汇总长帖，按行解析新增条目；Archiver 版可读性更好时会自动回退。",
    platform: "PS2",
    fallbackUrl: "https://www.gmerago.com/archiver?tid-10458.html"
  },
  {
    id: "cheatmaker-auto", kind: "summaryThread", enabled: true,
    name: "CheatMaker ·《MD / SS 汉化游戏汇总》长帖（增量）", type: "论坛清单 · 自动",
    url: "https://www.cheatmaker.org/archiver/showtopic-32981.aspx",
    desc: "按「游戏名 —— 汉化者 —— 说明」逐行解析，并依据帖内「MD / Master System / 土星 SS」小标题自动切换机型。",
    platform: "MD"
  },
  {
    id: "quanjizhong-auto", kind: "logThread", enabled: true,
    name: "全机种社区 ·《汉化游戏更新日志》长帖（增量）", type: "论坛清单 · 自动",
    url: "https://www.quanjizhong.top/thread-675-1-1.html",
    desc: "按「机种N：平台（增加X款）」分段、逐行解析带版本 / 语言 / 汉化者标记的条目，每月更新一次的长帖。",
    platform: "其他"
  }
];

/** 页面「数据源」面板要展示的字段 */
function sourceDescriptor(s, generatedAt) {
  return {
    id: s.id, name: s.name, type: s.type, url: s.url,
    updated: generatedAt ? generatedAt.slice(0, 10) + " 自动" : "待首次抓取",
    desc: s.desc
  };
}

module.exports = { SOURCES: SOURCES, sourceDescriptor: sourceDescriptor };
