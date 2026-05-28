// js/save.js - 存档管理模块（IndexedDB + localStorage 混合存储）

// ==================== IndexedDB 配置 ====================
const DB_NAME = 'ai_wenyou_db';
const DB_VERSION = 2;
const STORE_NAME = 'game_saves';
const DATA_KEY = 'current_save';

/**
 * 初始化 IndexedDB
 * @returns {Promise<IDBDatabase>}
 */
function initIndexedDB() {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            reject(new Error('您的浏览器不支持 IndexedDB，将使用 localStorage 作为后备存储'));
            return;
        }
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(new Error('无法打开数据库：' + (request.error?.message || '未知错误')));
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
}

/**
 * 保存数据到 IndexedDB
 * @param {any} data - 要保存的数据
 * @returns {Promise<void>}
 */
async function saveDataToIndexedDB(data) {
    const db = await initIndexedDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_NAME], 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.put(data, DATA_KEY);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('保存数据失败：' + (request.error?.message || '未知错误')));
    });
}

/**
 * 从 IndexedDB 加载数据
 * @returns {Promise<any|null>}
 */
async function loadDataFromIndexedDB() {
    const db = await initIndexedDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_NAME], 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(DATA_KEY);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(new Error('加载数据失败：' + (request.error?.message || '未知错误')));
    });
}

/**
 * 从 IndexedDB 删除数据
 * @returns {Promise<void>}
 */
async function deleteDataFromIndexedDB() {
    const db = await initIndexedDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_NAME], 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.delete(DATA_KEY);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('删除数据失败：' + (request.error?.message || '未知错误')));
    });
}

// ==================== localStorage 迁移与兼容 ====================
/**
 * 从 localStorage 迁移数据到 IndexedDB
 * @returns {Promise<boolean>}
 */
async function migrateDataFromLocalStorage() {
    const oldData = localStorage.getItem('cloud_game_save');
    if (!oldData) return false;
    try {
        const parsed = JSON.parse(oldData);
        const existing = await loadDataFromIndexedDB();
        if (existing) return false; // 已有新数据，不覆盖
        await saveDataToIndexedDB(parsed);
        return true;
    } catch (e) {
        console.warn('迁移失败', e);
        return false;
    }
}

// ==================== 核心存档函数 ====================
/**
 * 保存当前游戏状态（自动使用 IndexedDB，失败时回退 localStorage）
 */
async function saveData() {
    try {
        const dataToSave = JSON.stringify(window.gameState);
        await saveDataToIndexedDB(dataToSave);
    } catch (error) {
        console.error('IndexedDB 保存失败，尝试 localStorage:', error);
        try {
            localStorage.setItem('cloud_game_save', JSON.stringify(window.gameState));
            console.warn('已回退到 localStorage 存储');
        } catch (localError) {
            console.error('localStorage 保存也失败:', localError);
            window.showToast?.('数据保存失败，请检查浏览器存储权限', false);
        }
    }
}

/**
 * 加载游戏状态（自动从 IndexedDB 读取，必要时迁移）
 */
async function loadData() {
    try {
        // 优先从 IndexedDB 加载
        let data = await loadDataFromIndexedDB();
        if (data) {
            try {
                const parsed = typeof data === 'string' ? JSON.parse(data) : data;
                window.gameState = { ...window.gameState, ...parsed };
                applyLoadedDataCompatibility();
                return;
            } catch (e) { console.error('解析 IndexedDB 数据失败', e); }
        }

        // 尝试迁移 localStorage 数据
        const migrated = await migrateDataFromLocalStorage();
        if (migrated) {
            const newData = await loadDataFromIndexedDB();
            if (newData) {
                const parsed = typeof newData === 'string' ? JSON.parse(newData) : newData;
                window.gameState = { ...window.gameState, ...parsed };
                applyLoadedDataCompatibility();
                window.showToast?.('已自动迁移旧存档到新存储系统');
                return;
            }
        }

        // 最终回退到 localStorage 直接读取
        const localData = localStorage.getItem('cloud_game_save');
        if (localData) {
            const parsed = JSON.parse(localData);
            window.gameState = { ...window.gameState, ...parsed };
            applyLoadedDataCompatibility();
            // 异步保存到 IndexedDB（不阻塞）
            saveData().catch(err => console.warn('自动保存到 IndexedDB 失败', err));
        }
    } catch (error) {
        console.error('加载数据失败', error);
    }
}

/**
 * 应用加载数据的兼容性处理（补齐缺失字段）
 */
