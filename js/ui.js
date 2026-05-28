// js/ui.js - UI 渲染与交互模块

// ==================== 通用渲染函数 ====================

/**
 * 添加日志条目到剧情终端
 * @param {string} htmlContent - HTML 内容
 * @param {string} type - 类型: 'user', 'ai', 'system'
 * @returns {HTMLElement} 添加的元素
 */
function addLog(htmlContent, type) {
    const logDiv = document.getElementById('game-log');
    if (!logDiv) {
        // 如果没有 game-log（新架构使用 story-terminal），则直接添加到 story-terminal
        const terminal = document.getElementById('story-terminal');
        if (terminal) {
            const entry = document.createElement('div');
            if (type === 'user') {
                entry.className = 'bubble-wrap self';
                entry.innerHTML = `<div class="bubble-avatar">我</div><div class="bubble-body">${htmlContent}</div>`;
            } else if (type === 'system') {
                entry.className = 'narration-block';
                entry.innerHTML = htmlContent;
            } else {
                entry.innerHTML = htmlContent;
                // 绑定选项按钮
                setTimeout(() => bindAiHtmlChoices(entry), 0);
            }
            terminal.appendChild(entry);
            terminal.scrollTop = terminal.scrollHeight;
            return entry;
        }
        return null;
    }

    const entry = document.createElement('div');
    if (type === 'user') {
        entry.className = "flex justify-end fade-in";
        entry.innerHTML = `<div class="bg-primary text-white px-4 py-2 rounded-l-xl rounded-tr-xl shadow max-w-[80%] text-sm">${htmlContent}</div>`;
    } else if (type === 'system') {
        entry.className = "text-center text-xs text-gray-500 my-2";
        entry.innerHTML = htmlContent;
    } else {
        entry.className = "fade-in";
        let cleanContent = String(htmlContent)
            .replace(/```json[\s\S]*?```/gi, '')
            .replace(/```[\s\S]*?```/gi, '')
            .trim();
        entry.innerHTML = cleanContent;
        bindAiHtmlChoices(entry);
        // 头像替换
        setTimeout(() => replaceCharacterAvatarsInEntry(entry), 100);
    }
    logDiv.appendChild(entry);
    if (window.gameState) {
        if (!window.gameState.gameLog) window.gameState.gameLog = [];
        window.gameState.gameLog.push({ type, content: htmlContent });
    }
    setTimeout(() => {
        try { logDiv.scrollTo({ top: logDiv.scrollHeight, behavior: 'smooth' }); } catch { logDiv.scrollTop = logDiv.scrollHeight; }
    }, 80);
    return entry;
}

/**
 * 重绘整个游戏日志（从 gameState.gameLog 恢复）
 */
function renderGameLog() {
    const logDiv = document.getElementById('game-log');
    if (!logDiv) return;
    logDiv.innerHTML = '';
    const logs = window.gameState?.gameLog || [];
    logs.forEach(log => {
        const entry = document.createElement('div');
        if (log.type === 'user') {
            entry.className = "flex justify-end fade-in";
            entry.innerHTML = `<div class="bg-primary text-white px-4 py-2 rounded-l-xl rounded-tr-xl shadow max-w-[80%] text-sm">${log.content}</div>`;
        } else if (log.type === 'system') {
            entry.className = "text-center text-xs text-gray-500 my-2";
            entry.innerHTML = log.content;
        } else {
            entry.className = "fade-in";
            let cleanContent = String(log.content)
                .replace(/```json[\s\S]*?```/gi, '')
                .replace(/```[\s\S]*?```/gi, '')
                .trim();
            entry.innerHTML = cleanContent;
            bindAiHtmlChoices(entry);
            setTimeout(() => replaceCharacterAvatarsInEntry(entry), 100);
        }
        logDiv.appendChild(entry);
    });
    setTimeout(() => {
        try { logDiv.scrollTo({ top: logDiv.scrollHeight, behavior: 'smooth' }); } catch { logDiv.scrollTop = logDiv.scrollHeight; }
    }, 80);
}

/**
 * 绑定 AI 回复中的选项按钮
 * @param {HTMLElement} rootEl - 包含选项的根元素
 */
