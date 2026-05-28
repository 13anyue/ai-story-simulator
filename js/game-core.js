// js/game-core.js - 游戏核心逻辑（剧情生成、AI交互、NPC移动、世界书等）

// ==================== 剧情生成与处理 ====================

/**
 * 构建最终的系统提示词（包含核心指令、世界书、状态等）
 * @returns {string}
 */
function buildFinalSystem() {
    if (!window.gameState?.gameState) return "";
    const locationNames = window.gameState.gameState.locations.map(loc => loc.name).join('、');
    const currentTime = document.getElementById('gp-world-history-preview')?.innerText || "";
    const currentLocationName = window.gameState.gameState.currentLocationName;
    const weather = window.DB?.weather || "晴好";
    const festival = window.DB?.festival || "平日";
    const globalLore = window.gameState.gameState.globalLore;

    // 注入世界书记忆
    let injectedContext = "";
    const terminal = document.getElementById('story-terminal');
    const recentContext = terminal ? terminal.innerText.slice(-800) : "";
    const relevantEntries = getRelevantWorldBookEntries(recentContext, 4);
    if (relevantEntries.length) {
        injectedContext += "\n【📖 相关世界书记忆】\n";
        relevantEntries.forEach(entry => {
            injectedContext += `- 关键词「${Array.isArray(entry.keywords) ? entry.keywords.join("、") : entry.keywords}」: ${entry.text}\n`;
        });
    }
    // 常驻条目
    const permanentEntries = window.gameState.gameState.worldBookEntries?.filter(e => e.permanent === true || e.depth === 1) || [];
    if (permanentEntries.length) {
        injectedContext += "\n【⚙️ 世界铁律】\n" + permanentEntries.map(e => e.text).join("\n");
    }

    // 玩家和同场景NPC状态
    const p = window.gameState.gameState.player;
    if (p) {
        const pJcl = p.jcl || {};
        const pStatsStr = JSON.stringify(p.stats).replace(/[{}]/g, '');
        injectedContext += `\n【当前玩家状态】姓名:${p.name}, 性别:${pJcl.gender||'未知'}, 身份:${pJcl.title||'无'}, 状态属性:${pStatsStr}`;
        const npcsHere = window.gameState.gameState.npcs.filter(n => (n.jcl && n.jcl.location) === window.gameState.gameState.currentLocationId);
        if (npcsHere.length) {
            injectedContext += `\n【当前场景内的NPC】\n` + npcsHere.map(n => `- ${n.name} (关系:${n.relation}，好感度:${n.stats?.['好感']||0})`).join('\n');
        }
        if (window.DB?.rumors?.length) {
            injectedContext += `\n【传闻】${window.DB.rumors.slice(0,3).join('；')}`;
        }
    }
    injectedContext += `\n【可用地点】${locationNames}`;

    const inlineCompPrompt = window.DB?.inlineComponentPrompt || "";
    let template = localStorage.getItem("AI_WENYOU_CORE_PROMPT");
    if (!template || !template.trim()) {
        template = `# 文游主控 AI 核心指令集\n## 输出格式\n1. 对话：【NPC名：内容】\n2. 属性变化：[stat:属性名|±数值]\n3. 选项用||选项分组||包裹\n## 强制要求\n- 必须给出3-5个选项\n- 必须基于玩家导入的世界观`;
    }
    let final = template
        .replace(/\{\{locationNames\}\}/g, locationNames)
        .replace(/\{\{currentLocationName\}\}/g, currentLocationName)
        .replace(/\{\{currentTime\}\}/g, currentTime)
        .replace(/\{\{weather\}\}/g, weather)
        .replace(/\{\{festival\}\}/g, festival)
        .replace(/\{\{globalLore\}\}/g, globalLore)
        .replace(/\{\{injectedContext\}\}/g, injectedContext)
        .replace(/\{\{inlineCompPrompt\}\}/g, inlineCompPrompt);
    
    final = `【⚡ 强制天气】当前天气为「${weather}」。所有描写必须与此一致。\n` + final;
    final = (window.gameState.gameState.systemPrompt || "") + "\n\n" + final;
    return final;
}