function applyLoadedDataCompatibility() {
    const gs = window.gameState;
    if (!gs) return;

    // 补齐缺失字段
    if (!Array.isArray(gs.inventoryLog)) gs.inventoryLog = [];
    if (!gs.world) gs.world = { current_location_id: "", locations: [], favorites: [], pinnedLocations: [] };
    if (!Array.isArray(gs.world.locations)) gs.world.locations = [];
    if (!Array.isArray(gs.world.favorites)) gs.world.favorites = [];
    if (!Array.isArray(gs.world.pinnedLocations)) gs.world.pinnedLocations = [];
    if (!gs.meta) gs.meta = { version: 2, usedAvatarUrls: [] };
    if (!Array.isArray(gs.meta.usedAvatarUrls)) gs.meta.usedAvatarUrls = [];

    // 履历字段兼容
    if (gs.resumeRefreshMode !== 'append' && gs.resumeRefreshMode !== 'overwrite') gs.resumeRefreshMode = 'overwrite';
    if (typeof gs.resumeCustomPrompt !== 'string') gs.resumeCustomPrompt = '';
    if (typeof gs.resumeCustomLength !== 'string') gs.resumeCustomLength = '';
    if (typeof gs.resumeCustomCount !== 'string') gs.resumeCustomCount = '';
    if (!Array.isArray(gs.resumeCustomCharacters)) gs.resumeCustomCharacters = [];
    if (!gs.timelineResume || typeof gs.timelineResume !== 'object') gs.timelineResume = { html: '', updatedAt: '' };
    if (!Array.isArray(gs.timelineLogs)) gs.timelineLogs = [];
    if (!Array.isArray(gs.resumeLog)) gs.resumeLog = [];
    if (!Array.isArray(gs.resumes)) gs.resumes = [];

    // 记忆模块
    if (!gs.memory || typeof gs.memory !== 'object') {
        gs.memory = {
            history_summary: "", key_events: [], relations: [], tasks: "", world_core: "",
            last_update: "", last_history_index: 0, world_summarized: false
        };
    } else {
        if (typeof gs.memory.last_history_index !== 'number') gs.memory.last_history_index = 0;
        if (typeof gs.memory.world_summarized !== 'boolean') gs.memory.world_summarized = false;
        if (!Array.isArray(gs.memory.key_events)) gs.memory.key_events = [];
        if (!Array.isArray(gs.memory.relations)) gs.memory.relations = [];
        gs.memory.tasks = gs.memory.tasks || "";
        gs.memory.world_core = gs.memory.world_core || "";
    }

    // DIY 扩展
    if (!gs.diySettings) {
        gs.diySettings = {
            customStylePrompt: "", customBasePrompt: "", customFontFamily: "默认字体",
            customFonts: [], extendedStateDefinitions: [], mapConfig: { bgImage: "", locationsPosition: {} }
        };
    }
    if (!gs.worldBook) {
        gs.worldBook = { entries: [], settings: { maxContextTokens: 2000, recursiveScan: true } };
    }

    // NPC 聊天历史与称呼
    if (!Array.isArray(gs.npcs)) gs.npcs = [];
    gs.npcs.forEach(npc => {
        if (!Array.isArray(npc.chatHistory)) npc.chatHistory = [];
        if (typeof npc.playerCallName !== 'string') npc.playerCallName = '';
    });

    // 关系网
    if (!gs.relationshipNetwork || typeof gs.relationshipNetwork !== 'object') {
        gs.relationshipNetwork = { nodes: [], edges: [] };
    }
    if (!Array.isArray(gs.relationshipNetwork.nodes)) gs.relationshipNetwork.nodes = [];
    if (!Array.isArray(gs.relationshipNetwork.edges)) gs.relationshipNetwork.edges = [];

    // 确保头像库开关
    if (typeof gs.avatarLibraryEnabled !== 'boolean') gs.avatarLibraryEnabled = true;

    // 确保游戏开始设置
    if (!gs.gameStartSettings) gs.gameStartSettings = null;

    // 确保世界风格
    if (gs.worldStyle === undefined) gs.worldStyle = null;

    // 确保导入标记
    if (typeof gs.hasImportedFile !== 'boolean') gs.hasImportedFile = false;
}

// ==================== 手动存档快照 ====================
/**
 * 手动存盘快照
 */
