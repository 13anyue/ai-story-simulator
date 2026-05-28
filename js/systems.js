// js/systems.js - 核心游戏系统模块

// ==================== 初始化与数据准备 ====================

/**
 * 重置游戏记忆（清除所有记忆内容）
 */
function resetGameMemory() {
    if (!window.gameState) return;
    window.gameState.memory = {
        history_summary: "",
        key_events: [],
        relations: [],
        tasks: "",
        world_core: "",
        last_update: "",
        last_history_index: 0,
        world_summarized: false
    };
}

/**
 * 确保人物关系网数据结构存在
 */
function ensureRelationshipNetworkInitialized() {
    if (!window.gameState) return;
    if (!window.gameState.relationshipNetwork || typeof window.gameState.relationshipNetwork !== 'object') {
        window.gameState.relationshipNetwork = { nodes: [], edges: [] };
    }
    if (!Array.isArray(window.gameState.relationshipNetwork.nodes)) {
        window.gameState.relationshipNetwork.nodes = [];
    }
    if (!Array.isArray(window.gameState.relationshipNetwork.edges)) {
        window.gameState.relationshipNetwork.edges = [];
    }
}

/**
 * 检测是否为宫斗/古风模式
 */
function detectPalaceMode() {
    if (!window.gameState) return false;
    const combined = (window.gameState.worldName + window.gameState.globalLore + window.gameState.systemPrompt).toLowerCase();
    const keywords = ['后宫','宫廷','皇','妃','嫔','秀女','侍寝','翻牌','凤','龙','陛下','皇上','皇后','太后','贵妃','贵人','答应','常在','宫殿','御花园','金銮','冷宫','选秀','册封'];
    return keywords.some(kw => combined.includes(kw));
}

// ==================== 世界与游戏启动 ====================

/**
 * 清除自动存档
 */
function clearAutoSave() {
    localStorage.removeItem("AI_WENYOU_AUTOSAVE");
    const banner = document.getElementById('lobby-resume-banner');
    if (banner) banner.classList.add('hidden');
}

/**
 * 启动世界引擎
 * @param {string} worldId - 世界ID
 */