function bindAiHtmlChoices(rootEl) {
    if (!rootEl) return;
    const nodes = rootEl.querySelectorAll('[data-ai-choice]');
    nodes.forEach(node => {
        const choiceText = node.getAttribute('data-ai-choice') || node.textContent || '';
        if (!choiceText) return;
        const choiceKey = String(choiceText).trim();
        if (window.clickedChoices?.has(choiceKey)) {
            node.style.opacity = '0.5';
            node.style.cursor = 'not-allowed';
            node.style.pointerEvents = 'none';
            return;
        }
        node.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (window.clickedChoices?.has(choiceKey)) return;
            window.clickedChoices?.add(choiceKey);
            if (typeof window.sendTextAction === 'function') {
                window.sendTextAction(choiceText);
            } else {
                console.warn('sendTextAction not defined');
            }
        }, { once: true });
    });
}

/**
 * 构建 AI 风格的 HTML 卡片
 * @param {string} rawNarrative - 原始叙述文本
 * @param {string[]} choices - 选项数组
 * @param {Object} gameData - 游戏数据
 * @returns {string} HTML 字符串
 */
function buildAIStyledHTML(rawNarrative, choices, gameData) {
    let narrativeClean = String(rawNarrative ?? '')
        .replace(/```json[\s\S]*?```/gi, '')
        .replace(/```[\s\S]*?```/gi, '')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .trim();
    if (!narrativeClean) {
        narrativeClean = '<div style="padding: 16px; background: linear-gradient(135deg, rgba(255,126,179,.15), rgba(255,190,118,.15)); border-radius: 12px; margin: 12px 0;">AI 返回的内容格式异常，无法解析。请重试。</div>';
    }
    const choiceList = Array.isArray(choices) ? choices.filter(Boolean) : [];
    if (choiceList.length > 0 && !narrativeClean.includes('data-ai-choice')) {
        const choiceHtml = choiceList.slice(0, 6).map(c => `
            <button class="ai-choice-chip" data-ai-choice="${window.escapeHtml?.(c) || c}" style="display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:999px;border:1px dashed var(--accent);background:rgba(255,255,255,.95);font-size:13px;color:var(--accent-dim);cursor:pointer;margin:4px;">
                <span style="width:6px;height:6px;border-radius:999px;background:currentColor;"></span>
                <span>${window.escapeHtml?.(c) || c}</span>
            </button>
        `).join('');
        narrativeClean += `
            <div style="margin-top:16px;padding-top:12px;border-top:1px solid rgba(0,0,0,.1);">
                <div style="font-size:11px;color:rgba(0,0,0,.4);margin-bottom:8px;">可选行动（点选即可推进剧情）</div>
                <div style="display:flex;flex-wrap:wrap;gap:8px;">
                    ${choiceHtml}
                </div>
            </div>
        `;
    }
    return narrativeClean;
}

/**
 * 更新底部选项按钮区域
 * @param {string[]} choices - 选项数组
 */
function updateChoices(choices) {
    const container = document.getElementById('ai-choices');
    if (!container) return;
    container.innerHTML = '';
    if (choices && choices.length > 0) {
        choices.slice(0, 6).forEach(choice => {
            const btn = document.createElement('button');
            btn.className = "bg-white border border-primary text-primary text-xs px-3 py-1 rounded-full hover:bg-primary hover:text-white transition shadow-sm whitespace-nowrap";
            btn.innerText = choice;
            btn.onclick = () => {
                if (typeof window.sendTextAction === 'function') window.sendTextAction(choice);
            };
            container.appendChild(btn);
        });
        container.classList.add('hidden');
    } else {
        container.classList.add('hidden');
    }
}

// ==================== 玩家面板渲染 ====================

/**
 * 更新玩家属性面板和背包预览
 */
