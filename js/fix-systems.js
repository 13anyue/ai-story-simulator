// fix-systems.js - 修复 detectPalaceMode 空值错误 & 补充缺失的常量

(function() {
    // 1. 确保 JUNCHENGLU_NPC_DEFAULTS 全局常量存在
    if (typeof window.JUNCHENGLU_NPC_DEFAULTS === 'undefined') {
        window.JUNCHENGLU_NPC_DEFAULTS = {
            age: "未知年岁",
            gender: "未定",
            personality: "性情未明",
            background: "身世如谜",
            faction: "无派系",
            title: "无封号",
            likes: "喜好不详",
            dislikes: "忌讳未探",
            specialSkill: "暂无特异",
            healthStatus: "康健无恙",
            loyalty: 50,
            ambition: 30,
            location: "",
            playerCallName: "你",
            characterSetting: "",
            resumeLog: [],
            virginity: "",
            orientation: "未表明",
            secret: "",
            currentActivity: "正在四处走动"
        };
        console.log("✅ JUNCHENGLU_NPC_DEFAULTS 已补全");
    }

    // 2. 安全地替换 detectPalaceMode 函数
    window.detectPalaceMode = function() {
        try {
            // 获取可能包含数据的对象
            const state = window.gameState || {};
            // 优先从 gameState 自身取，其次从 gameState.gameState 取
            const worldName = (state.worldName || state.gameState?.worldName || '').toString();
            const globalLore = (state.globalLore || state.gameState?.globalLore || '').toString();
            const systemPrompt = (state.systemPrompt || state.gameState?.systemPrompt || '').toString();
            const combined = (worldName + globalLore + systemPrompt).toLowerCase();
            const keywords = ['后宫','宫廷','皇','妃','嫔','秀女','侍寝','翻牌','凤','龙','陛下','皇上','皇后','太后','贵妃','贵人','答应','常在','宫殿','御花园','金銮','冷宫','选秀','册封'];
            return keywords.some(kw => combined.includes(kw));
        } catch(e) {
            console.warn("detectPalaceMode 出错，返回 false", e);
            return false;
        }
    };

    // 3. 可选：为 launchWorldEngine 增加临时保护，防止 JUNCHENGLU_NPC_DEFAULTS 缺失
    if (typeof window.launchWorldEngine === 'function') {
        const originalLaunch = window.launchWorldEngine;
        window.launchWorldEngine = async function(worldId) {
            // 确保常量存在
            if (typeof window.JUNCHENGLU_NPC_DEFAULTS === 'undefined') {
                window.JUNCHENGLU_NPC_DEFAULTS = {
                    age: "未知年岁", gender: "未定", personality: "性情未明",
                    background: "身世如谜", faction: "无派系", title: "无封号",
                    likes: "喜好不详", dislikes: "忌讳未探", specialSkill: "暂无特异",
                    healthStatus: "康健无恙", loyalty: 50, ambition: 30,
                    location: "", playerCallName: "你", characterSetting: "",
                    resumeLog: [], virginity: "", orientation: "未表明",
                    secret: "", currentActivity: "正在四处走动"
                };
            }
            try {
                await originalLaunch(worldId);
            } catch(e) {
                console.error("launchWorldEngine 执行出错", e);
                alert("启动世界失败：" + (e.message || "未知错误"));
            }
        };
    }

    // 4. 如果 window.gameState 本身没有 worlds 数组，提供一个默认空数组
    if (!window.gameState) window.gameState = {};
    if (!window.gameState.worlds) window.gameState.worlds = [];

    console.log("✅ systems 修复补丁已加载，detectPalaceMode 已安全化");
})();
