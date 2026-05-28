// fix-palace-mode.js - 修复 detectPalaceMode 空值错误
(function() {
    // 修复原 detectPalaceMode 函数，添加安全保护
    if (typeof window.detectPalaceMode === 'function') {
        const originalDetect = window.detectPalaceMode;
        window.detectPalaceMode = function() {
            try {
                if (!window.gameState) return false;
                const worldName = (window.gameState.worldName || window.gameState.gameState?.worldName || '').toString();
                const globalLore = (window.gameState.globalLore || window.gameState.gameState?.globalLore || '').toString();
                const systemPrompt = (window.gameState.systemPrompt || window.gameState.gameState?.systemPrompt || '').toString();
                const combined = (worldName + globalLore + systemPrompt).toLowerCase();
                const keywords = ['后宫','宫廷','皇','妃','嫔','秀女','侍寝','翻牌','凤','龙','陛下','皇上','皇后','太后','贵妃','贵人','答应','常在','宫殿','御花园','金銮','冷宫','选秀','册封'];
                return keywords.some(kw => combined.includes(kw));
            } catch(e) {
                console.warn("detectPalaceMode 错误，返回 false", e);
                return false;
            }
        };
    } else {
        // 如果函数不存在，直接定义安全版本
        window.detectPalaceMode = function() {
            try {
                if (!window.gameState) return false;
                const worldName = (window.gameState.worldName || window.gameState.gameState?.worldName || '').toString();
                const globalLore = (window.gameState.globalLore || window.gameState.gameState?.globalLore || '').toString();
                const systemPrompt = (window.gameState.systemPrompt || window.gameState.gameState?.systemPrompt || '').toString();
                const combined = (worldName + globalLore + systemPrompt).toLowerCase();
                const keywords = ['后宫','宫廷','皇','妃','嫔','秀女','侍寝','翻牌','凤','龙','陛下','皇上','皇后','太后','贵妃','贵人','答应','常在','宫殿','御花园','金銮','冷宫','选秀','册封'];
                return keywords.some(kw => combined.includes(kw));
            } catch(e) {
                console.warn("detectPalaceMode 错误，返回 false", e);
                return false;
            }
        };
    }

    // 额外修复 launchWorldEngine 中可能出现的空值问题
    if (typeof window.launchWorldEngine === 'function') {
        const originalLaunch = window.launchWorldEngine;
        window.launchWorldEngine = async function(worldId) {
            // 确保 window.gameState 存在基本结构
            if (!window.gameState) window.gameState = {};
            if (!window.gameState.worlds) window.gameState.worlds = [];
            try {
                await originalLaunch(worldId);
            } catch(e) {
                console.error("launchWorldEngine 错误", e);
                alert("启动世界失败，请检查世界数据是否正确");
            }
        };
    }

    console.log("✅ palace-mode 修复补丁已加载");
})();
