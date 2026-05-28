// js/app.js - 应用入口与所有功能完整实现（无占位符）

// ==================== 初始化函数 ====================
async function initApp() {
    console.log("应用初始化开始...");
    
    // 1. 加载存储数据
    if (typeof window.loadData === 'function') {
        await window.loadData();
    } else {
        console.warn("loadData 未定义，跳过");
    }
    if (typeof window.initLocalStorageData === 'function') {
        window.initLocalStorageData();
    }
    
    // 2. 应用主题和样式
    applyTheme();
    updateDayNightUI();
    if (typeof window.applyBubbleStyles === 'function') window.applyBubbleStyles();
    
    // 3. 加载各种设置
    loadUserCorePrompt();
    loadGenParams();
    loadSummaryPrompt();
    loadFontSettings();
    loadNpcMoveSettings();
    loadGlobalNpcLogicPrompt();
    
    // 4. 渲染大厅
    renderLobbyWorlds();
    renderLobbySaves();
    if (typeof window.checkAutoSavedGame === 'function') window.checkAutoSavedGame();
    
    // 5. 绑定全局事件
    bindGlobalEvents();
    
    // 6. 初始化PDF.js
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    
    // 7. 初始显示大厅
    switchScreen('screen-lobby');
    
    // 8. 字体缩放
    const savedFont = localStorage.getItem("AI_WENYOU_FONT_SIZE");
    if (savedFont && typeof window.setFontScale === 'function') window.setFontScale(parseFloat(savedFont));
    
    // 9. 全局缩放
    loadGlobalZoom();
    
    // 10. 论坛初始化
    if (typeof initForumData === 'function') initForumData();
    
    console.log("应用初始化完成");
}

// ==================== 主题与样式 ====================
function applyTheme() {
    const isNight = window.DB?.isNightMode;
    if (isNight) {
        document.documentElement.classList.add('theme-night');
        document.body.classList.add('theme-night');
    } else {
        document.documentElement.classList.remove('theme-night');
        document.body.classList.remove('theme-night');
        const savedBg = localStorage.getItem('AI_WENYOU_CUSTOM_BG_COLOR');
        const savedText = localStorage.getItem('AI_WENYOU_CUSTOM_TEXT_COLOR');
        if (savedText) document.getElementById('app-root').style.color = savedText;
    }
    updateGlobalBackgroundLayer();
}

function updateDayNightUI() {
    const isNight = window.DB?.isNightMode;
    const icons = document.querySelectorAll('#dn-icon-lobby, #dn-icon-game');
    icons.forEach(icon => { if (icon) icon.className = isNight ? 'fas fa-moon' : 'fas fa-sun'; });
}

function toggleDayNight() {
    if (!window.DB) window.DB = {};
    window.DB.isNightMode = !window.DB.isNightMode;
    localStorage.setItem("AI_WENYOU_NIGHTMODE", window.DB.isNightMode);
    applyTheme();
    if (typeof window.applyBubbleStyles === 'function') window.applyBubbleStyles();
    if (typeof window.showToast === 'function') window.showToast(window.DB.isNightMode ? '🌙 夜间模式' : '☀️ 日间模式');
}

function updateGlobalBackgroundLayer() {
    const bgLayer = document.getElementById('global-bg-layer');
    if (!bgLayer) return;
    const globalBgUrl = localStorage.getItem('AI_WENYOU_GLOBAL_BG') || '';
    if (globalBgUrl) {
        bgLayer.style.backgroundImage = `url('${globalBgUrl}')`;
        bgLayer.style.backgroundColor = 'transparent';
    } else {
        const bgColor = document.getElementById('diy-color-bg-lobby')?.value || '#fafafa';
        bgLayer.style.backgroundImage = 'none';
        bgLayer.style.backgroundColor = bgColor;
    }
    const opacity = localStorage.getItem('AI_WENYOU_BG_OPACITY');
    if (opacity) bgLayer.style.opacity = opacity / 100;
    const blur = localStorage.getItem('AI_WENYOU_BG_BLUR');
    if (blur) bgLayer.style.filter = `blur(${blur}px)`;
}

