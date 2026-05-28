// js/app.js - 应用入口与初始化

// ==================== 初始化函数 ====================
async function initApp() {
    // 加载数据
    await window.loadData?.();
    window.initLocalStorageData?.();
    
    // 应用主题
    applyTheme();
    updateDayNightUI();
    window.applyBubbleStyles?.();
    
    // 加载设置
    loadUserCorePrompt();
    loadGenParams();
    loadSummaryPrompt();
    loadFontSettings();
    loadNpcMoveSettings();
    loadGlobalNpcLogicPrompt();
    
    // 初始渲染
    renderLobbyWorlds();
    renderLobbySaves();
    checkAutoSavedGame();
    
    // 绑定事件
    bindGlobalEvents();
    
    // 初始化PDF.js
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    
    // 初始显示大厅
    switchScreen('screen-lobby');
    
    // 设置字体缩放
    const savedFont = localStorage.getItem("AI_WENYOU_FONT_SIZE");
    if (savedFont) window.setFontScale?.(parseFloat(savedFont));
    
    // 全局缩放
    loadGlobalZoom();
    
    // 论坛初始化
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
    window.showToast?.(window.DB.isNightMode ? '🌙 夜间模式' : '☀️ 日间模式');
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
        el.innerHTML = `<div class="world-name">${w.name}</div><div class="world-desc">${w.description || ''}</div><div class="world-meta">场景: ${w.locations?.length || 0} | NPC: ${w.npcs?.length || 0}</div>`;
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
        el.innerHTML = `<div><span class="font-bold">${s.worldName}</span><span class="text-[10px] ml-2">${s.timestamp}</span></div><div><button onclick="loadSaveStateFromIndex(${idx})" class="btn-small">读档</button><button onclick="deleteSaveStateFromIndex(${idx})" class="icon-btn"><i class="fas fa-times"></i></button></div>`;
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
        window.checkAutoSavedGame?.();
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
    // 刷新对应视图数据
    if (subviewId === 'subview-map' && typeof window.renderYiCiYuanMap === 'function') window.renderYiCiYuanMap();
    if (subviewId === 'subview-stats' && typeof window.renderPlayerStatsAndResume === 'function') window.renderPlayerStatsAndResume();
    if (subviewId === 'subview-npc' && typeof window.renderNpcCards === 'function') window.renderNpcCards();
    if (subviewId === 'subview-worldbook' && typeof window.renderWorldBook === 'function') window.renderWorldBook();
    if (subviewId === 'subview-forum' && typeof window.initForumData === 'function') window.initForumData();
}

// ==================== 辅助函数 ====================
function loadUserCorePrompt() {
    const saved = localStorage.getItem("AI_WENYOU_CORE_PROMPT");
    const textarea = document.getElementById('user-core-prompt');
    if (textarea) textarea.value = saved || "";
}

