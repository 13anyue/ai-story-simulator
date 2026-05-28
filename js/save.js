// js/save.js - 数据持久化模块

// 初始化本地存储数据
function initLocalStorageData() {
    const localConfig = localStorage.getItem("AI_WENYOU_CONFIG");
    if (localConfig) DB.apiConfig = JSON.parse(localConfig);
    const localWorlds = localStorage.getItem("AI_WENYOU_WORLDS");
    if (localWorlds) {
        try { DB.worlds = JSON.parse(localWorlds); if (!DB.worlds.length) throw new Error(); }
        catch(e) { DB.worlds = JSON.parse(JSON.stringify(BUILTIN_WORLDS)); localStorage.setItem("AI_WENYOU_WORLDS", JSON.stringify(DB.worlds)); }
    } else { DB.worlds = JSON.parse(JSON.stringify(BUILTIN_WORLDS)); localStorage.setItem("AI_WENYOU_WORLDS", JSON.stringify(DB.worlds)); }
    const localSaves = localStorage.getItem("AI_WENYOU_SAVES");
    if (localSaves) DB.saves = JSON.parse(localSaves);
    const nightMode = localStorage.getItem("AI_WENYOU_NIGHTMODE");
    DB.isNightMode = nightMode === 'true';
    const inlinePrompt = localStorage.getItem("AI_WENYOU_INLINE_PROMPT");
    if (inlinePrompt) DB.inlineComponentPrompt = inlinePrompt;
    const savedBubbleStyles = localStorage.getItem("AI_WENYOU_BUBBLE_STYLES");
    if (savedBubbleStyles) DB.bubbleStyles = JSON.parse(savedBubbleStyles);
    const savedDifficulty = localStorage.getItem("AI_WENYOU_DIFFICULTY");
    if (savedDifficulty) DB.difficulty = savedDifficulty;
    // 字段同步
    document.getElementById('cfg-endpoint').value = DB.apiConfig.endpoint;
    document.getElementById('cfg-key').value = DB.apiConfig.key;
    document.getElementById('cfg-model').value = DB.apiConfig.model;
    document.getElementById('diy-inline-component-prompt').value = DB.inlineComponentPrompt;
    document.getElementById('diy-bubble-self-bg').value = DB.bubbleStyles.selfBg;
    document.getElementById('diy-bubble-self-color').value = DB.bubbleStyles.selfColor;
    document.getElementById('diy-bubble-npc-bg').value = DB.bubbleStyles.npcBg;
    document.getElementById('diy-bubble-npc-color').value = DB.bubbleStyles.npcColor;
    if (document.getElementById('difficulty-select')) document.getElementById('difficulty-select').value = DB.difficulty;
    renderLobbyWorlds();
    renderLobbySaves();
}

function saveEverything() {
    if (DB.gameState) autoSaveGameState();
    localStorage.setItem("AI_WENYOU_CONFIG", JSON.stringify(DB.apiConfig));
    localStorage.setItem("AI_WENYOU_WORLDS", JSON.stringify(DB.worlds));
    localStorage.setItem("AI_WENYOU_SAVES", JSON.stringify(DB.saves));
    localStorage.setItem("AI_WENYOU_NIGHTMODE", DB.isNightMode);
    localStorage.setItem("AI_WENYOU_INLINE_PROMPT", DB.inlineComponentPrompt);
    localStorage.setItem("AI_WENYOU_BUBBLE_STYLES", JSON.stringify(DB.bubbleStyles));
    localStorage.setItem("AI_WENYOU_DIFFICULTY", DB.difficulty);
    showToast("所有数据已安全保存！");
}

function autoSaveGameState() {
    if (!DB.gameState) return;
    const saveData = JSON.parse(JSON.stringify(DB.gameState));
    saveData._worldTime = JSON.parse(JSON.stringify(DB.worldTime));
    saveData._weather = DB.weather;
    saveData._festival = DB.festival;
    saveData._festivalCustom = DB.festivalCustom;
    saveData._timelineMilestones = DB.timelineMilestones;
    saveData._destinyPoints = DB.destinyPoints;
    saveData._rumors = DB.rumors;
    saveData._deletedNpcs = DB.deletedNpcs;
    saveData._autoWorldLogEnabled = DB.autoWorldLogEnabled;
    saveData._autoWorldLogTrigger = DB.autoWorldLogTrigger;
    const storyTerminal = document.getElementById('story-terminal');
    if (storyTerminal) saveData._storyTerminalHTML = storyTerminal.innerHTML;
    localStorage.setItem("AI_WENYOU_AUTOSAVE", JSON.stringify(saveData));
}

