// js/app.js - 完整功能重写版（无头像库依赖）
(function() {
    // ==================== 全局初始化 ====================
    if (!window.gameState) window.gameState = {};
    if (!window.DB) window.DB = {};

    // 确保基本数据结构存在
    window.gameState.worlds = window.gameState.worlds || [];
    window.gameState.saves = window.gameState.saves || [];
    window.gameState.userProfiles = window.gameState.userProfiles || [];
    window.gameState.npcs = window.gameState.npcs || [];
    window.gameState.player = window.gameState.player || { name: "未命名", stats: {}, inventory: [] };
    window.gameState.gameLog = window.gameState.gameLog || [];
    window.gameState.history = window.gameState.history || [];
    window.gameState.world = window.gameState.world || { current_location_id: "", locations: [] };
    window.gameState.memory = window.gameState.memory || { history_summary: "", key_events: [], relations: [], tasks: "", world_core: "" };
    window.gameState.relationshipNetwork = window.gameState.relationshipNetwork || { nodes: [], edges: [] };
    
    window.DB.weather = window.DB.weather || "晴好";
    window.DB.festival = window.DB.festival || "平日";
    window.DB.worldTime = window.DB.worldTime || { year: 1, season: "春季", month: 4, day: 3, hour: 9, minute: 20, period: "上午" };
    window.DB.rumors = window.DB.rumors || [];
    window.DB.interactionTags = window.DB.interactionTags || {};
    window.DB.wechatChatHistory = window.DB.wechatChatHistory || {};
    window.DB.destinyPoints = window.DB.destinyPoints || 3;
    window.DB.timelineMilestones = window.DB.timelineMilestones || [];
    window.DB.deletedNpcs = window.DB.deletedNpcs || [];

    // ==================== 辅助函数 ====================
    window.escapeHtml = function(str) {
        if (!str) return '';
        return String(str).replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    };
    window.showToast = function(msg, isSuccess = true) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${isSuccess ? 'success' : 'error'}`;
        toast.innerHTML = `<i class="fas ${isSuccess ? 'fa-circle-check' : 'fa-circle-exclamation'}"></i> ${msg}`;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    };
    window.autoSaveGameState = function() {
        if (!window.gameState.gameState) return;
        const saveData = JSON.parse(JSON.stringify(window.gameState.gameState));
        saveData._worldTime = window.DB.worldTime;
        saveData._weather = window.DB.weather;
        saveData._festival = window.DB.festival;
        if (window.DB.timelineMilestones) saveData._timelineMilestones = window.DB.timelineMilestones;
        if (window.DB.destinyPoints !== undefined) saveData._destinyPoints = window.DB.destinyPoints;
        if (window.DB.rumors) saveData._rumors = window.DB.rumors;
        if (window.DB.deletedNpcs) saveData._deletedNpcs = window.DB.deletedNpcs;
        const storyTerminal = document.getElementById('story-terminal');
        if (storyTerminal) saveData._storyTerminalHTML = storyTerminal.innerHTML;
        localStorage.setItem("AI_WENYOU_AUTOSAVE", JSON.stringify(saveData));
    };

    // ==================== API 配置 ====================
    window.initLocalStorageData = function() {
        const localConfig = localStorage.getItem("AI_WENYOU_CONFIG");
        if (localConfig) window.gameState.apiConfig = JSON.parse(localConfig);
        else window.gameState.apiConfig = { endpoint: "https://api.openai.com/v1", key: "", model: "gpt-4o-mini" };
        const localWorlds = localStorage.getItem("AI_WENYOU_WORLDS");
        if (localWorlds) {
            try { window.gameState.worlds = JSON.parse(localWorlds); }
            catch(e) { window.gameState.worlds = []; }
        }
        const localSaves = localStorage.getItem("AI_WENYOU_SAVES");
        if (localSaves) window.gameState.saves = JSON.parse(localSaves);
        const nightMode = localStorage.getItem("AI_WENYOU_NIGHTMODE");
        if (nightMode === 'true') window.DB.isNightMode = true;
        const savedBubbleStyles = localStorage.getItem("AI_WENYOU_BUBBLE_STYLES");
        if (savedBubbleStyles) window.DB.bubbleStyles = JSON.parse(savedBubbleStyles);
        else window.DB.bubbleStyles = { selfBg: "#c44569", selfColor: "#ffffff", npcBg: "#f0f0f5", npcColor: "#1a1a2c" };
        const savedDifficulty = localStorage.getItem("AI_WENYOU_DIFFICULTY");
        if (savedDifficulty) window.DB.difficulty = savedDifficulty;
        else window.DB.difficulty = "normal";
        // 同步到页面输入框
        const cfgEndpoint = document.getElementById('cfg-endpoint');
        if (cfgEndpoint) cfgEndpoint.value = window.gameState.apiConfig.endpoint;
        const cfgKey = document.getElementById('cfg-key');
        if (cfgKey) cfgKey.value = window.gameState.apiConfig.key;
        const cfgModel = document.getElementById('cfg-model');
        if (cfgModel) cfgModel.value = window.gameState.apiConfig.model;
        const inlinePrompt = document.getElementById('diy-inline-component-prompt');
        if (inlinePrompt) inlinePrompt.value = window.DB.inlineComponentPrompt || "";
        const bubbleSelfBg = document.getElementById('diy-bubble-self-bg');
        if (bubbleSelfBg) bubbleSelfBg.value = window.DB.bubbleStyles.selfBg;
        // 渲染大厅
        if (typeof window.renderLobbyWorlds === 'function') window.renderLobbyWorlds();
        if (typeof window.renderLobbySaves === 'function') window.renderLobbySaves();
    };

    // ==================== 大厅渲染 ====================
    window.renderLobbyWorlds = function() {
        const container = document.getElementById('lobby-world-list');
        if (!container) return;
        container.innerHTML = '';
        (window.gameState.worlds || []).forEach(w => {
            const el = document.createElement('div');
            el.className = "world-item";
            el.innerHTML = `<div class="world-name">${window.escapeHtml(w.name)}</div><div class="world-desc">${window.escapeHtml(w.description || '')}</div><div class="world-meta">场景: ${w.locations?.length || 0} | NPC: ${w.npcs?.length || 0}</div>`;
            el.onclick = () => window.launchWorldEngine?.(w.id);
            container.appendChild(el);
        });
        const badge = document.getElementById('world-count-badge');
        if (badge) badge.innerText = `${window.gameState.worlds.length} 个可用`;
    };
    window.renderLobbySaves = function() {
        const container = document.getElementById('lobby-save-list');
        if (!container) return;
        if (!window.gameState.saves.length) { container.innerHTML = '<div class="text-xs text-center py-2">暂无可用本地存档数据</div>'; return; }
        container.innerHTML = '';
        window.gameState.saves.forEach((s, idx) => {
            const el = document.createElement('div');
            el.className = "save-item";
            el.innerHTML = `<div><span class="font-bold">${window.escapeHtml(s.worldName)}</span><span class="text-[10px] ml-2">${window.escapeHtml(s.timestamp)}</span></div><div><button onclick="loadSaveStateFromIndex(${idx})" class="btn-small">读档</button><button onclick="deleteSaveStateFromIndex(${idx})" class="icon-btn"><i class="fas fa-times"></i></button></div>`;
            container.appendChild(el);
        });
    };
    window.loadSaveStateFromIndex = function(idx) {
        const targetSave = window.gameState.saves[idx];
        if (!targetSave) return;
        window.gameState.gameState = JSON.parse(JSON.stringify(targetSave.gameState));
        if (targetSave.gameState._worldTime) window.DB.worldTime = targetSave.gameState._worldTime;
        if (targetSave.gameState._weather) window.DB.weather = targetSave.gameState._weather;
        if (targetSave.gameState._festival) window.DB.festival = targetSave.gameState._festival;
        document.getElementById('gp-world-title').innerText = window.gameState.gameState.worldName;
        if (typeof window.updateGameplayHeaderLocation === 'function') window.updateGameplayHeaderLocation();
        if (typeof window.updateWorldTimeDisplay === 'function') window.updateWorldTimeDisplay();
        if (typeof window.updateWeatherDisplay === 'function') window.updateWeatherDisplay();
        if (typeof window.updateFestivalDisplay === 'function') window.updateFestivalDisplay();
        if (typeof window.switchScreen === 'function') window.switchScreen('screen-gameplay');
        if (typeof window.switchSubview === 'function') window.switchSubview('subview-story');
        const terminal = document.getElementById('story-terminal');
        if (terminal) terminal.innerHTML = targetSave.gameState._storyTerminalHTML || '<div class="text-xs italic">【时光锚定】加载了快照。</div>';
        window.autoSaveGameState();
        if (typeof window.triggerContinueStory === 'function') window.triggerContinueStory();
        window.showToast?.("读档成功");
    };
    window.deleteSaveStateFromIndex = function(idx) {
        window.gameState.saves.splice(idx, 1);
        localStorage.setItem("AI_WENYOU_SAVES", JSON.stringify(window.gameState.saves));
        window.renderLobbySaves();
        window.showToast?.("快照已湮灭");
    };
    window.checkAutoSavedGame = function() {
        const autoSave = localStorage.getItem("AI_WENYOU_AUTOSAVE");
        if (autoSave) {
            try {
                const parsed = JSON.parse(autoSave);
                if (parsed.worldName) {
                    const banner = document.getElementById('lobby-resume-banner');
                    if (banner) banner.classList.remove('hidden');
                    const nameSpan = document.getElementById('resume-world-name');
                    if (nameSpan) nameSpan.innerText = `上次游玩：${parsed.worldName}`;
                }
            } catch(e) {}
        }
    };
    window.resumeLastGame = function() {
        const autoSave = localStorage.getItem("AI_WENYOU_AUTOSAVE");
        if (!autoSave) { window.showToast?.("没有可恢复的进度。", false); return; }
        try {
            const parsed = JSON.parse(autoSave);
            window.gameState.gameState = parsed;
            window.DB.worldTime = parsed._worldTime || window.DB.worldTime;
            window.DB.weather = parsed._weather || "晴好";
            window.DB.festival = parsed._festival || "平日";
            document.getElementById('gp-world-title').innerText = parsed.worldName;
            if (typeof window.updateGameplayHeaderLocation === 'function') window.updateGameplayHeaderLocation();
            if (typeof window.updateWorldTimeDisplay === 'function') window.updateWorldTimeDisplay();
            if (typeof window.updateWeatherDisplay === 'function') window.updateWeatherDisplay();
            if (typeof window.updateFestivalDisplay === 'function') window.updateFestivalDisplay();
            if (typeof window.switchScreen === 'function') window.switchScreen('screen-gameplay');
            if (typeof window.switchSubview === 'function') window.switchSubview('subview-story');
            const terminal = document.getElementById('story-terminal');
            if (terminal) terminal.innerHTML = parsed._storyTerminalHTML || '<div class="text-xs italic">【时光锚定】恢复了上次进度。</div>';
            window.autoSaveGameState();
            if (typeof window.triggerContinueStory === 'function') window.triggerContinueStory();
            window.showToast?.("已恢复上次进度！");
        } catch(e) { window.showToast?.("自动存档损坏", false); }
    };

    // ==================== 世界创建 ====================
    window.openWorldCreatorModal = function() {
        let modal = document.getElementById('modal-world-creator');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-world-creator';
            modal.className = 'modal-overlay';
            modal.innerHTML = `<div class="modal-card"><div class="p-4 border-b flex justify-between"><h3>创世与设定解析炉</h3><button onclick="closeWorldCreatorModal()">&times;</button></div><div class="p-4 space-y-4"><input type="text" id="wc-name" placeholder="世界名称"><select id="wc-style-select"><option value="auto">自动识别</option><option value="ancient">古风</option><option value="modern">现代</option><option value="palace">宫斗</option></select><textarea id="wc-raw-context" rows="5" placeholder="粘贴世界设定..."></textarea><span id="wc-char-counter">0 字符</span></div><div class="p-3 border-t flex gap-2"><button onclick="closeWorldCreatorModal()" class="flex-1 border rounded">取消</button><button onclick="commitWorldCreation()" class="flex-1 bg-primary text-white rounded">创建</button></div></div>`;
            document.body.appendChild(modal);
        }
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
        document.getElementById('wc-name').value = '';
        document.getElementById('wc-raw-context').value = '';
        const textarea = document.getElementById('wc-raw-context');
        textarea.oninput = () => document.getElementById('wc-char-counter').innerText = textarea.value.length + ' 字符';
    };
    window.closeWorldCreatorModal = function() {
        const modal = document.getElementById('modal-world-creator');
        if (modal) modal.style.display = 'none';
    };
    window.commitWorldCreation = async function() {
        const name = document.getElementById('wc-name').value.trim();
        if (!name) { window.showToast?.("世界名称不能为空", false); return; }
        const rawTxt = document.getElementById('wc-raw-context').value.trim();
        const style = document.getElementById('wc-style-select').value;
        const newWorld = { id: "world-" + Date.now(), name, description: "", globalLore: "", systemPrompt: "你是文字游戏推演机。对白使用【NPC名：话语】格式。每次给出3-5个选项。", customStats: ["健康", "金钱", "气运"], locations: [], npcs: [], style };
        if (rawTxt) {
            window.showToast?.("正在委托AI构建世界...");
            const aiPrompt = `基于以下文本生成结构化JSON：{"description":"介绍","globalLore":"世界观","locations":[{"name":"地点名","description":"描述"}],"npcs":[{"name":"人名","relation":"关系","age":"年龄","gender":"男/女","personality":"性格","background":"背景"}]}\n文本：${rawTxt}`;
            try {
                const res = await window.callLLMRequest?.(aiPrompt, "只输出JSON");
                const data = JSON.parse(window.cleanAiJsonOutput?.(res) || res);
                if (data.description) newWorld.description = data.description;
                if (data.globalLore) newWorld.globalLore = data.globalLore;
                if (data.locations) newWorld.locations = data.locations.map((l,i) => ({ id: `loc-${Date.now()}-${i}`, name: l.name, description: l.description, thumbIcon: 'fa-location-dot', mapX: 30+Math.random()*40, mapY: 20+Math.random()*60, dangerLevel: 2, infoLevel: 3 }));
                if (data.npcs) newWorld.npcs = data.npcs.map((n,i) => ({ id: `npc-${Date.now()}-${i}`, name: n.name, relation: n.relation, stats: { "好感": 20 }, jcl: { age: n.age, gender: n.gender, personality: n.personality, background: n.background, location: "" } }));
            } catch(e) { console.warn(e); newWorld.description = "AI生成失败，使用基础设定"; newWorld.globalLore = rawTxt.slice(0,500); }
        }
        window.gameState.worlds.push(newWorld);
        localStorage.setItem("AI_WENYOU_WORLDS", JSON.stringify(window.gameState.worlds));
        window.closeWorldCreatorModal();
        window.renderLobbyWorlds();
        window.showToast?.("世界已创建！");
    };
    window.handleWorldFileImport = function(input) {
        if (!input.files || !input.files[0]) return;
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            window.openWorldCreatorModal();
            document.getElementById('wc-name').value = file.name.replace(/\.[^/.]+$/, "");
            document.getElementById('wc-raw-context').value = content;
            document.getElementById('wc-char-counter').innerText = content.length + ' 字符';
            window.showToast?.("文件已载入，可编辑后创建世界");
        };
        reader.readAsText(file);
    };

    // ==================== 界面切换 ====================
    window.switchScreen = function(screenId) {
        document.querySelectorAll('.screen-view').forEach(s => s.classList.add('hidden'));
        const target = document.getElementById(screenId);
        if (target) target.classList.remove('hidden');
        const navBar = document.getElementById('bottom-nav-bar');
        if (screenId === 'screen-gameplay') {
            if (navBar) navBar.style.display = 'flex';
        } else {
            if (navBar) navBar.style.display = 'none';
            document.querySelectorAll('.subview-panel').forEach(p => p.classList.add('hidden'));
        }
        if (screenId === 'screen-lobby') {
            window.renderLobbyWorlds();
            window.renderLobbySaves();
            window.checkAutoSavedGame();
        }
    };
    window.switchSubview = function(subviewId) {
        document.querySelectorAll('.subview-panel').forEach(p => p.classList.add('hidden'));
        document.getElementById(subviewId).classList.remove('hidden');
        if (subviewId === 'subview-map' && typeof window.renderYiCiYuanMap === 'function') window.renderYiCiYuanMap();
        if (subviewId === 'subview-npc' && typeof window.renderNpcCards === 'function') window.renderNpcCards();
        if (subviewId === 'subview-worldbook' && typeof window.renderWorldBook === 'function') window.renderWorldBook();
        if (subviewId === 'subview-stats' && typeof window.renderPlayerStatsAndResume === 'function') window.renderPlayerStatsAndResume();
    };
    window.toggleDayNight = function() {
        window.DB.isNightMode = !window.DB.isNightMode;
        if (window.DB.isNightMode) document.documentElement.classList.add('theme-night');
        else document.documentElement.classList.remove('theme-night');
        localStorage.setItem("AI_WENYOU_NIGHTMODE", window.DB.isNightMode);
        window.showToast?.(window.DB.isNightMode ? "夜间模式" : "日间模式");
    };

    // ==================== 游戏核心（占位，实际由其他模块实现，但确保不报错） ====================
    window.launchWorldEngine = function(worldId) {
        const world = window.gameState.worlds.find(w => w.id === worldId);
        if (!world) return;
        window.gameState.gameState = {
            worldId: world.id, worldName: world.name, globalLore: world.globalLore, systemPrompt: world.systemPrompt,
            currentLocationName: world.locations[0]?.name || "起始之地", currentLocationId: world.locations[0]?.id || "",
            player: { name: "我", stats: {}, inventory: [], backpack: [], relations: [], jcl: { age: "未知", gender: "男", personality: "自由" } },
            npcs: JSON.parse(JSON.stringify(world.npcs || [])),
            locations: JSON.parse(JSON.stringify(world.locations || [])),
            worldBookEntries: [],
            storyHistory: []
        };
        window.DB.worldTime = { year: 1, season: "春季", month: 4, day: 3, hour: 9, minute: 20, period: "上午" };
        window.DB.weather = "晴好";
        document.getElementById('gp-world-title').innerText = world.name;
        if (typeof window.updateGameplayHeaderLocation === 'function') window.updateGameplayHeaderLocation();
        window.switchScreen('screen-gameplay');
        window.switchSubview('subview-story');
        if (typeof window.triggerInitialAILogic === 'function') window.triggerInitialAILogic();
        else {
            const term = document.getElementById('story-terminal');
            if (term) term.innerHTML = '<div class="text-xs italic">请先在设置中配置API密钥，或手动编写剧情。</div>';
        }
        window.autoSaveGameState();
    };
    window.exitWorldToLobby = function() {
        window.autoSaveGameState();
        window.gameState.gameState = null;
        document.getElementById('bottom-nav-bar').style.display = 'none';
        document.querySelectorAll('.subview-panel').forEach(p => p.classList.add('hidden'));
        window.switchScreen('screen-lobby');
        window.showToast?.("已退出世界");
    };
    window.triggerContinueStory = function() {
        const term = document.getElementById('story-terminal');
        term.innerHTML += '<div class="narration-block">你决定继续前行...</div>';
        term.scrollTop = term.scrollHeight;
    };
    window.updateGameplayHeaderLocation = function() {
        const badge = document.getElementById('gp-location-badge');
        if (badge && window.gameState.gameState) badge.innerText = `位置: ${window.gameState.gameState.currentLocationName}`;
    };
    window.updateWorldTimeDisplay = function() {
        const wt = window.DB.worldTime;
        const el = document.getElementById('gp-world-history-preview');
        if (el) el.innerText = `第${wt.year}年 ${wt.season} ${wt.month}月${wt.day}日 ${wt.period} ${wt.hour}:${wt.minute}`;
    };
    window.updateWeatherDisplay = function() {
        const chip = document.getElementById('topbar-weather-chip');
        if (chip) chip.innerHTML = `☀️ ${window.DB.weather}`;
    };
    window.updateFestivalDisplay = function() {
        const chip = document.getElementById('topbar-festival-chip');
        if (chip) chip.innerHTML = `📅 ${window.DB.festival}`;
    };

    // ==================== 用户管理完整实现 ====================
    window.openUserManager = function() {
        if (!window.gameState.userProfiles.length) {
            window.gameState.userProfiles.push({ id: "default", name: "无名旅者", gender: "男", personality: "随遇而安", background: "来自异世界的旅行者", specialSkill: "适应力", secret: "", likes: "探索", boundWorldId: null });
            window.gameState.activeUserProfileId = "default";
        }
        let modal = document.getElementById('user-manager-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'user-manager-modal';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }
        let html = `<div class="modal-card"><div class="p-4 border-b flex justify-between"><h3>用户档案管理</h3><button onclick="closeUserManagerModal()">&times;</button></div><div class="p-4 max-h-[60vh] overflow-y-auto">`;
        window.gameState.userProfiles.forEach(p => {
            const isActive = window.gameState.activeUserProfileId === p.id;
            html += `<div class="border rounded p-3 mb-2"><div class="flex justify-between"><span class="font-bold">${window.escapeHtml(p.name)}</span>${isActive ? '<span class="text-xs bg-amber-500 text-white px-2 rounded">当前</span>' : ''}</div><div class="text-xs text-gray-500">${window.escapeHtml(p.personality)} · ${window.escapeHtml(p.likes)}</div><div class="flex gap-2 mt-2"><button onclick="editUserProfile('${p.id}')" class="btn-small">编辑</button><button onclick="deleteUserProfile('${p.id}')" class="btn-small text-red-500">删除</button>${!isActive ? `<button onclick="setActiveUser('${p.id}')" class="btn-small">启用</button>` : ''}</div></div>`;
        });
        html += `<button onclick="showCreateUserForm()" class="w-full btn-primary mt-2">+ 新建用户</button></div><div class="p-3 border-t"><button onclick="closeUserManagerModal()" class="w-full border rounded py-2">关闭</button></div></div>`;
        modal.innerHTML = html;
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
    };
    window.closeUserManagerModal = function() {
        const modal = document.getElementById('user-manager-modal');
        if (modal) modal.style.display = 'none';
    };
    window.showCreateUserForm = function() {
        const worldOptions = (window.gameState.worlds || []).map(w => `<option value="${w.id}">${window.escapeHtml(w.name)}</option>`).join('');
        const modalHtml = `
            <div id="user-form-modal" class="modal-overlay" style="display:flex;">
                <div class="modal-card" style="max-width:400px;">
                    <div class="p-4 border-b"><h3>新建用户档案</h3></div>
                    <div class="p-4 space-y-3 text-sm">
                        <input type="text" id="new-user-name" class="w-full border rounded p-2" placeholder="昵称">
                        <select id="new-user-gender" class="w-full border rounded p-2"><option>男</option><option>女</option></select>
                        <input type="text" id="new-user-personality" class="w-full border rounded p-2" placeholder="性格">
                        <textarea id="new-user-background" rows="2" class="w-full border rounded p-2" placeholder="背景故事"></textarea>
                        <input type="text" id="new-user-skill" class="w-full border rounded p-2" placeholder="特殊技能">
                        <input type="text" id="new-user-likes" class="w-full border rounded p-2" placeholder="喜好">
                        <select id="new-user-bound-world" class="w-full border rounded p-2"><option value="">无绑定世界</option>${worldOptions}</select>
                    </div>
                    <div class="p-3 border-t flex gap-2"><button onclick="closeUserFormModal()" class="flex-1 border rounded">取消</button><button onclick="createNewUserProfile()" class="flex-1 bg-primary text-white rounded font-bold">创建</button></div>
                </div>
            </div>`;
        const old = document.getElementById('user-form-modal');
        if (old) old.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    };
    window.closeUserFormModal = function() {
        const modal = document.getElementById('user-form-modal');
        if (modal) modal.remove();
    };
    window.createNewUserProfile = function() {
        const name = document.getElementById('new-user-name')?.value.trim() || "无名";
        const gender = document.getElementById('new-user-gender')?.value;
        const personality = document.getElementById('new-user-personality')?.value.trim() || "随遇而安";
        const background = document.getElementById('new-user-background')?.value.trim() || "来自异世界的旅人";
        const specialSkill = document.getElementById('new-user-skill')?.value.trim() || "适应力";
        const likes = document.getElementById('new-user-likes')?.value.trim() || "无";
        const boundWorldId = document.getElementById('new-user-bound-world')?.value || null;
        const newId = "user_" + Date.now();
        window.gameState.userProfiles.push({ id: newId, name, gender, personality, background, specialSkill, secret: "", likes, boundWorldId });
        if (!window.gameState.activeUserProfileId) window.gameState.activeUserProfileId = newId;
        localStorage.setItem("AI_WENYOU_USER_PROFILES", JSON.stringify(window.gameState.userProfiles));
        localStorage.setItem("AI_WENYOU_ACTIVE_USER", window.gameState.activeUserProfileId);
        closeUserFormModal();
        openUserManager();
        window.showToast?.("用户创建成功");
    };
    window.editUserProfile = function(profileId) {
        const p = window.gameState.userProfiles.find(p => p.id === profileId);
        if (!p) return;
        const worldOptions = (window.gameState.worlds || []).map(w => `<option value="${w.id}" ${p.boundWorldId === w.id ? 'selected' : ''}>${window.escapeHtml(w.name)}</option>`).join('');
        const modalHtml = `
            <div id="user-edit-modal" class="modal-overlay" style="display:flex;">
                <div class="modal-card" style="max-width:400px;">
                    <div class="p-4 border-b"><h3>编辑用户</h3></div>
                    <div class="p-4 space-y-3">
                        <input type="text" id="edit-user-name" value="${window.escapeHtml(p.name)}" class="w-full border rounded p-2">
                        <select id="edit-user-gender"><option ${p.gender==='男'?'selected':''}>男</option><option ${p.gender==='女'?'selected':''}>女</option></select>
                        <input type="text" id="edit-user-personality" value="${window.escapeHtml(p.personality)}" class="w-full border rounded p-2">
                        <textarea id="edit-user-background" rows="2" class="w-full border rounded p-2">${window.escapeHtml(p.background)}</textarea>
                        <input type="text" id="edit-user-skill" value="${window.escapeHtml(p.specialSkill)}" class="w-full border rounded p-2">
                        <input type="text" id="edit-user-likes" value="${window.escapeHtml(p.likes)}" class="w-full border rounded p-2">
                        <select id="edit-user-bound-world" class="w-full border rounded p-2"><option value="">无绑定世界</option>${worldOptions}</select>
                    </div>
                    <div class="p-3 border-t flex gap-2"><button onclick="closeUserEditModal()" class="flex-1 border rounded">取消</button><button onclick="saveUserEdit('${profileId}')" class="flex-1 bg-primary text-white rounded font-bold">保存</button></div>
                </div>
            </div>`;
        const old = document.getElementById('user-edit-modal');
        if (old) old.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    };
    window.closeUserEditModal = function() {
        const modal = document.getElementById('user-edit-modal');
        if (modal) modal.remove();
    };
    window.saveUserEdit = function(profileId) {
        const p = window.gameState.userProfiles.find(p => p.id === profileId);
        if (!p) return;
        p.name = document.getElementById('edit-user-name')?.value.trim() || p.name;
        p.gender = document.getElementById('edit-user-gender')?.value;
        p.personality = document.getElementById('edit-user-personality')?.value.trim();
        p.background = document.getElementById('edit-user-background')?.value.trim();
        p.specialSkill = document.getElementById('edit-user-skill')?.value.trim();
        p.likes = document.getElementById('edit-user-likes')?.value.trim();
        p.boundWorldId = document.getElementById('edit-user-bound-world')?.value || null;
        localStorage.setItem("AI_WENYOU_USER_PROFILES", JSON.stringify(window.gameState.userProfiles));
        closeUserEditModal();
        openUserManager();
        if (window.gameState.activeUserProfileId === profileId && window.gameState.gameState && p.boundWorldId === window.gameState.gameState.worldId) {
            if (window.gameState.gameState) {
                window.gameState.gameState.player.name = p.name;
                if (!window.gameState.gameState.player.jcl) window.gameState.gameState.player.jcl = {};
                window.gameState.gameState.player.jcl.gender = p.gender;
                window.gameState.gameState.player.jcl.personality = p.personality;
                window.gameState.gameState.player.jcl.background = p.background;
                window.gameState.gameState.player.jcl.specialSkill = p.specialSkill;
                window.gameState.gameState.player.jcl.likes = p.likes;
                window.autoSaveGameState();
                if (typeof window.updatePanelUI === 'function') window.updatePanelUI();
            }
        }
    };
    window.deleteUserProfile = function(profileId) {
        if (window.gameState.userProfiles.length === 1) { window.showToast?.("至少保留一个用户", false); return; }
        if (confirm("确定删除此用户？")) {
            window.gameState.userProfiles = window.gameState.userProfiles.filter(p => p.id !== profileId);
            if (window.gameState.activeUserProfileId === profileId) {
                window.gameState.activeUserProfileId = window.gameState.userProfiles[0].id;
                localStorage.setItem("AI_WENYOU_ACTIVE_USER", window.gameState.activeUserProfileId);
            }
            localStorage.setItem("AI_WENYOU_USER_PROFILES", JSON.stringify(window.gameState.userProfiles));
            openUserManager();
        }
    };
    window.setActiveUser = function(profileId) {
        window.gameState.activeUserProfileId = profileId;
        localStorage.setItem("AI_WENYOU_ACTIVE_USER", profileId);
        const profile = window.gameState.userProfiles.find(p => p.id === profileId);
        if (profile && window.gameState.gameState) {
            window.gameState.gameState.player.name = profile.name;
            if (!window.gameState.gameState.player.jcl) window.gameState.gameState.player.jcl = {};
            window.gameState.gameState.player.jcl.gender = profile.gender;
            window.gameState.gameState.player.jcl.personality = profile.personality;
            window.gameState.gameState.player.jcl.background = profile.background;
            window.gameState.gameState.player.jcl.specialSkill = profile.specialSkill;
            window.gameState.gameState.player.jcl.likes = profile.likes;
            window.autoSaveGameState();
            if (typeof window.updatePanelUI === 'function') window.updatePanelUI();
        }
        openUserManager();
        window.showToast?.(`当前用户切换为「${profile.name}」`);
    };

    // ==================== NPC 创建 ====================
    window.openNpcCreationModal = function() {
        let modal = document.getElementById('modal-npc-creator');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-npc-creator';
            modal.className = 'modal-overlay';
            modal.innerHTML = `<div class="modal-card"><div class="p-4 border-b"><h3>定制新NPC</h3><button onclick="closeNpcCreationModal()">&times;</button></div><div class="p-4 space-y-3"><div class="flex gap-3"><div class="w-14 h-14 border rounded flex items-center justify-center"><img id="npc-cr-avatar-preview" class="hidden w-full h-full object-cover"><i id="npc-cr-avatar-placeholder" class="fas fa-user-astronaut text-2xl"></i></div><label class="border px-3 py-2 rounded cursor-pointer"><i class="fas fa-camera"></i> 上传头像<input type="file" class="hidden" accept="image/*" onchange="uploadNpcCreationAvatar(this)"></label></div><input type="text" id="npc-cr-name" placeholder="姓名 *"><input type="text" id="npc-cr-relation" placeholder="关系" value="萍水相逢"><input type="text" id="npc-cr-gender" placeholder="性别"><input type="text" id="npc-cr-age" placeholder="年龄"><input type="text" id="npc-cr-personality" placeholder="性格"><textarea id="npc-cr-background" rows="2" placeholder="背景故事"></textarea><textarea id="npc-cr-secret" rows="1" placeholder="隐藏秘密"></textarea></div><div class="p-3 border-t flex gap-2"><button onclick="closeNpcCreationModal()" class="flex-1 border rounded">取消</button><button onclick="commitNpcCreation()" class="flex-1 bg-primary text-white rounded">创建</button></div></div>`;
            document.body.appendChild(modal);
        }
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
        document.getElementById('npc-cr-name').value = '';
        document.getElementById('npc-cr-avatar-preview').classList.add('hidden');
        document.getElementById('npc-cr-avatar-placeholder').classList.remove('hidden');
    };
    window.closeNpcCreationModal = function() {
        const modal = document.getElementById('modal-npc-creator');
        if (modal) modal.style.display = 'none';
    };
    window.uploadNpcCreationAvatar = function(input) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('npc-cr-avatar-preview');
                const placeholder = document.getElementById('npc-cr-avatar-placeholder');
                preview.src = e.target.result;
                preview.classList.remove('hidden');
                placeholder.classList.add('hidden');
                window.tempNpcAvatarData = e.target.result;
            };
            reader.readAsDataURL(input.files[0]);
        }
    };
    window.commitNpcCreation = function() {
        const name = document.getElementById('npc-cr-name').value.trim();
        if (!name) { window.showToast?.("NPC姓名不能为空", false); return; }
        const newNpc = {
            id: "npc-" + Date.now(),
            name: name,
            relation: document.getElementById('npc-cr-relation').value.trim() || "萍水相逢",
            stats: { "好感": 20 },
            portrait: window.tempNpcAvatarData || "",
            jcl: {
                age: document.getElementById('npc-cr-age').value.trim() || "未知",
                gender: document.getElementById('npc-cr-gender').value.trim() || "未定",
                personality: document.getElementById('npc-cr-personality').value.trim() || "性情未明",
                background: document.getElementById('npc-cr-background').value.trim() || "身世如谜",
                secret: document.getElementById('npc-cr-secret').value.trim() || "",
                location: window.gameState.gameState?.currentLocationId || ""
            }
        };
        window.gameState.npcs.push(newNpc);
        if (window.gameState.gameState) window.gameState.gameState.npcs.push(JSON.parse(JSON.stringify(newNpc)));
        if (typeof window.renderNpcCards === 'function') window.renderNpcCards();
        window.autoSaveGameState();
        window.closeNpcCreationModal();
        window.showToast?.(`成功创建NPC：${name}`);
    };
    window.renderNpcCards = function() {
        const container = document.getElementById('npc-cards-container');
        if (!container) return;
        const npcs = window.gameState.gameState?.npcs || window.gameState.npcs || [];
        container.innerHTML = '';
        npcs.forEach((n, idx) => {
            const card = document.createElement('div');
            card.className = "npc-card";
            card.innerHTML = `<div class="npc-avatar">${n.portrait ? `<img src="${n.portrait}" style="width:100%;height:100%;object-fit:cover;">` : `<span>${n.name.charAt(0)}</span>`}</div><div class="npc-info"><div class="npc-name">${window.escapeHtml(n.name)}</div><div class="npc-relation">${window.escapeHtml(n.relation)}</div></div><button onclick="deleteNpc(${idx})" class="icon-btn"><i class="fas fa-trash-alt"></i></button>`;
            card.onclick = (e) => { if (e.target.tagName !== 'BUTTON' && typeof window.openNpcInteractiveDetails === 'function') window.openNpcInteractiveDetails(idx); };
            container.appendChild(card);
        });
    };
    window.deleteNpc = function(idx) {
        if (confirm("确定删除该NPC？")) {
            const npc = window.gameState.gameState?.npcs[idx] || window.gameState.npcs[idx];
            if (npc) {
                if (!window.DB.deletedNpcs) window.DB.deletedNpcs = [];
                window.DB.deletedNpcs.push(JSON.parse(JSON.stringify(npc)));
                if (window.gameState.gameState) window.gameState.gameState.npcs.splice(idx, 1);
                window.gameState.npcs.splice(idx, 1);
                window.renderNpcCards();
                window.autoSaveGameState();
                window.showToast?.(`已删除 ${npc.name}`);
            }
        }
    };

    // ==================== 玩家属性面板 ====================
    window.updatePanelUI = function() {
        const p = window.gameState.gameState?.player || window.gameState.player;
        if (!p) return;
        const nameEl = document.getElementById('player-name');
        if (nameEl) nameEl.innerText = p.name || "未命名";
        const statsDiv = document.getElementById('player-stats');
        if (statsDiv) {
            statsDiv.innerHTML = '';
            Object.entries(p.stats || {}).forEach(([k,v]) => {
                statsDiv.innerHTML += `<div class="stat-card"><span>${k}</span><span class="font-bold">${v}</span></div>`;
            });
        }
        const backpackDiv = document.getElementById('player-backpack-preview');
        if (backpackDiv) {
            backpackDiv.innerHTML = (p.inventory || []).map(i => `<span class="item-tag">${i.name||i}</span>`).join('') || "空空如也";
        }
    };
    window.renderPlayerStatsAndResume = window.updatePanelUI;

    // ==================== 世界书简单实现 ====================
    window.renderWorldBook = function() {
        const list = document.getElementById('worldbook-entries-list');
        if (!list) return;
        const entries = window.gameState.gameState?.worldBookEntries || [];
        list.innerHTML = '';
        entries.forEach((e,i) => {
            list.innerHTML += `<div class="worldbook-entry">${window.escapeHtml(e.text)}<button onclick="removeWorldBookEntry(${i})">删除</button></div>`;
        });
    };
    window.removeWorldBookEntry = function(idx) {
        if (window.gameState.gameState?.worldBookEntries) {
            window.gameState.gameState.worldBookEntries.splice(idx,1);
            window.renderWorldBook();
            window.autoSaveGameState();
        }
    };
    window.addNewWorldBookEntry = function() {
        const text = prompt("输入世界书内容:");
        if (text && window.gameState.gameState) {
            if (!window.gameState.gameState.worldBookEntries) window.gameState.gameState.worldBookEntries = [];
            window.gameState.gameState.worldBookEntries.push({ keywords: "手动", text: text });
            window.renderWorldBook();
            window.autoSaveGameState();
        }
    };

    // ==================== 地图简单实现 ====================
    window.renderYiCiYuanMap = function() {
        const view = document.getElementById('yiciyuan-map-viewport');
        if (!view) return;
        const locations = window.gameState.gameState?.locations || [];
        view.querySelectorAll('.map-marker-dot').forEach(el => el.remove());
        locations.forEach(loc => {
            const dot = document.createElement('div');
            dot.className = "map-marker-dot";
            dot.style.left = (loc.mapX || 50) + '%';
            dot.style.top = (loc.mapY || 50) + '%';
            dot.innerHTML = `<i class="fas ${loc.thumbIcon || 'fa-location-dot'}"></i>`;
            dot.onclick = () => alert(`地点: ${loc.name}\n${loc.description}`);
            view.appendChild(dot);
        });
    };
    window.uploadMapBackground = function(input) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const view = document.getElementById('yiciyuan-map-viewport');
                if (view) view.style.backgroundImage = `url(${e.target.result})`;
                window.DB.mapBackgroundUrl = e.target.result;
            };
            reader.readAsDataURL(input.files[0]);
        }
    };
    window.clearMapBackground = function() {
        const view = document.getElementById('yiciyuan-map-viewport');
        if (view) view.style.backgroundImage = '';
        window.DB.mapBackgroundUrl = '';
    };

    // ==================== 论坛简单实现 ====================
    window.initForumData = function() {
        const container = document.getElementById('forum-posts-container');
        if (!container) return;
        const posts = [{ id:1, author:"系统", content:"欢迎来到玩家社区！", time:Date.now(), likes:0 }];
        container.innerHTML = posts.map(p => `<div class="forum-post"><div class="forum-author">${p.author}</div><div>${p.content}</div></div>`).join('');
    };
    window.forumRefresh = window.initForumData;
    window.forumPublishPost = function() {
        const input = document.getElementById('forum-post-input');
        if (input && input.value.trim()) {
            alert("发布成功：" + input.value);
            input.value = '';
        }
    };
    window.closeForumModal = function() {
        const modal = document.getElementById('modal-forum');
        if (modal) modal.style.display = 'none';
    };

    // ==================== 启动 ====================
    window.addEventListener('DOMContentLoaded', function() {
        window.initLocalStorageData();
        window.switchScreen('screen-lobby');
        if (typeof window.applyTheme === 'function') window.applyTheme();
        console.log("App started");
    });
})();
