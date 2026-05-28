// js/extras.js - 简化版（移除头像库依赖，使用首字母头像）
(function() {
    // ==================== NPC 完整交互模态框 ====================
    window.openNpcInteractiveDetails = function(idx) {
        const npc = window.gameState?.npcs?.[idx];
        if (!npc) return;
        window.DB.activeNpcIntIdx = idx;
        const modalHtml = `
            <div id="modal-npc-interactive" class="modal-overlay" style="display:flex;">
                <div class="modal-card" style="max-width:420px;">
                    <div class="h-36 relative flex items-end px-4 py-3 bg-cover bg-center" style="background-color:var(--bg-tertiary);">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent pointer-events-none"></div>
                        <div class="flex gap-3 items-center z-10">
                            <div id="npc-int-avatar-frame" class="w-14 h-14 rounded-xl overflow-hidden border flex-shrink-0" style="background:var(--bg-tertiary);border-color:var(--border-color);cursor:pointer;" onclick="document.getElementById('npc-avatar-quick-upload').click()">
                                <img id="npc-int-avatar" class="w-full h-full object-cover hidden"><div id="npc-int-avatar-placeholder" class="w-full h-full flex items-center justify-center text-2xl font-bold">${npc.name.charAt(0)}</div>
                            </div>
                            <div class="min-w-0"><h4 id="npc-int-name" class="text-base font-black text-white truncate">${escapeHtml(npc.name)}</h4><p id="npc-int-relation" class="text-[10px] border px-1.5 py-0.5 rounded w-max truncate mt-0.5">${escapeHtml(npc.relation)}</p></div>
                        </div>
                        <input type="file" id="npc-avatar-quick-upload" class="hidden" accept="image/*" onchange="handleNPCQuickAvatarUpload(this, window.DB.activeNpcIntIdx)">
                    </div>
                    <div class="p-4 overflow-y-auto max-h-[60vh] space-y-4 text-xs">
                        <div class="border rounded-xl p-3 space-y-2"><span class="text-[10px] font-bold uppercase block">人物全览</span><div id="npc-int-jcl-info" class="grid grid-cols-2 gap-x-3 gap-y-1.5"></div></div>
                        <div class="border rounded-xl p-3 space-y-2"><div class="flex justify-between"><span class="font-bold text-[10px] uppercase">履历日志</span><button onclick="autoGenerateNpcLifeLog()" class="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded">AI生成</button><button onclick="addNpcResumeLog()" class="text-[10px] hover:underline">录入</button></div><div id="npc-int-resume-log" class="max-h-24 overflow-y-auto space-y-1 text-[11px]"></div></div>
                        <div class="grid grid-cols-2 gap-2" id="npc-int-stats-grid"></div>
                        <div id="npc-int-custom-stats-grid" class="grid grid-cols-2 gap-2"></div>
                        <div class="border rounded-xl p-3 space-y-2"><span class="font-bold text-[10px] uppercase">🔒 私人状态</span><div id="npc-int-private-info" class="grid grid-cols-2 gap-2"><span>处男/处女: <span id="npc-int-virginity">—</span></span><span>性取向: <span id="npc-int-orientation">—</span></span></div></div>
                        <div class="border rounded-xl p-3 space-y-2"><span class="font-bold text-[10px] uppercase">🔍 隐藏信息</span><div><p><span class="secret-likes-tag">秘密</span> <span id="npc-int-secret">尚未发现</span></p><p><span class="secret-likes-tag">喜好</span> <span id="npc-int-likes">未知</span></p></div><button onclick="attemptUnlockSecret()" class="w-full border text-[10px] py-1 rounded">尝试解锁秘密</button></div>
                        <div class="border rounded-xl p-3 space-y-2"><div class="flex justify-between"><span class="font-bold text-[10px] uppercase">背包系统</span></div><button onclick="openNPCBackpackModal(window.DB.activeNpcIntIdx)" class="w-full border text-xs py-2.5 rounded-xl font-bold flex items-center justify-center gap-2">打开背包查看物品详情</button></div>
                        <div class="border rounded-xl p-3 space-y-2"><div class="flex justify-between"><span class="font-bold text-[10px] uppercase">交互标签</span><button onclick="aiGenerateInteractions()" class="text-[10px] border px-2 py-0.5 rounded">AI生成交互</button></div><div id="npc-interaction-tags" class="flex flex-wrap gap-2"></div><div class="flex gap-2 mt-2"><input type="text" id="new-interaction-input" class="flex-1 border rounded px-2 py-1 text-xs" placeholder="自定义交互动作..."><button onclick="addCustomInteraction()" class="border text-xs px-2 py-1 rounded">添加</button></div></div>
                        <div class="border rounded-xl p-3 space-y-2"><div class="flex justify-between"><span class="font-bold text-[10px] uppercase">关系圈</span></div><button onclick="openNpcRelationsModal(window.DB.activeNpcIntIdx)" class="w-full border text-xs py-2.5 rounded-xl font-bold flex items-center justify-center gap-2">查看关系圈</button></div>
                        <div class="border rounded-xl p-3 space-y-2"><div class="flex justify-between"><span class="font-bold text-[10px] uppercase">私聊视界</span></div><button onclick="openNpcWechatChatModal(window.DB.activeNpcIntIdx)" class="w-full border text-xs py-2.5 rounded-xl font-bold flex items-center justify-center gap-2">进入微信式私聊面板</button></div>
                        <div class="space-y-1.5"><span class="block font-bold text-[10px] uppercase">快速对话（AI即时反应）</span><div id="npc-int-chat-terminal" class="border rounded-xl p-3 max-h-24 overflow-y-auto space-y-2 text-[11px]"></div></div>
                    </div>
                    <div class="p-3 border-t space-y-2"><div class="flex items-center gap-1.5 rounded-xl p-1 border"><input type="text" id="npc-int-custom-talk" class="flex-1 bg-transparent text-xs focus:outline-none px-2 py-1" placeholder="说点什么..."><button onclick="submitNpcDirectTalk()" class="border text-xs px-2.5 py-1 rounded-lg">谈话</button></div><button onclick="closeNpcInteractiveModal()" class="w-full border text-xs py-1.5 rounded-lg">退出互动</button></div>
                </div>
            </div>
        `;
        const oldModal = document.getElementById('modal-npc-interactive');
        if (oldModal) oldModal.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        fillNpcInteractiveData(npc);
        bindNpcInteractiveEvents(npc, idx);
    };

    function fillNpcInteractiveData(npc) {
        const jcl = npc.jcl || window.JUNCHENGLU_NPC_DEFAULTS;
        document.getElementById('npc-int-name').innerText = npc.name;
        document.getElementById('npc-int-relation').innerText = `纽带：${npc.relation}`;
        if (npc.portrait) {
            document.getElementById('npc-int-avatar').src = npc.portrait;
            document.getElementById('npc-int-avatar').classList.remove('hidden');
            document.getElementById('npc-int-avatar-placeholder').classList.add('hidden');
        } else {
            document.getElementById('npc-int-avatar-placeholder').innerText = npc.name.charAt(0);
        }
        const infoDiv = document.getElementById('npc-int-jcl-info');
        if (infoDiv) {
            infoDiv.innerHTML = `
                <div>年龄: ${jcl.age}</div><div>性别: ${jcl.gender}</div>
                <div>身份: ${jcl.title}</div><div>派系: ${jcl.faction}</div>
                <div class="col-span-2">性格: ${jcl.personality}</div>
                <div class="col-span-2">角色设定: ${jcl.characterSetting || '无'}</div>
                <div class="col-span-2">背景: ${jcl.background}</div>
                <div>喜好: ${jcl.likes}</div><div>忌讳: ${jcl.dislikes}</div>
                <div>技能: ${jcl.specialSkill}</div><div>健康: ${jcl.healthStatus}</div>
                <div class="col-span-2">所在地: ${window.getLocationById?.(jcl.location)?.name || '行踪不明'}</div>
                <div class="col-span-2">对玩家称呼: ${jcl.playerCallName || '你'}</div>
            `;
        }
        document.getElementById('npc-int-virginity').innerText = jcl.virginity || '—';
        document.getElementById('npc-int-orientation').innerText = jcl.orientation || '—';
        document.getElementById('npc-int-secret').innerText = npc.isSecretUnlocked ? (jcl.secret || '???') : '尚未发现';
        document.getElementById('npc-int-likes').innerText = npc.isSecretUnlocked ? (jcl.likes || '???') : '未知';
        const resumeDiv = document.getElementById('npc-int-resume-log');
        if (resumeDiv) resumeDiv.innerHTML = (jcl.resumeLog || []).map(l => `<div><span class="font-bold">${l.time}</span> ${l.event}</div>`).join('');
        const statsGrid = document.getElementById('npc-int-stats-grid');
        if (statsGrid) {
            statsGrid.innerHTML = '';
            Object.keys(npc.stats || {}).forEach(k => {
                const val = npc.stats[k];
                statsGrid.innerHTML += `<div class="border p-2 rounded flex justify-between items-center"><span>${k}</span><span class="font-bold">${val}</span><button onclick="adjustNpcStat(window.DB.activeNpcIntIdx,'${k}',-5)" class="border px-1">-5</button><button onclick="adjustNpcStat(window.DB.activeNpcIntIdx,'${k}',5)" class="border px-1">+5</button></div>`;
            });
            statsGrid.innerHTML += `<button onclick="addNpcStatManual(window.DB.activeNpcIntIdx)" class="col-span-2 border text-[10px] py-1 rounded">+ 添加属性</button>`;
        }
        const customGrid = document.getElementById('npc-int-custom-stats-grid');
        if (customGrid) {
            customGrid.innerHTML = '';
            const custom = npc.jcl?.customStats || npc.customStats || {};
            Object.keys(custom).forEach(k => {
                customGrid.innerHTML += `<div class="border p-2 rounded"><span>${k}:</span> ${custom[k]}</div>`;
            });
        }
        renderInteractionTags(window.DB.activeNpcIntIdx);
    }

    function bindNpcInteractiveEvents(npc, idx) {}

    window.handleNPCQuickAvatarUpload = function(input, npcIdx) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const npc = window.gameState.npcs[npcIdx];
                npc.portrait = e.target.result;
                if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
                window.openNpcInteractiveDetails(npcIdx);
                window.showToast?.("头像已更新");
            };
            reader.readAsDataURL(input.files[0]);
        }
    };

    function renderInteractionTags(idx) {
        const container = document.getElementById('npc-interaction-tags');
        if (!container) return;
        const npc = window.gameState.npcs[idx];
        const tags = window.DB.interactionTags?.[npc.id] || ['交谈', '询问', '观察', '赠送礼物', '挑衅'];
        container.innerHTML = '';
        tags.forEach(tag => {
            const chip = document.createElement('span');
            chip.className = 'interaction-tag inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-200 text-xs cursor-pointer';
            chip.innerHTML = `${tag} <i class="fas fa-times text-[10px] ml-1" onclick="event.stopPropagation();removeInteractionTag('${npc.id}','${tag}')"></i>`;
            chip.onclick = (e) => { if (!e.target.classList.contains('fa-times')) executeInteractionTag(npc, tag); };
            container.appendChild(chip);
        });
    }

    window.executeInteractionTag = async function(npc, tag) {
        const terminal = document.getElementById('npc-int-chat-terminal');
        terminal.innerHTML = '<div class="text-xs italic">AI正在反应...</div>';
        const prompt = `玩家对NPC「${npc.name}」(关系:${npc.relation})采取了行动：【${tag}】。请用中文描写一段即时反馈叙事，100字内。`;
        try {
            const res = await window.callLLMRequest?.(prompt, "你是剧情结算器");
            terminal.innerHTML = `<div class="text-xs">【${tag}】：${res}</div>`;
        } catch(e) { terminal.innerHTML = '<div class="text-xs text-red-400">动作计算中断。</div>'; }
    };

    window.addCustomInteraction = function() {
        const input = document.getElementById('new-interaction-input');
        const tag = input.value.trim();
        if (!tag || window.DB.activeNpcIntIdx === null) return;
        const npc = window.gameState.npcs[window.DB.activeNpcIntIdx];
        if (!window.DB.interactionTags) window.DB.interactionTags = {};
        if (!window.DB.interactionTags[npc.id]) window.DB.interactionTags[npc.id] = [];
        if (!window.DB.interactionTags[npc.id].includes(tag)) {
            window.DB.interactionTags[npc.id].push(tag);
            input.value = '';
            renderInteractionTags(window.DB.activeNpcIntIdx);
            if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
        }
    };

    window.aiGenerateInteractions = async function() {
        const npc = window.gameState.npcs[window.DB.activeNpcIntIdx];
        if (!npc) return;
        const prompt = `请根据NPC「${npc.name}」的性格和关系，生成5个具体的交互选项（如'赠送礼物'、'挑衅'等）。输出JSON：{"interactions":["选项1","选项2","选项3","选项4","选项5"]}`;
        try {
            const res = await window.callLLMRequest?.(prompt, "你是交互选项生成器");
            const parsed = JSON.parse(window.cleanAiJsonOutput?.(res) || res);
            if (parsed.interactions) {
                if (!window.DB.interactionTags) window.DB.interactionTags = {};
                window.DB.interactionTags[npc.id] = parsed.interactions;
                renderInteractionTags(window.DB.activeNpcIntIdx);
                if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
            }
        } catch(e) { window.showToast?.("AI生成交互失败", false); }
    };

    window.closeNpcInteractiveModal = function() {
        const modal = document.getElementById('modal-npc-interactive');
        if (modal) modal.remove();
        window.DB.activeNpcIntIdx = null;
    };

    // ==================== NPC 私聊微信风格 ====================
    window.openNpcWechatChatModal = function(idx) {
        const npc = window.gameState.npcs[idx];
        if (!npc) return;
        const modalHtml = `
            <div id="modal-npc-wechat-chat" class="wechat-chat-overlay" style="display:flex;">
                <div class="wechat-chat-card">
                    <div class="wechat-chat-header"><button onclick="closeNpcWechatChatModal()" class="w-7 h-7 rounded-full flex items-center justify-center border"><i class="fas fa-arrow-left"></i></button><div class="w-9 h-9 rounded-full overflow-hidden border" id="wc-avatar-container"><img id="wc-npc-avatar" class="w-full h-full object-cover hidden"><i id="wc-npc-avatar-placeholder" class="fas fa-user-astronaut text-sm flex items-center justify-center w-full h-full"></i></div><div><h4 id="wc-npc-name" class="text-sm font-bold">${escapeHtml(npc.name)}</h4><p id="wc-npc-relation-tag" class="text-[10px]">${escapeHtml(npc.relation)}</p></div></div>
                    <div class="wechat-chat-body" id="wc-chat-messages"></div>
                    <div class="wechat-chat-footer"><input type="text" id="wc-chat-input" class="flex-1 border rounded-full px-4 py-2 text-xs" placeholder="输入消息..." onkeydown="if(event.key==='Enter')submitWechatChatMessage()"><button onclick="submitWechatChatMessage()" class="w-9 h-9 rounded-full flex items-center justify-center border"><i class="fas fa-paper-plane"></i></button></div>
                </div>
            </div>
        `;
        const old = document.getElementById('modal-npc-wechat-chat');
        if (old) old.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        if (npc.portrait) {
            document.getElementById('wc-npc-avatar').src = npc.portrait;
            document.getElementById('wc-npc-avatar').classList.remove('hidden');
            document.getElementById('wc-npc-avatar-placeholder').classList.add('hidden');
        } else {
            document.getElementById('wc-npc-avatar-placeholder').innerHTML = npc.name.charAt(0);
        }
        const chatKey = npc.id;
        if (!window.DB.wechatChatHistory) window.DB.wechatChatHistory = {};
        if (!window.DB.wechatChatHistory[chatKey]) window.DB.wechatChatHistory[chatKey] = [];
        const messagesDiv = document.getElementById('wc-chat-messages');
        messagesDiv.innerHTML = '';
        window.DB.wechatChatHistory[chatKey].forEach(msg => {
            const bubble = document.createElement('div');
            bubble.className = `wechat-bubble ${msg.from==='self'?'self-bub':'npc-bub'}`;
            bubble.innerText = msg.text;
            messagesDiv.appendChild(bubble);
        });
        if (!window.DB.wechatChatHistory[chatKey].length) {
            const greet = document.createElement('div');
            greet.className = 'wechat-bubble npc-bub';
            greet.innerText = `你好，我是${npc.name}。`;
            messagesDiv.appendChild(greet);
            window.DB.wechatChatHistory[chatKey].push({ from:'npc', text: greet.innerText });
        }
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    };

    window.submitWechatChatMessage = async function() {
        const input = document.getElementById('wc-chat-input');
        const text = input.value.trim();
        if (!text || window.DB.activeNpcIntIdx === null) return;
        input.value = '';
        const npc = window.gameState.npcs[window.DB.activeNpcIntIdx];
        const chatKey = npc.id;
        if (!window.DB.wechatChatHistory[chatKey]) window.DB.wechatChatHistory[chatKey] = [];
        const messagesDiv = document.getElementById('wc-chat-messages');
        const selfBub = document.createElement('div');
        selfBub.className = 'wechat-bubble self-bub';
        selfBub.innerText = text;
        messagesDiv.appendChild(selfBub);
        window.DB.wechatChatHistory[chatKey].push({ from:'self', text });
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        const prompt = `你是NPC「${npc.name}」(性格:${npc.jcl?.personality}，关系:${npc.relation})。玩家对你说："${text}"。请用中文回复，50-150字。只输出回复文本。`;
        try {
            const reaction = await window.callLLMRequest?.(prompt, "你是NPC人格拟真模块");
            const npcBub = document.createElement('div');
            npcBub.className = 'wechat-bubble npc-bub';
            npcBub.innerText = reaction.trim();
            messagesDiv.appendChild(npcBub);
            window.DB.wechatChatHistory[chatKey].push({ from:'npc', text: reaction.trim() });
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        } catch(e) {
            const errBub = document.createElement('div');
            errBub.className = 'wechat-bubble npc-bub';
            errBub.innerText = '...（对方暂时无法回应）';
            messagesDiv.appendChild(errBub);
            window.DB.wechatChatHistory[chatKey].push({ from:'npc', text: errBub.innerText });
        }
    };

    window.closeNpcWechatChatModal = function() {
        const modal = document.getElementById('modal-npc-wechat-chat');
        if (modal) modal.remove();
    };

    // ==================== 辅助函数 ====================
    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }

    console.log("✅ extras.js 已加载（无头像库依赖，使用首字母头像）");
})();