function loadGenParams() {
    const saved = localStorage.getItem("AI_WENYOU_GEN_PARAMS");
    if (saved) {
        try {
            window.DB.genParams = JSON.parse(saved);
        } catch(e) {}
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
    const savedAutoMove = localStorage.getItem("AI_WENYOU_NPC_AUTO_MOVE");
    if (savedAutoMove !== null && window.DB) window.DB.npcAutoMove = savedAutoMove === 'true';
    const savedInterval = localStorage.getItem("AI_WENYOU_NPC_MOVE_INTERVAL");
    if (savedInterval && window.DB) window.DB.npcMoveInterval = parseInt(savedInterval);
    const savedMaxCount = localStorage.getItem("AI_WENYOU_NPC_MOVE_MAX_COUNT");
    if (savedMaxCount && window.DB) window.DB.npcMoveMaxCount = parseInt(savedMaxCount);
    const toggle = document.getElementById('npc-auto-move-toggle');
    if (toggle) toggle.checked = window.DB?.npcAutoMove || false;
    const intervalInput = document.getElementById('npc-move-interval');
    if (intervalInput) intervalInput.value = window.DB?.npcMoveInterval || 3;
    const maxCountInput = document.getElementById('npc-move-max-count');
    if (maxCountInput) maxCountInput.value = window.DB?.npcMoveMaxCount || 2;
}

function loadGlobalNpcLogicPrompt() {
    const saved = localStorage.getItem("AI_WENYOU_GLOBAL_NPC_LOGIC");
    const textarea = document.getElementById('global-npc-logic-prompt');
    if (textarea && saved) textarea.value = saved;
    else if (textarea) textarea.value = "每个NPC要有独立性格，对话避免复读机，体现情绪波动...";
}

// ==================== 全局事件绑定 ====================
function bindGlobalEvents() {
    // 一键到底按钮
    const scrollBtn = document.getElementById('scroll-to-bottom-btn');
    if (scrollBtn) {
        scrollBtn.onclick = () => {
            const terminal = document.getElementById('story-terminal');
            if (terminal) terminal.scrollTop = terminal.scrollHeight;
        };
    }
    // 选项折叠
    const collapseBtn = document.getElementById('choices-collapse-btn');
    if (collapseBtn) {
        collapseBtn.onclick = () => {
            const box = document.getElementById('story-choices-box');
            if (box) box.classList.toggle('collapsed');
        };
    }
    // 更多菜单
    const moreBtn = document.getElementById('story-more-menu-btn');
    if (moreBtn) {
        moreBtn.onclick = () => {
            const menu = document.getElementById('story-more-menu');
            if (menu) menu.classList.toggle('hidden');
        };
    }
    // 输入框回车
    const input = document.getElementById('story-custom-input');
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') window.submitCustomAction?.();
        });
    }
    // 禁用右键菜单（除输入框）
    document.addEventListener('contextmenu', (e) => {
        if (!e.target.closest('input, textarea')) e.preventDefault();
    });
}

// ==================== 占位函数（待实现） ====================
function openUserManager() { alert("用户管理功能开发中"); }
function openWorldCreatorModal() { alert("世界创建功能开发中"); }
function handleWorldFileImport(input) { alert("文件导入功能开发中"); }
function toggleSection(id) { document.getElementById(id)?.classList.toggle('hidden'); }
function toggleStoryMoreMenu() { document.getElementById('story-more-menu')?.classList.toggle('hidden'); }
function openPlayerSettingModal() { alert("角色编辑功能开发中"); }
function openPlayerBackpackModal() { alert("背包详情功能开发中"); }
function openPlayerRelationsModal() { alert("关系管理功能开发中"); }
function addPlayerResumeLog() { alert("添加履历功能开发中"); }
function openNpcCreationModal() { alert("NPC创建功能开发中"); }
function aiGenerateNpcByWorld() { alert("AI生成NPC功能开发中"); }
function aiGenerateNpcByStory() { alert("AI生成NPC功能开发中"); }
function openFamilyTreeModal() { alert("家族树功能开发中"); }
function openSituationAnalysisModal() { alert("局势分析功能开发中"); }
function openNpcRelationsModal() { alert("NPC关系网功能开发中"); }
function aiGenerateAllNpcRelations() { alert("AI推演关系网功能开发中"); }
function importNpcData(input) { alert("导入NPC功能开发中"); }
function editPromptPreset(key) { alert("编辑预设: "+key); }
function resetPromptPreset(key) { alert("重置预设: "+key); }
function savePromptPresetsToStorage() {}
function updatePlayerCoreName(val) {}
function adjustAllPlayerStats(delta) {}
function toggleCheatMode() {}
function saveEverything() { window.autoSaveGameState?.(); window.showToast?.("已保存"); }
function applyBubbleStyles() {}
function toggleChoicesCollapse() {}

// ==================== 启动应用 ====================
document.addEventListener('DOMContentLoaded', initApp);
