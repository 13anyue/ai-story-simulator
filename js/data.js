// js/data.js - 全局状态与数据结构

// 全局状态数据库
let DB = {
    apiConfig: { endpoint: "https://api.openai.com/v1", key: "", model: "gpt-4o-mini" },
    worlds: [],
    saves: [],
    activeWorldId: null,
    gameState: null,
    isNightMode: false,
    storyRound: 0,
    weather: "晴好",
    festival: "平日",
    festivalCustom: "",
    rumors: [],
    timelineMilestones: [],
    destinyPoints: 3,
    maps: [],
    currentMapId: null,
    deletedNpcs: [],
    storyPaused: false,
    autoWorldLogEnabled: false,
    autoWorldLogTrigger: "",
    npcAutoMove: false,
    npcMoveInterval: 3,
    npcMoveCounter: 0,
    npcMoveMaxCount: 2,
    acquaintanceTracker: { counts: {}, ignored: [] },
    acquaintanceThreshold: 3,
    interactionTags: {},
    userProfiles: [],
    activeUserProfileId: null,
    historyFoldThreshold: 20,
    summaryThreshold: 5,
    bubbleStyles: { selfBg: "#3b82f6", selfColor: "#ffffff", npcBg: "#e4e4e7", npcColor: "#18181b" },
    inlineComponentPrompt: "",
    globalNpcLogicPrompt: "你是一个有血有肉的真人，拥有独立的性格、欲望、恐惧和秘密。",
    difficulty: "normal",
    genParams: { storyLength: "medium", npcSpeechCount: 2, narrationCount: 2, cardCount: 1 },
    // 预设提示词
    promptPresets: {
        polishWorld: "请对以下世界观设定进行润色...",
        genNpcWorld: "请基于当前世界观设定创造一个全新NPC...",
        genNpcStory: "请根据当前剧情发展创造一个与故事紧密相关的新NPC...",
        continueStory: "作为文字游戏推演机，请顺应当前局势续写剧情...",
        genInteractions: "请根据当前NPC的性格、背景和关系，生成5个具体的交互选项...",
        genFamilyTree: "请基于当前已知的NPC信息，生成一张家族关系网络...",
        evolveWorld: "请根据最近的剧情发展，描述当前场景发生了怎样的环境变化...",
        generateRumor: "请根据最近的重大事件，生成一条正在NPC间流传的传闻...",
        characterSetting: "请为以下NPC撰写一段详细的角色设定...",
        chatFilter: "【禁词过滤规则】你绝对不能输出以下任何词汇..."
    },
    // 高自由度DIY设置
    diySettings: {
        customStylePrompt: "",
        customBasePrompt: "",
        customFontFamily: "默认字体",
        customFonts: [],
        extendedStateDefinitions: [],
        mapConfig: { bgImage: "", locationsPosition: {} }
    },
    worldBook: {
        entries: [],
        settings: { maxContextTokens: 2000, recursiveScan: true }
    },
    worldTime: { year: 1, season: "春季", month: 4, day: 3, hour: 9, minute: 20, period: "上午" },
    forumPosts: []
};