/**
 * 生成剧情迭代（核心调用入口）
 * @param {string} actionContextPrompt - 用户输入或选项
 */
async function generateStoryIteration(actionContextPrompt) {
    if (!window.gameState?.gameState) return;
    if (window.DB?.storyPaused) {
        window.showToast?.("⏸ 故事已暂停，请先继续", false);
        return;
    }

    // 保存历史快照
    if (!window.gameState.gameState.storyHistory) window.gameState.gameState.storyHistory = [];
    if (window.gameState.gameState.storyHistory.length > 30) window.gameState.gameState.storyHistory.shift();
    const snapshot = {
        currentLocationName: window.gameState.gameState.currentLocationName,
        currentLocationId: window.gameState.gameState.currentLocationId,
        playerStats: JSON.parse(JSON.stringify(window.gameState.gameState.player.stats)),
        playerResumeLength: window.gameState.gameState.player.resumeLog.length,
        npcsState: JSON.parse(JSON.stringify(window.gameState.gameState.npcs)),
        terminalHTML: document.getElementById('story-terminal').innerHTML
    };
    window.gameState.gameState.storyHistory.push(snapshot);

    const finalSystem = buildFinalSystem();
    try {
        const userPromptWithParams = buildGenerationPrompt(actionContextPrompt);
        const rawResponse = await window.callLLMRequest?.(userPromptWithParams, finalSystem);
        if (!rawResponse) throw new Error("AI未返回内容");
        parseAndRenderStoryResponse(rawResponse);
        window.advanceWorldTime?.(8 + Math.floor(Math.random() * 20));
        await tryTriggerNpcAutoMove();
        if (window.DB?.storyRound % (window.DB?.summaryThreshold || 5) === 0) {
            await autoSummarizeToWorldBook();
        }
        await updateNpcBackgroundLife();
        autoFoldStoryHistory();
        if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
    } catch (err) {
        console.error(err);
        window.showToast?.("AI 响应失败，请检查网络或 API 配置", false);
    }
}

/**
 * 构建带参数的用户提示词（长度、卡片数量等）
 * @param {string} userInstruction
 * @returns {string}
 */
function buildGenerationPrompt(userInstruction) {
    const params = window.DB?.genParams || { storyLength: "medium", npcSpeechCount: 2, narrationCount: 2, cardCount: 1 };
    const lengthMap = { short: "600-1000字", medium: "1000-1500字", long: "1200-2500字" };
    const lengthHint = `剧情长度控制在${lengthMap[params.storyLength] || lengthMap.medium}`;
    const npcHint = `请恰好出现 ${params.npcSpeechCount} 个不同的NPC发言。`;
    const narraHint = `旁白段落数控制在 ${params.narrationCount} 段左右。`;
    const cardHint = params.cardCount > 0 ? `请生成 ${params.cardCount} 个HTML卡片（使用 <card title="标题">内容</card> 格式）。` : "不要生成HTML卡片。";
    const weatherHint = `【当前天气】${window.DB?.weather || "晴好"}，所有场景描写必须与此一致。`;
    return `${userInstruction}\n\n${weatherHint}\n\n${lengthHint} ${npcHint} ${narraHint} ${cardHint}\n输出格式：剧情自然描述，对话用【NPC名：内容】。选项用||选项分组||包裹。`;
}

/**
 * 解析 AI 响应并渲染到页面
 * @param {string} rawText
 */