function executeSaveAction() {
    if (!window.gameState) { window.showToast?.("未切入位面剧本！", false); return; }
    const saveItem = {
        worldName: window.gameState.worldName || window.gameState.player?.location || "未知世界",
        timestamp: new Date().toLocaleString(),
        gameState: JSON.parse(JSON.stringify(window.gameState))
    };
    // 保存时间、天气等
    if (window.DB) {
        saveItem.gameState._worldTime = window.DB.worldTime;
        saveItem.gameState._weather = window.DB.weather;
        saveItem.gameState._festival = window.DB.festival;
    }
    const storyTerminal = document.getElementById('story-terminal');
    if (storyTerminal) saveItem.gameState._storyTerminalHTML = storyTerminal.innerHTML;

    if (!Array.isArray(window.gameState.saves)) window.gameState.saves = [];
    window.gameState.saves.unshift(saveItem);
    if (window.gameState.saves.length > 15) window.gameState.saves.pop();
    localStorage.setItem("AI_WENYOU_SAVES", JSON.stringify(window.gameState.saves));
    if (typeof window.renderLobbySaves === 'function') window.renderLobbySaves();
    window.showToast?.("存盘快照创建成功！");
}

/**
 * 读取存档快照
 * @param {number} idx - 存档索引
 */
function loadSaveStateFromIndex(idx) {
    const targetSave = window.gameState?.saves?.[idx];
    if (!targetSave) return;
    window.gameState = JSON.parse(JSON.stringify(targetSave.gameState));
    if (targetSave.gameState._worldTime && window.DB) window.DB.worldTime = targetSave.gameState._worldTime;
    if (targetSave.gameState._weather && window.DB) window.DB.weather = targetSave.gameState._weather;
    if (targetSave.gameState._festival && window.DB) window.DB.festival = targetSave.gameState._festival;
    if (targetSave.gameState._festivalCustom !== undefined && window.DB) window.DB.festivalCustom = targetSave.gameState._festivalCustom;

    if (!window.gameState.player.relations) window.gameState.player.relations = [];
    if (window.DB) window.DB.isPalaceMode = window.detectPalaceMode?.() || false;

    if (typeof window.updateGameplayHeaderLocation === 'function') window.updateGameplayHeaderLocation();
    if (typeof window.updateWorldTimeDisplay === 'function') window.updateWorldTimeDisplay();
    if (typeof window.updateWeatherDisplay === 'function') window.updateWeatherDisplay();
    if (typeof window.updateFestivalDisplay === 'function') window.updateFestivalDisplay();
    if (typeof window.applyMapBackgroundFromUrl === 'function') window.applyMapBackgroundFromUrl();

    if (typeof window.closeAllModals === 'function') window.closeAllModals();
    if (typeof window.switchScreen === 'function') window.switchScreen('screen-gameplay');
    if (typeof window.switchSubview === 'function') window.switchSubview('subview-story');

    const storyTerminal = document.getElementById('story-terminal');
    if (storyTerminal) storyTerminal.innerHTML = `<div class="text-xs italic">【时光锚定】加载了${targetSave.timestamp}的快照。</div>`;
    if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
    if (typeof window.triggerContinueStory === 'function') window.triggerContinueStory();
    window.showToast?.("读档成功！");
}

/**
 * 删除存档快照
 * @param {number} idx
 */
function deleteSaveStateFromIndex(idx) {
    if (!Array.isArray(window.gameState?.saves)) return;
    window.gameState.saves.splice(idx, 1);
    localStorage.setItem("AI_WENYOU_SAVES", JSON.stringify(window.gameState.saves));
    if (typeof window.renderLobbySaves === 'function') window.renderLobbySaves();
    window.showToast?.("快照已湮灭。");
}

/**
 * 导出游戏状态为 JSON 文件
 */
