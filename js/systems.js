// js/systems.js - 核心系统与辅助函数

// 全局辅助函数
function switchScreen(screenId) {
    closeAllModals();
    document.querySelectorAll('.screen-view').forEach(s => { s.classList.add('hidden'); s.style.display = 'none'; });
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.remove('hidden');
        target.style.display = screenId === 'screen-gameplay' ? 'flex' : 'block';
    }
    const navBar = document.getElementById('bottom-nav-bar');
    if (screenId === 'screen-gameplay') {
        if (navBar) navBar.style.display = 'flex';
        document.getElementById('game-top-bar').style.display = '';
        applyBubbleStyles();
    } else {
        if (navBar) navBar.style.display = 'none';
        document.getElementById('game-top-bar').style.display = 'none';
        document.querySelectorAll('.subview-panel').forEach(p => p.classList.add('hidden'));
    }
    if (screenId === 'screen-lobby') {
        renderLobbyWorlds();
        renderLobbySaves();
        checkAutoSavedGame();
    }
}

function switchSubview(subviewId) {
    document.querySelectorAll('.subview-panel').forEach(el => el.classList.add('hidden'));
    document.getElementById(subviewId).classList.remove('hidden');
    const navs = ['story', 'map', 'stats', 'npc', 'worldbook', 'forum', 'settings'];
    navs.forEach(n => {
        const btn = document.getElementById(`nav-subview-${n}`);
        if (btn) {
            if (`subview-${n}` === subviewId) {
                btn.classList.add('active');
                btn.querySelector('span').classList.add('font-bold');
            } else {
                btn.classList.remove('active');
                btn.querySelector('span')?.classList.remove('font-bold');
            }
        }
    });
    if (subviewId === 'subview-map') renderYiCiYuanMap();
    if (subviewId === 'subview-stats') { renderPlayerStatsAndResume(); refreshDeletedNpcPanel(); }
    if (subviewId === 'subview-npc') renderNpcCards();
    if (subviewId === 'subview-worldbook') renderWorldBook();
    if (subviewId === 'subview-forum') { if (typeof initForumData === 'function') initForumData(); }
    if (subviewId === 'subview-settings') {
        document.getElementById('set-system-prompt').value = DB.gameState ? DB.gameState.systemPrompt : '';
        document.getElementById('diy-inline-component-prompt').value = DB.inlineComponentPrompt;
        document.getElementById('ai-help-prompt-setting').value = localStorage.getItem("AI_WENYOU_HELP_PROMPT") || "";
        document.getElementById('global-npc-logic-prompt').value = DB.globalNpcLogicPrompt;
        document.getElementById('diy-bubble-self-bg').value = DB.bubbleStyles.selfBg;
        document.getElementById('diy-bubble-self-color').value = DB.bubbleStyles.selfColor;
        document.getElementById('diy-bubble-npc-bg').value = DB.bubbleStyles.npcBg;
        document.getElementById('diy-bubble-npc-color').value = DB.bubbleStyles.npcColor;
        document.getElementById('diy-weather').value = DB.weather;
        document.getElementById('diy-festival').value = DB.festivalCustom ? "自定义节日" : (["平日","春节","中秋","七夕","冬至","万圣节","圣诞节"].includes(DB.festival) ? DB.festival : "平日");
        document.getElementById('diy-festival-custom').value = DB.festivalCustom;
        renderPromptPresetList();
        loadUserCorePrompt();
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.style.display = 'none';
        modal.classList.add('hidden');
    });
}

function toggleDayNight() {
    DB.isNightMode = !DB.isNightMode;
    localStorage.setItem("AI_WENYOU_NIGHTMODE", DB.isNightMode);
    if (DB.isNightMode) {
        document.documentElement.classList.add('theme-night');
        document.body.classList.add('theme-night');
    } else {
        document.documentElement.classList.remove('theme-night');
        document.body.classList.remove('theme-night');
        const userBg = document.getElementById('diy-color-bg')?.value || '#fafafa';
        const userText = document.getElementById('diy-color-text')?.value || '#18181b';
        document.getElementById('app-root').style.color = userText;
    }
    showToast(DB.isNightMode ? '🌙 夜间模式' : '☀️ 日间模式');
    updateLobbyDayNightIcon();
}

function updateWorldTimeDisplay() {
    const wt = DB.worldTime;
    const timeStr = `第${wt.year}年 ${wt.season} ${wt.month}月${wt.day}日 ${wt.period} ${String(wt.hour).padStart(2,'0')}:${String(wt.minute).padStart(2,'0')}`;
    const el = document.getElementById('gp-world-history-preview');
    if (el) el.innerText = timeStr;
}

