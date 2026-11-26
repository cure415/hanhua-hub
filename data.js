/* ============================================================================
 * 复古游戏汉化发布台 · 数据层
 * ----------------------------------------------------------------------------
 * 采集日期：2026-11-26（离线快照，非实时全量库）
 *
 * 数据说明（重要）：
 *  - 每条记录都指向「发布者原始页面」，本站不托管任何 ROM / ISO / 完整镜像。
 *  - d  = 日期；t = 日期性质
 *        pub  = 发布者/汇总明确给出的发布日期
 *        list = 汇总帖/报道的发布或检索日期（不是该游戏确切发布日）
 *        ver  = 版本日期码（清单仓库里的 MAKE 日期）
 *  - ai  = true AI 辅助 / false 明确人工 / null 未标注（不猜测）
 *  - k   = release（近期动态）| catalog（存量清单，通常无确切日期）
 *  - u   = 原始发布页；dl = 补丁 / Release 页（为空时请到原始页获取）
 *  - src = sources 里的来源 id
 *
 * 维护方式：按同样字段往后追加即可；也可在页面里用「录入」「导入 JSON」添加，
 * 自定义条目保存在浏览器 localStorage，导出后可合并回本文件。
 * ==========================================================================*/

window.HANHUA = {
  asOf: "2026-11-26",

  sources: [
    { id: "bili1015", name: "B站《2026-10-15 汉化情报汇总｜共 16 款》", type: "社区汇总", url: "https://m.bilibili.com/opus/1259475176467202067", updated: "2026-10-16", desc: "由汉化群消息每日自动生成，逐条给出平台、发布者、发布日期、原始视频地址与视频简介里的补丁/网盘说明。" },
    { id: "wlgooo", name: "围炉Go · 新汉化栏目", type: "资讯站", url: "https://www.wlgooo.com/category/%e6%96%b0%e6%b1%89%e5%8c%96", updated: "2026-11-24", desc: "按日更新的图文条目，标题含平台与版本，附攻略/金手指。部分早期条目只有栏目列表日期。" },
    { id: "smzdm1026", name: "什么值得买《30年前的游戏，这个月刚刚有了中文》", type: "媒体盘点", url: "https://post.smzdm.com/p/a70pz8xd/", updated: "2026-10-26", desc: "按日罗列 10 月下旬的汉化发布记录，并给出 2026 年 SFC 新汉化约为 2025 年两倍的社区口径统计。" },
    { id: "smzdm0821", name: "什么值得买《等了27年，皇家骑士团64终于有中文》", type: "媒体盘点", url: "https://post.smzdm.com/p/agg40v67", updated: "2026-08-21", desc: "记录 7—8 月N64/WSC/PS2 一批冷门作品的首次中文化。" },
    { id: "smzdm1103", name: "什么值得买《19年后土星格兰蒂亚终有中文》", type: "媒体盘点", url: "https://post.smzdm.com/p/ad7mzkqz", updated: "2026-11-03", desc: "按平台横截面盘点同一波发布与预告，多处点名 GPT-6.1 Sol / Claude 等 AI 工具链。" },
    { id: "a9vg", name: "A9VG《PS2 犬夜叉 奥义乱舞 汉化发布》", type: "论坛", url: "https://bbs.a9vg.com/archiver?tid-9074891.html", updated: "2026-10-26", desc: "发布者自述全程使用大模型汉化，并列出同期在做的 9 个 PS2/PS3 项目。" },
    { id: "stage1st", name: "Stage1st《超级机器人大战Z PS2 简中补丁 v0.1.0》", type: "论坛", url: "https://stage1st.com/2b/thread-2287382-1-1.html", updated: "2026-11", desc: "非官方非商业汉化，明确要求不要把补丁与游戏 ISO 捆绑传播，源码开源在 GitHub。" },
    { id: "bgm", name: "Bangumi《PSP 第二物语 汉化发布》", type: "发布日志", url: "https://bgm.tv/blog/380669", updated: "2026-09-27", desc: "完整记录以 Claude Code 编排 AI 工作流做 PSP 文本中文化的过程，人工调整约占 8.2%。" },
    { id: "gmeragoPS2", name: "游戏年代 GO《PS2 汉化游戏汇总(2025—2026)》", type: "论坛清单", url: "https://www.gmerago.com/forum.php?mod=viewthread&tid=10458", updated: "2026-11-03", desc: "按「游戏 —— 汉化者 —— 一句话简介」列出 60+ 款 PS2 汉化，无逐条发布日期与下载链接。" },
    { id: "gmeragoSFC", name: "《2025-2026年SFC新汉化游戏汇总》", type: "论坛清单", url: "https://www.gmerago.com/archiver?tid-10404.html", updated: "2026-10-26", desc: "统计 39 款（2026 年 26 款 / 2025 年 13 款），按 RPG / SRPG / ACT / AVG 分类并列出汉化组。" },
    { id: "cheatmakerMD", name: "《MD / SS 汉化游戏汇总(2025—2026)》", type: "论坛清单", url: "https://www.cheatmaker.org/archiver/showtopic-32981.aspx", updated: "2026-11-03", desc: "同系列按机种汇总，覆盖 MD、Master System、世嘉土星 SS。" },
    { id: "retrogameszh", name: "GitHub · nanL/RetroGamesZH", type: "GitHub", url: "https://github.com/nanL/RetroGamesZH", updated: "持续更新", desc: "目前最接近「中文复古汉化总表」的仓库：单一巨型 Markdown 表，字段为 SYS / CRC / NAME / LANG / MAKE / NOTE，含 2025—2026 新条目。无网页界面、无下载链接。" },
    { id: "dotslash", name: "GitHub · freefrank/CN_Patches", type: "GitHub", url: "https://github.com/freefrank/CN_Patches", updated: "持续更新", desc: "dotSlash 的补丁发布库：README 用表格列出游戏 / 平台 / 工具目录 / Release / 说明页，补丁在 Releases，图文说明在 cn.dotslash.pro。明确不含任何游戏资产。" },
    { id: "shiyi", name: "GitHub · shiyi1133/youxi-hanhua-releases", type: "GitHub", url: "https://github.com/shiyi1133/youxi-hanhua-releases", updated: "2026-11-07", desc: "汉化源码、补丁与原输入 ROM 的 SHA256 校验库，含 data/versions.json 等索引文件，不含 ROM。2026-10-21 建库。" },
    { id: "wsc", name: "GitHub · mariovirgili/WonderSwanColor-AI_Translation", type: "GitHub", url: "https://github.com/mariovirgili/WonderSwanColor-AI_Translation", updated: "2026-09-29", desc: "WSC 单平台 AI 英译：TITLES.md / PATCHES.md 列出版本、语言、补丁格式与 ROM CRC32；配套的 WonderSwan_bps_repo 每日自动镜像，wonderswan-web 可在浏览器里按 CRC32 自动匹配并应用补丁。是「可视化 + 自动更新」做得最好的范例，但仅 WSC、仅英译。" },
    { id: "srwzzh", name: "GitHub · dyzz/srwz-zh", type: "GitHub", url: "https://github.com/dyzz/srwz-zh", updated: "2026-11", desc: "PS2《超级机器人大战Z》简中补丁项目源码（mkps2iso 构建，HarmonyOS Sans 字库）。" },
    { id: "eva2", name: "GitHub · EVA-zh-Hans/nge_2_re", type: "GitHub", url: "https://github.com/EVA-zh-Hans/nge_2_re", updated: "2026-10", desc: "PSP《新世纪福音战士2》汉化工程，逐月更新进展，含 GPT 翻译与自动补丁构建模块。" },
    { id: "zndnovel", name: "GitHub · fotile96/Zndnovel", type: "GitHub", url: "https://github.com/fotile96/Zndnovel", updated: "2026-09", desc: "PSP《第二物语》中文本地化；docs/localization-starter 里有 AI 汉化工作流复盘，另附 Lua 反编译器。" },
    { id: "rapatches", name: "GitHub · RetroAchievements/RAPatches", type: "GitHub", url: "https://github.com/RetroAchievements/RAPatches", updated: "2024-07", desc: "按机种目录存放补丁文件（含 MD / PS2 / N64 / PC Engine 等），以英译与修复补丁为主，近年更新较少。" },
    { id: "emugif", name: "模拟游戏中文数据站 dat.emugif.com", type: "数据站", url: "https://dat.emugif.com/", updated: "2024 起持续", desc: "非 GitHub 的现成可视化数据站：按游戏机种浏览、可搜游戏名/发布者/版本、支持按 ID/名称/更新时间排序、区分发布时间与收录时间，含下载，并提供 ClrMamePro / OfflineList 的 DAT。偏向 ROM 目录管理，不是「最新汉化发布」视图。" },
    { id: "quanjizhong", name: "全机种社区《汉化游戏更新日志》", type: "论坛清单", url: "https://www.quanjizhong.top/thread-675-1-1.html", updated: "持续更新", desc: "按机种分段、逐条列出版本与汉化者的长帖，MD 一段就有 19 款。" },
    { id: "gameres", name: "GameRes / 网易《复活老游戏、剽窃新创意》", type: "媒体报道", url: "https://www.163.com/dy/article/LANGLCDP0526DPBA.html", updated: "2026-11-02", desc: "引用社区统计：仅 8 月就有超过 100 款新汉化游戏发布，把 AI 辅助与逆向 MCP 视为主要推力。" },
    { id: "retrotalk", name: "RetroGameTalk · Koei AI 英译补丁串", type: "论坛", url: "https://retrogametalk.com/threads/yu-no-a-girl-that-chants-love-from-the-edge-of-the-world-english-patch-nec-pc-98.19421/post-885803", updated: "2026-10-29", desc: "damon-daemon 一人批量 AI 英译光荣 PS1/PS2 历史模拟游戏，逐作开 GitHub 仓库。作为 AI 翻译潮的对照样本。" }
  ],

  // 用于「GitHub 实时动态」的监控仓库。页面会直接请求公开 GitHub API（匿名 60 次/小时）。
  repos: [
    { repo: "freefrank/CN_Patches", tag: "中文补丁发布库" },
    { repo: "shiyi1133/youxi-hanhua-releases", tag: "补丁 + SHA256 校验库" },
    { repo: "nanL/RetroGamesZH", tag: "中文汉化总表" },
    { repo: "mariovirgili/WonderSwan_bps_repo", tag: "WSC 补丁每日镜像" },
    { repo: "mariovirgili/WonderSwanColor-AI_Translation", tag: "WSC AI 翻译" },
    { repo: "EVA-zh-Hans/nge_2_re", tag: "PSP EVA2" },
    { repo: "dyzz/srwz-zh", tag: "PS2 机战Z" },
    { repo: "natsumerinchan/MyGalTranslationPatches", tag: "AI 翻译补丁集" },
    { repo: "5050ResearchCenter/5050-Localization-Collections", tag: "打包发布" },
    { repo: "RetroAchievements/RAPatches", tag: "按机种补丁目录" },
    { repo: "damon-daemon/taiko-risshiden-5-english", tag: "PS2 AI 英译" }
  ],

  items: [
    // ---- B站 2026-10-15 汉化情报汇总（16 款，均有原始视频地址） ----
    { n: "双月传说", p: "FC", d: "2026-10-14", t: "pub", g: "白光向日葵", ai: true, v: "v0.51", k: "release", src: "bili1015", u: "https://www.bilibili.com/video/BV18npm6CEA3", dl: "", note: "协力 GPT 6.1 Sol；文本全译并二次润色，附经验/金币倍率等修改补丁。" },
    { n: "彩虹六号3", p: "PS2", d: "2026-10-15", t: "pub", g: "编号46游戏宅", ai: true, v: "", k: "release", src: "bili1015", u: "https://www.bilibili.com/video/BV1JNpm6REAV", dl: "", note: "美版简中，制作署名「编号46 × ChatGPT」，简介内含两个网盘地址。" },
    { n: "少年忍者佐助", p: "SFC", d: "2026-10-15", t: "pub", g: "玩vr乒乓的汤姆", ai: null, v: "", k: "release", src: "bili1015", u: "https://www.bilibili.com/video/BV1X2JC6bEMT", dl: "", note: "提供小字版/大字版，大字版仍有待修问题。" },
    { n: "名侦探光之美少女 日蚀战", p: "SFC", d: "2026-09-30", t: "pub", g: "雪沐ユキル_Channel", ai: null, v: "", k: "release", src: "bili1015", u: "https://www.bilibili.com/video/BV1Enaf61ENJ", dl: "", note: "同人社团 TanpuriRPG 作品的动态回合制游戏汉化。" },
    { n: "宝可梦信长的野望 终极版", p: "NDS", d: "2026-10-14", t: "pub", g: "Ro_crush / 泼墨十三", ai: true, v: "4.0.4", k: "release", src: "bili1015", u: "https://www.bilibili.com/video/BV1gZp166Eqw", dl: "", note: "自述使用 WorkBuddy(Hy4+Deepseek) 制作；基于日版汉化 ROM 应用改版数据。" },
    { n: "寂静岭", p: "PS1", d: "2026-10-15", t: "pub", g: "mede_", ai: null, v: "", k: "release", src: "bili1015", u: "https://www.bilibili.com/video/BV1ksJC6CErd", dl: "", note: "实机可玩、已去除 RHP；人工简单校对，下载链接见原视频评论区置顶。" },
    { n: "英雄传说1（Dragon Slayer）", p: "SFC", d: "2026-10-15", t: "pub", g: "sszl", ai: true, v: "", k: "release", src: "bili1015", u: "https://www.bilibili.com/video/BV1ThJk6DEzf", dl: "", note: "作者提到 AI 翻译问题较多、润色了好几个版本才勉强可看。" },
    { n: "超级街霸4 3D版", p: "3DS", d: "2026-10-15", t: "pub", g: "Mr小阿七", ai: null, v: "", k: "release", src: "bili1015", u: "https://www.bilibili.com/video/BV1mLJ16tER2", dl: "", note: "繁改简，出招表与剧情均处理，提供 cci / cia 两个版本。" },
    { n: "怪兽农场A", p: "GBA", d: "2026-10-15", t: "pub", g: "三校码农", ai: null, v: "", k: "release", src: "bili1015", u: "https://www.bilibili.com/video/BV1dFJ16BEAE", dl: "", note: "此前仅有日版/美版的冷门 GBA 作品。" },
    { n: "信长之野望2 烈风传", p: "3DS", d: "2026-10-15", t: "pub", g: "我也有梦想的foo", ai: null, v: "", k: "release", src: "bili1015", u: "https://www.bilibili.com/video/BV11nJC6jEuL", dl: "", note: "2015 年 3DS 版，箱庭内政 + 64 国大地图。" },
    { n: "黑之十三", p: "PS1", d: "2026-10-15", t: "pub", g: "艾罗斯尼欧", ai: null, v: "", k: "release", src: "bili1015", u: "https://www.bilibili.com/video/BV1YsJy6YEX3", dl: "", note: "绫辻行人监修的 13 篇视觉小说，已测试全部选择支（羽音篇仍有 BUG）。" },
    { n: "樱花大战GB 檄・花组入队！", p: "GBC", d: "2026-10-15", t: "pub", g: "猫多乐-Modlogue汉化组", ai: null, v: "", k: "release", src: "bili1015", u: "https://www.bilibili.com/video/BV1PyJy6SERn", dl: "", note: "菜单与界面一并处理，主线与六个结局分支已走通。" },
    { n: "FIFA 2004", p: "GBA", d: "2026-10-15", t: "pub", g: "蟹黄客", ai: null, v: "v1.02", k: "release", src: "bili1015", u: "https://www.bilibili.com/video/BV12oJC6QEap", dl: "", note: "8/10/12px 三套像素中文字库，附 v0.9—v1.02 更新日志。" },
    { n: "攻壳机动队 STAND ALONE COMPLEX", p: "PS2", d: "2026-10-15", t: "pub", g: "乖僻老登美希命初见中", ai: null, v: "测试版", k: "release", src: "bili1015", u: "https://www.bilibili.com/video/BV1HKJy61E54", dl: "", note: "仅在 PC 模拟器验证，未做 PS2 实机测试。" },
    { n: "新超级机器人大战", p: "PS1", d: "2026-10-15", t: "pub", g: "hotcofe--泓水", ai: null, v: "修正0.2", k: "release", src: "bili1015", u: "https://www.bilibili.com/video/BV1vwJ16MEMJ", dl: "", note: "修正版镜像，补丁链接在视频简介。" },
    { n: "勇者30", p: "PSP", d: "2026-10-15", t: "pub", g: "aikika", ai: null, v: "", k: "release", src: "bili1015", u: "https://www.bilibili.com/video/BV1t6J26cETY", dl: "", note: "基于日版，菜单/剧情/带字贴图全汉化，OP 加字幕；PPSSPP 与实机均可。" },

    // ---- 围炉Go「新汉化」栏目（2026-10-28 ~ 11-24） ----
    { n: "火焰纹章：魂缚之森", p: "GBA", d: "2026-11-24", t: "pub", g: "萤火", ai: null, v: "", k: "release", src: "wlgooo", u: "https://www.wlgooo.com/527762.html", dl: "", note: "附攻略，弓兵主角改版。" },
    { n: "高达回忆录：战争的记忆", p: "PSP", d: "2026-11-23", t: "pub", g: "", ai: null, v: "1.01", k: "release", src: "wlgooo", u: "https://www.wlgooo.com/526154.html", dl: "", note: "跨界高达 ACT，附金手指。" },
    { n: "王国之心2 最终混合版", p: "PS2", d: "2026-11-20", t: "pub", g: "鸿辉社", ai: null, v: "", k: "release", src: "wlgooo", u: "https://www.wlgooo.com/412151.html", dl: "", note: "中文攻略 + 金手指；汉化者据 PS2 汇总帖。" },
    { n: "棋魂2", p: "GBA", d: "2026-11-18", t: "pub", g: "", ai: null, v: "", k: "release", src: "wlgooo", u: "https://www.wlgooo.com/481416.html", dl: "", note: "围棋题材改编。" },
    { n: "玩具兵大战：地盘争夺", p: "GBA", d: "2026-11-16", t: "pub", g: "", ai: null, v: "", k: "release", src: "wlgooo", u: "https://www.wlgooo.com/501598.html", dl: "", note: "3DO 后期掌机兵人作品。" },
    { n: "格兰蒂亚3", p: "PS2", d: "2026-11-14", t: "pub", g: "飞云", ai: null, v: "", k: "release", src: "wlgooo", u: "https://www.wlgooo.com/484137.html", dl: "", note: "栏目标题标注 PS2 PC 版，附攻略金手指。" },
    { n: "三国志 完全汉化V2", p: "GBA", d: "2026-11-13", t: "pub", g: "", ai: null, v: "V2", k: "release", src: "wlgooo", u: "https://www.wlgooo.com/486393.html", dl: "", note: "底子取自《三国志 IV》，43 城 / 6 剧本 / 450 武将。" },
    { n: "王国之心1 最终混合版", p: "PS2", d: "2026-11-10", t: "pub", g: "鸿辉社", ai: null, v: "V2", k: "release", src: "wlgooo", u: "https://www.wlgooo.com/474518.html", dl: "", note: "图文攻略 + 金手指。" },
    { n: "魔法封神", p: "GBA", d: "2026-11-09", t: "pub", g: "", ai: null, v: "1.1", k: "release", src: "wlgooo", u: "https://www.wlgooo.com/402240.html", dl: "", note: "基于藤崎龙《封神演义》的日厂仙侠小品 RPG。" },
    { n: "恶魔城X 月下夜想曲（SS版）", p: "SS", d: "2026-11-06", t: "pub", g: "", ai: null, v: "1.02", k: "release", src: "wlgooo", u: "https://www.wlgooo.com/457471.html", dl: "", note: "土星版汉化，图文攻略 + 金手指。" },
    { n: "英雄战记：烈焰之剑", p: "NDS", d: "2026-11-03", t: "pub", g: "", ai: null, v: "V4", k: "release", src: "wlgooo", u: "https://www.wlgooo.com/category/%e6%96%b0%e6%b1%89%e5%8c%96", dl: "", note: "栏目列表日期，具体文章链接未收录。" },
    { n: "奥特曼格斗进化2", p: "PS2", d: "2026-11-01", t: "pub", g: "", ai: null, v: "", k: "release", src: "wlgooo", u: "https://www.wlgooo.com/category/%e6%96%b0%e6%b1%89%e5%8c%96", dl: "", note: "附出招表；栏目列表日期。" },
    { n: "火焰纹章：无名英雄", p: "GBA", d: "2026-10-31", t: "pub", g: "萤火", ai: null, v: "", k: "release", src: "wlgooo", u: "https://www.wlgooo.com/category/%e6%96%b0%e6%b1%89%e5%8c%96", dl: "", note: "嵌入《封印之剑》世界观的前传改版。" },
    { n: "贤者世界", p: "NDS", d: "2026-10-30", t: "pub", g: "", ai: null, v: "", k: "release", src: "wlgooo", u: "https://www.wlgooo.com/category/%e6%96%b0%e6%b1%89%e5%8c%96", dl: "", note: "Lancarse 开发的迷宫探索 JRPG。" },
    { n: "无限航路", p: "NDS", d: "2026-10-28", t: "pub", g: "", ai: null, v: "X2", k: "release", src: "wlgooo", u: "https://www.wlgooo.com/category/%e6%96%b0%e6%b1%89%e5%8c%96", dl: "", note: "白金工作室太空歌剧，栏目标注汉化 X2（双版本）。" },

    // ---- 10 月下旬密集发布（媒体逐日盘点） ----
    { n: "游戏王 卡片力量6 全剧情AI汉化", p: "PSP", d: "2026-10-22", t: "pub", g: "", ai: true, v: "", k: "release", src: "smzdm1026", u: "https://post.smzdm.com/p/a70pz8xd/", dl: "", note: "全剧情 AI 汉化发布，社区互动 95 赞 / 79 评。" },
    { n: "玉茧物语", p: "PS1", d: "2026-10-23", t: "pub", g: "", ai: null, v: "", k: "release", src: "smzdm1026", u: "https://post.smzdm.com/p/a70pz8xd/", dl: "", note: "PS1 冷门作品汉化版发布。" },
    { n: "无主之地2（安卓版）", p: "Android", d: "2026-10-25", t: "pub", g: "", ai: true, v: "", k: "release", src: "smzdm1026", u: "https://post.smzdm.com/p/a70pz8xd/", dl: "", note: "作者自述「烧了几亿 token」的 AI 汉化。" },
    { n: "横行霸道·复仇", p: "GBA", d: "2026-10-25", t: "pub", g: "", ai: null, v: "", k: "release", src: "smzdm1026", u: "https://post.smzdm.com/p/a70pz8xd/", dl: "", note: "同日多款老游戏发补丁之一。" },
    { n: "抵抗1 灭绝人类", p: "PS3", d: "2026-10-26", t: "pub", g: "", ai: true, v: "", k: "release", src: "smzdm1026", u: "https://post.smzdm.com/p/a70pz8xd/", dl: "", note: "AI 汉化，标注模拟器 / 实机双环境。" },
    { n: "异度传说 系列", p: "PS2", d: "2026-10-26", t: "pub", g: "", ai: null, v: "公测", k: "release", src: "smzdm1026", u: "https://post.smzdm.com/p/a70pz8xd/", dl: "", note: "PS2 系列汉化版公测发布。" },
    { n: "RealSound ~风之回忆~", p: "SS", d: "2026-10-26", t: "pub", g: "", ai: null, v: "简繁", k: "release", src: "smzdm1026", u: "https://post.smzdm.com/p/a70pz8xd/", dl: "", note: "土星作品简繁中文版同日上线。" },
    { n: "尤蒂的炼金工房", p: "PS2", d: "2026-10-26", t: "pub", g: "", ai: true, v: "", k: "release", src: "smzdm1026", u: "https://post.smzdm.com/p/a70pz8xd/", dl: "", note: "简体中文 LLM 机翻汉化版分享。" },
    { n: "龙之圣境", p: "GBC", d: "2026-10-26", t: "pub", g: "", ai: null, v: "", k: "release", src: "smzdm1026", u: "https://post.smzdm.com/p/a70pz8xd/", dl: "", note: "同日上线的新汉化。" },
    { n: "王者之师 复刻版", p: "SS", d: "2026-10-26", t: "pub", g: "", ai: null, v: "", k: "release", src: "smzdm1026", u: "https://post.smzdm.com/p/a70pz8xd/", dl: "", note: "土星平台同日上线。" },
    { n: "亚鲁巴战记外传 艾尔丹传奇", p: "SS", d: "2026-10-26", t: "pub", g: "有爱汉化组 / 逍遥卡哥", ai: null, v: "双版本", k: "release", src: "smzdm1026", u: "https://post.smzdm.com/p/a70pz8xd/", dl: "", note: "同一周末两版「撞车」；社区试玩认为有爱汉化组版连动画过场也汉化了。" },
    { n: "女神异闻录Q 暗影迷宫", p: "3DS", d: "2026-10-27", t: "pub", g: "", ai: true, v: "测试版", k: "release", src: "smzdm1026", u: "https://post.smzdm.com/p/a70pz8xd/", dl: "", note: "个人完整 AI 汉化测试版。" },
    { n: "赛马大亨", p: "GBA", d: "2026-10-27", t: "pub", g: "", ai: null, v: "v1.0", k: "release", src: "smzdm1026", u: "https://post.smzdm.com/p/a70pz8xd/", dl: "", note: "简体中文补丁 v1.0。" },
    { n: "重生传说", p: "PS2", d: "2026-10-27", t: "pub", g: "鸿辉社", ai: null, v: "", k: "release", src: "smzdm1026", u: "https://post.smzdm.com/p/a70pz8xd/", dl: "", note: "传说系列三线成长系统；汉化者据 PS2 汇总帖。" },

    // ---- 7—8 月「古董级」首次中文化 ----
    { n: "冬宫1", p: "PS2", d: "2026-07-31", t: "pub", g: "soulgainx", ai: null, v: "", k: "release", src: "smzdm0821", u: "https://post.smzdm.com/p/agg40v67", dl: "", note: "7 月末发布。" },
    { n: "超级机器人大战（N64）", p: "N64", d: "2026-08-05", t: "pub", g: "soulgainx", ai: null, v: "", k: "release", src: "smzdm0821", u: "https://post.smzdm.com/p/agg40v67", dl: "", note: "N64 机战首次中文化，玩家感慨「玩不过来了」。" },
    { n: "SD高达G世纪 独眼高达", p: "WSC", d: "2026-08-14", t: "pub", g: "soulgainx", ai: null, v: "", k: "release", src: "smzdm0821", u: "https://post.smzdm.com/p/agg40v67", dl: "", note: "WSC 平台。" },
    { n: "皇家骑士团64", p: "N64", d: "2026-08-21", t: "pub", g: "", ai: null, v: "", k: "release", src: "smzdm0821", u: "https://post.smzdm.com/p/agg40v67", dl: "", note: "1999 年发售、FAMI 通 33 分金殿堂，等了 27 年才有中文。" },
    { n: "EVE burst error PLUS", p: "PS2", d: "2026-08-21", t: "pub", g: "", ai: null, v: "", k: "release", src: "smzdm0821", u: "https://post.smzdm.com/p/agg40v67", dl: "", note: "90 年代悬疑 AVG 的 PS2 版。" },

    // ---- 单项目发布（论坛 / 日志 / 开源仓库） ----
    { n: "犬夜叉 奥义乱舞", p: "PS2", d: "2026-10-26", t: "pub", g: "初春厨", ai: true, v: "", k: "release", src: "a9vg", u: "https://bbs.a9vg.com/archiver?tid-9074891.html", dl: "", note: "全程 GPT-6.1 SOL + 人工审核；实机 OPL/netbox/SMB 已测。作者同期还有 9 个 PS2/PS3 项目在推进。" },
    { n: "第二物语 ~少女之夏与15分钟的记忆~", p: "PSP", d: "2026-09-27", t: "pub", g: "fotile96 / Zndnovel", ai: true, v: "", k: "release", src: "bgm", u: "https://bgm.tv/blog/380669", dl: "https://github.com/fotile96/Zndnovel", note: "Claude Code 编排 AI 工作流，人工调整约 8.2%；除五篇剧中剧小说外全部文本与 UI 已译。" },
    { n: "超级机器人大战Z", p: "PS2", d: "", t: "", g: "dyzz", ai: null, v: "v0.1.0 测试版", k: "release", src: "stage1st", u: "https://stage1st.com/2b/thread-2287382-1-1.html", dl: "https://github.com/dyzz/srwz-zh", note: "非官方非商业，请勿把补丁与 ISO 捆绑传播；字库用 HarmonyOS Sans，ISO 构建用 mkps2iso。确切发布日未标注。" },
    { n: "The Red Lantern", p: "PC", d: "", t: "", g: "dotSlash", ai: null, v: "v1", k: "catalog", src: "dotslash", u: "https://cn.dotslash.pro/red-lantern/", dl: "https://github.com/freefrank/CN_Patches/releases/tag/red-lantern-v1", note: "Steam 版；补丁为最小差量数据，仓库不含任何游戏资产。" },
    { n: "Star Ocean: First Departure R", p: "Switch", d: "", t: "", g: "dotSlash", ai: null, v: "v1.1", k: "catalog", src: "dotslash", u: "https://cn.dotslash.pro/star-ocean-fdr/", dl: "https://github.com/freefrank/CN_Patches/releases/tag/star-ocean-fdr-v1.1", note: "CN_Patches README 表格逐项列出工具目录 / 补丁 / 说明页。" },
    { n: "新世纪福音战士2 被创造的世界", p: "PSP", d: "", t: "", g: "EVA-zh-Hans", ai: true, v: "v1.1.0-beta", k: "catalog", src: "eva2", u: "https://github.com/EVA-zh-Hans/nge_2_re", dl: "https://github.com/EVA-zh-Hans/nge_2_re/releases", note: "2025-10 引入 GPT 翻译模块，逐月更新补丁架构与构建链。" },

    // ---- 11 月初按平台横截面盘点（日期为报道检索日，非确切发布日） ----
    { n: "格兰蒂亚（SS 简中移植补丁）", p: "SS", d: "2026-11-03", t: "list", g: "安达充 / Claude 程序", ai: true, v: "", k: "release", src: "smzdm1103", u: "https://post.smzdm.com/p/ad7mzkqz", dl: "", note: "19 年后土星版终有中文，程序署名 Claude。" },
    { n: "光明力量CD", p: "MD", d: "2026-11-03", t: "list", g: "", ai: null, v: "", k: "release", src: "smzdm1103", u: "https://post.smzdm.com/p/ad7mzkqz", dl: "", note: "含《远征邪神之国》《邪神的觉醒》两作重制合集，Mega CD 平台。" },
    { n: "漫画地带 完全汉化", p: "MD", d: "2026-11-03", t: "list", g: "泓水汉化(hotcofe)", ai: null, v: "", k: "release", src: "smzdm1103", u: "https://post.smzdm.com/p/ad7mzkqz", dl: "", note: "文本、象声词演示、游戏选项全部汉化。" },
    { n: "英雄战纪：奥林匹斯计划", p: "SFC", d: "2026-11-03", t: "list", g: "", ai: true, v: "测试版", k: "release", src: "smzdm1103", u: "https://post.smzdm.com/p/ad7mzkqz", dl: "", note: "明确标注 AI 汉化测试版，作者称完整通关测试后发布。" },
    { n: "神秘的约柜", p: "SFC", d: "2026-11-03", t: "list", g: "", ai: null, v: "", k: "release", src: "smzdm1103", u: "https://post.smzdm.com/p/ad7mzkqz", dl: "", note: "同期 SFC 集中补位作品之一。" },
    { n: "鲁多拉的秘宝", p: "SFC", d: "2026-11-03", t: "list", g: "", ai: null, v: "", k: "release", src: "smzdm1103", u: "https://post.smzdm.com/p/ad7mzkqz", dl: "", note: "同期 SFC 集中补位作品之一。" },
    { n: "时空之钥 菜单汉化", p: "SFC", d: "2026-11-03", t: "list", g: "", ai: null, v: "菜单汉化", k: "release", src: "smzdm1103", u: "https://post.smzdm.com/p/ad7mzkqz", dl: "", note: "仅菜单汉化。" },
    { n: "海钓太郎：迎向宝岛", p: "PS1", d: "2026-11-03", t: "list", g: "", ai: null, v: "", k: "release", src: "smzdm1103", u: "https://post.smzdm.com/p/ad7mzkqz", dl: "", note: "同期 PS1 发布。" },
    { n: "恶霸鲁尼（美版中文）", p: "PS2", d: "2026-11-03", t: "list", g: "", ai: null, v: "", k: "release", src: "smzdm1103", u: "https://post.smzdm.com/p/ad7mzkqz", dl: "", note: "美版中文化。" },
    { n: "鬼武者3（美版仿日汉化）", p: "PS2", d: "2026-11-03", t: "list", g: "拾一段星光", ai: null, v: "", k: "release", src: "smzdm1103", u: "https://post.smzdm.com/p/ad7mzkqz", dl: "", note: "汉化者据 PS2 汇总帖。" },
    { n: "谜岛琴手", p: "PS2", d: "2026-11-03", t: "list", g: "", ai: null, v: "", k: "release", src: "smzdm1103", u: "https://post.smzdm.com/p/ad7mzkqz", dl: "", note: "同期 PS2 发布。" },
    { n: "闪灵二人组 首都夺还作战", p: "GBA", d: "2026-11-03", t: "list", g: "", ai: null, v: "", k: "release", src: "smzdm1103", u: "https://post.smzdm.com/p/ad7mzkqz", dl: "", note: "同期 GBA 发布。" },
    { n: "龙珠TAG VS（先行试玩）", p: "PSP", d: "2026-11-03", t: "list", g: "", ai: null, v: "试玩", k: "release", src: "smzdm1103", u: "https://post.smzdm.com/p/ad7mzkqz", dl: "", note: "先行试玩。" },
    { n: "Great Battle of Rome 罗马的伟大战争", p: "PSP", d: "2026-11-03", t: "list", g: "", ai: null, v: "1.0", k: "release", src: "smzdm1103", u: "https://post.smzdm.com/p/ad7mzkqz", dl: "", note: "完美汉化 1.0 版，已开放下载测试。" },
    { n: "超级碧姬公主", p: "NDS", d: "2026-11-03", t: "list", g: "", ai: null, v: "v2", k: "release", src: "smzdm1103", u: "https://post.smzdm.com/p/ad7mzkqz", dl: "", note: "NDS/3DS 系同期条目。" },
    { n: "星际火狐64 3D（港中移植）", p: "3DS", d: "2026-11-03", t: "list", g: "", ai: null, v: "v0.9", k: "release", src: "smzdm1103", u: "https://post.smzdm.com/p/ad7mzkqz", dl: "", note: "港版中文移植。" },
    { n: "筋肉人", p: "GB", d: "2026-11-03", t: "list", g: "", ai: null, v: "", k: "release", src: "smzdm1103", u: "https://post.smzdm.com/p/ad7mzkqz", dl: "", note: "GB 汉化版正式发布。" },
    { n: "高级大战略2001", p: "DC", d: "2026-11-03", t: "list", g: "", ai: true, v: "", k: "release", src: "smzdm1103", u: "https://post.smzdm.com/p/ad7mzkqz", dl: "", note: "汉化说明里工具栏直接写着 GPT-6.1Sol。" },

    // ---- GitHub 侧 AI 翻译（含英译对照样本） ----
    { n: "Digital Monster - D-Project", p: "WSC", d: "2026-09-29", t: "pub", g: "mariovirgili", ai: true, v: "v0.9.1", k: "release", src: "wsc", u: "https://github.com/mariovirgili/WonderSwanColor-AI_Translation", dl: "https://github.com/mariovirgili/WonderSwan_bps_repo", note: "英译 AI 翻译；PATCHES.md 记录补丁格式与原始/目标 ROM CRC32。" },
    { n: "SD Gundam: Operation U.C.", p: "WSC", d: "2026-09-29", t: "pub", g: "mariovirgili", ai: true, v: "v0.9.2", k: "release", src: "wsc", u: "https://github.com/mariovirgili/WonderSwanColor-AI_Translation", dl: "https://github.com/mariovirgili/WonderSwan_bps_repo", note: "英译 AI 翻译样本。" },
    { n: "Digimon Tamers: Brave Tamer", p: "WSC", d: "2026-09-29", t: "pub", g: "mariovirgili / Syldra", ai: true, v: "v0.9.2", k: "release", src: "wsc", u: "https://github.com/mariovirgili/WonderSwanColor-AI_Translation", dl: "https://github.com/mariovirgili/WonderSwan_bps_repo", note: "英译 AI 翻译样本。" },
    { n: "太阁立志传5（AI 英译）", p: "PS2", d: "2026-10-29", t: "list", g: "damon-daemon", ai: true, v: "", k: "release", src: "retrotalk", u: "https://github.com/damon-daemon/taiko-risshiden-5-english", dl: "https://github.com/damon-daemon/taiko-risshiden-5-english/releases", note: "一人批量 AI 英译光荣历史模拟系列；英译，非中文汉化，作为 AI 翻译潮对照。" },
    { n: "信长之野望 岚世记 PUK（AI 英译）", p: "PS2", d: "2026-10-29", t: "list", g: "damon-daemon", ai: true, v: "", k: "release", src: "retrotalk", u: "https://github.com/damon-daemon/nobunaga-ranseiki-puk-english", dl: "https://github.com/damon-daemon/nobunaga-ranseiki-puk-english/releases", note: "Full machine translation；英译对照样本。" },
    { n: "三国志5 PUK（AI 英译）", p: "PS1", d: "2026-10-29", t: "list", g: "damon-daemon", ai: true, v: "", k: "release", src: "retrotalk", u: "https://github.com/damon-daemon/sangokushi-5-puk-english", dl: "", note: "英译对照样本。" },

    // ---- PS2 存量清单（2026-11-03 汇总，逐条无确切发布日） ----
    { n: "仙乐传说", p: "PS2", d: "2026-11-03", t: "list", g: "鸿辉社", ai: null, v: "", k: "catalog", src: "gmeragoPS2", u: "https://www.gmerago.com/forum.php?mod=viewthread&tid=10458", dl: "", note: "双世界设定的人气传说系列。" },
    { n: "深渊传说", p: "PS2", d: "2026-11-03", t: "list", g: "鸿辉社", ai: null, v: "", k: "catalog", src: "gmeragoPS2", u: "https://www.gmerago.com/forum.php?mod=viewthread&tid=10458", dl: "", note: "克隆主角成长主题 RPG。" },
    { n: "王国之心 Re 记忆之链", p: "PS2", d: "2026-11-03", t: "list", g: "鸿辉社", ai: null, v: "", k: "catalog", src: "gmeragoPS2", u: "https://www.gmerago.com/forum.php?mod=viewthread&tid=10458", dl: "", note: "卡片战斗外传。" },
    { n: "荒野兵器 3 / 4 / 5 / F", p: "PS2", d: "2026-11-03", t: "list", g: "鸿辉社", ai: null, v: "系列 4 作", k: "catalog", src: "gmeragoPS2", u: "https://www.gmerago.com/forum.php?mod=viewthread&tid=10458", dl: "", note: "同一汉化者打包完成整个系列。" },
    { n: "浪漫沙加 吟游诗人之歌", p: "PS2", d: "2026-11-03", t: "list", g: "鸿辉社", ai: null, v: "", k: "catalog", src: "gmeragoPS2", u: "https://www.gmerago.com/forum.php?mod=viewthread&tid=10458", dl: "", note: "自由剧本多结局。" },
    { n: "影之心 来自新世界", p: "PS2", d: "2026-11-03", t: "list", g: "鸿辉社", ai: null, v: "", k: "catalog", src: "gmeragoPS2", u: "https://www.gmerago.com/forum.php?mod=viewthread&tid=10458", dl: "", note: "审判之轮系统。" },
    { n: "幻想水浒传V", p: "PS2", d: "2026-11-03", t: "list", g: "白甲工坊 RE:WRITE", ai: null, v: "", k: "catalog", src: "gmeragoPS2", u: "https://www.gmerago.com/forum.php?mod=viewthread&tid=10458", dl: "", note: "108 星收集。" },
    { n: "格兰蒂亚X", p: "PS2", d: "2026-11-03", t: "list", g: "白甲工坊 RE:WRITE", ai: null, v: "", k: "catalog", src: "gmeragoPS2", u: "https://www.gmerago.com/forum.php?mod=viewthread&tid=10458", dl: "", note: "格兰蒂亚系列衍生 RPG。" },
    { n: "SD高达G世纪 SEED", p: "PS2", d: "2026-11-03", t: "list", g: "我想在兰州卖烧饼", ai: null, v: "", k: "catalog", src: "gmeragoPS2", u: "https://www.gmerago.com/forum.php?mod=viewthread&tid=10458", dl: "", note: "以 SEED 为中心的高达战棋。" },
    { n: "SD高达G世纪 NEO", p: "PS2", d: "2026-11-03", t: "list", g: "maishaobing", ai: null, v: "", k: "catalog", src: "gmeragoPS2", u: "https://www.gmerago.com/forum.php?mod=viewthread&tid=10458", dl: "", note: "收录机体广的高达战棋。" },
    { n: "真名法典 真红的圣痕", p: "PS2", d: "2026-11-03", t: "list", g: "伯翎飞云", ai: null, v: "", k: "catalog", src: "gmeragoPS2", u: "https://www.gmerago.com/forum.php?mod=viewthread&tid=10458", dl: "", note: "韩系风格 RPG。" },
    { n: "战国无双2 猛将传 / 帝国", p: "PS2", d: "2026-11-03", t: "list", g: "cr7xiaoyu / 机械狗 Official", ai: null, v: "两部资料片", k: "catalog", src: "gmeragoPS2", u: "https://www.gmerago.com/forum.php?mod=viewthread&tid=10458", dl: "", note: "汇总帖中两作分别署名。" },
    { n: "鬼武者2 / 鬼武者3", p: "PS2", d: "2026-11-03", t: "list", g: "拾一段星光 / She39", ai: null, v: "两作", k: "catalog", src: "gmeragoPS2", u: "https://www.gmerago.com/forum.php?mod=viewthread&tid=10458", dl: "", note: "一闪系统战国动作游戏。" },
    { n: "寂静岭3 / 寂静岭 起源", p: "PS2", d: "2026-11-03", t: "list", g: "mede_", ai: null, v: "两作", k: "catalog", src: "gmeragoPS2", u: "https://www.gmerago.com/forum.php?mod=viewthread&tid=10458", dl: "", note: "恐怖生存系列。" },
    { n: "太阁立志传5", p: "PS2", d: "2026-11-03", t: "list", g: "mszl100", ai: null, v: "", k: "catalog", src: "gmeragoPS2", u: "https://www.gmerago.com/forum.php?mod=viewthread&tid=10458", dl: "", note: "战国人生模拟。" },
    { n: "南梦宫 X 卡普空", p: "PS2", d: "2026-11-03", t: "list", g: "ANYHOW_YLH", ai: null, v: "", k: "catalog", src: "gmeragoPS2", u: "https://www.gmerago.com/forum.php?mod=viewthread&tid=10458", dl: "", note: "两大厂商角色跨界。" },
    { n: "龙珠Z 电光石火3", p: "PS2", d: "2026-11-03", t: "list", g: "cloud_game 等", ai: null, v: "", k: "catalog", src: "gmeragoPS2", u: "https://www.gmerago.com/forum.php?mod=viewthread&tid=10458", dl: "", note: "3D 格斗，收录角色极多。" },
    { n: "宿命传说 导演剪辑版", p: "PS2", d: "2026-11-03", t: "list", g: "阿什莉", ai: null, v: "", k: "catalog", src: "gmeragoPS2", u: "https://www.gmerago.com/forum.php?mod=viewthread&tid=10458", dl: "", note: "2D 战斗系统传说系列。" },
    { n: "名侦探柯南 大英帝国的遗产", p: "PS2", d: "2026-11-03", t: "list", g: "生锈的锄头 / 云猫 / PPPalus", ai: null, v: "", k: "catalog", src: "gmeragoPS2", u: "https://www.gmerago.com/forum.php?mod=viewthread&tid=10458", dl: "", note: "程序与翻译分工明确。" },
    { n: "足球王国", p: "PS2", d: "2026-11-03", t: "list", g: "蟹黄客", ai: null, v: "", k: "catalog", src: "gmeragoPS2", u: "https://www.gmerago.com/forum.php?mod=viewthread&tid=10458", dl: "", note: "足球题材体育游戏。" },

    // ---- MD / SS 存量清单（2026-11-03 汇总） ----
    { n: "光明力量 诸神的遗产", p: "MD", d: "2026-11-03", t: "list", g: "盗版 / 添柴", ai: null, v: "", k: "catalog", src: "cheatmakerMD", u: "https://www.cheatmaker.org/archiver/showtopic-32981.aspx", dl: "", note: "光明力量初代，战棋 RPG 起点。" },
    { n: "光明力量2 古代封印", p: "MD", d: "2026-11-03", t: "list", g: "意志之路(Ken Tse)", ai: null, v: "宽屏加强版", k: "catalog", src: "cheatmakerMD", u: "https://www.cheatmaker.org/archiver/showtopic-32981.aspx", dl: "", note: "系列巅峰。" },
    { n: "新乞丐王子", p: "MD", d: "2026-11-03", t: "list", g: "小鬼混 / 飞雨影 修正", ai: null, v: "简繁修正", k: "catalog", src: "cheatmakerMD", u: "https://www.cheatmaker.org/archiver/showtopic-32981.aspx", dl: "", note: "基于全崴资讯原译的修正。" },
    { n: "幽游白书外传", p: "MD", d: "2026-11-03", t: "list", g: "AXI", ai: null, v: "", k: "catalog", src: "cheatmakerMD", u: "https://www.cheatmaker.org/archiver/showtopic-32981.aspx", dl: "", note: "漫画改编 RPG。" },
    { n: "梦幻之星2 不归的终点", p: "MD", d: "2026-11-03", t: "list", g: "永盛 / am", ai: null, v: "", k: "catalog", src: "cheatmakerMD", u: "https://www.cheatmaker.org/archiver/showtopic-32981.aspx", dl: "", note: "世嘉科幻 RPG 第二作。" },
    { n: "地球使命", p: "MD", d: "2026-11-03", t: "list", g: "肥鱼 MAX", ai: null, v: "", k: "catalog", src: "cheatmakerMD", u: "https://www.cheatmaker.org/archiver/showtopic-32981.aspx", dl: "", note: "科幻题材角色扮演。" },
    { n: "重装机兵雷诺斯", p: "MD", d: "2026-11-03", t: "list", g: "SchreckgSoldat / 阿刃", ai: null, v: "", k: "catalog", src: "cheatmakerMD", u: "https://www.cheatmaker.org/archiver/showtopic-32981.aspx", dl: "", note: "科幻机器人动作游戏。" },
    { n: "龙之力量 1 / 2 神去的大地", p: "SS", d: "2026-11-03", t: "list", g: "星龙八战士汉化组", ai: null, v: "两作", k: "catalog", src: "cheatmakerMD", u: "https://www.cheatmaker.org/archiver/showtopic-32981.aspx", dl: "", note: "百人军团战战棋 RPG。" },
    { n: "魔法骑士雷亚斯", p: "SS", d: "2026-11-03", t: "list", g: "星龙八战士汉化组", ai: null, v: "", k: "catalog", src: "cheatmakerMD", u: "https://www.cheatmaker.org/archiver/showtopic-32981.aspx", dl: "", note: "动画改编 SRPG。" },
    { n: "阿泽尔 铁甲飞龙RPG", p: "SS", d: "2026-11-03", t: "list", g: "星龙八战士 + 土星吧", ai: null, v: "", k: "catalog", src: "cheatmakerMD", u: "https://www.cheatmaker.org/archiver/showtopic-32981.aspx", dl: "", note: "铁甲飞龙系列 RPG 化。" },
    { n: "英雄传说3 白发魔女", p: "SS", d: "2026-11-03", t: "list", g: "安达充", ai: null, v: "", k: "catalog", src: "cheatmakerMD", u: "https://www.cheatmaker.org/archiver/showtopic-32981.aspx", dl: "", note: "Falcom 英雄传说系列。" },
    { n: "皇家骑士团2 公测版", p: "SS", d: "2026-11-03", t: "list", g: "逍遥卡哥", ai: null, v: "公测", k: "catalog", src: "cheatmakerMD", u: "https://www.cheatmaker.org/archiver/showtopic-32981.aspx", dl: "", note: "松野泰己战术 RPG 名作。" },
    { n: "樱花大战1", p: "SS", d: "2026-11-03", t: "list", g: "tpu / yzb / Gemini", ai: null, v: "", k: "catalog", src: "cheatmakerMD", u: "https://www.cheatmaker.org/archiver/showtopic-32981.aspx", dl: "", note: "破解与翻译分工。" },

    // ---- SFC 存量清单（2026-10-26 汇总，2026 年 26 款中选取） ----
    { n: "勇者斗恶龙5 天空的新娘", p: "SFC", d: "2026-10-26", t: "list", g: "SPACE0", ai: true, v: "AI 汉化测试版", k: "catalog", src: "gmeragoSFC", u: "https://www.gmerago.com/archiver?tid-10404.html", dl: "", note: "SPACE0 一人完成 4 部 DQ 的 AI 汉化。" },
    { n: "勇者斗恶龙6 幻之大地", p: "SFC", d: "2026-10-26", t: "list", g: "SPACE0", ai: true, v: "AI 汉化版", k: "catalog", src: "gmeragoSFC", u: "https://www.gmerago.com/archiver?tid-10404.html", dl: "", note: "梦世界与现实世界交织。" },
    { n: "勇者斗恶龙1&2", p: "SFC", d: "2026-10-26", t: "list", g: "SPACE0", ai: true, v: "AI 汉化测试版", k: "catalog", src: "gmeragoSFC", u: "https://www.gmerago.com/archiver?tid-10404.html", dl: "", note: "系列原点两作合集。" },
    { n: "勇者斗恶龙64", p: "SFC", d: "2026-10-26", t: "list", g: "SPACE0", ai: true, v: "AI 汉化测试版", k: "catalog", src: "gmeragoSFC", u: "https://www.gmerago.com/archiver?tid-10404.html", dl: "", note: "汇总帖原名照录。" },
    { n: "神圣记2", p: "SFC", d: "2026-10-26", t: "list", g: "sszl", ai: true, v: "中英双菜单", k: "catalog", src: "gmeragoSFC", u: "https://www.gmerago.com/archiver?tid-10404.html", dl: "", note: "SFC 末期冷门 RPG，AI 汉化版。" },
    { n: "大贝兽物语", p: "SFC", d: "2026-10-26", t: "list", g: "sszl", ai: null, v: "", k: "catalog", src: "gmeragoSFC", u: "https://www.gmerago.com/archiver?tid-10404.html", dl: "", note: "怪物培育 RPG。" },
    { n: "火炎之纹章 多拉基亚776", p: "SFC", d: "2026-10-26", t: "list", g: "狼组 / hlken / willzyj / LinuxDream", ai: null, v: "修正完善", k: "catalog", src: "gmeragoSFC", u: "https://www.gmerago.com/archiver?tid-10404.html", dl: "", note: "系列公认难度最高的一作。" },
    { n: "火焰之纹章 圣战之系谱", p: "SFC", d: "2026-10-26", t: "list", g: "狼组 / LinuxDream / ﾙｾｱ", ai: null, v: "多版本", k: "catalog", src: "gmeragoSFC", u: "https://www.gmerago.com/archiver?tid-10404.html", dl: "", note: "花屏修正、官译修正、改良版等多版本。" },
    { n: "火炎之纹章 纹章之谜", p: "SFC", d: "2026-10-26", t: "list", g: "狼组 / LinuxDream", ai: null, v: "花屏修正", k: "catalog", src: "gmeragoSFC", u: "https://www.gmerago.com/archiver?tid-10404.html", dl: "", note: "系列奠基作。" },
    { n: "浪漫沙加2", p: "SFC", d: "2026-10-26", t: "list", g: "12年汉化项目组", ai: null, v: "", k: "catalog", src: "gmeragoSFC", u: "https://www.gmerago.com/archiver?tid-10404.html", dl: "", note: "历时 12 年完成。" },
    { n: "洛克人X2", p: "SFC", d: "2026-10-26", t: "list", g: "夜海の朔望", ai: true, v: "日版 AI 汉化", k: "catalog", src: "gmeragoSFC", u: "https://www.gmerago.com/archiver?tid-10404.html", dl: "", note: "保留原版美术风格。" },
    { n: "恐怖惊魂夜", p: "SFC", d: "2026-10-26", t: "list", g: "AFOLF", ai: true, v: "AI 汉化版", k: "catalog", src: "gmeragoSFC", u: "https://www.gmerago.com/archiver?tid-10404.html", dl: "", note: "Chunsoft 音响小说名作。" },
    { n: "晦", p: "SFC", d: "2026-10-26", t: "list", g: "美希命", ai: true, v: "AI 汉化版", k: "catalog", src: "gmeragoSFC", u: "https://www.gmerago.com/archiver?tid-10404.html", dl: "", note: "悬疑恐怖文字冒险。" },
    { n: "大航海时代2", p: "SFC", d: "2026-10-26", t: "list", g: "爱折腾的老家伙", ai: null, v: "全角色全剧情", k: "catalog", src: "gmeragoSFC", u: "https://www.gmerago.com/archiver?tid-10404.html", dl: "", note: "航海模拟策略经典。" },
    { n: "超级玛利欧 耀西岛", p: "SFC", d: "2026-10-26", t: "list", g: "NOKOH", ai: null, v: "繁体", k: "catalog", src: "gmeragoSFC", u: "https://www.gmerago.com/archiver?tid-10404.html", dl: "", note: "NOKOH 5 款繁体汉化之一。" },
    { n: "幽游白书 / 特别篇", p: "SFC", d: "2026-10-26", t: "list", g: "九尾猫", ai: true, v: "两作", k: "catalog", src: "gmeragoSFC", u: "https://www.gmerago.com/archiver?tid-10404.html", dl: "", note: "对战格斗与视觉指令式对战，AI 汉化版。" },

    // ---- RetroGamesZH 清单里的近期版本日期码（ver，非发布日） ----
    { n: "名侦探柯南：黄昏的皇女", p: "WSC", d: "2026-03-09", t: "ver", g: "CLARK.H", ai: null, v: "v1.1", k: "catalog", src: "retrogameszh", u: "https://github.com/nanL/RetroGamesZH", dl: "", note: "清单 MAKE 字段版本日期码 20260309；CRC 7EC26B5E。" },
    { n: "钻子先生", p: "WSC", d: "2026-02-13", t: "ver", g: "CLARK.H", ai: null, v: "v1.0", k: "catalog", src: "retrogameszh", u: "https://github.com/nanL/RetroGamesZH", dl: "", note: "版本日期码 20260213；CRC 44B81767。" },
    { n: "恐惧2", p: "WSC", d: "2026-02-06", t: "ver", g: "CLARK.H", ai: null, v: "v1.1", k: "catalog", src: "retrogameszh", u: "https://github.com/nanL/RetroGamesZH", dl: "", note: "版本日期码 20260206；CRC AC07E297。" },
    { n: "另一个天堂：昨日记忆", p: "WSC", d: "2026-02-21", t: "ver", g: "CLARK.H", ai: null, v: "v1.2", k: "catalog", src: "retrogameszh", u: "https://github.com/nanL/RetroGamesZH", dl: "", note: "版本日期码 20260221；同作另有 v1.1。" },
    { n: "SD高达英雄传：骑士传说", p: "WSC", d: "2026-01-14", t: "ver", g: "CLARK.H", ai: null, v: "v1.2", k: "catalog", src: "retrogameszh", u: "https://github.com/nanL/RetroGamesZH", dl: "", note: "版本日期码 20260114；CRC AE039686。" },
    { n: "幻想魔传最游记：阳炎之所", p: "WSC", d: "2026-01-13", t: "ver", g: "CLARK.H", ai: null, v: "v1.0", k: "catalog", src: "retrogameszh", u: "https://github.com/nanL/RetroGamesZH", dl: "", note: "版本日期码 20260113；CRC E4772BAC。" },
    { n: "秋之回忆：庆典", p: "WSC", d: "2026-01-29", t: "ver", g: "CLARK.H", ai: null, v: "v1.0", k: "catalog", src: "retrogameszh", u: "https://github.com/nanL/RetroGamesZH", dl: "", note: "版本日期码 20260129；CRC 3B71536D。" },
    { n: "哥斯拉怪兽大乱斗", p: "GBA", d: "2026-02-22", t: "ver", g: "Advance", ai: null, v: "v1.0", k: "catalog", src: "retrogameszh", u: "https://github.com/nanL/RetroGamesZH", dl: "", note: "版本日期码 20260222；CRC DA006E58。" }
  ]
};