function updatePanelUI() {
    const p = window.gameState?.player || {};
    const nameEl = document.getElementById('player-name');
    const titleEl = document.getElementById('player-title');
    const locEl = document.getElementById('player-loc');
    const birthdayEl = document.getElementById('player-birthday');
    
    if (nameEl) nameEl.innerText = p.name || '等待生成...';
    if (titleEl) titleEl.innerText = p.title || '等待生成...';
    if (locEl) locEl.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${window.escapeHtml?.(p.location || '未知地点')}`;
    if (birthdayEl) {
        const b = (p.birthday || '').trim();
        const age = typeof p.age === 'number' ? p.age : '';
        if (b) birthdayEl.innerText = age ? `生日：${b}（当前年龄：${age}）` : `生日：${b}`;
        else if (age) birthdayEl.innerText = `年龄：${age}`;
        else birthdayEl.innerText = '生日：待生成';
    }

    // 头像预览
    if (typeof window.renderAvatarIntoHost === 'function') {
        window.renderAvatarIntoHost(document.getElementById('player-avatar'), {
            name: p.name || '主角',
            gender: p.gender || '男',
            avatar: p.avatar
        }, { size: 80, fontSize: 28 });
    }

    // 属性网格
    const statsDiv = document.getElementById('player-stats');
    if (statsDiv) {
        statsDiv.innerHTML = '';
        const stats = p.stats || {};
        for (let [key, val] of Object.entries(stats)) {
            const translatedKey = typeof window.translateStatName === 'function' ? window.translateStatName(key) : key;
            statsDiv.innerHTML += `<div class="anime-card rounded-lg p-2 flex justify-between items-center"><span class="text-xs text-gray-500">${window.escapeHtml?.(translatedKey) || translatedKey}</span><span class="font-bold text-gray-800 text-sm">${val}</span></div>`;
        }
    }

    // 背包预览
    const invDiv = document.getElementById('inventory-list');
    if (invDiv) {
        invDiv.innerHTML = '';
        (p.inventory || []).forEach((item, index) => {
            const itemEl = document.createElement('div');
            itemEl.className = "aspect-square bg-gray-100 rounded-lg flex flex-col items-center justify-center p-1 cursor-pointer hover:bg-gray-200 relative group";
            itemEl.innerHTML = `<i class="fas fa-box text-gray-400 mb-1"></i><span class="text-[10px] text-center truncate w-full">${window.escapeHtml?.(item.name) || item.name}</span><span class="absolute top-0 right-0 bg-gray-600 text-white text-[8px] px-1 rounded-bl">${item.count ?? 1}</span><button class="absolute top-0 left-0 w-5 h-5 bg-white/90 text-primary text-[10px] rounded-br border border-pink-100 opacity-0 group-hover:opacity-100 transition" data-item-edit="${index}"><i class="fas fa-pen-to-square"></i></button>`;
            itemEl.onclick = () => { if (typeof window.openItemDetailModal === 'function') window.openItemDetailModal(index); };
            invDiv.appendChild(itemEl);
        });
        const addEl = document.createElement('div');
        addEl.className = "aspect-square bg-white/80 border border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center p-1 cursor-pointer hover:bg-gray-50";
        addEl.innerHTML = `<i class="fas fa-plus text-gray-400 mb-1"></i><span class="text-[10px] text-center text-gray-500">添加</span>`;
        addEl.onclick = () => { if (typeof window.toggleModal === 'function') window.toggleModal('modal-add-item', true); };
        invDiv.appendChild(addEl);
    }
}

/**
 * 更新 NPC 列表视图
 */
function updateNPCUI() {
    const list = document.getElementById('npc-list');
    if (!list) return;
    list.innerHTML = '';
    (window.gameState?.npcs || []).forEach(npc => {
        const div = document.createElement('div');
        div.className = "rpg-card p-3 flex gap-3 items-center relative";
        const avatarHostId = `npc-avatar-${String(npc.id || npc.name || Math.random()).replace(/[^a-zA-Z0-9_-]/g, '_')}`;
        div.innerHTML = `
            <div class="w-12 h-12 bg-gray-200 rounded-full overflow-hidden flex-shrink-0 cursor-pointer" data-npc-avatar-click="${window.escapeHtml?.(String(npc.id))}"><div id="${avatarHostId}" class="w-full h-full"></div></div>
            <div class="flex-1"><div class="flex justify-between items-center"><h4 class="font-bold text-gray-800">${window.escapeHtml?.(npc.name) || npc.name}</h4><span class="text-[10px] bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full">${window.escapeHtml?.(npc.relation) || npc.relation}</span></div><p class="text-xs text-gray-500 line-clamp-2 mt-1">${window.escapeHtml?.(npc.desc) || ''}</p></div>
            <button class="absolute top-2 right-2 text-gray-300 hover:text-gray-500" data-npc-edit="${window.escapeHtml?.(String(npc.id))}"><i class="fas fa-edit"></i></button>
        `;
        div.addEventListener('click', () => { if (typeof window.openNPCDetail === 'function') window.openNPCDetail(String(npc.id)); });
        list.appendChild(div);
        const host = div.querySelector(`#${CSS.escape(avatarHostId)}`);
        if (host && typeof window.renderAvatarIntoHost === 'function') {
            window.renderAvatarIntoHost(host, { name: npc.name || 'NPC', gender: npc.gender || '男', avatar: npc.avatar }, { size: 48, fontSize: 18 });
        }
    });
}

