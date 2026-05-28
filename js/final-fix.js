// js/final-fix.js - 彻底修复所有“开发中”功能（原 game.js 完整移植）

(function() {
    // ========== 确保全局对象存在 ==========
    if (!window.DB) window.DB = {};
    if (!window.gameState) window.gameState = {};
    if (!window.gameState.gameState && window.gameState.player) window.gameState.gameState = window.gameState;
    if (!window.gameState.npcs) window.gameState.npcs = [];

    // ========== 家族树 ==========
    window.openFamilyTreeModal = function(npcIdx) {
        const idx = (npcIdx !== undefined) ? npcIdx : (window.DB.activeNpcIntIdx || 0);
        const npc = window.gameState.npcs?.[idx];
        if (!npc) { alert("未找到可用的NPC数据"); return; }
        window.DB.activeNpcIntIdx = idx;

        // 构建 NPC 下拉选项
        const npcOptions = window.gameState.npcs.map((n, i) => `<option value="${i}" ${i === idx ? 'selected' : ''}>${n.name}</option>`).join('');

        let modal = document.getElementById('modal-family-tree');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-family-tree';
            modal.className = 'modal-overlay hidden';
            document.body.appendChild(modal);
        }

        const hasFamily = npc.family && npc.family.parents;
        const content = hasFamily ? `
            <div class="space-y-4 text-center">
                <div class="p-3 border rounded-xl"><span class="text-[10px] uppercase">长辈</span><div class="text-sm font-bold">${escapeHtml(npc.family.parents)}</div></div>
                <div class="text-2xl">↓</div>
                <div class="p-4 border-2 rounded-2xl"><span class="text-sm font-black">${escapeHtml(npc.name)}</span><div class="mt-1 text-xs">配偶：${escapeHtml(npc.family.spouse || '无')}</div></div>
                <div class="text-2xl">↓</div>
                <div class="flex flex-wrap gap-2 justify-center">${(npc.family.children || []).map(c => `<span class="px-3 py-1 bg-gray-800 text-white rounded-lg text-xs">${escapeHtml(c)}</span>`).join('') || '<span class="text-xs text-gray-400">尚无后嗣</span>'}</div>
            </div>
        ` : `<div class="text-center py-8 text-gray-400">该角色的家族谱系尚未被 AI 挖掘。</div>`;

        modal.innerHTML = `
            <div class="modal-card" style="max-width:420px;">
                <div class="p-4 border-b flex justify-between items-center"><h3 class="font-bold">家族谱系 · 角色切换</h3><button onclick="document.getElementById('modal-family-tree').style.display='none'" class="text-gray-400">&times;</button></div>
                <div class="p-3 border-b"><select id="family-tree-npc-selector" class="w-full border rounded p-2" onchange="openFamilyTreeModal(parseInt(this.value))">${npcOptions}</select></div>
                <div class="p-6">${content}</div>
                <div class="p-4 border-t flex justify-center gap-2"><button onclick="aiGenerateFamilyTree(parseInt(document.getElementById('family-tree-npc-selector').value))" class="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-bold">AI 生成谱系</button><button onclick="addFamilyMember()" class="px-4 py-2 border rounded-lg text-xs">添加成员</button></div>
            </div>
        `;
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
    };

    window.aiGenerateFamilyTree = async function(idx) {
        const npcIdx = (idx !== undefined) ? idx : (window.DB.activeNpcIntIdx || 0);
        const npc = window.gameState.npcs?.[npcIdx];
        if (!npc) { alert("未选中角色"); return; }
        const prompt = `为NPC「${npc.name}」(背景:${npc.jcl?.background})生成家族谱系。输出JSON：{"parents":"父母描述","spouse":"配偶","children":["子1","子2"]}`;
        try {
            const res = await window.callLLMRequest?.(prompt, "只输出JSON");
            const data = JSON.parse(window.cleanAiJsonOutput?.(res) || res);
            npc.family = { parents: data.parents, spouse: data.spouse, children: data.children || [] };
            if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
            window.openFamilyTreeModal(npcIdx);
        } catch(e) { alert("AI生成失败"); }
    };

    window.addFamilyMember = function() {
        const npc = window.gameState.npcs[window.DB.activeNpcIntIdx];
        if (!npc) return;
        const name = prompt("请输入家族成员姓名：");
        if (!name) return;
        if (!npc.family) npc.family = { parents: "", spouse: "", children: [] };
        if (!npc.family.children) npc.family.children = [];
        npc.family.children.push(name);
        window.openFamilyTreeModal(window.DB.activeNpcIntIdx);
        if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
    };

    // ========== 局势分析 ==========
    window.openSituationAnalysisModal = function() {
        const npcs = window.gameState.npcs || [];
        const factions = {};
        npcs.forEach(n => {
            const fac = n.jcl?.faction || "江湖散人/神秘势力";
            if (!factions[fac]) factions[fac] = [];
            factions[fac].push(n);
        });
        let modal = document.getElementById('modal-situation-analysis');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-situation-analysis';
            modal.className = 'modal-overlay hidden';
            document.body.appendChild(modal);
        }
        let cardsHtml = Object.keys(factions).map(facName => {
            const list = factions[facName];
            return `<div class="p-3 rounded-2xl border mb-3"><div class="flex justify-between"><span class="text-xs font-bold">${escapeHtml(facName)}</span><span class="text-[10px]">成员数: ${list.length}</span></div><div class="flex flex-wrap gap-1">${list.map(n => `<span class="text-[11px] px-2 py-1 rounded border">${escapeHtml(n.name)}</span>`).join('')}</div></div>`;
        }).join('');
        if (!cardsHtml) cardsHtml = '<p class="text-xs text-center py-6">当前未录入任何阵营</p>';
        modal.innerHTML = `<div class="modal-card"><div class="p-4 border-b flex justify-between"><h3>狂澜暗涌 · 局势分析</h3><button onclick="document.getElementById('modal-situation-analysis').style.display='none'">&times;</button></div><div class="p-4 max-h-[60vh] overflow-y-auto">${cardsHtml}</div></div>`;
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
    };

    // ========== NPC 关系网 ==========
    window.openNpcRelationsModal = function(idx) {
        const npcIdx = (idx !== undefined) ? idx : (window.DB.activeNpcIntIdx || 0);
        const npc = window.gameState.npcs?.[npcIdx];
        if (!npc) { alert("未找到该角色的关系记录"); return; }
        window.DB.currentRelationsNpcIdx = npcIdx;
        if (!npc.relations) npc.relations = [];
        renderNpcRelationsList();

        let modal = document.getElementById('modal-npc-relations');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-npc-relations';
            modal.className = 'modal-overlay hidden';
            document.body.appendChild(modal);
        }
        const npcOptions = window.gameState.npcs.map((n, i) => `<option value="${i}" ${i === npcIdx ? 'selected' : ''}>${n.name}</option>`).join('');
        modal.innerHTML = `
            <div class="modal-card">
                <div class="p-4 border-b flex justify-between"><h3>${escapeHtml(npc.name)} 的关系圈</h3><button onclick="closeNpcRelationsModal()">&times;</button></div>
                <div class="p-3 border-b"><select id="relations-npc-selector" class="w-full border rounded p-2" onchange="openNpcRelationsModal(parseInt(this.value))">${npcOptions}</select></div>
                <div class="p-4 max-h-[60vh] overflow-y-auto"><div id="npc-relations-list"></div><button onclick="aiGenerateNpcRelations()" class="w-full mt-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold">AI 推演当前角色的新关系</button></div>
            </div>
        `;
        renderNpcRelationsList();
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
    };

    function renderNpcRelationsList() {
        const container = document.getElementById('npc-relations-list');
        if (!container) return;
        const npc = window.gameState.npcs[window.DB.currentRelationsNpcIdx];
        if (!npc || !npc.relations || !npc.relations.length) {
            container.innerHTML = '<p class="text-xs text-center py-4">暂无关系记录</p>';
            return;
        }
        container.innerHTML = '';
        npc.relations.forEach((rel, i) => {
            const targetNpc = window.gameState.npcs.find(n => n.id === rel.npcId);
            const name = targetNpc ? targetNpc.name : '未知角色';
            const item = document.createElement('div');
            item.className = "flex justify-between border rounded p-2 mb-2 text-xs";
            item.innerHTML = `<div><span class="font-bold">${escapeHtml(name)}</span> - <span class="text-amber-600">${escapeHtml(rel.type)}</span><br><span class="text-[10px]">${escapeHtml(rel.description || '')}</span></div><button onclick="removeNpcRelation(${i})" class="text-red-500">删除</button>`;
            container.appendChild(item);
        });
    }

    window.removeNpcRelation = function(index) {
        const npc = window.gameState.npcs[window.DB.currentRelationsNpcIdx];
        npc.relations.splice(index, 1);
        renderNpcRelationsList();
        if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
    };

    window.aiGenerateNpcRelations = async function() {
        const npc = window.gameState.npcs[window.DB.currentRelationsNpcIdx];
        if (!npc) return;
        const prompt = `为NPC「${npc.name}」生成关系网。输出JSON：{"relations":[{"npcId":"new_xxx","name":"新角色名","isNew":true,"type":"关系类型","description":"描述"}]}`;
        try {
            const res = await window.callLLMRequest?.(prompt, "只输出JSON");
            const parsed = JSON.parse(window.cleanAiJsonOutput?.(res) || res);
            if (parsed.relations) {
                for (let rel of parsed.relations) {
                    let targetNpc = null;
                    if (rel.isNew) {
                        const newId = `npc-gen-${Date.now()}`;
                        targetNpc = { id: newId, name: rel.name, relation: "陌生人", stats: {}, jcl: { personality: rel.personality || "", background: rel.background || "" }, relations: [] };
                        window.gameState.npcs.push(targetNpc);
                    } else {
                        targetNpc = window.gameState.npcs.find(n => n.id === rel.npcId);
                    }
                    if (targetNpc) {
                        if (!npc.relations) npc.relations = [];
                        npc.relations.push({ npcId: targetNpc.id, name: targetNpc.name, type: rel.type, description: rel.description });
                    }
                }
                renderNpcRelationsList();
                if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
                window.showToast?.("关系生成成功");
            }
        } catch(e) { alert("AI生成关系失败"); }
    };

    window.closeNpcRelationsModal = function() {
        const modal = document.getElementById('modal-npc-relations');
        if (modal) modal.style.display = 'none';
    };

    // ========== AI 推演全员关系网 ==========
    window.aiGenerateAllNpcRelations = async function() {
        const npcs = window.gameState.npcs;
        if (npcs.length < 2) { alert("NPC数量不足"); return; }
        const prompt = `为以下NPC生成关系网：${npcs.map(n => n.name).join('、')}。输出JSON数组：[{"npc1":"A","npc2":"B","type":"关系名","desc":"描述"}]`;
        try {
            const res = await window.callLLMRequest?.(prompt, "只输出JSON数组");
            const relations = JSON.parse(window.cleanAiJsonOutput?.(res) || res);
            relations.forEach(r => {
                const n1 = npcs.find(n => n.name === r.npc1);
                const n2 = npcs.find(n => n.name === r.npc2);
                if (n1 && n2) {
                    if (!n1.relations) n1.relations = [];
                    if (!n1.relations.some(rel => rel.npcId === n2.id)) {
                        n1.relations.push({ npcId: n2.id, name: n2.name, type: r.type, description: r.desc });
                    }
                }
            });
            if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
            alert("关系网推演完成");
        } catch(e) { alert("AI推演失败"); }
    };

    // ========== NPC 背包与物品详情 ==========
    window.openNPCBackpackModal = function(npcId) {
        const npc = window.gameState.npcs.find(n => n.id === npcId);
        if (!npc) return;
        let modal = document.getElementById('modal-npc-backpack');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-npc-backpack';
            modal.className = 'modal-overlay hidden';
            document.body.appendChild(modal);
        }
        const inv = npc.inventory || [];
        const priv = npc.privateInventory || [];
        const privLocked = npc.privateLocked;
        modal.innerHTML = `
            <div class="modal-card">
                <div class="p-4 border-b flex justify-between"><h3>${escapeHtml(npc.name)} 的背包</h3><button onclick="closeNpcBackpackModal()">&times;</button></div>
                <div class="p-3 border-b flex gap-2"><button onclick="switchBackpackTab('normal')" id="bp-tab-normal" class="px-3 py-1 rounded-full text-xs bg-amber-500">🎒 背包物品</button><button onclick="switchBackpackTab('private')" id="bp-tab-private" class="px-3 py-1 rounded-full text-xs bg-gray-200">🔒 私密物品</button></div>
                <div id="bp-normal-panel" class="p-4 space-y-2"></div>
                <div id="bp-private-panel" class="p-4 space-y-2 hidden"></div>
                <div id="bp-item-detail" class="p-4 border-t hidden"><div class="font-bold">物品详情</div><div id="bp-item-detail-content"></div><div class="flex gap-2 mt-2"><button onclick="closeItemDetail()" class="border px-3 py-1 rounded">关闭</button></div></div>
            </div>
        `;
        renderBackpackContent(npc);
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
    };

    function renderBackpackContent(npc) {
        const normalPanel = document.getElementById('bp-normal-panel');
        const privatePanel = document.getElementById('bp-private-panel');
        if (!normalPanel) return;
        normalPanel.innerHTML = '';
        privatePanel.innerHTML = '';
        const inv = npc.inventory || [];
        const priv = npc.privateInventory || [];
        const privLocked = npc.privateLocked;
        inv.forEach((item, i) => {
            const div = document.createElement('div');
            div.className = "border rounded p-2 cursor-pointer hover:bg-gray-100";
            div.innerHTML = `<i class="fas fa-box"></i> ${escapeHtml(item.name)} <span class="text-xs text-gray-400">x${item.count || 1}</span>`;
            div.onclick = () => showBackpackItemDetail(item, 'normal', npc.id, i);
            normalPanel.appendChild(div);
        });
        if (inv.length === 0) normalPanel.innerHTML = '<p class="text-xs text-gray-400">背包空空如也</p>';
        if (privLocked) {
            privatePanel.innerHTML = `<div class="text-center py-4"><button onclick="unlockNpcPrivateBackpack('${npc.id}')" class="border px-4 py-2 rounded">🔓 撬开私密箱</button></div>`;
        } else {
            priv.forEach((item, i) => {
                const div = document.createElement('div');
                div.className = "border rounded p-2 cursor-pointer hover:bg-gray-100";
                div.innerHTML = `<i class="fas fa-lock-open"></i> ${escapeHtml(item.name)} <span class="text-xs text-gray-400">x${item.count || 1}</span>`;
                div.onclick = () => showBackpackItemDetail(item, 'private', npc.id, i);
                privatePanel.appendChild(div);
            });
            if (priv.length === 0) privatePanel.innerHTML = '<p class="text-xs text-gray-400">无私密物品</p>';
        }
    }

    window.switchBackpackTab = function(tab) {
        const normalPanel = document.getElementById('bp-normal-panel');
        const privatePanel = document.getElementById('bp-private-panel');
        const normalBtn = document.getElementById('bp-tab-normal');
        const privateBtn = document.getElementById('bp-tab-private');
        if (tab === 'normal') {
            normalPanel.classList.remove('hidden');
            privatePanel.classList.add('hidden');
            normalBtn.style.background = '#f59e0b';
            privateBtn.style.background = '#e5e7eb';
        } else {
            normalPanel.classList.add('hidden');
            privatePanel.classList.remove('hidden');
            normalBtn.style.background = '#e5e7eb';
            privateBtn.style.background = '#f59e0b';
        }
    };

    function showBackpackItemDetail(item, category, npcId, idx) {
        const detailDiv = document.getElementById('bp-item-detail');
        const contentDiv = document.getElementById('bp-item-detail-content');
        if (!detailDiv) return;
        contentDiv.innerHTML = `
            <div><span class="font-bold">${escapeHtml(item.name)}</span> (x${item.count || 1})</div>
            <div class="text-xs text-gray-500 mt-1">来源：${escapeHtml(item.source || '未知')}</div>
            <div class="text-sm mt-2">${escapeHtml(item.desc || '暂无描述')}</div>
            <div class="text-xs italic mt-2">${escapeHtml(item.comment || '')}</div>
            <div class="flex gap-2 mt-3"><button onclick="lootItem('${npcId}','${category}',${idx})" class="bg-red-500 text-white px-3 py-1 rounded text-xs">夺取</button></div>
        `;
        detailDiv.classList.remove('hidden');
    }

    window.lootItem = function(npcId, category, idx) {
        const npc = window.gameState.npcs.find(n => n.id === npcId);
        if (!npc) return;
        let item;
        if (category === 'normal') {
            item = npc.inventory[idx];
            npc.inventory.splice(idx, 1);
        } else {
            item = npc.privateInventory[idx];
            npc.privateInventory.splice(idx, 1);
        }
        if (!window.gameState.gameState.player.inventory) window.gameState.gameState.player.inventory = [];
        window.gameState.gameState.player.inventory.push(item);
        if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
        window.openNPCBackpackModal(npcId);
        window.showToast?.(`获得：${item.name}`);
    };

    window.unlockNpcPrivateBackpack = function(npcId) {
        const npc = window.gameState.npcs.find(n => n.id === npcId);
        if (npc) {
            npc.privateLocked = false;
            if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
            window.openNPCBackpackModal(npcId);
        }
    };

    window.closeNpcBackpackModal = function() {
        const modal = document.getElementById('modal-npc-backpack');
        if (modal) modal.style.display = 'none';
    };
    window.closeItemDetail = function() {
        const detail = document.getElementById('bp-item-detail');
        if (detail) detail.classList.add('hidden');
    };

    // ========== 物品详情模态框（主角背包） ==========
    window.openItemDetailModal = function(index) {
        const item = window.gameState.gameState?.player?.inventory?.[index];
        if (!item) return;
        const modalHtml = `
            <div id="modal-item-detail" class="modal-overlay" style="display:flex;">
                <div class="modal-card">
                    <div class="p-4 border-b flex justify-between"><h3>${escapeHtml(item.name)}</h3><button onclick="closeItemDetailModal()">&times;</button></div>
                    <div class="p-4 space-y-2">
                        <div>数量：${item.count || 1}</div>
                        <div>来源：${escapeHtml(item.source || '未知')}</div>
                        <div>描述：${escapeHtml(item.desc || '无')}</div>
                        <div class="flex gap-2 mt-3"><button onclick="useItemFromDetail()" class="bg-primary text-white px-3 py-1 rounded">使用</button><button onclick="openItemEditModal()" class="border px-3 py-1 rounded">编辑</button></div>
                    </div>
                </div>
            </div>`;
        const old = document.getElementById('modal-item-detail');
        if (old) old.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        window.currentItemDetailIndex = index;
    };
    window.closeItemDetailModal = function() {
        const modal = document.getElementById('modal-item-detail');
        if (modal) modal.remove();
    };
    window.openItemEditModal = function() {
        const idx = window.currentItemDetailIndex;
        const item = window.gameState.gameState?.player?.inventory?.[idx];
        if (!item) return;
        const modalHtml = `
            <div id="modal-item-edit" class="modal-overlay" style="display:flex;">
                <div class="modal-card">
                    <div class="p-4 border-b"><h3>编辑物品</h3></div>
                    <div class="p-4 space-y-3">
                        <input type="text" id="edit-item-name" value="${escapeHtml(item.name)}" class="w-full border rounded p-2" placeholder="名称">
                        <input type="number" id="edit-item-count" value="${item.count || 1}" class="w-full border rounded p-2" placeholder="数量">
                        <input type="text" id="edit-item-source" value="${escapeHtml(item.source || '')}" class="w-full border rounded p-2" placeholder="来源">
                        <textarea id="edit-item-desc" rows="3" class="w-full border rounded p-2" placeholder="描述">${escapeHtml(item.desc || '')}</textarea>
                    </div>
                    <div class="p-3 border-t flex gap-2"><button onclick="closeItemEditModal()" class="flex-1 border rounded">取消</button><button onclick="saveItemEdit(${idx})" class="flex-1 bg-primary text-white rounded">保存</button></div>
                </div>
            </div>`;
        const old = document.getElementById('modal-item-edit');
        if (old) old.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    };
    window.closeItemEditModal = function() {
        const modal = document.getElementById('modal-item-edit');
        if (modal) modal.remove();
    };
    window.saveItemEdit = function(idx) {
        const item = window.gameState.gameState?.player?.inventory?.[idx];
        if (!item) return;
        item.name = document.getElementById('edit-item-name').value;
        item.count = parseInt(document.getElementById('edit-item-count').value) || 1;
        item.source = document.getElementById('edit-item-source').value;
        item.desc = document.getElementById('edit-item-desc').value;
        if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
        if (typeof window.updatePanelUI === 'function') window.updatePanelUI();
        closeItemEditModal();
        window.openItemDetailModal(idx);
        window.showToast?.("物品已更新");
    };
    window.useItemFromDetail = function() {
        const idx = window.currentItemDetailIndex;
        const item = window.gameState.gameState?.player?.inventory?.[idx];
        if (item) {
            if (confirm(`确定要使用 ${item.name} 吗？`)) {
                if (item.count > 1) item.count--;
                else window.gameState.gameState.player.inventory.splice(idx, 1);
                if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
                if (typeof window.updatePanelUI === 'function') window.updatePanelUI();
                closeItemDetailModal();
                window.showToast?.(`使用了 ${item.name}`);
                // 可选：通知 AI
                if (typeof window.callAI === 'function') window.callAI(`我使用了背包里的【${item.name}】。`);
            }
        }
    };

    // ========== 主角/NPC 年龄生日编辑已在 features.js 中，确保函数存在 ==========
    // ========== 命运点数与时间线回溯 ==========
    window.openTimelineModal = function() {
        const milestones = window.DB.timelineMilestones || [];
        let html = `<div id="modal-timeline" class="modal-overlay" style="display:flex;"><div class="modal-card"><div class="p-4 border-b flex justify-between"><h3>关键抉择里程碑</h3><button onclick="closeTimelineModal()">&times;</button></div><div class="p-4 max-h-[60vh] overflow-y-auto">`;
        if (!milestones.length) html += '<p>暂无关键抉择记录</p>';
        else milestones.forEach((m, i) => {
            html += `<div class="border rounded p-2 mb-2"><div class="font-bold">${m.timestamp}</div><div>${m.description}</div><button onclick="selectTimelineNode(${i})" class="mt-1 text-xs bg-gray-200 px-2 py-1 rounded">回溯</button></div>`;
        });
        html += `<div class="mt-3 text-xs text-gray-500">消耗 1 命运点数可回溯至任一节点</div><div class="p-3 border-t"><button onclick="attemptTimelineRollback()" class="w-full bg-primary text-white py-2 rounded">确认回溯</button></div></div></div></div>`;
        const old = document.getElementById('modal-timeline');
        if (old) old.remove();
        document.body.insertAdjacentHTML('beforeend', html);
    };
    window.closeTimelineModal = function() {
        const modal = document.getElementById('modal-timeline');
        if (modal) modal.remove();
    };
    window.selectedTimelineIndex = null;
    window.selectTimelineNode = function(index) {
        window.selectedTimelineIndex = index;
        alert(`已选定节点，消耗1命运点数确认回溯`);
    };
    window.attemptTimelineRollback = function() {
        if (window.selectedTimelineIndex === null) { alert("请先选择一个节点"); return; }
        if ((window.DB.destinyPoints || 0) <= 0) { alert("命运点数不足！"); return; }
        const milestone = window.DB.timelineMilestones?.[window.selectedTimelineIndex];
        if (!milestone || !milestone.snapshot) { alert("节点快照已损坏"); return; }
        if (!confirm("回溯将丢失当前进度，确定消耗1命运点数回溯？")) return;
        window.DB.destinyPoints--;
        window.gameState.gameState = JSON.parse(JSON.stringify(milestone.snapshot));
        if (milestone.snapshot._worldTime) window.DB.worldTime = milestone.snapshot._worldTime;
        if (milestone.snapshot._weather) window.DB.weather = milestone.snapshot._weather;
        if (milestone.snapshot._festival) window.DB.festival = milestone.snapshot._festival;
        document.getElementById('gp-world-title').innerText = window.gameState.gameState.worldName;
        if (typeof window.updateGameplayHeaderLocation === 'function') window.updateGameplayHeaderLocation();
        if (typeof window.updateWorldTimeDisplay === 'function') window.updateWorldTimeDisplay();
        if (typeof window.updateWeatherDisplay === 'function') window.updateWeatherDisplay();
        if (typeof window.updateFestivalDisplay === 'function') window.updateFestivalDisplay();
        if (typeof window.switchScreen === 'function') window.switchScreen('screen-gameplay');
        if (typeof window.switchSubview === 'function') window.switchSubview('subview-story');
        document.getElementById('story-terminal').innerHTML = '<div class="text-xs italic">【蝴蝶效应】时间线已被修正...</div>';
        if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
        closeTimelineModal();
        if (typeof window.triggerContinueStory === 'function') window.triggerContinueStory();
    };

    // ========== 传闻系统 ==========
    window.toggleRumorPanel = function() {
        const panel = document.getElementById('rumor-panel');
        if (panel) panel.classList.toggle('hidden');
    };
    // generateRumor 已在 game-core.js 中实现，这里确保存在
    if (typeof window.generateRumor !== 'function') {
        window.generateRumor = async function(actionDesc) {
            const terminal = document.getElementById('story-terminal');
            const recentStory = terminal ? terminal.innerText.slice(-300) : actionDesc;
            if (!recentStory) return;
            try {
                const rumor = await window.callLLMRequest?.(`根据以下剧情生成一条传闻(30字内):\n${recentStory}`, "你是传闻生成器");
                if (rumor && rumor.trim()) {
                    if (!window.DB.rumors) window.DB.rumors = [];
                    window.DB.rumors.unshift(rumor.trim());
                    if (window.DB.rumors.length > 10) window.DB.rumors.pop();
                    const panel = document.getElementById('rumor-panel');
                    const text = document.getElementById('rumor-text');
                    if (panel && text) { text.innerText = rumor; panel.classList.remove('hidden'); }
                    if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
                }
            } catch(e) {}
        };
    }

    // ========== 深度记忆提取 ==========
    window.runAILoreSummarize = async function() {
        const termText = document.getElementById('story-terminal')?.innerText;
        if (!termText || termText.length < 50) { alert("故事细节过于单薄，无法归纳。"); return; }
        const prompt = document.getElementById('wb-summary-prompt')?.value || "请精简提炼并总结以下事件的重大影响，输出100字内的叙事备忘录：";
        try {
            const summary = await window.callLLMRequest?.(`${prompt}\n\n${termText.slice(-2000)}`, "你是编年史提炼大师");
            if (summary && window.gameState.gameState) {
                if (!window.gameState.gameState.worldBookEntries) window.gameState.gameState.worldBookEntries = [];
                window.gameState.gameState.worldBookEntries.push({ keywords: `快照-${Date.now()}`, text: summary.trim(), permanent: true, depth: 5 });
                if (typeof window.renderWorldBook === 'function') window.renderWorldBook();
                if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
                alert("历史记忆已浓缩注入世界书！");
            }
        } catch(e) { alert("记忆归纳失败"); }
    };
    window.saveSummaryPrompt = function() {
        const prompt = document.getElementById('wb-summary-prompt')?.value;
        if (prompt) localStorage.setItem("AI_WENYOU_SUMMARY_PROMPT", prompt);
        alert("深度记忆提取提示词已保存");
    };

    // ========== 辅助函数 ==========
    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }

    console.log("✅ final-fix.js 已加载，所有功能已修复");
})();
