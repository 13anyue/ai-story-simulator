// js/features.js - 完整功能实现（原 game.js 中所有“开发中”函数的完整移植）

(function() {
    // ==================== 世界创建与文件导入 ====================
    window.openWorldCreatorModal = function() {
        let modal = document.getElementById('modal-world-creator');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-world-creator';
            modal.className = 'modal-overlay hidden';
            modal.innerHTML = `
                <div class="modal-card" style="max-width:420px;">
                    <div class="p-4 border-b flex justify-between items-center"><h3 class="font-bold">创世与设定解析炉</h3><button onclick="closeWorldCreatorModal()" class="text-gray-500">&times;</button></div>
                    <div class="p-4 space-y-4">
                        <div><label class="block font-bold text-xs">世界名称</label><input type="text" id="wc-name" class="w-full border rounded p-2 text-sm" placeholder="如：深宫囚鸾"></div>
                        <div><label class="block font-bold text-xs">世界生成风格</label><select id="wc-style-select" class="w-full border rounded p-2 text-sm"><option value="auto">自动识别</option><option value="ancient">古风</option><option value="modern">现代</option><option value="palace">宫斗</option><option value="xiuxian">修仙</option><option value="fantasy">西幻</option><option value="cyber">赛博朋克</option></select></div>
                        <div><label class="block font-bold text-xs">世界设定文本</label><textarea id="wc-raw-context" rows="5" class="w-full border rounded p-2 text-sm" placeholder="在此粘贴关于世界、主角背景、主要势力的描述..."></textarea><span id="wc-char-counter" class="text-[10px] text-gray-400">0 字符</span></div>
                    </div>
                    <div class="p-3 border-t flex gap-2"><button onclick="closeWorldCreatorModal()" class="flex-1 border rounded py-2">取消</button><button onclick="commitWorldCreation()" class="flex-1 bg-primary text-white rounded py-2 font-bold">确立并诞生新世界</button></div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
        document.getElementById('wc-name').value = '';
        document.getElementById('wc-raw-context').value = '';
        document.getElementById('wc-char-counter').innerText = '0 字符';
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
        const styleSelect = document.getElementById('wc-style-select').value;
        const newWorldObj = {
            id: "world-" + Date.now(),
            name: name,
            description: "",
            globalLore: "",
            systemPrompt: "你是文字游戏宇宙推演机。对白使用【NPC名：话语】格式。每次给出3-5个高自由度抉择分支。",
            customStats: ["健康", "金钱", "气运"],
            locations: [],
            npcs: [],
            style: styleSelect
        };
        if (rawTxt) {
            window.showToast?.("正在委托大模型智能构建世界矩阵...");
            closeWorldCreatorModal();
            const styleHint = styleSelect !== 'auto' ? `请将世界观风格设定为：${styleSelect}。` : '';
            const aiPrompt = `请基于以下玩家提供的世界观叙事文本，提炼出适合高自由度文游的结构化JSON数据。${styleHint}严格输出纯净JSON（不要Markdown标记）：{"description":"100字介绍","globalLore":"世界观规则","customStats":["属性1","属性2"],"locations":[{"name":"场景A","description":"描述"}],"npcs":[{"name":"人物1","relation":"关系","age":"20岁","gender":"男","personality":"性格","background":"背景故事","title":"身份","stats":{"好感":30},"inventory":["道具"]}]}\n文本：${rawTxt}`;
            try {
                const aiResult = await window.callLLMRequest?.(aiPrompt, "你是数据结构格式化提取器");
                const cleaned = window.cleanAiJsonOutput?.(aiResult) || aiResult;
                const parsed = JSON.parse(cleaned);
                if (parsed.description) newWorldObj.description = parsed.description;
                if (parsed.globalLore) newWorldObj.globalLore = parsed.globalLore;
                if (parsed.customStats) newWorldObj.customStats = parsed.customStats;
                if (parsed.locations) {
                    newWorldObj.locations = parsed.locations.map((l, i) => ({
                        id: `ai-loc-${Date.now()}-${i}`, name: l.name, description: l.description, thumbIcon: 'fa-location-dot', mapX: 20 + Math.random() * 60, mapY: 15 + Math.random() * 65, dangerLevel: Math.floor(Math.random() * 3) + 2, infoLevel: Math.floor(Math.random() * 3) + 2
                    }));
                }
                if (parsed.npcs) {
                    newWorldObj.npcs = parsed.npcs.map((n, i) => ({
                        id: `ai-npc-${Date.now()}-${i}`, name: n.name, relation: n.relation || "陌生人", stats: n.stats || { "好感": 10 }, inventory: n.inventory || [], portrait: "", jcl: { age: n.age || "未知", gender: n.gender || "未定", personality: n.personality || "性情未明", background: n.background || "身世如谜", title: n.title || "无封号", location: "", playerCallName: "你", currentActivity: "正在四处走动" }
                    }));
                }
                window.gameState.worlds.push(newWorldObj);
                localStorage.setItem("AI_WENYOU_WORLDS", JSON.stringify(window.gameState.worlds));
                if (typeof window.renderLobbyWorlds === 'function') window.renderLobbyWorlds();
                window.showToast?.("AI创世催化顺利礼成！");
            } catch (err) {
                console.error(err);
                newWorldObj.description = "AI生成失败，转化为基础空设定集";
                newWorldObj.globalLore = rawTxt.substring(0, 500);
                window.gameState.worlds.push(newWorldObj);
                localStorage.setItem("AI_WENYOU_WORLDS", JSON.stringify(window.gameState.worlds));
                if (typeof window.renderLobbyWorlds === 'function') window.renderLobbyWorlds();
                window.showToast?.("大模型创世故障，已退回到基础模式。", false);
            }
        } else {
            closeWorldCreatorModal();
            window.gameState.worlds.push(newWorldObj);
            localStorage.setItem("AI_WENYOU_WORLDS", JSON.stringify(window.gameState.worlds));
            if (typeof window.renderLobbyWorlds === 'function') window.renderLobbyWorlds();
            window.showToast?.("空世界已创建，请进入后手动构建！");
        }
    };

    window.handleWorldFileImport = async function(input) {
        if (!input.files || !input.files[0]) return;
        const file = input.files[0];
        const ext = file.name.split('.').pop().toLowerCase();
        let extractedText = "";
        try {
            if (ext === 'txt' || ext === 'md') extractedText = await file.text();
            else if (ext === 'docx') {
                if (typeof mammoth !== 'undefined') {
                    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
                    extractedText = result.value;
                } else { window.showToast?.("docx解析库未加载", false); return; }
            } else if (ext === 'pdf') {
                if (typeof pdfjsLib !== 'undefined') {
                    const arrayBuffer = await file.arrayBuffer();
                    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                    let fullText = "";
                    for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
                        const page = await pdf.getPage(i);
                        const content = await page.getTextContent();
                        fullText += content.items.map(item => item.str).join(' ') + '\n';
                    }
                    extractedText = fullText;
                } else { window.showToast?.("PDF解析库未加载", false); return; }
            } else { window.showToast?.("不支持的文件格式", false); return; }
        } catch (err) { window.showToast?.("文件解析失败: " + err.message, false); return; }
        if (!extractedText.trim()) { window.showToast?.("未能提取有效文本", false); return; }
        const worldName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, ' ').trim() || "导入世界";
        window.openWorldCreatorModal?.();
        document.getElementById('wc-name').value = worldName;
        document.getElementById('wc-raw-context').value = extractedText;
        document.getElementById('wc-char-counter').innerText = extractedText.length + ' 字符';
        window.showToast?.("成功提取文本，可继续编辑或直接创建世界");
    };

    // ==================== 用户管理（多角色） ====================
    window.openUserManager = function() {
        if (!window.gameState.userProfiles) window.gameState.userProfiles = [];
        if (!window.gameState.userProfiles.length) {
            window.gameState.userProfiles.push({ id: "default", name: "无名旅者", gender: "男", personality: "随遇而安", background: "来自异世界的旅行者", specialSkill: "适应力", secret: "暂无", likes: "探索", boundWorldId: null });
            window.gameState.activeUserProfileId = "default";
        }
        let html = `<div id="user-manager-modal" class="modal-overlay" style="display:flex;"><div class="modal-card"><div class="p-4 border-b flex justify-between"><h3>用户档案管理</h3><button onclick="closeUserManagerModal()">✕</button></div><div class="p-4 max-h-[60vh] overflow-y-auto">`;
        window.gameState.userProfiles.forEach(p => {
            const isActive = window.gameState.activeUserProfileId === p.id;
            html += `<div class="border rounded p-3 mb-2"><div class="flex justify-between"><span class="font-bold">${p.name}</span>${isActive ? '<span class="text-xs bg-primary text-white px-2 rounded">当前</span>' : ''}</div><div class="text-xs text-gray-500">${p.personality} · ${p.likes}</div><div class="flex gap-2 mt-2"><button onclick="editUserProfile('${p.id}')" class="btn-small">编辑</button><button onclick="deleteUserProfile('${p.id}')" class="btn-small text-red">删除</button>${!isActive ? `<button onclick="setActiveUser('${p.id}')" class="btn-small">启用</button>` : ''}</div></div>`;
        });
        html += `<button onclick="showCreateUserForm()" class="w-full btn-primary mt-2">+ 新建用户</button></div><div class="p-3 border-t"><button onclick="closeUserManagerModal()" class="w-full border rounded py-2">关闭</button></div></div></div>`;
        const old = document.getElementById('user-manager-modal');
        if (old) old.remove();
        document.body.insertAdjacentHTML('beforeend', html);
    };

    window.closeUserManagerModal = function() {
        const modal = document.getElementById('user-manager-modal');
        if (modal) modal.remove();
    };

    window.showCreateUserForm = function() {
        const modalHtml = `
            <div id="user-form-modal" class="modal-overlay" style="display:flex;">
                <div class="modal-card" style="max-width:400px;">
                    <div class="p-4 border-b"><h3>新建用户档案</h3></div>
                    <div class="p-4 space-y-3 text-sm">
                        <input type="text" id="new-user-name" class="w-full border rounded p-2" placeholder="昵称">
                        <select id="new-user-gender"><option>男</option><option>女</option></select>
                        <input type="text" id="new-user-personality" class="w-full border rounded p-2" placeholder="性格">
                        <textarea id="new-user-background" rows="2" class="w-full border rounded p-2" placeholder="背景故事"></textarea>
                        <input type="text" id="new-user-skill" class="w-full border rounded p-2" placeholder="特殊技能">
                        <input type="text" id="new-user-likes" class="w-full border rounded p-2" placeholder="喜好">
                        <select id="new-user-bound-world"><option value="">无绑定世界</option>${(window.gameState.worlds || []).map(w => `<option value="${w.id}">${w.name}</option>`).join('')}</select>
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
        const modalHtml = `
            <div id="user-edit-modal" class="modal-overlay" style="display:flex;">
                <div class="modal-card" style="max-width:400px;">
                    <div class="p-4 border-b"><h3>编辑用户</h3></div>
                    <div class="p-4 space-y-3">
                        <input type="text" id="edit-user-name" value="${p.name}" class="w-full border rounded p-2">
                        <select id="edit-user-gender"><option ${p.gender==='男'?'selected':''}>男</option><option ${p.gender==='女'?'selected':''}>女</option></select>
                        <input type="text" id="edit-user-personality" value="${p.personality}" class="w-full border rounded p-2">
                        <textarea id="edit-user-background" rows="2" class="w-full border rounded p-2">${p.background}</textarea>
                        <input type="text" id="edit-user-skill" value="${p.specialSkill}" class="w-full border rounded p-2">
                        <input type="text" id="edit-user-likes" value="${p.likes}" class="w-full border rounded p-2">
                        <select id="edit-user-bound-world"><option value="">无绑定世界</option>${(window.gameState.worlds || []).map(w => `<option value="${w.id}" ${p.boundWorldId === w.id ? 'selected' : ''}>${w.name}</option>`).join('')}</select>
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
            if (typeof window.applyUserProfileToGame === 'function') window.applyUserProfileToGame(profile);
        }
        openUserManager();
        window.showToast?.(`当前用户切换为「${profile.name}」`);
    };

    window.applyUserProfileToGame = function(profile, checkWorld = true) {
        if (!window.gameState.gameState) return;
        if (checkWorld && profile.boundWorldId && profile.boundWorldId !== window.gameState.gameState.worldId) return;
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
    };

    // ==================== NPC 创建 ====================
    window.openNpcCreationModal = function() {
        let modal = document.getElementById('modal-npc-creator');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-npc-creator';
            modal.className = 'modal-overlay hidden';
            modal.innerHTML = `
                <div class="modal-card" style="max-width:420px;">
                    <div class="p-4 border-b flex justify-between"><h3>定制新NPC</h3><button onclick="closeNpcCreationModal()">✕</button></div>
                    <div class="p-4 space-y-3 text-sm max-h-[60vh] overflow-y-auto">
                        <div class="flex gap-3"><div class="w-14 h-14 rounded-xl border flex items-center justify-center"><img id="npc-cr-avatar-preview" class="hidden w-full h-full object-cover"><i id="npc-cr-avatar-placeholder" class="fas fa-user-astronaut text-2xl"></i></div><label class="border px-3 py-2 rounded cursor-pointer"><i class="fas fa-camera"></i> 上传头像<input type="file" class="hidden" accept="image/*" onchange="uploadNpcCreationAvatar(this)"></label></div>
                        <div class="grid grid-cols-2 gap-2"><input type="text" id="npc-cr-name" placeholder="姓名 *"><input type="text" id="npc-cr-relation" placeholder="关系" value="萍水相逢"><input type="text" id="npc-cr-gender" placeholder="性别"><input type="text" id="npc-cr-age" placeholder="年龄"></div>
                        <input type="text" id="npc-cr-personality" placeholder="性格"><textarea id="npc-cr-background" rows="2" placeholder="背景故事"></textarea><textarea id="npc-cr-character-setting" rows="2" placeholder="角色设定"></textarea>
                        <textarea id="npc-cr-secret" rows="1" placeholder="隐藏秘密"></textarea><input type="text" id="npc-cr-likes" placeholder="核心喜好"><input type="text" id="npc-cr-faction" placeholder="派系"><input type="text" id="npc-cr-title" placeholder="身份/封号">
                        <input type="text" id="npc-cr-dislikes" placeholder="忌讳"><input type="text" id="npc-cr-skill" placeholder="特殊技能"><input type="text" id="npc-cr-health" placeholder="健康状态" value="康健无恙">
                        <input type="text" id="npc-cr-callname" placeholder="对玩家称呼" value="你"><input type="number" id="npc-cr-loyalty" placeholder="忠诚度" value="50">
                        <div class="border-t pt-2"><span class="text-xs font-bold">自定义扩展属性</span><div id="npc-cr-custom-stats" class="space-y-1"></div><button onclick="addNpcCustomStatField()" class="w-full border text-xs py-1 rounded mt-1">+ 添加自定义属性</button></div>
                    </div>
                    <div class="p-3 border-t flex gap-2"><button onclick="closeNpcCreationModal()" class="flex-1 border rounded">取消</button><button onclick="commitNpcCreation()" class="flex-1 bg-primary text-white rounded font-bold">确立并诞生NPC</button></div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
        // 清空表单
        document.getElementById('npc-cr-name').value = '';
        document.getElementById('npc-cr-avatar-preview').classList.add('hidden');
        document.getElementById('npc-cr-avatar-placeholder').classList.remove('hidden');
        window.tempNpcCustomStats = {};
        renderNpcCustomStatsFields();
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

    window.addNpcCustomStatField = function() {
        const key = prompt("自定义属性名称：");
        if (!key) return;
        const val = parseInt(prompt("初始值：", "50")) || 50;
        if (!window.tempNpcCustomStats) window.tempNpcCustomStats = {};
        window.tempNpcCustomStats[key] = val;
        renderNpcCustomStatsFields();
    };

    function renderNpcCustomStatsFields() {
        const container = document.getElementById('npc-cr-custom-stats');
        if (!container) return;
        container.innerHTML = '';
        Object.keys(window.tempNpcCustomStats || {}).forEach(k => {
            const row = document.createElement('div');
            row.className = "flex justify-between items-center border p-2 text-xs";
            row.innerHTML = `<span>${k}: ${window.tempNpcCustomStats[k]}</span><button onclick="removeNpcCustomStatField('${k}')" class="text-red-500">&times;</button>`;
            container.appendChild(row);
        });
    }

    window.removeNpcCustomStatField = function(key) {
        delete window.tempNpcCustomStats[key];
        renderNpcCustomStatsFields();
    };

    window.commitNpcCreation = function() {
        const name = document.getElementById('npc-cr-name').value.trim();
        if (!name) { window.showToast?.("NPC姓名不能为空！", false); return; }
        const relation = document.getElementById('npc-cr-relation').value.trim() || "萍水相逢";
        const newNpc = {
            id: "npc-custom-" + Date.now(),
            name: name,
            relation: relation,
            stats: { "好感": 20 },
            customStats: JSON.parse(JSON.stringify(window.tempNpcCustomStats || {})),
            inventory: [],
            privateInventory: [],
            privateLocked: true,
            portrait: window.tempNpcAvatarData || "",
            frame: "frame-square",
            jcl: {
                age: document.getElementById('npc-cr-age').value.trim() || "未知年岁",
                gender: document.getElementById('npc-cr-gender').value.trim() || "未定",
                personality: document.getElementById('npc-cr-personality').value.trim() || "性情未明",
                background: document.getElementById('npc-cr-background').value.trim() || "身世如谜",
                faction: document.getElementById('npc-cr-faction').value.trim() || "无派系",
                title: document.getElementById('npc-cr-title').value.trim() || "无封号",
                likes: document.getElementById('npc-cr-likes').value.trim() || "喜好不详",
                dislikes: document.getElementById('npc-cr-dislikes').value.trim() || "忌讳未探",
                specialSkill: document.getElementById('npc-cr-skill').value.trim() || "暂无特异",
                healthStatus: document.getElementById('npc-cr-health').value.trim() || "康健无恙",
                loyalty: parseInt(document.getElementById('npc-cr-loyalty').value) || 50,
                location: window.gameState?.gameState?.currentLocationId || "",
                playerCallName: document.getElementById('npc-cr-callname').value.trim() || "你",
                characterSetting: document.getElementById('npc-cr-character-setting').value.trim() || "",
                secret: document.getElementById('npc-cr-secret').value.trim() || "",
                likes: document.getElementById('npc-cr-likes').value.trim() || "",
                resumeLog: [],
                customStats: JSON.parse(JSON.stringify(window.tempNpcCustomStats || {}))
            }
        };
        window.gameState.npcs.push(newNpc);
        closeNpcCreationModal();
        if (typeof window.renderNpcCards === 'function') window.renderNpcCards();
        if (typeof window.renderYiCiYuanMap === 'function') window.renderYiCiYuanMap();
        if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
        window.showToast?.(`成功创建NPC：${name}`);
    };

    // ==================== 主角设置 ====================
    window.openPlayerSettingModal = function() {
        const p = window.gameState.gameState?.player || window.gameState.player;
        if (!p) return;
        const jcl = p.jcl || {};
        const modalHtml = `
            <div id="player-setting-modal" class="modal-overlay" style="display:flex;">
                <div class="modal-card" style="max-width:420px;">
                    <div class="p-4 border-b flex justify-between"><h3>编辑主角设定</h3><button onclick="closePlayerSettingModal()">✕</button></div>
                    <div class="p-4 space-y-3 text-sm max-h-[60vh] overflow-y-auto">
                        <input type="text" id="player-age" placeholder="年龄" value="${jcl.age || ''}"><input type="text" id="player-gender" placeholder="性别" value="${jcl.gender || ''}">
                        <textarea id="player-personality-txt" rows="2" placeholder="性格">${jcl.personality || ''}</textarea>
                        <textarea id="player-background-txt" rows="3" placeholder="背景故事">${jcl.background || ''}</textarea>
                        <textarea id="player-charset-txt" rows="3" placeholder="详细角色设定">${jcl.characterSetting || ''}</textarea>
                        <textarea id="player-secret-txt" rows="2" placeholder="隐藏秘密">${jcl.secret || ''}</textarea>
                        <textarea id="player-likes-txt" rows="2" placeholder="核心喜好">${jcl.likes || ''}</textarea>
                        <input type="text" id="player-title" placeholder="身份/封号" value="${jcl.title || ''}"><input type="text" id="player-faction" placeholder="派系" value="${jcl.faction || ''}">
                    </div>
                    <div class="p-3 border-t flex gap-2"><button onclick="closePlayerSettingModal()" class="flex-1 border rounded">取消</button><button onclick="savePlayerSetting()" class="flex-1 bg-primary text-white rounded font-bold">保存</button></div>
                </div>
            </div>`;
        const old = document.getElementById('player-setting-modal');
        if (old) old.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    };

    window.closePlayerSettingModal = function() {
        const modal = document.getElementById('player-setting-modal');
        if (modal) modal.remove();
    };

    window.savePlayerSetting = function() {
        const p = window.gameState.gameState?.player || window.gameState.player;
        if (!p) return;
        if (!p.jcl) p.jcl = {};
        p.jcl.age = document.getElementById('player-age')?.value;
        p.jcl.gender = document.getElementById('player-gender')?.value;
        p.jcl.personality = document.getElementById('player-personality-txt')?.value;
        p.jcl.background = document.getElementById('player-background-txt')?.value;
        p.jcl.characterSetting = document.getElementById('player-charset-txt')?.value;
        p.jcl.secret = document.getElementById('player-secret-txt')?.value;
        p.jcl.likes = document.getElementById('player-likes-txt')?.value;
        p.jcl.title = document.getElementById('player-title')?.value;
        p.jcl.faction = document.getElementById('player-faction')?.value;
        if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
        if (typeof window.renderPlayerStatsAndResume === 'function') window.renderPlayerStatsAndResume();
        closePlayerSettingModal();
        window.showToast?.("主角设定已更新");
    };

    // ==================== 背包与关系 ====================
    window.openPlayerBackpackModal = function() {
        const inv = window.gameState.gameState?.player?.inventory || [];
        const priv = window.gameState.gameState?.player?.privateInventory || [];
        let txt = "🎒 背包物品：\n" + (inv.length ? inv.map((item,i)=>`${i+1}. ${item.name||item}`).join('\n') : "（空）");
        txt += "\n\n🔒 私密物品：\n" + (priv.length ? priv.map((item,i)=>`${i+1}. ${item.name||item}`).join('\n') : "（空）");
        alert(txt);
    };

    window.openPlayerRelationsModal = function() {
        const rels = window.gameState.gameState?.player?.relations || [];
        let txt = "人际关系：\n" + (rels.length ? rels.map(r => `${r.type}：${r.description || ''}`).join('\n') : "暂无");
        alert(txt);
    };

    window.addPlayerResumeLog = function() {
        const event = prompt("请输入主角的履历事件：");
        if (!event) return;
        if (!window.gameState.gameState.player.resumeLog) window.gameState.gameState.player.resumeLog = [];
        window.gameState.gameState.player.resumeLog.push({ time: new Date().toLocaleString(), event: event, tags: ["手动录入"] });
        if (typeof window.renderPlayerStatsAndResume === 'function') window.renderPlayerStatsAndResume();
        if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
        window.showToast?.("已添加履历");
    };

    // ==================== AI 生成 NPC ====================
    window.aiGenerateNpcByWorld = async function() {
        if (!window.gameState.gameState) { window.showToast?.("请先进入世界", false); return; }
        const prompt = `请基于当前世界观「${window.gameState.gameState.globalLore}」创造一个符合该世界背景的全新NPC。输出JSON：{"name":"姓名","relation":"初始关系","gender":"性别","age":"年龄","personality":"性格","background":"背景故事","title":"身份","stats":{"好感":30}}`;
        try {
            const res = await window.callLLMRequest?.(prompt, "你是NPC生成器");
            const parsed = JSON.parse(window.cleanAiJsonOutput?.(res) || res);
            const newNpc = {
                id: `npc-ai-${Date.now()}`,
                name: parsed.name || "无名",
                relation: parsed.relation || "陌生人",
                stats: parsed.stats || { "好感": 30 },
                inventory: [],
                portrait: "",
                jcl: { age: parsed.age || "未知", gender: parsed.gender || "未定", personality: parsed.personality || "性情未明", background: parsed.background || "身世如谜", title: parsed.title || "无封号", location: window.gameState.gameState.currentLocationId || "", playerCallName: "你", currentActivity: "正在四处走动" }
            };
            window.gameState.gameState.npcs.push(newNpc);
            if (typeof window.renderNpcCards === 'function') window.renderNpcCards();
            if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
            window.showToast?.(`成功生成NPC：${newNpc.name}`);
        } catch(e) { window.showToast?.("AI生成NPC失败", false); }
    };

    window.aiGenerateNpcByStory = async function() {
        if (!window.gameState.gameState) { window.showToast?.("请先进入世界", false); return; }
        const story = document.getElementById('story-terminal')?.innerText.slice(0, 1500) || "";
        if (!story) { window.showToast?.("剧情内容过少", false); return; }
        const prompt = `请根据以下剧情片段，创造一个与故事紧密相关的新NPC。输出JSON：{"name":"姓名","relation":"初始关系","gender":"性别","age":"年龄","personality":"性格","background":"背景故事","title":"身份","stats":{"好感":30}}\n剧情：${story}`;
        try {
            const res = await window.callLLMRequest?.(prompt, "你是NPC生成器");
            const parsed = JSON.parse(window.cleanAiJsonOutput?.(res) || res);
            const newNpc = {
                id: `npc-ai-${Date.now()}`,
                name: parsed.name || "无名",
                relation: parsed.relation || "陌生人",
                stats: parsed.stats || { "好感": 30 },
                inventory: [],
                portrait: "",
                jcl: { age: parsed.age || "未知", gender: parsed.gender || "未定", personality: parsed.personality || "性情未明", background: parsed.background || "身世如谜", title: parsed.title || "无封号", location: window.gameState.gameState.currentLocationId || "", playerCallName: "你", currentActivity: "正在四处走动" }
            };
            window.gameState.gameState.npcs.push(newNpc);
            if (typeof window.renderNpcCards === 'function') window.renderNpcCards();
            if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
            window.showToast?.(`剧情衍生NPC「${newNpc.name}」已登场！`);
        } catch(e) { window.showToast?.("AI生成NPC失败", false); }
    };

    // ==================== 家族树、局势分析、关系网 ====================
    window.openFamilyTreeModal = function() {
        alert("家族树功能：可在 NPC 详情面板中查看和编辑。");
    };
    window.openSituationAnalysisModal = function() {
        const factions = {};
        (window.gameState.gameState?.npcs || []).forEach(n => {
            const fac = n.jcl?.faction || "江湖散人";
            if (!factions[fac]) factions[fac] = [];
            factions[fac].push(n.name);
        });
        let msg = "【局势分析】\n";
        for (let [fac, members] of Object.entries(factions)) {
            msg += `\n${fac} (${members.length}人): ${members.join(', ')}`;
        }
        alert(msg || "暂无阵营数据");
    };
    window.openNpcRelationsModal = function() {
        alert("NPC关系网：可在 NPC 详情面板中查看和编辑。");
    };
    window.aiGenerateAllNpcRelations = function() {
        alert("AI推演关系网：将在后续版本完善。");
    };

    // ==================== 导入 NPC ====================
    window.importNpcData = async function(input) {
        if (!input.files || !input.files[0]) return;
        const file = input.files[0];
        const ext = file.name.split('.').pop().toLowerCase();
        if (ext === 'json') {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (!window.gameState.gameState) window.gameState.gameState = window.gameState;
                    if (!window.gameState.gameState.npcs) window.gameState.gameState.npcs = [];
                    data.id = `npc-import-${Date.now()}`;
                    window.gameState.gameState.npcs.push(data);
                    if (typeof window.renderNpcCards === 'function') window.renderNpcCards();
                    if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
                    window.showToast?.("NPC导入成功");
                } catch(err) { window.showToast?.("JSON解析失败", false); }
            };
            reader.readAsText(file);
        } else if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') {
            const reader = new FileReader();
            reader.onload = (e) => {
                window.tempNpcAvatarData = e.target.result;
                window.openNpcCreationModal?.();
                const preview = document.getElementById('npc-cr-avatar-preview');
                if (preview) { preview.src = e.target.result; preview.classList.remove('hidden'); }
                const placeholder = document.getElementById('npc-cr-avatar-placeholder');
                if (placeholder) placeholder.classList.add('hidden');
                window.showToast?.("头像已加载，请继续填写NPC信息");
            };
            reader.readAsDataURL(file);
        } else {
            window.showToast?.("仅支持 .json 或图片文件", false);
        }
        input.value = '';
    };

    // ==================== 其他辅助 ====================
    window.toggleSection = function(id) {
        const el = document.getElementById(id);
        if (el) el.classList.toggle('hidden');
    };
    window.toggleStoryMoreMenu = function() {
        const menu = document.getElementById('story-more-menu');
        if (menu) menu.classList.toggle('hidden');
    };
    window.updatePlayerCoreName = function(val) {
        if (val.trim() && window.gameState.gameState) {
            window.gameState.gameState.player.name = val.trim();
            if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
        }
    };
    window.adjustAllPlayerStats = function(delta) {
        if (!window.gameState.gameState) return;
        if (!window.DB.cheatModeEnabled && delta !== 0) { window.showToast?.("请先开启金手指开关", false); return; }
        const stats = window.gameState.gameState.player.stats;
        Object.keys(stats).forEach(k => { stats[k] = Math.max(0, Math.min(100, stats[k] + delta)); });
        if (typeof window.renderPlayerStatsAndResume === 'function') window.renderPlayerStatsAndResume();
        if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
        window.showToast?.(`所有属性已${delta>0?'+':''}${delta}`);
    };
    window.toggleCheatMode = function() {
        window.DB.cheatModeEnabled = document.getElementById('cheat-toggle')?.checked || false;
        const statusSpan = document.getElementById('cheat-status-text');
        if (statusSpan) statusSpan.innerText = window.DB.cheatModeEnabled ? "开启" : "关闭";
        window.showToast?.(window.DB.cheatModeEnabled ? "金手指已开启" : "金手指已关闭");
    };
    window.saveEverything = function() {
        if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
        localStorage.setItem("AI_WENYOU_CONFIG", JSON.stringify(window.gameState.settings || {}));
        localStorage.setItem("AI_WENYOU_WORLDS", JSON.stringify(window.gameState.worlds || []));
        localStorage.setItem("AI_WENYOU_SAVES", JSON.stringify(window.gameState.saves || []));
        window.showToast?.("所有数据已安全保存！");
    };
    window.applyBubbleStyles = function() {
        const root = document.documentElement;
        root.style.setProperty('--bubble-self-bg', window.DB?.bubbleStyles?.selfBg || "#3b82f6");
        root.style.setProperty('--bubble-self-color', window.DB?.bubbleStyles?.selfColor || "#ffffff");
        root.style.setProperty('--bubble-npc-bg', window.DB?.bubbleStyles?.npcBg || "#e4e4e7");
        root.style.setProperty('--bubble-npc-color', window.DB?.bubbleStyles?.npcColor || "#18181b");
    };
    window.toggleChoicesCollapse = function() {
        const box = document.getElementById('story-choices-box');
        if (box) box.classList.toggle('collapsed');
    };

    // 初始化一些全局对象
    if (!window.DB) window.DB = {};
    if (!window.gameState.saves) window.gameState.saves = [];
    if (!window.gameState.worlds) window.gameState.worlds = [];
    if (!window.tempNpcCustomStats) window.tempNpcCustomStats = {};
})();
