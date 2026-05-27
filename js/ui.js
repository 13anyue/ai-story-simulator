const UI = {
    pages: {},
    currentPage: null,
    init() {
        this.pages = {
            home: document.getElementById('page-home'),
            apiConfig: document.getElementById('page-api-config'),
            profile: document.getElementById('page-profile'),
            presets: document.getElementById('page-presets'),
            theme: document.getElementById('page-theme'),
            createGame: document.getElementById('page-create-game'),
            game: document.getElementById('page-game')
        };
        this.bindGlobalEvents();
    },
    showPage(pageId) {
        Object.values(this.pages).forEach(p => p.classList.remove('active'));
        if (this.pages[pageId]) {
            this.pages[pageId].classList.add('active');
            this.currentPage = pageId;
            // 刷新对应页面内容
            if (pageId === 'home') {
                this.renderWorldCards();
                this.updateWelcomeName();
            } else if (pageId === 'profile') {
                this.renderPersonas();
                this.renderWorldSelect();
            } else if (pageId === 'presets') {
                this.renderPresets();
            } else if (pageId === 'game') {
                this.refreshGameUI();
            } else if (pageId === 'apiConfig') {
                this.loadApiFields();
            }
        }
    },
    bindGlobalEvents() {
        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget.dataset.target;
                if (target) this.showPage(target);
            });
        });
    },
    updateWelcomeName() {
        const persona = AppState.personaList.find(p => p.id === AppState.activePersonaId);
        document.getElementById('welcome-name').textContent = persona ? persona.name : '旅行者';
        document.getElementById('avatar-display').textContent = persona ? persona.name[0] : '?';
    },
    renderWorldCards() {
        const container = document.getElementById('world-cards-container');
        const empty = document.getElementById('empty-worlds');
        if (!AppState.worldList.length) {
            container.innerHTML = '';
            empty.classList.remove('hidden');
            return;
        }
        empty.classList.add('hidden');
        container.innerHTML = AppState.worldList.map(w => `
            <div class="world-card" data-world-id="${w.id}">
                <h4>${w.name}</h4>
                <p>${w.rules ? w.rules.substring(0,60)+'...' : '无描述'}</p>
                <div class="world-card-actions">
                    <button class="btn-sm btn-outline enter-world-btn"><i class="fas fa-play"></i> 进入</button>
                    <button class="btn-sm btn-outline delete-world-btn" data-id="${w.id}"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');
        container.querySelectorAll('.enter-world-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const worldId = e.target.closest('.world-card').dataset.worldId;
                AppState.loadWorld(worldId);
            });
        });
        container.querySelectorAll('.delete-world-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = e.target.closest('.delete-world-btn').dataset.id;
                AppState.deleteWorld(id);
            });
        });
    },
    renderPersonas() {
        const list = document.getElementById('persona-list');
        const empty = document.getElementById('empty-personas');
        if (!AppState.personaList.length) {
            list.innerHTML = '';
            empty.classList.remove('hidden');
            return;
        }
        empty.classList.add('hidden');
        list.innerHTML = AppState.personaList.map(p => `
            <div class="persona-card">
                <strong>${p.name}</strong>
                <span class="text-dim">绑定世界：${p.worldBind || '无'}</span>
                <button class="btn-sm btn-outline select-persona" data-id="${p.id}">选择</button>
            </div>
        `).join('');
        list.querySelectorAll('.select-persona').forEach(btn => {
            btn.addEventListener('click', () => {
                AppState.activePersonaId = btn.dataset.id;
                this.updateWelcomeName();
                UI.showToast('已切换面具角色');
            });
        });
    },
    renderWorldSelect() {
        const select = document.getElementById('select-default-world');
        select.innerHTML = '<option value="">-- 未选择 --</option>' +
            AppState.worldList.map(w => `<option value="${w.id}">${w.name}</option>`).join('');
        if (AppState.activePersonaId) {
            const persona = AppState.personaList.find(p => p.id === AppState.activePersonaId);
            if (persona) select.value = persona.worldBind || '';
        }
        select.onchange = () => {
            if (AppState.activePersonaId) {
                const persona = AppState.personaList.find(p => p.id === AppState.activePersonaId);
                if (persona) persona.worldBind = select.value;
                localStorage.setItem('personaList', JSON.stringify(AppState.personaList));
            }
        };
    },
    renderPresets() {
        const container = document.getElementById('preset-list');
        container.innerHTML = AppState.presets.map(p => `
            <div class="preset-card">
                <h4>${p.name}</h4>
                <p>${p.content.substring(0,80)}...</p>
                <button class="btn-sm btn-outline edit-preset" data-id="${p.id}">编辑</button>
            </div>
        `).join('');
    },
    refreshGameUI() {
        if (!AppState.gameInstance) return;
        const g = AppState.gameInstance;
        document.getElementById('game-world-badge').textContent = g.worldName;
        document.getElementById('game-weather').innerHTML = `<i class="fas fa-${g.weather==='晴'?'sun':g.weather==='阴'?'cloud':'cloud-rain'}"></i> ${g.weather}`;
        document.getElementById('game-time').textContent = `${g.time}·${g.season}`;
        document.getElementById('game-date').textContent = `第${g.day}天`;
        const festivalEl = document.getElementById('game-festival');
        if (g.activeFestival) {
            festivalEl.classList.remove('hidden');
            festivalEl.innerHTML = `<i class="fas fa-star"></i> ${g.activeFestival}`;
        } else festivalEl.classList.add('hidden');
        this.renderPlayerStats();
        this.renderInventory();
        this.renderNpcList();
        this.renderLifeLog();
        this.renderLocations();
        this.renderSaveSlots();
        this.renderFestivalTags();
    },
    renderPlayerStats() {
        const g = AppState.gameInstance;
        document.getElementById('player-name-display').textContent = g.player.name;
        document.getElementById('player-title-display').textContent = g.player.title;
        document.getElementById('player-avatar-large').textContent = g.player.name.charAt(0);
        const statsDiv = document.getElementById('player-stats');
        statsDiv.innerHTML = Object.entries(g.player.stats).map(([k,v]) => `<span class="tag">${k}: ${v}</span>`).join('');
    },
    renderInventory() {
        const g = AppState.gameInstance;
        const grid = document.getElementById('inventory-grid');
        grid.innerHTML = g.player.inventory.map(i => `
            <div class="item-card tag" data-item-id="${i.id}" title="${i.desc || ''}">
                <i class="fas ${i.icon || 'fa-box'}"></i> ${i.name}
            </div>
        `).join('');
        const privGrid = document.getElementById('private-items-grid');
        privGrid.innerHTML = g.player.privateItems.map(i => `
            <div class="item-card tag" data-item-id="${i.id}"><i class="fas fa-lock"></i> ${i.name}</div>
        `).join('');
        document.getElementById('item-count').textContent = g.player.inventory.length + '件';
    },
    renderNpcList() {
        const g = AppState.gameInstance;
        const container = document.getElementById('npc-list');
        container.innerHTML = g.npcs.map(npc => `
            <div class="npc-card" data-npc-id="${npc.id}">
                <div class="npc-avatar">${npc.avatarChar||npc.name[0]}</div>
                <div class="npc-info"><strong>${npc.name}</strong> <span class="text-dim">${npc.title||''}</span></div>
                <div class="npc-actions">
                    ${npc.interactions.slice(0,2).map(a => `<button class="btn-sm btn-outline interact-btn" data-action="${a}">${a}</button>`).join('')}
                </div>
            </div>
        `).join('');
        container.querySelectorAll('.interact-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const npcId = e.target.closest('.npc-card').dataset.npcId;
                const action = e.target.dataset.action;
                AppState.interactWithNpc(npcId, action);
            });
        });
        container.querySelectorAll('.npc-card').forEach(card => {
            card.addEventListener('click', () => {
                const npcId = card.dataset.npcId;
                this.showNpcDetail(npcId);
            });
        });
    },
    showNpcDetail(npcId) {
        const npc = AppState.gameInstance.npcs.find(n => n.id === npcId);
        if (!npc) return;
        const content = document.getElementById('modal-content');
        content.innerHTML = `
            <h3>${npc.name} <small>${npc.title||''}</small></h3>
            <p><strong>背景：</strong>${npc.background||'无'}</p>
            <p><strong>属性：</strong>${Object.entries(npc.stats).map(([k,v])=>`${k}:${v}`).join(', ')}</p>
            <p><strong>家族：</strong>${GameSystems.getFamilyTree(npc)}</p>
            <div class="btn-row">
                <button class="btn-sm btn-outline" id="btn-open-npc-phone"><i class="fas fa-mobile-alt"></i> 查看手机</button>
                <button class="btn-sm btn-outline" id="btn-edit-npc-interactions">编辑交互</button>
            </div>
            <div id="npc-interaction-editor" class="hidden">
                <div class="tag-manager" id="npc-interaction-tags"></div>
                <input type="text" id="new-npc-interaction" placeholder="新交互类型" class="form-input-sm">
                <button class="btn-sm btn-outline" id="btn-add-npc-interaction">添加</button>
            </div>
        `;
        document.getElementById('modal-overlay').classList.remove('hidden');
        document.getElementById('btn-open-npc-phone').onclick = () => this.openNpcPhone(npc);
        document.getElementById('btn-edit-npc-interactions').onclick = () => {
            document.getElementById('npc-interaction-editor').classList.toggle('hidden');
            this.renderNpcInteractionTags(npc);
        };
        document.getElementById('btn-add-npc-interaction').onclick = () => {
            const newAct = document.getElementById('new-npc-interaction').value.trim();
            if (newAct) {
                npc.interactions.push(newAct);
                this.renderNpcInteractionTags(npc);
                document.getElementById('new-npc-interaction').value = '';
            }
        };
    },
    renderNpcInteractionTags(npc) {
        const container = document.getElementById('npc-interaction-tags');
        container.innerHTML = npc.interactions.map(act => `
            <span class="tag">${act} <span class="remove-tag" data-action="${act}"><i class="fas fa-times"></i></span></span>
        `).join('');
        container.querySelectorAll('.remove-tag').forEach(el => {
            el.addEventListener('click', () => {
                const action = el.dataset.action;
                npc.interactions = npc.interactions.filter(a => a !== action);
                this.renderNpcInteractionTags(npc);
            });
        });
    },
    openNpcPhone(npc) {
        GameSystems.generatePhoneContent(npc);
        const content = document.getElementById('modal-content');
        content.innerHTML = `
            <h3><i class="fas fa-mobile-alt"></i> ${npc.name}的手机</h3>
            <div class="phone-apps">${npc.phoneContent.apps.map(app => `<span class="tag phone-app" data-app="${app}">${app}</span>`).join('')}</div>
            <div id="phone-app-content" class="phone-app-content"></div>
        `;
        document.querySelectorAll('.phone-app').forEach(appEl => {
            appEl.addEventListener('click', () => {
                document.getElementById('phone-app-content').innerHTML = `<p>这是${appEl.dataset.app}的内容（AI生成）</p>`;
            });
        });
    },
    renderLifeLog() {
        const g = AppState.gameInstance;
        const list = document.getElementById('life-log-list');
        list.innerHTML = g.lifeLog.slice(0,20).map(log => `<div class="log-entry"><small>${log.time}</small> ${log.text}</div>`).join('');
    },
    renderLocations() {
        const g = AppState.gameInstance;
        const list = document.getElementById('location-list');
        list.innerHTML = g.locations.map(loc => `
            <div class="location-item" data-loc-id="${loc.id}">
                <strong>${loc.name}</strong> <span class="text-dim">${loc.npcIds?.length||0}人</span>
            </div>
        `).join('');
        list.querySelectorAll('.location-item').forEach(el => {
            el.addEventListener('click', () => {
                const locId = el.dataset.locId;
                const loc = g.locations.find(l => l.id == locId);
                if (loc) {
                    const npcsHere = g.npcs.filter(n => loc.npcIds?.includes(n.id));
                    UI.showToast(`${loc.name}：${npcsHere.map(n=>n.name).join(',') || '空无一人'}`);
                }
            });
        });
        // 地图标记渲染
        this.renderMapMarkers();
    },
    renderMapMarkers() {
        const g = AppState.gameInstance;
        const container = document.getElementById('map-markers');
        container.innerHTML = g.locations.map(loc => `
            <div class="map-marker" style="left:${loc.x||50}%; top:${loc.y||50}%;" data-loc-id="${loc.id}" title="${loc.name}"></div>
        `).join('');
        container.querySelectorAll('.map-marker').forEach(marker => {
            marker.addEventListener('click', (e) => {
                e.stopPropagation();
                const locId = marker.dataset.locId;
                UI.showToast(`地点：${g.locations.find(l=>l.id==locId)?.name}`);
            });
        });
    },
    renderSaveSlots() {
        const saves = SaveManager.getAllSaves();
        const container = document.getElementById('save-slots');
        container.innerHTML = Object.keys(saves).map(key => `
            <div class="save-slot">
                <span>${key} (${new Date(saves[key].timestamp).toLocaleString()})</span>
                <button class="btn-sm btn-outline load-save" data-slot="${key}">读取</button>
                <button class="btn-sm btn-outline delete-save" data-slot="${key}">删除</button>
            </div>
        `).join('');
        container.querySelectorAll('.load-save').forEach(btn => {
            btn.addEventListener('click', () => {
                const slot = btn.dataset.slot;
                if (SaveManager.loadGame(slot)) {
                    UI.showPage('game');
                    UI.refreshGameUI();
                }
            });
        });
        container.querySelectorAll('.delete-save').forEach(btn => {
            btn.addEventListener('click', () => {
                SaveManager.deleteSave(btn.dataset.slot);
                this.renderSaveSlots();
            });
        });
    },
    renderFestivalTags() {
        const container = document.getElementById('festival-tags');
        container.innerHTML = AppState.festivalList.map((f, idx) => {
            const [name, interval] = f.split(',');
            return `<span class="tag">${name} (每${interval}天) <span class="remove-tag" data-index="${idx}"><i class="fas fa-times"></i></span></span>`;
        }).join('');
        container.querySelectorAll('.remove-tag').forEach(el => {
            el.addEventListener('click', () => {
                const idx = parseInt(el.dataset.index);
                AppState.festivalList.splice(idx, 1);
                localStorage.setItem('festivalList', JSON.stringify(AppState.festivalList));
                this.renderFestivalTags();
            });
        });
    },
    loadApiFields() {
        const config = APIManager.getConfig();
        document.getElementById('api-endpoint').value = config.endpoint || '';
        document.getElementById('api-key').value = config.key || '';
        document.getElementById('api-model').value = config.model || '';
        document.getElementById('api-temperature').value = config.temperature;
        document.getElementById('temperature-value').textContent = config.temperature;
        document.getElementById('api-max-tokens').value = config.maxTokens;
    },
    showToast(msg) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast'; toast.textContent = msg;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
};
