// js/ui.js - UI渲染与交互

// 大厅世界列表渲染
function renderLobbyWorlds() {
    const container = document.getElementById('lobby-world-list');
    if (!container) return;
    container.innerHTML = '';
    DB.worlds.forEach(w => {
        const el = document.createElement('div');
        el.className = 'world-item';
        el.innerHTML = `<div class="world-name">${escapeHtml(w.name)}</div><div class="world-desc">${escapeHtml(w.description || '无前置概述。')}</div><div class="world-meta">场景: ${w.locations?.length || 0} | NPC: ${w.npcs?.length || 0}</div>`;
        el.onclick = () => launchWorldEngine(w.id);
        container.appendChild(el);
    });
    document.getElementById('world-count-badge').innerText = `${DB.worlds.length} 个可用`;
}

function renderLobbySaves() {
    const container = document.getElementById('lobby-save-list');
    if (!container) return;
    if (DB.saves.length === 0) { container.innerHTML = '<div class="text-xs text-center py-2">暂无可用本地存档数据</div>'; return; }
    container.innerHTML = '';
    DB.saves.forEach((s, idx) => {
        const el = document.createElement('div');
        el.className = 'save-item';
        el.innerHTML = `<div><span class="font-bold">${escapeHtml(s.worldName)}</span><span class="text-[10px] ml-2">${escapeHtml(s.timestamp)}</span></div><div><button onclick="loadSaveStateFromIndex(${idx})" class="btn-small">读档</button><button onclick="deleteSaveStateFromIndex(${idx})" class="icon-btn"><i class="fas fa-times"></i></button></div>`;
        container.appendChild(el);
    });
}

// 游戏核心UI
function updateGameplayHeaderLocation() {
    if (DB.gameState) document.getElementById('gp-location-badge').innerText = `位置: ${DB.gameState.currentLocationName}`;
}