function parseAndRenderStoryResponse(rawText) {
    rawText = window.decodeHtmlEntities?.(rawText) || rawText;
    let cleanedText = rawText.replace(/\|\|([^|]+?)\|\|/g, '');
    const parts = cleanedText.split("||选项分组||");
    let mainBody = parts[0] ? parts[0].trim() : "剧情正在蔓延...";
    let choicesPart = parts[1] ? parts[1].trim() : "";

    // 提取选项
    if (!choicesPart) {
        const matches = rawText.match(/\|\|([^|]+?)\|\|/g);
        if (matches) choicesPart = matches.map(m => m.slice(2, -2).trim()).join("\n");
    }

    const term = document.getElementById('story-terminal');
    if (!term) return;

    // 处理属性变化
    mainBody = mainBody.replace(/\[stat:([^\]]+)\|([+\-]?\d+)\]/g, (match, attr, val) => {
        let delta = parseInt(val);
        if (window.gameState.gameState.player.stats[attr] !== undefined) {
            window.gameState.gameState.player.stats[attr] = Math.max(0, Math.min(100, window.gameState.gameState.player.stats[attr] + delta));
            if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
        }
        return '';
    });

    // 处理物品获得
    mainBody = mainBody.replace(/\[item:([^\]]+)\|([^\]]+)\]/g, (match, itemName, desc) => {
        if (!window.gameState.gameState.player.backpack) window.gameState.gameState.player.backpack = [];
        window.gameState.gameState.player.backpack.push(itemName);
        return `<div class="my-1 text-xs text-green-600">📦 获得物品：${itemName}</div>`;
    });

    // 渲染对话气泡
    const renderedBlocks = renderDialogueBubbles(mainBody);
    const lineBlock = document.createElement('div');
    lineBlock.className = "border-b pb-3 space-y-2";
    lineBlock.innerHTML = `<div class="text-[11px] uppercase font-black">剧情记录:</div>`;
    lineBlock.appendChild(renderedBlocks);
    term.appendChild(lineBlock);
    term.scrollTop = term.scrollHeight;

    // 更新回合计数
    const hasDialogue = /【.+？：.+？】/.test(rawText);
    if (hasDialogue) {
        window.DB.storyRound = (window.DB.storyRound || 0) + 1;
        const roundSpan = document.getElementById('story-round-counter');
        if (roundSpan) roundSpan.innerText = window.DB.storyRound;
    }

    // 选项渲染
    const choicesBox = document.getElementById('story-choices-box');
    if (choicesBox) {
        choicesBox.innerHTML = '';
        let optionItems = [];
        if (choicesPart) {
            optionItems = choicesPart.split('\n').filter(l => l.trim());
        }
        if (optionItems.length === 0) {
            const altMatches = rawText.match(/\|\|([^|]+(?:\|[^|]+)*)\|\|/g);
            if (altMatches) {
                const inner = altMatches[0].slice(2, -2);
                optionItems = inner.split('|').map(opt => opt.trim());
            }
        }
        optionItems.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = "w-full text-left border p-2.5 rounded-xl text-xs mb-1";
            btn.innerText = choice;
            btn.onclick = () => selectStoryChoice(choice);
            choicesBox.appendChild(btn);
        });
    }
}

/**
 * 渲染对话气泡和旁白
 * @param {string} text
 * @returns {HTMLElement}
 */
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

/**
 * 玩家选择选项
 * @param {string} choiceText
 */
function selectStoryChoice(choiceText) {
    if (window.DB?.storyPaused) { window.showToast?.("⏸ 故事已暂停", false); return; }
    const term = document.getElementById('story-terminal');
    const el = document.createElement('div');
    el.className = "text-right py-1";
    el.innerHTML = `<span class="text-xs px-3 py-1 rounded-full font-bold inline-block" style="background:var(--bubble-self-bg);color:var(--bubble-self-color);">行动：${choiceText}</span>`;
    term.appendChild(el);
    term.scrollTop = term.scrollHeight;
    window.advanceWorldTime?.(12 + Math.floor(Math.random()*30));
    generateStoryIteration(`【玩家抉择】：${choiceText}\n请推演后续剧情。使用【NPC名：对话】格式。`);
}

/**
 * 自由行动提交
 */