/**
 * 渲染 NPC 卡片（简化版用于 NPC 子视图）
 */
function renderNpcCards() {
    const container = document.getElementById('npc-cards-container');
    if (!container) return;
    container.innerHTML = '';
    if (!window.gameState?.npcs?.length) {
        container.innerHTML = '<div class="text-center py-6">当前位面内没有录入任何NPC。</div>';
        return;
    }
    window.gameState.npcs.forEach((n, idx) => {
        const card = document.createElement('div');
        card.className = "npc-card";
        const jcl = n.jcl || window.JUNCHENGLU_NPC_DEFAULTS;
        const npcLoc = window.getLocationById?.(jcl.location);
        card.innerHTML = `<div class="npc-avatar">${n.portrait ? `<img src="${n.portrait}">` : `<span>${n.name.charAt(0)}</span>`}</div><div class="npc-info"><div class="npc-name">${window.escapeHtml?.(n.name)}</div><div class="npc-relation">${window.escapeHtml?.(n.relation)} · ${npcLoc ? npcLoc.name : '行踪不明'}</div></div><button onclick="deleteNpc(${idx})" class="icon-btn"><i class="fas fa-trash-alt"></i></button>`;
        card.onclick = (e) => { if (e.target.tagName !== 'BUTTON' && typeof window.openNpcInteractiveDetails === 'function') window.openNpcInteractiveDetails(idx); };
        container.appendChild(card);
    });
}

// ==================== 背包使用记录 UI ====================
function renderInventoryLogUI() {
    const host = document.getElementById('inventory-log');
    if (!host) return;
    host.innerHTML = '';
    const list = window.gameState?.inventoryLog || [];
    if (!list.length) {
        host.innerHTML = `<div class="text-xs text-gray-400">暂无使用记录。</div>`;
        return;
    }
    const displayList = list.slice(0, 10);
    displayList.forEach((r, i) => {
        const item = document.createElement('div');
        item.className = "anime-card p-3 mb-2";
        item.innerHTML = `<div class="flex items-start justify-between"><div><div class="text-sm font-bold text-gray-800">${window.escapeHtml?.(r.title)}</div><div class="text-[11px] text-gray-500 mt-0.5">${r.time ? new Date(r.time).toLocaleString() : '时间未知'}</div><div class="text-xs text-gray-700 mt-2">${window.escapeHtml?.(r.detail)}</div></div><button class="bg-primary text-white text-xs px-3 py-1 rounded-full" data-replay="${i}">回放</button></div>`;
        host.appendChild(item);
    });
}

// ==================== 头像系统 ====================
const avatarBlobURLCache = new Map();

function getSafeAvatarURL(avatarData) {
    if (!avatarData) return null;
    if (typeof avatarData === 'string') {
        if (avatarData.startsWith('http') || avatarData.startsWith('blob:')) return avatarData;
        if (avatarData.startsWith('data:')) return avatarData;
    }
    return null;
}

function renderAvatarIntoHost(hostEl, payload, opts = {}) {
    if (!hostEl) return;
    const { name, gender, avatar } = payload;
    const ch = name ? name.charAt(0).toUpperCase() : '?';
    const bg = gender === '女' ? '#FCE7F3' : '#DBEAFE';
    const fg = gender === '女' ? '#9D174D' : '#1E3A8A';
    const safeURL = getSafeAvatarURL(avatar);
    if (safeURL) {
        hostEl.innerHTML = `<img src="${safeURL}" alt="${window.escapeHtml?.(name)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.onerror=null;this.parentElement.innerHTML='<div style=\"width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:${bg};border-radius:50%;font-size:${opts.fontSize || 28}px;font-weight:bold;color:${fg};\">${ch}</div>'">`;
    } else {
        hostEl.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:${bg};border-radius:50%;font-size:${opts.fontSize || 28}px;font-weight:bold;color:${fg};">${ch}</div>`;
    }
}

