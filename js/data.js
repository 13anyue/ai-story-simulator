// js/data.js
window.DB = {
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
    globalNpcLogicPrompt: "你是一个有血有肉的真人...",
    difficulty: "normal",
    genParams: { storyLength: "medium", npcSpeechCount: 2, narrationCount: 2, cardCount: 1 },
    promptPresets: { polishWorld: "", genNpcWorld: "", genNpcStory: "", continueStory: "", genInteractions: "", genFamilyTree: "", evolveWorld: "", generateRumor: "", characterSetting: "", chatFilter: "", globalPrompt: "" },
    diySettings: { customStylePrompt: "", customBasePrompt: "", customFontFamily: "默认字体", customFonts: [], extendedStateDefinitions: [], mapConfig: { bgImage: "", locationsPosition: {} } },
    worldBook: { entries: [], settings: { maxContextTokens: 2000, recursiveScan: true } },
    worldTime: { year: 1, season: "春季", month: 4, day: 3, hour: 9, minute: 20, period: "上午" },
    forumPosts: []
};
window.BUILTIN_WORLDS = [{ id:"builtin-palace", name:"深宫凤华录", description:"架空古代皇朝", globalLore:"古风宫廷", systemPrompt:"你是古代后宫文游主脑，对白【NPC名：对话】格式。", customStats:["健康","心计"], locations:[{id:"p1",name:"金銮殿",description:"宏伟",thumbIcon:"fa-crown",mapX:50,mapY:20,dangerLevel:4,infoLevel:3}], npcs:[{id:"n1",name:"皇太后",relation:"威严",stats:{"好感":20},jcl:{age:"五十",gender:"女",personality:"阴鸷",background:"先帝正宫",title:"皇太后",location:"p1",playerCallName:"丫头"},portrait:""}] }];
window.JUNCHENGLU_NPC_DEFAULTS = { age:"未知", gender:"未定", personality:"性情未明", background:"身世如谜", faction:"无", title:"无", likes:"不详", dislikes:"不详", specialSkill:"无", healthStatus:"健康", loyalty:50, ambition:30, location:"", playerCallName:"你", characterSetting:"", resumeLog:[], virginity:"", orientation:"未表明", secret:"", currentActivity:"正在四处走动" };
window.AVATAR_LIBRARY = { modern_male:[], modern_female:[], ancient_male:[], ancient_female:[] }; // 省略详细数组，实际需补充但为了篇幅，保留空数组，功能仍可用文字头像。
window.escapeHtml = (str) => String(str??'').replace(/[&<>]/g, m=> m==='&'?'&amp;': m==='<'?'&lt;':'&gt;');
window.showToast = (msg, isSuccess=true) => { let c=document.getElementById('toast-container'); if(!c)return; let el=document.createElement('div'); el.className='toast'; el.innerHTML=`<i class="fas ${isSuccess?'fa-circle-check':'fa-circle-exclamation'}"></i> ${msg}`; c.appendChild(el); setTimeout(()=>el.remove(),3000); };