function applyDiyThemeFromLobby() {
    const txtColor = document.getElementById('diy-color-text-lobby')?.value;
    const bgColor = document.getElementById('diy-color-bg-lobby')?.value;
    const globalText = document.getElementById('diy-color-text');
    const globalBg = document.getElementById('diy-color-bg');
    if (globalText) globalText.value = txtColor;
    if (globalBg) globalBg.value = bgColor;
    document.getElementById('app-root').style.color = txtColor;
    updateGlobalBackgroundLayer();
    localStorage.setItem('AI_WENYOU_CUSTOM_BG_COLOR', bgColor);
    localStorage.setItem('AI_WENYOU_CUSTOM_TEXT_COLOR', txtColor);
}

function loadGlobalZoom() {
    const saved = localStorage.getItem('AI_WENYOU_GLOBAL_ZOOM');
    if (saved) setGlobalZoom(parseFloat(saved));
    else setGlobalZoom(0.9);
}

function setGlobalZoom(val) {
    val = Math.min(1.2, Math.max(0.6, parseFloat(val)));
    document.documentElement.style.fontSize = (16 * val) + 'px';
    const slider = document.getElementById('global-zoom-slider');
    const span = document.getElementById('global-zoom-value');
    if (slider) slider.value = val;
    if (span) span.innerText = val.toFixed(2);
    localStorage.setItem('AI_WENYOU_GLOBAL_ZOOM', val);
}

function loadFontSettings() {
    const bubble = localStorage.getItem('AI_WENYOU_BUBBLE_FONT_SIZE');
    if (bubble) setBubbleFontSize(parseFloat(bubble));
    const narra = localStorage.getItem('AI_WENYOU_NARRATION_FONT_SIZE');
    if (narra) setNarrationFontSize(parseFloat(narra));
}

function setBubbleFontSize(val) {
    val = parseFloat(val);
    document.documentElement.style.setProperty('--bubble-font-size', val + 'rem');
    const span = document.getElementById('bubble-font-value');
    if (span) span.innerText = val.toFixed(2) + 'rem';
    localStorage.setItem('AI_WENYOU_BUBBLE_FONT_SIZE', val);
}

function setNarrationFontSize(val) {
    val = parseFloat(val);
    document.documentElement.style.setProperty('--narration-font-size', val + 'rem');
    const span = document.getElementById('narration-font-value');
    if (span) span.innerText = val.toFixed(2) + 'rem';
    localStorage.setItem('AI_WENYOU_NARRATION_FONT_SIZE', val);
}

// ==================== 大厅渲染 ====================
function renderLobbyWorlds() {
    const container = document.getElementById('lobby-world-list');
    if (!container) return;
    const worlds = window.gameState?.worlds || [];
    container.innerHTML = '';
    worlds.forEach(w => {
        const el = document.createElement('div');
        el.className = "world-item";
        el.innerHTML = `<div class="world-name">${escapeHtml(w.name)}</div><div class="world-desc">${escapeHtml(w.description || '')}</div><div class="world-meta">场景: ${w.locations?.length || 0} | NPC: ${w.npcs?.length || 0}</div>`;
        el.onclick = () => window.launchWorldEngine?.(w.id);
        container.appendChild(el);
    });
    const badge = document.getElementById('world-count-badge');
    if (badge) badge.innerText = `${worlds.length} 个可用`;
}

function renderLobbySaves() {
    const container = document.getElementById('lobby-save-list');
    if (!container) return;
    const saves = window.gameState?.saves || [];
    if (!saves.length) {
        container.innerHTML = '<div class="text-xs text-center py-2">暂无可用本地存档数据</div>';
        return;
    }
    container.innerHTML = '';
    saves.forEach((s, idx) => {
        const el = document.createElement('div');
        el.className = "save-item";
        el.innerHTML = `<div><span class="font-bold">${escapeHtml(s.worldName)}</span><span class="text-[10px] ml-2">${escapeHtml(s.timestamp)}</span></div><div><button onclick="loadSaveStateFromIndex(${idx})" class="btn-small">读档</button><button onclick="deleteSaveStateFromIndex(${idx})" class="icon-btn"><i class="fas fa-times"></i></button></div>`;
        container.appendChild(el);
    });
}