function replaceCharacterAvatarsInEntry(entryEl) {
    // 查找所有 img 标签并尝试替换头像
    const imgs = entryEl.querySelectorAll('img');
    imgs.forEach(img => {
        const alt = img.getAttribute('alt') || '';
        if (!alt) return;
        // 查找对应角色
        let character = null;
        if (alt === window.gameState?.player?.name) character = window.gameState.player;
        else character = window.gameState?.npcs?.find(n => n.name === alt);
        if (character) {
            const safeURL = getSafeAvatarURL(character.avatar);
            if (safeURL) img.src = safeURL;
        }
    });
}

// ==================== 论坛 UI ====================
let forumPosts = [];
let forumCurrentTab = 'hot';

function initForumData() {
    const saved = localStorage.getItem('AI_WENYOU_FORUM_V2');
    if (saved) {
        try { forumPosts = JSON.parse(saved); } catch(e) { forumPosts = []; }
    }
    if (!forumPosts.length) {
        forumPosts = [{ id: Date.now(), author: "系统", authorType: "system", content: "欢迎来到玩家社区！", time: Date.now(), likes: 0, comments: [] }];
        saveForumData();
    }
    renderForumPosts();
}

function saveForumData() {
    localStorage.setItem('AI_WENYOU_FORUM_V2', JSON.stringify(forumPosts));
}

function renderForumPosts() {
    const container = document.getElementById('forum-posts-container');
    if (!container) return;
    let filtered = [...forumPosts];
    if (forumCurrentTab === 'hot') filtered = filtered.filter(p => p.likes >= 2).sort((a,b) => b.likes - a.likes);
    else if (forumCurrentTab === 'latest') filtered.sort((a,b) => b.time - a.time);
    else if (forumCurrentTab === 'npc') filtered = filtered.filter(p => p.authorType === 'npc');
    filtered = filtered.slice(0, 30);
    container.innerHTML = filtered.map(post => `
        <div class="forum-post" onclick="openForumPostDetail(${post.id})">
            <div class="forum-post-header"><div class="forum-avatar"><i class="fas fa-user-circle"></i></div><div><div class="forum-author-name">${window.escapeHtml?.(post.author)}</div><div class="forum-time">${new Date(post.time).toLocaleString()}</div></div></div>
            <div class="forum-content">${window.escapeHtml?.(post.content)}</div>
            <div class="forum-stats"><span><i class="fas fa-heart"></i> ${post.likes}</span><span><i class="fas fa-comment"></i> ${post.comments?.length || 0}</span></div>
        </div>
    `).join('');
}

function forumRefresh() {
    initForumData();
    window.showToast?.("论坛已刷新");
}

function forumPublishPost() {
    const input = document.getElementById('forum-post-input');
    const content = input.value.trim();
    if (!content) return;
    const newPost = { id: Date.now(), author: window.gameState?.player?.name || "匿名", authorType: "player", content, time: Date.now(), likes: 0, comments: [] };
    forumPosts.unshift(newPost);
    saveForumData();
    renderForumPosts();
    input.value = '';
    window.showToast?.("发布成功");
}

function closeForumModal() {
    const modal = document.getElementById('modal-forum');
    if (modal) modal.classList.add('hidden');
}

function openForumPostDetail(postId) {
    // 简化版：alert 显示详情
    const post = forumPosts.find(p => p.id === postId);
    if (post) alert(`【${post.author}】\n${post.content}\n\n点赞:${post.likes} 评论:${post.comments?.length || 0}`);
}

