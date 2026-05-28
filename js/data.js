const DEFAULT_DATA = {
    api: { endpoint: '', key: '', model: '', temperature: 0.8, maxTokens: 2048 },
    personaList: [],
    worldList: [],
    activeWorldId: null,
    presets: [
        {
            id: 'default',
            name: '古风宫廷',
            content: `你是一个专业的文字游戏主持人，请根据以下设定进行游戏：
世界观：架空古代宫廷，玩家是初入宫廷的秀女。环境暗流涌动，充满权谋与情感纠葛。
规则：使用第二人称“你”叙述，对话使用**粗体**，内心活动使用*斜体*。重要物品和属性用【】标注。
每次回复给出三段式剧情描述，并在结尾提供3个明确的行动选项。`
        }
    ],
    theme: { primary:'#6c5ce7', bg:'#f8f9fa', cardBg:'#ffffff', text:'#2d3436', accent:'#e84393' },
    festivalList: ['春节,30', '中秋,90'],
    writingStyle: 'elegant',
    memoryMode: 'recent',
    memoryDepth: 20,
    worldBook: ''
};

function createNewGameInstance(worldName, rules) {
    return {
        worldName: worldName || '新世界',
        rules: rules || '',
        player: {
            name: '主角',
            title: '未知',
            stats: { 魅力: 50, 智慧: 50, 体力: 100, 金钱: 100 },
            inventory: [],
            privateItems: []
        },
        npcs: [],
        locations: [],
        currentLocationId: null,
        weather: '晴',
        season: '春',
        time: '辰时',
        day: 1,
        activeFestival: null,
        storyHistory: [],
        npcMeetCount: {},
        lifeLog: [],
        forumPosts: [],
        forumMessages: [],
        mapWorlds: [{ id:'default', name:'主世界', bgImage:'' }],
        currentMapWorldId: 'default',
        saveSlots: [],
        notifications: []
    };
}

const SAMPLE_NPCS = [
    {
        id: 'npc1',
        name: '柳如烟',
        title: '贵妃',
        avatarChar: '柳',
        stats: { 权势: 85, 好感: 20 },
        background: '皇帝宠妃，心机深沉，善于拉拢人心。',
        relations: [{ target: 'npc2', type: '敌对' }],
        familyTree: { father: '柳国公', mother: '王氏' },
        interactions: ['请安', '送礼', '交谈', '挑衅'],
        phoneContent: { apps: ['备忘录', '密函', '账本'], messages: [] }
    },
    {
        id: 'npc2',
        name: '李皇后',
        title: '皇后',
        avatarChar: '李',
        stats: { 权势: 95, 好感: 10 },
        background: '六宫之主，表面和善，实则手段强硬。',
        familyTree: { father: '李太师' },
        interactions: ['请安', '求助', '密谈'],
        phoneContent: { apps: ['凤印', '宫规'], messages: [] }
    }
];