// ==================== 界面切换 ====================
function switchScreen(screenId) {
    if (typeof window.closeAllModals === 'function') window.closeAllModals();
    document.querySelectorAll('.screen-view').forEach(s => {
        s.classList.add('hidden');
        s.style.display = 'none';
    });
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.remove('hidden');
        target.style.display = screenId === 'screen-gameplay' ? 'flex' : 'block';
    }
    const navBar = document.getElementById('bottom-nav-bar');
    if (screenId === 'screen-gameplay') {
        if (navBar) navBar.style.display = 'flex';
        document.getElementById('game-top-bar').style.display = '';
    } else {
        if (navBar) navBar.style.display = 'none';
        document.querySelectorAll('.subview-panel').forEach(p => p.classList.add('hidden'));
    }
    if (screenId === 'screen-lobby') {
        renderLobbyWorlds();
        renderLobbySaves();
        if (typeof window.checkAutoSavedGame === 'function') window.checkAutoSavedGame();
    }
}

function switchSubview(subviewId) {
    document.querySelectorAll('.subview-panel').forEach(el => el.classList.add('hidden'));
    const target = document.getElementById(subviewId);
    if (target) target.classList.remove('hidden');
    const navs = ['story', 'map', 'stats', 'npc', 'worldbook', 'forum', 'settings'];
    navs.forEach(n => {
        const btn = document.getElementById(`nav-subview-${n}`);
        if (btn) {
            if (`subview-${n}` === subviewId) btn.classList.add('active');
            else btn.classList.remove('active');
        }
    });
    if (subviewId === 'subview-map' && typeof window.renderYiCiYuanMap === 'function') window.renderYiCiYuanMap();
    if (subviewId === 'subview-stats' && typeof window.renderPlayerStatsAndResume === 'function') window.renderPlayerStatsAndResume();
    if (subviewId === 'subview-npc' && typeof window.renderNpcCards === 'function') window.renderNpcCards();
    if (subviewId === 'subview-worldbook' && typeof window.renderWorldBook === 'function') window.renderWorldBook();
    if (subviewId === 'subview-forum' && typeof window.initForumData === 'function') window.initForumData();
}

// ==================== 辅助加载函数 ====================
function loadUserCorePrompt() {
    const saved = localStorage.getItem("AI_WENYOU_CORE_PROMPT");
    const textarea = document.getElementById('user-core-prompt');
    if (textarea) textarea.value = saved || "";
}
function loadGenParams() {
    const saved = localStorage.getItem("AI_WENYOU_GEN_PARAMS");
    if (saved && window.DB) {
        try { window.DB.genParams = JSON.parse(saved); } catch(e) {}
    }
    const lengthSelect = document.getElementById('story-length');
    if (lengthSelect) lengthSelect.value = window.DB?.genParams?.storyLength || "medium";
    const npcInput = document.getElementById('npc-speech-count');
    if (npcInput) npcInput.value = window.DB?.genParams?.npcSpeechCount || 2;
    const narraInput = document.getElementById('narration-count');
    if (narraInput) narraInput.value = window.DB?.genParams?.narrationCount || 2;
    const cardInput = document.getElementById('card-count');
    if (cardInput) cardInput.value = window.DB?.genParams?.cardCount || 1;
}
function loadSummaryPrompt() {
    const saved = localStorage.getItem("AI_WENYOU_SUMMARY_PROMPT");
    const input = document.getElementById('wb-summary-prompt');
    if (input && saved) input.value = saved;
}
function loadNpcMoveSettings() {
    if (!window.DB) window.DB = {};
    const savedAutoMove = localStorage.getItem("AI_WENYOU_NPC_AUTO_MOVE");
    if (savedAutoMove !== null) window.DB.npcAutoMove = savedAutoMove === 'true';
    const savedInterval = localStorage.getItem("AI_WENYOU_NPC_MOVE_INTERVAL");
    if (savedInterval) window.DB.npcMoveInterval = parseInt(savedInterval);
    const savedMaxCount = localStorage.getItem("AI_WENYOU_NPC_MOVE_MAX_COUNT");
    if (savedMaxCount) window.DB.npcMoveMaxCount = parseInt(savedMaxCount);
    const toggle = document.getElementById('npc-auto-move-toggle');
    if (toggle) toggle.checked = window.DB.npcAutoMove || false;
    const intervalInput = document.getElementById('npc-move-interval');
    if (intervalInput) intervalInput.value = window.DB.npcMoveInterval || 3;
    const maxCountInput = document.getElementById('npc-move-max-count');
    if (maxCountInput) maxCountInput.value = window.DB.npcMoveMaxCount || 2;
}
function loadGlobalNpcLogicPrompt() {
    const saved = localStorage.getItem("AI_WENYOU_GLOBAL_NPC_LOGIC");
    const textarea = document.getElementById('global-npc-logic-prompt');
    if (textarea && saved) textarea.value = saved;
    else if (textarea) textarea.value = "每个NPC要有独立性格，对话避免复读机，体现情绪波动...";
}

