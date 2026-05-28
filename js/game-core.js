// js/game-core.js - 游戏核心逻辑

// 进入世界引擎
function launchWorldEngine(worldId) {
    const world = DB.worlds.find(w => w.id === worldId);
    if (!world) return;
    clearAutoSave();
    DB.activeWorldId = worldId;
    DB.gameState = {
        worldId: world.id, worldName: world.name, globalLore: world.globalLore, systemPrompt: world.systemPrompt,
        currentLocationName: world.locations.length > 0 ? world.locations[0].name : "未知荒野",
        currentLocationId: world.locations.length > 0 ? world.locations[0].id : "",
        player: { name: "我", identity: "天选玩家", stats: {}, inventory: [], backpack: [], relations: [], resumeLog: [], jcl: { age: "未知", gender: "未定", personality: "自由灵魂", background: "来自异世界的旅行者", likes: "寻找真相" } },
        npcs: JSON.parse(JSON.stringify(world.npcs || [])),
        locations: JSON.parse(JSON.stringify(world.locations || [])),
        worldBookEntries: [{ keywords: "世界规则", text: world.globalLore, permanent: true, depth: 5 }],
        storyHistory: []
    };
    world.customStats.forEach(st => { DB.gameState.player.stats[st] = 50; });
    DB.worldTime = { year: 1, season: "春季", month: 4, day: 3, hour: 9, minute: 20, period: "上午" };
    DB.weather = "晴好"; DB.festival = "平日";
    document.getElementById('gp-world-title').innerText = world.name;
    updateGameplayHeaderLocation();
    updateWorldTimeDisplay();
    updateWeatherDisplay();
    updateFestivalDisplay();
    applyMapBackgroundFromUrl();
    switchScreen('screen-gameplay');
    switchSubview('subview-story');
    document.getElementById('set-system-prompt').value = world.systemPrompt;
    autoSaveGameState();
    applyBubbleStyles();
    DB.maps = [{ id: "map_" + Date.now(), name: world.name + "·主世界", bgUrl: DB.mapBackgroundUrl, locations: DB.gameState.locations }];
    DB.currentMapId = DB.maps[0].id;
    triggerInitialAILogic();
}

function clearAutoSave() { localStorage.removeItem("AI_WENYOU_AUTOSAVE"); document.getElementById('lobby-resume-banner').classList.add('hidden'); }

function exitWorldToLobby() {
    autoSaveGameState();
    DB.gameState = null;
    DB.activeWorldId = null;
    document.getElementById('bottom-nav-bar').style.display = 'none';
    document.querySelectorAll('.subview-panel').forEach(p => p.classList.add('hidden'));
    document.getElementById('story-terminal').innerHTML = '';
    switchScreen('screen-lobby');
    checkAutoSavedGame();
    showToast("已退出世界，进度已自动保存。");
}

function triggerInitialAILogic() {
    const term = document.getElementById('story-terminal');
    term.innerHTML = `<div class="text-xs italic animate-pulse"><i class="fas fa-spinner fa-spin"></i> AI正在演化初始剧情...</div>`;
    const initPrompt = `【序章】这是世界「${DB.gameState.worldName}」的开端。请为主角在「${DB.gameState.currentLocationName}」描绘一段精彩的开局剧情。当前时间：${document.getElementById('gp-world-history-preview').innerText}，天气：${DB.weather}，节日：${DB.festival}。对白使用【NPC名：话语】格式。`;
    generateStoryIteration(initPrompt);
}

async function generateStoryIteration(actionContextPrompt) {
    if (!DB.gameState) return;
    const finalSystem = buildFinalSystem();
    try {
        const rawResponse = await callLLMRequest(actionContextPrompt, finalSystem);
        parseAndRenderStoryResponse(rawResponse);
        advanceWorldTime(8 + Math.floor(Math.random() * 20));
        await tryTriggerNpcAutoMove();
        if (DB.storyRound % DB.summaryThreshold === 0) await autoSummarizeToWorldBook();
        autoFoldStoryHistory();
        autoSaveGameState();
    } catch (err) {
        console.error(err);
        showToast("AI 响应失败，请检查网络或 API 配置", false);
    }
}

