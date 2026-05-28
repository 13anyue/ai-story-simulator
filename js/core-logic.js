// js/core-logic.js - 核心 AI 交互与状态更新（原 game.js 精华部分）
// 依赖：api.js, data.js, save.js, systems.js

(function() {
    // 确保全局对象存在
    if (!window.gameState) window.gameState = {};

    // ==================== callAI：构建消息并调用 API ====================
    window.callAI = async function(userInput, isSystem = false, turnToken = "") {
        const btn = document.querySelector('#send-btn');
        const inputField = document.getElementById('user-input');
        const originalBtnHtml = btn ? btn.innerHTML : '';

        // 检查是否已导入文件（除非是系统指令）
        if (!isSystem && !window.gameState.hasImportedFile) {
            if (btn) { btn.innerHTML = originalBtnHtml; btn.disabled = false; }
            if (inputField) { inputField.disabled = false; inputField.focus(); }
            window.addLog?.('<div style="padding:16px; background:rgba(255,126,179,.15); border-radius:12px;"><strong>⚠️ 请先导入世界设定文件</strong><br>在开始游戏前，请点击顶部栏的 <i class="fas fa-file-import"></i> 按钮，导入你的世界设定文件。</div>', 'system');
            return;
        }

        // UI Loading 状态
        if (btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; btn.disabled = true; }
        if (inputField) inputField.disabled = true;

        // 尝试整理记忆（开局首轮跳过）
        const isFirstSystemCall = isSystem && (!window.gameState.history || window.gameState.history.length === 0);
        if (!isFirstSystemCall) {
            try { await window.summarizeMemoryIfNeeded?.(); } catch(e) { console.error('自动整理记忆失败', e); }
        }

        // 构建消息历史
        const recentHistory = isFirstSystemCall ? [] : (window.gameState.history || []).slice(-6);
        const messages = [
            { role: "system", content: window.SYSTEM_PROMPT || "" },
            ...recentHistory,
            { role: "user", content: userInput }
        ];

        // 注入导入的世界设定（核心）
        if (window.gameState.hasImportedFile && (window.gameState.importedFileContent || window.gameState.memory?.world_core)) {
            const worldText = window.gameState.memory?.world_core || window.gameState.importedFileContent || "";
            const fileContextMsg = `【⚠️ 最重要：以下为玩家导入的世界设定文件的核心摘要，请视为唯一权威世界观来源 ⚠️】\n\n${worldText}\n\n【强制要求】所有世界观、题材、人物设定等必须严格基于以上内容，禁止使用任何默认设定。`;
            messages.splice(1, 0, { role: "system", content: fileContextMsg });
        }

        // 注入记忆模块摘要
        if (window.gameState.memory) {
            const parts = [];
            if (window.gameState.memory.world_core) parts.push(`【世界观核心】\n${window.gameState.memory.world_core}`);
            if (window.gameState.memory.history_summary) parts.push(`【主线剧情摘要】\n${window.gameState.memory.history_summary}`);
            if (window.gameState.memory.key_events?.length) parts.push(`【重要事件】\n${window.gameState.memory.key_events.join('\n')}`);
            if (window.gameState.memory.relations?.length) parts.push(`【人物关系变化】\n${window.gameState.memory.relations.join('\n')}`);
            if (window.gameState.memory.tasks) parts.push(`【任务进展】\n${window.gameState.memory.tasks}`);
            const memoryText = parts.join('\n\n');
            if (memoryText) messages.splice(1, 0, { role: "system", content: `【必须严格遵守的剧情记忆】\n${memoryText}` });
        }

        // 注入当前玩家完整信息
        const player = window.gameState.player || {};
        const aiPlayerBaseline = {
            inventory: (player.inventory || []).map(i => ({ ...i })),
            stats: JSON.parse(JSON.stringify(player.stats || {}))
        };
        const playerInfoText = `【当前玩家完整信息】
姓名：${player.name || '未命名'}
称号/职业：${player.title || '未设定'}
性别：${player.gender || '未知'}
当前位置：${player.location || '未知地点'}
生日：${player.birthday || '未设定'}
年龄：${player.age != null ? player.age : '未设定'}
属性：${JSON.stringify(player.stats || {})}
背包：${JSON.stringify(player.inventory || [])}
备注：${player.notes || '暂无备注'}

强制要求：
1. 属性、背包必须基于上述最新值做合理增减。
2. 若生日或年龄未设定，必须在 player_update 中强制生成。
3. 背包若无变化，必须省略 inventory 字段或原样带回全部物品。
`;
        messages.splice(1, 0, { role: "system", content: playerInfoText });

        // 注入所有已注册 NPC 列表
        const npcList = window.gameState.npcs || [];
        if (npcList.length) {
            const npcLines = npcList.map(n => {
                const tags = (n.tags || []).join('、') || '暂无标签';
                const invDetail = (n.inventory || []).map(it => `${it.name}×${it.count || 1}`).join('、') || '无';
                return `${n.id || '?'}｜${n.name}｜性别:${n.gender || '未知'}｜关系:${n.relation}｜好感:${n.favor ?? 0}｜头像:${window.getSafeAvatarURL?.(n.avatar) || ''}｜对玩家称呼:${n.playerCallName || player.name}｜随身物品:${invDetail}`;
            }).join('\n');
            const npcText = `【当前所有已注册 NPC 列表（必须完整读取）】\n${npcLines}\n\n强制要求：\n1. 剧情与对话只能使用以上已登记的 NPC。\n2. 称呼必须使用 playerCallName。\n3. 更新好感度时必须在原值基础上微调。\n4. 若 NPC 生日/年龄未设定，必须在本次 npc_update 中补充。`;
            messages.splice(1, 0, { role: "system", content: npcText });
        }

        // 注入人物关系网摘要
        try {
            const net = window.gameState.relationshipNetwork || { nodes: [], edges: [] };
            const playerEdges = net.edges.filter(e => e.source === 'player' || e.target === 'player').slice(0, 10);
            const npcEdges = net.edges.filter(e => e.source !== 'player' && e.target !== 'player').slice(0, 8);
            if (playerEdges.length || npcEdges.length) {
                const edgeSummary = (edges) => edges.map(e => `${e.source} ↔ ${e.target} (${e.relationType || '未知'} 亲密度:${e.intimacy||0} 好感:${e.favor||0})`).join('\n');
                const relText = `【人物关系网动态摘要】\n与主角相关：\n${edgeSummary(playerEdges)}\nNPC之间：\n${edgeSummary(npcEdges)}\n强制要求：必须深度结合关系网驱动人物行为。`;
                messages.splice(1, 0, { role: "system", content: relText });
            }
        } catch(e) {}

        // 注入当前状态上下文
        const contextMsg = `当前游戏状态：\n- 当前位置：${player.location || '未知地点'}\n- 角色属性：${JSON.stringify(player.stats || {})}\n- 背包：${JSON.stringify(player.inventory || [])}\n- 已知NPC：${npcList.map(n => n.name).join(',')}\n\n请在完全遵守以上信息的前提下推进剧情，narrative 必须是精美的 HTML 卡片格式。`;
        messages.push({ role: "system", content: contextMsg });

        // 调用 API
        let fullContent = '';
        try {
            fullContent = await window.openAIChatRequestAuto?.({
                baseUrl: window.gameState.settings?.baseUrl || '',
                apiKey: window.gameState.settings?.apiKey || '',
                body: { model: window.gameState.settings?.model || '', messages, temperature: 0.8 },
                preferStream: true
            });
            if (!fullContent || !fullContent.trim()) throw new Error('AI 未返回内容');
            await window.processAIResponse?.(fullContent, userInput, turnToken, aiPlayerBaseline);
            // 更新历史
            if (!window.gameState.history) window.gameState.history = [];
            window.gameState.history.push({ role: "user", content: userInput });
            window.gameState.history.push({ role: "assistant", content: fullContent });
            if (typeof window.saveData === 'function') window.saveData();
        } catch (e) {
            const errorMsg = window.toChineseNetworkHint?.(String(e?.message || e)) || '请求失败';
            window.addLog?.(`<div style="padding:16px; background:rgba(255,0,0,.1); border-radius:12px;"><strong>⚠️ 错误</strong><br>${errorMsg}</div>`, 'system');
        } finally {
            if (btn) { btn.innerHTML = originalBtnHtml; btn.disabled = false; }
            if (inputField) { inputField.disabled = false; inputField.value = ''; inputField.focus(); }
        }
    };

    // ==================== processAIResponse：解析并更新游戏状态 ====================
    window.processAIResponse = async function(content, userAction, turnToken, aiPlayerBaseline) {
        content = window.stripThinkBlocks?.(content) || content;
        // 提取 JSON
        let jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        let gameData = null;
        let narrative = content;
        if (jsonMatch) {
            gameData = window.safeJsonParse?.(jsonMatch[1]);
            if (gameData?.narrative != null) narrative = String(gameData.narrative).trim();
        }
        if (!gameData) gameData = window.safeJsonParse?.(content);
        if (gameData?.narrative) narrative = String(gameData.narrative).trim();

        // 清洗 narrative 中的 JSON 残余
        narrative = narrative.replace(/```json[\s\S]*?```/gi, '').replace(/```[\s\S]*?```/gi, '').trim();
        if (!narrative) narrative = '<div style="padding:16px; background:rgba(255,126,179,.15); border-radius:12px;">AI 返回格式异常，请重试。</div>';

        // 显示剧情
        const choices = gameData?.choices || [];
        const styledHtml = window.buildAIStyledHTML?.(narrative, choices, gameData) || narrative;
        const entryEl = window.addLog?.(styledHtml, 'ai');
        if (entryEl && turnToken) {
            entryEl.dataset.turnToken = turnToken;
            entryEl.addEventListener('click', () => window.requestUndo?.(turnToken));
        }
        window.bindAiHtmlChoices?.(entryEl);

        // 更新游戏数据（增量合并）
        if (gameData) {
            // 辅助函数：安全合并数值（好感度等）
            const mergeInheritableNumeric = (oldVal, newVal, min, max) => {
                if (newVal == null) return oldVal;
                const n = Number(newVal);
                if (isNaN(n)) return oldVal;
                if (oldVal != null && Math.abs(oldVal) >= 3 && n === 0) return oldVal; // 防止无故归零
                return Math.min(max, Math.max(min, n));
            };

            // 合并主角
            if (gameData.player_update) {
                const old = window.gameState.player || {};
                const upd = gameData.player_update;
                window.gameState.player = {
                    ...old,
                    ...upd,
                    stats: { ...(old.stats || {}), ...(upd.stats || {}) },
                    inventory: upd.inventory !== undefined ? (upd.inventory.length ? upd.inventory : old.inventory) : old.inventory,
                    tasks: Array.isArray(upd.tasks) ? upd.tasks : (old.tasks || []),
                    birthday: upd.birthday || old.birthday,
                    age: upd.age !== undefined ? upd.age : old.age
                };
                // 主角头像分配
                if (typeof window.assignAvatarFromLibrary === 'function') window.assignAvatarFromLibrary(window.gameState.player);
                if (typeof window.updatePanelUI === 'function') window.updatePanelUI();
            }

            // 合并 NPC（通过 id 或 name 匹配）
            if (Array.isArray(gameData.npc_update)) {
                for (let newNPC of gameData.npc_update) {
                    let idx = window.gameState.npcs.findIndex(n => n.id === newNPC.id);
                    if (idx === -1 && newNPC.name) idx = window.gameState.npcs.findIndex(n => n.name === newNPC.name);
                    if (idx !== -1) {
                        const old = window.gameState.npcs[idx];
                        window.gameState.npcs[idx] = {
                            ...old,
                            ...newNPC,
                            stats: { ...(old.stats || {}), ...(newNPC.stats || {}) },
                            inventory: newNPC.inventory !== undefined ? newNPC.inventory : old.inventory,
                            jcl: { ...(old.jcl || {}), ...(newNPC.jcl || {}) },
                            favor: mergeInheritableNumeric(old.favor, newNPC.favor, -100, 100),
                            tags: Array.isArray(newNPC.tags) ? [...new Set([...(old.tags||[]), ...newNPC.tags])] : old.tags
                        };
                        if (typeof window.assignAvatarFromLibrary === 'function') window.assignAvatarFromLibrary(window.gameState.npcs[idx]);
                    } else {
                        // 新增 NPC
                        const newId = newNPC.id || `npc_${Date.now()}_${Math.random().toString(16).slice(2)}`;
                        const newNpc = { ...newNPC, id: newId };
                        window.gameState.npcs.push(newNpc);
                        if (typeof window.assignAvatarFromLibrary === 'function') window.assignAvatarFromLibrary(newNpc);
                    }
                }
                if (typeof window.updateNPCUI === 'function') window.updateNPCUI();
            }

            // 更新世界/地图
            if (gameData.world_update) {
                if (!window.gameState.world) window.gameState.world = { current_location_id: "", locations: [] };
                if (gameData.world_update.current_location_id) window.gameState.world.current_location_id = gameData.world_update.current_location_id;
                if (Array.isArray(gameData.world_update.locations)) {
                    gameData.world_update.locations.forEach(loc => {
                        const idx = window.gameState.world.locations.findIndex(l => l.id === loc.id);
                        if (idx !== -1) window.gameState.world.locations[idx] = { ...window.gameState.world.locations[idx], ...loc };
                        else window.gameState.world.locations.push(loc);
                    });
                }
                if (typeof window.renderMapUI === 'function') window.renderMapUI();
                if (typeof window.renderYiCiYuanMap === 'function') window.renderYiCiYuanMap();
            }

            // 更新关系网
            if (gameData.relationship_network_update) {
                window.applyRelationshipNetworkUpdate?.(gameData.relationship_network_update);
            }

            // 更新选项
            if (gameData.choices && typeof window.updateChoices === 'function') window.updateChoices(gameData.choices);

            // 处理背包使用记录
            if (Array.isArray(gameData.inventory_log_append)) {
                if (!window.gameState.inventoryLog) window.gameState.inventoryLog = [];
                gameData.inventory_log_append.forEach(r => window.gameState.inventoryLog.unshift(r));
                if (window.gameState.inventoryLog.length > 80) window.gameState.inventoryLog = window.gameState.inventoryLog.slice(0,80);
                if (typeof window.renderInventoryLogUI === 'function') window.renderInventoryLogUI();
            }

            // 检查死亡
            if (gameData.event_type === 'death' && typeof window.handleDeath === 'function') window.handleDeath();
        }

        // 保存
        if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
    };

    // ==================== 辅助合并函数 ====================
    window.applyRelationshipNetworkUpdate = function(update) {
        if (!window.gameState.relationshipNetwork) window.gameState.relationshipNetwork = { nodes: [], edges: [] };
        const net = window.gameState.relationshipNetwork;
        if (Array.isArray(update.nodesToAdd)) {
            update.nodesToAdd.forEach(node => {
                if (!net.nodes.find(n => n.id === node.id)) net.nodes.push(node);
            });
        }
        if (Array.isArray(update.edgesToUpdate)) {
            update.edgesToUpdate.forEach(edge => {
                const existing = net.edges.find(e => e.source === edge.source && e.target === edge.target);
                if (existing) Object.assign(existing, edge);
                else net.edges.push(edge);
            });
        }
        if (Array.isArray(update.interactionsToAdd)) {
            // 简化：仅追加
            update.interactionsToAdd.forEach(inter => {
                const edge = net.edges.find(e => e.source === inter.source && e.target === inter.target);
                if (edge) {
                    if (!edge.interactionHistory) edge.interactionHistory = [];
                    edge.interactionHistory.push({ time: inter.time, event: inter.event, location: inter.location, impact: inter.impact });
                }
            });
        }
        if (typeof window.saveData === 'function') window.saveData();
    };

    // 确保全局函数存在
    if (typeof window !== 'undefined') {
        window.callAI = window.callAI;
        window.processAIResponse = window.processAIResponse;
        window.applyRelationshipNetworkUpdate = window.applyRelationshipNetworkUpdate;
    }
})();