// ==================== 世界书 UI ====================
function renderWorldBook() {
    if (!window.gameState?.gameState?.worldBookEntries) return;
    const list = document.getElementById('worldbook-entries-list');
    if (!list) return;
    list.innerHTML = '';
    window.gameState.gameState.worldBookEntries.forEach((entry, idx) => {
        const item = document.createElement('div');
        item.className = "border rounded-xl p-3 mb-2";
        item.innerHTML = `<div class="flex justify-between"><span class="text-xs font-bold">触发键: ${entry.keywords}</span><button onclick="removeWorldBookEntry(${idx})" class="text-red-500">&times;</button></div><p class="text-xs mt-1">${window.escapeHtml?.(entry.text)}</p>`;
        list.appendChild(item);
    });
}

function removeWorldBookEntry(idx) {
    if (window.gameState?.gameState?.worldBookEntries) {
        window.gameState.gameState.worldBookEntries.splice(idx, 1);
        renderWorldBook();
        if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
    }
}

function addNewWorldBookEntry() {
    const text = prompt("请输入世界书条目内容：");
    if (!text) return;
    if (!window.gameState.gameState.worldBookEntries) window.gameState.gameState.worldBookEntries = [];
    window.gameState.gameState.worldBookEntries.push({ keywords: "新条目", text: text, permanent: false, depth: 2 });
    renderWorldBook();
    if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
}

function updateWorldGlobalLore(val) {
    if (window.gameState?.gameState) {
        window.gameState.gameState.globalLore = val;
        if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
    }
}

async function aiPolishWorldLore() {
    const currentLore = document.getElementById('wb-global-lore')?.value;
    if (!currentLore) { window.showToast?.("请先填入世界观设定文本", false); return; }
    window.showToast?.("正在委托AI润色世界观...");
    try {
        const polished = await window.callLLMRequest?.(`请润色以下世界观：\n${currentLore}`, "你是世界设定润色师");
        if (polished && window.gameState.gameState) {
            window.gameState.gameState.globalLore = polished.trim();
            const loreEl = document.getElementById('wb-global-lore');
            if (loreEl) loreEl.value = polished.trim();
            if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
            window.showToast?.("世界观已润色并保存！");
        }
    } catch(e) { window.showToast?.("AI润色失败", false); }
}

async function runAILoreSummarize() {
    const termText = document.getElementById('story-terminal')?.innerText;
    if (!termText || termText.length < 50) { window.showToast?.("故事细节过于单薄，无法归纳。", false); return; }
    window.showToast?.("正在AI归纳历史...");
    try {
        const summary = await window.callLLMRequest?.(`请总结以下剧情：\n${termText.slice(-2000)}`, "你是编年史提炼大师");
        if (summary && window.gameState.gameState) {
            window.gameState.gameState.worldBookEntries.push({ keywords: "历史快照", text: summary.trim(), permanent: true, depth: 5 });
            renderWorldBook();
            if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
            window.showToast?.("历史记忆已浓缩注入世界书！");
        }
    } catch(e) { window.showToast?.("记忆归纳偏离。", false); }
}

function saveSummaryPrompt() {
    const prompt = document.getElementById('wb-summary-prompt')?.value;
    if (prompt) localStorage.setItem("AI_WENYOU_SUMMARY_PROMPT", prompt);
    window.showToast?.("深度记忆提取提示词已保存");
}

function toggleAutoWorldLog() {
    if (window.DB) {
        window.DB.autoWorldLogEnabled = document.getElementById('wb-auto-log-toggle')?.checked || false;
        const settingDiv = document.getElementById('wb-auto-log-setting');
        if (settingDiv) settingDiv.classList.toggle('hidden', !window.DB.autoWorldLogEnabled);
        localStorage.setItem("AI_WENYOU_AUTO_WORLD_LOG", JSON.stringify({ enabled: window.DB.autoWorldLogEnabled, trigger: window.DB.autoWorldLogTrigger }));
    }
}