async function launchWorldEngine(worldId) {
    const world = window.gameState.worlds?.find(w => w.id === worldId);
    if (!world) return;
    clearAutoSave();

    window.gameState.activeWorldId = worldId;
    window.gameState.gameState = {
        worldId: world.id,
        worldName: world.name,
        globalLore: world.globalLore,
        systemPrompt: world.systemPrompt,
        currentLocationName: world.locations.length > 0 ? world.locations[0].name : "未知荒野",
        currentLocationId: world.locations.length > 0 ? world.locations[0].id : "",
        player: {
            name: "我",
            identity: "天选玩家",
            stats: {},
            inventory: [],
            backpack: [],
            privateInventory: [],
            relations: [],
            resumeLog: [{ time: "初始", event: "初次降临", tags: ["序幕"] }],
            jcl: {
                age: "未知", gender: "未定", personality: "自由灵魂", background: "来自异世界的旅行者",
                characterSetting: "行事随心", secret: "尚未发现", likes: "寻找真相", dislikes: "未知",
                specialSkill: "适应力", healthStatus: "健康", title: "旅人", faction: "无", playerCallName: "我"
            }
        },
        npcs: JSON.parse(JSON.stringify(world.npcs || [])),
        locations: JSON.parse(JSON.stringify(world.locations || [])),
        worldBookEntries: [{ keywords: "世界规则", text: world.globalLore, permanent: true, depth: 5 }],
        storyHistory: []
    };

    // 初始化主角属性
    world.customStats?.forEach(stat => {
        window.gameState.gameState.player.stats[stat] = 50;
    });

    // 确保每个 NPC 都有完整 jcl
    window.gameState.gameState.npcs.forEach(npc => {
        if (!npc.jcl) npc.jcl = { ...window.JUNCHENGLU_NPC_DEFAULTS };
        if (!npc.jcl.resumeLog) npc.jcl.resumeLog = [];
        if (!npc.jcl.currentActivity) {
            const personality = npc.jcl.personality || "普通";
            if (personality.includes("内向")) npc.jcl.currentActivity = "独坐一旁，沉默不语";
            else if (personality.includes("开朗")) npc.jcl.currentActivity = "热情地与路人攀谈";
            else npc.jcl.currentActivity = "正在四处走动";
        }
    });

    // 初始化世界时间
    if (window.DB) {
        window.DB.worldTime = { year: 1, season: "春季", month: 4, day: 3, hour: 9, minute: 20, period: "上午" };
        window.DB.weather = "晴好";
        window.DB.festival = "平日";
        window.DB.festivalCustom = "";
        window.DB.isPalaceMode = detectPalaceMode();
    }

    // 更新UI
    const titleEl = document.getElementById('gp-world-title');
    if (titleEl) titleEl.innerText = world.name;
    if (typeof window.updateGameplayHeaderLocation === 'function') window.updateGameplayHeaderLocation();
    if (typeof window.updateWorldTimeDisplay === 'function') window.updateWorldTimeDisplay();
    if (typeof window.updateWeatherDisplay === 'function') window.updateWeatherDisplay();
    if (typeof window.updateFestivalDisplay === 'function') window.updateFestivalDisplay();
    if (typeof window.applyMapBackgroundFromUrl === 'function') window.applyMapBackgroundFromUrl();

    // 切换到游戏界面
    if (typeof window.switchScreen === 'function') window.switchScreen('screen-gameplay');
    if (typeof window.switchSubview === 'function') window.switchSubview('subview-story');

    // 设置系统提示词输入框
    const sysPromptInput = document.getElementById('set-system-prompt');
    if (sysPromptInput) sysPromptInput.value = world.systemPrompt;

    // 保存并初始化地图
    if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
    if (typeof window.applyBubbleStyles === 'function') window.applyBubbleStyles();

    // 初始化多地图
    if (!window.DB.maps) window.DB.maps = [];
    window.DB.maps = [{
        id: "map_" + Date.now(),
        name: world.name + "·主世界",
        bgUrl: window.DB.mapBackgroundUrl || "",
        locations: window.gameState.gameState.locations
    }];
    window.DB.currentMapId = window.DB.maps[0].id;

    // 生成初始剧情
    if (typeof window.triggerInitialAILogic === 'function') window.triggerInitialAILogic();
}

/**
 * 退出世界返回大厅
 */
function exitWorldToLobby() {
    if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
    window.gameState.gameState = null;
    window.gameState.activeWorldId = null;
    if (window.DB) window.DB.wechatChatHistory = {};

    const navBar = document.getElementById('bottom-nav-bar');
    if (navBar) navBar.style.display = 'none';

    document.querySelectorAll('.subview-panel').forEach(panel => panel.classList.add('hidden'));
    const storyTerminal = document.getElementById('story-terminal');
    if (storyTerminal) storyTerminal.innerHTML = '';

    if (typeof window.switchScreen === 'function') window.switchScreen('screen-lobby');
    if (typeof window.checkAutoSavedGame === 'function') window.checkAutoSavedGame();
    window.showToast?.("已退出世界，进度已自动保存。");
}

/**
 * 重启当前世界
 */
function restartCurrentGame() {
    if (!window.gameState.gameState) { window.showToast?.("没有激活的游戏世界", false); return; }
    const worldId = window.gameState.gameState.worldId;
    const world = window.gameState.worlds?.find(w => w.id === worldId);
    if (!world) { window.showToast?.("找不到当前世界的数据", false); return; }
    if (!confirm("确定要重新开始当前世界的剧情吗？\n警告：当前的剧情记录将被清空，时间重置回初始点，但人物属性会保留。")) return;

    window.gameState.gameState.storyHistory = [];
    window.gameState.gameState.terminalLines = [];
    window.gameState.gameState.player.resumeLog = [{ time: "初始", event: "时光倒流，重新降临此界。", tags: ["重置"] }];

    const term = document.getElementById('story-terminal');
    if (term) term.innerHTML = '';
    const choicesBox = document.getElementById('story-choices-box');
    if (choicesBox) choicesBox.innerHTML = '';

    if (window.DB) {
        window.DB.worldTime = { year: 1, season: "春季", month: 4, day: 3, hour: 9, minute: 20, period: "上午" };
        if (typeof window.updateWorldTimeDisplay === 'function') window.updateWorldTimeDisplay();
    }
    if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();

    const hasSetup = localStorage.getItem(`AI_WENYOU_USER_SETUP_DONE_${world.id}`);
    if (hasSetup && typeof window.triggerInitialAILogic === 'function') {
        window.triggerInitialAILogic();
    }
    window.showToast?.("世界已重启，新的故事开始演化...");
}