function submitCustomAction() {
    const input = document.getElementById('story-custom-input');
    const txt = input.value.trim();
    if (txt === '' || txt === '/pause') {
        if (window.DB) window.DB.storyPaused = !window.DB.storyPaused;
        window.showToast?.(window.DB?.storyPaused ? "⏸ 故事已暂停" : "▶️ 故事已继续");
        input.value = '';
        return;
    }
    if (window.DB?.storyPaused) { window.showToast?.("⏸ 故事已暂停", false); input.value = ''; return; }
    input.value = '';
    const term = document.getElementById('story-terminal');
    const el = document.createElement('div');
    el.className = "text-right py-1";
    el.innerHTML = `<span class="text-xs px-3 py-1 rounded-full font-black" style="background:var(--accent);color:#000;">自由行动：${txt}</span>`;
    term.appendChild(el);
    term.scrollTop = term.scrollHeight;
    window.advanceWorldTime?.(8 + Math.floor(Math.random() * 25));
    generateStoryIteration(`【玩家全自定义行动】：${txt}\n请推演后续。使用【NPC名：对话】格式。`);
}

async function submitAiHelpWrite() {
    if (window.DB?.storyPaused) { window.showToast?.("⏸ 故事已暂停", false); return; }
    const userPrompt = localStorage.getItem("AI_WENYOU_HELP_PROMPT");
    if (!userPrompt) { window.showToast?.("请先前往「设置」填写 AI 帮写提示词", false); return; }
    await generateStoryIteration(`【AI帮写指令】：${userPrompt}\n请严格按照当前游戏设定执行。`);
}

function triggerContinueStory() {
    if (window.DB?.storyPaused) { window.showToast?.("⏸ 故事已暂停", false); return; }
    window.showToast?.("正在请求AI续写...");
    window.advanceWorldTime?.(6 + Math.floor(Math.random()*15));
    generateStoryIteration(`【指令：续写】请无条件顺承当前局势进行深度扩展。使用【NPC名：对话】格式。`);
}

function triggerRewriteCurrent() {
    if (window.DB?.storyPaused) { window.showToast?.("⏸ 故事已暂停", false); return; }
    const term = document.getElementById('story-terminal');
    if (!term.lastChild) { window.showToast?.("无内容可重写！", false); return; }
    term.removeChild(term.lastChild);
    generateStoryIteration(`【重写指令】请重写刚才那阶段的剧情。使用【NPC名：对话】格式。`);
}

function triggerHistoryRollback() {
    if (!window.gameState?.gameState?.storyHistory?.length) { window.showToast?.("时间轴已归零！", false); return; }
    const prev = window.gameState.gameState.storyHistory.pop();
    window.gameState.gameState.currentLocationName = prev.currentLocationName;
    window.gameState.gameState.currentLocationId = prev.currentLocationId;
    window.gameState.gameState.player.stats = prev.playerStats;
    window.gameState.gameState.npcs = prev.npcsState;
    if (window.gameState.gameState.player.resumeLog.length > prev.playerResumeLength) {
        window.gameState.gameState.player.resumeLog = window.gameState.gameState.player.resumeLog.slice(0, prev.playerResumeLength);
    }
    document.getElementById('story-terminal').innerHTML = prev.terminalHTML;
    if (typeof window.updateGameplayHeaderLocation === 'function') window.updateGameplayHeaderLocation();
    if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
    window.showToast?.("【时光逆流】回溯成功！");
}

// ==================== NPC 自动移动 ====================
let isMoving = false;

async function tryTriggerNpcAutoMove() {
    if (!window.DB?.npcAutoMove || !window.gameState?.gameState) return;
    if (!window.DB.npcMoveCounter) window.DB.npcMoveCounter = 0;
    window.DB.npcMoveCounter++;
    if (window.DB.npcMoveCounter >= (window.DB.npcMoveInterval || 3)) {
        window.DB.npcMoveCounter = 0;
        await aiMoveNpcs();
    }
}