// ==================== 提示词预设渲染 ====================
function renderPromptPresetList() {
    const container = document.getElementById('prompt-preset-list');
    if (!container) return;
    const presets = ['polishWorld', 'genNpcWorld', 'genNpcStory', 'continueStory', 'genInteractions', 'genFamilyTree', 'evolveWorld', 'generateRumor', 'characterSetting', 'chatFilter', 'globalPrompt'];
    container.innerHTML = '';
    presets.forEach(key => {
        const value = window.DB?.promptPresets?.[key] || '';
        const item = document.createElement('div');
        item.className = "border rounded-lg p-2 mb-2";
        item.innerHTML = `<div class="flex justify-between items-center"><span class="text-xs font-bold">${key}</span><button onclick="editPromptPreset('${key}')" class="btn-small">编辑</button><button onclick="resetPromptPreset('${key}')" class="btn-small">重置</button></div><textarea id="preset-${key}" rows="2" class="w-full text-xs mt-1 p-1 border rounded">${window.escapeHtml?.(value) || ''}</textarea><button onclick="savePromptPreset('${key}')" class="btn-small mt-1">保存</button>`;
        container.appendChild(item);
    });
}

function editPromptPreset(key) {
    const textarea = document.getElementById(`preset-${key}`);
    if (textarea) textarea.focus();
}

function resetPromptPreset(key) {
    const defaults = {
        polishWorld: "请对以下世界观设定进行润色...",
        genNpcWorld: "请基于当前世界观设定，创造一个全新NPC...",
        genNpcStory: "请根据当前剧情发展，创造一个与故事紧密相关的新NPC...",
        continueStory: "作为文字游戏推演机，请顺应当前局势续写剧情...",
        genInteractions: "请根据当前NPC的性格、背景和关系，生成5个具体的交互选项...",
        genFamilyTree: "请基于当前已知的NPC信息，生成一张家族关系网络...",
        evolveWorld: "请根据最近的剧情发展，描述当前场景发生了怎样的环境变化...",
        generateRumor: "请根据最近的重大事件，生成一条正在NPC间流传的传闻...",
        characterSetting: "请为以下NPC撰写一段详细的角色设定...",
        chatFilter: "【禁词过滤规则】你绝对不能输出以下任何词汇...",
        globalPrompt: "你是一个高自由度文字游戏的主控AI..."
    };
    if (window.DB?.promptPresets) window.DB.promptPresets[key] = defaults[key];
    const textarea = document.getElementById(`preset-${key}`);
    if (textarea) textarea.value = defaults[key];
    if (typeof window.savePromptPresetsToStorage === 'function') window.savePromptPresetsToStorage();
    window.showToast?.(`预设 "${key}" 已重置`);
}

function savePromptPreset(key) {
    const textarea = document.getElementById(`preset-${key}`);
    if (textarea && window.DB?.promptPresets) {
        window.DB.promptPresets[key] = textarea.value;
        if (typeof window.savePromptPresetsToStorage === 'function') window.savePromptPresetsToStorage();
        window.showToast?.(`预设 "${key}" 已保存`);
    }
}

// ==================== 挂载到全局 ====================
if (typeof window !== 'undefined') {
    window.addLog = addLog;
    window.renderGameLog = renderGameLog;
    window.bindAiHtmlChoices = bindAiHtmlChoices;
    window.buildAIStyledHTML = buildAIStyledHTML;
    window.updateChoices = updateChoices;
    window.updatePanelUI = updatePanelUI;
    window.updateNPCUI = updateNPCUI;
    window.renderNpcCards = renderNpcCards;
    window.renderInventoryLogUI = renderInventoryLogUI;
    window.renderWorldBook = renderWorldBook;
    window.updateWorldGlobalLore = updateWorldGlobalLore;
    window.aiPolishWorldLore = aiPolishWorldLore;
    window.runAILoreSummarize = runAILoreSummarize;
    window.saveSummaryPrompt = saveSummaryPrompt;
    window.toggleAutoWorldLog = toggleAutoWorldLog;
    window.renderPromptPresetList = renderPromptPresetList;
    window.editPromptPreset = editPromptPreset;
    window.resetPromptPreset = resetPromptPreset;
    window.savePromptPreset = savePromptPreset;
    window.initForumData = initForumData;
    window.forumRefresh = forumRefresh;
    window.forumPublishPost = forumPublishPost;
    window.closeForumModal = closeForumModal;
    window.openForumPostDetail = openForumPostDetail;
    window.getSafeAvatarURL = getSafeAvatarURL;
    window.renderAvatarIntoHost = renderAvatarIntoHost;
    window.replaceCharacterAvatarsInEntry = replaceCharacterAvatarsInEntry;
}