function updateWeatherDisplay() {
    const sel = document.getElementById('diy-weather');
    if (sel) DB.weather = sel.value;
    const icons = { "晴好": "☀️", "多云": "⛅", "阴天": "☁️", "小雨": "🌧️", "暴雨": "⛈️", "大雪": "❄️", "雾霾": "🌫️", "沙尘": "💨" };
    const chip = document.getElementById('topbar-weather-chip');
    if (chip) chip.innerHTML = `${icons[DB.weather] || "🌤️"} ${DB.weather}`;
    autoSaveGameState();
}

function updateFestivalDisplay() {
    const sel = document.getElementById('diy-festival');
    const customInput = document.getElementById('diy-festival-custom');
    if (sel) {
        if (sel.value === "自定义节日" && customInput && customInput.value.trim()) { DB.festival = customInput.value.trim(); DB.festivalCustom = customInput.value.trim(); }
        else if (sel.value !== "自定义节日") { DB.festival = sel.value; DB.festivalCustom = ""; }
    }
    const fIcons = { "平日": "📅", "春节": "🧧", "中秋": "🌕", "七夕": "💫", "冬至": "❄️", "万圣节": "🎃", "圣诞节": "🎄" };
    const chip = document.getElementById('topbar-festival-chip');
    if (chip) chip.innerHTML = `${fIcons[DB.festival] || "✨"} ${DB.festival}`;
    autoSaveGameState();
}

function applyBubbleStyles() {
    const root = document.documentElement;
    root.style.setProperty('--bubble-self-bg', DB.bubbleStyles.selfBg);
    root.style.setProperty('--bubble-self-color', DB.bubbleStyles.selfColor);
    root.style.setProperty('--bubble-npc-bg', DB.bubbleStyles.npcBg);
    root.style.setProperty('--bubble-npc-color', DB.bubbleStyles.npcColor);
}

function setFontScale(val, silent = false) {
    DB.fontSize = Math.max(0.7, Math.min(1.5, val));
    document.documentElement.style.setProperty('--font-scale', DB.fontSize);
    document.getElementById('font-scale-display').innerText = DB.fontSize.toFixed(2);
    localStorage.setItem("AI_WENYOU_FONT_SIZE", DB.fontSize);
    if (!silent) showToast(`字体缩放已调整为 ${DB.fontSize.toFixed(2)}x`);
}

function updateFoldThreshold(val) {
    DB.historyFoldThreshold = parseInt(val);
    document.getElementById('fold-threshold-display').innerText = val;
    localStorage.setItem("AI_WENYOU_FOLD_THRESHOLD", val);
}

function toggleChoicesCollapse() {
    const box = document.getElementById('story-choices-box');
    if (box) {
        box.classList.toggle('collapsed');
        box.classList.toggle('expanded');
    }
}

function setDifficulty(level) {
    DB.difficulty = level;
    localStorage.setItem("AI_WENYOU_DIFFICULTY", level);
    let favorRate = 1.0, statRate = 1.0;
    if (level === 'easy') { favorRate = 1.5; statRate = 1.3; }
    else if (level === 'hard') { favorRate = 0.6; statRate = 0.7; }
    const favorSpan = document.getElementById('favor-multiplier');
    const statSpan = document.getElementById('stat-multiplier');
    const descDiv = document.getElementById('difficulty-desc');
    if (favorSpan) favorSpan.innerText = favorRate.toFixed(2);
    if (statSpan) statSpan.innerText = statRate.toFixed(2);
    if (descDiv) descDiv.innerHTML = level === 'easy' ? '简单：好感/属性增长更快' : (level === 'hard' ? '困难：好感/属性增长缓慢' : '普通：标准增长');
}

function saveGenerationParams() {
    DB.genParams = {
        storyLength: document.getElementById('story-length').value,
        npcSpeechCount: parseInt(document.getElementById('npc-speech-count').value) || 1,
        narrationCount: parseInt(document.getElementById('narration-count').value) || 1,
        cardCount: parseInt(document.getElementById('card-count').value) || 0
    };
    localStorage.setItem("AI_WENYOU_GEN_PARAMS", JSON.stringify(DB.genParams));
    showToast("剧情生成参数已保存");
}

function saveSystemPrompt() {
    const prompt = document.getElementById('set-system-prompt').value;
    if (DB.gameState) { DB.gameState.systemPrompt = prompt; autoSaveGameState(); }
    showToast("系统提示词已保存");
}

function resetSystemPromptToDefault() {
    if (!DB.gameState) return;
    const world = DB.worlds.find(w => w.id === DB.gameState.worldId);
    if (world && world.systemPrompt) {
        DB.gameState.systemPrompt = world.systemPrompt;
        document.getElementById('set-system-prompt').value = world.systemPrompt;
    } else {
        DB.gameState.systemPrompt = "你是高自由度文字游戏推演主脑。对白使用【NPC名：对话】格式。每次给出3个高自由度选项。";
        document.getElementById('set-system-prompt').value = DB.gameState.systemPrompt;
    }
    autoSaveGameState();
}