async function aiMoveNpcs() {
    if (isMoving) return;
    isMoving = true;
    try {
        const npcs = window.gameState.gameState.npcs;
        const locations = window.gameState.gameState.locations;
        if (!npcs.length || locations.length < 2) return;
        const maxMoves = window.DB.npcMoveMaxCount || 2;
        const shuffled = [...npcs];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const candidates = shuffled.slice(0, maxMoves);
        let movedNpcs = [];
        for (let npc of candidates) {
            const oldLocId = npc.jcl?.location;
            const newLoc = locations.find(l => l.id !== oldLocId);
            if (newLoc) {
                npc.jcl.location = newLoc.id;
                movedNpcs.push({ name: npc.name, from: getLocationById(oldLocId)?.name || '未知', to: newLoc.name });
            }
        }
        if (movedNpcs.length) {
            const term = document.getElementById('story-terminal');
            const div = document.createElement('div');
            div.className = 'narration-block text-center text-xs italic';
            div.innerText = `【世界动态】\n` + movedNpcs.map(m => `• ${m.name} 从「${m.from}」前往「${m.to}」`).join('\n');
            term?.appendChild(div);
            if (typeof window.renderYiCiYuanMap === 'function') window.renderYiCiYuanMap();
            if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
        }
    } catch(e) { console.error("AI移动NPC出错", e); }
    finally { isMoving = false; }
}

// ==================== 世界书自动总结 ====================
async function autoSummarizeToWorldBook() {
    const terminal = document.getElementById('story-terminal');
    const recentText = terminal ? terminal.innerText.slice(-2000) : '';
    if (recentText.length < 200) return;
    window.showToast?.("正在提炼剧情关键节点，存入世界书...");
    const playerName = window.gameState.gameState.player.name || "主角";
    const prompt = `你是一位事件总结助手。请总结以下剧情：\n${recentText}\n输出一段100字内的摘要。`;
    try {
        const summary = await window.callLLMRequest?.(prompt, "你是客观的事件总结助手。");
        if (summary && summary.trim().length > 20) {
            if (!window.gameState.gameState.worldBookEntries) window.gameState.gameState.worldBookEntries = [];
            window.gameState.gameState.worldBookEntries.push({
                keywords: `自动总结_第${window.DB?.storyRound || 0}轮`,
                text: `【剧情摘要】${summary.trim()}`,
                permanent: false,
                depth: 4
            });
            if (window.gameState.gameState.worldBookEntries.length > 60) window.gameState.gameState.worldBookEntries = window.gameState.gameState.worldBookEntries.slice(-50);
            if (typeof window.renderWorldBook === 'function') window.renderWorldBook();
            if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
            window.showToast?.("已将关键剧情摘要存入世界书");
        }
    } catch(e) { console.warn("自动总结失败", e); }
}

function autoFoldStoryHistory() {
    const term = document.getElementById('story-terminal');
    if (!term) return;
    const currentNodes = Array.from(term.children).filter(node => !node.classList.contains('folded-history-container'));
    const maxVisible = window.DB?.historyFoldThreshold || 20;
    if (currentNodes.length > maxVisible) {
        const nodesToFold = currentNodes.slice(0, maxVisible - 5);
        const foldContainer = document.createElement('div');
        foldContainer.className = 'folded-history-container border rounded-xl my-2';
        const foldHeader = document.createElement('div');
        foldHeader.className = 'p-2 text-center text-xs cursor-pointer bg-gray-100';
        foldHeader.innerHTML = '<i class="fas fa-box-archive"></i> 展开历史记录 <i class="fas fa-chevron-down"></i>';
        const foldContent = document.createElement('div');
        foldContent.className = 'hidden p-2 space-y-2';
        nodesToFold.forEach(node => foldContent.appendChild(node));
        foldHeader.onclick = () => foldContent.classList.toggle('hidden');
        foldContainer.appendChild(foldHeader);
        foldContainer.appendChild(foldContent);
        term.insertBefore(foldContainer, currentNodes[maxVisible - 5]);
    }
}