// ==================== 辅助函数 ====================

/**
 * 获取地点对象
 * @param {string} locationId
 * @returns {Object|null}
 */
function getLocationById(locationId) {
    if (!window.gameState?.gameState?.locations) return null;
    return window.gameState.gameState.locations.find(l => l.id === locationId);
}

/**
 * 获取某地点的 NPC 列表
 * @param {string} locationId
 * @returns {Array}
 */
function getNpcsAtLocation(locationId) {
    if (!window.gameState?.gameState?.npcs) return [];
    return window.gameState.gameState.npcs.filter(npc => (npc.jcl && npc.jcl.location) === locationId);
}

/**
 * 更新游戏头部位置显示
 */
function updateGameplayHeaderLocation() {
    if (!window.gameState?.gameState) return;
    const badge = document.getElementById('gp-location-badge');
    if (badge) badge.innerText = `位置: ${window.gameState.gameState.currentLocationName}`;
}

/**
 * 检查是否有自动存档
 */
function checkAutoSavedGame() {
    const autoSave = localStorage.getItem("AI_WENYOU_AUTOSAVE");
    if (autoSave) {
        try {
            const parsed = JSON.parse(autoSave);
            if (parsed.worldName) {
                const banner = document.getElementById('lobby-resume-banner');
                if (banner) banner.classList.remove('hidden');
                const worldNameSpan = document.getElementById('resume-world-name');
                if (worldNameSpan) worldNameSpan.innerText = `上次游玩：${parsed.worldName} · 位置：${parsed.currentLocationName || '未知'}`;
            }
        } catch(e) {}
    }
}

// ==================== 生成初始剧情 ====================
function triggerInitialAILogic() {
    const term = document.getElementById('story-terminal');
    if (term) {
        term.innerHTML = `<div class="text-xs italic animate-pulse"><i class="fas fa-spinner fa-spin"></i> AI正在演化初始剧情...</div>`;
    }
    const initPrompt = `【序章】这是世界「${window.gameState.gameState.worldName}」的开端。请为主角在「${window.gameState.gameState.currentLocationName}」描绘一段精彩的开局剧情。当前时间：${document.getElementById('gp-world-history-preview')?.innerText || ''}，天气：${window.DB?.weather || "晴好"}，节日：${window.DB?.festival || "平日"}。对白使用【NPC名：话语】格式。`;
    if (typeof window.generateStoryIteration === 'function') {
        window.generateStoryIteration(initPrompt);
    }
}

// ==================== 时间与天气 ====================
function updateWorldTimeDisplay() {
    if (!window.DB?.worldTime) return;
    const wt = window.DB.worldTime;
    const timeStr = `第${wt.year}年 ${wt.season} ${wt.month}月${wt.day}日 ${wt.period} ${String(wt.hour).padStart(2,'0')}:${String(wt.minute).padStart(2,'0')}`;
    const el = document.getElementById('gp-world-history-preview');
    if (el) el.innerText = timeStr;
}

function updateWeatherDisplay() {
    const sel = document.getElementById('diy-weather');
    if (sel) window.DB.weather = sel.value;
    const icons = { "晴好": "☀️", "多云": "⛅", "阴天": "☁️", "小雨": "🌧️", "暴雨": "⛈️", "大雪": "❄️", "雾霾": "🌫️", "沙尘": "💨" };
    const chip = document.getElementById('topbar-weather-chip');
    if (chip) chip.innerHTML = `${icons[window.DB.weather] || "🌤️"} ${window.DB.weather}`;
    if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
}