function parseAndRenderStoryResponse(rawText) {
    rawText = decodeHtmlEntities(rawText);
    let cleanedText = rawText.replace(/\|\|([^|]+?)\|\|/g, '');
    const parts = cleanedText.split("||选项分组||");
    let mainBody = parts[0] ? parts[0].trim() : "剧情正在蔓延...";
    let choicesPart = parts[1] ? parts[1].trim() : "";
    if (!choicesPart) {
        const matches = rawText.match(/\|\|([^|]+?)\|\|/g);
        if (matches) choicesPart = matches.map(m => m.slice(2, -2).trim()).join("\n");
    }
    // 处理属性变化 [stat:xxx|±数值]
    mainBody = mainBody.replace(/\[stat:([^\]]+)\|([+\-]?\d+)\]/g, (match, attr, val) => {
        let delta = parseInt(val);
        if (DB.gameState && DB.gameState.player.stats[attr] !== undefined) {
            DB.gameState.player.stats[attr] = Math.max(0, Math.min(100, DB.gameState.player.stats[attr] + delta));
            autoSaveGameState();
        }
        return '';
    });
    const term = document.getElementById('story-terminal');
    const renderedBlocks = renderDialogueBubbles(mainBody);
    const lineBlock = document.createElement('div');
    lineBlock.innerHTML = `<div class="text-[11px] uppercase font-black"><i class="fas fa-bookmark"></i> 剧情记录:</div>`;
    lineBlock.appendChild(renderedBlocks);
    term.appendChild(lineBlock);
    term.scrollTop = term.scrollHeight;
    DB.storyRound = (DB.storyRound || 0) + 1;
    document.getElementById('story-round-counter').innerText = DB.storyRound;
    if (DB.autoWorldLogEnabled && DB.storyRound % DB.summaryThreshold === 0) autoSummarizeToWorldBook();
    // 选项渲染
    const choicesBox = document.getElementById('story-choices-box');
    choicesBox.innerHTML = '';
    let optionItems = [];
    if (choicesPart) optionItems = choicesPart.split('\n').filter(l => l.trim());
    if (optionItems.length === 0) {
        const altMatches = rawText.match(/\|\|([^|]+(?:\|[^|]+)*)\|\|/g);
        if (altMatches) {
            const inner = altMatches[0].slice(2, -2);
            optionItems = inner.split('|').map(opt => opt.trim());
        }
    }
    optionItems.forEach(choice => {
        const btn = document.createElement('button');
        btn.innerText = choice;
        btn.onclick = () => selectStoryChoice(choice);
        choicesBox.appendChild(btn);
    });
    if (DB.choicesCollapsed) choicesBox.classList.add('collapsed');
    else choicesBox.classList.remove('collapsed');
}

function renderDialogueBubbles(text) {
    const container = document.createElement('div');
    container.className = 'space-y-2';
    const dialogueRegex = /【(.+?)：(.+?)】/g;
    let lastIdx = 0;
    let m;
    while ((m = dialogueRegex.exec(text)) !== null) {
        if (m.index > lastIdx) {
            const nar = document.createElement('div');
            nar.className = 'narration-block';
            nar.innerText = text.substring(lastIdx, m.index).trim();
            container.appendChild(nar);
        }
        const wrap = document.createElement('div');
        wrap.className = 'bubble-wrap npc';
        wrap.innerHTML = `<div class="bubble-avatar">${m[1].charAt(0)}</div><div class="bubble-body"><div class="bubble-speaker">${m[1]}</div><div>${m[2]}</div></div>`;
        container.appendChild(wrap);
        lastIdx = m.index + m[0].length;
    }
    if (lastIdx < text.length) {
        const nar = document.createElement('div');
        nar.className = 'narration-block';
        nar.innerText = text.substring(lastIdx).trim();
        container.appendChild(nar);
    }
    return container;
}

function selectStoryChoice(choiceText) {
    if (DB.storyPaused) { showToast("⏸ 故事已暂停，请输入 /pause 并点击执行以继续", false); return; }
    const term = document.getElementById('story-terminal');
    const el = document.createElement('div');
    el.className = "text-right py-1";
    el.innerHTML = `<span class="text-xs px-3 py-1 rounded-full font-bold inline-block" style="background:var(--bubble-self-bg);color:var(--bubble-self-color);">行动：${choiceText}</span>`;
    term.appendChild(el);
    term.scrollTop = term.scrollHeight;
    advanceWorldTime(12 + Math.floor(Math.random()*30));
    generateStoryIteration(`【玩家抉择】：${choiceText}\n请推演后续剧情。使用【NPC名：对话】格式。`);
}