// ==================== NPC 后台生活事件 ====================
async function updateNpcBackgroundLife() {
    if (!window.gameState?.gameState?.npcs) return;
    if (Math.random() > 0.3) return;
    const npcs = window.gameState.gameState.npcs;
    const count = Math.min(2, npcs.length);
    const shuffled = [...npcs];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const selected = shuffled.slice(0, count);
    const events = ["散步", "喝茶", "读书", "练习武艺", "与陌生人交谈", "购买物品"];
    for (let npc of selected) {
        const action = events[Math.floor(Math.random() * events.length)];
        if (!npc.jcl.lifeLogs) npc.jcl.lifeLogs = [];
        npc.jcl.lifeLogs.push({ time: new Date().toLocaleTimeString(), event: `${npc.name} ${action}` });
        if (npc.jcl.lifeLogs.length > 30) npc.jcl.lifeLogs.shift();
    }
}

// ==================== 世界书检索 ====================
function getRelevantWorldBookEntries(contextText, maxCount = 4) {
    const entries = window.gameState?.gameState?.worldBookEntries || [];
    if (!entries.length) return [];
    const context = (contextText || "").toLowerCase();
    const scored = entries.map(entry => {
        let score = 0;
        const kwList = Array.isArray(entry.keywords) ? entry.keywords : (entry.keywords ? entry.keywords.split(/[,，、]/) : []);
        kwList.forEach(kw => {
            if (context.includes(kw.toLowerCase())) score += 12;
        });
        score += (entry.weight || 3) * 3;
        if (entry.depth === 1) score += 30;
        else if (entry.depth === 2) score += 15;
        return { entry, score };
    });
    return scored.filter(s => s.score > 5).sort((a,b) => b.score - a.score).slice(0, maxCount).map(s => s.entry);
}

// ==================== 传闻系统 ====================
async function generateRumor(actionDesc) {
    const terminal = document.getElementById('story-terminal');
    let recentStory = terminal ? terminal.innerText.slice(-300) : actionDesc;
    if (!recentStory) return;
    try {
        const rumor = await window.callLLMRequest?.(`根据以下剧情生成一条传闻(30字内):\n${recentStory}`, "你是传闻生成器");
        if (rumor && rumor.trim()) {
            if (!window.DB.rumors) window.DB.rumors = [];
            window.DB.rumors.unshift(rumor.trim());
            if (window.DB.rumors.length > 10) window.DB.rumors.pop();
            updateRumorPanel();
            if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
        }
    } catch(e) {}
}

function updateRumorPanel() {
    const panel = document.getElementById('rumor-panel');
    const text = document.getElementById('rumor-text');
    if (panel && text) {
        if (window.DB?.rumors?.length) {
            text.innerText = window.DB.rumors[0];
            panel.classList.remove('hidden');
        } else {
            panel.classList.add('hidden');
        }
    }
}

function toggleRumorPanel() {
    const panel = document.getElementById('rumor-panel');
    if (panel) panel.classList.toggle('hidden');
}

// ==================== 挂载到全局 ====================
if (typeof window !== 'undefined') {
    window.buildFinalSystem = buildFinalSystem;
    window.generateStoryIteration = generateStoryIteration;
    window.buildGenerationPrompt = buildGenerationPrompt;
    window.parseAndRenderStoryResponse = parseAndRenderStoryResponse;
    window.renderDialogueBubbles = renderDialogueBubbles;
    window.selectStoryChoice = selectStoryChoice;
    window.submitCustomAction = submitCustomAction;
    window.submitAiHelpWrite = submitAiHelpWrite;
    window.triggerContinueStory = triggerContinueStory;
    window.triggerRewriteCurrent = triggerRewriteCurrent;
    window.triggerHistoryRollback = triggerHistoryRollback;
    window.tryTriggerNpcAutoMove = tryTriggerNpcAutoMove;
    window.aiMoveNpcs = aiMoveNpcs;
    window.autoSummarizeToWorldBook = autoSummarizeToWorldBook;
    window.autoFoldStoryHistory = autoFoldStoryHistory;
    window.updateNpcBackgroundLife = updateNpcBackgroundLife;
    window.getRelevantWorldBookEntries = getRelevantWorldBookEntries;
    window.generateRumor = generateRumor;
    window.updateRumorPanel = updateRumorPanel;
    window.toggleRumorPanel = toggleRumorPanel;
}