function updateFestivalDisplay() {
    const sel = document.getElementById('diy-festival');
    const customInput = document.getElementById('diy-festival-custom');
    if (sel) {
        if (sel.value === "自定义节日" && customInput && customInput.value.trim()) {
            window.DB.festival = customInput.value.trim();
            window.DB.festivalCustom = customInput.value.trim();
        } else if (sel.value !== "自定义节日") {
            window.DB.festival = sel.value;
            window.DB.festivalCustom = "";
        }
    }
    const fIcons = { "平日": "📅", "春节": "🧧", "中秋": "🌕", "七夕": "💫", "冬至": "❄️", "万圣节": "🎃", "圣诞节": "🎄" };
    const chip = document.getElementById('topbar-festival-chip');
    if (chip) chip.innerHTML = `${fIcons[window.DB.festival] || "✨"} ${window.DB.festival}`;
    if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
}

function advanceWorldTime(minutes) {
    if (!window.DB?.worldTime) return;
    window.DB.worldTime.minute += minutes;
    while (window.DB.worldTime.minute >= 60) { window.DB.worldTime.minute -= 60; window.DB.worldTime.hour++; }
    while (window.DB.worldTime.hour >= 24) { window.DB.worldTime.hour -= 24; window.DB.worldTime.day++; }
    const daysInMonth = 30;
    while (window.DB.worldTime.day > daysInMonth) { window.DB.worldTime.day -= daysInMonth; window.DB.worldTime.month++; }
    const seasons = ["春季", "夏季", "秋季", "冬季"];
    while (window.DB.worldTime.month > 12) { window.DB.worldTime.month -= 12; window.DB.worldTime.year++; }
    const seasonIdx = Math.floor((window.DB.worldTime.month - 1) / 3);
    window.DB.worldTime.season = seasons[Math.min(seasonIdx, 3)];
    if (window.DB.worldTime.hour >= 5 && window.DB.worldTime.hour < 8) window.DB.worldTime.period = "清晨";
    else if (window.DB.worldTime.hour >= 8 && window.DB.worldTime.hour < 12) window.DB.worldTime.period = "上午";
    else if (window.DB.worldTime.hour >= 12 && window.DB.worldTime.hour < 14) window.DB.worldTime.period = "中午";
    else if (window.DB.worldTime.hour >= 14 && window.DB.worldTime.hour < 18) window.DB.worldTime.period = "下午";
    else if (window.DB.worldTime.hour >= 18 && window.DB.worldTime.hour < 21) window.DB.worldTime.period = "傍晚";
    else if (window.DB.worldTime.hour >= 21 && window.DB.worldTime.hour < 24) window.DB.worldTime.period = "深夜";
    else window.DB.worldTime.period = "凌晨";
    updateWorldTimeDisplay();
    if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
}

// ==================== 地图管理 ====================
function renderYiCiYuanMap() {
    const view = document.getElementById('yiciyuan-map-viewport');
    if (!view) return;
    applyMapBackgroundFromUrl();
    view.querySelectorAll('.map-marker-dot, .map-marker-label').forEach(el => el.remove());

    let locations = [];
    if (window.DB?.currentMapId && window.DB.maps) {
        const currentMap = window.DB.maps.find(m => m.id === window.DB.currentMapId);
        if (currentMap && currentMap.locations) locations = currentMap.locations;
        else locations = window.gameState?.gameState?.locations || [];
    } else {
        locations = window.gameState?.gameState?.locations || [];
    }
    if (!locations.length) return;

    locations.forEach(loc => {
        if (loc.mapX === undefined || loc.mapY === undefined) {
            loc.mapX = 20 + Math.random() * 60;
            loc.mapY = 15 + Math.random() * 65;
        }
        const isHere = window.gameState?.gameState?.currentLocationId === loc.id;
        const dot = document.createElement('div');
        dot.className = `map-marker-dot ${isHere ? 'active-marker' : ''}`;
        dot.style.left = loc.mapX + '%';
        dot.style.top = loc.mapY + '%';
        dot.innerHTML = `<i class="fas ${loc.thumbIcon || 'fa-monument'}"></i>`;
        const label = document.createElement('div');
        label.className = 'map-marker-label';
        label.style.left = loc.mapX + '%';
        label.style.top = loc.mapY + '%';
        label.innerText = loc.name;
        dot.onclick = (e) => { e.stopPropagation(); openLocationDetailModal(loc.id); };
        view.appendChild(dot);
        view.appendChild(label);
    });
}