function submitCustomAction() {
    const input = document.getElementById('story-custom-input');
    const txt = input.value.trim();
    if (txt === '' || txt === '/pause') {
        DB.storyPaused = !DB.storyPaused;
        showToast(DB.storyPaused ? "⏸ 故事已暂停" : "▶️ 故事已继续");
        input.value = '';
        return;
    }
    if (DB.storyPaused) { showToast("⏸ 故事已暂停，请清空输入框点击执行以继续", false); input.value = ''; return; }
    input.value = '';
    const term = document.getElementById('story-terminal');
    const el = document.createElement('div');
    el.className = "text-right py-1";
    el.innerHTML = `<span class="text-xs px-3 py-1 rounded-full font-black" style="background:var(--accent);color:#000;">自由行动：${txt}</span>`;
    term.appendChild(el);
    term.scrollTop = term.scrollHeight;
    advanceWorldTime(8 + Math.floor(Math.random() * 25));
    generateStoryIteration(`【玩家全自定义行动】：${txt}\n请推演后续。使用【NPC名：对话】格式。`);
}

async function submitAiHelpWrite() {
    if (DB.storyPaused) { showToast("⏸ 故事已暂停，请输入 /pause 并点击执行以继续", false); return; }
    const userPrompt = localStorage.getItem("AI_WENYOU_HELP_PROMPT");
    if (!userPrompt || !userPrompt.trim()) { showToast("请先前往「设置」填写并保存 AI 帮写提示词", false); return; }
    await generateStoryIteration(`【AI帮写指令】：${userPrompt}\n请严格按照当前游戏设定执行。`);
}

function triggerContinueStory() {
    if (DB.storyPaused) { showToast("⏸ 故事已暂停，请输入 /pause 并点击执行以继续", false); return; }
    showToast("正在请求AI续写...");
    advanceWorldTime(6+Math.floor(Math.random()*15));
    generateStoryIteration(`【指令：续写】请无条件顺承当前局势进行深度扩展。使用【NPC名：对话】格式。`);
}

function triggerRewriteCurrent() {
    if (DB.storyPaused) { showToast("⏸ 故事已暂停，请先继续故事", false); return; }
    const term = document.getElementById('story-terminal');
    if (!term.lastChild) { showToast("无内容可重写！", false); return; }
    term.removeChild(term.lastChild);
    generateStoryIteration(`【重写指令】请重写刚才那阶段的剧情。使用【NPC名：对话】格式。`);
}

function triggerHistoryRollback() {
    if (!DB.gameState || !DB.gameState.storyHistory || DB.gameState.storyHistory.length === 0) { showToast("时间轴已归零！", false); return; }
    const prev = DB.gameState.storyHistory.pop();
    DB.gameState.currentLocationName = prev.currentLocationName;
    DB.gameState.currentLocationId = prev.currentLocationId;
    DB.gameState.player.stats = prev.playerStats;
    DB.gameState.npcs = prev.npcsState;
    document.getElementById('story-terminal').innerHTML = prev.terminalHTML;
    updateGameplayHeaderLocation();
    autoSaveGameState();
    showToast("【时光逆流】回溯成功！");
}