// 地图渲染
function renderYiCiYuanMap() {
    const view = document.getElementById('yiciyuan-map-viewport');
    if (!view) return;
    applyMapBackgroundFromUrl();
    view.querySelectorAll('.map-marker-dot, .map-marker-label').forEach(el => el.remove());
    let locations = [];
    if (DB.currentMapId && DB.maps) {
        const currentMap = DB.maps.find(m => m.id === DB.currentMapId);
        if (currentMap && currentMap.locations) locations = currentMap.locations;
        else locations = DB.gameState?.locations || [];
    } else {
        locations = DB.gameState?.locations || [];
    }
    if (!locations.length) return;
    locations.forEach(loc => {
        if (loc.mapX === undefined || loc.mapY === undefined) { loc.mapX = 20 + Math.random()*60; loc.mapY = 15 + Math.random()*65; }
        const isHere = DB.gameState.currentLocationId === loc.id;
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
    if (DB.mapBackgroundUrl) {
        view.style.backgroundImage = `url('${DB.mapBackgroundUrl}')`;
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
            DB.mapBackgroundUrl = e.target.result;
            localStorage.setItem("AI_WENYOU_MAP_BG", DB.mapBackgroundUrl);
            applyMapBackgroundFromUrl();
            renderYiCiYuanMap();
            showToast("地图背景更新成功！");
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function clearMapBackground() {
    DB.mapBackgroundUrl = "";
    localStorage.removeItem("AI_WENYOU_MAP_BG");
    applyMapBackgroundFromUrl();
    renderYiCiYuanMap();
    showToast("地图背景已清除。");
}

function handleMapBackgroundClick(event) {
    if (!DB.gameState) return;
    const view = document.getElementById('yiciyuan-map-viewport');
    if (!DB.mapBackgroundUrl && view.style.backgroundImage === '') { showToast("请先上传地图背景图！", false); return; }
    const rect = view.getBoundingClientRect();
    const xPercent = ((event.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((event.clientY - rect.top) / rect.height) * 100;
    const clampedX = Math.max(5, Math.min(95, xPercent));
    const clampedY = Math.max(5, Math.min(90, yPercent));
    const name = prompt("在此坐标创建新地点，请输入名称：", "新探索点");
    if (!name || !name.trim()) return;
    const desc = prompt("地点描述（可选）：", "神秘未知之地") || "神秘未知之地";
    const newLoc = { id: "loc-mapclick-"+Date.now(), name: name.trim(), description: desc, thumbIcon: 'fa-location-dot', mapX: Math.round(clampedX), mapY: Math.round(clampedY), dangerLevel: 2, infoLevel: 3 };
    const currentMap = DB.maps.find(m => m.id === DB.currentMapId);
    if (currentMap) currentMap.locations.push(newLoc);
    else DB.gameState.locations.push(newLoc);
    renderYiCiYuanMap();
    autoSaveGameState();
    showToast(`已在地图创建「${name.trim()}」`);
}

// NPC卡片渲染
function renderNpcCards() {
    const container = document.getElementById('npc-cards-container');
    if (!container) return;
    container.innerHTML = '';
    if (!DB.gameState || !DB.gameState.npcs.length) { container.innerHTML = '<div class="text-center py-6">当前位面内没有录入任何NPC。</div>'; return; }
    DB.gameState.npcs.forEach((n, idx) => {
        const card = document.createElement('div');
        card.className = 'npc-card';
        const jcl = n.jcl || JUNCHENGLU_NPC_DEFAULTS;
        const npcLoc = getLocationById(jcl.location);
        card.innerHTML = `<div class="npc-avatar">${n.portrait ? `<img src="${n.portrait}">` : `<span>${n.name.charAt(0)}</span>`}</div><div class="npc-info"><div class="npc-name">${escapeHtml(n.name)}</div><div class="npc-relation">${escapeHtml(n.relation)} · ${npcLoc ? npcLoc.name : '行踪不明'}</div></div><button onclick="deleteNpc(${idx})" class="icon-btn"><i class="fas fa-trash-alt"></i></button>`;
        card.onclick = (e) => { if (e.target.tagName !== 'BUTTON') openNpcInteractiveDetails(idx); };
        container.appendChild(card);
    });
}

// 世界书渲染
function renderWorldBook() {
    if (!DB.gameState) return;
    document.getElementById('wb-global-lore').value = DB.gameState.globalLore;
    const list = document.getElementById('worldbook-entries-list');
    if (!list) return;
    list.innerHTML = '';
    DB.gameState.worldBookEntries.forEach((entry, index) => {
        const item = document.createElement('div');
        item.className = 'worldbook-entry';
        item.innerHTML = `<div><span class="keyword">触发键: ${Array.isArray(entry.keywords) ? entry.keywords.join(", ") : (entry.keywords || "无")}</span><button onclick="removeWorldBookEntry(${index})" class="icon-btn"><i class="fas fa-trash"></i></button></div><textarea onchange="updateWorldBookEntryText(${index},this.value)">${escapeHtml(entry.text)}</textarea>`;
        list.appendChild(item);
    });
}

// 玩家属性渲染
function renderPlayerStatsAndResume() {
    const grid = document.getElementById('player-stats-grid');
    if (grid && DB.gameState) {
        grid.innerHTML = '';
        const stats = DB.gameState.player.stats;
        Object.keys(stats).forEach(k => {
            const val = stats[k];
            const block = document.createElement('div');
            block.className = 'stat-card';
            block.innerHTML = `<div>${escapeHtml(k)}</div><div class="font-bold">${val}</div>`;
            grid.appendChild(block);
        });
    }
    const preview = document.getElementById('player-backpack-preview');
    if (preview && DB.gameState) {
        const bp = DB.gameState.player.backpack || [];
        preview.innerHTML = bp.length ? bp.map(item => `<span class="item-tag">${escapeHtml(item)}</span>`).join('') : "背包空空如也";
    }
    const jcl = DB.gameState?.player.jcl || {};
    const personalityEl = document.getElementById('player-personality');
    if (personalityEl) personalityEl.innerText = jcl.personality || '—';
    const backgroundEl = document.getElementById('player-background');
    if (backgroundEl) backgroundEl.innerText = jcl.background || '—';
    const charsetEl = document.getElementById('player-charset');
    if (charsetEl) charsetEl.innerText = jcl.characterSetting || '—';
    const secretEl = document.getElementById('player-secret');
    if (secretEl) secretEl.innerText = jcl.secret || '—';
    const likesEl = document.getElementById('player-likes');
    if (likesEl) likesEl.innerText = jcl.likes || '—';
}

// 论坛UI渲染（占位，详细实现在app.js）
function initForumData() { /* 在app.js中实现 */ }
function forumRefresh() { /* 在app.js中实现 */ }
function forumPublishPost() { /* 在app.js中实现 */ }
function closeForumModal() { /* 在app.js中实现 */ }

// 提示词预设列表渲染
function renderPromptPresetList() {
    const container = document.getElementById('prompt-preset-list');
    if (!container) return;
    const presetNames = ['polishWorld', 'genNpcWorld', 'genNpcStory', 'continueStory', 'genInteractions', 'genFamilyTree', 'evolveWorld', 'generateRumor', 'characterSetting', 'chatFilter', 'globalPrompt'];
    container.innerHTML = '';
    presetNames.forEach(key => {
        const item = document.createElement('div');
        item.className = 'preset-item';
        item.innerHTML = `<span>${key}</span><button onclick="editPromptPreset('${key}')" class="btn-small">编辑</button><button onclick="resetPromptPreset('${key}')" class="btn-small">重置</button>`;
        container.appendChild(item);
    });
}

// 节日标签渲染
function renderFestivalLibrary() {
    const container = document.getElementById('festival-tags-container');
    if (!container) return;
    const allFestivals = [...DB.festivalLibrary, ...DB.customFestivals];
    container.innerHTML = '';
    allFestivals.forEach(fest => {
        const tag = document.createElement('span');
        tag.className = 'festival-tag';
        tag.innerHTML = `${fest} <i class="fas fa-times-circle" onclick="removeFestivalFromLibrary('${fest}')"></i>`;
        tag.onclick = () => { DB.festival = fest; DB.festivalCustom = ''; updateFestivalDisplay(); renderFestivalLibrary(); autoSaveGameState(); };
        container.appendChild(tag);
    });
}

function addCustomFestival() {
    const input = document.getElementById('new-festival-input');
    const name = input.value.trim();
    if (!name) return;
    if (!DB.customFestivals.includes(name)) {
        DB.customFestivals.push(name);
        localStorage.setItem("AI_WENYOU_CUSTOM_FESTIVALS", JSON.stringify(DB.customFestivals));
        renderFestivalLibrary();
    }
    input.value = '';
}

function removeFestivalFromLibrary(festName) {
    const idxBuiltin = DB.festivalLibrary.indexOf(festName);
    if (idxBuiltin !== -1) DB.festivalLibrary.splice(idxBuiltin, 1);
    const idxCustom = DB.customFestivals.indexOf(festName);
    if (idxCustom !== -1) DB.customFestivals.splice(idxCustom, 1);
    if (DB.festival === festName) { DB.festival = "平日"; updateFestivalDisplay(); }
    localStorage.setItem("AI_WENYOU_FESTIVAL_LIBRARY", JSON.stringify(DB.festivalLibrary));
    localStorage.setItem("AI_WENYOU_CUSTOM_FESTIVALS", JSON.stringify(DB.customFestivals));
    renderFestivalLibrary();
    autoSaveGameState();
}

function setRandomFestivalByAI() {
    const allFests = [...DB.festivalLibrary, ...DB.customFestivals];
    if (allFests.length === 0) return;
    const randomFest = allFests[Math.floor(Math.random() * allFests.length)];
    DB.festival = randomFest;
    DB.festivalCustom = '';
    updateFestivalDisplay();
    renderFestivalLibrary();
    showToast(`节日变为：${randomFest}`);
}

function resetFestivalToNone() {
    DB.festival = "平日";
    DB.festivalCustom = '';
    updateFestivalDisplay();
    renderFestivalLibrary();
}

function resetFestivalLibrary() {
    DB.festivalLibrary = ["春节", "中秋", "七夕", "冬至", "万圣节", "圣诞节"];
    DB.customFestivals = [];
    localStorage.setItem("AI_WENYOU_FESTIVAL_LIBRARY", JSON.stringify(DB.festivalLibrary));
    localStorage.setItem("AI_WENYOU_CUSTOM_FESTIVALS", JSON.stringify(DB.customFestivals));
    renderFestivalLibrary();
    showToast("节日库已恢复为内置默认");
}

// 其他辅助UI函数
function updatePlayerCoreName(val) { if (val.trim() && DB.gameState) { DB.gameState.player.name = val.trim(); autoSaveGameState(); } }
function toggleCheatMode() { DB.cheatModeEnabled = document.getElementById('cheat-toggle').checked; document.getElementById('cheat-status-text').innerText = DB.cheatModeEnabled ? "开启" : "关闭"; }
function adjustAllPlayerStats(delta) { /* 实现属性增减 */ }
function openPlayerBackpackModal() { /* 实现背包模态框 */ }
function openPlayerRelationsModal() { /* 实现关系模态框 */ }
function addPlayerResumeLog() { /* 实现日志添加 */ }
function refreshDeletedNpcPanel() { /* 实现已删除NPC面板刷新 */ }
function clearAllDeletedNpcs() { /* 实现清空已删除NPC */ }