// 默认内置世界
const BUILTIN_WORLDS = [
    {
        id: "builtin-palace",
        name: "深宫凤华录",
        description: "架空古代皇朝。新帝初登大宝，朝堂波谲云诡，后宫佳丽各怀机心。",
        globalLore: "【世界观约束】古风华美宫廷文风。皇帝冷酷多疑，太后威严垂帘。",
        systemPrompt: "你是高自由度古代后宫文字游戏推演主脑。用冷艳考究的半文言古风文笔描写。对白使用【NPC名：对话内容】格式。每次给出3-5个高自由度选项。",
        customStats: ["健康", "容貌", "心计", "皇帝好感", "威望", "白银"],
        locations: [
            { id: "p1", name: "金銮大殿", description: "帝王理朝听政之核心宏伟场所", thumbIcon: "fa-crown", mapX: 50, mapY: 20, dangerLevel: 4, infoLevel: 3 },
            { id: "p2", name: "御花园", description: "假山环绕、奇花异草遍布的隐秘相遇地", thumbIcon: "fa-leaf", mapX: 25, mapY: 55, dangerLevel: 2, infoLevel: 4 },
            { id: "p3", name: "冷宫冷阁", description: "失宠嫔妃囚禁处，寂静阴冷", thumbIcon: "fa-ghost", mapX: 75, mapY: 70, dangerLevel: 5, infoLevel: 1 },
            { id: "p4", name: "凤仪宫", description: "执掌六宫的皇后娘娘正殿寝宫", thumbIcon: "fa-gem", mapX: 50, mapY: 45, dangerLevel: 3, infoLevel: 4 }
        ],
        npcs: [
            { id: "n1", name: "萧皇太后", relation: "威严长辈", stats: { "好感": 20 }, jcl: { age: "五十有六", gender: "女", personality: "阴鸷深沉", background: "先帝正宫，历经三朝而不倒", title: "皇太后", location: "p4", playerCallName: "你这丫头" }, portrait: "" },
            { id: "n2", name: "顾贵妃", relation: "针锋相对", stats: { "好感": -10 }, jcl: { age: "二十有三", gender: "女", personality: "娇媚善妒", background: "江南织造府千金选秀入宫", title: "贵妃", location: "p2", playerCallName: "妹妹" }, portrait: "" }
        ]
    },
    {
        id: "builtin-cyber",
        name: "霓虹废土2077",
        description: "霓虹高耸、义体横飞的近未来不夜城。大企业垄断生存资源。",
        globalLore: "【世界观约束】赛博朋克科幻文风，充满街头俚语与高科技质感。",
        systemPrompt: "你是不夜城底层的边缘行者推进器。文字风格冷硬、科技感十足。对白使用【NPC名：对话】格式。每次给出3-5个高风险高收益选项。",
        customStats: ["生命阈值", "神经负载", "信用点", "义体增幅", "街头声望"],
        locations: [
            { id: "c1", name: "来生酒吧", description: "传奇雇佣兵与黑市中间人的集散核心", thumbIcon: "fa-martini-glass", mapX: 40, mapY: 50, dangerLevel: 3, infoLevel: 5 },
            { id: "c2", name: "歌舞伎区黑诊所", description: "提供地下非法义体割接与超频芯片植入", thumbIcon: "fa-syringe", mapX: 65, mapY: 35, dangerLevel: 4, infoLevel: 2 }
        ],
        npcs: [
            { id: "n3", name: "杰克", relation: "利益合伙人", stats: { "信任": 60 }, jcl: { age: "34", gender: "男", personality: "油滑世故", background: "前军用黑客因事故退役", title: "中间人", location: "c1", playerCallName: "伙计" }, portrait: "" }
        ]
    }
];

// NPC默认配置
const JUNCHENGLU_NPC_DEFAULTS = {
    age: "未知年岁", gender: "未定", personality: "性情未明", background: "身世如谜",
    faction: "无派系", title: "无封号", likes: "喜好不详", dislikes: "忌讳未探",
    specialSkill: "暂无特异", healthStatus: "康健无恙", loyalty: 50, ambition: 30,
    location: "", playerCallName: "你", characterSetting: "", resumeLog: [],
    virginity: "", orientation: "未表明", secret: "", currentActivity: "正在四处走动"
};

// 辅助函数
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    }).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function(c) { return c; });
}

function showToast(msg, isSuccess = true) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `toast ${isSuccess ? 'success' : 'error'}`;
    el.innerHTML = `<i class="fas ${isSuccess ? 'fa-circle-check' : 'fa-circle-exclamation'}"></i> ${escapeHtml(msg)}`;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

function decodeHtmlEntities(str) {
    return str.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}