function applyMapBackgroundFromUrl() {
    const view = document.getElementById('yiciyuan-map-viewport');
    const hint = document.getElementById('map-empty-hint');
    if (window.DB?.mapBackgroundUrl) {
        view.style.backgroundImage = `url('${window.DB.mapBackgroundUrl}')`;
        view.style.backgroundColor = 'transparent';
        if (hint) hint.style.display = 'none';
    } else {
        view.style.backgroundImage = '';
        view.style.backgroundColor = 'var(--bg-tertiary)';
        if (hint) hint.style.display = 'flex';
    }
}

function uploadMapBackground(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            window.DB.mapBackgroundUrl = e.target.result;
            localStorage.setItem("AI_WENYOU_MAP_BG", window.DB.mapBackgroundUrl);
            applyMapBackgroundFromUrl();
            renderYiCiYuanMap();
            window.showToast?.("地图背景更新成功！");
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function clearMapBackground() {
    window.DB.mapBackgroundUrl = "";
    localStorage.removeItem("AI_WENYOU_MAP_BG");
    applyMapBackgroundFromUrl();
    renderYiCiYuanMap();
    window.showToast?.("地图背景已清除。");
}

function handleMapBackgroundClick(event) {
    if (!window.gameState?.gameState) return;
    const view = document.getElementById('yiciyuan-map-viewport');
    if (!window.DB.mapBackgroundUrl && view.style.backgroundImage === '') {
        window.showToast?.("请先上传地图背景图！", false);
        return;
    }
    const rect = view.getBoundingClientRect();
    const xPercent = ((event.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((event.clientY - rect.top) / rect.height) * 100;
    const clampedX = Math.max(5, Math.min(95, xPercent));
    const clampedY = Math.max(5, Math.min(90, yPercent));
    const name = prompt("在此坐标创建新地点，请输入名称：", "新探索点");
    if (!name || !name.trim()) return;
    const desc = prompt("地点描述（可选）：", "神秘未知之地") || "神秘未知之地";
    const newLoc = {
        id: "loc-mapclick-" + Date.now(),
        name: name.trim(),
        description: desc,
        thumbIcon: 'fa-location-dot',
        mapX: Math.round(clampedX),
        mapY: Math.round(clampedY),
        dangerLevel: 2,
        infoLevel: 3
    };
    const currentMap = window.DB.maps?.find(m => m.id === window.DB.currentMapId);
    if (currentMap) currentMap.locations.push(newLoc);
    else window.gameState.gameState.locations.push(newLoc);
    renderYiCiYuanMap();
    if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
    window.showToast?.(`已在地图创建「${name.trim()}」`);
}

function manuallyAddLocation() {
    const name = document.getElementById('new-loc-name')?.value.trim();
    if (!name) { window.showToast?.("地点名不能为空！", false); return; }
    const desc = document.getElementById('new-loc-desc')?.value.trim() || "全自由沙盒自主确立的地缘点。";
    const newLocation = {
        id: "loc-diy-"+Date.now(),
        name: name,
        description: desc,
        thumbIcon: 'fa-location-dot',
        mapX: 50,
        mapY: 50,
        dangerLevel: 2,
        infoLevel: 3
    };
    const currentMap = window.DB.maps?.find(m => m.id === window.DB.currentMapId);
    if (currentMap) currentMap.locations.push(newLocation);
    else window.gameState.gameState.locations.push(newLocation);
    document.getElementById('new-loc-name').value = '';
    document.getElementById('new-loc-desc').value = '';
    renderYiCiYuanMap();
    if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
    window.showToast?.(`成功增筑场景：${name}`);
}

async function aiGenerateRandomLocation() {
    window.showToast?.("正委托AI开拓未知场景...");
    const prompt = `请结合当前世界设定「${window.gameState.gameState.worldName}」，创造一个新地缘场景。输出纯JSON：{"name":"场景名","description":"细腻百字阐述"}`;
    try {
        const res = await window.callLLMRequest?.(prompt, "你是纯净JSON生成模组。");
        if (!res) throw new Error("AI未返回");
        const parsed = JSON.parse(window.cleanAiJsonOutput?.(res) || res);
        const newLocation = {
            id: "loc-ai-"+Date.now(),
            name: parsed.name,
            description: parsed.description,
            thumbIcon: 'fa-location-dot',
            mapX: 15+Math.random()*70,
            mapY: 15+Math.random()*70,
            dangerLevel: Math.floor(Math.random()*3)+2,
            infoLevel: Math.floor(Math.random()*3)+2
        };
        const currentMap = window.DB.maps?.find(m => m.id === window.DB.currentMapId);
        if (currentMap) currentMap.locations.push(newLocation);
        else window.gameState.gameState.locations.push(newLocation);
        renderYiCiYuanMap();
        if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
        window.showToast?.(`AI成功拓展：${parsed.name}`);
    } catch (err) { window.showToast?.("AI地缘开垦出现扰动。", false); }
}

function quickMoveAllNpcsToCurrentLocation() {
    if (!window.gameState?.gameState?.currentLocationId) { window.showToast?.("请先进入场景！", false); return; }
    const locId = window.gameState.gameState.currentLocationId;
    let count = 0;
    window.gameState.gameState.npcs.forEach(npc => {
        if (npc.jcl && npc.jcl.location !== locId) { npc.jcl.location = locId; count++; }
    });
    renderYiCiYuanMap();
    if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
    window.showToast?.(`已将 ${count} 位NPC召唤至「${window.gameState.gameState.currentLocationName}」！`);
}

function switchMap(mapId) {
    const targetMap = window.DB.maps?.find(m => m.id === mapId);
    if (!targetMap) return;
    window.DB.currentMapId = mapId;
    window.DB.mapBackgroundUrl = targetMap.bgUrl;
    window.gameState.gameState.locations = targetMap.locations;
    applyMapBackgroundFromUrl();
    renderYiCiYuanMap();
    if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
}

function createNewMap() {
    const name = prompt("请输入新地图名称：", "新大陆");
    if (!name) return;
    const newMapId = "map_" + Date.now();
    if (!window.DB.maps) window.DB.maps = [];
    window.DB.maps.push({
        id: newMapId,
        name: name,
        bgUrl: "",
        locations: []
    });
    const selector = document.getElementById('map-selector');
    if (selector) {
        const option = document.createElement('option');
        option.value = newMapId;
        option.textContent = name;
        selector.appendChild(option);
    }
    switchMap(newMapId);
}

// ==================== 地点详情模态框 ====================
async function openLocationDetailModal(locationId) {
    const loc = getLocationById(locationId);
    if (!loc) return;
    window.DB.pendingLocationDetailId = locationId;

    // 刷新 NPC 活动（可选）
    if (typeof window.refreshNpcActivityForLocation === 'function') {
        await window.refreshNpcActivityForLocation(locationId);
    }

    const nameEl = document.getElementById('loc-detail-name');
    const descEl = document.getElementById('loc-detail-desc');
    const dangerEl = document.getElementById('loc-detail-danger');
    const dangerDescEl = document.getElementById('loc-detail-danger-desc');
    const infoEl = document.getElementById('loc-detail-info');
    const infoDescEl = document.getElementById('loc-detail-info-desc');
    const gotoBtn = document.getElementById('loc-detail-goto-btn');
    const npcContainer = document.getElementById('loc-detail-npcs');

    if (nameEl) nameEl.innerText = loc.name;
    if (descEl) descEl.innerText = loc.description || '暂无描述';
    const dangerLevel = loc.dangerLevel || 2;
    const infoLevel = loc.infoLevel || 3;
    const dangerTexts = ["极低", "低", "中", "高", "极高"];
    if (dangerEl) dangerEl.innerText = dangerTexts[Math.min(dangerLevel-1,4)] || "未知";
    if (dangerDescEl) dangerDescEl.innerText = `${dangerLevel}/5`;
    const resourceTexts = ["贫瘠", "稀少", "普通", "丰富", "极丰"];
    if (infoEl) infoEl.innerText = resourceTexts[Math.min(infoLevel-1,4)] || "未知";
    if (infoDescEl) infoDescEl.innerText = `${infoLevel}/5`;

    const isHere = window.gameState.gameState.currentLocationId === locationId;
    if (gotoBtn) {
        if (isHere) {
            gotoBtn.innerText = '📍 您已在此地';
            gotoBtn.style.opacity = '0.6';
            gotoBtn.onclick = () => window.showToast?.("您已在此场景区域。");
        } else {
            gotoBtn.innerText = '🚀 前往此地';
            gotoBtn.style.opacity = '1';
            gotoBtn.onclick = travelToLocationFromDetail;
        }
    }

    const npcsHere = getNpcsAtLocation(locationId);
    if (npcContainer) {
        npcContainer.innerHTML = '';
        if (npcsHere.length === 0) {
            npcContainer.innerHTML = `<p class="text-xs text-center py-3">此地暂无NPC出没</p>`;
        } else {
            npcsHere.forEach((n, i) => {
                const realIdx = window.gameState.gameState.npcs.indexOf(n);
                const activity = n.currentActivity || n.jcl?.currentActivity || "正在四处走动";
                const chip = document.createElement('div');
                chip.className = "flex items-center justify-between border rounded-lg p-2.5 transition";
                chip.innerHTML = `<div class="flex items-center gap-2 min-w-0 flex-1"><div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">${n.portrait ? `<img src="${n.portrait}" class="w-full h-full object-cover">` : '<i class="fas fa-user text-xs"></i>'}</div><div class="min-w-0"><span class="text-xs font-bold truncate block">${n.name}</span><span class="text-xs">${n.relation}</span><div class="text-[9px] italic">💬 ${activity}</div></div></div><div class="flex gap-1.5 flex-shrink-0"><button onclick="acquaintNpcFromLocation(${realIdx})" class="border text-[10px] px-2 py-1 rounded">认识</button><button onclick="openNpcInteractiveDetails(${realIdx})" class="border text-[10px] px-2 py-1 rounded">详情</button></div>`;
                npcContainer.appendChild(chip);
            });
        }
    }

    const modal = document.getElementById('modal-location-detail');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
    }
}

function closeLocationDetailModal() {
    const modal = document.getElementById('modal-location-detail');
    if (modal) modal.style.display = 'none';
    window.DB.pendingLocationDetailId = null;
}

function travelToLocationFromDetail() {
    const locId = window.DB.pendingLocationDetailId;
    closeLocationDetailModal();
    if (locId && typeof window.handleMoveToLocationNodeById === 'function') {
        window.handleMoveToLocationNodeById(locId);
    }
}

function acquaintNpcFromLocation(idx) {
    const npc = window.gameState.gameState.npcs[idx];
    if (npc.relation === "陌生人" || npc.relation === "萍水相逢" || npc.relation.includes("陌生")) {
        npc.relation = "初识之缘";
        window.showToast?.(`你认识了「${npc.name}」，关系变为「初识之缘」`);
    } else {
        window.showToast?.(`你与「${npc.name}」已经相识（${npc.relation}）`);
    }
    if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
    if (window.DB.pendingLocationDetailId) openLocationDetailModal(window.DB.pendingLocationDetailId);
    if (typeof window.renderNpcCards === 'function') window.renderNpcCards();
}

// ==================== NPC 相关 ====================
function openNpcInteractiveDetails(idx) {
    // 此函数将在 ui.js 中实现具体模态框渲染，这里提供占位
    console.log("openNpcInteractiveDetails", idx);
    // 实际实现会调用 window.renderNpcInteractiveModal
}

function deleteNpc(idx) {
    const npc = window.gameState.gameState?.npcs[idx];
    if (!npc) return;
    if (confirm(`确定要删除「${npc.name}」吗？`)) {
        if (!window.DB.deletedNpcs) window.DB.deletedNpcs = [];
        window.DB.deletedNpcs.push(JSON.parse(JSON.stringify(npc)));
        window.gameState.gameState.npcs.splice(idx, 1);
        if (typeof window.renderNpcCards === 'function') window.renderNpcCards();
        if (typeof window.renderYiCiYuanMap === 'function') window.renderYiCiYuanMap();
        if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
        window.showToast?.(`「${npc.name}」已从世界中移除，可在个人面板恢复。`);
    }
}

function restoreNpc(deletedIndex) {
    const npcData = window.DB.deletedNpcs?.[deletedIndex];
    if (!npcData) return;
    npcData.id = "npc-restored-" + Date.now() + "-" + Math.random();
    if (window.gameState.gameState?.currentLocationId) {
        if (!npcData.jcl) npcData.jcl = {};
        npcData.jcl.location = window.gameState.gameState.currentLocationId;
    }
    window.gameState.gameState.npcs.push(npcData);
    window.DB.deletedNpcs.splice(deletedIndex, 1);
    if (typeof window.renderNpcCards === 'function') window.renderNpcCards();
    if (typeof window.renderYiCiYuanMap === 'function') window.renderYiCiYuanMap();
    if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
    window.showToast?.(`「${npcData.name}」已重新回到世界。`);
}

function refreshDeletedNpcPanel() {
    const container = document.getElementById('deleted-npcs-list');
    if (!container) return;
    if (!window.DB.deletedNpcs || window.DB.deletedNpcs.length === 0) {
        container.innerHTML = '<div class="text-center py-2">暂无已删除的 NPC</div>';
        return;
    }
    container.innerHTML = '';
    window.DB.deletedNpcs.forEach((npc, idx) => {
        const item = document.createElement('div');
        item.className = "flex items-center justify-between border-b pb-1 mb-1";
        item.innerHTML = `<div class="flex items-center gap-2"><span class="font-bold text-xs">${npc.name}</span><span class="text-[10px]">${npc.relation}</span></div><button onclick="restoreNpc(${idx})" class="text-[10px] border px-2 py-0.5 rounded"><i class="fas fa-undo-alt"></i>恢复</button>`;
        container.appendChild(item);
    });
}

function clearAllDeletedNpcs() {
    if (!window.DB.deletedNpcs || window.DB.deletedNpcs.length === 0) {
        window.showToast?.("当前没有已删除的NPC记录", false);
        return;
    }
    if (confirm(`确定清空所有 ${window.DB.deletedNpcs.length} 个已删除的NPC记录吗？`)) {
        window.DB.deletedNpcs = [];
        if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
        refreshDeletedNpcPanel();
        window.showToast?.("已清空所有已删除的NPC记录");
    }
}

// ==================== 挂载到全局 ====================
if (typeof window !== 'undefined') {
    window.resetGameMemory = resetGameMemory;
    window.ensureRelationshipNetworkInitialized = ensureRelationshipNetworkInitialized;
    window.detectPalaceMode = detectPalaceMode;
    window.clearAutoSave = clearAutoSave;
    window.launchWorldEngine = launchWorldEngine;
    window.exitWorldToLobby = exitWorldToLobby;
    window.restartCurrentGame = restartCurrentGame;
    window.getLocationById = getLocationById;
    window.getNpcsAtLocation = getNpcsAtLocation;
    window.updateGameplayHeaderLocation = updateGameplayHeaderLocation;
    window.checkAutoSavedGame = checkAutoSavedGame;
    window.triggerInitialAILogic = triggerInitialAILogic;
    window.updateWorldTimeDisplay = updateWorldTimeDisplay;
    window.updateWeatherDisplay = updateWeatherDisplay;
    window.updateFestivalDisplay = updateFestivalDisplay;
    window.advanceWorldTime = advanceWorldTime;
    window.renderYiCiYuanMap = renderYiCiYuanMap;
    window.applyMapBackgroundFromUrl = applyMapBackgroundFromUrl;
    window.uploadMapBackground = uploadMapBackground;
    window.clearMapBackground = clearMapBackground;
    window.handleMapBackgroundClick = handleMapBackgroundClick;
    window.manuallyAddLocation = manuallyAddLocation;
    window.aiGenerateRandomLocation = aiGenerateRandomLocation;
    window.quickMoveAllNpcsToCurrentLocation = quickMoveAllNpcsToCurrentLocation;
    window.switchMap = switchMap;
    window.createNewMap = createNewMap;
    window.openLocationDetailModal = openLocationDetailModal;
    window.closeLocationDetailModal = closeLocationDetailModal;
    window.travelToLocationFromDetail = travelToLocationFromDetail;
    window.acquaintNpcFromLocation = acquaintNpcFromLocation;
    window.deleteNpc = deleteNpc;
    window.restoreNpc = restoreNpc;
    window.refreshDeletedNpcPanel = refreshDeletedNpcPanel;
    window.clearAllDeletedNpcs = clearAllDeletedNpcs;
}
