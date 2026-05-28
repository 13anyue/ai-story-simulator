// js/data.js
window.DB = {
    apiConfig: { endpoint: "https://api.openai.com/v1", key: "", model: "gpt-4o" },
    worlds: [],
    saves: [],
    activeWorldId: null,
    gameState: null,
    isNightMode: false,
    inlineComponentPrompt: "生成精美卡片，标题用emoji，内边距舒服，背景柔和。",
    globalNpcLogicPrompt: "你是有血有肉的真人，有自己的欲望和秘密，禁止复读机。",
    bubbleStyles: { selfBg: "#ff7eb3", selfColor: "#fff", npcBg: "#f1f1f1", npcColor: "#222" },
    weather: "晴好",
    festival: "平日",
    festivalLibrary: ["春节","中秋","七夕","冬至","万圣节","圣诞节"],
    customFestivals: [],
    worldTime: { year: 1, season: "春季", month: 3, day: 1, hour: 9, minute: 0, period: "上午" },
    storyRound: 0,
    npcs: [],
    maps: [{ id: "main", name: "主大陆", bgUrl: "", locations: [] }],
    currentMapId: "main",
    rumors: [],
    timelineMilestones: [],
    deletedNpcs: [],
    acquaintanceTracker: { counts: {}, ignored: [] },
    relationshipNetwork: { nodes: [], edges: [] },
    // 世界书（类酒馆AI）
    worldBook: { entries: [], settings: { recursiveScan: true } },
    // 高自由度DIY设置
    diySettings: {
        customStylePrompt: "",
        customBasePrompt: "",
        customFontFamily: "默认字体",
        customFonts: [],
        extendedStateDefinitions: [],
        mapConfig: { bgImage: "", locationsPosition: {} }
    },
    memory: { history_summary: "", key_events: [], relations: [], tasks: "", world_core: "", last_update: "", last_history_index: 0, world_summarized: false },
    forumPosts: [],
    userProfiles: [{ id: "default", name: "旅人", gender: "男", personality: "随和", background: "谜之旅人", specialSkill: "适应", secret: "", likes: "探索", boundWorldId: null }],
    activeUserProfileId: "default"
};

// 内置世界预设（示例）
DB.worlds = [
    { id: "palace", name: "深宫凤华录", description: "权谋与宫闱", globalLore: "皇权至上，后宫倾轧。", systemPrompt: "古风权谋。对白用【】，给出3个选项。", customStats: ["心计","圣宠"], locations: [{ id:"p1", name:"御花园", desc:"百花争艳", mapX:30, mapY:40 }], npcs: [] }
];