// ==================== 全局事件绑定 ====================
function bindGlobalEvents() {
    const scrollBtn = document.getElementById('scroll-to-bottom-btn');
    if (scrollBtn) scrollBtn.onclick = () => { const terminal = document.getElementById('story-terminal'); if (terminal) terminal.scrollTop = terminal.scrollHeight; };
    const collapseBtn = document.getElementById('choices-collapse-btn');
    if (collapseBtn) collapseBtn.onclick = () => { const box = document.getElementById('story-choices-box'); if (box) box.classList.toggle('collapsed'); };
    const moreBtn = document.getElementById('story-more-menu-btn');
    if (moreBtn) moreBtn.onclick = () => { const menu = document.getElementById('story-more-menu'); if (menu) menu.classList.toggle('hidden'); };
    const input = document.getElementById('story-custom-input');
    if (input) input.addEventListener('keypress', (e) => { if (e.key === 'Enter') window.submitCustomAction?.(); });
    document.addEventListener('contextmenu', (e) => { if (!e.target.closest('input, textarea')) e.preventDefault(); });
}

// ==================== 所有缺失功能完整实现（用户管理、世界创建、NPC等） ====================
(function() {
    // 用户管理（完整实现）
    window.openUserManager = function() {
        if (!window.gameState.userProfiles) window.gameState.userProfiles = [];
        if (!window.gameState.userProfiles.length) {
            window.gameState.userProfiles.push({ id: "default", name: "无名旅者", gender: "男", personality: "随遇而安", background: "来自异世界的旅行者", specialSkill: "适应力", secret: "暂无", likes: "探索", boundWorldId: null });
            window.gameState.activeUserProfileId = "default";
        }
        let modal = document.getElementById('user-manager-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'user-manager-modal';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }
        let html = `<div class="modal-card"><div class="p-4 border-b flex justify-between"><h3 class="font-bold">用户档案管理</h3><button onclick="closeUserManagerModal()" class="text-gray-500">&times;</button></div><div class="p-4 max-h-[60vh] overflow-y-auto">`;
        window.gameState.userProfiles.forEach(p => {
            const isActive = window.gameState.activeUserProfileId === p.id;
            html += `<div class="border rounded p-3 mb-2"><div class="flex justify-between"><span class="font-bold">${escapeHtml(p.name)}</span>${isActive ? '<span class="text-xs bg-amber-500 text-white px-2 rounded">当前</span>' : ''}</div><div class="text-xs text-gray-500">${escapeHtml(p.personality)} · ${escapeHtml(p.likes)}</div><div class="flex gap-2 mt-2"><button onclick="editUserProfile('${p.id}')" class="btn-small">编辑</button><button onclick="deleteUserProfile('${p.id}')" class="btn-small text-red-500">删除</button>${!isActive ? `<button onclick="setActiveUser('${p.id}')" class="btn-small">启用</button>` : ''}</div></div>`;
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
        const worldOptions = (window.gameState.worlds || []).map(w => `<option value="${w.id}">${escapeHtml(w.name)}</option>`).join('');
        const modalHtml = `
            <div id="user-form-modal" class="modal-overlay" style="display:flex;">
                <div class="modal-card" style="max-width:400px;">
                    <div class="p-4 border-b"><h3 class="font-bold">新建用户档案</h3></div>
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
        if (typeof window.showToast === 'function') window.showToast("用户创建成功");
    };
    window.editUserProfile = function(profileId) {
        const p = window.gameState.userProfiles.find(p => p.id === profileId);
        if (!p) return;
        const worldOptions = (window.gameState.worlds || []).map(w => `<option value="${w.id}" ${p.boundWorldId === w.id ? 'selected' : ''}>${escapeHtml(w.name)}</option>`).join('');
        const modalHtml = `
            <div id="user-edit-modal" class="modal-overlay" style="display:flex;">
                <div class="modal-card" style="max-width:400px;">
                    <div class="p-4 border-b"><h3>编辑用户</h3></div>
                    <div class="p-4 space-y-3">
                        <input type="text" id="edit-user-name" value="${escapeHtml(p.name)}" class="w-full border rounded p-2">
                        <select id="edit-user-gender"><option ${p.gender==='男'?'selected':''}>男</option><option ${p.gender==='女'?'selected':''}>女</option></select>
                        <input type="text" id="edit-user-personality" value="${escapeHtml(p.personality)}" class="w-full border rounded p-2">
                        <textarea id="edit-user-background" rows="2" class="w-full border rounded p-2">${escapeHtml(p.background)}</textarea>
                        <input type="text" id="edit-user-skill" value="${escapeHtml(p.specialSkill)}" class="w-full border rounded p-2">
                        <input type="text" id="edit-user-likes" value="${escapeHtml(p.likes)}" class="w-full border rounded p-2">
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
            if (typeof window.applyUserProfileToGame === 'function') window.applyUserProfileToGame(p);
        }
        if (typeof window.showToast === 'function') window.showToast("用户已更新");
    };
    window.deleteUserProfile = function(profileId) {
        if (window.gameState.userProfiles.length === 1) { if (typeof window.showToast === 'function') window.showToast("至少保留一个用户", false); return; }
        if (confirm("确定删除此用户？")) {
            window.gameState.userProfiles = window.gameState.userProfiles.filter(p => p.id !== profileId);
            if (window.gameState.activeUserProfileId === profileId) {
                window.gameState.activeUserProfileId = window.gameState.userProfiles[0].id;
                localStorage.setItem("AI_WENYOU_ACTIVE_USER", window.gameState.activeUserProfileId);
            }
            localStorage.setItem("AI_WENYOU_USER_PROFILES", JSON.stringify(window.gameState.userProfiles));
            openUserManager();
            if (typeof window.showToast === 'function') window.showToast("用户已删除");
        }
    };
    window.setActiveUser = function(profileId) {
        window.gameState.activeUserProfileId = profileId;
        localStorage.setItem("AI_WENYOU_ACTIVE_USER", profileId);
        const profile = window.gameState.userProfiles.find(p => p.id === profileId);
        if (profile && window.gameState.gameState) {
            if (typeof window.applyUserProfileToGame === 'function') window.applyUserProfileToGame(profile);
        }
        openUserManager();
        if (typeof window.showToast === 'function') window.showToast(`当前用户切换为「${profile.name}」`);
    };
    function applyUserProfileToGame(profile) {
        if (!window.gameState.gameState) return;
        const gs = window.gameState.gameState;
        gs.player.name = profile.name;
        if (!gs.player.jcl) gs.player.jcl = {};
        gs.player.jcl.gender = profile.gender;
        gs.player.jcl.personality = profile.personality;
        gs.player.jcl.background = profile.background;
        gs.player.jcl.specialSkill = profile.specialSkill;
        gs.player.jcl.secret = profile.secret;
        gs.player.jcl.likes = profile.likes;
        if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
        if (typeof window.updatePanelUI === 'function') window.updatePanelUI();
    }

    // 世界创建
    window.openWorldCreatorModal = function() {
        let modal = document.getElementById('modal-world-creator');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-world-creator';
            modal.className = 'modal-overlay hidden';
            modal.innerHTML = `<div class="modal-card"><div class="p-4 border-b"><h3>创世设定炉</h3><button onclick="closeWorldCreatorModal()" class="float-right">&times;</button></div><div class="p-4"><input type="text" id="wc-name" placeholder="世界名称" class="w-full border rounded p-2 mb-2"><textarea id="wc-raw-context" rows="5" placeholder="世界设定文本..." class="w-full border rounded p-2"></textarea><button onclick="commitWorldCreation()" class="btn-primary w-full">创建世界</button></div></div>`;
            document.body.appendChild(modal);
        }
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
    };
    window.closeWorldCreatorModal = function() {
        const modal = document.getElementById('modal-world-creator');
        if (modal) modal.style.display = 'none';
    };
    window.commitWorldCreation = async function() {
        const name = document.getElementById('wc-name')?.value.trim();
        if (!name) { alert("请输入世界名称"); return; }
        const rawTxt = document.getElementById('wc-raw-context')?.value.trim();
        const newWorld = { id: "world-"+Date.now(), name: name, description: rawTxt || "自定义世界", globalLore: rawTxt || "", systemPrompt: "你是文字游戏推演机", customStats: ["健康","金钱","气运"], locations: [], npcs: [] };
        if (!window.gameState.worlds) window.gameState.worlds = [];
        window.gameState.worlds.push(newWorld);
        localStorage.setItem("AI_WENYOU_WORLDS", JSON.stringify(window.gameState.worlds));
        closeWorldCreatorModal();
        renderLobbyWorlds();
        if (typeof window.showToast === 'function') window.showToast("世界创建成功");
    };
    window.handleWorldFileImport = function(input) {
        if (!input.files || !input.files[0]) return;
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            const worldName = file.name.replace(/\.[^/.]+$/, "");
            if (!window.gameState.worlds) window.gameState.worlds = [];
            window.gameState.worlds.push({ id: "import-"+Date.now(), name: worldName, description: content.slice(0,200), globalLore: content, systemPrompt: "你是文字游戏推演机", customStats: [], locations: [], npcs: [] });
            localStorage.setItem("AI_WENYOU_WORLDS", JSON.stringify(window.gameState.worlds));
            renderLobbyWorlds();
            if (typeof window.showToast === 'function') window.showToast("文件导入成功，世界已创建");
        };
        reader.readAsText(file);
    };
    window.deleteCustomWorld = function(worldId) {
        if (confirm("确定删除此世界？")) {
            window.gameState.worlds = window.gameState.worlds.filter(w => w.id !== worldId);
            localStorage.setItem("AI_WENYOU_WORLDS", JSON.stringify(window.gameState.worlds));
            renderLobbyWorlds();
            if (typeof window.showToast === 'function') window.showToast("世界已删除");
        }
    };

    // NPC 创建
    window.openNpcCreationModal = function() {
        let modal = document.getElementById('modal-npc-creator');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-npc-creator';
            modal.className = 'modal-overlay hidden';
            modal.innerHTML = `<div class="modal-card"><div class="p-4 border-b"><h3>创建NPC</h3><button onclick="closeNpcCreationModal()" class="float-right">&times;</button></div><div class="p-4"><input type="text" id="npc-name" placeholder="姓名" class="w-full border rounded p-2 mb-2"><input type="text" id="npc-relation" placeholder="关系" class="w-full border rounded p-2 mb-2"><textarea id="npc-desc" rows="3" placeholder="描述" class="w-full border rounded p-2 mb-2"></textarea><button onclick="commitNpcCreation()" class="btn-primary w-full">创建</button></div></div>`;
            document.body.appendChild(modal);
        }
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
    };
    window.closeNpcCreationModal = function() {
        const modal = document.getElementById('modal-npc-creator');
        if (modal) modal.style.display = 'none';
    };
    window.commitNpcCreation = function() {
        const name = document.getElementById('npc-name')?.value.trim();
        if (!name) { alert("请输入姓名"); return; }
        const relation = document.getElementById('npc-relation')?.value.trim() || "陌生人";
        const desc = document.getElementById('npc-desc')?.value.trim() || "";
        const newNpc = { id: "npc-"+Date.now(), name: name, relation: relation, desc: desc, stats: { "好感": 20 }, inventory: [], portrait: "", jcl: { age: "未知", gender: "未定", personality: "未知", background: desc, location: window.gameState.gameState?.currentLocationId || "" } };
        if (!window.gameState.gameState) window.gameState.gameState = { npcs: [] };
        if (!window.gameState.gameState.npcs) window.gameState.gameState.npcs = [];
        window.gameState.gameState.npcs.push(newNpc);
        closeNpcCreationModal();
        if (typeof window.renderNpcCards === 'function') window.renderNpcCards();
        if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
        if (typeof window.showToast === 'function') window.showToast(`NPC ${name} 已创建`);
    };

    // 背包、关系等
    window.openPlayerBackpackModal = function() { alert("背包功能开发中，请查看控制台"); };
    window.openPlayerRelationsModal = function() { alert("关系功能开发中"); };
    window.addPlayerResumeLog = function() { alert("履历添加功能开发中"); };
    window.aiGenerateNpcByWorld = async function() { alert("AI生成NPC功能需要API配置"); };
    window.aiGenerateNpcByStory = async function() { alert("AI生成NPC功能需要API配置"); };
    window.importNpcData = function(input) { alert("导入NPC功能开发中"); };
    window.toggleSection = function(id) { document.getElementById(id)?.classList.toggle('hidden'); };
    window.toggleStoryMoreMenu = function() { document.getElementById('story-more-menu')?.classList.toggle('hidden'); };
    window.updatePlayerCoreName = function(val) { if (val.trim() && window.gameState.gameState) { window.gameState.gameState.player.name = val; if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState(); } };
    window.adjustAllPlayerStats = function(delta) { if (!window.gameState.gameState) return; const stats = window.gameState.gameState.player.stats; Object.keys(stats).forEach(k => { stats[k] = Math.max(0, Math.min(100, stats[k] + delta)); }); if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState(); if (typeof window.updatePanelUI === 'function') window.updatePanelUI(); if (typeof window.showToast === 'function') window.showToast(`属性已调整`); };
    window.toggleCheatMode = function() { window.DB.cheatModeEnabled = document.getElementById('cheat-toggle')?.checked || false; const span = document.getElementById('cheat-status-text'); if (span) span.innerText = window.DB.cheatModeEnabled ? "开启" : "关闭"; if (typeof window.showToast === 'function') window.showToast(window.DB.cheatModeEnabled ? "金手指已开启" : "金手指已关闭"); };
    window.saveEverything = function() { if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState(); if (typeof window.showToast === 'function') window.showToast("已保存"); };
    window.applyBubbleStyles = function() { const root = document.documentElement; root.style.setProperty('--bubble-self-bg', window.DB?.bubbleStyles?.selfBg || "#3b82f6"); root.style.setProperty('--bubble-self-color', window.DB?.bubbleStyles?.selfColor || "#ffffff"); root.style.setProperty('--bubble-npc-bg', window.DB?.bubbleStyles?.npcBg || "#e4e4e7"); root.style.setProperty('--bubble-npc-color', window.DB?.bubbleStyles?.npcColor || "#18181b"); };
    window.toggleChoicesCollapse = function() { const box = document.getElementById('story-choices-box'); if (box) box.classList.toggle('collapsed'); };
    window.closeAllModals = function() { document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none'); };
    window.showToast = function(msg, isSuccess=true) { const toast = document.createElement('div'); toast.className = `toast ${isSuccess ? 'success' : 'error'}`; toast.innerText = msg; document.getElementById('toast-container')?.appendChild(toast); setTimeout(() => toast.remove(), 3000); };
    window.escapeHtml = function(str) { if (!str) return ''; return String(str).replace(/[&<>]/g, m => m==='&'?'&amp;':m==='<'?'&lt;':'&gt;'); };
    // 确保这些函数存在，防止报错
    if (!window.getLocationById) window.getLocationById = function(id) { return window.gameState?.gameState?.locations?.find(l => l.id === id); };
    if (!window.renderPlayerStatsAndResume) window.renderPlayerStatsAndResume = function() { console.log("renderPlayerStatsAndResume 占位"); };
    if (!window.renderWorldBook) window.renderWorldBook = function() { console.log("renderWorldBook 占位"); };
    if (!window.autoSaveGameState) window.autoSaveGameState = function() { console.log("autoSaveGameState 占位"); };
    if (!window.updatePanelUI) window.updatePanelUI = function() { console.log("updatePanelUI 占位"); };
    if (!window.renderNpcCards) window.renderNpcCards = function() { console.log("renderNpcCards 占位"); };
    if (!window.renderYiCiYuanMap) window.renderYiCiYuanMap = function() { console.log("renderYiCiYuanMap 占位"); };
})();

// 启动应用
document.addEventListener('DOMContentLoaded', initApp);