function applyStyleTemplate(styleKey) {
    const templates = {
        ancient: "你是高自由度古代皇朝文字养成推演叙事机。文字优雅古风。对白使用【NPC名：话语】格式。",
        cyber: "你是不夜城底层边缘行者推进器。文字冷硬、霓虹错乱、科技感十足。对白使用【NPC名：话语】格式。",
        fantasy: "你是西方魔幻史诗命运编织之神。文笔雄浑厚重。对白使用【NPC名：话语】格式",
        dark: "你是克苏鲁黑暗调查员风格引路人。文字扭曲、绝望、不可名状。对白使用【NPC名：话语】格式。",
        campus: "你是校园青春物语的温柔叙述者。文字清新明亮、充满少年感。对白使用【NPC名：话语】格式。",
        xiuxian: "你是修仙世界的天道意志。文字飘逸出尘、意境深远。对白使用【NPC名：话语】格式。"
    };
    const newPrompt = templates[styleKey] || templates.ancient;
    document.getElementById('set-system-prompt').value = newPrompt;
    if (DB.gameState) DB.gameState.systemPrompt = newPrompt;
    showToast(`已装配「${styleKey}」文风流派提示词！`);
    autoSaveGameState();
}

function saveInlineComponentPromptOnly() {
    const raw = document.getElementById('diy-inline-component-prompt').value.trim();
    DB.inlineComponentPrompt = raw;
    localStorage.setItem("AI_WENYOU_INLINE_PROMPT", raw);
    showToast("内联组件提示词已保存");
}

async function saveInlineComponentPromptAndPolish() {
    const rawPrompt = document.getElementById('diy-inline-component-prompt').value.trim();
    DB.inlineComponentPrompt = rawPrompt;
    localStorage.setItem("AI_WENYOU_INLINE_PROMPT", DB.inlineComponentPrompt);
    if (rawPrompt && DB.apiConfig.key) {
        showToast("正在委托AI润色并吸收提示词...");
        try {
            const polished = await callLLMRequest(`请对以下用于文字游戏的内联组件提示词进行润色优化...\n原始提示词：${rawPrompt}`, "你是提示词优化专家。");
            DB.inlineComponentPrompt = polished.trim();
            document.getElementById('diy-inline-component-prompt').value = DB.inlineComponentPrompt;
            localStorage.setItem("AI_WENYOU_INLINE_PROMPT", DB.inlineComponentPrompt);
            showToast("AI已润色并保存！");
        } catch(err) { showToast("润色失败，已保存原版。", false); }
    } else { showToast("未配置API密钥，仅保存原版。"); }
}

function setRawPromptMode() {
    const input = document.getElementById('story-custom-input');
    input.value = "[指令：请直接输出结果，无需任何润色、修饰或额外的文学加工。]\n" + input.value;
    showToast("已设为：不润色模式");
}

function saveGlobalNpcLogicPrompt() {
    const val = document.getElementById('global-npc-logic-prompt').value.trim();
    if (val) DB.globalNpcLogicPrompt = val;
    localStorage.setItem("AI_WENYOU_GLOBAL_NPC_LOGIC", DB.globalNpcLogicPrompt);
    showToast("全局NPC逻辑提示词已保存");
}

function saveAiHelpPrompt() {
    const promptValue = document.getElementById('ai-help-prompt-setting').value.trim();
    if (!promptValue) { showToast("提示词不能为空", false); return; }
    localStorage.setItem("AI_WENYOU_HELP_PROMPT", promptValue);
    showToast("AI帮写提示词已保存！");
}

function loadUserCorePrompt() {
    const saved = localStorage.getItem("AI_WENYOU_CORE_PROMPT");
    if (saved && saved.trim()) document.getElementById('user-core-prompt').value = saved;
    else document.getElementById('user-core-prompt').value = "你是一个高自由度文字游戏的主控AI...";
}

function saveUserCorePrompt() {
    const val = document.getElementById('user-core-prompt').value.trim();
    if (val) localStorage.setItem("AI_WENYOU_CORE_PROMPT", val);
    showToast("核心指令已保存");
}

function resetUserCorePrompt() {
    const defaultPrompt = "你是一个高自由度文字游戏的主控AI，负责驱动整个世界的运转。请始终遵循以下全局规则：1. 保持世界观一致性；2. NPC行为符合自身设定；3. 剧情发展有因果逻辑。";
    document.getElementById('user-core-prompt').value = defaultPrompt;
    localStorage.removeItem("AI_WENYOU_CORE_PROMPT");
    showToast("已恢复默认核心指令");
}