function executeExportAction() {
    if (!window.gameState) { window.showToast?.("无动态数据可导出。", false); return; }
    const exportData = JSON.parse(JSON.stringify(window.gameState));
    if (window.DB) {
        exportData._worldTime = window.DB.worldTime;
        exportData._weather = window.DB.weather;
        exportData._festival = window.DB.festival;
        exportData._festivalCustom = window.DB.festivalCustom;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `AI文游_${window.gameState.worldName || '存档'}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    window.showToast?.("JSON文件已下载！");
}

/**
 * 导入 JSON 存档文件
 * @param {HTMLInputElement} input - file input 元素
 */
function executeImportFileAction(input) {
    if (!input.files || !input.files[0]) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const parsedState = JSON.parse(e.target.result);
            if (!parsedState.worldName && !parsedState.player) { window.showToast?.("非合规JSON游戏档！", false); return; }
            window.gameState = parsedState;
            if (parsedState._worldTime && window.DB) window.DB.worldTime = parsedState._worldTime;
            if (parsedState._weather && window.DB) window.DB.weather = parsedState._weather;
            if (parsedState._festival && window.DB) window.DB.festival = parsedState._festival;
            if (parsedState._festivalCustom !== undefined && window.DB) window.DB.festivalCustom = parsedState._festivalCustom;

            if (typeof window.updateGameplayHeaderLocation === 'function') window.updateGameplayHeaderLocation();
            if (typeof window.updateWorldTimeDisplay === 'function') window.updateWorldTimeDisplay();
            if (typeof window.updateWeatherDisplay === 'function') window.updateWeatherDisplay();
            if (typeof window.updateFestivalDisplay === 'function') window.updateFestivalDisplay();
            if (typeof window.applyMapBackgroundFromUrl === 'function') window.applyMapBackgroundFromUrl();

            if (typeof window.switchScreen === 'function') window.switchScreen('screen-gameplay');
            if (typeof window.switchSubview === 'function') window.switchSubview('subview-story');
            if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
            if (typeof window.triggerContinueStory === 'function') window.triggerContinueStory();
            window.showToast?.("外部资产装载成功！");
        } catch (err) { window.showToast?.("文件解析崩塌。", false); }
    };
    reader.readAsText(input.files[0]);
}

/**
 * 恢复出厂设置（清除所有数据）
 */
async function hardResetAllData() {
    const confirmed = await (window.gameConfirm || confirm)("此操作将删除所有游戏数据且不可恢复。确定继续？");
    if (!confirmed) return;
    try { await deleteDataFromIndexedDB(); } catch (e) { console.warn(e); }
    try { localStorage.removeItem('cloud_game_save'); } catch (e) {}
    // 清除所有 AI_WENYOU_ 开头的 localStorage 键
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("AI_WENYOU_")) keysToRemove.push(key);
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    // 重置全局状态
    if (window.resetGameMemory) window.resetGameMemory();
    if (window.gameState) {
        window.gameState.worldStyle = null;
        if (window.gameState.meta) window.gameState.meta.usedAvatarUrls = [];
        window.gameState.resumeLog = [];
        window.gameState.timelineLogs = [];
        window.gameState.resumes = [];
        window.gameState.timelineResume = { html: '', updatedAt: '' };
        window.gameState.resumeRefreshMode = 'overwrite';
        window.gameState.resumeCustomPrompt = '';
        window.gameState.resumeCustomCount = '';
        window.gameState.resumeCustomCharacters = [];
        window.gameState.resumeCustomLength = '';
    }
    if (typeof window.updateMemoryStatusUI === 'function') window.updateMemoryStatusUI();
    location.reload();
}

// 自动保存游戏状态的辅助函数（用于剧情推进后）
function autoSaveGameState() {
    if (!window.gameState) return;
    const saveData = JSON.parse(JSON.stringify(window.gameState));
    if (window.DB) {
        saveData._worldTime = window.DB.worldTime;
        saveData._weather = window.DB.weather;
        saveData._festival = window.DB.festival;
        saveData._festivalCustom = window.DB.festivalCustom;
        if (window.DB.timelineMilestones) saveData._timelineMilestones = window.DB.timelineMilestones;
        if (window.DB.destinyPoints !== undefined) saveData._destinyPoints = window.DB.destinyPoints;
        if (window.DB.rumors) saveData._rumors = window.DB.rumors;
        if (window.DB.familyTree) saveData._familyTree = window.DB.familyTree;
        if (window.DB.interactionTags) saveData._interactionTags = window.DB.interactionTags;
        if (window.DB.deletedNpcs) saveData._deletedNpcs = window.DB.deletedNpcs;
        if (window.DB.autoWorldLogEnabled !== undefined) saveData._autoWorldLogEnabled = window.DB.autoWorldLogEnabled;
        if (window.DB.autoWorldLogTrigger) saveData._autoWorldLogTrigger = window.DB.autoWorldLogTrigger;
    }
    const storyTerminal = document.getElementById('story-terminal');
    if (storyTerminal) saveData._storyTerminalHTML = storyTerminal.innerHTML;
    localStorage.setItem("AI_WENYOU_AUTOSAVE", JSON.stringify(saveData));
}

// 挂载到全局
if (typeof window !== 'undefined') {
    window.saveData = saveData;
    window.loadData = loadData;
    window.autoSaveGameState = autoSaveGameState;
    window.executeSaveAction = executeSaveAction;
    window.loadSaveStateFromIndex = loadSaveStateFromIndex;
    window.deleteSaveStateFromIndex = deleteSaveStateFromIndex;
    window.executeExportAction = executeExportAction;
    window.executeImportFileAction = executeImportFileAction;
    window.hardResetAllData = hardResetAllData;
    window.applyLoadedDataCompatibility = applyLoadedDataCompatibility;
}