function checkAutoSavedGame() {
    const autoSave = localStorage.getItem("AI_WENYOU_AUTOSAVE");
    if (autoSave) {
        try {
            const parsed = JSON.parse(autoSave);
            if (parsed.worldName) {
                document.getElementById('lobby-resume-banner').classList.remove('hidden');
                document.getElementById('resume-world-name').innerText = `上次游玩：${parsed.worldName} · 位置：${parsed.currentLocationName || '未知'}`;
            }
        } catch(e) {}
    }
}

function resumeLastGame() {
    const autoSave = localStorage.getItem("AI_WENYOU_AUTOSAVE");
    if (!autoSave) { showToast("没有可恢复的进度。", false); return; }
    try {
        const parsed = JSON.parse(autoSave);
        DB.activeWorldId = parsed.worldId;
        DB.gameState = parsed;
        DB.worldTime = parsed._worldTime || DB.worldTime;
        DB.weather = parsed._weather || "晴好";
        DB.festival = parsed._festival || "平日";
        DB.festivalCustom = parsed._festivalCustom || "";
        document.getElementById('gp-world-title').innerText = DB.gameState.worldName;
        updateGameplayHeaderLocation();
        updateWorldTimeDisplay();
        updateWeatherDisplay();
        updateFestivalDisplay();
        applyMapBackgroundFromUrl();
        closeAllModals();
        switchScreen('screen-gameplay');
        switchSubview('subview-story');
        DB.deletedNpcs = parsed._deletedNpcs || [];
        const storyTerminal = document.getElementById('story-terminal');
        if (parsed._storyTerminalHTML && storyTerminal) {
            storyTerminal.innerHTML = parsed._storyTerminalHTML;
            storyTerminal.scrollTop = storyTerminal.scrollHeight;
        } else {
            storyTerminal.innerHTML = `<div class="text-xs italic">【时光锚定】恢复了上次的游玩进度。</div>`;
            triggerContinueStory();
        }
        applyBubbleStyles();
        if (document.getElementById('subview-stats') && !document.getElementById('subview-stats').classList.contains('hidden')) renderPlayerStatsAndResume();
        if (document.getElementById('subview-npc') && !document.getElementById('subview-npc').classList.contains('hidden')) renderNpcCards();
        autoSaveGameState();
    } catch(err) { showToast("自动存档损坏，无法恢复。", false); }
}

function executeSaveAction() {
    if (!DB.gameState) { showToast("未切入位面剧本！", false); return; }
    const newSaveItem = { worldName: DB.gameState.worldName, timestamp: new Date().toLocaleString(), gameState: JSON.parse(JSON.stringify(DB.gameState)) };
    newSaveItem.gameState._worldTime = JSON.parse(JSON.stringify(DB.worldTime));
    newSaveItem.gameState._weather = DB.weather;
    newSaveItem.gameState._festival = DB.festival;
    newSaveItem.gameState._festivalCustom = DB.festivalCustom;
    const storyTerminal = document.getElementById('story-terminal');
    if (storyTerminal) newSaveItem.gameState._storyTerminalHTML = storyTerminal.innerHTML;
    DB.saves.unshift(newSaveItem);
    if (DB.saves.length > 15) DB.saves.pop();
    localStorage.setItem("AI_WENYOU_SAVES", JSON.stringify(DB.saves));
    renderLobbySaves();
    showToast("存盘快照创建成功！");
}

function executeExportAction() {
    if (!DB.gameState) { showToast("无动态数据可导出。", false); return; }
    const exportData = JSON.parse(JSON.stringify(DB.gameState));
    exportData._worldTime = JSON.parse(JSON.stringify(DB.worldTime));
    exportData._weather = DB.weather;
    exportData._festival = DB.festival;
    exportData._festivalCustom = DB.festivalCustom;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `AI文游_${DB.gameState.worldName}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    showToast("JSON文件已下载！");
}

function executeImportFileAction(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const parsedState = JSON.parse(e.target.result);
                if (!parsedState.worldName || !parsedState.player) { showToast("非合规JSON游戏档！", false); return; }
                DB.gameState = parsedState;
                DB.activeWorldId = parsedState.worldId;
                if (parsedState._worldTime) DB.worldTime = parsedState._worldTime;
                if (parsedState._weather) DB.weather = parsedState._weather;
                if (parsedState._festival) DB.festival = parsedState._festival;
                if (parsedState._festivalCustom !== undefined) DB.festivalCustom = parsedState._festivalCustom;
                DB.deletedNpcs = parsedState._deletedNpcs || [];
                document.getElementById('gp-world-title').innerText = DB.gameState.worldName;
                updateGameplayHeaderLocation();
                updateWorldTimeDisplay();
                updateWeatherDisplay();
                updateFestivalDisplay();
                applyMapBackgroundFromUrl();
                switchScreen('screen-gameplay');
                switchSubview('subview-story');
                autoSaveGameState();
                triggerContinueStory();
                showToast("外部资产装载成功！");
            } catch(err) { showToast("文件解析崩塌。", false); }
        };
        reader.readAsText(input.files[0]);
    }
}