function advanceWorldTime(minutes) {
    DB.worldTime.minute += minutes;
    while (DB.worldTime.minute >= 60) { DB.worldTime.minute -= 60; DB.worldTime.hour++; }
    while (DB.worldTime.hour >= 24) { DB.worldTime.hour -= 24; DB.worldTime.day++; }
    const daysInMonth = 30;
    while (DB.worldTime.day > daysInMonth) { DB.worldTime.day -= daysInMonth; DB.worldTime.month++; }
    const seasons = ["春季", "夏季", "秋季", "冬季"];
    while (DB.worldTime.month > 12) { DB.worldTime.month -= 12; DB.worldTime.year++; }
    const seasonIdx = Math.floor((DB.worldTime.month - 1) / 3);
    DB.worldTime.season = seasons[Math.min(seasonIdx, 3)];
    if (DB.worldTime.hour >= 5 && DB.worldTime.hour < 8) DB.worldTime.period = "清晨";
    else if (DB.worldTime.hour >= 8 && DB.worldTime.hour < 12) DB.worldTime.period = "上午";
    else if (DB.worldTime.hour >= 12 && DB.worldTime.hour < 14) DB.worldTime.period = "中午";
    else if (DB.worldTime.hour >= 14 && DB.worldTime.hour < 18) DB.worldTime.period = "下午";
    else if (DB.worldTime.hour >= 18 && DB.worldTime.hour < 21) DB.worldTime.period = "傍晚";
    else if (DB.worldTime.hour >= 21 && DB.worldTime.hour < 24) DB.worldTime.period = "深夜";
    else DB.worldTime.period = "凌晨";
    updateWorldTimeDisplay();
    autoSaveGameState();
}

function autoFoldStoryHistory() {
    const term = document.getElementById('story-terminal');
    if (!term) return;
    const currentNodes = Array.from(term.children).filter(node => !node.classList.contains('folded-history-container'));
    const maxVisibleNodes = DB.historyFoldThreshold || 20;
    if (currentNodes.length > maxVisibleNodes) {
        const nodesToFold = currentNodes.slice(0, maxVisibleNodes - 5);
        const foldContainer = document.createElement('div');
        foldContainer.className = 'folded-history-container';
        const foldHeader = document.createElement('div');
        foldHeader.innerHTML = `<span>📜 展开历史记忆记录 <i class="fas fa-chevron-down"></i></span>`;
        foldHeader.onclick = () => { foldContent.classList.toggle('hidden'); };
        const foldContent = document.createElement('div');
        foldContent.className = 'hidden';
        nodesToFold.forEach(node => foldContent.appendChild(node));
        foldContainer.appendChild(foldHeader);
        foldContainer.appendChild(foldContent);
        term.insertBefore(foldContainer, currentNodes[maxVisibleNodes - 5]);
    }
}

async function tryTriggerNpcAutoMove() {
    if (!DB.npcAutoMove || !DB.gameState) return;
    DB.npcMoveCounter = (DB.npcMoveCounter || 0) + 1;
    if (DB.npcMoveCounter >= DB.npcMoveInterval) {
        DB.npcMoveCounter = 0;
        await aiMoveNpcs();
    }
}

async function aiMoveNpcs() { /* 实现NPC移动逻辑，调用AI决定去向 */ }

async function autoSummarizeToWorldBook() { /* 实现自动总结并写入世界书 */ }

function buildFinalSystem() { /* 构建最终系统提示词 */ return ""; }
function toggleNpcAutoMove(val) { DB.npcAutoMove = val; localStorage.setItem("AI_WENYOU_NPC_AUTO_MOVE", val); }
function saveNpcMoveSettings() { DB.npcMoveInterval = parseInt(document.getElementById('npc-move-interval').value) || 3; localStorage.setItem("AI_WENYOU_NPC_MOVE_INTERVAL", DB.npcMoveInterval); }
function saveNpcMoveMaxCount() { const val = parseInt(document.getElementById('npc-move-max-count').value); if (!isNaN(val) && val >= 1) DB.npcMoveMaxCount = Math.min(val, 10); }

function toggleAutoWorldLog() { DB.autoWorldLogEnabled = document.getElementById('wb-auto-log-toggle').checked; localStorage.setItem("AI_WENYOU_AUTO_WORLD_LOG", JSON.stringify({ enabled: DB.autoWorldLogEnabled, trigger: DB.autoWorldLogTrigger })); }
function updateAutoWorldLogTrigger(value) { DB.autoWorldLogTrigger = value; localStorage.setItem("AI_WENYOU_AUTO_WORLD_LOG", JSON.stringify({ enabled: DB.autoWorldLogEnabled, trigger: DB.autoWorldLogTrigger })); }

function restartCurrentGame() { /* 实现重启当前世界 */ }
function deleteNpc(idx) { /* 实现删除NPC */ }
function restoreNpc(deletedIndex) { /* 实现恢复已删除NPC */ }
function getLocationById(locationId) { return DB.gameState?.locations.find(l => l.id === locationId); }
